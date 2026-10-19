import {products,scenarios,copy} from './data.js';
import {sceneArt} from './scenes.js';
import {glyph} from './visuals.js';
import {catalogMarkup} from './catalog.js';
const en=document.documentElement.lang==='en',l=en?1:0,c=copy[en?'en':'zh'];
const $=s=>document.querySelector(s);
const reduceQuery=matchMedia('(prefers-reduced-motion:reduce)'),fineQuery=matchMedia('(pointer:fine)');
let motion=!reduceQuery.matches,paused=false,activeScene=0,elapsed=0,last=performance.now(),raf=0,sceneVisible=false,sceneHover=false,sceneFocus=false,skipClick=false;
const stories=[scenarios[0],scenarios[1],scenarios[2],scenarios[3],scenarios[4]];
const shortScenes=en?['The weekly review','Shared team expertise','Your AI services','Specialist skills','Your own workspace']:['每周工作复盘','团队经验复用','自有 AI 服务','拓展专业技能','自有知识空间'];
const defaultCaption=en?'Choose a product. Explore what it makes possible.':'选择一款产品，探索它能带来的可能。';
$('#hero-products').innerHTML=products.map((p,i)=>`<button class="hero-product" data-product="${i}" data-hero="${i}" aria-label="${c.preview} ${p.name}"><span class="node-number">0${i+1}</span>${glyph(i)}<h3>${p.name}</h3><p>${p.short[l]}</p></button>`).join('');
$('#matrix').innerHTML=catalogMarkup(products,en,glyph,sceneArt);
const sceneTabs=$('.scene-tabs'),scenePanel=$('#scene-panel'),sceneStage=$('#scene-stage');
sceneTabs.innerHTML=stories.map((s,i)=>`<button class="scene-tab${i===0?' active':''}" id="scene-tab-${i}" role="tab" aria-selected="${i===0}" aria-controls="scene-panel" tabindex="${i===0?'0':'-1'}" data-scene-to="${i}"><span class="tab-index">0${i+1}</span><span class="tab-label">${shortScenes[i]}</span></button>`).join('');
let stageParallax=null;
function selectScene(index,animate=true){
 activeScene=(index+stories.length)%stories.length;elapsed=0;const s=stories[activeScene],p=products[s.product];
 $('#scene-description').innerHTML=`<p class="scene-category">${s.tag[l]}</p><h3>${s.title[l]}</h3><p>${s.description[l]}</p><button class="scene-product-link" data-scene="${activeScene}" aria-label="${c.sceneMore} ${p.name}">${p.name}<span aria-hidden="true">↗</span></button>`;
 $('#scene-visual').innerHTML=sceneArt(s.kind,en);$('#scene-visual').classList.remove('is-entering');
 if(animate&&motion){void $('#scene-visual').offsetWidth;$('#scene-visual').classList.add('is-entering');}
 $('#scene-counter').textContent=`0${activeScene+1} / 05`;$('.stage-mark').textContent=`AH / 0${activeScene+1}`;scenePanel.setAttribute('aria-labelledby','scene-tab-'+activeScene);
 sceneTabs.querySelectorAll('.scene-tab').forEach((tab,i)=>{tab.classList.toggle('active',i===activeScene);tab.setAttribute('aria-selected',String(i===activeScene));tab.tabIndex=i===activeScene?0:-1;tab.style.setProperty('--progress',i===activeScene?'0':'0');});
 const selected=sceneTabs.children[activeScene],r=selected.getBoundingClientRect(),listRect=sceneTabs.getBoundingClientRect();if(sceneTabs.scrollWidth>sceneTabs.clientWidth)sceneTabs.scrollTo({left:sceneTabs.scrollLeft+r.left-listRect.left-(sceneTabs.clientWidth-r.width)/2,behavior:motion?'smooth':'instant'});
 if(stageParallax){for(const layer of stageParallax.layers)layer.style.translate='';stageParallax.layers=[...sceneStage.querySelectorAll('[data-depth]')];stageParallax.x=stageParallax.y=stageParallax.tx=stageParallax.ty=stageParallax.vx=stageParallax.vy=0;}
 updateLanguage();
}
$('#scene-prev').addEventListener('click',()=>selectScene(activeScene-1));$('#scene-next').addEventListener('click',()=>selectScene(activeScene+1));
sceneTabs.addEventListener('click',e=>{const b=e.target.closest('[data-scene-to]');if(b)selectScene(+b.dataset.sceneTo);});
sceneTabs.addEventListener('keydown',e=>{let next=null;if(e.key==='ArrowRight')next=activeScene+1;if(e.key==='ArrowLeft')next=activeScene-1;if(e.key==='Home')next=0;if(e.key==='End')next=4;if(next!==null){e.preventDefault();selectScene(next);sceneTabs.children[activeScene].focus({preventScroll:true});}});
$('#scene-pause').addEventListener('click',()=>{paused=!paused;$('#scene-pause').setAttribute('aria-pressed',String(paused));$('#scene-pause').setAttribute('aria-label',paused?c.play:c.pause);$('#scene-pause').textContent=paused?'▷':'Ⅱ';});
scenePanel.addEventListener('pointerenter',()=>sceneHover=true);scenePanel.addEventListener('pointerleave',()=>sceneHover=false);
$('.scene-shell').addEventListener('focusin',()=>sceneFocus=true);$('.scene-shell').addEventListener('focusout',e=>sceneFocus=$('.scene-shell').contains(e.relatedTarget));
new IntersectionObserver(entries=>{sceneVisible=entries[0].isIntersecting;},{threshold:.15}).observe(scenePanel);
let swipe=null;
sceneStage.addEventListener('pointerdown',e=>{if(e.button!==0)return;swipe={id:e.pointerId,x:e.clientX,y:e.clientY,last:e.clientX,dragging:false};});
sceneStage.addEventListener('pointermove',e=>{if(!swipe||swipe.id!==e.pointerId)return;swipe.last=e.clientX;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;if(!swipe.dragging&&Math.abs(dx)>16&&Math.abs(dx)>Math.abs(dy)*1.2){swipe.dragging=true;sceneStage.setPointerCapture(e.pointerId);}if(swipe.dragging)e.preventDefault();});
sceneStage.addEventListener('pointerup',()=>{if(swipe?.dragging){const dx=swipe.last-swipe.x;if(Math.abs(dx)>45)selectScene(activeScene+(dx<0?1:-1));skipClick=true;setTimeout(()=>skipClick=false,180);}swipe=null;});sceneStage.addEventListener('pointercancel',()=>swipe=null);
window.addEventListener('pointerup',()=>swipe=null);window.addEventListener('pointercancel',()=>swipe=null);window.addEventListener('blur',()=>swipe=null);
const parallax=[];
function bindParallax(el,surface=null){
 const s={el,surface,layers:[...el.querySelectorAll('[data-depth]')],x:0,y:0,tx:0,ty:0,vx:0,vy:0};parallax.push(s);
 el.addEventListener('pointermove',e=>{if(!motion||!fineQuery.matches)return;const r=el.getBoundingClientRect();s.tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));s.ty=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));});
 el.addEventListener('pointerleave',()=>{s.tx=s.ty=0;});return s;
}
$('#hero-products').querySelectorAll('.hero-product').forEach(el=>{bindParallax(el,el.querySelector('.glyph'));const show=()=>{$('#field-caption-text').textContent=products[+el.dataset.hero].short[l];};const reset=()=>{$('#field-caption-text').textContent=defaultCaption;};el.addEventListener('pointerenter',show);el.addEventListener('pointerleave',reset);el.addEventListener('focus',show);el.addEventListener('blur',reset);});
document.querySelectorAll('.catalog-art').forEach(el=>bindParallax(el));
let intent=0,openIndex=null,openScene=null,previousFocus=null;
const dialog=$('#product-dialog');
function recommend(index){intent=index;const pi=[0,1,1,2,3][index],p=products[pi];document.querySelectorAll('.intent').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',i===index?'true':'false');});$('#recommendation').innerHTML=`${glyph(pi)}<p>${c.forYou}</p><h3>${p.name}</h3><p class="rec-description">${index===2?(en?'Build your knowledge and workflows into your own AI products and services.':'将企业知识与业务流程融入自有 AI 产品与服务。'):p.description[l]}</p><a class="button primary" href="${p.url}" target="_blank" rel="noopener noreferrer">${c.openProduct}<span aria-hidden="true">↗</span></a>`;updateLanguage();}
$('.intent-list').innerHTML=c.intents.map((text,i)=>`<button class="intent" data-intent="${i}" aria-pressed="${i===0}"><span>${text}</span><span aria-hidden="true">↗</span></button>`).join('');
$('.intent-list').addEventListener('click',e=>{const b=e.target.closest('[data-intent]');if(b)recommend(+b.dataset.intent);});
function openProduct(i,scene=null){
 const p=products[i];openIndex=i;openScene=scene;previousFocus=document.activeElement;
 $('#dialog-content').innerHTML=`<p class="dialog-product">${p.name} · ${p.label[l]}</p><h2 class="dialog-title" id="dialog-title">${p.title[l]}</h2><p class="dialog-description">${p.description[l]}</p>${scene?`<div class="scene-dialog-copy"><h3>${scene.title[l]}</h3><p>${scene.description[l]}</p></div>`:''}<div class="dialog-feature-list">${(en?p.featuresEn:p.features).map(f=>`<article><h3>${f[0]}</h3><p>${f[1]}</p></article>`).join('')}</div><a class="button primary" href="${p.url}" target="_blank" rel="noopener noreferrer">${c.link}<span aria-hidden="true">↗</span></a><p class="dialog-note">${c.legal}</p>`;
 document.body.classList.add('dialog-open');dialog.showModal();$('.dialog-close').focus();updateLanguage();
}
dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');openIndex=openScene=null;updateLanguage();previousFocus?.focus({preventScroll:true});});
$('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-product]');if(b)openProduct(+b.dataset.product);const s=e.target.closest('[data-scene]');if(s&&!skipClick){const story=stories[+s.dataset.scene];openProduct(story.product,story);}});
function updateLanguage(){const a=$('.language');if(!a)return;const u=new URL(c.langUrl,location.href);u.hash=location.hash;u.searchParams.set('scene',activeScene);if(typeof intent!=='undefined')u.searchParams.set('intent',intent);const expanded=document.querySelector('.catalog-entry[open]');u.searchParams.set('catalog',expanded?.id??'none');if(typeof openIndex!=='undefined'&&openIndex!==null)u.searchParams.set('product',products[openIndex].id);a.href=u.pathname+u.search+u.hash;}
window.addEventListener('hashchange',updateLanguage);document.querySelectorAll('.catalog-entry').forEach(el=>el.addEventListener('toggle',updateLanguage));
function setMotion(value){motion=value&&!reduceQuery.matches;document.body.classList.toggle('no-motion',!motion);$('#motion').textContent=(motion?'Ⅱ ':'▷ ')+(motion?c.motion:c.motionOn);$('#motion').setAttribute('aria-pressed',motion?'false':'true');$('#motion').disabled=reduceQuery.matches;$('#scene-pause').disabled=!motion;for(const s of parallax){if(!motion){if(s.surface)s.surface.style.transform='';for(const layer of s.layers)layer.style.translate='';s.x=s.y=s.tx=s.ty=s.vx=s.vy=0;}}}
$('#motion').addEventListener('click',()=>setMotion(!motion));reduceQuery.addEventListener('change',()=>setMotion(!reduceQuery.matches));
selectScene(0,false);stageParallax=bindParallax(sceneStage);recommend(0);setMotion(motion);
const params=new URLSearchParams(location.search),initialScene=Number(params.get('scene')),initialIntent=Number(params.get('intent'));if(Number.isInteger(initialScene)&&initialScene>0&&initialScene<5)selectScene(initialScene,false);if(Number.isInteger(initialIntent)&&initialIntent>0&&initialIntent<5)recommend(initialIntent);if(params.has('catalog')){const entries=[...document.querySelectorAll('.catalog-entry')],chosen=entries.find(el=>el.id===params.get('catalog'));if(chosen)chosen.open=true;else if(params.get('catalog')==='none')entries.forEach(el=>el.open=false);}if(params.has('product')){const i=products.findIndex(p=>p.id===params.get('product'));if(i>=0)openProduct(i);}updateLanguage();
function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;if(!document.hidden){if(motion&&!paused&&sceneVisible&&!sceneHover&&!sceneFocus&&!dialog.open&&!swipe){elapsed+=dt;if(elapsed>=10)selectScene(activeScene+1);sceneTabs.children[activeScene].style.setProperty('--progress',Math.min(1,elapsed/10));}if(motion)for(const s of parallax){if(Math.abs(s.x-s.tx)+Math.abs(s.y-s.ty)+Math.abs(s.vx)+Math.abs(s.vy)<.0001)continue;const step=Math.min(dt,.032);s.vx+=(s.tx-s.x)*120*step;s.vy+=(s.ty-s.y)*120*step;s.vx*=Math.exp(-18*step);s.vy*=Math.exp(-18*step);s.x+=s.vx*step;s.y+=s.vy*step;if(s.surface)s.surface.style.transform=`perspective(750px) rotateX(${-s.y*8}deg) rotateY(${s.x*11}deg) translateY(${-2*Math.abs(s.x)}px)`;for(const layer of s.layers){const depth=+layer.dataset.depth;layer.style.translate=`${s.x*depth*.16}px ${s.y*depth*.12}px`;}}}raf=requestAnimationFrame(frame);}
raf=requestAnimationFrame(frame);document.addEventListener('visibilitychange',()=>last=performance.now());window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));window.addEventListener('pageshow',e=>{if(e.persisted){last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}});
