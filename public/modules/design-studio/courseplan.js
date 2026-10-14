// Editable shapes and text; only the individual brand marks are raster assets.
function courseRect(left,top,width,height,fill,name,role,radius=0){
 const o=new fabric.Rect({left,top,width,height,fill,rx:radius,ry:radius,strokeWidth:0,name,layoutRole:'c:'+role});canvas.add(o);return o;
}
async function courseImage(src,left,top,width,height,name){
 const o=await imageFrom('assets/courseplan/'+src+'.png');o.set({left,top,scaleX:width/o.width,scaleY:height/o.height,name,layoutRole:'c:'+src});canvas.add(o);
}
function addCourseField(time=false){
 if(busy||templateKind!=='courseplan')return;
 const scale=Math.min(formats[format].w/595.276,formats[format].h/419.528)*1.128;
 const o=new fabric.Rect({left:formats[format].w/2,top:formats[format].h/2,width:time?20:52,height:25.6,rx:2.5,ry:2.5,scaleX:scale,scaleY:scale,fill:time?'#818586':'#dcdddf',strokeWidth:0,name:time?'Neues Zeitfeld':'Neues Kursfeld'});
 canvas.add(o);canvas.setActiveObject(o);canvas.requestRenderAll();record();properties();
}
const courseDays=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Sonntag'];
const courseRows=[
 [['10:00','RÜCKEN\nPOWER'],['18:00','LANGHANTEL-\nWORKOUT'],['',''],['','']],
 [['',''],['18:00','ZUMBA®'],['19:00','FULL BODY\nWORKOUT'],['19:45','ABS, LEGS\n& GLUTES']],
 [['10:00','ABS, LEGS\n& GLUTES'],['18:00','FUNCTIONAL\nWORKOUT\nam Tower'],['19:00','HIIT'],['','']],
 [['10:00','YOGA'],['18:00','ZUMBA®'],['19:00','HIIT'],['','']],
 [['10:00','RÜCKEN\nPOWER'],['18:00','PILATES'],['19:00','BREAK YOUR\nLIMITS'],['','']],
 [['10:00','YOGA']]
];
function courseText(text,left,top,width,fontSize,name,role,options={}){
 const o=configureTextbox(new fabric.Textbox(text,{left,top,width,fontSize,fontFamily:'GothamBlack',fill:'#231f20',lineHeight:1.08,name,layoutRole:'c:'+role,...options}));
 ensureTextFont(o);o.layoutBase=frameOf(o);canvas.add(o);return o;
}
async function courseplanTemplate(){
 busy=true;templateKind='courseplan';canvas.discardActiveObject();canvas.clear();canvas.backgroundColor='#fff';
 format='a5landscape';$('format').value=format;$('title').value='Kursplan Reutlingen';syncTemplateUI();
 await Promise.all(['GothamBlack','Montserrat-Black','Montserrat-Light'].map(f=>document.fonts.load('20px '+f)));
 courseRect(48,41,515,4,'#fbb040','Oranger Rand oben','border-top');
 courseRect(48,41,4,351,'#fbb040','Oranger Rand links','border-left');
 canvas.add(new fabric.Polygon([{x:52,y:45},{x:563,y:45},{x:563,y:82},{x:52,y:117}],{fill:'#231f20',strokeWidth:0,name:'Dunkler Kopfbereich',layoutRole:'c:header'}));
 canvas.add(new fabric.Line([52,119,563,84],{stroke:'#231f20',strokeWidth:.6,strokeDashArray:[3,2],name:'Gestrichelte Linie',layoutRole:'c:dash'}));
 courseRect(52,361,511,31,'#231f20','Dunkle Fußzeile','footer');
 courseRect(408,366,128,16,'#fbb040','Website-Banner','web-banner');
 courseRect(536,372,27,2,'#fbb040','Akzent neben Website','web-accent');
 courseRect(462,201,99,138,'#fbb040','Download-Hintergrund','download-card',5);
 canvas.add(new fabric.Polygon([{x:487,y:233},{x:536,y:233},{x:511.5,y:245}],{fill:'#fff',strokeWidth:0,name:'Download-Pfeil',layoutRole:'c:arrow'}));
 await courseImage('logo',454,29,82.5,64,'TOP SPORTS Logo');
 await courseImage('qr',472,249,80,80,'QR-Code · Original');
 await courseImage('social',347,366,49,17,'Social-Media-Symbole');
 courseText('KURSPLAN',64.6,60.6,122,20.273,'Überschrift','heading',{fill:'#fff'});
 courseText('|',188.2,60.6,10,20.273,'Trennstrich','divider',{fill:'#fbb040'});
 courseText('REUTLINGEN',201.5,60.6,245,20.273,'Standort','location',{fill:'#fff'});
 courseText('STAND: 01.01.2025',64.6,83.4,240,8.785,'Stand-Datum','date',{fill:'#fff'});
 for(let day=0;day<courseDays.length;day++){
  const x=64.5+79.52*day;
  courseRect(x,133.7,74.5,23,'#fbb040',courseDays[day]+' · Tagesbanner','day-bg:'+day,3);
  courseText(courseDays[day].toUpperCase(),x,141,74.5,7.04,courseDays[day]+' · Spaltenüberschrift','day:'+day,{fill:'#fff',textAlign:'center'});
  for(let row=0;row<courseRows[day].length;row++){
   const [time,title]=courseRows[day][row],y=[162.5,201.3,230,258.6][row];
   courseRect(x,y,20,25.6,'#818586',courseDays[day]+' '+(row+1)+' · Zeitfeld','time-bg:'+day+':'+row,2.5);
   courseRect(x+22.5,y,52,25.6,'#dcdddf',courseDays[day]+' '+(row+1)+' · Kursfeld','course-bg:'+day+':'+row,2.5);
   courseText(time,x,y+9.2,20,5.326,courseDays[day]+' '+(row+1)+' · Uhrzeit','time:'+day+':'+row,{fill:'#fff',textAlign:'center'});
   const lines=title.split('\n').length;
   courseText(title,x+24.8,y+(lines===3?4:lines===2?6:9.2),49,5.326,courseDays[day]+' '+(row+1)+' · Kurs','course:'+day+':'+row);
  }
 }
 courseText('Kurse finden ab 3 Teilnehmern statt. An Feiertagen finden keine Kurse statt.',64.5,315.9,385,5.92,'Teilnahmehinweis','note',{fontFamily:'Montserrat-Light'});
 courseText('Reutlingen | Föhrstr. 40a | Tel. 0 71 21 - 6 95 88 71',64.5,370,280,9.1,'Clubanschrift','address',{fontFamily:'Montserrat-Light',fill:'#fff'});
 courseText('WWW.TOPSPORTS.FITNESS',411.1,371,124,9.2,'Website','website',{fontFamily:'Courier New',fontWeight:'bold'});
 courseText('DOWNLOAD',468.2,212,89,13.2,'Download-Überschrift','download',{fill:'#fff'});
 // Crop the old PDF's surrounding whitespace, keeping all objects proportional.
 const d=formats.a5landscape,k=Math.min((d.w-10)/515,(d.h-10)/363);
 const dx=(d.w-515*k)/2,dy=(d.h-363*k)/2;
 for(const o of canvas.getObjects()){o.set({left:(o.left-48)*k+dx,top:(o.top-29)*k+dy,scaleX:o.scaleX*k,scaleY:o.scaleY*k});o.layoutBase=frameOf(o);o.setCoords()}
 busy=false;fit();record();properties();$('status').textContent='Kursplan · Alle Elemente bearbeitbar · A5 Querformat';
}
