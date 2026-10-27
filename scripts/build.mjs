import {mkdir,copyFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=join(root,'dist');
await rm(output,{recursive:true,force:true});await mkdir(join(output,'src'),{recursive:true});
for(const file of ['index.html','src/app.mjs','src/model.mjs','src/styles.css'])await copyFile(join(root,file),join(output,file));
process.stdout.write('Built four public app files in dist/. No journal data is included.\n');
