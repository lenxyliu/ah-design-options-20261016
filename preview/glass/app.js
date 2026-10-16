import { products } from './products.js';
import { mountGlassScene } from './glass-scene.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = $('.site-header');
const hero = $('.hero');
const art = $('.hero-art');
const scene = mountGlassScene($('#hero-scene'));
let selected = 0;

// The existing product corpus is the copy baseline. ClawPro uses the latest V4.
Object.assign(products[1], {
  category:'企业 Agent 管控与创新平台',
  intro:'贯通 Agent 构建、数字资产沉淀、业务应用与持续治理。对内推动团队经验复用，对外探索 AI 产品与服务创新。',
  features:[
    {title:'精细治理',text:'按组织、部门与成员配置权限和配额，让团队使用与投入可见可控。'},
    {title:'数字资产沉淀',text:'集中维护技能、工具、知识与工作方法，将成熟经验组织为可复用的团队资产。'},
    {title:'AI 产品孵化',text:'连接业务接口与企业积累，为现有产品融入 AI 能力，探索自有品牌的 AI 产品与服务。'}
  ]
});
const presentations = [
  {headline:'灵感上线，<br>Agent 就位。',description:'在云端部署主流 Agent，集中完成配置、使用与运行管理。让你的想法，拥有持续工作的空间。',labels:['START WITH AN IDEA','READY FOR ACTION','CONNECTED CAPABILITIES'],nodes:['你的任务','云端 Agent','模型 · 工具 · 技能'],visual:'LIGHTHOUSE / CLOUD WORKSPACE',caption:'让 Agent 在云端持续工作',links:[['阅读产品介绍','https://developer.cloud.tencent.com/article/2710300']]},
  {headline:'让个人经验，<br>成为企业能力。',description:'贯通 Agent 构建、资产沉淀与持续治理。对内推动企业 AI 转型，对外孵化新的产品与服务。',labels:['YOUR TEAM','SHARED EXPERTISE','NEW POSSIBILITIES'],nodes:['团队与组织','知识 · 技能 · 规范','业务应用与创新'],visual:'CLAWPRO / ENTERPRISE CAPABILITIES',caption:'让 Agent 规模化落地，让企业经验持续增值',links:[['查看产品文档','https://cloud.tencent.com/document/product/213/129156'],['基础使用指南','https://cloud.tencent.com/document/product/213/129694']]},
  {headline:'更多专业技能，<br>更多行动可能。',description:'发现、安装与发布专业技能，为现有 Agent 补充能力。让你的专业经验，被更多 Agent 发现和使用。',labels:['FIND YOUR CAPABILITY','BUILT FOR YOUR AGENT','SHARE YOUR EXPERTISE'],nodes:['发现专业技能','为 Agent 扩展能力','发布你的技能'],visual:'SKILLHUB / A WORLD OF SKILLS',caption:'每一块技能，打开一种新的可能',links:[['探索技能社区','https://skillhub.cn/'],['查看 GitHub','https://github.com/Tencent/skillhub']]},
  {headline:'你的环境，<br>你的 AI 工作空间。',description:'从开源出发，在自有环境组织专家、知识与记忆。构建能持续积累、持续协作的 AI 工作空间。',labels:['YOUR OWN ENVIRONMENT','YOUR KNOWLEDGE','YOUR WORKSPACE'],nodes:['自有部署环境','专家 · 知识 · 记忆','团队协作空间'],visual:'OCTOP / YOUR OWN AI WORKSPACE',caption:'在自己的空间，自主展开能力',links:[['探索开源项目','https://github.com/TencentCloud/Octop'],['阅读官方介绍','https://tencentcloud.github.io/Octop/']]}
];

function renderProduct(index, animate = true) {
  selected = index;
  const product = products[index], view = presentations[index];
  $$('.product-tabs [role=tab]').forEach((tab,i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  $('#product-panel').setAttribute('aria-labelledby', `tab-${product.id}`);
  $('#product-kicker').textContent = `${product.name.toUpperCase()} / ${product.category}`;
  $('#product-headline').innerHTML = view.headline;
  $('#product-description').textContent = view.description;
  $('#product-features').replaceChildren(...product.features.map(f => {
    const span = document.createElement('span'); span.textContent=f.title; return span;
  }));
  $('#product-more').innerHTML = `深入了解 ${product.name} <span>↗</span>`;
  $('.product-visual').dataset.mode = index;
  $('.orbit-core use').setAttribute('href',`#glass-puzzle-${['blue','blue','cyan','gold'][index]}`);
  $('#visual-label').textContent = view.visual;
  $('#visual-caption').textContent = view.caption;
  ['a','b','c'].forEach((key,i) => {
    $(`#node-label-${key}`).textContent = view.labels[i];
    $(`#node-title-${key}`).textContent = view.nodes[i];
  });
  scene.setMode(index);
  if (animate && !reducedMotion) {
    $('.product-copy').animate([{opacity:.1,transform:'translateY(16px)',filter:'blur(4px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0px)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
    $$('.flow-node').forEach((node,i) => node.animate([{opacity:.1,translate:'0 18px'},{opacity:1,translate:'0 0'}],{duration:650,delay:i*65,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
    $('.orbit-core').animate([{scale:'.7',opacity:.3},{scale:'1',opacity:1}],{duration:800,easing:'cubic-bezier(.22,1,.36,1)'});
  }
}

$$('[data-product]').forEach(tab => tab.addEventListener('click', () => renderProduct(Number(tab.dataset.product))));
$('.product-tabs').addEventListener('keydown', event => {
  if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3 : (selected + (event.key === 'ArrowRight' ? 1 : -1) + 4) % 4;
  renderProduct(next); $(`[data-product="${next}"]`).focus();
});
$$('[data-select-product]').forEach(button => button.addEventListener('click', () => {
  renderProduct(Number(button.dataset.selectProduct));
  $('#products').scrollIntoView({behavior:reducedMotion?'instant':'smooth'});
}));
$('#hero-scene').addEventListener('puzzle-select', event => {
  renderProduct(event.detail.index);
  $('#products').scrollIntoView({behavior:reducedMotion?'instant':'smooth'});
});
renderProduct(0,false);

// One scroll read per frame; hero parallax is small and follows the composition.
let scrollPending = false;
function paintScroll() {
  const y = window.scrollY, h = hero.offsetHeight;
  header.classList.toggle('pinned', y > h - 80);
  const progress = y / Math.max(1,document.documentElement.scrollHeight-innerHeight);
  $('.reading-progress').style.transform = `scaleX(${progress})`;
  if (!reducedMotion && y < h) {
    art.style.setProperty('--art-y',`${y*.11}px`);
    scene.setProgress(Math.min(1,y/h));
    $('.hero-copy').style.translate = `0 ${y*.055}px`;
    $('.hero-copy').style.opacity = Math.max(0,1-y/(h*.8));
  }
  scrollPending = false;
}
addEventListener('scroll', () => {if(!scrollPending){requestAnimationFrame(paintScroll);scrollPending=true;}},{passive:true});
addEventListener('resize',paintScroll,{passive:true});paintScroll();
hero.addEventListener('pointermove', event => {
  if(reducedMotion || event.pointerType==='touch') return;
  const x = event.clientX/hero.clientWidth*2-1;
  const y = (event.clientY-hero.getBoundingClientRect().top)/hero.clientHeight*2-1;
  hero.style.setProperty('--mx',x.toFixed(3));hero.style.setProperty('--my',y.toFixed(3));
  scene.setPointer(x,y);
});
hero.addEventListener('pointerleave', () => {hero.style.setProperty('--mx',0);hero.style.setProperty('--my',0);scene.setPointer(0,0);});

const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
  if(entry.isIntersecting){entry.target.classList.add('visible');reveals.unobserve(entry.target);}
}),{threshold:.12});
$$('.reveal').forEach(el=>reveals.observe(el));
$$('.magnetic').forEach(el => {
  el.addEventListener('pointermove', event => {
    if(reducedMotion||event.pointerType==='touch')return;
    const b=el.getBoundingClientRect();el.style.transform=`translate(${(event.clientX-b.left-b.width/2)*.09}px,${(event.clientY-b.top-b.height/2)*.13}px)`;
  });el.addEventListener('pointerleave',()=>el.style.transform='');
});

const vessel = $('.vessel');
function assetReady(){if(vessel.naturalWidth)document.body.classList.add('asset-ready');}
vessel.addEventListener('load',assetReady);assetReady();

// Dialogs use the browser's native focus trap, Escape handling and focus restoration.
const detail = $('#detail-dialog'), film = $('#film-dialog');
function openDialog(dialog){dialog.showModal();document.body.classList.add('dialog-open');}
function closeDialog(dialog){dialog.close();}
$$('dialog').forEach(dialog => {
  $('.dialog-close',dialog).addEventListener('click',()=>closeDialog(dialog));
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)closeDialog(dialog);});
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');if(dialog===film)stopFilm();});
});
$('#product-more').addEventListener('click',()=>{
  const p=products[selected],view=presentations[selected];
  $('#detail-category').textContent=p.category.toUpperCase();
  $('#detail-title').textContent=p.name;
  $('#detail-intro').textContent=p.intro;
  $('#detail-features').replaceChildren(...p.features.map((f,i)=>{
    const section=document.createElement('section');section.className='detail-feature';
    const n=document.createElement('small');n.textContent=`0${i+1}`;
    const h=document.createElement('h3');h.textContent=f.title;
    const t=document.createElement('p');t.textContent=f.text;
    section.append(n,h,t);return section;
  }));
  $('#detail-audience').textContent=`适合谁 · ${p.audience}`;
  $('#detail-actions').replaceChildren(...view.links.map(([label,url],i)=>{
    const a=document.createElement('a');a.className=i?'text-link':'button button-primary';a.textContent=`${label} ↗`;a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
  }));
  openDialog(detail);
});

// A real-time 20-second brand motion, using the site's own visual assets.
const chapters=[
  ['AGENT HOSTING','每一个想法，<br>都值得被展开。'],
  ['BRING YOUR AGENT TO LIFE','让 Agent 就位，<br>让灵感开始行动。'],
  ['MORE CAPABILITIES. MORE POSSIBILITIES.','每一块能力，<br>都通向新的可能。'],
  ['BUILD GREATER AGENTS. TOGETHER.','让 Agent 的能力，<br>在这里展开。']
];
let filmFrame=0,elapsed=0,lastTime=0,paused=false,chapter=-1;
function paintFilm(now){
  filmFrame=0;
  if(!film.open)return;
  if(!paused && lastTime)elapsed=Math.min(20000,elapsed+now-lastTime);
  lastTime=now;
  const nextChapter=Math.min(3,Math.floor(elapsed/5000));
  if(nextChapter!==chapter){
    chapter=nextChapter;film.dataset.chapter=chapter;
    $('#film-eyebrow').textContent=chapters[chapter][0];$('#film-title').innerHTML=chapters[chapter][1];
    if(!reducedMotion)$('.film-titles').animate([{opacity:0,translate:'0 20px',filter:'blur(5px)'},{opacity:1,translate:'0 0',filter:'blur(0)'}],{duration:1000,easing:'cubic-bezier(.22,1,.36,1)'});
  }
  $('.film-timeline i').style.transform=`scaleX(${elapsed/20000})`;
  $('#film-time').textContent=`00:${String(Math.floor(elapsed/1000)).padStart(2,'0')} / 00:20`;
  if(elapsed===20000&&!paused){setPaused(true);}
  if(!paused)filmFrame=requestAnimationFrame(paintFilm);
}
function setPaused(value){
  paused=value;film.classList.toggle('film-paused',value);
  $('#film-pause').textContent=value?'▶':'Ⅱ';$('#film-pause').setAttribute('aria-label',value?'播放品牌动效':'暂停品牌动效');
  film.getAnimations({subtree:true}).forEach(animation=>value?animation.pause():animation.play());
  cancelAnimationFrame(filmFrame);filmFrame=0;lastTime=0;
  if(!value&&film.open)filmFrame=requestAnimationFrame(paintFilm);
}
function startFilm(){cancelAnimationFrame(filmFrame);filmFrame=0;elapsed=0;lastTime=0;chapter=-1;setPaused(reducedMotion);if(reducedMotion)paintFilm(performance.now());}
function stopFilm(){cancelAnimationFrame(filmFrame);lastTime=0;}
$('#play-film').addEventListener('click',()=>{openDialog(film);startFilm();});
$('#film-pause').addEventListener('click',()=>{if(elapsed>=20000){elapsed=0;chapter=-1;}setPaused(!paused);lastTime=0;});
$('#film-replay').addEventListener('click',startFilm);
document.addEventListener('visibilitychange',()=>{lastTime=0;if(document.hidden&&film.open)setPaused(true);});

$('.menu-toggle').addEventListener('click',()=>{
  const isOpen=header.classList.toggle('menu-open');$('.menu-toggle').setAttribute('aria-expanded',String(isOpen));$('.menu-toggle').setAttribute('aria-label',isOpen?'关闭导航':'打开导航');
});
$$('.desktop-nav a').forEach(a=>a.addEventListener('click',()=>{header.classList.remove('menu-open');$('.menu-toggle').setAttribute('aria-expanded','false');$('.menu-toggle').setAttribute('aria-label','打开导航');}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'){header.classList.remove('menu-open');$('.menu-toggle').setAttribute('aria-expanded','false');}});
