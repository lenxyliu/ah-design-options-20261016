const greetingURL = new URL('./assets/ip-greeting.png', import.meta.url).href;
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
const symbols = {
  cloud: '<path d="M7 17H6a4 4 0 0 1-1-7.9A6 6 0 0 1 16.5 7a5 5 0 0 1 .5 10h-2M11 12v9m-3-6 3-3 3 3"/>',
  flow: '<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="1" y="16" width="8" height="6" rx="1"/><rect x="15" y="16" width="8" height="6" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>',
  plug: '<path d="M8 2v5m8-5v5M5 7h14v3a7 7 0 0 1-7 7v5m0-5a7 7 0 0 1-7-7"/>',
  book: '<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${symbols[name]}</svg>`;
const homeProducts = [
  { id:'lighthouse', title:'Lighthouse Agent', description:'云端部署与协作', symbol:'cloud', piece:'云端运行' },
  { id:'clawpro', title:'ClawPro', description:'企业 AI 应用与产品孵化', symbol:'flow', piece:'企业应用' },
  { id:'skillhub', title:'SkillHub', description:'技能发现与接入', symbol:'plug', piece:'技能接入' },
  { id:'octop', title:'Octop', description:'开源自托管知识空间', symbol:'book', piece:'自有空间' },
];

export const hallHomeMarkup = `
  <div class="hh-home" aria-label="Agent Hosting 产品家族首页">
    <div class="hh-copy">
      <p class="hh-eyebrow"><span></span>腾讯云智能体托管</p>
      <h1 id="intro-title" class="hh-title"><span>让 Agent</span><span>各展所长。</span></h1>
      <p class="hh-description">从云端部署与协作，到企业 AI 应用、技能接入与开源自托管，让每一种 Agent 找到合适的工作方式。</p>
      <a class="hh-cta" href="#lighthouse" data-jump="lighthouse"><span>探索产品家族</span>${arrow}</a>
      <p class="hh-scroll-note"><i></i>滚动，进入 Agent 的工作现场</p>
    </div>
    <div class="hh-visual" aria-label="Agent Hosting 官方品牌形象，从口袋中连接四条产品路径">
      <div class="hh-atmosphere" aria-hidden="true"></div>
      <div class="hh-ground" aria-hidden="true"></div>
      <div class="hh-ip"><img src="${greetingURL}" alt="Agent Hosting 品牌形象，挥手欢迎，口袋中装着不同能力模块" width="1024" height="1536" decoding="async" fetchpriority="high" draggable="false"></div>
      <div class="hh-capability-pieces" aria-hidden="true">${homeProducts.map((p,i)=>`<div class="hh-piece hh-piece-${p.id}" style="--piece-index:${i}"><span>${icon(p.symbol)}</span><b>${p.piece}</b><i></i></div>`).join('')}</div>
      <p class="hh-visual-caption">把能力，带进每一次任务。</p>
    </div>
    <nav class="hh-products" aria-label="四条产品路径">
      <p class="hh-products-kicker">ONE FAMILY. MANY POSSIBILITIES.</p>
      <div class="hh-product-list">${homeProducts.map((p,i)=>`<a class="hh-product hh-product-${p.id}" href="#${p.id}" data-jump="${p.id}"><span class="hh-product-symbol">${icon(p.symbol)}</span><span class="hh-product-copy"><small>0${i+1}</small><strong>${p.title}</strong><span>${p.description}</span></span><span class="hh-product-arrow">${arrow}</span></a>`).join('')}</div>
      <p class="hh-products-note">选择合适的起点，走向更多可能。</p>
    </nav>
  </div>`;

const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const smooth = (start,end,value) => { const p=clamp((value-start)/(end-start));return p*p*(3-2*p); };

export function createHallHome({element}={}) {
  if (!element) return {update(){},dispose(){}};
  const home = element.matches?.('.hh-home') ? element : element.querySelector('.hh-home');
  if (!home) return {update(){},dispose(){}};
  const properties=['--hh-progress','--hh-copy-exit','--hh-depart','--hh-fade'];
  let disposed=false;
  function update({progress=0,reduced=false}={}) {
    if(disposed)return;
    const p=clamp(progress);
    home.classList.toggle('hh-reduced',Boolean(reduced));
    home.style.setProperty('--hh-progress',String(reduced?0:p));
    home.style.setProperty('--hh-copy-exit',String(reduced?0:smooth(.14,.8,p)));
    home.style.setProperty('--hh-depart',String(reduced?0:smooth(.08,.88,p)));
    home.style.setProperty('--hh-fade',String(reduced?0:smooth(.74,1,p)));
  }
  update();
  return {update,dispose(){if(disposed)return;disposed=true;properties.forEach(property=>home.style.removeProperty(property));home.classList.remove('hh-reduced');}};
}
