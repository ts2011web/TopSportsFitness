/* Layout the page furniture to the page edges; scale content uniformly. */
const frameKeys=['left','top','scaleX','scaleY','angle'];
function frameOf(o){const frame=Object.fromEntries(frameKeys.map(k=>[k,o[k]]));if(o.type==='textbox')frame.width=o.width;return frame}
function contentFrame(base,x,y,k){return {...base,left:x,top:y,scaleX:base.scaleX*k,scaleY:base.scaleY*k}}
function targetFrame(role,base,target){
 const d=formats[target],W=d.w,H=d.h;
 if(templateKind==='courseplan'){if(!role?.startsWith('c:'))return null;const source=formats.a5landscape,k=Math.min(W/source.w,H/source.h);return contentFrame(base,base.left*k+(W-source.w*k)/2,base.top*k+(H-source.h*k)/2,k)}
 if(templateKind==='voucher'){const k=Math.min(W/formats.a4.w,H/formats.a4.h);return contentFrame(base,base.left*k+(W-formats.a4.w*k)/2,base.top*k+(H-formats.a4.h*k)/2,k)}
 if(target==='a4')return base;
 if(role?.startsWith('n:')){
  if(target==='square')return contentFrame(base,base.left,245+(base.top-300)*.85,.85);
  const frames={'n:title':[54,206,.9],'n:box':[532,210,.75],'n:time':[548.5,233.25,.75],'n:description':[54,300,.85],'n:closing':[54,416,.8]};
  if(frames[role])return contentFrame(base,...frames[role]);
 }
 const wide=target==='wide',k=wide?.78:.85;
 const a=Number(role?.split(':')[1]);
 if(role?.startsWith('a:')){
  const positions={
   1:[W-31,H-51,1],2:[W-251,H-63,1],3:[W-351,H-63,1],
   9:[W-184,0,1],10:[0,wide?32:41,k],
   11:[40,wide?190:186,wide?.8:.78],
   12:[wide?532:40,wide?207:450,wide?.74:.9],
   13:[wide?363:482,wide?307:230,wide?.68:.85]
  };
  if(positions[a])return contentFrame(base,...positions[a]);
 }
 if(role?.startsWith('t:')){
  if(a===0)return contentFrame(base,54,H-31,1);
  if(a===1)return contentFrame(base,W-245,H-60,1);
  if(a>=2&&a<=5)return contentFrame(base,40+(base.left-54)*k,100+(base.top-129)*k,k);
  if(a===6)return contentFrame(base,base.left*k,base.top*k+(wide?0:0),k);
  if(a>=7&&a<=13){let f=wide?.7:.84;return contentFrame(base,wide?546:54,(wide?219:462)+(base.top-562)*f,f)}
  if(a>=14)return contentFrame(base,40+(base.left-40)*(wide?1:1.15),H-91,wide?1:1.15);
 }
 return null;
}
function furniture(role,W,H){
 const a=Number(role?.split(':')[1]);if(!role?.startsWith('a:'))return null;
 const headBottom=179;
 let x,y,w,h,body;
 if(a===0){x=22.333+8.379;y=H-71.333;w=W-x;h=71.333;body=`<rect width="${w}" height="${h}" fill="#231f20"/>`}
 if(a===4){x=25;y=headBottom-36;w=W-x;h=42;body=`<path d="M0 40 L${w} 0" fill="none" stroke="#231f20" stroke-width="2" stroke-dasharray="6 4"/>`}
 if(a===5){x=25;y=26.667;w=W-x;h=headBottom-y;body=`<path d="M0 0H${w}V${h-40}L0 ${h}Z" fill="#231f20"/>`}
 if([6,7,8].includes(a)){
  x=a===7?22.333:14;y=x;w=W-x;h=H-y;const thickness=a===8?2.163:8.379;
  body=`<path d="M0 0H${w}V${thickness}H${thickness}V${h}H0Z" fill="${a===6?'#ffffff':a===7?'#fbb040':'#231f20'}"/>`;
 }
 if(!body)return null;
 return {left:x,top:y,width:w,height:h,src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)};
}
async function changeFormat(target,{fresh=false,silent=false}={}){
 if(busy||!formats[target])return;
 if(templateKind==='courseplan'&&!['a5landscape','a4landscape'].includes(target))return;
 const previous=format,old=formats[previous],next=formats[target];
 busy=true;$('format').disabled=true;canvas.discardActiveObject();
 try{
  for(const o of canvas.getObjects()){
   if(o.layoutRole==='header-rim')continue;
   o.layoutFrames=o.layoutFrames||{};
   if(!fresh)o.layoutFrames[previous]=frameOf(o);
   // Keep each format's manual placement. Content and style edits remain shared.
   const base=o.layoutFrames[templateKind==='courseplan'?'a5landscape':'a4']||o.layoutBase||frameOf(o);
   if(!o.layoutBase)o.layoutBase={...base};
   const shape=o.layoutFurniture?furniture(o.layoutRole,next.w,next.h):null;
   if(o.layoutFurniture){
    const src=target==='a4'?o.layoutOriginalSrc:shape?.src;
    if(src)await new Promise(resolve=>o.setSrc(src,resolve));
   }
   let frame=fresh?null:o.layoutFrames[target];
   if(o.layoutFurniture)frame=target==='a4'?{...(o.layoutBase||base)}:shape?{left:shape.left,top:shape.top,scaleX:1,scaleY:1,angle:0}:null;
   if(!frame)frame=targetFrame(o.layoutRole,base,target);
   if(!frame){const r=Math.min(next.w/old.w,next.h/old.h);frame={left:o.left/old.w*next.w,top:o.top/old.h*next.h,scaleX:o.scaleX*r,scaleY:o.scaleY*r,angle:o.angle}}
   o.set(frame);if(o.filters?.length)o.applyFilters();o.setCoords();
  }
  format=target;$('format').value=target;fitClubFooter();fixBackground();fit();
 }finally{busy=false;$('format').disabled=false;if(!silent)record();properties();updateButtons()}
 if(!silent)notify('Vorlage auf die Seitenbreite angepasst. Bilder, Logo und Texte bleiben proportional.');
}
async function migrateLayout(data,currentFormat){
 const template=await fetch('assets/template.json').then(r=>r.json());
 const objects=data.objects,ref=template.assets[8];
 const border=objects.find(o=>o.name===ref.name||/element-8\.svg(?:$|\?)/.test(o.src||''));
 const r=border?border.height*border.scaleY/ref.height:Math.min(formats[currentFormat].w/595.276,formats[currentFormat].h/841.89);
 const dx=border?border.left-ref.left*r:(formats[currentFormat].w-595.276*r)/2;
 const dy=border?border.top-ref.top*r:(formats[currentFormat].h-841.89*r)/2;
 for(const o of objects){
  const index=template.assets.findIndex(a=>a.name===o.name||o.src?.endsWith(a.src));
  const textIndex=template.texts.findIndex(t=>t.text===o.text||t.text.slice(0,38)===o.name);
  if(index>=0){o.layoutRole='a:'+index;o.layoutFurniture=[0,4,5,6,7,8].includes(index);o.layoutOriginalSrc=template.assets[index].src}
  else if(textIndex>=0)o.layoutRole='t:'+textIndex;
  o.layoutBase={left:(o.left-dx)/r,top:(o.top-dy)/r,scaleX:o.scaleX/r,scaleY:o.scaleY/r,angle:o.angle||0};
 }
}

let draggedLayer=null,layerPointer=null;
function moveLayerBefore(source,target,after){
 if(!source||source.fixedBackground||target?.fixedBackground||source===target)return;
 const visual=[...canvas.getObjects()].reverse().filter(o=>o!==source);
 const at=visual.indexOf(target);if(at<0)return;
 visual.splice(at+(after?1:0),0,source);
 canvas.discardActiveObject();[...visual].reverse().forEach((o,i)=>canvas.moveTo(o,i));
 canvas.setActiveObject(source);canvas.requestRenderAll();record();properties();
}
function clearLayerDrop(){document.querySelectorAll('.drop-before,.drop-after,.dragging').forEach(el=>el.classList.remove('drop-before','drop-after','dragging'))}
function layerDropTarget(row,y){clearLayerDrop();const after=y>row.getBoundingClientRect().top+row.getBoundingClientRect().height/2;row.classList.add(after?'drop-after':'drop-before');return after}
function enableLayerDrag(row,o){
 if(o.fixedBackground){row.title='Fester Hintergrund';return}
 row.draggable=true;row.title='Ziehen, um die Reihenfolge zu ändern';row.dataset.layerIndex=canvas.getObjects().indexOf(o);
 row.addEventListener('dragstart',e=>{draggedLayer=o;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',row.dataset.layerIndex);row.classList.add('dragging')});
 row.addEventListener('dragover',e=>{if(!draggedLayer)return;e.preventDefault();e.dataTransfer.dropEffect='move';layerDropTarget(row,e.clientY)});
 row.addEventListener('drop',e=>{e.preventDefault();const after=e.clientY>row.getBoundingClientRect().top+row.offsetHeight/2;moveLayerBefore(draggedLayer,o,after);draggedLayer=null;clearLayerDrop()});
 row.addEventListener('dragend',()=>{draggedLayer=null;clearLayerDrop()});
 const handle=document.createElement('span');handle.className='drag-handle';handle.textContent='⠿';handle.setAttribute('aria-hidden','true');row.prepend(handle);
 // A dedicated handle keeps touch scrolling available on the rest of the row.
 handle.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;e.preventDefault();e.stopPropagation();layerPointer={object:o,handle};handle.setPointerCapture(e.pointerId)});
 handle.addEventListener('pointermove',e=>{if(!layerPointer)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.layer');if(target){layerPointer.target=canvas.getObjects()[Number(target.dataset.layerIndex)];layerPointer.after=layerDropTarget(target,e.clientY)}const list=$('layers'),r=list.getBoundingClientRect();if(e.clientY<r.top+30)list.scrollTop-=12;else if(e.clientY>r.bottom-30)list.scrollTop+=12});
 handle.addEventListener('pointerup',e=>{if(!layerPointer)return;e.stopPropagation();moveLayerBefore(layerPointer.object,layerPointer.target,layerPointer.after);layerPointer=null;clearLayerDrop()});
 handle.addEventListener('pointercancel',()=>{layerPointer=null;clearLayerDrop()});
 row.addEventListener('keydown',e=>{if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();e.stopPropagation();const visual=[...canvas.getObjects()].reverse(),i=visual.indexOf(o),target=visual[i+(e.key==='ArrowUp'?-1:1)];moveLayerBefore(o,target,e.key==='ArrowDown')}});
}
