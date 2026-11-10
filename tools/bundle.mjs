import fs from 'node:fs';
import path from 'node:path';
let html=fs.readFileSync('index.html','utf8');
const modules=[],visited=new Set();
function visit(file){if(visited.has(file))return;visited.add(file);const source=fs.readFileSync(file,'utf8');for(const m of source.matchAll(/^import\s+\{[^}]+\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm))visit(path.posix.normalize(path.posix.join(path.posix.dirname(file),m[1])));modules.push(file);}
visit('src/main.mjs');
const names=['player-level','player-up','player-down','enemy-drone','boss-body','boss-wing','bg-far','bg-near','item-shot','item-shield'];
const art=Object.fromEntries(names.map(n=>[n,'data:image/png;base64,'+fs.readFileSync(`assets/${n}.png`).toString('base64')]));
const loaded=new Set();
const blocks=modules.map(file=>{
 let source=fs.readFileSync(file,'utf8');
 source=source.replace(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm,(_,bindings,relative)=>{
  const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),relative));if(!loaded.has(target))throw Error(`Module order: ${file} needs ${target}`);
  return `const {${bindings.replace(/\b(\w+)\s+as\s+(\w+)/g,'$1:$2')}}=__galdora[${JSON.stringify(target)}];`;
 });
 if(/^import\s/m.test(source))throw Error(`Unsupported import in ${file}`);
 const exports=[...source.matchAll(/\bexport\s+(?:const|let|class|function)\s+(\w+)/g)].map(m=>m[1]);
 source=source.replace(/\bexport\s+(?=const|let|class|function)/g,'');loaded.add(file);
 const asyncModule=file==='src/main.mjs';return `// ${file}\n__galdora[${JSON.stringify(file)}]=${asyncModule?'await ':''}(${asyncModule?'async ':''}()=>{\n${source}\nreturn {${exports.join(',')}};\n})();`;
});
const js='const __galdora={};\n'+blocks.join('\n');
html=html.replace('<script type="module" src="src/main.mjs"></script>',`<script>window.GALDORA_ASSETS=${JSON.stringify(art)};</script><script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`);
fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('GALDORA-pilot.html',html);fs.writeFileSync('docs/index.html',html);
console.log(JSON.stringify({bytes:Buffer.byteLength(html),modules:modules.length,assets:names.length}));
