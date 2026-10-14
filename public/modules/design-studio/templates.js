const templateDrafts={};
function syncTemplateUI(){
 $('templateChoice').value=templateKind;
 const voucher=templateKind==='voucher',courseplan=templateKind==='courseplan';
 $('courseFields').hidden=!courseplan;
 document.querySelector('.property-foot').textContent=courseplan?'Alle Elemente einzeln bearbeiten.':'Inhalte bearbeiten · Hintergrund fixiert.';
 for(const option of $('format').options){const available=courseplan?['a5landscape','a4landscape'].includes(option.value):!['a5landscape','a4landscape'].includes(option.value);option.hidden=!available;option.disabled=!available}
 $('club').closest('label').hidden=voucher||courseplan;
 $('photoUnderHeader').closest('label').hidden=voucher||courseplan;
 $('referenceDialog').querySelector('h2').textContent=voucher?'Original-Gutschein':'Original-Events';
 $('referenceDialog').querySelector('img').src=voucher?'assets/voucher/reference.png':'assets/reference.png';
 $('referenceDialog').querySelector('img').alt=voucher?'Originalvorlage Gutschein':'Originalvorlage Events';
 if(courseplan){$('referenceDialog').querySelector('h2').textContent='Original-Kursplan · Reutlingen';$('referenceDialog').querySelector('img').src='assets/courseplan/reference.png';$('referenceDialog').querySelector('img').alt='Originalvorlage Kursplan im Querformat'}
}
async function voucherTemplate(){
 busy=true;templateKind='voucher';canvas.discardActiveObject();canvas.clear();canvas.backgroundColor='#fff';
 format='a4';$('format').value=format;$('title').value='Gutschein';syncTemplateUI();
 await Promise.all(['Tahoma','Arial','Verdana','Courier New'].map(f=>document.fonts.load('16px "'+f+'"')));
 const data=await fetch('assets/voucher/template.json').then(r=>{if(!r.ok)throw Error('Gutschein konnte nicht geladen werden.');return r.json()});
 for(const [index,a] of data.assets.entries()){
  const o=await imageFrom(a.src);
  o.set({left:a.left,top:a.top,scaleX:a.width/o.width,scaleY:a.height/o.height,name:a.name,layoutRole:'v:a:'+index});
  o.layoutBase=frameOf(o);canvas.add(o);
 }
 for(const [index,t] of data.texts.entries()){
  const angle=t.angle||0,rad=angle*Math.PI/180;
  const o=configureTextbox(new fabric.Textbox(t.text,{fontFamily:t.font,fontSize:t.size,fontWeight:t.bold?'bold':'normal',fill:t.color,width:t.width+3,left:t.left+Math.sin(rad)*t.size*.88,top:t.baseline-Math.cos(rad)*t.size*.88,angle,name:t.text.slice(0,38),layoutRole:'v:t:'+index,lineHeight:1.15}));
  o.layoutBase=frameOf(o);canvas.add(o);
 }
 busy=false;fit();record();properties();$('status').textContent='Gutschein · Bereit zum Gestalten';
}
async function switchTemplate(kind){
 if(busy||kind===templateKind){$('templateChoice').value=templateKind;return}
 const previous=state();templateDrafts[templateKind]=previous;
 $('templateChoice').disabled=true;
 try{
  if(templateDrafts[kind]){await restore(templateDrafts[kind]);record()}
  else if(kind==='voucher')await voucherTemplate();
  else if(kind==='courseplan')await courseplanTemplate();
  else if(kind==='notices')await template({placeholders:true,kind:'notices'});
  else await template({placeholders:true});
 }catch(error){await restore(previous);notify(error.message)}
 finally{$('templateChoice').disabled=false;syncTemplateUI()}
}
