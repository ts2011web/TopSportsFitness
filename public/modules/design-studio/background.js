const fixedRoles=new Set(['a:0','a:4','a:5','a:6','a:7','a:8','header-rim']);
function headerEdge(pageFormat=format){const d=formats[pageFormat];return {width:d.w,height:d.h,left:25,top:pageFormat==='a4'?251.4:179,drop:40,rim:18}}
function photoClipPoints(pageFormat=format){const e=headerEdge(pageFormat);return [{x:30.9,y:e.top+e.rim},{x:e.width,y:e.top-e.drop+e.rim},{x:e.width,y:e.height-71.333},{x:30.9,y:e.height-71.333}]}
function clipPhoto(o){
 const rounding=Math.max(0,Math.min(50,Number(o.cornerRounding)||0));
 let clip;
 if(rounding){
  const sx=Math.max(.0001,Math.abs(o.scaleX)),sy=Math.max(.0001,Math.abs(o.scaleY));
  const radius=Math.min(o.width*sx,o.height*sy)*rounding/100;
  clip=new fabric.Rect({width:o.width,height:o.height,rx:radius/sx,ry:radius/sy,left:0,top:0,originX:'center',originY:'center',fill:'#000',strokeWidth:0});
  if(o.photoUnderHeader){
   // Intersect the local rounded rectangle with the fixed page boundary.
   const inverse=fabric.util.invertTransform(o.calcTransformMatrix());
   const points=photoClipPoints().map(p=>fabric.util.transformPoint(p,inverse));
   clip.clipPath=new fabric.Polygon(points,{fill:'#000',strokeWidth:0});
  }
 }else if(o.photoUnderHeader)clip=new fabric.Polygon(photoClipPoints(),{absolutePositioned:true,fill:'#000',strokeWidth:0,objectCaching:false});
 if(clip||o.headerClipApplied)o.set('clipPath',clip);
 o.dirty=true;o.headerClipApplied=!!clip;
}
function updatePhotoClips(target){
 const objects=target?.type==='activeSelection'?target.getObjects():[target];
 for(const o of objects)if(o?.type==='image'&&(o.photoUnderHeader||o.cornerRounding||o.headerClipApplied))clipPhoto(o);
}
function fixBackground(){
 if(['voucher','courseplan'].includes(templateKind)){canvas.requestRenderAll();return}
 const e=headerEdge();
 let rim=canvas.getObjects().find(o=>o.layoutRole==='header-rim');
 if(rim)canvas.remove(rim);
 rim=new fabric.Polygon([{x:25,y:e.top-1},{x:e.width,y:e.top-e.drop-1},{x:e.width,y:e.top-e.drop+e.rim},{x:25,y:e.top+e.rim}],{fill:'#fff',strokeWidth:0,name:'Weißer Rand unter der Schräge',layoutRole:'header-rim',fixedBackground:true,locked:true,selectable:false,evented:false,hasControls:false});
 const dash=canvas.getObjects().find(o=>o.layoutRole==='a:4');
 canvas.insertAt(rim,dash?canvas.getObjects().indexOf(dash):0);
 for(const o of canvas.getObjects()){
  if(o.layoutRole==='a:0'){const left=22.333+8.379;o.set({left,scaleX:(e.width-left)/o.width});o.setCoords()}
  if(fixedRoles.has(o.layoutRole)){o.fixedBackground=true;o.locked=true;o.set({selectable:false,evented:false,hasControls:false,lockMovementX:true,lockMovementY:true,lockScalingX:true,lockScalingY:true,lockRotation:true})}
  if(o.layoutRole==='a:11'&&o.photoUnderHeader===undefined)o.photoUnderHeader=true;
  if(o.photoUnderHeader||o.cornerRounding||o.headerClipApplied)clipPhoto(o);
 }
 canvas.requestRenderAll();
}
function placeNewPhoto(im){
 if(['voucher','courseplan'].includes(templateKind)){const k=Math.min(360/im.width,420/im.height);im.set({left:70,top:100,scaleX:k,scaleY:k,photoUnderHeader:false});return}
 const e=headerEdge(),width=Math.min(e.width-78,540),scale=width/im.width;
 im.set({left:38,top:e.top-e.drop+4,scaleX:scale,scaleY:scale,photoUnderHeader:true});clipPhoto(im);
}

// Keep the narrow white separator and its dashed line above editable content.
function keepSeparatorVisible(){
 if(['voucher','courseplan'].includes(templateKind))return;
 const objects=canvas.getObjects();
 const roles=['a:5','header-rim','a:4','a:7','t:2','t:3','t:4','t:5','a:9','a:10','t:6'];
 const foreground=roles.map(role=>objects.find(o=>o.layoutRole===role)).filter(Boolean);
 if(foreground.every((o,i)=>objects[objects.length-foreground.length+i]===o))return;
 for(const object of foreground)canvas.bringToFront(object);
}
