const clubs=[
 {name:'Echterdingen',street:'Nikolaus-Otto-Str. 3',city:'70771 Leinfelden-Echterdingen',phone:'0711 41471633'},
 {name:'Reutlingen',street:'Föhrstraße 40a',city:'72760 Reutlingen',phone:'07121 6958871'},
 {name:'Leinfelden',street:'Adlerstraße 3',city:'70771 Leinfelden-Echterdingen',phone:'0711 84953365'},
 {name:'Kornwestheim',street:'Salamanderplatz 2–6',city:'70806 Kornwestheim',phone:'07154 1550240'},
 {name:'Nürtingen',street:'Kirchstraße 36',city:'72622 Nürtingen',phone:'07022 9587976'},
 {name:'Degerloch',street:'Löffelstraße 38–40',city:'70597 Stuttgart',phone:'0711 9885700'}
];
const clubLine=c=>`${c.street} | ${c.city} | Telefon ${c.phone}`;
function clubFooter(){return canvas.getObjects().find(o=>o.layoutRole==='t:0')}
function syncClub(){
 const o=clubFooter(),select=$('club');if(!select)return;
 const normal=s=>s.replace(/[\s-]/g,'');
 const found=o&&clubs.find(c=>normal(clubLine(c))===normal(o.text));
 select.value=found?found.name:'';select.disabled=busy||!o;
}
function fitClubFooter(){
 const o=clubFooter();if(!o)return;
 o.set({textAlign:'left'});
 if(!clubs.some(c=>clubLine(c)===o.text))return;
 // Preserve a single footer line; shrink the font uniformly only when needed.
 const width=Math.max(20,(formats[format].w-o.left-20)/Math.max(.0001,Math.abs(o.scaleX)));
 o.set({width,fontSize:16,styles:{}});ensureTextFont(o);
 const measure=new fabric.Text(o.text,{fontFamily:o.fontFamily,fontSize:16,fontWeight:o.fontWeight,charSpacing:o.charSpacing});
 if(measure.width>width)o.set('fontSize',16*width/(measure.width+2));
 o.initDimensions();o.setCoords();
}
function chooseClub(name){
 if(busy)return;const c=clubs.find(c=>c.name===name),o=clubFooter();if(!c||!o)return;
 o.set({text:clubLine(c),name:'Anschrift · '+c.name,textAlign:'left',styles:{}});
 fitClubFooter();canvas.requestRenderAll();record();properties();
}
