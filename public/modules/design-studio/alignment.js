let alignmentGuides=[];
canvas.selection=true;
canvas.selectionKey='shiftKey';
function alignmentPoints(o){
 const r=o.getBoundingRect(true,true);
 return {x:[r.left,r.left+r.width/2,r.left+r.width],y:[r.top,r.top+r.height/2,r.top+r.height]};
}
canvas.on('object:moving',({target})=>{
 if(!target||target.locked)return;
 const selected=new Set(target.type==='activeSelection'?target.getObjects():[target]);
 const d=formats[format],points={x:[0,d.w/2,d.w],y:[0,d.h/2,d.h]};
 for(const o of canvas.getObjects()){
  if(selected.has(o)||!o.visible||o.fixedBackground)continue;
  const p=alignmentPoints(o);points.x.push(...p.x);points.y.push(...p.y);
 }
 target.setCoords();const own=alignmentPoints(target),tolerance=6/zoom;
 alignmentGuides=[];
 for(const axis of ['x','y']){
  let closest=null;
  for(const from of own[axis])for(const to of points[axis]){
   const delta=to-from;
   if(Math.abs(delta)<=tolerance&&(!closest||Math.abs(delta)<Math.abs(closest.delta)))closest={delta,to};
  }
  if(closest){target.set(axis==='x'?'left':'top',target[axis==='x'?'left':'top']+closest.delta);alignmentGuides.push({axis,value:closest.to})}
 }
 target.setCoords();updatePhotoClips(target);properties();
});
canvas.on('after:render',()=>{
 if(!alignmentGuides.length)return;
 const ctx=canvas.contextContainer,v=canvas.viewportTransform,d=formats[format];
 ctx.save();ctx.strokeStyle='#e02e9b';ctx.lineWidth=1;ctx.setLineDash([5,4]);
 for(const guide of alignmentGuides){
  ctx.beginPath();
  if(guide.axis==='x'){const x=guide.value*v[0]+v[4];ctx.moveTo(x,0);ctx.lineTo(x,d.h*v[3])}
  else{const y=guide.value*v[3]+v[5];ctx.moveTo(0,y);ctx.lineTo(d.w*v[0],y)}
  ctx.stroke();
 }
 ctx.restore();
});
function clearAlignmentGuides(){alignmentGuides=[];canvas.requestRenderAll()}
canvas.on('mouse:up',clearAlignmentGuides);
canvas.on('selection:cleared',clearAlignmentGuides);
document.addEventListener('keydown',e=>{
 if(!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=='a'||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||canvas.getActiveObject()?.isEditing)return;
 e.preventDefault();const objects=canvas.getObjects().filter(o=>o.visible&&!o.locked&&!o.fixedBackground);
 canvas.discardActiveObject();if(objects.length)canvas.setActiveObject(new fabric.ActiveSelection(objects,{canvas}));
 canvas.requestRenderAll();properties();layers();
});
