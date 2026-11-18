import { Bol } from './engine.js';

// Edit only the target worksheet records. Keep the original container, styles,
// page setup, drawings, merges, other worksheets and document metadata.
function patchBiff(m,edits,hidden){
 const cfb=XLSX.CFB.read(new Uint8Array(m.bytes),{type:'array'});
 const stream=XLSX.CFB.find(cfb,'Workbook')||XLSX.CFB.find(cfb,'Book');
 const src=new Uint8Array(stream.content),view=x=>new DataView(x.buffer,x.byteOffset,x.byteLength);
 const v=view(src),chunks=[],sheetOffsets=new Map(),bounds=[],applied=new Set();
 let targetStart,active=false,size=0;
 function append(x){chunks.push(x);size+=x.length}
 function record(id,payload){const out=new Uint8Array(4+payload.length);view(out).setUint16(0,id,true);view(out).setUint16(2,payload.length,true);out.set(payload,4);return out}
 for(let p=0;p+4<=src.length;){
   const id=v.getUint16(p,true),len=v.getUint16(p+2,true),raw=src.slice(p,p+len+4),sub=raw.subarray(4),s=view(sub);
   if(id===0x85){
     const offset=s.getUint32(0,true);
     if(bounds.length===m.wb.SheetNames.indexOf(m.name))targetStart=offset;
     bounds.push({sub,offset});sheetOffsets.set(offset,0);
   }
   if(sheetOffsets.has(p)){sheetOffsets.set(p,size);active=p===targetStart}
   if(active&&id===0x208&&hidden.has(s.getUint16(0,true)))sub[12]|=0x20;
   if(active&&[0x20b,0xd7].includes(id)){p+=len+4;continue}
   if(active&&[0xfd,0x204,0x203,0x27e,0x201,0x6].includes(id)&&len>=6){
     const key=Bol.addr(s.getUint16(0,true),s.getUint16(2,true));
     if(edits.has(key)){
       const val=edits.get(key),n=typeof val==='number',l=val===null?6:n?14:9+2*val.length,body=new Uint8Array(l),d=view(body);
       body.set(sub.subarray(0,6));if(n)d.setFloat64(6,val,true);
       if(typeof val==='string'){d.setUint16(6,val.length,true);body[8]=1;for(let j=0;j<val.length;j++)d.setUint16(9+2*j,val.charCodeAt(j),true)}
       append(record(val===null?0x201:n?0x203:0x204,body));applied.add(key);p+=len+4;continue;
     }
   }
   append(raw);p+=len+4;
 }
 for(const {sub,offset} of bounds)view(sub).setUint32(0,sheetOffsets.get(offset),true);
 for(const key of edits.keys())if(!applied.has(key))throw Error('Unsupported legacy cell encoding at '+key+'. Save the master as .xlsx and upload it again.');
 const joined=new Uint8Array(size);let off=0;for(const part of chunks){joined.set(part,off);off+=part.length}
 stream.content=joined;stream.size=size;
 return new Uint8Array(XLSX.CFB.write(cfb,{type:'array'}));
}
async function patchXml(m,edits,hidden){
 const zip=await JSZip.loadAsync(m.bytes),xml=async path=>new DOMParser().parseFromString(await zip.file(path).async('string'),'application/xml');
 const workbook=await xml('xl/workbook.xml'),rels=await xml('xl/_rels/workbook.xml.rels');
 const sheet=Array.from(workbook.getElementsByTagNameNS('*','sheet')).find(el=>el.getAttribute('name')===m.name);
 const rid=sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
 const path=Array.from(rels.getElementsByTagNameNS('*','Relationship')).find(el=>el.getAttribute('Id')===rid).getAttribute('Target');
 const full=new URL(path,'https://local/xl/workbook.xml').pathname.slice(1),doc=await xml(full);
 for(const row of doc.getElementsByTagNameNS('*','row'))if(hidden.has(Number(row.getAttribute('r'))-1))row.setAttribute('hidden','1');
 const cells=new Map(Array.from(doc.getElementsByTagNameNS('*','c'),el=>[el.getAttribute('r'),el]));
 for(const [key,val] of edits){
   const cell=cells.get(key);if(!cell)throw Error('Missing source cell '+key);
   while(cell.firstChild)cell.removeChild(cell.firstChild);
   cell.removeAttribute('t');
   function add(parent,tag){const node=doc.createElementNS(cell.namespaceURI,tag);parent.appendChild(node);return node}
   if(typeof val==='number')add(cell,'v').textContent=val;
   if(typeof val==='string'){cell.setAttribute('t','inlineStr');const t=add(add(cell,'is'),'t');t.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');t.textContent=val}
 }
 zip.file(full,new XMLSerializer().serializeToString(doc));return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
}
export async function generateBaby(m,b){
 const edits=Bol.changes(m,b);
 const hidden=new Set(m.lines.filter(line=>edits.get(line.f.p.key)===null).map(line=>line.r));
 const bytes=m.ext==='xls'?patchBiff(m,edits,hidden):await patchXml(m,edits,hidden);
 const wb=XLSX.read(bytes,{type:'array'}),sheet=wb.Sheets[m.name];
 for(const [key,val] of edits)if((sheet[key]?.v??null)!==val)throw Error('Verification failed for '+b.id+' at '+key+'.');
 const check=Bol.master(bytes);
 if(check.id!==b.id||check.proId!==b.pro||check.sum!==b.pallets||check.lines.length!==1||check.lines[0].cat!==b.cat||Bol.kg(check.sums.w.v)!==b.grams||Number(check.sums.q.v)!==b.packs)throw Error('Freight verification failed for '+b.id+'.');
 return bytes;
}
