function configureTextbox(o){
 o.set({lockScalingFlip:true,lockScalingY:true,minWidth:20,splitByGrapheme:false});
 // Side handles change the wrapping width; height follows the text automatically.
 o.setControlsVisibility({tl:false,tr:false,bl:false,br:false,mt:false,mb:false,ml:true,mr:true,mtr:true});
 return o;
}
function wrappingTextbox(o){
 const options=o.toObject(custom),oldWidth=o.width||100;
 const scale=Math.max(.0001,Math.abs(o.scaleY||1));
 options.width=Math.max(20,oldWidth*Math.abs(o.scaleX||1)/scale);
 options.scaleX=scale;options.scaleY=scale;
 delete options.type;delete options.height;
 const textbox=configureTextbox(new fabric.Textbox(o.text,options));
 for(const frame of [textbox.layoutBase,...Object.values(textbox.layoutFrames||{})]){
  if(!frame)continue;
  const sy=Math.max(.0001,Math.abs(frame.scaleY||1));
  frame.width=Math.max(20,(frame.width||oldWidth)*Math.abs(frame.scaleX||1)/sy);
  frame.scaleX=sy;frame.scaleY=sy;
 }
 textbox.setCoords();return textbox;
}
function restoreTextboxes(){
 for(const o of [...canvas.getObjects()]){
  if(!isText(o))continue;
  if(o.type==='textbox'&&Math.abs(o.scaleX-o.scaleY)<.00001){configureTextbox(o);continue}
  const index=canvas.getObjects().indexOf(o),replacement=wrappingTextbox(o);
  canvas.remove(o);canvas.insertAt(replacement,index);
 }
}
function resizeTextWidth(o,width){
 o.set('width',Math.max(20,width/Math.max(.0001,Math.abs(o.scaleX))));
 o.initDimensions();o.setCoords();
}
