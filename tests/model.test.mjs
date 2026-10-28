import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, parseBackup, makeBackup, summarize, JournalStore, MAX_BYTES, MAX_ENTRIES, searchEntries } from '../src/model.mjs';
const id = '303094f1-de11-4f10-9fc3-79e1d538c678';
const id2 = '403094f1-de11-4f10-9fc3-79e1d538c678';
const now = '2026-10-27T10:00:00.000Z';
const thought = (extra = {}) => ({ id, type:'thought', date:'2026-10-27', createdAt:now, updatedAt:now, situation:'A short work presentation', emotion:'Worried', before:70, thought:'I will forget everything.', evidenceFor:'I lost my place once.', evidenceAgainst:'I prepared and can use notes.', balanced:'I can pause and use my notes.', after:45, ...extra });
const action = (extra={}) => ({id:id2,type:'action',date:'2026-10-27',createdAt:now,updatedAt:now,activity:'Walk around the block',when:'After lunch',prediction:'A short break may help.',outcome:'',before:50,after:null,...extra});
const memory = () => {const items = new Map(); return {getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)};};
test('a thought record retains user text and optional re-rating', () => {
 assert.deepEqual(validateEntry(thought()), thought());
 assert.equal(validateEntry(thought({after:null})).after,null);
});
test('records reject malformed fields, dates and ratings',()=>{
 for(const extra of [{before:-1},{after:101},{before:NaN},{date:'2026-02-30'},{id:'bad'},{type:'assessment'},{thought:''},{situation:'x'.repeat(2001)},{createdAt:'today'},{updatedAt:'2026-10-26T00:00:00.000Z'},{extra:'unsupported'}]) assert.throws(()=>validateEntry(thought(extra)));
 assert.throws(()=>validateEntry(null));
 assert.throws(()=>validateEntry({...thought(),after:undefined}));
});
test('planned and completed actions are distinct',()=>{
 assert.equal(validateEntry(action()).after,null);
 assert.equal(validateEntry(action({outcome:'I went outside.',after:60})).after,60);
 assert.throws(()=>validateEntry(action({after:40})));
 assert.throws(()=>validateEntry(action({activity:''})));
});
test('backup round trip preserves content including markup as data',()=>{
 const entry=thought({situation:'<img src=x onerror=alert(1)>'});
 const backup=makeBackup([entry,action()]);
 assert.deepEqual(parseBackup(backup),[entry,action()]);
 assert.equal(JSON.parse(backup).format,'room-to-think');
});
test('backup rejects invalid schema, duplicates, oversized and too many records',()=>{
 for(const data of ['{','[]','{}',JSON.stringify({format:'room-to-think',version:2,entries:[]}),makeBackup([thought()]).replace('room-to-think','other')]) assert.throws(()=>parseBackup(data));
 assert.throws(()=>makeBackup([thought(),thought()]));
 assert.throws(()=>parseBackup(' '.repeat(MAX_BYTES+1)));
 assert.throws(()=>makeBackup(Array.from({length:MAX_ENTRIES+1},()=>thought())));
 const bad=JSON.parse(makeBackup([])); bad.entries={}; assert.throws(()=>parseBackup(JSON.stringify(bad)));
});
test('summary includes only paired ratings and shows increases honestly',()=>{
 const summary=summarize([thought(),thought({id:id2,date:'2026-10-26',after:100}),action({id:'503094f1-de11-4f10-9fc3-79e1d538c678'})]);
 assert.equal(summary.total,3); assert.equal(summary.thoughts,2);assert.equal(summary.actions,1);
 assert.equal(summary.paired,2); assert.equal(summary.averageChange,-2.5);
 assert.equal(summary.completedActions,0);
 assert.deepEqual(summarize([]),{total:0,thoughts:0,actions:0,completedActions:0,paired:0,averageChange:null,days:[]});
});
test('journal create, edit, reload, delete and replace are persisted',()=>{
 const storage=memory();const store=new JournalStore(storage);
 store.upsert(thought()); store.upsert(thought({balanced:'A new view.'}));
 assert.equal(store.entries.length,1); assert.equal(new JournalStore(storage).entries[0].balanced,'A new view.');
 const copy=store.entries; copy[0].balanced='mutation'; assert.equal(store.entries[0].balanced,'A new view.');
 store.replace([action()]); assert.equal(store.entries[0].type,'action');
 store.remove(id2); assert.equal(new JournalStore(storage).entries.length,0);
 store.upsert(thought());store.clear();assert.equal(new JournalStore(storage).entries.length,0);
});
test('storage failures and malformed saved data never silently overwrite data',()=>{
 const storage=memory();const store=new JournalStore(storage);store.upsert(thought());
 const broken={...storage,setItem:()=>{throw Error('quota');}};
 const read=new JournalStore(broken);assert.throws(()=>read.upsert(action()),/save/i);assert.equal(read.entries.length,1);
 storage.setItem('room-to-think.v1','broken');assert.throws(()=>new JournalStore(storage),/backup|stored/i);
 assert.equal(storage.getItem('room-to-think.v1'),'broken');
 assert.throws(()=>new JournalStore({getItem:()=>{throw Error('blocked');}}),/storage/i);
});
test('a stale browser tab cannot overwrite newer saved work',()=>{
 const storage=memory();const first=new JournalStore(storage);const second=new JournalStore(storage);
 first.upsert(thought());
 assert.throws(()=>second.upsert(action()),/another tab|changed/i);
 assert.equal(new JournalStore(storage).entries[0].type,'thought');
});

test('journal search finds saved text and dates without changing entries',()=>{
 const items=[thought(),action()];
 assert.deepEqual(searchEntries(items,'  PRESENTATION  '),[items[0]]);
 assert.deepEqual(searchEntries(items,'after lunch'),[items[1]]);
 assert.deepEqual(searchEntries(items,'2026-10-27'),items);
 assert.deepEqual(searchEntries(items,'   '),items);
 assert.deepEqual(searchEntries(items,'unmatched'),[]);
 assert.deepEqual(searchEntries(items,'303094f1'),[]);
 assert.deepEqual(searchEntries(items,'<img'),[]);
 assert.deepEqual(items,[thought(),action()]);
});
