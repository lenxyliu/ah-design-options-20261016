import { products as chineseProducts } from './products.js';
import { products as englishProducts } from './products-en.js';
import { translations } from './copy.js';
import { mountSculpture } from './sculpture.js';
import { createProductJourney } from './product-journey.js';

const lang=document.documentElement.lang.startsWith('en')?'en':'zh';
const t=translations[lang],products=lang==='en'?englishProducts:chineseProducts;
const params=new URLSearchParams(location.search);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = motionPreference.matches, paused = reduced||params.get('motion')==='off', selected = 0, preview = 0;
let pointerX = 0, pointerY = 0, drag = 0, dragging = false, lastPointerX = 0;
let scene;
try { scene = mountSculpture($('#sculpture')); if($('#sculpture').dataset.error)document.body.classList.add('scene-error'); } catch (error) { document.body.classList.add('scene-error'); console.warn(t.fallback, error.message); }
const sceneObserver = new MutationObserver(() => { if ($('#sculpture').dataset.error) document.body.classList.add('scene-error'); });
sceneObserver.observe($('#sculpture'), {attributes:true,attributeFilter:['data-error']});
const hero = $('.hero'), manifesto = $('.manifesto'), productsSection = $('.products');
const header = $('.site-header');
let framePending = false;
let journey;
let productPosition=0;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,p)=>a+(b-a)*p;
const smooth=(a,b,v)=>{const p=clamp((v-a)/(b-a));return p*p*(3-2*p);};

// Persistent layers retain both sides of a scroll transition. Their shared grid
// row takes the tallest natural copy height, so sculpture anchors cannot jump.
const copyHost=$('#product-panel');
const copyLayers=products.map((p,index)=>{
  const layer=document.createElement('div');layer.className='product-copy-layer';layer.dataset.copyProduct=index;
  const category=document.createElement('span');category.className='product-category mono';category.textContent=`${p.category} / ${p.name}`;
  const title=document.createElement('h3');title.className='product-name';title.innerHTML=p.display;
  const promise=document.createElement('p');promise.className='product-promise';promise.textContent=p.promise;
  const description=document.createElement('p');description.className='product-description';description.textContent=p.description;
  const keywords=document.createElement('div');keywords.className='product-keywords';keywords.replaceChildren(...p.keywords.map(k=>{const span=document.createElement('span');span.textContent=k;return span;}));
  const button=document.createElement('button');button.className='round-link light';button.setAttribute('aria-label',t.detailsLabel.replace('{name}',p.name));button.innerHTML=`<span class="round-arrow">↗</span><span>${t.details}</span>`;button.addEventListener('click',()=>openDetail(index));
  layer.append(category,title,promise,description,keywords,button);return layer;
});
copyHost.replaceChildren(...copyLayers);
function paintProductPosition(state){
  productPosition=reduced?state.selectedIndex:state.position;
  const panelWidth=$('#sculpture').getBoundingClientRect().width||innerWidth;
  copyLayers.forEach((layer,index)=>{
    const delta=index-productPosition,depth=Math.abs(delta),visible=depth<.99999;
    layer.style.visibility=visible?'visible':'hidden';
    layer.style.opacity=visible?'1':'0';
    layer.style.transform=`translate3d(${delta*panelWidth}px,0,0)`;
  });
  const a=Math.floor(productPosition),b=Math.min(3,a+1),blend=productPosition-a;
  const parse=hex=>[1,3,5].map(n=>parseInt(hex.slice(n,n+2),16));
  const ca=parse(accents[a]),cb=parse(accents[b]);
  productsSection.style.setProperty('--accent',`rgb(${ca.map((v,i)=>Math.round(lerp(v,cb[i],blend))).join(',')})`);
  productsSection.dataset.productPosition=productPosition.toFixed(5);
}

function sculptureLayout(y,h,section){
  const mobile=innerWidth<=800,w=innerWidth;
  const a=$('.art-interaction').getBoundingClientRect(),m=$('.manifesto-art').getBoundingClientRect();
  const heroScale=Math.min(1,a.height/(h*.57),a.width/(h*.59))*(mobile?1:.95);
  const ideaScale=Math.min(1,m.height/(h*.57),m.width/(h*.45));
  const transfer=smooth(hero.offsetHeight*.24,hero.offsetHeight+manifesto.offsetHeight*.12,y);
  let x=lerp(a.left+a.width*.50,m.left+m.width*.5,transfer),cy=lerp(a.top+a.height*.46,m.top+m.height*.5,transfer),scale=lerp(heroScale,ideaScale,transfer);
  if(!mobile){
    const radius=h*.35*scale*lerp(1,.64,transfer);
    const previewTop=$('.word-preview').getBoundingClientRect().top;
    const limitBottom=previewTop>120?Math.min(h-12,previewTop-24):h-12;
    cy=clamp(cy,105+radius+12,Math.max(105+radius+12,limitBottom-radius-12));
  }
  const pr=productsSection.getBoundingClientRect();
  const stage=$('.product-stage').getBoundingClientRect();
  // Both spaces share one trajectory through the entry interval.
  const enter=1-smooth(h*.08,h*.80,pr.top);
  let px=w*.735,py=stage.top+h*.48,ps=.82;
  if(mobile){
    const cr=copyHost.getBoundingClientRect(),tr=$('.product-tabs').getBoundingClientRect();
    const top=cr.bottom+8,bottom=tr.top-12,available=Math.max(75,bottom-top);
    px=w*.5;py=top+available*.5;ps=Math.min(.82,available/(h*.43),w/(h*.6));
  }
  if(enter>0){x=lerp(x,px,enter);cy=lerp(cy,py,enter);scale=lerp(scale,ps,enter);}
  let clip;
  if(mobile){
    clip={left:Math.max(0,lerp(a.left,m.left,transfer)-12),top:Math.max(80,lerp(a.top,m.top,transfer)-8),right:Math.min(w,lerp(a.right,m.right,transfer)+12),bottom:Math.min(h,lerp(a.bottom,m.bottom,transfer)+8)};
  }else{
    const previewRect=$('.word-preview').getBoundingClientRect();
    clip={left:w*.535,top:105,right:w*.965,bottom:Math.min(h-12,previewRect.top>120?previewRect.top-24:h-12)};
  }
  const artHeader=$('.journey-topline').getBoundingClientRect(),artFooter=$('.product-art-note').getBoundingClientRect();
  const tabsRect=$('.product-tabs').getBoundingClientRect(),copyRect=copyHost.getBoundingClientRect();
  const artBounds=mobile?{left:16,top:copyRect.bottom+10,right:w-16,bottom:tabsRect.top-16}:{left:w*.535+12,top:artHeader.bottom+18,right:tabsRect.right-12,bottom:artFooter.top-18};
  const top=clamp(clip.top,0,h),bottom=clamp(Math.max(top,clip.bottom),0,h);
  $('#sculpture').style.clipPath=enter>0?'none':`inset(${top}px ${Math.max(0,w-clip.right)}px ${h-bottom}px ${clip.left}px)`;
  $('#sculpture').style.maskImage='none';
  $('#sculpture').style.webkitMaskImage='none';
  return {anchorX:x/w,anchorY:cy/h,sizeFactor:Math.max(0,scale),heroToManifesto:transfer,productMix:enter,artBounds:enter>0?artBounds:undefined,sceneOpacity:section==='other'?0:1};
}

function paintScroll() {
  framePending = false;
  const h = innerHeight, y = scrollY, heroRect = hero.getBoundingClientRect();
  const journeyState=journey?.read();
  const mr = manifesto.getBoundingClientRect(), pr = productsSection.getBoundingClientRect();
  let section='other',progress=0;
  if (heroRect.bottom > h * .24) { section='hero'; progress=Math.min(1,y / hero.offsetHeight); }
  else if (mr.bottom > h*.2) { section='manifesto'; progress=Math.max(0,Math.min(1,-mr.top / mr.height)); }
  if(pr.top < h*.7 && pr.bottom>h*.23){section='products';progress=Math.max(0,Math.min(1,(h-pr.top)/(h*.8)));}
  const inProducts = pr.top < 70 && pr.bottom > 100;
  header.classList.toggle('dark',inProducts);
  header.classList.toggle('scrolled',y>60);
  $('.page-progress').style.transform=`scaleX(${y / Math.max(1,document.documentElement.scrollHeight-h)})`;
  const pose=sculptureLayout(y,h,section);
  scene?.setState({section,progress,product:selected,productPosition,pointerX,pointerY,drag,paused,reduced,...pose,octopColor:params.get('octop')==='red'?'red':'purple'});
  const switcher=$('#language-switch');
  const isOffline=/\/(?:离线预览|offline-en)\.html$/.test(decodeURIComponent(location.pathname));
  const target=new URL(isOffline?(lang==='zh'?'./offline-en.html':'./离线预览.html'):t.languageUrl,location.href);
  target.hash=section==='products'?'products':section==='hero'?'home':section==='manifesto'?'manifesto':'begin';
  if(journeyState?.active)target.searchParams.set('product',products[selected].id);
  switcher.href=target.href;
}
function requestPaint(){if(!framePending){framePending=true;requestAnimationFrame(paintScroll);}}
addEventListener('scroll',requestPaint,{passive:true});
addEventListener('resize',()=>{scene?.resize();journey?.resize();requestPaint();},{passive:true});
function syncMotion(){
  $('#motion-toggle').setAttribute('aria-pressed',String(paused));
  $('#motion-toggle').textContent=paused?t.play:t.pause;
  requestPaint();
}
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;syncMotion();});
motionPreference.addEventListener('change',()=>{reduced=motionPreference.matches;paused=reduced;syncMotion();});
syncMotion();

const art = $('.art-interaction');
art.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch'&&!dragging)return;
  const r=art.getBoundingClientRect();
  pointerX=(e.clientX-r.left)/r.width*2-1;pointerY=(e.clientY-r.top)/r.height*2-1;
  $('.drag-cursor').style.left=`${(e.clientX-r.left)/r.width*100}%`;
  $('.drag-cursor').style.top=`${(e.clientY-r.top)/r.height*100}%`;
  if(dragging){drag+=(e.clientX-lastPointerX)*.009;lastPointerX=e.clientX;}
  requestPaint();
});
art.addEventListener('pointerleave',()=>{if(!dragging){pointerX=0;pointerY=0;requestPaint();}});
art.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;lastPointerX=e.clientX;art.classList.add('dragging');art.setPointerCapture(e.pointerId);});
function releaseArt(e){dragging=false;art.classList.remove('dragging');if(art.hasPointerCapture(e.pointerId))art.releasePointerCapture(e.pointerId);}
art.addEventListener('pointerup',releaseArt);art.addEventListener('pointercancel',releaseArt);

const accents=['#dee4ed','#7898ff','#59d59b',params.get('octop')==='red'?'#ef5b66':'#b599fa'];
function renderProduct(index,animate=true){
  selected=index;const p=products[index];
  $$('.product-tabs [role=tab]').forEach((t,i)=>{t.setAttribute('aria-selected',String(i===index));t.tabIndex=i===index?0:-1;});
  $('#product-panel').setAttribute('aria-labelledby',`tab-${p.id}`);
  $('#product-art-label').textContent=p.art;
  copyLayers.forEach((layer,i)=>{layer.inert=i!==index;layer.setAttribute('aria-hidden',String(i!==index));layer.style.pointerEvents=i===index?'auto':'none';$('button',layer).style.visibility=i===index?'inherit':'hidden';});
  $('#journey-counter').textContent=t.journeyCounter.replace('{index}',`0${index+1}`);
  $('#journey-hint').textContent=index===3?t.journeyLast:t.journeyHint;
  $('#journey-next').textContent=index===3?t.journeyExit:t.journeyNext.replace('{name}',products[index+1].name);
}
function goProduct(index){journey.goTo(index);requestPaint();}
$$('[data-product]').forEach(tab=>tab.addEventListener('click',()=>goProduct(Number(tab.dataset.product))));
$('.product-tabs').addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
  const next=e.key==='Home'?0:e.key==='End'?3:(selected+(e.key==='ArrowRight'?1:-1)+4)%4;
  goProduct(next);$(`[data-product="${next}"]`).focus({preventScroll:true});
});
function renderPreview(index){
  preview=index;const p=products[index];
  $$('[data-preview]').forEach((b,i)=>b.classList.toggle('active',i===index));
  $('#preview-number').textContent=p.category;
  $('#preview-name').textContent=p.name;$('#preview-text').textContent=p.preview;
}
$$('[data-preview]').forEach(b=>{
  const index=Number(b.dataset.preview);
  b.addEventListener('pointerenter',()=>renderPreview(index));
  b.addEventListener('focus',()=>renderPreview(index));
  b.addEventListener('click',()=>goProduct(index));
});
$('#preview-enter').addEventListener('click',()=>goProduct(preview));

const detail=$('#detail-dialog');
function openDetail(index){
  const p=products[index];
  $('#detail-category').textContent=`${p.category} / ${p.label}`;
  $('#detail-title').textContent=p.name;$('#detail-lead').textContent=p.description;
  $('#detail-features').replaceChildren(...p.features.map(([title,text],i)=>{
    const section=document.createElement('section');const n=document.createElement('span');n.className='mono';n.textContent=`0${i+1}`;
    const h=document.createElement('h3');h.textContent=title;const para=document.createElement('p');para.textContent=text;section.append(n,h,para);return section;
  }));
  $('#detail-scene').textContent=p.scene;
  $('#detail-links').replaceChildren(...p.links.map(([label,url])=>{const a=document.createElement('a');a.textContent=`${label} ↗`;a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}));
  detail.showModal();document.body.classList.add('dialog-open');detail.scrollTop=0;
  if(!reduced)$('.detail-body').animate([{opacity:0,translate:'0 24px'},{opacity:1,translate:'0 0'}],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'});
}
$$('[data-intent]').forEach(b=>b.addEventListener('click',()=>openDetail(Number(b.dataset.intent))));
$('#detail-close').addEventListener('click',()=>detail.close());
detail.addEventListener('close',()=>document.body.classList.remove('dialog-open'));

const observer = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}}),{threshold:.12});
$$('.begin-heading,.intent-list,.footer-word').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
document.addEventListener('visibilitychange',()=>{scene?.setState({paused:paused||document.hidden});if(!document.hidden)requestPaint();});
addEventListener('pagehide',event=>{if(!event.persisted){scene?.dispose();journey?.dispose();}});
journey=createProductJourney({section:productsSection,stage:$('.product-stage'),reduced:()=>reduced,onIndex:index=>renderProduct(index),onProgress:state=>{
  paintProductPosition(state);
  $$('.product-tabs [role=tab]').forEach((tab,index)=>tab.style.setProperty('--segment-progress',index<state.index?1:index===state.index?Math.max(.04,state.local):0));
}});
renderProduct(0,false);paintProductPosition({position:0,selectedIndex:0});renderPreview(0);requestPaint();
const initialProduct=products.findIndex(p=>p.id===params.get('product'));
if(initialProduct>=0&&location.hash==='#products'){requestAnimationFrame(()=>{journey.goTo(initialProduct,{behavior:'instant'});requestPaint();});}
