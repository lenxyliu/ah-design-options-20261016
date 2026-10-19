const STYLE_ID = 'ah-stage-media-style';

const css = `
.ah-stage-media-root{position:absolute;left:38%;top:49%;width:clamp(400px,36vw,520px);height:310px;box-sizing:border-box;transform-style:preserve-3d;transform-origin:50% 50%;will-change:transform,opacity;visibility:hidden;opacity:0;pointer-events:none;color:#EAF4FF;font-family:inherit;isolation:isolate}
.ah-stage-media-root *{box-sizing:border-box}
.ah-stage-media-root .ah-sm-window{height:100%;position:relative;overflow:hidden;border:1px solid rgba(234,244,255,.19);border-radius:3px;background:linear-gradient(145deg,rgba(52,100,157,.23),rgba(16,42,80,.96) 62%);box-shadow:inset 0 1px 0 rgba(234,244,255,.09),inset 0 0 42px rgba(56,149,255,.025);backdrop-filter:blur(16px)}
.ah-stage-media-root .ah-sm-window:after{position:absolute;inset:0;content:'';pointer-events:none;background:linear-gradient(117deg,rgba(234,244,255,.075),transparent 30%,transparent 78%,rgba(56,149,255,.025))}
.ah-stage-media-root .ah-sm-header{height:44px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(234,244,255,.13);position:relative;z-index:1}
.ah-stage-media-root .ah-sm-heading{font-size:12px;letter-spacing:.01em;font-weight:500}
.ah-stage-media-root .ah-sm-dots{display:flex;gap:4px}
.ah-stage-media-root .ah-sm-dots i{width:3px;height:3px;display:block;background:rgba(234,244,255,.43);border-radius:50%}
.ah-stage-media-root .ah-sm-body{height:222px;position:relative;overflow:hidden}
.ah-stage-media-root .ah-sm-caption{position:absolute;left:18px;top:12px;font-size:9px;letter-spacing:.08em;color:rgba(234,244,255,.52);z-index:2}
.ah-stage-media-root .ah-sm-graph{display:block;position:absolute;width:100%;height:100%;inset:0;overflow:visible}
.ah-stage-media-root .ah-sm-graph text{font-family:inherit;fill:#EAF4FF;font-size:10px;letter-spacing:.015em;font-weight:400}
.ah-stage-media-root .ah-sm-graph .minor{fill:rgba(234,244,255,.49);font-size:8px;letter-spacing:.06em}
.ah-stage-media-root .ah-sm-graph .wire{fill:none;stroke:rgba(234,244,255,.29);stroke-width:.8}
.ah-stage-media-root .ah-sm-graph .wire-blue{fill:none;stroke:#3895FF;stroke-opacity:.72;stroke-width:1}
.ah-stage-media-root .ah-sm-graph .surface{fill:rgba(234,244,255,.025);stroke:rgba(234,244,255,.29);stroke-width:.8}
.ah-stage-media-root .ah-sm-graph .focus{fill:rgba(36,91,255,.12);stroke:#3895FF;stroke-opacity:.78;stroke-width:1}
.ah-stage-media-root .ah-sm-graph .dim{stroke-opacity:.45;fill-opacity:.4}
.ah-stage-media-root .ah-sm-footer{height:44px;margin:0 18px;border-top:1px solid rgba(234,244,255,.13);display:flex;align-items:center;justify-content:space-between;gap:14px;position:relative;z-index:3}
.ah-stage-media-root .ah-sm-note{font-size:8px;line-height:1.5;letter-spacing:.03em;color:rgba(234,244,255,.47)}
.ah-stage-media-root .ah-sm-detail{pointer-events:auto;display:inline-flex;align-items:center;gap:7px;border:0;padding:7px 0 7px 9px;flex-shrink:0;background:none;color:rgba(234,244,255,.86);font:inherit;font-size:10px;cursor:pointer;transition:color .18s ease}
.ah-stage-media-root .ah-sm-detail:hover{color:#fff}
.ah-stage-media-root .ah-sm-detail:focus-visible{outline:1px solid #3895FF;outline-offset:4px}
.ah-stage-media-root .ah-sm-detail span{font-size:13px}
.ah-stage-media-root .ah-sm-real-media{width:100%;height:100%;object-fit:cover;display:block}
@media(max-width:760px){.ah-stage-media-root{left:50%;top:36%;width:78vw;height:204px;max-width:460px}.ah-stage-media-root .ah-sm-header{height:32px;padding:0 12px}.ah-stage-media-root .ah-sm-heading{font-size:10px}.ah-stage-media-root .ah-sm-body{height:140px}.ah-stage-media-root .ah-sm-caption{left:12px;top:6px;font-size:7px}.ah-stage-media-root .ah-sm-footer{height:32px;margin:0 12px;gap:8px}.ah-stage-media-root .ah-sm-note{font-size:6px}.ah-stage-media-root .ah-sm-detail{font-size:8px;gap:4px;padding-left:0}.ah-stage-media-root .ah-sm-graph text{font-size:11px}.ah-stage-media-root .ah-sm-graph .minor{font-size:9px}}
@media(prefers-reduced-motion:reduce){.ah-stage-media-root{will-change:opacity}}
`;

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const title = (product, index, fallback) => escapeHTML(product.features?.[index]?.title || fallback);
const text = (x, y, value, className = '', anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${className}">${value}</text>`;
const rect = (x, y, w, h, className = 'surface', radius = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" class="${className}"/>`;

function lighthouse(product) {
  return `
    <path d="M67 66H413M67 168H413" class="wire dim"/>
    ${text(35, 69, 'Agent', 'minor', 'start')}
    ${rect(86, 82, 86, 47)}${rect(197, 82, 86, 47, 'focus')}${rect(308, 82, 86, 47)}
    ${text(129, 109, 'OpenClaw')}${text(240, 109, 'Hermes')}${text(351, 109, 'Agent')}
    <path d="M129 129V149H351V129M240 129V176M129 149V176M351 149V176" class="wire-blue"/>
    ${rect(86, 176, 308, 31)}
    ${text(137, 195, title(product, 0, '部署与配置'))}
    ${text(240, 195, title(product, 1, '多 Agent 协作'))}
    ${text(344, 195, title(product, 2, '运行与观测'))}
    <path d="M188 181V202M291 181V202" class="wire dim"/>
    <circle cx="240" cy="149" r="2.4" fill="#3895FF"/>
  `;
}

function clawpro(product) {
  return `
    ${rect(167, 42, 146, 34, 'focus')}${text(240, 63, '企业资产')}
    ${text(240, 94, 'Models  /  Token  /  Skills  /  Rules', 'minor')}
    <path d="M240 106V125M113 125H367M113 125V145M240 125V145M367 125V145" class="wire-blue"/>
    ${rect(64, 145, 98, 40)}${rect(191, 145, 98, 40)}${rect(318, 145, 98, 40)}
    ${text(113, 169, '云端 Agent')}${text(240, 169, 'PC 本地 Agent')}${text(367, 169, '团队 / 项目')}
    ${text(113, 207, title(product, 0, '统一纳管'), 'minor')}
    ${text(240, 207, title(product, 1, '资产分发'), 'minor')}
    ${text(367, 207, title(product, 2, '成本与安全'), 'minor')}
    <circle cx="113" cy="125" r="2" fill="#3895FF"/><circle cx="240" cy="125" r="2" fill="#3895FF"/><circle cx="367" cy="125" r="2" fill="#3895FF"/>
  `;
}

function skillhub(product) {
  return `
    ${rect(42, 55, 82, 38)}${text(83, 78, 'Skill')}
    ${rect(42, 108, 82, 38)}${text(83, 131, 'Plugin')}
    ${rect(42, 161, 82, 38)}${text(83, 184, 'MCP')}
    <path d="M124 74H158L190 127H214M124 127H214M124 180H158L190 127" class="wire"/>
    ${rect(214, 96, 104, 62, 'focus')}${text(266, 122, '任务所需能力')}${text(266, 140, 'Agent', 'minor')}
    <path d="M318 127H346" class="wire-blue"/>
    ${rect(346, 100, 92, 54)}${text(392, 123, '调用 / 交付')}${text(392, 141, 'Pay Skill', 'minor')}
    ${text(266, 190, title(product, 0, '发现与安装'), 'minor')}
    ${text(266, 207, title(product, 1, '发布与治理'), 'minor')}
    <circle cx="190" cy="127" r="2.5" fill="#3895FF"/>
  `;
}

function octop(product) {
  return `
    ${rect(43, 45, 394, 160, 'surface', 3)}
    ${text(60, 64, '自托管工作空间', 'minor', 'start')}
    ${rect(75, 83, 88, 37)}${rect(196, 83, 88, 37, 'focus')}${rect(317, 83, 88, 37)}
    ${text(119, 106, '专家')}${text(240, 106, '专家团队')}${text(361, 106, '工具 / 连接器')}
    <path d="M119 120V141H361V120M240 120V160M119 141V160M361 141V160" class="wire-blue"/>
    ${rect(75, 160, 148, 28)}${rect(257, 160, 148, 28)}
    ${text(149, 178, '知识库')}${text(331, 178, '长期记忆')}
    <circle cx="240" cy="141" r="2.5" fill="#3895FF"/>
    ${text(240, 221, title(product, 0, '自托管与扩展'), 'minor')}
  `;
}

const diagrams = { lighthouse, clawpro, skillhub, octop };

/** A restrained, scroll-driven foreground window. Does not own the page layout. */
export function createStageMedia({ container, products }) {
  if (!container) throw new Error('createStageMedia requires a container');
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.append(style);
  }

  const root = document.createElement('section');
  root.className = 'ah-stage-media-root';
  root.setAttribute('aria-label', '产品能力结构示意');
  root.setAttribute('aria-hidden', 'true');
  container.append(root);
  let activeId = null;
  let progress = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function render(product) {
    const media = product.media;
    const hasMedia = Boolean(media?.src);
    const visual = hasMedia
      ? media.type === 'video'
        ? `<video class="ah-sm-real-media" src="${escapeHTML(media.src)}" muted playsinline preload="metadata"${media.poster ? ` poster="${escapeHTML(media.poster)}"` : ''}></video>`
        : `<img class="ah-sm-real-media" src="${escapeHTML(media.src)}" alt="${escapeHTML(media.title || `${product.name} 产品界面`)}"/>`
      : `<div class="ah-sm-caption">能力结构示意</div><svg class="ah-sm-graph" viewBox="0 0 480 230" role="img" aria-label="${escapeHTML(product.name)} 能力结构示意">${(diagrams[product.id] || lighthouse)(product)}</svg>`;
    root.innerHTML = `<div class="ah-sm-window">
      <div class="ah-sm-header"><span class="ah-sm-heading">${escapeHTML(product.name || product.short)}</span><span class="ah-sm-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>
      <div class="ah-sm-body">${visual}</div>
      <div class="ah-sm-footer"><span class="ah-sm-note">${hasMedia ? '产品演示' : '正式界面 / 视频由产品团队替换'}</span><button type="button" class="ah-sm-detail" data-detail="${escapeHTML(product.id)}" tabindex="-1">查看详情<span aria-hidden="true">↗</span></button></div>
    </div>`;
  }

  function setProgress(localProgress) {
    progress = clamp(Number(localProgress) || 0);
    const enter = smooth((progress - .4) / .22);
    const exit = smooth((progress - .9) / .1);
    const opacity = enter * (1 - exit);
    const visible = opacity > .006 && Boolean(activeId);
    root.style.visibility = visible ? 'visible' : 'hidden';
    root.style.opacity = String(opacity);
    root.setAttribute('aria-hidden', visible ? 'false' : 'true');
    const button = root.querySelector('button');
    if (button) button.tabIndex = visible ? 0 : -1;
    const isReduced=reducedMotion.matches||window.__AH_REDUCED_MOTION;
    const angleY = isReduced ? 0 : -35 + 33 * enter;
    const angleX = isReduced ? 0 : 18 - 17 * enter;
    const shift = isReduced ? 0 : (1 - enter) * -24 - exit * 16;
    const depth = isReduced ? 0 : (1 - enter) * -180;
    const scale = isReduced ? 1 : .32 + .68 * enter;
    root.style.transform = `translate(-50%,-50%) perspective(1200px) translate3d(0,${shift}px,${depth}px) rotateY(${angleY}deg) rotateX(${angleX}deg) scale(${scale})`;
  }

  return {
    setProduct(id) {
      if (id === activeId) return;
      const product = products.find((item) => item.id === id);
      if (!product) { this.hide(); return; }
      activeId = id;
      render(product);
      setProgress(progress);
    },
    setProgress,
    hide() {
      root.style.opacity = '0';
      root.style.visibility = 'hidden';
      root.setAttribute('aria-hidden', 'true');
      const button = root.querySelector('button');
      if (button) button.tabIndex = -1;
    },
  };
}
