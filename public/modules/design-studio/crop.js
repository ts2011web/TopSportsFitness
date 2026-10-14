let cropTarget=null;
const cropSides=['Left','Right','Top','Bottom'];
function cropValues(){return Object.fromEntries(cropSides.map(side=>[side,Number($('crop'+side).value)]))}
function showCrop(){
 const o=canvas.getActiveObject();if(!o||o.type!=='image'||o.fixedBackground||o.qrValue)return;
 cropTarget=o;const size=o.getOriginalSize();
 const values={Left:100*(o.cropX||0)/size.width,Top:100*(o.cropY||0)/size.height,Right:100*(size.width-(o.cropX||0)-o.width)/size.width,Bottom:100*(size.height-(o.cropY||0)-o.height)/size.height};
 for(const side of cropSides)$('crop'+side).value=Math.max(0,values[side]);
 $('cropImage').src=o.getElement().src;updateCropPreview();$('cropDialog').showModal();
}
function updateCropPreview(changed){
 const pairs={Left:'Right',Right:'Left',Top:'Bottom',Bottom:'Top'};
 if(changed){const other=pairs[changed];if(Number($('crop'+changed).value)+Number($('crop'+other).value)>95)$('crop'+changed).value=95-Number($('crop'+other).value)}
 const v=cropValues();
 for(const side of cropSides)$('crop'+side+'Value').textContent=Math.round(v[side])+' %';
 $('cropImage').style.clipPath=`inset(${v.Top}% ${v.Right}% ${v.Bottom}% ${v.Left}%)`;
}
$('cropImageButton').onclick=showCrop;
for(const side of cropSides)$('crop'+side).oninput=()=>updateCropPreview(side);
$('cropReset').onclick=()=>{for(const side of cropSides)$('crop'+side).value=0;updateCropPreview()};
$('cropCancel').onclick=()=>$('cropDialog').close();
$('cropApply').onclick=()=>{
 const o=cropTarget;if(!o)return;
 const v=cropValues(),size=o.getOriginalSize();
 o.set({cropX:size.width*v.Left/100,cropY:size.height*v.Top/100,width:Math.max(1,size.width*(1-(v.Left+v.Right)/100)),height:Math.max(1,size.height*(1-(v.Top+v.Bottom)/100))});
 updatePhotoClips(o);o.setCoords();canvas.requestRenderAll();record();properties();$('cropDialog').close();cropTarget=null;
};
