let printFrame=null;
async function printDesign(){
 if(busy)return;
 const button=$('printDesign');button.disabled=true;
 try{
  await document.fonts.ready;
  canvas.discardActiveObject();clearAlignmentGuides();
  const d=formats[format],vpt=canvas.viewportTransform.slice(),width=canvas.width,height=canvas.height;
  let source;
  try{
   canvas.setDimensions({width:d.w,height:d.h});canvas.setViewportTransform([1,0,0,1,0,0]);
   source=canvas.toDataURL({format:'png',multiplier:300/72,enableRetinaScaling:false});
  }finally{
   canvas.setDimensions({width,height});canvas.setViewportTransform(vpt);canvas.requestRenderAll();
  }
  if(printFrame)printFrame.remove();
  const frame=document.createElement('iframe');printFrame=frame;
  frame.title='Druckansicht';frame.setAttribute('aria-hidden','true');
  frame.style.cssText='position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;';
  document.body.append(frame);
  const doc=frame.contentDocument;
  doc.title=$('title').value||'Top Sports Design';
  const style=doc.createElement('style');
  style.textContent=`@page{size:${d.w}pt ${d.h}pt;margin:0}html,body{margin:0;padding:0;width:${d.w}pt;height:${d.h}pt}img{display:block;width:${d.w}pt;height:${d.h}pt;print-color-adjust:exact;-webkit-print-color-adjust:exact}`;
  doc.head.append(style);
  const picture=doc.createElement('img');picture.alt='Aktuelles Design';
  const ready=new Promise((resolve,reject)=>{picture.onload=resolve;picture.onerror=()=>reject(Error('Die Druckansicht konnte nicht geladen werden.'))});
  picture.src=source;doc.body.append(picture);await ready;
  if(picture.decode)await picture.decode();
  frame.contentWindow.addEventListener('afterprint',()=>{frame.remove();if(printFrame===frame)printFrame=null},{once:true});
  frame.contentWindow.focus();frame.contentWindow.print();
 }catch(error){if(printFrame){printFrame.remove();printFrame=null}notify('Drucken fehlgeschlagen: '+error.message)}
 finally{button.disabled=false;properties();layers()}
}
$('printDesign').onclick=printDesign;
