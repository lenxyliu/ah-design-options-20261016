import {copy} from './copy.js';
import {products,getProduct} from './products.js';
import {mountVisual,productGlyph} from './visuals.js';

const lang=document.documentElement.lang==='en'?'en':'zh';
const c=copy[lang];
const root=document.documentElement;
const dialog=document.querySelector('#product-dialog');
const preference=matchMedia('(prefers-reduced-motion: reduce)');
const backgrounds={lighthouse:'#edf1f6',clawpro:'#e9effd',skillhub:'#edf5f0',octop:'#f1edf8'};
let motionPaused=preference.matches;
let carouselPaused=preference.matches;
let selectedProduct=0;
let selectedScenario=0;
let productVisible=false;
let interacting=false;
let tick=0;
let lastTick=0;
let dialogFromPage=false;
let lastTrigger=null;
let toastTimer;
const visual=mountVisual(document.querySelector('#brand-visual'),{lang,reducedMotion:preference.matches});
const arrowMarkup='<span aria-hidden="true">↗</span>';
const track=(action,product,source)=>window.dispatchEvent(new CustomEvent('agenthosting:interaction',{detail:{action,product:product||null,source:source||null,lang,at:new Date().toISOString()}}));

function updateLanguageLink(){
 document.querySelectorAll('.language').forEach(link=>{
  const url=new URL(link.getAttribute('href'),location.href);
  url.search=location.search;url.hash=location.hash;link.href=url.href;
 });
}
function animatePanel(el){
 if(motionPaused)return;
 el.classList.remove('panel-enter');
 void el.offsetWidth;
 el.classList.add('panel-enter');
}
function renderScenario(index,focus=false){
 selectedScenario=(index+c.scenarios.length)%c.scenarios.length;
 const s=c.scenarios[selectedScenario];
 document.querySelectorAll('[data-scenario]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===selectedScenario));b.tabIndex=i===selectedScenario?0:-1;if(focus&&i===selectedScenario)b.focus();});
 const panel=document.querySelector('#scenario-panel');
 panel.setAttribute('aria-labelledby',`scenario-tab-${selectedScenario}`);
 document.querySelector('#scenario-copy').innerHTML=`<h3>${s.title}</h3><p>${s.text}</p><div class="scenario-links">${s.products.map(id=>`<button data-open="${id}" data-source="scenario-${s.id}">${getProduct(id).name}${arrowMarkup}</button>`).join('')}</div>`;
 document.querySelector('#scenario-art').innerHTML=`<div class="artifact"><div class="artifact-meta"><span>AGENTHOSTING / ${String(selectedScenario+1).padStart(2,'0')}</span><span>→</span></div><h4>${s.artifact}</h4><p class="artifact-sub">${s.artifactSub}</p><ul>${s.items.map((item,i)=>`<li><i aria-hidden="true">${i+1}</i><span>${item}</span></li>`).join('')}</ul><div class="artifact-foot"><span>${s.tag}</span><span>${s.products.map(id=>getProduct(id).name).join(' + ')}</span></div></div><span class="art-note">${c.workIllustration}</span>`;
 animatePanel(panel);
}
function renderProduct(index,focus=false){
 selectedProduct=(index+products.length)%products.length;
 const p=products[selectedProduct];
 const section=document.querySelector('#products');
 section.style.setProperty('--product-color',p.color);
 section.style.setProperty('--product-bg',backgrounds[p.id]);
 document.querySelectorAll('.product-tabs [data-product]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===selectedProduct));b.tabIndex=i===selectedProduct?0:-1;if(focus&&i===selectedProduct)b.focus();});
 const panel=document.querySelector('#product-panel');
 panel.setAttribute('aria-labelledby',`product-tab-${selectedProduct}`);
 document.querySelector('#product-copy').innerHTML=`<p class="product-role">${p.role[lang]}</p><h3>${p.short[lang]}</h3><p>${p.audience[lang]}</p><button class="button" data-open="${p.id}" data-source="product-showcase">${c.productMore}${arrowMarkup}</button>`;
 document.querySelector('#product-glyph').innerHTML=productGlyph(p.id,'showcase-glyph');
 document.querySelector('#product-counter').textContent=`0${selectedProduct+1} / 04`;
 tick=0;
 animatePanel(document.querySelector('#product-copy'));
}
function setPauseButton(){
 const btn=document.querySelector('#product-pause');
 const paused=carouselPaused||motionPaused;
 btn.setAttribute('aria-label',paused?c.play:c.pause);
 btn.setAttribute('aria-pressed',String(paused));
 btn.textContent=paused?'▷':'Ⅱ';
}
function setMotion(paused){
 motionPaused=paused;
 root.classList.toggle('is-paused',paused);
 visual.pause(paused);
 const btn=document.querySelector('#motion-toggle');
 btn.textContent=paused?'▷ '+c.motionOn:'Ⅱ '+c.motionOff;
 btn.setAttribute('aria-pressed',String(paused));
 setPauseButton();
 tick=0;
}
function notify(message){
 const el=document.querySelector('#toast');
 el.textContent=message;el.classList.add('is-visible');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('is-visible'),2600);
}
function dialogMarkup(p){
 const differentSecondary=p.secondary&&p.secondary.url!==p.url;
 return `<div class="dialog-hero"><div><p class="product-role">${p.role[lang]}</p><h2 id="dialog-title">${p.headline[lang]}</h2><p class="dialog-description">${p.description[lang]}</p><div class="dialog-actions"><a class="button primary product-external" href="${p.url}" target="_blank" rel="noopener noreferrer" data-track-product="${p.id}" data-track-action="primary">${p.cta[lang]}${arrowMarkup}</a>${differentSecondary?`<a class="text-link product-external" href="${p.secondary.url}" target="_blank" rel="noopener noreferrer" data-track-product="${p.id}" data-track-action="secondary">${p.secondary.label[lang]}${arrowMarkup}</a>`:''}</div></div><div class="dialog-visual">${productGlyph(p.id,'dialog-glyph')}<span>${p.name.toUpperCase()} / AGENTHOSTING</span></div></div><div class="dialog-audience"><span>${c.audience}</span><p>${p.audience[lang]}</p></div><div class="dialog-media-slot" data-product-media="${p.id}"></div><section class="dialog-section"><h3>${c.benefits}</h3><div class="dialog-benefits">${p.benefits[lang].map((b,i)=>`<article><span>0${i+1}</span><h4>${b.title}</h4><p>${b.text}</p></article>`).join('')}</div></section><section class="dialog-section dialog-usecases"><h3>${c.useCases}</h3><div class="usecase-tags">${p.useCases[lang].map(s=>`<span>${s}</span>`).join('')}</div></section><div class="dialog-bottom"><div class="dialog-related"><span>${c.related}</span>${p.related.map(id=>`<button data-open="${id}" data-source="related-${p.id}">${getProduct(id).name}${arrowMarkup}</button>`).join('')}</div><button class="share-link" id="share-product" data-share="${p.id}"><span aria-hidden="true">↗</span>${c.share}</button></div><p class="dialog-family">${c.dialogBrand}</p>`;
}
function showProduct(id,{changeURL=true,trigger=null,source='direct'}={}){
 const p=getProduct(id);if(!p)return;
 const wasOpen=dialog.open;
 if(!wasOpen){lastTrigger=trigger||document.activeElement;dialogFromPage=changeURL;}
 dialog.style.setProperty('--product-color',p.color);
 dialog.style.setProperty('--product-bg',backgrounds[p.id]);
 document.querySelector('#dialog-product-name').textContent=p.name;
 document.querySelector('#dialog-content').innerHTML=dialogMarkup(p);
 document.body.classList.add('has-dialog');
 if(!wasOpen)dialog.showModal();
 dialog.scrollTop=0;
 if(!wasOpen)document.querySelector('#dialog-close').focus({preventScroll:true});
 if(changeURL){
  const u=new URL(location.href);u.searchParams.set('product',id);
  history[wasOpen?'replaceState':'pushState']({product:id},'',u);
 }
 updateLanguageLink();
 track('product_open',id,source);
 tick=0;
}
function closeProduct({changeURL=true}={}){
 if(!dialog.open)return;
 dialog.close();
 document.body.classList.remove('has-dialog');
 if(changeURL){
  if(dialogFromPage){history.back();}
  else {const u=new URL(location.href);u.searchParams.delete('product');history.replaceState(null,'',u);updateLanguageLink();}
 }
 dialogFromPage=false;
 const target=lastTrigger;
 if(target&&target.isConnected)target.focus({preventScroll:true});
 tick=0;
}
function tabKeyHandler(event,selector,current,count,render){
 if(!event.target.closest(selector))return;
 let next=current;
 if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(current+1)%count;
 else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(current+count-1)%count;
 else if(event.key==='Home')next=0;
 else if(event.key==='End')next=count-1;
 else return;
 event.preventDefault();render(next,true);
}
document.addEventListener('click',event=>{
 const opener=event.target.closest('[data-open]');
 if(opener){showProduct(opener.dataset.open,{trigger:opener,source:opener.dataset.source});return;}
 const scenario=event.target.closest('[data-scenario]');
 if(scenario){renderScenario(Number(scenario.dataset.scenario));track('scenario_select',null,c.scenarios[selectedScenario].id);return;}
 const prod=event.target.closest('.product-tabs [data-product]');
 if(prod){renderProduct(products.findIndex(p=>p.id===prod.dataset.product));track('product_select',prod.dataset.product,'tabs');return;}
 const external=event.target.closest('[data-track-product]');
 if(external)track('product_outbound',external.dataset.trackProduct,external.dataset.trackAction);
 const share=event.target.closest('[data-share]');
 if(share){const u=new URL(location.href);u.searchParams.set('product',share.dataset.share);navigator.clipboard?.writeText(u.href).then(()=>notify(c.copied)).catch(()=>notify(c.shareFail));if(!navigator.clipboard)notify(c.shareFail);}
});
document.querySelector('#product-prev').addEventListener('click',()=>renderProduct(selectedProduct-1));
document.querySelector('#product-next').addEventListener('click',()=>renderProduct(selectedProduct+1));
document.querySelector('#product-pause').addEventListener('click',()=>{if(motionPaused){setMotion(false);carouselPaused=false;}else carouselPaused=!carouselPaused;setPauseButton();tick=0;});
document.querySelector('#motion-toggle').addEventListener('click',()=>setMotion(!motionPaused));
document.querySelector('#dialog-close').addEventListener('click',()=>closeProduct());
dialog.addEventListener('cancel',event=>{event.preventDefault();closeProduct();});
dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))closeProduct();});
document.querySelector('.dialog-brand').addEventListener('click',event=>{event.preventDefault();closeProduct();});
document.querySelector('.scenario-tabs').addEventListener('keydown',e=>tabKeyHandler(e,'[data-scenario]',selectedScenario,c.scenarios.length,renderScenario));
document.querySelector('.product-tabs').addEventListener('keydown',e=>tabKeyHandler(e,'.product-tabs [data-product]',selectedProduct,products.length,renderProduct));
document.querySelectorAll('.rail-product').forEach(btn=>{btn.addEventListener('pointerenter',()=>visual.setProduct(btn.dataset.open));btn.addEventListener('focus',()=>visual.setProduct(btn.dataset.open));btn.addEventListener('pointerleave',()=>visual.setProduct(null));btn.addEventListener('blur',()=>visual.setProduct(null));});
const productSection=document.querySelector('#products');
productSection.addEventListener('pointerenter',()=>interacting=true);
productSection.addEventListener('pointerleave',()=>{interacting=false;tick=0;});
productSection.addEventListener('focusin',()=>interacting=true);
productSection.addEventListener('focusout',event=>{if(!productSection.contains(event.relatedTarget)){interacting=false;tick=0;}});
new IntersectionObserver(entries=>{productVisible=entries[0].isIntersecting;tick=0;},{threshold:.3}).observe(productSection);
function advance(time){
 const elapsed=lastTick?Math.min(time-lastTick,100):0;lastTick=time;
 if(productVisible&&!motionPaused&&!carouselPaused&&!dialog.open&&!interacting&&!document.hidden){tick+=elapsed;if(tick>9000)renderProduct(selectedProduct+1);}
 requestAnimationFrame(advance);
}
requestAnimationFrame(advance);
window.addEventListener('popstate',()=>{const id=new URL(location.href).searchParams.get('product');if(getProduct(id)){showProduct(id,{changeURL:false,source:'history'});}else closeProduct({changeURL:false});updateLanguageLink();});
window.addEventListener('hashchange',updateLanguageLink);
preference.addEventListener('change',()=>setMotion(preference.matches));
document.addEventListener('visibilitychange',()=>{tick=0;visual.pause(document.hidden||motionPaused);});
renderScenario(0);renderProduct(0);setMotion(motionPaused);updateLanguageLink();
const initial=new URL(location.href).searchParams.get('product');
if(getProduct(initial))showProduct(initial,{changeURL:false,source:'direct'});
else if(initial){const u=new URL(location.href);u.searchParams.delete('product');history.replaceState(null,'',u);updateLanguageLink();}
