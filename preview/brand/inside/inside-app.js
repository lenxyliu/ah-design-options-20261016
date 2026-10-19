import { products } from '../exhibition-data.js';
import { createExhibition } from '../exhibition-motion.js';
import { createDepthExperience } from '../depth-renderer.js';
import { buildFunctionWorld } from './function-scenes.js';
import { sampleFunctionCamera, functionStage } from './function-camera.js';

const $ = selector => document.querySelector(selector);
const rail = $('#inside-rail');
const introductions = [
  ['让任务，<br>成为协作现场。','从一个目标进入任务、角色与工具的协作，穿过工作正在发生的地方。'],
  ['把企业经验，<br>变成可用的能力。','从知识和方法出发，穿过资产沉淀，走向业务应用和自己的 AI 产品。'],
  ['把专业能力，<br>接到任务里面。','发现、选择与接入技能，让工具和专业服务成为 Agent 的一部分。'],
  ['走进属于你的<br>AI 工作空间。','知识、记忆与专家围绕任务展开，在自己的环境里持续积累。'],
];
rail.innerHTML = products.map((product,index) => `<section class="function-chapter product-chapter" data-chapter="${product.id}" id="${product.id}" aria-labelledby="title-${product.id}" tabindex="-1"><div class="function-intro"><p>${String(index+1).padStart(2,'0')} / ${product.name}</p><h1 id="title-${product.id}">${introductions[index][0]}</h1><p>${introductions[index][1]}</p></div><div class="function-fallback"><span>产品功能示意</span>${product.features.map(feature=>`<article><h3>${feature.title}</h3><p>${feature.text}</p></article>`).join('')}</div></section>`).join('');
const chapters = [...rail.children];
const experience = createDepthExperience({container:$('#inside-stage'),worldBuilder:buildFunctionWorld,cameraSampler:sampleFunctionCamera,mobileSceneScale:.8});
let currentProduct = 0;
let lastCaption = '';
const journey = createExhibition({
  viewport:$('#inside-viewport'),rail,runway:$('#inside-runway'),chapters,
  onChapter({id}){document.querySelectorAll('.product-nav a').forEach(link=>{if(link.dataset.product===id)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current')});},
  onProgress({progress,depth}){
    experience.render(depth);
    $('#inside-progress').style.transform=`scaleX(${progress})`;
    currentProduct=depth.index;
    const complete=!depth.reduced&&depth.index===3&&depth.progress>.94;
    $('#inside-finish').hidden=!complete;
    $('.function-caption').style.visibility=complete?'hidden':'';
    const stage=functionStage(depth.index,depth.progress);
    const key=`${depth.index}-${stage.stageIndex}`;
    if(key===lastCaption)return;
    lastCaption=key;
    $('#caption-number').textContent=String(stage.stageIndex+1).padStart(2,'0')+' / 05';
    $('#caption-product').textContent=products[depth.index].name;
    $('#caption-stage').textContent=['任务入口','协作核心','功能展开','能力接入','结果与复用'][stage.stageIndex];
    $('#caption-title').textContent=stage.title;
    $('#caption-description').textContent=stage.description;
  },
});
function jump(id){if(!products.some(product=>product.id===id))return;journey.jumpTo(id,{focus:true});history.replaceState(null,'','#'+id);}
document.querySelectorAll('[data-product]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();jump(link.dataset.product);}));
const dialog=$('#inside-detail');
$('#product-detail').addEventListener('click',()=>{const product=products[currentProduct];$('#detail-content').innerHTML=`<h2 id="detail-title">${product.name}</h2><p>${product.intro}</p><div class="detail-features">${product.features.map(feature=>`<article><h3>${feature.title}</h3><p>${feature.text}</p></article>`).join('')}</div><p class="detail-note">本页为独立交互方案。画面为产品能力示意，正式产品入口与演示素材待确认后接入。</p>`;dialog.showModal();document.body.classList.add('dialog-open');});
$('#close-detail').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
const initial=decodeURIComponent(location.hash.slice(1));if(initial)jump(initial);
window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(products.some(product=>product.id===id))journey.jumpTo(id);});
window.addEventListener('pagehide',()=>{journey.dispose();experience.dispose();},{once:true});
