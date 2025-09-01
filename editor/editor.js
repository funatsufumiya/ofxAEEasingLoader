// Bezier Animation Editor (p5.js)
// Simple 1-track, only supports Position
// Right-click to add keyframes, drag to move, select to edit ease

let keyframes = [
  { time: 0, value: [200, 200, 0], interpolationOut: 'bezier', interpolationIn: 'bezier', outEase: {influence: 33, speed: 0}, inEase: {influence: 33, speed: 0} },
  { time: 2, value: [400, 400, 0], interpolationOut: 'bezier', interpolationIn: 'bezier', outEase: {influence: 33, speed: 0}, inEase: {influence: 33, speed: 0} }
];

let timelineLen = 5; // Display range (seconds)
let timelineStart = 0; // Scroll position (seconds)
let timelineMax = 10; // Overall maximum time (seconds)
let selected = -1;
let dragging = false;
let dragOffset = {x:0, y:0};
let valueMin = 100, valueMax = 500;

function setup() {
  let cnv = createCanvas(700, 500);
  cnv.parent('canvas-container');
  // timelineMax input
  let maxTimeLabel = createSpan(' Timeline Max: ');
  maxTimeLabel.parent('ui');
  let maxTimeInput = createInput(timelineMax.toString(), 'number');
  maxTimeInput.id('timelinemax-input');
  maxTimeInput.style('width','60px');
  maxTimeInput.parent('ui');
  maxTimeInput.input(()=>{
    let val = float(maxTimeInput.value());
    if(val>1 && val>timelineLen){
      timelineMax = val;
      // update scroll and range sliders
      scrollSlider.elt.max = timelineMax-timelineLen;
      if(timelineStart>timelineMax-timelineLen) timelineStart = timelineMax-timelineLen;
      scrollSlider.value(timelineStart);
      rangeSlider.value(timelineLen/timelineMax);
      redraw();
    }
  });
  // Display range slider (ratio)
  let rangeLabel = createSpan(' Display Range: ');
  rangeLabel.parent('ui');
  let rangeSlider = createSlider(0.05, 1.0, timelineLen/timelineMax, 0.01);
  rangeSlider.id('display-range-slider');
  rangeSlider.style('width','120px');
  rangeSlider.parent('ui');
  rangeSlider.input(()=>{
    timelineLen = constrain(rangeSlider.value()*timelineMax, 0.05*timelineMax, timelineMax);
    if(timelineStart>timelineMax-timelineLen) timelineStart = timelineMax-timelineLen;
    scrollSlider.elt.max = timelineMax-timelineLen;
    scrollSlider.value(timelineStart);
    redraw();
  });
  // Scroll bar
  let scrollSlider = createSlider(0, timelineMax-timelineLen, 0, 0.01);
  scrollSlider.id('timeline-scroll');
  scrollSlider.style('width', '400px');
  scrollSlider.parent('ui');
  scrollSlider.input(()=>{
    timelineStart = scrollSlider.value();
    redraw();
  });
  // valueMin/valueMax input
  let minLabel = createSpan(' Value Min: ');
  minLabel.parent('ui');
  let minInput = createInput(valueMin.toString(), 'number');
  minInput.id('valuemin-input');
  minInput.style('width','50px');
  minInput.parent('ui');
  minInput.input(()=>{
    let val = float(minInput.value());
    if(val<valueMax){
      valueMin = val;
      redraw();
    }
  });
  let maxLabel = createSpan(' Value Max: ');
  maxLabel.parent('ui');
  let maxInput = createInput(valueMax.toString(), 'number');
  maxInput.id('valuemax-input');
  maxInput.style('width','50px');
  maxInput.parent('ui');
  maxInput.input(()=>{
    let val = float(maxInput.value());
    if(val>valueMin){
      valueMax = val;
      redraw();
    }
  });
  noLoop();
}

function draw() {
  background(51);
  drawTimeline();
  drawKeyframes();
  drawCurve();
}

function drawTimeline() {
  stroke(100); line(60, height-60, width-40, height-60);
  for(let t=0; t<=timelineLen; t++){
    let timeVal = timelineStart + t;
    let x = timeToX(timeVal);
    stroke(100); line(x, height-65, x, height-55);
    noStroke(); fill(180); textAlign(CENTER); text(nf(timeVal,1,2), x, height-40);
  }
  // Value axis (tick marks)
  let nTicks = 6;
  for(let i=0; i<=nTicks; i++){
    let v = lerp(valueMin, valueMax, i/nTicks);
    let y = valueToY(v);
    stroke(80); line(55, y, 60, y);
    noStroke(); fill(180); textAlign(RIGHT, CENTER); text(nf(v,1,0), 50, y);
    stroke(40,40,40,60); line(60, y, width-40, y);
  }
}

function drawKeyframes() {
  for(let i=0; i<keyframes.length; i++){
    let k = keyframes[i];
    let x = timeToX(k.time);
    let y = valueToY(k.value[1]);
    if(x<60||x>width-40) continue;
    fill(i===selected? 'yellow':'cyan');
    stroke(0); ellipse(x, y, 14, 14);
    // Show interpolation type
    noStroke(); fill(255,180,0); textSize(10);
    text(k.interpolationOut[0].toUpperCase(), x, y-12);
  }
  textSize(12);
}

function drawCurve() {
  noFill(); stroke(255,180,0); strokeWeight(2);
  beginShape();
  for(let t=timelineStart; t<=timelineStart+timelineLen; t+=0.01){
    let v = getValueAtTime(t);
    let x = timeToX(t);
    if(x<60||x>width-40) continue;
    vertex(x, valueToY(v[1]));
  }
  endShape();
}

function mousePressed() {
  if(mouseButton===RIGHT){
    // Right-click to add
    let t = xToTime(mouseX);
    let v = yToValue(mouseY);
    keyframes.push({
      time: constrain(t,0,timelineMax),
      value: [0, constrain(v,valueMin,valueMax), 0],
      interpolationOut: 'bezier', interpolationIn: 'bezier',
      outEase: {influence:33,speed:0}, inEase:{influence:33,speed:0}
    });
    keyframes.sort((a,b)=>a.time-b.time);
    redraw();
    return false;
  }
  // Select
  for(let i=0; i<keyframes.length; i++){
    let k = keyframes[i];
    let x = timeToX(k.time);
    let y = valueToY(k.value[1]);
    if(dist(mouseX, mouseY, x, y)<10){
      selected = i;
      dragging = true;
      dragOffset.x = mouseX-x;
      dragOffset.y = mouseY-y;
      redraw();
      return;
    }
  }
  selected = -1;
  redraw();
}

function mouseDragged() {
  if(dragging && selected>=0){
    let t = xToTime(mouseX-dragOffset.x);
    let v = yToValue(mouseY-dragOffset.y);
    keyframes[selected].time = constrain(t,0,timelineMax);
    keyframes[selected].value[1] = constrain(v,valueMin,valueMax);
    keyframes.sort((a,b)=>a.time-b.time);
    selected = keyframes.findIndex(k=>k===keyframes[selected]);
    redraw();
  }
}

function mouseReleased() {
  dragging = false;
}

function doubleClicked() {
  // Double-click to delete
  for(let i=0; i<keyframes.length; i++){
    let k = keyframes[i];
    let x = timeToX(k.time);
    let y = valueToY(k.value[1]);
    if(dist(mouseX, mouseY, x, y)<10){
      keyframes.splice(i,1);
      selected = -1;
      redraw();
      return;
    }
  }
}

function keyPressed() {
  // 1=hold, 2=linear, 3=bezier
  if(selected>=0){
    let k = keyframes[selected];
    if(key==='a') k.outEase.influence = max(0, k.outEase.influence-5);
    if(key==='d') k.outEase.influence = min(100, k.outEase.influence+5);
    if(key==='w') k.outEase.speed += 10;
    if(key==='s') k.outEase.speed -= 10;
    if(key==='1') { k.interpolationOut = 'hold'; redraw(); }
    if(key==='2') { k.interpolationOut = 'linear'; redraw(); }
    if(key==='3') { k.interpolationOut = 'bezier'; redraw(); }
  }
}

function getValueAtTime(t){
  if(keyframes.length===0) return [0,0,0];
  if(t<=keyframes[0].time) return keyframes[0].value;
  if(t>=keyframes[keyframes.length-1].time) return keyframes[keyframes.length-1].value;
  let i=1;
  while(i<keyframes.length && keyframes[i].time<t) i++;
  let k0 = keyframes[i-1], k1 = keyframes[i];
  let localT = (t-k0.time)/(k1.time-k0.time);
  // HOLD
  if(k0.interpolationOut==='hold'){
    return [0, k0.value[1], 0];
  }
  // LINEAR
  if(k0.interpolationOut==='linear' || k1.interpolationIn==='linear'){
    return [0, lerp(k0.value[1], k1.value[1], localT), 0];
  }
  // BEZIER
  if(k0.interpolationOut==='bezier' && k1.interpolationIn==='bezier'){
    return [
      0,
      cubicBezier(k0.value[1], k0.value[1]+k0.outEase.speed*0.01, k1.value[1]-k1.inEase.speed*0.01, k1.value[1], localT),
      0
    ];
  }
  // fallback: linear
  return [0, lerp(k0.value[1], k1.value[1], localT), 0];
}

function cubicBezier(p0,p1,p2,p3,t){
  let u=1-t;
  return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
}

function timeToX(t){
  return map(t, timelineStart, timelineStart+timelineLen, 60, width-40);
}
function xToTime(x){
  return map(x, 60, width-40, timelineStart, timelineStart+timelineLen);
}
function valueToY(v){
  return map(v,valueMin,valueMax,height-100,100);
}
function yToValue(y){
  return map(y,height-100,100,valueMin,valueMax);
}

function saveJson(){
  let data = [{
    propertyName: 'Position',
    parentName: '',
    layerName: '',
    matchName: 'ADBE Position',
    keys: keyframes.map(k=>({
      time: k.time,
      value: k.value,
      inEase: [k.inEase],
      outEase: [k.outEase],
      interpolationIn: k.interpolationIn,
      interpolationOut: k.interpolationOut
    }))
  }];
  let str = JSON.stringify(data,null,2);
  document.getElementById('output').textContent = str;
  let blob = new Blob([str],{type:'application/json'});
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'animation.json';
  a.click();
}

function loadJson(event){
  let file = event.target.files[0];
  if(!file) return;
  let reader = new FileReader();
  reader.onload = function(e){
    let data = JSON.parse(e.target.result);
    if(data[0] && data[0].keys){
      keyframes = data[0].keys.map(k=>({
        time: k.time,
        value: k.value,
        inEase: k.inEase[0],
        outEase: k.outEase[0],
        interpolationIn: k.interpolationIn,
        interpolationOut: k.interpolationOut
      }));
      keyframes.sort((a,b)=>a.time-b.time);
      // Timeline auto-adjustment
      let last = keyframes[keyframes.length-1];
      if(last && last.time>timelineMax) {
        timelineMax = last.time+1;
        // update timelineMax input and sliders
        let maxTimeInput = select('#timelinemax-input');
        if(maxTimeInput) maxTimeInput.value(timelineMax);
        let rangeSlider = select('#display-range-slider');
        if(rangeSlider) rangeSlider.value(timelineLen/timelineMax);
        let scrollSlider = select('#timeline-scroll');
        if(scrollSlider) scrollSlider.elt.max = timelineMax-timelineLen;
      }
      redraw();
    }
  };
  reader.readAsText(file);
}
