$('pagePreview').onclick=async()=>{
 if(busy)return;
 const button=$('pagePreview');button.disabled=true;
 try{
  await document.fonts.ready;
  canvas.discardActiveObject();clearAlignmentGuides();
  const d=formats[format],vpt=canvas.viewportTransform.slice(),width=canvas.width,height=canvas.height;
  let source;
  try{
   canvas.setDimensions({width:d.w,height:d.h});canvas.setViewportTransform([1,0,0,1,0,0]);
   source=canvas.toDataURL({format:'png',multiplier:2,enableRetinaScaling:false});
  }finally{
   canvas.setDimensions({width,height});canvas.setViewportTransform(vpt);canvas.requestRenderAll();
  }
  $('pagePreviewImage').src=source;$('pagePreviewInfo').textContent=formats[format].label;
  $('pagePreviewDialog').showModal();
 }catch(error){notify('Vorschau konnte nicht erstellt werden: '+error.message)}
 finally{button.disabled=false}
};
$('closePagePreview').onclick=()=>$('pagePreviewDialog').close();
