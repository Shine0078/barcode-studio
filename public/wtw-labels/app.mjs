import {parseRows,makePdf} from './labels.mjs';
const byId = id => document.getElementById(id);
const po = byId('po'), table = byId('rows'), generate = byId('generate');
const status = byId('status'), download = byId('download'), print = byId('print');
let revision = 0, fileUrl = '', rows = [];
function update() {
  revision++;
  if(fileUrl) URL.revokeObjectURL(fileUrl);
  fileUrl = '';
  download.hidden = print.hidden = true;
  generate.disabled = true;
  try {
    rows = parseRows(table.value);
    if(!po.value.trim()) throw Error('Enter the PO number.');
    if(!/^[A-Za-z0-9._/-]+$/.test(po.value.trim())) throw Error('Check the PO number.');
    if(!rows.length) throw Error('Paste your item table.');
    status.textContent = rows.length+' label'+(rows.length===1?'':'s')+' ready.';
    generate.disabled = false;
  } catch(error) { status.textContent = error.message; }
}
po.addEventListener('input',update);
table.addEventListener('input',update);
generate.onclick = async () => {
  const current = revision;
  generate.disabled = true;
  try {
    const data = await makePdf(window.PDFLib,po.value.trim(),rows);
    if(current!==revision) return;
    fileUrl = URL.createObjectURL(new Blob([data],{type:'application/pdf'}));
    download.href = print.href = fileUrl;
    download.download = 'WTW_ATC_PO'+po.value.trim().replace(/[^\w.-]/g,'_')+'_4x8_Labels.pdf';
    download.hidden = print.hidden = false;
    status.textContent = rows.length+' labels generated. Print at actual size on 8 × 4 inch paper.';
    download.click();
  } catch(error) { if(current===revision){status.textContent=error.message; generate.disabled=false;} }
};
update();
