import {products as sourceProducts} from './products.js';
import {productScenes} from './product-scenes.js';
const products=structuredClone(sourceProducts);
Object.assign(products[1],{category:'企业 Agent 平台',intro:'贯通 Agent 构建、数字资产沉淀、业务应用与持续治理，助力企业 AI 转型与新产品孵化。',audience:'推进 AI 转型、团队经验复用与自有 AI 产品孵化的企业。',features:[{title:'组织治理与经验复用',text:'按组织、部门与成员管理 Agent 使用，将成熟方法沉淀为可复用的数字资产。'},{title:'应用集成与产品孵化',text:'结合模型、工具与业务接口，将企业积累融入现有业务与自有品牌 AI 产品。'},{title:'持续运营与实践',text:'结合云端运行、团队协作与效能评测，让成熟经验持续服务业务应用。'}]});
const headlines=['让 Agent，在云端持续工作。','把团队经验，转化为业务能力。','专业能力，让 Agent 随需拓展。','你的知识，你的 AI 工作空间。'];
const capabilities=[['云端部署','多 Agent 协作','运行观测'],['组织治理','经验资产','应用与产品孵化'],['技能发现','创作发布','专业服务'],['自主部署','知识与记忆','专家协作']];
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
let current=0;
let heroIndex=0;
const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)');
function selectProduct(id,scroll=false){
  const index=products.findIndex(p=>p.id===id);if(index<0)return;
  const direction=index>=current?1:-1;const changed=index!==current;current=index;const p=products[index];
  $$('[data-product]').forEach(b=>{const active=b.dataset.product===id;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});
  $('#product-panel').setAttribute('aria-labelledby','tab-'+id);$('#product-category').textContent=p.category;$('#panel-number').textContent=String(index+1).padStart(2,'0');$('#product-headline').textContent=headlines[index];$('#product-intro').textContent=p.intro;
  $('#product-capabilities').replaceChildren(...capabilities[index].map(t=>{const span=document.createElement('span');span.textContent=t;return span}));$('#product-audience').textContent=p.audience;$('#detail-button').innerHTML=`深入了解 ${p.name} <span>↗</span>`;$('#product-panel').dataset.product=id;
  $('#product-features-summary').innerHTML=p.features.map((f,i)=>`<div class="product-feature-row"><span>0${i+1}</span><h4>${f.title}</h4><p>${f.text}</p></div>`).join('');
  if(changed&&!reducedMotion.matches){const content=$('.product-panel-content');content.getAnimations().forEach(a=>a.cancel());content.animate([{opacity:.15,transform:`translate3d(${direction*38}px,0,0)`},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:520,easing:'cubic-bezier(.19,1,.22,1)'});}
  const tab=$('#tab-'+id);const tabs=$('.product-tabs');if(tabs.scrollWidth>tabs.clientWidth)tabs.scrollTo({left:tab.offsetLeft-tabs.offsetLeft-14,behavior:reducedMotion.matches?'instant':'smooth'});
  if(scroll){$('#products').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'});tab.focus({preventScroll:true})}
}

$$('[data-product]').forEach(b=>{b.addEventListener('click',()=>selectProduct(b.dataset.product));b.addEventListener('keydown',e=>{const list=$$('[data-product]');let next=list.indexOf(b);if(['ArrowDown','ArrowRight'].includes(e.key))next=(next+1)%list.length;else if(['ArrowUp','ArrowLeft'].includes(e.key))next=(next+list.length-1)%list.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=list.length-1;else return;e.preventDefault();selectProduct(list[next].dataset.product);list[next].focus()})});
const storyTitles=[['让 Agent','各展所长。'],['让企业经验','持续增值。'],['给 Agent','更多可能。'],['自有环境，','自由构建。']];
const storyDescriptions=['从 Lighthouse Agent 开始，让 Agent 在云端部署、分工协作，持续开展你的工作。','把组织知识与成熟方法转化为可复用的资产，融入团队工作与企业产品。','找到任务所需的专业技能，为你的 Agent 增加工具，也让自己的经验被调用。','在自有环境中组织知识、记忆与专家，构建由你管理的 AI 工作空间。'];
const storyNotes=['云端环境承载 Agent 与任务','企业经验服务团队与业务应用','专业技能按需接入 Agent','知识、记忆与专家留在自有环境'];
$('#story-track').innerHTML=products.map((p,i)=>`<div class="story-slide ${i===0?'is-active':''}" role="tabpanel" id="story-${p.id}" aria-labelledby="hero-tab-${p.id}" ${i===0?'':'inert aria-hidden="true"'}><div class="story-copy"><p class="eyebrow">${p.name} / ${productScenes[i].label}</p><${i===0?'h1 id="hero-title"':'h2'} class="story-title">${storyTitles[i][0]}<br><em>${storyTitles[i][1]}</em></${i===0?'h1':'h2'}><p class="story-description">${storyDescriptions[i]}</p><div class="hero-actions"><button class="button dark" data-select="${p.id}">了解 ${p.short} <span>↗</span></button><button class="text-button" data-guide>从我的需求出发 <span>→</span></button></div><div class="story-capabilities">${capabilities[i].map(c=>`<span>${c}</span>`).join('')}</div></div><div class="story-art">${productScenes[i].html}<div class="story-art-label"><span>${storyNotes[i]}</span><span>0${i+1} / 04</span></div></div></div>`).join('');
function moveStory(index,{focus=false}={}){
  const previousIndex=heroIndex;const oldSlide=$$('.story-slide')[heroIndex];const restoreFocus=oldSlide?.contains(document.activeElement);
  heroIndex=Math.max(0,Math.min(products.length-1,index));
  $('#story-track').style.transform=`translate3d(${-heroIndex*100}%,0,0)`;
  $$('.story-slide').forEach((slide,i)=>{const active=i===heroIndex;slide.classList.toggle('is-active',active);slide.inert=!active;slide.setAttribute('aria-hidden',String(!active));});
  $$('[data-story]').forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===heroIndex));tab.tabIndex=i===heroIndex?0:-1;});
  $('.hero-nav-indicator').style.transform=`translateX(${heroIndex*100}%)`;
  $('#story-prev').disabled=heroIndex===0;$('#story-next').disabled=heroIndex===products.length-1;
  $('#story-status').innerHTML=`<b>${String(heroIndex+1).padStart(2,'0')}</b><span>/ 04</span><span class="sr-only">${products[heroIndex].name}，${productScenes[heroIndex].label}</span>`;
  if(focus)$('#hero-tab-'+products[heroIndex].id).focus({preventScroll:true});
  else if(restoreFocus&&heroIndex!==previousIndex)$('#story-viewport').focus({preventScroll:true});
}
$$('[data-story]').forEach((b,i)=>{b.addEventListener('click',()=>moveStory(i));b.addEventListener('keydown',e=>{let n=heroIndex;if(e.key==='ArrowRight'||e.key==='ArrowDown')n++;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')n--;else if(e.key==='Home')n=0;else if(e.key==='End')n=products.length-1;else return;e.preventDefault();moveStory(n,{focus:true});});});
$('#story-prev').addEventListener('click',()=>moveStory(heroIndex-1));$('#story-next').addEventListener('click',()=>moveStory(heroIndex+1));
const viewport=$('#story-viewport');let drag=null;let wheelSum=0;let wheelLock=0;
viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();moveStory(heroIndex+(e.key==='ArrowRight'?1:-1));}});
viewport.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,a'))return;drag={x:e.clientX,y:e.clientY,id:e.pointerId,dx:0,t:performance.now(),locked:false};});
viewport.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;if(e.pointerType==='mouse'&&e.buttons!==1){drag=null;viewport.classList.remove('is-dragging');moveStory(heroIndex);return;}const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.locked){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10){drag=null;return;}if(Math.abs(dx)<8)return;drag.locked=true;viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');}drag.dx=dx;const resistance=((heroIndex===0&&dx>0)||(heroIndex===3&&dx<0))?0.22:1;$('#story-track').style.transform=`translate3d(calc(${-heroIndex*100}% + ${dx*resistance}px),0,0)`;});
function finishDrag(e){if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;viewport.classList.remove('is-dragging');if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);const threshold=Math.min(110,Math.max(42,viewport.clientWidth*.075));const velocity=Math.abs(d.dx)/Math.max(1,performance.now()-d.t);moveStory(heroIndex+(d.locked&&(Math.abs(d.dx)>threshold||(Math.abs(d.dx)>25&&velocity>.5))?(d.dx<0?1:-1):0));}
viewport.addEventListener('pointerup',finishDrag);viewport.addEventListener('pointercancel',e=>{if(drag&&drag.id===e.pointerId){drag=null;viewport.classList.remove('is-dragging');moveStory(heroIndex)}});
viewport.addEventListener('lostpointercapture',e=>{if(drag&&drag.id===e.pointerId){drag=null;viewport.classList.remove('is-dragging');moveStory(heroIndex)}});
viewport.addEventListener('wheel',e=>{if(e.ctrlKey)return;const horizontal=Math.abs(e.deltaX)>Math.abs(e.deltaY)*1.1;const delta=horizontal?e.deltaX:(e.shiftKey?e.deltaY:0);if(!delta)return;if((heroIndex===0&&delta<0)||(heroIndex===3&&delta>0))return;e.preventDefault();if(performance.now()<wheelLock)return;wheelSum+=delta;if(Math.abs(wheelSum)>38){moveStory(heroIndex+(wheelSum>0?1:-1));wheelSum=0;wheelLock=performance.now()+740}},{passive:false});
// These buttons are generated with the product scenes and bind after rendering.
$$('.story-slide [data-select]').forEach(b=>b.addEventListener('click',()=>selectProduct(b.dataset.select,true)));
moveStory(0);
function showDialog(d){d.showModal();document.body.classList.add('dialog-open')}
$$('dialog').forEach(d=>{d.querySelector('.close-dialog').addEventListener('click',()=>d.close());d.addEventListener('close',()=>document.body.classList.remove('dialog-open'));d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}})});
$$('[data-guide]').forEach(b=>b.addEventListener('click',()=>showDialog($('#guide-dialog'))));
$$('[data-choice]').forEach(b=>b.addEventListener('click',()=>{$('#guide-dialog').close();selectProduct(b.dataset.choice,true)}));
$('#detail-button').addEventListener('click',()=>{const p=products[current];$('#detail-content').innerHTML=`<h2 id="detail-title">${p.name}</h2><p class="detail-category">${p.category}</p><p class="detail-lead">${p.intro}</p><div class="detail-features">${p.features.map(f=>`<div><h3>${f.title}</h3><p>${f.text}</p></div>`).join('')}</div><p class="detail-note">本页为产品介绍设计预览。正式产品入口、使用文档与演示素材将在确认后接入；具体能力以各产品实际开放范围为准。</p>`;showDialog($('#detail-dialog'))});
const scenes=[{prompt:'整理信息、形成初稿，<br>把重复任务交给云端 Agent。',tasks:[['信息整理','按需汇总'],['内容协作','角色分工'],['定时任务','按计划运行']],product:'lighthouse',label:'Lighthouse Agent',footer:'从一项任务开始'},{prompt:'把验证过的方法留下来，<br>让下一位同事从经验开始。',tasks:[['经验沉淀','知识与技能'],['团队共享','按组织配置'],['应用治理','持续评估']],product:'clawpro',label:'ClawPro',footer:'从团队的成熟方法开始'},{prompt:'把已有的行业知识，<br>变成客户可以使用的 AI 能力。',tasks:[['专业积累','知识与工具'],['应用集成','融入业务'],['产品孵化','场景验证']],product:'clawpro',label:'ClawPro',footer:'从一份专业积累开始'}];let sceneIndex=0;
function showScene(i){sceneIndex=i;const s=scenes[i];$$('[data-scene]').forEach(b=>{const active=Number(b.dataset.scene)===i;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});$('#scene-content').innerHTML=`<p class="scene-prompt">${s.prompt}</p>${s.tasks.map(t=>`<div class="scene-task"><i>◇</i><span>${t[0]}</span><small>${t[1]}</small></div>`).join('')}`;$('.scene-display-footer>span').textContent=s.footer;$('#scene-product').textContent=`探索 ${s.label} ↗`}
$$('[data-scene]').forEach(b=>b.addEventListener('click',()=>showScene(Number(b.dataset.scene))));$('#scene-product').addEventListener('click',()=>selectProduct(scenes[sceneIndex].product,true));
$('.menu-toggle').addEventListener('click',()=>{const open=$('.header nav').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',String(open));$('.menu-toggle').setAttribute('aria-label',open?'收起导航':'展开导航')});$$('.header nav a').forEach(a=>a.addEventListener('click',()=>{$('.header nav').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');$('.menu-toggle').setAttribute('aria-label','展开导航')}));selectProduct('lighthouse');showScene(0);
