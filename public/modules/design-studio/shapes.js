function createShape(kind){
  const style={fill:'#fbb040',strokeWidth:0};
  switch(kind){
    case 'rectangle':return new fabric.Rect({...style,width:220,height:140,name:'Rechteck'});
    case 'circle':return new fabric.Circle({...style,radius:80,name:'Kreis'});
    case 'ellipse':return new fabric.Ellipse({...style,rx:120,ry:70,name:'Ellipse'});
    case 'triangle':return new fabric.Triangle({...style,width:180,height:160,name:'Dreieck'});
    // A filled rectangle keeps line thickness editable through the height control.
    case 'line':return new fabric.Rect({...style,width:260,height:6,name:'Linie'});
    case 'arrow':return new fabric.Polygon([{x:0,y:30},{x:150,y:30},{x:150,y:0},{x:230,y:60},{x:150,y:120},{x:150,y:90},{x:0,y:90}],{...style,name:'Pfeil'});
    case 'banner':return new fabric.Rect({...style,width:360,height:110,rx:8,ry:8,name:'Banner'});
    default:throw new Error('Unbekannte Form');
  }
}
$('addShape').onclick=()=>$('shapeDialog').showModal();
$('closeShapes').onclick=()=>$('shapeDialog').close();
document.querySelectorAll('[data-shape]').forEach(button=>{
  button.onclick=()=>{
    const shape=createShape(button.dataset.shape);
    $('shapeDialog').close();
    add(shape);
  };
});
