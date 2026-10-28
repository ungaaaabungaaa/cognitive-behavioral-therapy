import { JournalStore, makeBackup, parseBackup, summarize, searchEntries, updateSavedJournal, STORAGE_KEY, MAX_BYTES } from './model.mjs';
const $ = selector => document.querySelector(selector);
const form=$('#entry-form');
form.autocomplete='off';
let store, storageFailure='', currentView='today', editType='thought', editing=null, dirty=false, pendingImport=null;
const today=new Date();
const localDate=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
$('#today-date').textContent=today.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
try { store=new JournalStore(window.localStorage); } catch(error) { storageFailure=error.message; }
const entries=()=>store?.entries??[];
function message(text,error=false) { const status=$('#status');status.textContent=text;status.classList.toggle('error',error);status.hidden=false; }
function node(tag,text,className) { const element=document.createElement(tag);if(text!==undefined)element.textContent=text;if(className)element.className=className;return element; }
function button(text,handler,className='text-button') {const element=node('button',text,className);element.type='button';element.addEventListener('click',handler);return element;}
function showView(view,checkDirty=true) {
 if(checkDirty && dirty){confirmChange('Leave this reflection?','Your unsaved form text will be lost. Your saved entries will stay in the journal.','Discard unsaved text').then(ok=>{if(ok){dirty=false;showView(view,false);}});return false;}
 if(view!=='editor'){try{store=new JournalStore(window.localStorage);storageFailure='';}catch(error){store=undefined;storageFailure=error.message;}}
 currentView=view;
 document.querySelectorAll('main>section').forEach(section=>{section.hidden=section.id!==`view-${view}`;});
 document.querySelectorAll('.nav-button').forEach(nav=>{const active=nav.dataset.view===(view==='editor'?'today':view);nav.classList.toggle('active',active);if(active)nav.setAttribute('aria-current','page');else nav.removeAttribute('aria-current');});
 $('#status').hidden=true;
 render();
 $('#main').focus({preventScroll:true});
 window.scrollTo({top:0,behavior:'instant'});
 if(storageFailure)message(storageFailure,true);
 return true;
}
function confirmChange(title,text,yes) {
 const dialog=$('#confirm-dialog');$('#confirm-title').textContent=title;$('#confirm-message').textContent=text;$('#confirm-yes').textContent=yes;
 return new Promise(resolve=>{dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true});dialog.showModal();});
}
function resetEditor(type,entry=null) {
 form.reset();editing=entry;editType=type;
 $('#thought-fields').hidden=type!=='thought';$('#action-fields').hidden=type!=='action';
 for(const [selector,disabled] of [['#thought-fields',type!=='thought'],['#action-fields',type!=='action']]) $(selector).querySelectorAll('input,textarea').forEach(field=>{field.disabled=disabled;});
 form.elements.date.value=entry?.date??localDate;
 if(entry) {
   for(const [key,value]of Object.entries(entry)) if(form.elements[key] && typeof value==='string') form.elements[key].value=value;
   form.elements[`${type}Before`].value=String(entry.before);form.elements[`${type}After`].value=entry.after===null?'':String(entry.after);
 }
 $('#editor-heading').textContent=type==='thought'?'One thought at a time.':'One small, manageable step.';
 $('#editor-kicker').textContent=entry?'REVISIT A REFLECTION':type==='thought'?'A THOUGHT RECORD':'A SMALL-ACTION PLAN';
 $('#save-entry').textContent=entry?'Save changes':'Save reflection';
 dirty=false;
}
async function openEditor(type,entry=null) {
 if(dirty && !await confirmChange('Leave this reflection?','Your unsaved form text will be lost.','Discard unsaved text')) return;
 dirty=false;resetEditor(type,entry);showView('editor',false);
 if(!store)message(storageFailure,true);
}
form.addEventListener('input',()=>{dirty=true;});
form.addEventListener('submit',event=>{
 event.preventDefault();if(!store){message(storageFailure,true);return;}
 if(!form.reportValidity())return;
 const data=new FormData(form);const now=new Date().toISOString();
 const after=data.get(`${editType}After`).trim();
 const entry={id:editing?.id??crypto.randomUUID(),type:editType,date:data.get('date'),createdAt:editing?.createdAt??now,updatedAt:now,before:Number(data.get(`${editType}Before`)),after:after===''?null:Number(after)};
 const keys=editType==='thought'?['situation','emotion','thought','evidenceFor','evidenceAgainst','balanced']:['activity','when','prediction','outcome'];
 for(const key of keys)entry[key]=data.get(key).trim();
 try {store.upsert(entry);dirty=false;showView('journal',false);message('Reflection saved in this browser.');}catch(error){message(error.message,true);}
});
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY||event.key===null){if(dirty||currentView==='editor'){message('Journal changed in another tab. Copy any unsaved text, then reload before saving.',true);}else{try{store=new JournalStore(window.localStorage);storageFailure='';render();message('Journal refreshed after a change in another tab.');}catch(error){store=undefined;storageFailure=error.message;render();message(storageFailure,true);}}}});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
function entryCard(entry,compact=false) {
 const article=node('article',undefined,'journal-entry');
 const meta=node('div',undefined,'entry-meta');meta.append(node('span',entry.type==='thought'?'THOUGHT RECORD':'SMALL ACTION'),node('time',formatDate(entry.date)));article.append(meta);
 article.append(node('h3',entry.type==='thought'?entry.situation:entry.activity));
 article.append(node('p',entry.type==='thought'?entry.balanced:entry.outcome||`Planned: ${entry.when}`,'entry-preview'));
 const rating=entry.after===null?`Feeling before: ${entry.before}/100 · No later rating`:`Feeling: ${entry.before} → ${entry.after} out of 100`;
 article.append(node('p',rating,'entry-rating'));
 const actions=node('div',undefined,'entry-actions');
 if(!compact){
  const detail=node('div',undefined,'entry-details');detail.hidden=true;
  const list=node('dl');
  const fields=entry.type==='thought'?[['Feeling','emotion'],['Automatic thought','thought'],['Evidence for','evidenceFor'],['Evidence against / another view','evidenceAgainst']]:[['When / where','when'],['Expected outcome','prediction']];
  for(const[label,key]of fields)list.append(node('dt',label),node('dd',entry[key]));
  detail.append(list);article.append(detail);
  const toggle=button('Read full entry',()=>{detail.hidden=!detail.hidden;toggle.textContent=detail.hidden?'Read full entry':'Close entry';toggle.setAttribute('aria-expanded',String(!detail.hidden));});toggle.setAttribute('aria-expanded','false');actions.append(toggle);
 }
 actions.append(button(compact?'Revisit reflection':'Edit entry',()=>openEditor(entry.type,entry)));
 if(!compact)actions.append(button('Delete',async()=>{if(await confirmChange('Delete this entry?','This removes the entry from this browser. Downloaded backups are unaffected.','Delete entry')){try{store.remove(entry.id);render();message('Entry deleted.');}catch(error){message(error.message,true);}}},'text-button entry-delete'));
 article.append(actions);return article;
}
function formatDate(value) {return new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});}
function render() {
 const all=entries().sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt.localeCompare(a.updatedAt));
 $('#nav-count').textContent=String(all.length);
 $('#save-entry').disabled=!store;
 const recent=$('#recent-entry');recent.replaceChildren(all.length?entryCard(all[0],true):node('p','Your journal starts with a single reflection. Nothing is saved yet.','empty'));
 const filter=$('#journal-filter').value;const shown=searchEntries(all.filter(entry=>filter==='all'||entry.type===filter),$('#journal-search').value);$('#journal-results').textContent=`${shown.length} of ${all.length} entries shown.`;const list=$('#journal-list');list.replaceChildren(...shown.map(entry=>entryCard(entry)));
 if(!shown.length)list.append(node('p',all.length?'No entries match your search and type filter.':'No entries yet. Start a thought record or plan a small action.','empty'));
 renderProgress(all);
 $('#export-data').disabled=!store;
 $('#export-raw').hidden=!storageFailure;
}
function renderProgress(all) {
 const target=$('#progress-content');target.replaceChildren();
 if(!all.length){target.append(node('p','Your reflections will appear here after you save an entry. There is no target or streak to maintain.','empty'));return;}
 const summary=summarize(all);const stats=node('div',undefined,'stat-grid');
 for(const[label,value,note]of [['Reflections saved',summary.total,`${summary.thoughts} thought records`],['Small actions tried',summary.completedActions,`${summary.actions} planned or tried`],['Days with an entry',summary.days.length,'No streak or daily target']]){const item=node('div',undefined,'stat');item.append(node('span',label),node('strong',String(value)),node('span',note));stats.append(item);}
 target.append(stats);
 target.append(node('h2','Your feeling ratings'));
 const change=summary.averageChange;
 const explanation=change===null?'No paired ratings yet. A later rating is optional.':`Across ${summary.paired} entries with two ratings, the later rating was ${change===0?'the same on average':`${Math.abs(change).toFixed(1)} points ${change>0?'lower':'higher'} on average`}. Different feelings and situations are mixed, so this is only a description of your entries.`;
 target.append(node('p',explanation,'progress-note'));
 const table=node('table',undefined,'progress-table');const head=node('thead');const row=node('tr');for(const label of ['Date','Exercise','Before','Later'])row.append(node('th',label));head.append(row);table.append(head);
 const body=node('tbody');for(const entry of all.filter(item=>item.after!==null).slice(0,20)){const tr=node('tr');for(const text of [formatDate(entry.date),entry.type==='thought'?'Thought record':'Small action',`${entry.before}/100`,`${entry.after}/100`])tr.append(node('td',text));body.append(tr);}table.append(body);if(summary.paired)target.append(table);
 target.append(node('h2','Recent journal activity'));
 const days=summary.days.slice(-14);const max=Math.max(...days.map(day=>day.count));for(const day of days){const lane=node('div',undefined,'activity-row');const track=node('div',undefined,'activity-track');const fill=node('div',undefined,'activity-fill');fill.style.width=`${day.count/max*100}%`;track.append(fill);track.setAttribute('aria-hidden','true');lane.append(node('span',formatDate(day.date)),track,node('span',String(day.count)));target.append(lane);}
 target.append(node('p','Last 14 dates with an entry. Blank dates are omitted. Counts show writing activity, not wellbeing.','progress-note'));
}
function download(text,name) {
 const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('#export-data').addEventListener('click',()=>{try{download(makeBackup(entries()),`room-to-think-${localDate}.json`);message('Backup downloaded. It contains unencrypted journal text.');}catch(error){message(error.message,true);}});
$('#export-raw').addEventListener('click',()=>{try{const raw=window.localStorage.getItem(STORAGE_KEY);if(raw===null)throw Error('No saved data is available.');download(raw,`room-to-think-recovery-${localDate}.json`);message('Saved data downloaded without changes. Keep it before resetting.');}catch(error){message(error.message,true);}});
$('#import-file').addEventListener('change',async event=>{
 pendingImport=null;$('#import-preview').hidden=true;
 const file=event.target.files[0];if(!file)return;
 try{if(file.size>MAX_BYTES)throw Error('Choose a backup smaller than 1 MiB.');pendingImport=parseBackup(await file.text());$('#import-summary').textContent=`This backup contains ${pendingImport.length} entries. Your ${entries().length} current entries will be replaced.`;$('#import-preview').hidden=false;message('Backup checked. Nothing has been changed yet.');}catch(error){message(error.message,true);}
});
$('#confirm-import').addEventListener('click',async()=>{
 if(pendingImport===null)return;
 let expectedRaw;try{expectedRaw=window.localStorage.getItem(STORAGE_KEY);}catch{message('Could not read browser storage before replacement.',true);return;}
 if(!await confirmChange('Replace this journal?',`Replace the current journal with ${pendingImport.length} entries? Export the current journal first if you want to keep it.`,'Replace journal'))return;
 try{updateSavedJournal(window.localStorage,expectedRaw,pendingImport);store=new JournalStore(window.localStorage);storageFailure='';pendingImport=null;$('#import-preview').hidden=true;$('#import-file').value='';render();message('Backup restored in this browser.');}catch(error){message(error.message,true);}
});
$('#cancel-import').addEventListener('click',()=>{pendingImport=null;$('#import-file').value='';$('#import-preview').hidden=true;});
$('#clear-data').addEventListener('click',async()=>{let expectedRaw;try{expectedRaw=window.localStorage.getItem(STORAGE_KEY);}catch{message('Could not read browser storage before deletion.',true);return;}if(!await confirmChange('Delete all saved entries?','This permanently removes this journal from this browser. It cannot be undone here. Downloaded backups are unaffected.','Delete all entries'))return;try{updateSavedJournal(window.localStorage,expectedRaw,null);store=new JournalStore(window.localStorage);storageFailure='';pendingImport=null;$('#import-preview').hidden=true;render();message('Saved entries deleted from this browser.');}catch(error){message(error.message,true);}});
for(const nav of document.querySelectorAll('[data-view]'))nav.addEventListener('click',()=>showView(nav.dataset.view));
$('.brand').addEventListener('click',event=>{event.preventDefault();showView('today');});
$('#start-thought').addEventListener('click',()=>openEditor('thought'));
$('#journal-new').addEventListener('click',()=>openEditor('thought'));
$('#start-action').addEventListener('click',()=>openEditor('action'));
$('#back-editor').addEventListener('click',()=>showView('today'));
$('#cancel-edit').addEventListener('click',()=>showView('today'));
$('#journal-filter').addEventListener('change',render);
$('#journal-search').addEventListener('input',render);
showView('today',false);
