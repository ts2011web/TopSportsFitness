function buildNoticeContents(){
 const remove=new Set(['a:11','a:12','a:13','t:7','t:8','t:9','t:10','t:11','t:12','t:13','t:14','t:15']);
 for(const o of [...canvas.getObjects()])if(remove.has(o.layoutRole))canvas.remove(o);
 const heading=canvas.getObjects().find(o=>o.layoutRole==='t:2');
 heading.set({text:'Mitgliederinfo',name:'Mitgliederinfo'});ensureTextFont(heading);
 const addText=(role,text,x,y,width,size,family='Montserrat-Book')=>{
  const o=configureTextbox(new fabric.Textbox(text,{left:x,top:y,width,fontSize:size,fontFamily:family,fill:'#231f20',lineHeight:1.2,name:text.slice(0,38),layoutRole:'n:'+role}));
  o.layoutBase=frameOf(o);canvas.add(o);return o;
 };
 addText('title','Duschen vorübergehend\nnicht nutzbar',54,300,488,29,'Montserrat-Black');
 const box=new fabric.Rect({left:54,top:418,width:488,height:104,rx:8,ry:8,fill:'#fbb040',strokeWidth:0,name:'Zeitraum – Hintergrund',layoutRole:'n:box'});
 box.layoutBase=frameOf(box);canvas.add(box);
 addText('time','12:00 – 15:00 Uhr',76,449,445,31,'Montserrat-Black');
 addText('description','Liebe Mitglieder,\n\nin diesem Zeitraum können die Duschen nicht genutzt werden. Bitte berücksichtigt dies bei eurem Besuch.',54,559,488,18);
 addText('closing','Vielen Dank für euer Verständnis!\nEuer Top Sports Team',54,695,488,16);
}
