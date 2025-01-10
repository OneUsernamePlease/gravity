var K=Object.defineProperty;var W=(e,t,n)=>t in e?K(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var u=(e,t,n)=>W(e,typeof t!="symbol"?t+"":t,n);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const m of r.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&i(m)}).observe(document,{childList:!0,subtree:!0});function n(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(o){if(o.ep)return;o.ep=!0;const r=n(o);fetch(o.href,r)}})();class s{constructor(t,n){t===void 0&&(t=0),n===void 0&&(n=0),this.x=t,this.y=n}toString(){return`x: ${this.x}, y: ${this.y}`}static add(...t){return t.reduce((n,i)=>({x:n.x+i.x,y:n.y+i.y}),{x:0,y:0})}static subtract(t,n){return{x:t.x-n.x,y:t.y-n.y}}static scale(t,n){return{x:t.x*n,y:t.y*n}}static dotProduct(t,n){return t.x*n.x+t.y*n.y}static magnitude(t){return Math.sqrt(t.x*t.x+t.y*t.y)}static normalize(t){const n=this.magnitude(t);return n===0?{x:0,y:0}:this.scale(t,1/n)}static distance(t,n){return Math.sqrt((n.x-t.x)**2+(n.y-t.y)**2)}static displacementVector(t,n){return this.subtract(n,t)}static hadamardProduct(t,n){return{x:t.x*n.x,y:t.y*n.y}}}const x=class x{constructor(t,n,i,o){u(this,"_mass");u(this,"_radius");u(this,"_color");u(this,"_movable");o===void 0&&(o=(3*t/(4*Math.PI*x.defaultDensity))**(1/3)),i===void 0&&(i="white"),n===void 0&&(n=!0),this.mass=t,this.radius=o,this.color=i,this.movable=n}get mass(){return this._mass}set mass(t){this._mass=t}get radius(){return this._radius}set radius(t){this._radius=t}get movable(){return this._movable}set movable(t){this._movable=t}get color(){return this._color}set color(t){CSS.supports("color",t)||(t="white"),this._color=t}};u(x,"defaultDensity",1);let p=x;class X{constructor(){u(this,"_objectStates");u(this,"_running");u(this,"_tickCount");u(this,"_tickLength");u(this,"_collisionDetection");u(this,"_g");u(this,"gravityLowerBounds",1);this._objectStates=[],this._running=!1,this._tickCount=0,this._tickLength=10,this._collisionDetection=!1,this._g=1}get objectStates(){return this._objectStates}set objectStates(t){this._objectStates=t}get running(){return this._running}set running(t){this._running=t}get tickCount(){return this._tickCount}set tickCount(t){this._tickCount=t}get tickLength(){return this._tickLength}set tickLength(t){this._tickLength=t}get collisionDetection(){return this._collisionDetection}set collisionDetection(t){this._collisionDetection=t}get g(){return this._g}set g(t){this._g=Math.max(t,Number.MIN_VALUE)}addObject(t){return t.body.movable||(t.velocity=new s(0,0),t.acceleration=new s(0,0)),this.objectStates.push(t),this.objectStates.length}clearObjects(){this.objectStates=[]}pause(){this.running=!1}nextState(){this.updateAccelerationVectors(),this.objectStates.forEach(t=>{this.updateVelocityAndPosition(t)}),this.tickCount++}updateAccelerationVectors(){const t=new Map;for(let n=0;n<this.objectStates.length;n++)for(let i=n+1;i<this.objectStates.length;i++){const o=this.calculateForceBetweenBodies(n,i),r=s.scale(o,-1);t.set(n,s.add(t.get(n)||new s(0,0),o)),t.set(i,s.add(t.get(i)||new s(0,0),r))}this.objectStates.forEach((n,i)=>{const o=t.get(i);let r=o!==void 0?o:new s(0,0);r=s.scale(r,1/n.body.mass),n.acceleration=r})}updateVelocityAndPosition(t){const n=this.tickLength/1e3;t.body.movable&&(t.velocity=s.add(t.velocity,s.scale(t.acceleration,n)),t.position=s.add(t.position,s.scale(t.velocity,n)))}calculateForceBetweenBodies(t,n){const i=this.objectStates[t],o=this.objectStates[n],r=s.distance(i.position,o.position);if(r<this.gravityLowerBounds||r===0)return new s(0,0);const m=this.g*(i.body.mass*o.body.mass/(r*r)),y=s.normalize(s.subtract(o.position,i.position));return s.scale(y,m)}run(){if(this.running)return;this.running=!0;const t=()=>{this.running&&(setTimeout(t,this.tickLength),this.nextState())};t()}log(t){const n=new Date,i=n.getHours().toString().padStart(2,"0"),o=n.getMinutes().toString().padStart(2,"0"),r=n.getSeconds().toString().padStart(2,"0"),m=n.getMilliseconds().toString().padStart(3,"0"),y=`${i}:${o}:${r}.${m}`;console.log(`[${y}] ${t}`)}}function G(e){return e=e.trim(),!isNaN(+e)&&e.length!==0}function Q(e){let t=document.getElementById(e);return t instanceof HTMLInputElement?t.value.trim():""}function tt(e){let t=Q(e);return G(t)?+t:0}function j(e){const t=document.getElementById(e);return t?t.checked:!1}var C=(e=>(e[e.None=0]="None",e[e.AddBody=1]="AddBody",e[e.ScrollCvs=2]="ScrollCvs",e))(C||{}),I=(e=>(e[e.Up=0]="Up",e[e.Down=1]="Down",e))(I||{});let a,d,L={fields:[]},l,c,et=25,g=!1,S=1,nt=.1,D,v=0,N=new s(0,0),B;document.addEventListener("DOMContentLoaded",R);function R(){ut(),it(),mt(1280,720),c={origin:{x:0,y:0},zoomFactor:1,orientationY:-1},D=j("cvsCbxDisplayVectors"),l=new X,B=document.querySelector('input[name="cvsRadioBtnMouseAction"]:checked').value,document.removeEventListener("DOMContentLoaded",R)}function it(){var e,t,n,i,o,r,m,y,P,T,z,$,O,F;(e=document.getElementById("cvsBtnStartSim"))==null||e.addEventListener("click",Lt),(t=document.getElementById("cvsBtnToggleSim"))==null||t.addEventListener("click",Et),(n=document.getElementById("cvsBtnResetSim"))==null||n.addEventListener("click",Z),(i=document.getElementById("cvsBtnZoomOut"))==null||i.addEventListener("click",xt),(o=document.getElementById("cvsBtnZoomIn"))==null||o.addEventListener("click",Bt),(r=document.getElementById("cvsBtnScrollLeft"))==null||r.addEventListener("click",pt),(m=document.getElementById("cvsBtnScrollRight"))==null||m.addEventListener("click",yt),(y=document.getElementById("cvsBtnScrollUp"))==null||y.addEventListener("click",vt),(P=document.getElementById("cvsBtnScrollDown"))==null||P.addEventListener("click",St),(T=document.getElementById("theCanvas"))==null||T.addEventListener("mousedown",ct),(z=document.getElementById("theCanvas"))==null||z.addEventListener("mouseup",rt),($=document.getElementById("theCanvas"))==null||$.addEventListener("mouseout",lt),(O=document.getElementById("theCanvas"))==null||O.addEventListener("mousemove",at),(F=document.getElementById("cvsCbxDisplayVectors"))==null||F.addEventListener("change",ot),document.querySelectorAll('input[name="cvsRadioBtnMouseAction"]').forEach(Y=>{Y.addEventListener("change",st)})}function ot(e){const t=e.target;D=t?t.checked:!1,g||h()}function st(e){const t=e.target;t&&t.type==="radio"&&(B=t.value)}function ct(e){if(e.button!==0)return;v=1;const t=A(e);switch(C[B]){case 0:U("LMouse Button:"+I[v]+" - at Position: "+t.toString());break;case 1:N=t;break}}function rt(e){if(e.button!==0)return;const t=A(e);switch(C[B]){case 0:break;case 1:const n=dt();if(n.mass<=0)break;const i=bt(E(N),E(t));M(n,E(t),i);break}g||h(),v=0,U("LMouse Button:"+I[v])}function at(e){v=0}function lt(e){v=0}function A(e){const t=a.getBoundingClientRect(),n=e.clientX-t.left,i=e.clientY-t.top;return new s(n,i)}function ut(){const e="statusText";let t=1,n=document.getElementById(e+t);for(;n!==null;)L.fields.push(n),t++,n=document.getElementById(e+t)}function dt(){const e=tt("massInput"),t=j("cvsCbxBodyMovable");return new p(e,t)}function f(e,t,n=!1){let i;typeof t=="number"?i=L.fields[t-1]:typeof t=="string"?i=document.getElementById(t):i=L.fields[0],n?i.innerHTML+=e:i.innerHTML=e}function mt(e,t){a=document.getElementById("theCanvas"),a.width=e,a.height=t,d=a.getContext("2d"),f(`Canvas dimension: ${e} * ${t}`,5)}function U(e){const t=new Date,n=t.getHours().toString().padStart(2,"0"),i=t.getMinutes().toString().padStart(2,"0"),o=t.getSeconds().toString().padStart(2,"0"),r=t.getMilliseconds().toString().padStart(3,"0"),m=`${n}:${i}:${o}.${r}`;console.log(`[${m}] ${e}`)}function V(e,t,n){n===void 0&&(n="white");let i=s.add(e,t);d.beginPath(),d.lineWidth=3,d.strokeStyle=n,d.moveTo(e.x,e.y),d.lineTo(i.x,i.y),d.stroke()}function gt(e,t){let n=Math.max(e.radius/c.zoomFactor,1);d.beginPath(),d.arc(t.x,t.y,n,0,Math.PI*2),d.closePath(),d.fillStyle=e.color,d.fill()}function ft(){l.objectStates.forEach(t=>{t!==null&&gt(t.body,_(t.position))})}function h(){d.clearRect(0,0,a.width,a.height),ft(),D&&ht()}function ht(){l.objectStates.forEach(e=>{V(_(e.position),H(e.acceleration),"green"),V(_(e.position),H(e.velocity),"red")})}function _(e){const t=s.subtract(e,c.origin),n={x:t.x,y:t.y*-1};return s.scale(n,1/c.zoomFactor)}function H(e){const t={x:e.x,y:e.y*-1};return s.scale(t,1/c.zoomFactor)}function E(e){let t;return t=s.add(s.hadamardProduct(s.scale(e,c.zoomFactor),{x:1,y:c.orientationY}),c.origin),t}function b(e){c.origin=e,g||h()}function yt(){let e=w("horizontal");b({x:c.origin.x+e,y:c.origin.y})}function pt(){let e=w("horizontal");b({x:c.origin.x-e,y:c.origin.y})}function vt(){let e=w("vertical");b({x:c.origin.x,y:c.origin.y+e})}function St(){let e=w("vertical");b({x:c.origin.x,y:c.origin.y-e})}function w(e,t){switch(t===void 0&&(t=nt),e){case"horizontal":return a.width*t*c.zoomFactor;case"vertical":return a.height*t*c.zoomFactor}}function xt(){const e={x:a.width/2,y:a.height/2},t=c.zoomFactor+S;let n=s.scale(e,S);c.origin={x:c.origin.x-n.x,y:c.origin.y+n.y},c.zoomFactor=t,f(`Zoom: ${t} (m per pixel)`,4),g||h()}function Bt(){if(c.zoomFactor<=1)return;let e={x:a.width/2,y:a.height/2},t=c.zoomFactor-S,n=s.scale(e,S);c.origin={x:c.origin.x+n.x,y:c.origin.y-n.y},c.zoomFactor=t,f(`Zoom: ${t} (m per pixel)`,4),g||h()}function bt(e,t,n=1){n<=0&&(n=1);let i=s.subtract(e,t);return s.scale(i,1/n)}function wt(){a.width,a.height;let e={x:640,y:-360},t={x:1140,y:-410},n={x:0,y:0},i={x:-110,y:-110};M(k(1e7,50),e,n),M(k(1e6,40),t,i)}function Et(e){l.running?q():_t()}function Z(){l.running&&q(),l.clearObjects(),l.tickCount=0,h(),f(`Simulation Tick: ${l.tickCount}`,2)}function M(e,t,n,i){e===void 0&&(e=k()),t===void 0&&(t={x:0,y:0}),n===void 0&&(n={x:0,y:0});const o={body:e,position:t,velocity:n,acceleration:{x:0,y:0}};l.addObject(o)}function Lt(){Z(),f("Simulation running",1),document.getElementById("cvsBtnToggleSim").innerHTML="Pause",wt(),l.run(),J()}function _t(){l.running||(l.run(),J(),f("Simulation running",1),document.getElementById("cvsBtnToggleSim").innerHTML="Pause")}function q(){l.running&&(g=!1,l.pause(),f("Simulation paused",1),document.getElementById("cvsBtnToggleSim").innerHTML="Play")}function J(){if(g)return;g=!0;const e=()=>{g&&(setTimeout(e,et),h(),f(`Simulation Tick: ${l.tickCount}`,2))};e()}function k(e,t){let n;return e===void 0?n=new p(Mt(20,200)):t===void 0?n=new p(e):n=new p(e,!0,"white",t),n}function Mt(e,t){return Math.floor(Math.random()*(t-e+1)+e)}
//# sourceMappingURL=index-DebiYrdB.js.map
