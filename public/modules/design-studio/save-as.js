async function chooseExportFile(type,name){
 if(typeof window.showSaveFilePicker!=='function')return null;
 const mime=type==='pdf'?'application/pdf':'image/png';
 try{
  return await window.showSaveFilePicker({suggestedName:name,types:[{description:type==='pdf'?'PDF-Dokument':'PNG-Bild',accept:{[mime]:['.'+type]}}]});
 }catch(error){
  if(error.name==='SecurityError'||error.name==='NotAllowedError')return null;
  throw error;
 }
}
async function saveExportFile(handle,blob,name){
 if(!handle){download(blob,name);return}
 const writable=await handle.createWritable();
 try{await writable.write(blob);await writable.close()}
 catch(error){try{await writable.abort()}catch{}throw error}
}
