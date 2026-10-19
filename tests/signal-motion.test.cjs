const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {plan,createController}=require('../signal-motion.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../prototype.js'),'utf8');
const geometry=vm.runInNewContext(source.slice(0,source.indexOf('const escapeHTML'))+'; JSON.parse(JSON.stringify(geometry))');
function host(){const listeners={};return {addEventListener(t,f){(listeners[t]??=[]).push(f)},removeEventListener(){},dispatch(t,e={}){for(const f of listeners[t]||[])f(e)}}}
function harness(){
 const timers=new Map(),history=new Map();let id=0,observer;
 const media=Object.assign(host(),{matches:false});
 const body={blocked:false,matches(){return this.blocked}};
 const document=Object.assign(host(),{body,hidden:false,createElementNS(){return {attributes:{},setAttribute(k,v){this.attributes[k]=v},classList:{add(){}},animate(frames,options){const a={frames,options,cancelled:false,finished:Promise.resolve(),cancel(){this.cancelled=true}};return a}}}});
 const window=Object.assign(host(),{matchMedia:()=>media,setTimeout(fn){timers.set(++id,fn);history.set(id,fn);return id},clearTimeout(i){timers.delete(i)},MutationObserver:class{constructor(fn){observer=fn}observe(){}disconnect(){}}});
 const control={isConnected:true,disabled:false,dataset:{},classes:new Set(),layer:[],matches(){return this.disabled},closest(){return this},contains(other){return other===this},removeAttribute(name){if(name==='data-signal-scheme')delete this.dataset.signalScheme},querySelectorAll(){return [{replaceChildren:()=>{this.layer=[]}}]},querySelector(){return {dataset:{glyph:'attention'},getBoundingClientRect:()=>({width:22}),querySelector:()=>({append:p=>this.layer.push(p)})}}};
 // closest('.static-sample') is a membership check; event target lookup is separate.
 control.closest=()=>null;control.classList={add:(...names)=>names.forEach(n=>control.classes.add(n)),remove:(...names)=>names.forEach(n=>control.classes.delete(n))};
 const target={closest:()=>control};
 const fire=(type,extra={})=>document.dispatch(type,{target,relatedTarget:null,...extra});
 const controller=createController({document,window,geometry});
 return {document,window,control,fire,controller,timers,history,media,observe:()=>observer()};
}
test('all glyphs sample only their exact stable body paths, bounded size and linewidth',()=>{
 for(const shape of Object.values(geometry))for(const size of [14,16,18,22,24,32])for(let scheme=0;scheme<4;scheme++){
  const p=plan(shape,size,scheme);assert.equal(p.fragments.length,size<=18?1:2);
  assert.ok(p.duration<=600);
  for(const f of p.fragments){assert.ok(shape.body.includes(f.d));assert.ok(f.start+f.length<=100);assert.ok(f.width<=1.8);assert.ok(Math.abs(f.dx)*size/24<=3.5);if(size<=18)assert.ok(f.width<=1)}
 }
});
test('four finite asymmetric schemes; randomness resolved before playback',()=>{
 const plans=[0,.26,.51,.76].map(n=>plan(geometry.attention,22,-1,()=>n));
 assert.deepEqual(plans.map(p=>p.scheme),[0,1,2,3]);
 assert.equal(new Set(plans.map(p=>JSON.stringify(p.fragments))).size,4);
 for(const p of plans)assert.notEqual(p.fragments[0].delay,p.fragments[1].delay);
});
test('helper rays, reticles, trails are not body geometry',()=>{
 assert.equal(geometry.attention.body.length,2);assert.equal(geometry.search.body.length,2);assert.equal(geometry.send.body.length,2);
 assert.ok(!JSON.stringify(geometry).includes('M2 8v5 M22 8v5'));
});
test('hover and focus merge; activation replaces instead of stacking',()=>{
 const h=harness();h.fire('pointerover');const first=[...h.timers.keys()][0];assert.equal(h.control.layer.length,2);
 h.fire('focusin');assert.equal([...h.timers.keys()][0],first);assert.equal(h.timers.size,1);
 h.fire('click');assert.equal(h.timers.size,1);assert.equal(h.control.layer.length,2);assert.notEqual([...h.timers.keys()][0],first);
 h.controller.clearAll();assert.equal(h.control.layer.length,0);assert.equal(h.timers.size,0);
});
test('old callbacks cannot clear a replacement; exit and reentry work',()=>{
 const h=harness();h.fire('pointerover');const old=[...h.history.values()][0];h.fire('click');old();assert.equal(h.control.layer.length,2);
 h.fire('pointerout');assert.equal(h.control.layer.length,0);assert.equal(h.timers.size,0);
 h.fire('pointerover');assert.equal(h.control.layer.length,2);
});
test('press, drag-out and focus loss clean without dispatching business clicks',()=>{
 const h=harness();let clicks=0;h.document.addEventListener('click',()=>clicks++);
 h.fire('pointerover');h.fire('pointerdown');assert.equal(h.control.layer.length,0);
 h.fire('pointerout');h.fire('pointerup');assert.equal(clicks,0);assert.equal(h.timers.size,0);
 h.fire('focusin');h.fire('focusout');assert.equal(h.control.layer.length,0);
 h.fire('click');assert.equal(clicks,1);
});
test('disable, detach, motion-off, OS reduce and blur cancel all active effects',()=>{
 for(const mode of ['disabled','detached','off','reduce','blur']){
  const h=harness();h.fire('pointerover');
  if(mode==='disabled')h.control.disabled=true;
  if(mode==='detached')h.control.isConnected=false;
  if(mode==='off')h.document.body.blocked=true;
  if(mode==='reduce'){h.media.matches=true;h.media.dispatch('change')}
  if(mode==='blur')h.window.dispatch('blur');else h.observe();
  assert.equal(h.control.layer.length,0,mode);assert.equal(h.timers.size,0,mode);
 }
});
test('blocked mode does not schedule decoration; enabling does not replay old input',()=>{
 const h=harness();h.document.body.blocked=true;h.fire('pointerover');assert.equal(h.timers.size,0);
 h.document.body.blocked=false;h.observe();assert.equal(h.timers.size,0);
 h.fire('pointerout');h.fire('pointerover');assert.equal(h.timers.size,1);
});
test('current CSS has no body animation/scale scripts',()=>{
 const css=fs.readFileSync(require('node:path').join(__dirname,'../style.css'),'utf8');
 assert.ok(!css.includes('scale(.82)')&&!css.includes('scale(0.82)'));
 for(const old of ['bell-field','clapper','lens-sample','corner-unfold','transmit-head','sample-left','sample-right'])assert.ok(!css.includes(old),old);
});
