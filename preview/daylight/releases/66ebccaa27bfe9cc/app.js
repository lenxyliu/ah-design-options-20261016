import {products,scenarios,copy} from './data.js';
import {sceneArt} from './scenes.js';
const en=document.documentElement.lang==='en',l=en?1:0,c=copy[en?'en':'zh'];
const $=s=>document.querySelector(s);
let uid=0;
function glyph(index){
 const id='g'+uid++,p=products[index],colors=[['#fafbfb','#b8c8d7','#718eab'],['#b1ceff','#5a8df2','#2753ba'],['#d5f1d8','#87c5a6','#439c83'],['#f1e2ff','#bca2d8','#8c6eae']][index];
 const defs=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset=".35" stop-color="${colors[1]}"/><stop offset=".67" stop-color="${colors[2]}"/><stop offset="1" stop-color="${colors[0]}"/></linearGradient><linearGradient id="${id}e" x1="0" x2="0" y2="1"><stop stop-color="white" stop-opacity=".95"/><stop offset=".5" stop-color="${colors[0]}" stop-opacity=".1"/><stop offset="1" stop-color="${colors[2]}" stop-opacity=".5"/></linearGradient></defs>`;
 const shapes=[
  `<g transform="rotate(-24 100 90)"><ellipse cx="100" cy="88" rx="49" ry="35" fill="none" stroke="url(#${id})" stroke-width="23"/><ellipse cx="100" cy="85" rx="49" ry="35" fill="none" stroke="url(#${id}e)" stroke-width="1.2"/><path d="M57 68c-9 14 2 34 26 44 23 10 49 6 58-8" fill="none" stroke="url(#${id})" stroke-width="22"/></g><circle cx="136" cy="56" r="12" fill="#769bcd"/><circle cx="132" cy="52" r="4" fill="#e9f4ff" opacity=".8"/>`,
  `<g transform="rotate(12 100 90)"><path d="M100 46c22-25 59-3 40 24 34 5 32 48 0 48-1 32-44 33-48 1-29 15-55-18-29-39-25-24 7-57 37-34Z" fill="url(#${id})" stroke="url(#${id}e)" stroke-width="1.8"/><circle cx="101" cy="86" r="20" fill="#e8f1ff"/><path d="M84 75c11-14 33-8 35 7" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.6"/></g>`,
  `<g transform="rotate(-31 100 90)"><rect x="42" y="60" width="78" height="50" rx="25" fill="none" stroke="url(#${id})" stroke-width="18"/><rect x="84" y="75" width="78" height="50" rx="25" fill="none" stroke="url(#${id})" stroke-width="18"/><path d="M48 80c0-14 12-20 27-20h23M112 75h22c16 0 27 11 27 25" fill="none" stroke="url(#${id}e)" stroke-width="1.4"/></g>`,
  `<g transform="translate(0 -5)"><path d="m100 104 56 24-56 27-56-27Z" fill="url(#${id})" stroke="url(#${id}e)" stroke-width="1.2"/><path d="m100 74 56 24-56 27-56-27Z" fill="url(#${id})" stroke="url(#${id}e)" stroke-width="1.2"/><path d="m100 44 56 24-56 27-56-27Z" fill="url(#${id})" stroke="url(#${id}e)" stroke-width="1.2"/><path d="m65 68 35 16 35-16" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="1"/></g>`
 ];return `<div class="glyph" aria-hidden="true"><svg viewBox="0 0 200 180" fill="none">${defs}${shapes[index]}</svg></div>`;
}
$('#hero-products').innerHTML=products.map((p,i)=>`<button class="hero-product tilt" data-product="${i}" style="--tile-bg:${p.bg}" aria-label="${c.preview} ${p.name}"><span class="tile-order">0${i+1}</span><span class="tile-arrow" aria-hidden="true">↗</span>${glyph(i)}<h3>${p.name}</h3><p>${p.short[l]}</p></button>`).join('');
$('#matrix').innerHTML=products.map((p,i)=>`<article class="product-card tilt compact" id="${p.id}" style="--tile-bg:${p.bg}"><div class="product-topline"><strong>${p.name}</strong><span>${p.label[l]}</span></div><h3>${p.title[l]}</h3><p class="description">${p.description[l]}</p><div class="product-tags">${p.tags[l].map(t=>`<span>${t}</span>`).join('')}</div>${sceneArt(p.kind,en)}<button class="product-link" data-product="${i}" aria-label="${c.learn} ${p.name}">${c.learn}<span aria-hidden="true">↗</span></button></article>`).join('');
const stories=[scenarios[0],scenarios[1],scenarios[3],scenarios[4],scenarios[2]],sceneBgs={weekly:'#f1f1e9',team:'#e4edf7',service:'#f7e6df',skills:'#e7f3e5',workspace:'#eee8f6'};
const mobileQuery=matchMedia('(max-width:700px)'),reduceQuery=matchMedia('(prefers-reduced-motion:reduce)'),fineQuery=matchMedia('(pointer:fine)');
let mobile=mobileQuery.matches,motion=!reduceQuery.matches,paused=false,sceneHover=false,sceneFocus=false,dragging=false,dragOrigin=0,dragPos=0,skipClick=false;
let position=1.5,target=null,activeStory=2,visible=true,last=performance.now(),lastScroll=scrollY;
const carousel=$('.carousel'),track=$('#scene-track');
function renderTrack(){
 if(mobile){position=0;activeStory=0;}
 const count=mobile?5:10;
 track.innerHTML=Array.from({length:count},(_,i)=>{const s=stories[i%5];return `<button class="scene-card" data-scene="${i%5}" aria-label="${s.title[l].replace('\n',' ')} ${products[s.product].name}" style="--scene-bg:${sceneBgs[s.kind]}">${sceneArt(s.kind,en)}<div class="scene-copy"><span class="scene-tag">${s.tag[l]}</span><h3>${s.title[l]}</h3><div class="scene-product">${products[s.product].name}<span aria-hidden="true">↗</span></div></div></button>`;}).join('');
 $('.scene-indicators').innerHTML=stories.map((s,i)=>`<button data-scene-to="${i}" aria-label="${s.title[l].replace('\n',' ')}" ${activeStory===i?'class="active" aria-current="true"':''}></button>`).join('');
 if(mobile)carousel.scrollLeft=0;
}
renderTrack();
function setActiveStory(i){i=(i%5+5)%5;if(i===activeStory)return;activeStory=i;document.querySelectorAll('[data-scene-to]').forEach((b,j)=>{b.classList.toggle('active',j===i);b.setAttribute('aria-current',j===i?'true':'false');});}
function mobileDestination(index){const card=track.children[index];return card.offsetLeft+card.offsetWidth/2-carousel.clientWidth/2;}
function moveScene(delta){if(mobile){const next=(activeStory+delta+5)%5;carousel.scrollTo({left:mobileDestination(next),behavior:motion?'smooth':'instant'});return;} target=Math.round(target??position)+delta;if(!motion){position=target;target=null;}}
$('#scene-prev').addEventListener('click',()=>moveScene(-1));$('#scene-next').addEventListener('click',()=>moveScene(1));
$('.scene-indicators').addEventListener('click',e=>{const b=e.target.closest('[data-scene-to]');if(!b)return;const i=+b.dataset.sceneTo;if(mobile){carousel.scrollTo({left:mobileDestination(i),behavior:motion?'smooth':'instant'});}else{const cycle=Math.round((position-i)/5);target=i+cycle*5;if(!motion){position=target;target=null;}}});
function pauseLabel(){const b=$('#scene-pause');b.setAttribute('aria-label',paused?c.play:c.pause);b.setAttribute('aria-pressed',paused?'true':'false');b.innerHTML=`<span aria-hidden="true">${paused?'▷':'Ⅱ'}</span>`;}
$('#scene-pause').addEventListener('click',()=>{paused=!paused;pauseLabel();});
carousel.addEventListener('pointerenter',()=>sceneHover=true);carousel.addEventListener('pointerleave',()=>sceneHover=false);carousel.addEventListener('focusin',()=>sceneFocus=true);carousel.addEventListener('focusout',()=>sceneFocus=false);
carousel.addEventListener('pointerdown',e=>{if(mobile||e.button!==0)return;dragOrigin=e.clientX;dragPos=position;dragging=false;target=null;});
carousel.addEventListener('pointermove',e=>{if(mobile||!(e.buttons&1))return;const dx=e.clientX-dragOrigin;if(Math.abs(dx)>6&&!dragging){dragging=true;carousel.setPointerCapture(e.pointerId);}if(dragging){position=dragPos-dx/(carousel.clientWidth<1000?285:310);skipClick=true;}});
function endDrag(){if(dragging){dragging=false;target=Math.round(position);setTimeout(()=>skipClick=false,180);}}
carousel.addEventListener('pointerup',endDrag);carousel.addEventListener('pointercancel',endDrag);
carousel.addEventListener('scroll',()=>{if(mobile){const center=carousel.scrollLeft+carousel.clientWidth/2;let nearest=0,distance=Infinity;[...track.children].forEach((card,i)=>{const d=Math.abs(card.offsetLeft+card.offsetWidth/2-center);if(d<distance){distance=d;nearest=i;}});setActiveStory(nearest);}},{passive:true});
carousel.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();moveScene(e.key==='ArrowRight'?1:-1);}});
mobileQuery.addEventListener('change',()=>{mobile=mobileQuery.matches;target=null;renderTrack();setActiveStory(mobile?0:Math.round(position));});
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.target===carousel)visible=e.isIntersecting;},{rootMargin:'100px'});observer.observe(carousel);
const tilts=[];
document.querySelectorAll('.tilt').forEach(el=>{
 const state={el,x:0,y:0,tx:0,ty:0,vx:0,vy:0,over:false,layers:[...el.querySelectorAll('[data-depth]')]};tilts.push(state);
 el.addEventListener('pointermove',e=>{if(!fineQuery.matches||!motion)return;const r=el.getBoundingClientRect();state.tx=(e.clientX-r.left)/r.width*2-1;state.ty=(e.clientY-r.top)/r.height*2-1;state.over=true;el.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');el.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');});
 el.addEventListener('pointerleave',()=>{state.over=false;state.tx=state.ty=0;});
});
let intent=0;
function recommend(index){intent=index;const pi=[0,1,1,2,3][index],p=products[pi];document.querySelectorAll('.intent').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',i===index?'true':'false');});$('#recommendation').innerHTML=`${glyph(pi)}<p>${c.forYou}</p><h3>${p.name}</h3><p class="rec-description">${index===2?(en?'Build your knowledge and workflows into your own AI products and services.':'将企业知识与业务流程融入自有 AI 产品与服务。'):p.description[l]}</p><a class="button primary" href="${p.url}" target="_blank" rel="noopener noreferrer">${c.openProduct}<span aria-hidden="true">↗</span></a>`;}
$('.intent-list').innerHTML=c.intents.map((text,i)=>`<button class="intent" data-intent="${i}" aria-pressed="${i===0}"><span>${text}</span><span aria-hidden="true">↗</span></button>`).join('');
$('.intent-list').addEventListener('click',e=>{const b=e.target.closest('[data-intent]');if(b)recommend(+b.dataset.intent);});recommend(0);
const dialog=$('#product-dialog');let openIndex=null,openScene=null,previousFocus=null;
function openProduct(i,scene=null){
 const p=products[i];openIndex=i;openScene=scene;previousFocus=document.activeElement;
 $('#dialog-content').innerHTML=`<p class="dialog-product">${p.name} · ${p.label[l]}</p><h2 class="dialog-title" id="dialog-title">${p.title[l]}</h2><p class="dialog-description">${p.description[l]}</p>${scene?`<div class="scene-dialog-copy"><h3>${scene.title[l]}</h3><p>${scene.description[l]}</p></div>`:''}<div class="dialog-feature-list">${(en?p.featuresEn:p.features).map(f=>`<article><h3>${f[0]}</h3><p>${f[1]}</p></article>`).join('')}</div><a class="button primary" href="${p.url}" target="_blank" rel="noopener noreferrer">${c.link}<span aria-hidden="true">↗</span></a><p class="dialog-note">${c.legal}</p>`;
 document.body.classList.add('dialog-open');dialog.showModal();$('.dialog-close').focus();updateLanguage();
}
function closeProduct(){dialog.close();}
dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');openIndex=openScene=null;updateLanguage();previousFocus?.focus({preventScroll:true});});
$('.dialog-close').addEventListener('click',closeProduct);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeProduct();}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-product]');if(b)openProduct(+b.dataset.product);const s=e.target.closest('[data-scene]');if(s&&!skipClick){const story=stories[+s.dataset.scene];openProduct(story.product,story);}});
function updateLanguage(){const a=$('.language'),u=new URL(c.langUrl,location.href);u.hash=location.hash;if(openIndex!==null)u.searchParams.set('product',products[openIndex].id);u.searchParams.set('intent',intent);a.href=u.pathname+u.search+u.hash;}
window.addEventListener('hashchange',updateLanguage);document.addEventListener('click',e=>{if(e.target.closest('[data-intent]'))updateLanguage();});updateLanguage();
function setMotion(value){motion=value&&!reduceQuery.matches;document.body.classList.toggle('no-motion',!motion);$('#motion').textContent=(motion?'Ⅱ ':'▷ ')+(motion?c.motion:c.motionOn);$('#motion').setAttribute('aria-pressed',motion?'false':'true');for(const t of tilts){if(!motion){t.el.style.transform='';for(const layer of t.layers)layer.style.translate='';t.x=t.y=t.tx=t.ty=t.vx=t.vy=0;}}$('#scene-pause').disabled=!motion;}
$('#motion').addEventListener('click',()=>setMotion(!motion));reduceQuery.addEventListener('change',()=>setMotion(!reduceQuery.matches));setMotion(motion);
let raf=0;
function frame(now){
 const dt=Math.min((now-last)/1000,.08);last=now;
 if(!document.hidden){
  if(!mobile){
   if(target!==null){const delta=target-position;position+=delta*(motion?1-Math.exp(-dt*6):1);if(Math.abs(delta)<.002){position=target;target=null;}}
   else if(visible&&motion&&!paused&&!sceneFocus&&!dragging&&!dialog.open)position+=dt*.075*(sceneHover?.25:1);
   const width=carousel.clientWidth,spacing=width<1000?285:310,radius=Math.max(1500,width*1.25);
   track.querySelectorAll('.scene-card').forEach((el,i)=>{const r=(((i-position+5)%10)+10)%10-5,x=r*spacing,y=x*x/(2*radius)+12;el.style.transform=`translate3d(${x}px,${y}px,0)`;const show=Math.abs(x)<width/2+160;el.style.visibility=show?'visible':'hidden';el.tabIndex=show?0:-1;el.setAttribute('aria-hidden',show?'false':'true');});
   setActiveStory(Math.round(position));
  }
  if(motion)for(const s of tilts){if(Math.abs(s.x-s.tx)+Math.abs(s.y-s.ty)+Math.abs(s.vx)+Math.abs(s.vy)<.0001)continue;const step=Math.min(dt,.032);s.vx+=(s.tx-s.x)*120*step;s.vy+=(s.ty-s.y)*120*step;s.vx*=Math.exp(-18*step);s.vy*=Math.exp(-18*step);s.x+=s.vx*step;s.y+=s.vy*step;s.el.style.transform=`perspective(1000px) rotateX(${-s.y*5.5}deg) rotateY(${s.x*7}deg) translateY(${-2*Math.min(1,Math.abs(s.x)+Math.abs(s.y))}px)`;for(const layer of s.layers){const depth=+layer.dataset.depth;layer.style.translate=`${s.x*depth*.14}px ${s.y*depth*.11}px`;}}
 }
 raf=requestAnimationFrame(frame);
}
raf=requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{last=performance.now();});
let scrollTimer=0;window.addEventListener('scroll',()=>{if(!scrollTimer)scrollTimer=requestAnimationFrame(()=>{const d=scrollY-lastScroll;if(visible&&motion&&!mobile&&!paused&&!dragging&&!sceneFocus&&Math.abs(d)<300)position+=d*.00028;lastScroll=scrollY;scrollTimer=0;});},{passive:true});
document.querySelector('.hero').addEventListener('pointermove',e=>{if(motion&&fineQuery.matches)$('.hero').style.setProperty('--sun-x',(e.clientX/innerWidth-.5)*35+'px');});
const params=new URLSearchParams(location.search),initialIntent=+params.get('intent');if(initialIntent>0&&initialIntent<5)recommend(initialIntent);if(params.has('product')){const i=products.findIndex(p=>p.id===params.get('product'));if(i>=0)openProduct(i);}updateLanguage();
window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));
window.addEventListener('pageshow',e=>{if(e.persisted){last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}});
