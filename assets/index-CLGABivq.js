var T=Object.defineProperty;var E=(n,t,e)=>t in n?T(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var d=(n,t,e)=>E(n,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function e(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=e(i);fetch(i.href,o)}})();class r{constructor(t,e){t===void 0&&(t=0),e===void 0&&(e=0),this.x=t,this.y=e}toString(){return`x: ${this.x}, y: ${this.y}`}static add(...t){return t.reduce((e,s)=>({x:e.x+s.x,y:e.y+s.y}),{x:0,y:0})}static subtract(t,e){return{x:t.x-e.x,y:t.y-e.y}}static scale(t,e){return{x:t.x*e,y:t.y*e}}static dotProduct(t,e){return t.x*e.x+t.y*e.y}static magnitude(t){return Math.sqrt(t.x*t.x+t.y*t.y)}static normalize(t){const e=this.magnitude(t);return e===0?{x:0,y:0}:this.scale(t,1/e)}static distance(t,e){return Math.sqrt((e.x-t.x)**2+(e.y-t.y)**2)}static displacementVector(t,e){return this.subtract(e,t)}}class m{constructor(t,e,s,i){d(this,"_mass");d(this,"_radius");d(this,"_color");d(this,"_movable");d(this,"defaultDensity",1);t===void 0&&(t=25),e===void 0&&(e=(3*this.mass/(4*Math.PI*this.defaultDensity))**(1/3)),s===void 0&&(s="white"),i===void 0&&(i=!0),this.mass=t,this.radius=e,this.color=s,this.movable=i}get mass(){return this._mass}set mass(t){this._mass=t}get radius(){return this._radius}set radius(t){this._radius=t}get movable(){return this._movable}set movable(t){this._movable=t}get color(){return this._color}set color(t){CSS.supports("color",t)||(t="white"),this._color=t}}class C{constructor(){d(this,"_objectStates");d(this,"running");d(this,"tickCount");d(this,"_tickLength");d(this,"_g");this._objectStates=[],this.running=!1,this.tickCount=0,this._tickLength=10,this._g=1}get objectStates(){return this._objectStates}get tickLength(){return this._tickLength}set tickLength(t){this._tickLength=t}get g(){return this._g}set g(t){this._g=Math.max(t,Number.MIN_VALUE)}nextBodyState(t){const e=this.tickLength/1e3;t.body.movable&&(t.velocity=r.add(t.velocity,r.scale(t.acceleration,e)),t.position=r.add(t.position,r.scale(t.velocity,e)))}addObject(t){return t.body.movable||(t.velocity=new r(0,0),t.acceleration=new r(0,0)),this._objectStates.push(t),this._objectStates.length}clearObjects(){this._objectStates=[]}pause(){this.running=!1}nextState(){this.updateAccelerationVectors(),this.objectStates.forEach(t=>{this.nextBodyState(t)}),this.tickCount++}updateAccelerationVectors(){const t=new Map;for(let e=0;e<this.objectStates.length;e++)for(let s=e+1;s<this.objectStates.length;s++){const i=this.calculateForceBetweenBodies(e,s),o=r.scale(i,-1);t.set(e,t.has(e)?r.add(t.get(e),i):i),t.set(s,t.has(s)?r.add(t.get(s),o):o)}this.objectStates.forEach((e,s)=>{const i=t.get(s);let o=i!==void 0?i:new r(0,0);o=r.scale(o,1/e.body.mass),e.acceleration=o})}calculateForceBetweenBodies(t,e){const s=this.objectStates[t],i=this.objectStates[e],o=r.distance(s.position,i.position);if(o<1e-10)return new r(0,0);const a=this.g*(s.body.mass*i.body.mass/(o*o)),h=r.normalize(r.subtract(i.position,s.position));return r.scale(h,a)}calculateForcesForBody(t){let e={x:0,y:0};const s=this.objectStates[t];for(let i=0;i<this.objectStates.length;i++){if(i===t)continue;const o=this.objectStates[i],a=r.distance(s.position,o.position);if(a<1e-10)continue;let h=this.g*(s.body.mass*o.body.mass/(a*a)),_=r.normalize(r.subtract(o.position,s.position)),M=r.scale(_,h);e=r.add(e,M)}return e}run(){if(this.running)return;this.running=!0;const t=()=>{this.running&&(this.nextState(),setTimeout(t,this.tickLength),this.log("running simulation step "+this.tickCount))};t()}log(t){const e=new Date,s=e.getHours().toString().padStart(2,"0"),i=e.getMinutes().toString().padStart(2,"0"),o=e.getSeconds().toString().padStart(2,"0"),a=e.getMilliseconds().toString().padStart(3,"0"),h=`${s}:${i}:${o}.${a}`;console.log(`[${h}] ${t}`)}}document.addEventListener("DOMContentLoaded",L);let l,c,p,b,w,u,I=25,g=!1;function L(){p=document.getElementById("statusText1"),b=document.getElementById("statusText2"),w=document.getElementById("statusText3"),O(),j(1280,720),u=new C,document.removeEventListener("DOMContentLoaded",L)}function O(){var n,t;(n=document.getElementById("canvasBtnStartSim"))==null||n.addEventListener("click",H),(t=document.getElementById("canvasBtnToggleSim"))==null||t.addEventListener("click",D)}function f(n,t){t===void 0&&(t=p),t.innerHTML=n}function k(n,t){t===void 0&&(t=p),t.innerHTML+=n}function j(n,t){l=document.getElementById("theCanvas"),l.width=n,l.height=t,c=l.getContext("2d"),k(` - Canvas dimension: ${n} * ${t}`,w)}function B(n,t,e){e===void 0&&(e="white");let s=r.add(n,t);c.beginPath(),c.lineWidth=3,c.strokeStyle=e,c.moveTo(n.x,n.y),c.lineTo(s.x,s.y),c.stroke()}function F(n,t){c.beginPath(),c.arc(t.x,t.y,n.radius,0,Math.PI*2),c.closePath(),c.fillStyle=n.color,c.fill()}function P(){u.objectStates.forEach(t=>{t!==null&&F(t.body,t.position)})}function V(){c.clearRect(0,0,l.width,l.height),P(),$()}function $(){u.objectStates.forEach(n=>{B(n.position,n.acceleration,"green"),B(n.position,n.velocity,"red")})}function A(){let n=l.width,t=l.height,e={x:n/2,y:t/2},s=new r(0,0),i={x:e.x,y:e.y},o={x:e.x+500,y:e.y-50},a={x:0,y:0},h={x:-110,y:110};v(y(1e7,50),i,a,s),v(y(1e3),o,h)}function D(n){u.running?(g=!1,u.pause(),document.getElementById("canvasBtnToggleSim").innerHTML="Resume",f("Simulation paused")):(document.getElementById("canvasBtnToggleSim").innerHTML="Pause",N(),x(),f("Simulation running"))}function v(n,t,e,s,i){if(n===void 0&&(n=y()),t===void 0){const a=S(n.radius,l.width-n.radius),h=S(n.radius,l.height-n.radius);t={x:a,y:h}}e===void 0&&(e={x:0,y:0}),s===void 0&&(s={x:0,y:0});const o={body:n,position:t,velocity:e,acceleration:s};u.addObject(o)}function H(){u.clearObjects(),u.tickCount=0,f("Simulation running"),document.getElementById("canvasBtnToggleSim").innerHTML="Pause",A(),u.run(),x()}function N(){u.running||(u.run(),x())}function x(){if(g)return;g=!0;const n=()=>{g&&(V(),f(`Simulation Tick: ${u.tickCount}`,b),setTimeout(n,I))};n()}function y(n,t){let e;return n===void 0&&t===void 0?e=new m(S(20,200)):t===void 0?e=new m(n):e=new m(n,t),e}function S(n,t){return Math.floor(Math.random()*(t-n+1)+n)}
//# sourceMappingURL=index-CLGABivq.js.map