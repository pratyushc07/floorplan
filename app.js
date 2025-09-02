
// Simple frontend that interacts with backend and keeps a local op-queue in localStorage for offline edits.
// No frameworks used for simplicity.

const API = '/api';
let currentFloorId = null;
const canvas = document.getElementById('canvas');
const queueKey = 'floorplan_op_queue';
const floorKey = 'floorplan_cached_floor';
const offlineIndicator = document.getElementById('offlineIndicator');

function log(msg){ console.log('[APP]', msg); }

function saveQueue(q){ localStorage.setItem(queueKey, JSON.stringify(q)); renderQueue(); }
function loadQueue(){ try{ return JSON.parse(localStorage.getItem(queueKey) || '[]'); }catch(e){ return []; } }
function pushOp(op){
  const q = loadQueue();
  q.push(op);
  saveQueue(q);
}

function renderQueue(){
  document.getElementById('queuePre').innerText = JSON.stringify(loadQueue(), null, 2);
}

function setOnlineStatus(){
  const on = navigator.onLine;
  offlineIndicator.innerText = on ? 'ONLINE' : 'OFFLINE';
  offlineIndicator.style.color = on ? 'green' : 'red';
}
window.addEventListener('online', ()=>{ setOnlineStatus(); attemptSync(); });
window.addEventListener('offline', ()=>{ setOnlineStatus(); });

setOnlineStatus();

// load initial floors
async function init(){
  const resp = await fetch(API + '/floors');
  const data = await resp.json();
  if (data.floors && data.floors.length>0){
    currentFloorId = data.floors[0].id;
    loadSnapshot();
  }
}
init();

async function loadSnapshot(){
  if (!currentFloorId) return;
  try {
    const resp = await fetch(API + '/floors/' + currentFloorId);
    const data = await resp.json();
    localStorage.setItem(floorKey, JSON.stringify(data));
    renderFloor(data);
  } catch(err){
    // offline or error: try cached floor
    const cached = JSON.parse(localStorage.getItem(floorKey) || 'null');
    if (cached) renderFloor(cached);
  }
}

function clearCanvas(){ canvas.innerHTML=''; }

function createElement(type, obj){
  const el = document.createElement('div');
  el.className = type;
  el.style.left = (obj.x||10) + 'px';
  el.style.top = (obj.y||10) + 'px';
  el.style.width = (obj.width||80) + 'px';
  el.style.height = (obj.height||40) + 'px';
  el.innerText = obj.name || obj.label || (type==='room' ? 'Room' : 'Seat');
  el.dataset.id = obj.id;
  el.dataset.type = type;
  makeDraggable(el);
  el.addEventListener('dblclick', ()=>{
    const newName = prompt('Edit name/label', el.innerText);
    if (newName !== null){
      el.innerText = newName;
      // update op
      const op = {
        op_id: 'op-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),
        entity_type: type,
        entity_id: obj.id,
        action: 'update',
        payload: { name: newName, x: parseInt(el.style.left), y: parseInt(el.style.top) },
        base_version: obj.version||0,
        timestamp: Date.now(),
        author_id: 'admin-local'
      };
      pushOp(op);
      renderQueue();
      // optimistic update to cached floor
      updateLocalEntity(type, obj.id, op.payload);
    }
  });
  return el;
}

function makeDraggable(el){
  let offset = {x:0,y:0}, dragging=false;
  el.addEventListener('mousedown', (e)=>{
    dragging = true;
    offset.x = e.clientX - el.offsetLeft;
    offset.y = e.clientY - el.offsetTop;
    el.style.transition = 'none';
  });
  window.addEventListener('mousemove', (e)=>{
    if (!dragging) return;
    el.style.left = (e.clientX - offset.x) + 'px';
    el.style.top = (e.clientY - offset.y) + 'px';
  });
  window.addEventListener('mouseup', ()=>{
    if (!dragging) return;
    dragging = false;
    // push update op
    const id = el.dataset.id; const type = el.dataset.type;
    const op = {
      op_id: 'op-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),
      entity_type: type,
      entity_id: id,
      action: 'update',
      payload: { x: parseInt(el.style.left), y: parseInt(el.style.top) },
      base_version: 0,
      timestamp: Date.now(),
      author_id: 'admin-local'
    };
    pushOp(op);
    renderQueue();
    // optimistic update
    updateLocalEntity(type, id, op.payload);
  });
}

function renderFloor(data){
  clearCanvas();
  const rooms = data.rooms || [];
  const seats = data.seats || [];
  rooms.forEach(r=>{
    const el = createElement('room', r);
    canvas.appendChild(el);
  });
  seats.forEach(s=>{
    const el = createElement('seat', s);
    canvas.appendChild(el);
  });
}

// update cached floor entities
function updateLocalEntity(type, id, payload){
  const cached = JSON.parse(localStorage.getItem(floorKey) || '{}');
  const list = type==='room' ? cached.rooms : cached.seats;
  if (!list) return;
  const ent = list.find(x=>x.id===id);
  if (ent) Object.assign(ent, payload);
  localStorage.setItem(floorKey, JSON.stringify(cached));
}

// add seat/room buttons
document.getElementById('addSeat').addEventListener('click', ()=>{
  const cached = JSON.parse(localStorage.getItem(floorKey) || '{}');
  const newId = 's-' + Date.now();
  const seat = { id:newId, label:'Seat', x:10 + Math.random()*200, y:10 + Math.random()*200, version:0 };
  const op = { op_id:'op-' + Date.now() + '-' + Math.random().toString(36).slice(2,8), entity_type:'seat', entity_id:newId, action:'create', payload:seat, base_version: (cached.floor? cached.floor.version:0), timestamp:Date.now(), author_id:'admin-local' };
  pushOp(op);
  // optimistic add to cached floor
  cached.seats = cached.seats || []; cached.seats.push(seat);
  localStorage.setItem(floorKey, JSON.stringify(cached));
  renderFloor(cached);
  renderQueue();
});

document.getElementById('addRoom').addEventListener('click', ()=>{
  const cached = JSON.parse(localStorage.getItem(floorKey) || '{}');
  const newId = 'r-' + Date.now();
  const room = { id:newId, name:'Room', capacity:4, x:10 + Math.random()*300, y:10 + Math.random()*300, version:0 };
  const op = { op_id:'op-' + Date.now() + '-' + Math.random().toString(36).slice(2,8), entity_type:'room', entity_id:newId, action:'create', payload:room, base_version:(cached.floor?cached.floor.version:0), timestamp:Date.now(), author_id:'admin-local' };
  pushOp(op);
  cached.rooms = cached.rooms || []; cached.rooms.push(room);
  localStorage.setItem(floorKey, JSON.stringify(cached));
  renderFloor(cached);
  renderQueue();
});

// sync logic: send queued ops to server
async function attemptSync(){
  const q = loadQueue();
  if (q.length===0) return;
  if (!navigator.onLine) return;
  if (!currentFloorId) return;
  try {
    const resp = await fetch(API + '/floors/' + currentFloorId + '/sync', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ops: q })
    });
    const data = await resp.json();
    if (data.applied && data.applied.length>0){
      // remove applied ops from local queue (naive: clear all for simplicity)
      localStorage.removeItem(queueKey);
      // update cached floor
      const snapshot = data.snapshot || {};
      const cached = { floor: { id: currentFloorId }, rooms: snapshot.rooms || [], seats: snapshot.seats || [] };
      localStorage.setItem(floorKey, JSON.stringify(cached));
      renderFloor(cached);
      renderQueue();
    }
    if (data.conflicts && data.conflicts.length>0){
      alert('Conflicts during sync: ' + JSON.stringify(data.conflicts));
    }
  } catch(err){
    console.error('sync error', err);
  }
}

document.getElementById('syncBtn').addEventListener('click', ()=> attemptSync());

// also try periodic sync every 8 seconds when online
setInterval(()=>{ if (navigator.onLine) attemptSync(); }, 8000);

// suggestions
document.getElementById('suggestBtn').addEventListener('click', async ()=>{
  const p = parseInt(document.getElementById('participants').value || '1');
  // use center of canvas as user location
  const rect = canvas.getBoundingClientRect();
  const x = rect.width/2, y = rect.height/2;
  const start = Date.now() + 60*60*1000; const end = start + 60*60*1000;
  const resp = await fetch(API + '/rooms/suggest?participants=' + p + '&x=' + x + '&y=' + y + '&start=' + start + '&end=' + end);
  const data = await resp.json();
  document.getElementById('suggestionsPre').innerText = JSON.stringify(data.suggestions, null, 2);
});

renderQueue();
