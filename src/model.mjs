export const MAX_BYTES = 1024 * 1024;
export const MAX_ENTRIES = 200;
export const STORAGE_KEY = 'room-to-think.v1';
const base = ['id','type','date','createdAt','updatedAt','before','after'];
const textKeys = {
  thought: ['situation','emotion','thought','evidenceFor','evidenceAgainst','balanced'],
  action: ['activity','when','prediction','outcome']
};
const bytes = value => new TextEncoder().encode(value).byteLength;
const plain = value => value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const fail = message => { throw new Error(message); };
function timestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
export function validateEntry(input) {
  if (!plain(input) || !Object.hasOwn(textKeys, input.type)) fail('Unknown journal entry type.');
  const keys = [...base, ...textKeys[input.type]];
  if (Object.keys(input).some(key => !keys.includes(key)) || keys.some(key => !Object.hasOwn(input,key))) fail('Entry fields do not match this version.');
  if (typeof input.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id)) fail('Entry ID is invalid.');
  if (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !timestamp(`${input.date}T00:00:00.000Z`)) fail('Choose a valid calendar date.');
  if (!timestamp(input.createdAt) || !timestamp(input.updatedAt) || input.updatedAt < input.createdAt) fail('Entry timestamps are invalid.');
  if (!Number.isInteger(input.before) || input.before < 0 || input.before > 100 || (input.after !== null && (!Number.isInteger(input.after) || input.after < 0 || input.after > 100))) fail('Ratings must be whole numbers from 0 to 100.');
  for (const key of textKeys[input.type]) {
    if (typeof input[key] !== 'string' || input[key].length > 2000 || (key !== 'outcome' && input[key].trim().length === 0)) fail('Complete each text field, with at most 2000 characters per field.');
  }
  if (input.type === 'action' && ((input.after === null) !== (input.outcome.trim().length === 0))) fail('A completed action needs an outcome and a later rating. Leave both empty for a plan.');
  return Object.fromEntries(keys.map(key => [key,input[key]]));
}
function validateEntries(input) {
  if (!Array.isArray(input) || input.length > MAX_ENTRIES) fail(`A journal can contain at most ${MAX_ENTRIES} entries.`);
  const entries = input.map(validateEntry);
  if (new Set(entries.map(entry => entry.id)).size !== entries.length) fail('The backup contains duplicate entry IDs.');
  return entries;
}
export function makeBackup(input) {
  const entries = validateEntries(input);
  const json = JSON.stringify({format:'room-to-think',version:1,entries},null,2);
  if (bytes(json) > MAX_BYTES) fail('This journal exceeds the 1 MiB backup limit. Export fewer entries.');
  return json;
}
export function parseBackup(text) {
  if (typeof text !== 'string' || bytes(text) > MAX_BYTES) fail('Choose a JSON backup smaller than 1 MiB.');
  let value;
  try { value=JSON.parse(text); } catch { fail('The backup is not valid JSON.'); }
  if (!plain(value) || value.format !== 'room-to-think' || value.version !== 1 || Object.keys(value).sort().join(',') !== 'entries,format,version') fail('This is not a supported Room to Think backup.');
  return validateEntries(value.entries);
}
export function searchEntries(entries, query) {
  const term=query.trim().toLocaleLowerCase();
  if (!term) return entries.slice();
  return entries.filter(entry=>[entry.date,...textKeys[entry.type].map(key=>entry[key])].some(value=>value.toLocaleLowerCase().includes(term)));
}
export function summarize(entries) {
  const thoughts=entries.filter(entry=>entry.type==='thought');
  const actions=entries.filter(entry=>entry.type==='action');
  const paired=entries.filter(entry=>entry.after!==null);
  const days=[...new Set(entries.map(entry=>entry.date))].sort().map(date=>({date,count:entries.filter(entry=>entry.date===date).length}));
  return {total:entries.length,thoughts:thoughts.length,actions:actions.length,completedActions:actions.filter(entry=>entry.after!==null).length,paired:paired.length,averageChange:paired.length?paired.reduce((sum,entry)=>sum+entry.before-entry.after,0)/paired.length:null,days};
}
export class JournalStore {
  #entries=[];
  #storage;
  #lastRaw=null;
  constructor(storage) {
    this.#storage=storage;
    let saved;
    try { saved=storage.getItem(STORAGE_KEY); } catch { fail('Browser storage is unavailable. Your journal cannot be saved here.'); }
    this.#lastRaw=saved;
    if (saved !== null) {
      try { this.#entries=parseBackup(saved); } catch { fail('Stored journal could not be read. Do not save over it. Export it from Data & privacy before resetting.'); }
    }
  }
  get entries() { return this.#entries.map(entry=>({...entry})); }
  replace(entries) {
    const json=makeBackup(entries);
    let current;
    try { current=this.#storage.getItem(STORAGE_KEY); } catch { fail('Could not read browser storage before saving.'); }
    if(current!==this.#lastRaw) fail('Journal changed in another tab. Copy any unsaved text, then reload before saving.');
    try { this.#storage.setItem(STORAGE_KEY,json); } catch { fail('Could not save. Browser storage may be full or blocked. Your previous journal remains unchanged.'); }
    this.#entries=parseBackup(json);
    this.#lastRaw=json;
  }
  upsert(input) {
    const entry=validateEntry(input);
    const found=this.#entries.some(item=>item.id===entry.id);
    this.replace(found?this.#entries.map(item=>item.id===entry.id?entry:item):[...this.#entries,entry]);
  }
  remove(id) { this.replace(this.#entries.filter(entry=>entry.id!==id)); }
  clear() { this.replace([]); }
}
