import { Bol } from './engine.js';
import { generateBaby } from './workbook.js';

const $=id=>document.getElementById(id),el=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
let source=null,plan=[],revision=0,masterJob=0,importJob=0,urls=[],zipBlob=null,sourceUrl=null;
let masterError = '';
const headers=['Suffix','Baby BOL','PRO','Category','Pallets','Packages','Weight (KG)'];
const columns=b=>[b.suffix,b.id,b.pro,b.cat,b.pallets,b.packs,Bol.format(b.grams)];
function message(text,bad=false){$('status').textContent=text;$('status').className=bad?'error':''}
function resetFiles(){revision++;urls.forEach(URL.revokeObjectURL);urls=[];zipBlob=null;$('downloads').replaceChildren();$('zip').hidden=true}
function tableRows(){
 const raw=$('tabletext').value.trim();if(!raw)return [];
 let rows=raw.split(/\r?\n/).filter(x=>x.trim()).map(line=>line.includes('\t')?line.split('\t'):line.includes(',')?line.split(','):line.trim().split(/\s+/));
 if(/^master\s*bill$/i.test(rows[0][0].trim())){
   const keys=rows.shift().map(x=>x.trim().toLowerCase()),idx=['master bill','weight','uq','total packs','category'].map(k=>keys.indexOf(k));
   if(idx.slice(0,4).includes(-1))throw Error('Use the headers Master Bill, Weight, UQ and Total Packs.');
   return rows.map(r=>idx.map(i=>r[i]??''));
 }
 if(/^master\s+bill\s+weight/i.test(rows[0].join(' ')))rows.shift();
 return rows;
}
function balance(){
 const panel=$('balance');panel.replaceChildren();
 for(const c of ['DHL','FDA','UPS','Total']){
  const row=el('div','');row.className='bal';
  const badge=el('span',c);badge.className='cat '+c;
  const total=c==='Total'?source?.sum:source?.counts[c]||0, allocated=plan.filter(b=>c==='Total'||b.cat===c).reduce((s,b)=>s+b.pallets,0);
  row.append(badge,el('span',source?(plan.length?allocated:'—')+' / '+total:'— / —'));panel.append(row);
 }
}
function render(){
 resetFiles();plan=[];$('preview').replaceChildren();$('generate').disabled=true;$('copy').hidden=true;
 $('mid').textContent=source?'BOL '+source.id:'Awaiting master BOL';$('palletcount').textContent=source?.sum??'—';$('babycount').textContent='—';balance();
 if (masterError) {
   message(masterError, true);
   return;
 }
 try{
   const rows=tableRows();$('babycount').textContent=rows.length||'—';
   if(!source||!rows.length){
     message(!source&&!rows.length?'Upload a master workbook and add the weight table to preview the split.':
       !source?'Upload a master workbook to calculate the split.':'Add the weight table to calculate the split.');
     return;
   }
   plan=Bol.allocate(source,rows);balance();
   const table=el('table',''),head=table.createTHead().insertRow();
   headers.forEach(h=>head.append(el('th',h)));const body=table.createTBody();
   for(const b of plan){const tr=body.insertRow();columns(b).forEach((v,i)=>{const td=tr.insertCell();if(i===3){const cat=el('span',v);cat.className='cat '+v;td.append(cat)}else td.textContent=v})}
   const wrap=el('div','');wrap.className='scroll';wrap.append(table);$('preview').append(wrap);
   const grams=plan.reduce((a,b)=>a+b.grams,0),packs=plan.reduce((a,b)=>a+b.packs,0),wd=grams-Bol.kg(source.sums.w.v),pd=packs-Number(source.sums.q.v);
   const signed=(v,format)=> (v>0?'+':'')+format(v);
   if(wd||pd){const note=el('p','Weight table: '+Bol.format(grams)+' KG, '+packs+' packs. Difference from master: '+signed(wd,Bol.format)+' KG, '+signed(pd,String)+' packs. Each baby uses its supplied values.');note.className='note';$('preview').append(note)}
   const ready=$('ocrreview').hidden||$('confirmed').checked;
   message(ready?'All '+source.sum+' pallets allocated. Files will use the master’s .'+source.ext+' format.':'Check the extracted rows against the screenshot before generating files.');
   $('copy').hidden=false;$('generate').disabled=!ready;
 }catch(e){message(e.message,true)}
}
async function readMaster(file){
 const job=++masterJob;source=null;masterError='';render();$('filename').textContent=file.name;$('fileinfo').textContent='Reading workbook…';
 try{const m=Bol.master(await file.arrayBuffer());if(job!==masterJob)return;source=m;$('fileinfo').textContent=m.sum+' pallets · '+Object.keys(m.counts).join(' / ')+' · Click to replace';render()}
 catch(e){
   if(job!==masterJob)return;
   masterError='Could not read the master workbook. '+e.message;
   $('fileinfo').textContent=masterError;
   render();
 }
}
$('master').onchange=e=>{if(e.target.files[0])readMaster(e.target.files[0]);e.target.value=''};
$('drop').ondragover=e=>e.preventDefault();$('drop').ondrop=e=>{e.preventDefault();if(e.dataTransfer.files[0])readMaster(e.dataTransfer.files[0])};
function clearImage(){if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl=null;$('sourceImage').removeAttribute('src');$('ocrreview').hidden=true;$('confirmed').checked=false}
function tab(upload){$('importArea').hidden=!upload;$('pasteTab').setAttribute('aria-pressed',!upload);$('importTab').setAttribute('aria-pressed',upload)}
$('pasteTab').onclick=()=>{tab(false);$('tabletext').focus()};$('importTab').onclick=()=>tab(true);
$('confirmed').onchange=render;$('tabletext').oninput=()=>{importJob++;$('confirmed').checked=false;render()};
$('tablefile').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;e.target.value='';const job=++importJob;clearImage();$('tabletext').value='';render();
 let worker;
 try{
  let text;
  if(file.type.startsWith('image/')||/\.(png|jpg|jpeg|webp|bmp)$/i.test(file.name)){
   sourceUrl=URL.createObjectURL(file);$('sourceImage').src=sourceUrl;$('ocrreview').hidden=false;message('Reading screenshot…');
   const base=new URL('vendor/',document.baseURI).href;
   worker=await Tesseract.createWorker('eng',1,{workerPath:base+'worker.min.js',corePath:base+'tesseract-core-lstm.wasm.js',langPath:base,workerBlobURL:false});
   await worker.setParameters({tessedit_pageseg_mode:'6'});const result=await worker.recognize(file);
   text=result.data.text.split(/\r?\n/).map(x=>x.replace(/[|¦]/g,' ').trim()).filter(x=>x&&!/^(master|packs\b|weight\b|total\b)/i.test(x)).join('\n');
  }else if(/\.(xls|xlsx|csv)$/i.test(file.name)){
   const wb=XLSX.read(await file.arrayBuffer(),{type:'array',raw:true});text=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:false,blankrows:false}).map(r=>r.join('\t')).join('\n');
  }else text=await file.text();
  if(job!==importJob)return;$('tabletext').value=text;render();
 }catch(err){if(job===importJob)message('Import failed. '+err.message+' You can paste or type the table.',true)}finally{if(worker)await worker.terminate()}
};
$('example').onclick=async()=>{const job=++masterJob;++importJob;clearImage();source=null;masterError='';render();try{const res=await fetch('example.xlsx');if(!res.ok)throw Error('Example unavailable.');const m=Bol.master(await res.arrayBuffer());if(job!==masterJob)return;source=m;$('filename').textContent='Example master workbook';$('fileinfo').textContent='8 pallets · DHL / FDA · Click to replace';$('tabletext').value='Master Bill\tWeight\tUQ\tTotal Packs\n'+['A','B','C','D'].map((s,i)=>[m.id+s,['320.000','250.000','280.000','110.000'][i],'KG',[360,300,320,120][i]].join('\t')).join('\n');tab(false);render()}catch(e){message(e.message,true)}};
$('generate').onclick=async()=>{
 const token=revision,m=source,babies=plan.slice();$('generate').disabled=true;
 try{
   const zip=new JSZip(),files=[];
   for(const b of babies){message('Verifying '+b.id+'…');await new Promise(r=>setTimeout(r,0));if(token!==revision)return;const bytes=await generateBaby(m,b),name='alo_bol_from_stage_'+b.id+'.'+m.ext;zip.file(name,bytes);files.push({name,bytes,id:b.id})}
   const blob=await zip.generateAsync({type:'blob'});if(token!==revision)return;
   zipBlob=blob;for(const f of files){const link=el('a',f.id+'.'+m.ext+' ↓');link.download=f.name;link.href=URL.createObjectURL(new Blob([f.bytes]));urls.push(link.href);$('downloads').append(link)}
   $('zip').hidden=false;message(files.length+' Excel files reopened and verified. Download the ZIP or choose an individual baby BOL.');
 }catch(e){if(token===revision){message(e.message,true);$('generate').disabled=false}}
};
$('zip').onclick=()=>{if(!zipBlob)return;const a=document.createElement('a');a.download=source.id+'_baby_BOLs.zip';a.href=URL.createObjectURL(zipBlob);urls.push(a.href);a.click()};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText([headers,...plan.map(columns)].map(r=>r.join('\t')).join('\n'));message('Verification table copied.')}catch{message('Select the verification table and copy it manually.')}};
render();
