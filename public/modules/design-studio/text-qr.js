const fullFonts={'GothamBlack':'Montserrat-Black','Gotham-Book':'Montserrat-Book','Gotham-Light':'Montserrat-Light'};
function ensureTextFont(o){
 if(o.layoutRole==='t:0')o.set('textAlign','left');
 const supported=fontCoverage[o.fontFamily];if(!supported)return;
 if([...o.text].some(c=>c!=='\n'&&!supported.includes(c.codePointAt(0)))){
  const family=fullFonts[o.fontFamily];
  o.set('fontFamily',family);
  for(const line of Object.values(o.styles||{}))for(const style of Object.values(line))if(style.fontFamily)style.fontFamily=family;
  o.initDimensions();o.setCoords();
 }
}
function qrImageSource(value){
 const text=value.trim();if(!text)throw Error('Bitte ein QR-Ziel eingeben.');
 if(text.length>1800)throw Error('Der QR-Inhalt ist zu lang. Bitte kürzen.');
 qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];
 const code=qrcode(0,'M');code.addData(text,'Byte');code.make();
 // Fixed square dimensions and four quiet modules prevent SVG's 300×150 fallback.
 const svg=code.createSvgTag({cellSize:8,margin:32,scalable:false});
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
async function repairQR(o){
 const size=Math.max(40,Math.min(o.getScaledWidth(),o.getScaledHeight()));
 await new Promise(resolve=>o.setSrc(qrImageSource(o.qrValue),resolve));
 o.setControlsVisibility({ml:false,mr:false,mt:false,mb:false});o.set({scaleX:size/o.width,scaleY:size/o.height,lockUniScaling:true});o.setCoords();
}
