import {products,resources} from './content.js';
import {createStageMedia} from './stage-media.js';

const $=selector=>document.querySelector(selector);
const byId=id=>products.find(p=>p.id===id);
const dialog=$('#content-dialog');
const content=$('#dialog-content');
const nav=$('#product-navigation');
const labelLayer=$('#scene-labels');
let scene=null,active=null,lastBase='overview',filter=products[0].id,closeTimer=null,mediaTimer=null;
const stageMedia=createStageMedia({container:$('#stage-media-container'),products});
let currentProgress=0,scrollFrame=0,scrollLocked=false,scrollPosition=0,initialRoute=true;
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryShort=['云端启用','企业管控','技能生态','开源自托管'];
nav.innerHTML=products.map((p,i)=>`<button class="product-button" data-product="${p.id}" aria-label="${escape(p.name)}，${categoryShort[i]}" aria-pressed="false"><strong><span class="product-name" data-short="${escape(p.short)}">${escape(p.name)}</span><span class="product-arrow" aria-hidden="true">↗</span></strong><small>${categoryShort[i]}</small></button>`).join('');
labelLayer.innerHTML=products.map(p=>`<span class="scene-label" data-label="${p.id}">${escape(p.name)}</span>`).join('');
const labels=new Map([...labelLayer.children].map(el=>[el.dataset.label,el]));

function navigate(path){const next='#'+path;if(location.hash!==next)history.pushState(null,'',next);route();}
function announce(text){$('#status').textContent=text;}
function setBase(id){
  const product=byId(id);active=product?.id??null;lastBase=product?'product/'+product.id:'overview';
  document.body.dataset.view=product?'focus':'overview';
  $('#focus-copy').hidden=!product;
  if(product){
    $('#focus-breadcrumb').textContent=product.name;
    $('#focus-category').textContent=product.category;
    $('#focus-title').textContent=product.name;
    $('#focus-intro').textContent=product.intro;
    $('#focus-features').innerHTML=product.features.map(f=>`<span>${escape(f.title)}</span>`).join('');
    $('#open-detail').setAttribute('aria-label','深入了解 '+product.name);
  }
  document.querySelectorAll('.product-button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.product===active)));

  document.title=product?`${product.name} · Agent Hosting 设计预览`:'Agent Hosting — 腾讯云智能体托管 · 设计预览';
}
function showDialog(title){
  clearTimeout(closeTimer);
  dialog.setAttribute('aria-label',title);
  dialog.querySelector('.dialog-surface').scrollTop=0;
  if(!dialog.open){scrollPosition=window.scrollY;window.scrollTo({top:scrollPosition,behavior:'instant'});scrollLocked=true;document.documentElement.classList.add('modal-open');dialog.showModal();}
  requestAnimationFrame(()=>requestAnimationFrame(()=>dialog.classList.add('is-visible')));
}
function hideDialog(){
  clearTimeout(closeTimer);dialog.classList.remove('is-visible');
  if(dialog.open)closeTimer=setTimeout(()=>{dialog.close();scrollLocked=false;document.documentElement.classList.remove('modal-open');scene?.setProgress(currentProgress);requestScroll();},reduced?0:320);
}
function closeToBase(){hideDialog();history.replaceState(null,'','#'+lastBase);document.querySelectorAll('.global-nav .nav-link').forEach(b=>b.classList.toggle('is-active',b.dataset.route==='overview'));scene?.setProgress(currentProgress);}

function mediaGraphic(id){
  const shapes={
    lighthouse:`<g class="media-piece"><path d="m230 98 100-54 100 54-100 54z" fill="#245BFF"/><path d="m230 98 100 54v120l-100-54z" fill="#102A50"/><path d="m430 98-100 54v120l100-54z" fill="#3895FF"/></g><g class="media-piece" fill="none" stroke="#34649D" stroke-width=".8"><path d="m182 70 148-80 148 80v196l-148 80-148-80z"/><path d="m182 70 148 80 148-80M330 150v196"/></g>`,
    clawpro:[0,1,2].map((i)=>`<g class="media-piece" transform="translate(0 ${i*57})"><path d="m200 89 130-65 130 65-130 65z" fill="${i===1?'#245BFF':'#FFFFFF'}" stroke="#34649D" stroke-width=".7"/><path d="m200 89 130 65 130-65v12l-130 65-130-65z" fill="${i===1?'#245BFF':'#EAF4FF'}" stroke="#34649D" stroke-width=".7"/></g>`).join(''),
    skillhub:[0,1,2,3].map((i)=>`<g class="media-piece" transform="translate(${i*50} ${i*-17})"><path d="m205 121 80 42v155l-80-42z" fill="${i===2?'#245BFF':'#FFFFFF'}" stroke="#34649D" stroke-width=".7"/><path d="m205 121 24-13 80 42-24 13z" fill="${i===2?'#3895FF':'#EAF4FF'}" stroke="#34649D" stroke-width=".7"/></g>`).join(''),
    octop:`<g class="media-piece" fill="none" stroke="#34649D" stroke-width="1"><path d="m210 125 120-65 120 65v145l-120 65-120-65zM210 125l120 65 120-65M330 190v145"/><path d="m210 125 48 26m-48-26v55m120-120 45 25m-45-25-45 24m165 41-46 25m46-25v55" stroke="#245BFF" stroke-width="3"/></g><g class="media-piece"><path d="m292 170 38-21 38 21-38 21z" fill="#3895FF"/><path d="m292 170 38 21v47l-38-21z" fill="#102A50"/><path d="m368 170-38 21v47l38-21z" fill="#245BFF"/></g>`
  };
  return `<svg class="media-graphic" viewBox="0 0 660 350" aria-label="${escape(byId(id).name)} 结构概念示意，正式产品素材待补充" role="img">${shapes[id]}</svg>`;
}
function renderMedia(p){
  const media=p.media;
  if(media.src&&media.type==='image')return `<div class="media-stage"><img src="${escape(media.src)}" alt="${escape(media.title)}"></div>`;
  if(media.src&&media.type==='video')return `<div class="media-stage"><video controls preload="metadata" poster="${escape(media.poster??'')}"><source src="${escape(media.src)}"></video></div>`;
  return `<div class="media-stage" id="media-stage"><span class="media-stage-topline">${escape(p.name.toUpperCase())} / CONCEPT</span>${mediaGraphic(p.id)}<button class="media-action" data-media-motion>展开结构 ↗</button></div><p class="media-caption">${escape(media.caption)}此处图形为结构概念示意。</p>`;
}
function renderProduct(id){
  const p=byId(id);if(!p)return;
  setBase(id);
  content.innerHTML=`<p class="dialog-kicker">AGENT HOSTING / ${escape(p.name.toUpperCase())}</p><h2 id="dialog-title">${escape(p.name)}</h2><p class="dialog-lead">${escape(p.intro)}</p>${renderMedia(p)}<h3 class="detail-section-title">核心能力</h3><div class="feature-list">${p.features.map((f,i)=>`<article class="feature-entry"><span>0${i+1}</span><h3>${escape(f.title)}</h3><p>${escape(f.text)}</p></article>`).join('')}</div><div class="audience-block"><h3>适合谁</h3><p>${escape(p.audience)}</p></div><div class="detail-actions"><button class="primary-button" data-show-resources="${id}">产品资源 <span aria-hidden="true">↗</span></button><button class="text-link" data-show-applications="${id}">查看应用场景 <span aria-hidden="true">→</span></button></div><p class="editor-note">产品介绍为当前资料的精简示意；正式文案、配图、演示视频与入口可由各产品团队持续替换。</p>`;
  showDialog(p.name+' 产品介绍');
}
function productTabs(){return `<nav class="sheet-nav" aria-label="选择产品内容">${products.map(p=>`<button data-filter="${p.id}" class="${filter===p.id?'is-active':''}">${escape(p.name)}</button>`).join('')}</nav>`;}
function renderApplications(){
  const p=byId(filter);
  content.innerHTML=`<p class="dialog-kicker">AGENT HOSTING / APPLICATIONS</p><h2 id="dialog-title">走进实际工作。</h2><p class="dialog-lead">从一个具体需求出发，找到产品能够参与的工作方式。</p>${productTabs()}${p.scenes.map(s=>`<article class="scene-story"><span class="story-meta">${escape(p.name.toUpperCase())}</span><h3>${escape(s.title)}</h3><p>${escape(s.text)}</p><button class="text-link" data-detail="${p.id}">了解 ${escape(p.name)} <span aria-hidden="true">↗</span></button></article>`).join('')}<p class="editor-note">场景基于当前产品资料整理。此区域预留客户案例、实际操作图与视频；当前未展示客户成效或实际集成结果。</p>`;
  showDialog('应用场景');
}
function renderResources(){
  const p=byId(filter);
  content.innerHTML=`<p class="dialog-kicker">AGENT HOSTING / RESOURCES</p><h2 id="dialog-title">继续探索。</h2><p class="dialog-lead">选择产品，查阅介绍与后续使用资源。</p>${productTabs()}${resources.filter(r=>r.productId===filter).map(r=>`<article class="resource-entry"><div><h3>${escape(r.label)}</h3><p>${escape(r.description)}</p></div>${r.id.endsWith('-overview')?`<button class="text-link" data-detail="${p.id}">查看 <span aria-hidden="true">↗</span></button>`:r.url?`<a class="text-link" href="${escape(r.url)}" target="_blank" rel="noopener">打开 ↗</a>`:`<span class="resource-status">待补充正式素材</span>`}</article>`).join('')}`;
  showDialog('产品资源');
}
function renderFamily(){
  content.innerHTML=`<p class="dialog-kicker">AGENT HOSTING / PRODUCT FAMILY</p><h2 id="dialog-title">找到你的开始方式。</h2><p class="dialog-lead">Agent Hosting 汇聚四款各有侧重的产品。根据你当前的目标选择起点，每个产品保留自己的定位与入口。</p><div class="family-choice-list">${products.map(p=>`<article class="family-choice"><div><small>${escape(p.intent)}</small><h3>${escape(p.name)}</h3><p>${escape(p.intro)}</p></div><span aria-hidden="true">↗</span><button class="text-link" data-product="${p.id}" aria-label="选择 ${escape(p.name)}"></button></article>`).join('')}</div><p class="editor-note">Lighthouse Agent 侧重便捷云端启用；Octop 侧重开源自托管与自主扩展。SkillHub 可服务于已有 Agent 的能力扩展，ClawPro 面向企业的规模化管控。</p>`;
  showDialog('如何选择产品');
}
function route(){
  clearTimeout(mediaTimer);
  const path=location.hash.slice(1).split('/');
  const type=path[0]||'overview';
  document.querySelectorAll('.global-nav .nav-link').forEach(b=>b.classList.toggle('is-active',b.dataset.route===type||(b.dataset.route==='overview'&&(type==='product'||type==='family'))));
  if(type==='product'&&byId(path[1])){
    if(path[2]==='detail'){
      if(initialRoute){const detailHash=location.hash;jumpTo(.20+products.findIndex(p=>p.id===path[1])*.16+.16*.68,'instant');updateScroll();history.replaceState(null,'',detailHash);}
      renderProduct(path[1]);
    }
    else {hideDialog();jumpTo(.20+products.findIndex(p=>p.id===path[1])*.16+.16*.68,initialRoute?'instant':'smooth');announce('当前产品：'+byId(path[1]).name);}
  }else if(type==='applications'){if(!active)setBase('overview');renderApplications();}
  else if(type==='resources'){if(!active)setBase('overview');renderResources();}
  else if(type==='family'){renderFamily();}
  else {hideDialog();jumpTo(0,initialRoute?'instant':'smooth');}
  initialRoute=false;
}
document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.product){navigate('product/'+b.dataset.product);return;}
  if(b.dataset.route){if(active&&['applications','resources'].includes(b.dataset.route))filter=active;navigate(b.dataset.route);return;}
  if(b.hasAttribute('data-close-dialog')||b.classList.contains('dialog-outside')){closeToBase();return;}
  if(b.dataset.detail){navigate('product/'+b.dataset.detail+'/detail');return;}
  if(b.dataset.showResources){filter=b.dataset.showResources;navigate('resources');return;}
  if(b.dataset.showApplications){filter=b.dataset.showApplications;navigate('applications');return;}
  if(b.dataset.filter){filter=b.dataset.filter;const scroll=dialog.querySelector('.dialog-surface').scrollTop;if(location.hash==='#applications')renderApplications();else renderResources();dialog.querySelector('.dialog-surface').scrollTop=scroll;content.querySelector(`[data-filter="${filter}"]`)?.focus({preventScroll:true});return;}
  if(b.hasAttribute('data-media-motion')){$('#media-stage')?.classList.toggle('is-expanded');b.textContent=$('#media-stage')?.classList.contains('is-expanded')?'收起结构 ↙':'展开结构 ↗';}
});
$('.skip-link').addEventListener('click',event=>{event.preventDefault();nav.querySelector('button')?.focus({preventScroll:true});});
$('#brand-home').addEventListener('click',()=>navigate('overview'));
$('#family-guide').addEventListener('click',()=>navigate('family'));
$('#header-explore').addEventListener('click',()=>navigate('family'));
$('#open-detail').addEventListener('click',()=>{if(active)navigate('product/'+active+'/detail');});
dialog.addEventListener('cancel',event=>{event.preventDefault();closeToBase();});
window.addEventListener('hashchange',route);
document.addEventListener('keydown',event=>{
  if(dialog.open)return;
  if(event.key==='Escape'){navigate('overview');return;}
  if((event.key==='ArrowRight'||event.key==='ArrowLeft')&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){
    const index=products.findIndex(p=>p.id===active);const direction=event.key==='ArrowRight'?1:-1;
    navigate('product/'+products[(index+direction+products.length)%products.length].id);event.preventDefault();
  }
});
$('#motion-control').addEventListener('click',()=>{reduced=!reduced;document.body.classList.toggle('reduce-motion',reduced);$('#motion-control').setAttribute('aria-pressed',String(reduced));$('#motion-control').setAttribute('aria-label',reduced?'恢复动态效果':'减少动态效果');$('#motion-control').lastElementChild.textContent=reduced?'静态':'动态';window.__AH_REDUCED_MOTION=reduced;scene?.setProgress(currentProgress);requestScroll();announce(reduced?'已减少动态效果':'已恢复动态效果');});
window.__AH_REDUCED_MOTION=reduced;

function maxScroll(){return Math.max(1,document.documentElement.scrollHeight-innerHeight);}
function jumpTo(progress,behavior='smooth'){
  const target=clamp(progress);window.scrollTo({top:target*maxScroll(),behavior:reduced||behavior==='instant'?'instant':'smooth'});requestScroll();
}
function updateScroll(){
  scrollFrame=0;if(scrollLocked)return;
  currentProgress=clamp(window.scrollY/maxScroll());
  const p=currentProgress;
  scene?.setProgress(p);
  const hero=1-smooth((p-.06)/.065);
  const relation=smooth((p-.10)/.035)*(1-smooth((p-.18)/.035));
  const closing=smooth((p-.89)/.055);
  const inProduct=p>=.20&&p<.84;
  let product=null,local=0,copy=0,index=-1;
  if(inProduct){
    index=Math.min(3,Math.floor((p-.20)/.16));product=products[index];local=clamp((p-(.20+index*.16))/.16);
    copy=smooth((local-.15)/.18)*(1-smooth((local-.87)/.13));
    if(active!==product.id)setBase(product.id);
    stageMedia.setProduct(product.id);stageMedia.setProgress(local);
  }else{
    if(active!==null)setBase(null);
    stageMedia.hide();
  }
  document.body.dataset.beat=p<.1?'intro':p<.2?'family':p<.84?'product':'closing';
  document.body.style.setProperty('--hero-opacity',hero.toFixed(4));
  document.body.style.setProperty('--hero-y',(-26*(1-hero))+'px');
  document.body.style.setProperty('--relation-opacity',relation.toFixed(4));
  document.body.style.setProperty('--relation-y',(24*(1-relation))+'px');
  document.body.style.setProperty('--copy-opacity',copy.toFixed(4));
  document.body.style.setProperty('--copy-y',(24*(1-copy))+'px');
  document.body.style.setProperty('--closing-opacity',closing.toFixed(4));
  document.body.style.setProperty('--closing-y',(24*(1-closing))+'px');
  $('.overview').inert=hero<.05;$('.relation-copy').inert=relation<.05;$('.focus-copy').inert=copy<.05;$('.closing-copy').inert=closing<.05;
  $('#journey-progress').style.transform=`scaleX(${p})`;
  $('#journey-number').textContent=p<.1?'00':p<.2?'01':p<.84?'0'+(index+2):'06';
  $('#journey-label').textContent=p<.1?'INTRODUCTION':p<.2?'THE PRODUCT FAMILY':p<.84?product.name.toUpperCase():'YOUR NEXT STEP';
  $('#scroll-cue').style.opacity=String(1-smooth(p/.065));$('#scroll-cue').inert=p>.08;
  document.querySelectorAll('.product-button').forEach((b,i)=>b.style.setProperty('--chapter-progress',i===index?String(local):i<index?'1':'0'));
  if(!dialog.open){const path=product?'product/'+product.id:'overview';history.replaceState(null,'','#'+path);lastBase=path;}
}
function requestScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);}
window.addEventListener('scroll',requestScroll,{passive:true});window.addEventListener('resize',requestScroll);
$('#scroll-cue').addEventListener('click',()=>jumpTo(.155));
route();requestScroll();
try{
  const {createScene}=await import('./scene.js');
  scene=createScene({canvas:$('#scene'),onSelect:id=>navigate('product/'+id),onHover:id=>{$('#scene').style.cursor=id?'pointer':'default';labels.forEach((el,key)=>el.classList.toggle('is-hovered',key===id));},onLabels:items=>{for(const item of items){const el=labels.get(item.id);if(!el)continue;el.style.left=item.x+'px';el.style.top=item.y+'px';el.hidden=!item.visible;}},onReady:()=>document.body.classList.add('scene-ready')});
  scene.setProgress(currentProgress);
  if(reduced)document.body.classList.add('reduce-motion');
}catch(error){
  document.body.classList.add('degraded');console.warn('3D scene unavailable; product navigation remains available.',error);announce('当前设备未启用 3D，仍可使用产品导航查看所有内容。');
}
window.__AH_PREVIEW={get active(){return active},get sceneReady(){return Boolean(scene)},get progress(){return currentProgress},get localProgress(){return clamp((currentProgress-.2-(products.findIndex(p=>p.id===active))*.16)/.16)},jumpTo,products:products.map(({id,name})=>({id,name})),navigate};
