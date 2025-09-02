// Bezier Animation Editor (p5.js)
// Simple 1-track, only supports Position (3D)
// Right-click to add keyframes, drag to move, select to edit ease

let keyframesArray = [[
  { time: 0, value: [200, 200, 0], interpolationOut: 'bezier', interpolationIn: 'bezier', outEase: {influence: 33, speed: 0}, inEase: {influence: 33, speed: 0} },
  { time: 2, value: [400, 400, 0], interpolationOut: 'bezier', interpolationIn: 'bezier', outEase: {influence: 33, speed: 0}, inEase: {influence: 33, speed: 0} }
]];

let metaDataArray = [
  {
    propertyName: 'Position',
    parentName: '',
    layerName: '',
    matchName: 'ABDE Position'
  }
];
let selectedTrackIndex = 0;

let timelineLen = 5; // Display range (seconds)
let timelineStart = 0; // Scroll position (seconds)
let timelineMax = 10; // Overall maximum time (seconds)
let selected = -1;
let selectedValueIndex = 0; // en: Editing target value component index (default 0: X component)
let dragging = false;
let dragOffset = {x:0, y:0};
let outHandleBackup = null; // {influence, speed} temporally backup
let draggingHandle = null; // 'out' or 'in'
let valueMin = 0, valueMax = 500;

function getValueArray(val) {
  if (Array.isArray(val)) return val;
  return [val];
}
function getValueIndex(val, idx) {
  if (Array.isArray(val)) return val[idx];
  return idx === 0 ? val : undefined;
}
function setValueIndex(val, idx, v) {
  if (Array.isArray(val)) {
    val[idx] = v;
    return val;
  } else if (idx === 0) {
    return v;
  } else {
    return val;
  }
}

function setup() {

  let ui = document.getElementById('ui');

  // Track switching UI
  let trackDiv = document.createElement('div');
  trackDiv.id = 'track-controls';
  trackDiv.style.marginBottom = '8px';
  // metadata input
  let metaDiv = document.createElement('div');
  metaDiv.id = 'meta-info';
  metaDiv.style.marginBottom = '8px';
  if (ui) {
    ui.insertBefore(trackDiv, ui.firstChild);
    ui.insertBefore(metaDiv, trackDiv.nextSibling);
  }

  let trackSelect = document.createElement('select');
  trackSelect.id = 'track-select';
  // WORKAROUND: always add Track 0 option in initial state
  if (keyframesArray.length === 1) {
    let opt = document.createElement('option');
    opt.value = 0;
    opt.textContent = 'Track 0';
    trackSelect.appendChild(opt);
  }
  window.updateTrackSelect = function() {
    const trackSelect = document.getElementById('track-select');
    if (!trackSelect) return;
    trackSelect.innerHTML = '';
    for (let i = 0; i < keyframesArray.length; i++) {
      let opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Track ${i}`;
      trackSelect.appendChild(opt);
    }
    // If the selected index is out of range, set it to 0
    if (selectedTrackIndex < 0 || selectedTrackIndex >= keyframesArray.length) selectedTrackIndex = 0;
    trackSelect.value = selectedTrackIndex;
  };
  window.updateTrackSelect();
  trackSelect.addEventListener('change', (e) => {
    selectedTrackIndex = parseInt(e.target.value);
    // Update meta information UI
    updateMetaInputs();
    redraw();
  });
  trackDiv.appendChild(trackSelect);

  let addBtn = document.createElement('button');
  addBtn.textContent = 'Add';
  addBtn.title = 'Add Track';
  addBtn.onclick = () => {
    keyframesArray.push([]);
    metaDataArray.push({propertyName:'',parentName:'',layerName:'',matchName:''});
    selectedTrackIndex = keyframesArray.length-1;
    updateTrackSelect();
    updateMetaInputs();
    redraw();
  };
  trackDiv.appendChild(addBtn);

  let delBtn = document.createElement('button');
  delBtn.textContent = 'Del';
  delBtn.title = 'Delete Track';
  delBtn.onclick = () => {
    if (keyframesArray.length <= 1) return;
    keyframesArray.splice(selectedTrackIndex,1);
    metaDataArray.splice(selectedTrackIndex,1);
    if (selectedTrackIndex >= keyframesArray.length) selectedTrackIndex = keyframesArray.length-1;
    updateTrackSelect();
    updateMetaInputs();
    redraw();
  };
  trackDiv.appendChild(delBtn);

  window.updateMetaInputs = function() {
    const metaProps = ['propertyName','parentName','layerName','matchName'];
    metaProps.forEach(prop => {
      let input = document.getElementById('meta-'+prop);
      if (input) input.value = metaDataArray[selectedTrackIndex][prop] || '';
    });
  };

  createValueIndexSelector();
  
  const metaProps = ['propertyName','parentName','layerName','matchName'];
  metaProps.forEach(prop => {
    let label = document.createElement('label');
    label.textContent = prop+': ';
    label.style.marginRight = '4px';
    let input = document.createElement('input');
    input.type = 'text';
    input.value = metaDataArray[selectedTrackIndex][prop] || '';
    input.id = 'meta-'+prop;
    input.style.marginRight = '12px';
    // Update metaDataArray on input
    input.addEventListener('input', (e) => {
      metaDataArray[selectedTrackIndex][prop] = e.target.value;
    });
    metaDiv.appendChild(label);
    metaDiv.appendChild(input);
  });

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

function createValueIndexSelector() {
  // Remove existing selector and button
  const old = document.getElementById('value-index-selector');
  if (old) old.remove();
  const oldAdd = document.getElementById('value-index-add');
  if (oldAdd) oldAdd.remove();
  const oldDel = document.getElementById('value-index-del');
  if (oldDel) oldDel.remove();

  // Get the length of the value array
  let len = 1;
  if (keyframesArray[selectedTrackIndex].length > 0) {
    len = getValueArray(keyframesArray[selectedTrackIndex][0].value).length;
  }
  // Create selector
  const sel = document.createElement('select');
  sel.id = 'value-index-selector';
  sel.style.margin = '0 8px';
  for (let i = 0; i < len; ++i) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Value Index ${i}`;
    sel.appendChild(opt);
  }
  sel.value = selectedValueIndex;
  sel.onchange = (e) => {
    selectedValueIndex = parseInt(e.target.value);
    redraw();
  };

  const addBtn = document.createElement('button');
  addBtn.id = 'value-index-add';
  addBtn.textContent = 'Add';
  addBtn.title = 'Add Value Index';
  addBtn.style.marginRight = '2px';
  addBtn.onclick = () => {
    keyframesArray.forEach((track, tIdx) => {
      track.forEach((kf, kIdx) => {
        let v = getValueArray(kf.value);
        if (!Array.isArray(kf.value)) {
          kf.value = [kf.value];
          v = kf.value;
        }
        v.push(0);
      });
    });
    selectedValueIndex = len;
    updateValueIndexSelector();
    redraw();
  };

  const delBtn = document.createElement('button');
  delBtn.id = 'value-index-del';
  delBtn.textContent = 'Del';
  delBtn.title = 'Delete Value Index';
  delBtn.onclick = () => {
    if (len <= 1) return;
    keyframesArray.forEach((track, tIdx) => {
      track.forEach((kf, kIdx) => {
        let v = getValueArray(kf.value);
        if (Array.isArray(kf.value)) {
          v.splice(selectedValueIndex, 1);
          if (v.length === 1) {
            kf.value = v[0];
          }
        }
      });
    });
    selectedValueIndex = 0;
    updateValueIndexSelector();
    redraw();
  };

  const ui = document.getElementById('ui');
  const metaDiv = document.getElementById('meta-info');
  if (ui && metaDiv) {
    ui.insertBefore(sel, metaDiv.nextSibling);
    ui.insertBefore(addBtn, sel.nextSibling);
    ui.insertBefore(delBtn, addBtn.nextSibling);
  }
}

function updateValueIndexSelector() {
  createValueIndexSelector();
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
  for(let i=0; i<keyframesArray[selectedTrackIndex].length; i++){
    let k = keyframesArray[selectedTrackIndex][i];
    let x = timeToX(k.time);
    let y = valueToY(getValueIndex(k.value, selectedValueIndex));
    if(x<60||x>width-40) continue;
    fill(i===selected? 'yellow':'cyan');
    stroke(0); ellipse(x, y, 14, 14);
    // Show interpolation type
    noStroke(); fill(255,180,0); textSize(10);
    text(k.interpolationOut[0].toUpperCase(), x, y-12);
  }
  // Bezier handle drawing
  drawHandles();
  textSize(12);
}

function drawHandles() {
  if(selected<0 || selected>=keyframesArray[selectedTrackIndex].length-1) return;
  let k0 = keyframesArray[selectedTrackIndex][selected], k1 = keyframesArray[selectedTrackIndex][selected+1];
  let t0 = k0.time, t1 = k1.time;
  let v0 = getValueIndex(k0.value, selectedValueIndex), v1 = getValueIndex(k1.value, selectedValueIndex);
  let dt = t1-t0;
  if(dt<=0) return;
  // Control point calculation
  let p0x = timeToX(t0), p0y = valueToY(v0);
  let p3x = timeToX(t1), p3y = valueToY(v1);
  let p1x = timeToX(t0 + (t1-t0)*k0.outEase.influence/100.0);
  let p1y = valueToY(v0 + k0.outEase.speed*dt*(k0.outEase.influence/100.0));
  let p2x = timeToX(t1 - (t1-t0)*k1.inEase.influence/100.0);
  let p2y = valueToY(v1 - k1.inEase.speed*dt*(k1.inEase.influence/100.0));
  // Guide lines
  stroke(120,180,255,120); strokeWeight(1);
  line(p0x,p0y,p1x,p1y); line(p3x,p3y,p2x,p2y);
  // Handles
  fill('orange'); stroke(0); ellipse(p1x,p1y,10,10);
  fill('lime'); stroke(0); ellipse(p2x,p2y,10,10);
}

function drawCurve() {
  noFill(); stroke(255,180,0); strokeWeight(2);
  beginShape();
  for(let t=timelineStart; t<=timelineStart+timelineLen; t+=0.01){
    let v = getValueAtTime(t);
    let x = timeToX(t);
    if(x<60||x>width-40) continue;
    vertex(x, valueToY(v[selectedValueIndex]));
  }
  endShape();
}

function mousePressed() {
  // Bezier handle hit detection
  draggingHandle = null;
  if(selected>=0 && selected<keyframesArray[selectedTrackIndex].length-1){
    let k0 = keyframesArray[selectedTrackIndex][selected], k1 = keyframesArray[selectedTrackIndex][selected+1];
    let t0 = k0.time, t1 = k1.time;
  let v0 = getValueIndex(k0.value, selectedValueIndex), v1 = getValueIndex(k1.value, selectedValueIndex);
    let dt = t1-t0;
    if(dt>0){
      let p1x = timeToX(t0 + (t1-t0)*k0.outEase.influence/100.0);
      let p1y = valueToY(v0 + k0.outEase.speed*dt*(k0.outEase.influence/100.0));
      let p2x = timeToX(t1 - (t1-t0)*k1.inEase.influence/100.0);
      let p2y = valueToY(v1 - k1.inEase.speed*dt*(k1.inEase.influence/100.0));
      if(dist(mouseX,mouseY,p1x,p1y)<10){ draggingHandle='out'; dragOffset.x=mouseX-p1x; dragOffset.y=mouseY-p1y; return; }
      if(dist(mouseX,mouseY,p2x,p2y)<10){ draggingHandle='in'; dragOffset.x=mouseX-p2x; dragOffset.y=mouseY-p2y; return; }
    }
  }
  if(mouseButton===RIGHT){
    // Right-click to add
    let t = xToTime(mouseX);
    let v = yToValue(mouseY);
    // When adding, match the length of the existing keyframe's value array
    let arrLen = 1;
    if (keyframesArray[selectedTrackIndex].length>0) {
      arrLen = getValueArray(keyframesArray[selectedTrackIndex][0].value).length;
    }
    let valArr = arrLen === 1 ? constrain(v,valueMin,valueMax) : new Array(arrLen).fill(0);
    if (arrLen > 1) valArr[selectedValueIndex] = constrain(v,valueMin,valueMax);
    keyframesArray[selectedTrackIndex].push({
      time: constrain(t,0,timelineMax),
      value: valArr,
      interpolationOut: 'bezier', interpolationIn: 'bezier',
      outEase: {influence:33,speed:0}, inEase:{influence:33,speed:0}
    });
    keyframesArray[selectedTrackIndex].sort((a,b)=>a.time-b.time);
    redraw();
    return false;
  }
  // Select
  for(let i=0; i<keyframesArray[selectedTrackIndex].length; i++){
    let k = keyframesArray[selectedTrackIndex][i];
  let x = timeToX(k.time);
  let y = valueToY(getValueIndex(k.value, selectedValueIndex));
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
  if(draggingHandle && selected>=0 && selected<keyframesArray[selectedTrackIndex].length-1){
    let k0 = keyframesArray[selectedTrackIndex][selected], k1 = keyframesArray[selectedTrackIndex][selected+1];
    let t0 = k0.time, t1 = k1.time;
  let v0 = getValueIndex(k0.value, selectedValueIndex), v1 = getValueIndex(k1.value, selectedValueIndex);
    let dt = t1-t0;
    let px = mouseX-dragOffset.x, py = mouseY-dragOffset.y;
    if(draggingHandle==='out'){
      // out handle
      let relT = constrain((xToTime(px)-t0)/(t1-t0), 0, 1);
      k0.outEase.influence = relT*100;
      let relV = yToValue(py)-v0;
      k0.outEase.speed = dt>0 && relT>0 ? relV/(dt*relT) : 0;
    }else if(draggingHandle==='in'){
      // in handle
      let relT = constrain((t1-xToTime(px))/(t1-t0), 0, 1);
      k1.inEase.influence = relT*100;
      let relV = v1-yToValue(py);
      k1.inEase.speed = dt>0 && relT>0 ? relV/(dt*relT) : 0;
    }
    redraw();
    return;
  }
  if(dragging && selected>=0){
    let t = xToTime(mouseX-dragOffset.x);
    let v = yToValue(mouseY-dragOffset.y);
  keyframesArray[selectedTrackIndex][selected].time = constrain(t,0,timelineMax);
  let curVal = keyframesArray[selectedTrackIndex][selected].value;
  keyframesArray[selectedTrackIndex][selected].value = setValueIndex(curVal, selectedValueIndex, constrain(v,valueMin,valueMax));
  keyframesArray[selectedTrackIndex].sort((a,b)=>a.time-b.time);
  selected = keyframesArray[selectedTrackIndex].findIndex(k=>k===keyframesArray[selectedTrackIndex][selected]);
  redraw();
  }
}

function mouseReleased() {
  dragging = false;
  draggingHandle = null;
}

function doubleClicked() {
  // Double-click to delete
  for(let i=0; i<keyframesArray[selectedTrackIndex].length; i++){
    let k = keyframesArray[selectedTrackIndex][i];
  let x = timeToX(k.time);
  let y = valueToY(getValueIndex(k.value, selectedValueIndex));
    if(dist(mouseX, mouseY, x, y)<10){
      keyframesArray[selectedTrackIndex].splice(i,1);
      selected = -1;
      redraw();
      return;
    }
  }
}

function keyPressed() {
  // 1=hold, 2=linear, 3=bezier, L/R=Handle toggle
  if(selected>=0){
    let k = keyframesArray[selectedTrackIndex][selected];
    if(key==='1') { k.interpolationOut = 'hold'; redraw(); }
    if(key==='2') { k.interpolationOut = 'linear'; redraw(); }
    if(key==='3') { k.interpolationOut = 'bezier'; redraw(); }
    // R
    if(key==='r'||key==='R') {
      if(k.outEase.influence===0 && k.outEase.speed===0 && outHandleBackup){
        k.outEase.influence = outHandleBackup.influence>1?outHandleBackup.influence:33;
        k.outEase.speed = Math.abs(outHandleBackup.speed)>0.01?outHandleBackup.speed:0;
        outHandleBackup = null;
      }else{
        outHandleBackup = {influence: k.outEase.influence, speed: k.outEase.speed};
        k.outEase.influence = 0; k.outEase.speed = 0;
      }
      redraw();
    }
    // L
    if((key==='l'||key==='L') && selected>0){
      let kin = keyframesArray[selectedTrackIndex][selected];
      if(kin.inEase.influence===0 && kin.inEase.speed===0 && inHandleBackup){
        kin.inEase.influence = inHandleBackup.influence>1?inHandleBackup.influence:33;
        kin.inEase.speed = Math.abs(inHandleBackup.speed)>0.01?inHandleBackup.speed:0;
        inHandleBackup = null;
      }else{
        inHandleBackup = {influence: kin.inEase.influence, speed: kin.inEase.speed};
        kin.inEase.influence = 0; kin.inEase.speed = 0;
      }
      redraw();
    }
  }
}

function getValueAtTime(t){
  if(keyframesArray[selectedTrackIndex].length===0) return [0,0,0];
  if(t<=keyframesArray[selectedTrackIndex][0].time) return getValueArray(keyframesArray[selectedTrackIndex][0].value);
  if(t>=keyframesArray[selectedTrackIndex][keyframesArray[selectedTrackIndex].length-1].time) return getValueArray(keyframesArray[selectedTrackIndex][keyframesArray[selectedTrackIndex].length-1].value);
  let i=1;
  while(i<keyframesArray[selectedTrackIndex].length && keyframesArray[selectedTrackIndex][i].time<t) i++;
  let k0 = keyframesArray[selectedTrackIndex][i-1], k1 = keyframesArray[selectedTrackIndex][i];
  let localT = (t-k0.time)/(k1.time-k0.time);
  // HOLD
  if(k0.interpolationOut==='hold'){
    let arr = getValueArray(k0.value).slice();
    return arr;
  }
  // LINEAR
  if(k0.interpolationOut==='linear' || k1.interpolationIn==='linear'){
    let arr = getValueArray(k0.value).slice();
    arr[selectedValueIndex] = lerp(getValueIndex(k0.value, selectedValueIndex), getValueIndex(k1.value, selectedValueIndex), localT);
    return arr;
  }
  // BEZIER
  if(k0.interpolationOut==='bezier' && k1.interpolationIn==='bezier'){
    let t0 = k0.time, t1 = k1.time;
    let v0 = getValueIndex(k0.value, selectedValueIndex), v1 = getValueIndex(k1.value, selectedValueIndex);
    let outEase = k0.outEase, inEase = k1.inEase;
    let dt = t1 - t0;
    if(dt <= 0) {
      let arr = getValueArray(k0.value).slice();
      return arr;
    }
    // Control point calculation
    let p0x = 0.0, p3x = 1.0;
    let p1x = outEase.influence / 100.0;
    let p2x = 1.0 - inEase.influence / 100.0;
    let p0y = v0, p3y = v1;
    // speed = change per second
    let p1y = v0 + outEase.speed * dt * (outEase.influence / 100.0);
    let p2y = v1 - inEase.speed * dt * (inEase.influence / 100.0);
    // en: Newton's method for finding t_bez corresponding to localT
    let x = localT;
    let guess = x;
    for(let i=0;i<5;i++){
      let bez_x = cubicBezier(p0x, p1x, p2x, p3x, guess);
      let bez_dx = 3 * (1 - guess) * (1 - guess) * (p1x - p0x)
                 + 6 * (1 - guess) * guess * (p2x - p1x)
                 + 3 * guess * guess * (p3x - p2x);
      if(bez_dx === 0) break;
      guess -= (bez_x - x) / bez_dx;
      if(guess < 0) guess = 0;
      if(guess > 1) guess = 1;
    }
    let t_bez = guess;
    let y = cubicBezier(p0y, p1y, p2y, p3y, t_bez);
    let arr = getValueArray(k0.value).slice();
    arr[selectedValueIndex] = y;
    return arr;
  }
  // fallback: linear
  let arr = getValueArray(k0.value).slice();
  arr[selectedValueIndex] = lerp(getValueIndex(k0.value, selectedValueIndex), getValueIndex(k1.value, selectedValueIndex), localT);
  return arr;
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
  let data = metaDataArray.map((meta, i) => ({
    propertyName: meta.propertyName,
    parentName: meta.parentName,
    layerName: meta.layerName,
    matchName: meta.matchName,
    keys: keyframesArray[i].map(k=>({
      time: k.time,
      value: k.value,
      inEase: [k.inEase],
      outEase: [k.outEase],
      interpolationIn: k.interpolationIn,
      interpolationOut: k.interpolationOut
    }))
  }));
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
    // Restore all tracks
    if(Array.isArray(data) && data.length > 0){
      keyframesArray = [];
      metaDataArray = [];
      data.forEach((track, i) => {
        // Meta information
        const metaProps = ['propertyName','parentName','layerName','matchName'];
        let meta = {};
        metaProps.forEach(prop => {
          meta[prop] = track[prop] !== undefined ? track[prop] : '';
        });
        metaDataArray.push(meta);
        // Keyframes
        if(track.keys){
          let kfs = track.keys.map(k=>({
            time: k.time,
            value: k.value,
            inEase: k.inEase[0],
            outEase: k.outEase[0],
            interpolationIn: k.interpolationIn,
            interpolationOut: k.interpolationOut
          }));
          kfs.sort((a,b)=>a.time-b.time);
          keyframesArray.push(kfs);
        }else{
          keyframesArray.push([]);
        }
      });
      // Track selection index adjustment
      selectedTrackIndex = 0;
      selectedValueIndex = 0;
      // Track select UI update
      let trackSelect = document.getElementById('track-select');
      if(trackSelect && typeof updateTrackSelect === 'function') {
        updateTrackSelect();
        trackSelect.value = 0;
      }
      // Value Index UI update
      updateValueIndexSelector();
      let valueIndexSel = document.getElementById('value-index-selector');
      if(valueIndexSel) valueIndexSel.value = 0;
      // Meta information UI update
      if(typeof updateMetaInputs === 'function') updateMetaInputs();
      // Timeline auto-adjustment (only for the selected track)
      let last = keyframesArray[selectedTrackIndex][keyframesArray[selectedTrackIndex].length-1];
      if(last && last.time>timelineMax) {
        timelineMax = last.time+1;
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
