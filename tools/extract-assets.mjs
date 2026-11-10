// The checked-in standalone page is the canonical prepared PNG asset archive.
import fs from 'node:fs';
const source=fs.existsSync('docs/index.html')?'docs/index.html':'GALDORA-pilot.html';
const html=fs.readFileSync(source,'utf8'),match=html.match(/window\.GALDORA_ASSETS=(\{.*?\});<\/script>/s);if(!match)throw Error('No embedded asset archive');
const assets=JSON.parse(match[1]);fs.mkdirSync('assets',{recursive:true});
for(const [name,url] of Object.entries(assets)){if(!/^[a-z0-9-]+$/.test(name)||!url.startsWith('data:image/png;base64,'))throw Error('Invalid asset');const file=`assets/${name}.png`;if(!fs.existsSync(file))fs.writeFileSync(file,Buffer.from(url.split(',')[1],'base64'));}
console.log(`Prepared ${Object.keys(assets).length} local PNG assets from ${source}`);
