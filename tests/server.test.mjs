import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import { createAppServer } from '../scripts/serve.mjs';
const server=createAppServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;
test.after(()=>new Promise(resolve=>server.close(resolve)));
test('server returns only public app files with privacy and content headers',async()=>{
 const response=await fetch(url);assert.equal(response.status,200);assert.match(await response.text(),/Room to Think/);
 assert.match(response.headers.get('content-security-policy'),/connect-src 'none'/);
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(response.headers.get('referrer-policy'),'no-referrer');
 const source=await fetch(`${url}/src/model.mjs`);assert.equal(source.status,200);assert.match(source.headers.get('content-type'),/javascript/);
 const head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
});
test('server rejects hidden files, unknown paths, wrong methods and hostile Host',async()=>{
 for(const path of ['/.git/config','/package.json','/docs/runtime-contract.md','/%2e%2e/package.json','/src/app.mjs/extra','/%E0%A4%A'])assert.equal((await fetch(`${url}${path}`)).status,404);
 assert.equal((await fetch(url,{method:'POST',body:'private text'})).status,405);
 const status=await new Promise((resolve,reject)=>{const req=request(url,{headers:{host:'attacker.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});
 assert.equal(status,403);
});
