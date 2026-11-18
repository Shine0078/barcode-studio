export const Bol = (() => {
 const fail = message => {throw Error(message)};
 const addr = (r,c) => XLSX.utils.encode_cell({r,c});
 const entries = sheet => Object.keys(sheet).filter(k=>/^[A-Z]+\d+$/.test(k) && sheet[k].v != null && sheet[k].v !== '').map(k=>({key:k,...XLSX.utils.decode_cell(k),v:sheet[k].v,text:String(sheet[k].v).trim()}));
 const weightPattern = /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,3}))?(?:\s*(KG))?$/i;
 const kg = value => {
   const match = String(value).trim().match(weightPattern);
   if (!match) fail('Weight must be in KG with up to three decimal places: '+value);
   return Number(match[1].replaceAll(',', '')) * 1000 + Number((match[2] || '').padEnd(3, '0'));
 };
 const format = grams => (grams/1000).toFixed(3);
 function master(bytes){
   const wb=XLSX.read(bytes,{type:'array'}), sheets=wb.SheetNames.map(name=>({name,cells:entries(wb.Sheets[name])})).filter(s=>s.cells.some(x=>/^bill of lading number\s*:/i.test(x.text)));
   if(sheets.length!==1) fail('Expected one sheet with a Bill of Lading Number. Found '+sheets.length+'.');
   const {name,cells}=sheets[0], find=re=>cells.find(x=>re.test(x.text));
   const bol=find(/^bill of lading number\s*:/i),pro=find(/^pro number\s*:/i), id=bol.text.split(':').pop().trim();
   if(!id||!pro||!pro.text.endsWith(id)) fail('Check the master BOL and PRO labels and identifiers.');
   const start=find(/^carrier information$/i);
   const total=cells.find(x=>x.r>(start?.r??-1)&&/^grand total$/i.test(x.text)&&cells.some(y=>y.r===x.r&&/^pallets?$/i.test(y.text)));
   if(!total) fail('Cannot locate the freight GRAND TOTAL row with pallet units.');
   const row=r=>cells.filter(x=>x.r===r).sort((a,b)=>a.c-b.c);
   function fields(r){
     const line=row(r),pal=line.find(x=>/^pallets?$/i.test(x.text)),pk=line.find(x=>/^(pkgs|packages)$/i.test(x.text));
     const before=x=>x&&line.filter(y=>y.c<x.c).at(-1);
     const weight = line.find(x => weightPattern.exec(x.text)?.[3]) ||
       line.find(x => pk && x.c > pk.c && typeof x.v === 'number');
     if(!before(pal)||!before(pk)||!weight)fail('Check pallet, package, and weight fields on row '+(r+1)+'.');
     return {p:before(pal),q:before(pk),w:weight};
   }
   const sums=fields(total.r), lines=[],counts={};
   const descHead=find(/^commodity description/i);
   if(!descHead)fail('Commodity description header is missing.');
   for(let r=Math.max(start?.r||0,descHead.r)+1;r<total.r;r++){
     const line=row(r),desc=line.find(x=>x.c===descHead.c);
     if(!line.some(x=>/^pallets?$/i.test(x.text))&&!line.some(x=>x.c===sums.p.c&&typeof x.v==='number'))continue;
     const f=fields(r),n=Number(f.p.v);
     const cats=desc?.text.toUpperCase().match(/\b(DHL|FDA|UPS)\b/g)||[];
     if(cats.length!==1||!Number.isSafeInteger(n)||n<0)fail('Review row '+(r+1)+': '+(desc?.text||'missing commodity description')+' ('+f.p.text+' pallets).');
     if(!n)continue;
     lines.push({r,cat:cats[0],f,line});counts[cats[0]]=(counts[cats[0]]||0)+n;
   }
   const sum=Object.values(counts).reduce((a,b)=>a+b,0);
   if(!sum||sum!==Number(sums.p.v))fail('Freight lines total '+sum+' pallets. GRAND TOTAL on row '+(total.r+1)+' is '+sums.p.text+' (difference '+(sum-Number(sums.p.v))+').');
   const proId=pro.text.split(':').pop().trim();
   return {bytes,name,wb,id,bol,pro,proId,lines,counts,sums,sum,ext:new Uint8Array(bytes)[0]===0xd0?'xls':'xlsx'};
 }
 function allocate(m,rows){
   if(!rows.length)fail('Add at least one weight-table row.');
   const cats=Object.keys(m.counts),seen=new Set();
   const data=rows.map(([raw,w,u,p,map],i)=>{
     const id=String(raw||'').trim(),suffix=id.slice(m.id.length),prefix='Weight row '+(i+1)+': ';
     if(!id.startsWith(m.id)||!(/^[A-Z]+$/.test(suffix)))fail(prefix+'expected '+m.id+' followed by a letter suffix.');
     if(seen.has(id))fail(prefix+'duplicate baby '+id+'.');seen.add(id);
     if(String(u).trim().toUpperCase()!=='KG')fail(prefix+'unit must be KG.');
     const grams=kg(w),packs=Number(p),cat=String(map||'').trim().toUpperCase();
     if(!Number.isSafeInteger(grams)||grams<=0||!/^\d+$/.test(String(p).trim())||!Number.isSafeInteger(packs))fail(prefix+'enter a positive weight and whole-number package count.');
     if(cat&&!cats.includes(cat))fail(prefix+cat+' is absent from this master.');
     return {id,suffix,grams,packs,cat,pro:m.proId+suffix};
   }).sort((a,b)=>a.suffix.localeCompare(b.suffix));
   const min=cats.reduce((s,c)=>s+Math.ceil(m.counts[c]/4),0);
   if(data.length<min||data.length>m.sum)fail('This master needs '+min+' to '+m.sum+' suffixes. Received '+data.length+'. '+(data.length<min?'Missing '+(min-data.length)+' for the four-pallet limit.':'Each baby needs at least one pallet.'));
   let best,rank;
   function search(i,left,slots){
     if(i===cats.length){
       if(left)return;
       const score=cats.reduce((s,c)=>s+(c==='UPS'?0:Math.abs(m.counts[c]-slots[c]*(c==='DHL'?3:2))),0);
       const key=[score,slots.UPS||0,slots.DHL||0];
       if(!rank||key.some((v,j)=>v<rank[j]&&key.slice(0,j).every((x,k)=>x===rank[k]))){rank=key;best={...slots}}return;
     }
     const c=cats[i],n=m.counts[c],lo=Math.max(Math.ceil(n/4),data.filter(x=>x.cat===c).length);
     for(let k=lo;k<=Math.min(left,n);k++)search(i+1,left-k,{...slots,[c]:k});
   }
   search(0,data.length,{});if(!best)fail('The supplied category mappings cannot fit these pallet counts and suffixes.');
   for(const c of cats){
     let extra=best[c]-data.filter(x=>x.cat===c).length;
     for(const x of data)if(!x.cat&&extra>0){x.cat=c;extra--}
     data.filter(x=>x.cat===c).forEach((x,i)=>x.pallets=Math.floor(m.counts[c]/best[c])+(i<m.counts[c]%best[c]?1:0));
   }return data;
 }
 function changes(m,b){
   const edits=new Map([[m.bol.key,m.bol.v.trimEnd()+b.suffix],[m.pro.key,m.pro.v.trimEnd()+b.suffix]]);
   function write(f){edits.set(f.p.key,b.pallets);edits.set(f.q.key,b.packs);edits.set(f.w.key,typeof f.w.v==='number'?b.grams/1000:format(b.grams)+' KG')}
   const active=m.lines.find(x=>x.cat===b.cat);
   for(const line of m.lines){if(line===active)write(line.f);else for(const x of line.line)edits.set(x.key,null)}
   write(m.sums);
return edits;
 }
 return {master,allocate,changes,kg,format,fail,addr};
})();
