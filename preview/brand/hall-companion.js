/* A contextual exhibition companion, using the official character action assets.
   It explains this room and navigates the exhibition; it is not a chat service. */
const POSES = {
  greeting: new URL('./assets/ip-greeting.png', import.meta.url).href,
  dispatch: new URL('./assets/ip-dispatch.png', import.meta.url).href,
  completed: new URL('./assets/ip-completed.png', import.meta.url).href,
};
const PRODUCTS = [
  {
    name: 'Lighthouse Agent',
    greeting: '一个目标，可以交给不同角色在云端协作推进。跟我看看它们如何分工。',
    dispatch: '研究角色找依据，内容角色组织表达，开发角色调用工具。分工在同一个任务里汇合。',
    completed: '角色分工、云端环境与持续任务，在这里组成完整的工作方式。下一站看看企业如何使用这些能力。',
    cue: '一起看看角色分工',
  },
  {
    name: 'ClawPro',
    greeting: '企业知识、专业技能和成熟方法，可以沉淀成可复用的资产。我们从这些积累出发。',
    dispatch: '把企业资产带入业务任务，再结合工具与业务接口，形成自己的应用和工作方式。',
    completed: '从复用经验到落地业务，再到孵化自己的 AI 产品，是 ClawPro 想连接的路径。',
    cue: '一起看看企业资产',
  },
  {
    name: 'SkillHub',
    greeting: '任务需要什么能力，就为 Agent 接入什么技能与工具。看看这些能力怎样加入任务。',
    dispatch: 'Skill 提供专业方法，Plugin 与 MCP 带入工具和数据。它们在任务里各有分工。',
    completed: '专业经验也可以被整理成技能，供更多 Agent 发现与使用。下一站，看看知识与记忆如何陪伴 Agent。',
    cue: '一起看看能力接入',
  },
  {
    name: 'Octop',
    greeting: '把知识、记忆和专家能力组织在自己的环境里，让 Agent 能理解工作的来龙去脉。',
    dispatch: '知识提供依据，记忆保留上下文，专家能力帮助完成具体任务。它们在这里共同参与工作。',
    completed: '四个产品已经逛过。接下来可以从实际应用出发，选择适合自己的起点。',
    cue: '一起看看知识空间',
  },
];
const STAGE_LABELS = { greeting: '认识这个空间', dispatch: '一起向前探索', completed: '准备去下一站' };
let instanceCount = 0;
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

export function createHallCompanion({ container, onExplore, onGuide } = {}) {
  if (!container?.appendChild) return { update() {}, dispose() {} };
  const doc = container.ownerDocument || document;
  const id = `hall-companion-${++instanceCount}`;
  const alreadyHost = container.classList.contains('hall-companion-host');
  container.classList.add('hall-companion-host');
  const root = doc.createElement('aside');
  root.className = 'hall-companion';
  root.setAttribute('aria-label', 'Agent Hosting 展厅向导');
  root.setAttribute('aria-hidden', 'true');
  root.inert = true;
  root.dataset.state = 'greeting';
  root.dataset.open = 'false';
  root.dataset.reduced = 'false';
  root.innerHTML = `
    <span class="hc-ground" aria-hidden="true"></span>
    <button class="hc-mascot" type="button" aria-label="与 Agent Hosting 向导互动" aria-expanded="false" aria-controls="${id}">
      <span class="hc-art" aria-hidden="true">
        <img class="hc-character" src="${POSES.greeting}" alt="" width="1024" height="1536" draggable="false" decoding="async">
        <span class="hc-sparklets"><i></i><i></i><i></i></span>
      </span>
      <span class="hc-invitation">点我，一起逛 <span aria-hidden="true">↗</span></span>
    </button>
    <section class="hc-panel" id="${id}" aria-label="当前产品导览" hidden>
      <div class="hc-panel-top"><span class="hc-stage">认识这个空间</span><button class="hc-close" type="button" aria-label="收起向导介绍">×</button></div>
      <h3 class="hc-product">Lighthouse Agent</h3>
      <p class="hc-message"></p>
      <div class="hc-actions">
        <button class="hc-next" type="button">带我进入下一站 <span aria-hidden="true">↗</span></button>
        <button class="hc-guide" type="button">了解这个产品 <span aria-hidden="true">→</span></button>
      </div>
    </section>`;
  container.appendChild(root);
  const mascot = root.querySelector('.hc-mascot');
  const character = root.querySelector('.hc-character');
  const panel = root.querySelector('.hc-panel');
  const message = root.querySelector('.hc-message');
  const productName = root.querySelector('.hc-product');
  const stageLabel = root.querySelector('.hc-stage');
  const invitation = root.querySelector('.hc-invitation');
  const closeButton = root.querySelector('.hc-close');
  const nextButton = root.querySelector('.hc-next');
  const guideButton = root.querySelector('.hc-guide');
  const sparklets = [...root.querySelectorAll('.hc-sparklets i')];
  const posePreloads = Object.values(POSES).map(src => {
    const image = doc.createElement('img');
    image.decoding = 'async';
    image.src = src;
    return image;
  });
  const cleanups = [];
  const animations = new Set();
  let index = 0;
  let stage = 'greeting';
  let reduced = false;
  let visible = false;
  let open = false;
  let disposed = false;
  let initialized = false;

  function listen(element, event, callback, options) {
    element.addEventListener(event, callback, options);
    cleanups.push(() => element.removeEventListener(event, callback, options));
  }

  function animate(element, frames, options) {
    if (reduced || !element.animate) return;
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished?.catch(() => {}).finally(() => animations.delete(animation));
  }

  function react(kind = 'wave') {
    if (reduced || !visible || disposed) return;
    for (const animation of animations) animation.cancel();
    animations.clear();
    const wave = kind === 'wave';
    animate(character, [
      { transform: 'translateY(0) rotate(0deg)' },
      { transform: `translateY(${wave ? '-9' : '-4'}px) rotate(-4deg)`, offset: .28 },
      { transform: 'translateY(-3px) rotate(3deg)', offset: .55 },
      { transform: 'translateY(0) rotate(0deg)' },
    ], { duration: wave ? 760 : 520, easing: 'cubic-bezier(.2,.7,.25,1)' });
    sparklets.forEach((spark, n) => {
      const x = [-30, 17, 39][n];
      const y = [-46, -69, -33][n];
      animate(spark, [
        { opacity: 0, transform: 'translate3d(0,0,0) scale(.4) rotate(0deg)' },
        { opacity: .95, transform: `translate3d(${x * .7}px,${y * .7}px,0) scale(1) rotate(${n * 12 - 9}deg)`, offset: .45 },
        { opacity: 0, transform: `translate3d(${x}px,${y}px,0) scale(.8) rotate(${n * 17 - 14}deg)` },
      ], { duration: 700, delay: n * 45, easing: 'ease-out' });
    });
  }

  function refreshCopy() {
    const product = PRODUCTS[index];
    productName.textContent = product.name;
    message.textContent = product[stage];
    stageLabel.textContent = STAGE_LABELS[stage];
    mascot.setAttribute('aria-label', `与 Agent Hosting 向导互动：${product.name}`);
    guideButton.setAttribute('aria-label', `了解 ${product.name}`);
    invitation.title = product.cue;
    root.dataset.product = String(index);
  }

  function setOpen(value, restoreFocus = false) {
    open = Boolean(value && visible);
    root.dataset.open = String(open);
    mascot.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    if (restoreFocus && visible) mascot.focus({ preventScroll: true });
  }

  listen(mascot, 'click', () => {
    setOpen(!open);
    react('wave');
  });
  listen(closeButton, 'click', () => setOpen(false, true));
  listen(nextButton, 'click', () => {
    setOpen(false, true);
    react('stage');
    onExplore?.(index);
  });
  listen(guideButton, 'click', () => {
    setOpen(false, true);
    onGuide?.(index);
  });
  listen(root, 'pointerdown', event => event.stopPropagation());
  listen(root, 'click', event => event.stopPropagation());
  listen(root, 'keydown', event => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false, true);
  });
  listen(doc, 'pointerdown', event => {
    if (open && !root.contains(event.target)) setOpen(false);
  });
  listen(mascot, 'pointermove', event => {
    if (reduced || event.pointerType === 'touch') return;
    const rect = mascot.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / Math.max(rect.width, 1) - .5, -.5, .5);
    const y = clamp((event.clientY - rect.top) / Math.max(rect.height, 1) - .5, -.5, .5);
    root.style.setProperty('--hc-lean-x', `${(-y * 9).toFixed(2)}deg`);
    root.style.setProperty('--hc-lean-y', `${(x * 14).toFixed(2)}deg`);
  });
  listen(mascot, 'pointerleave', () => {
    root.style.setProperty('--hc-lean-x', '0deg');
    root.style.setProperty('--hc-lean-y', '0deg');
  });

  function update(state = {}) {
    if (disposed) return;
    const value = Number(state.index);
    const nextIndex = Number.isFinite(value) ? clamp(Math.round(value), 0, 3) : index;
    const progress = clamp(Number(state.progress) || 0, 0, 1);
    const opacity = clamp(Number.isFinite(Number(state.opacity)) ? Number(state.opacity) : 1, 0, 1);
    const nextReduced = Boolean(state.reduced);
    const nextStage = progress < .25 ? 'greeting' : progress < .77 ? 'dispatch' : 'completed';
    const changed = nextIndex !== index || nextStage !== stage;
    reduced = nextReduced;
    visible = opacity > .05;
    root.inert = !visible;
    root.setAttribute('aria-hidden', String(!visible));
    root.dataset.reduced = String(reduced);
    root.style.setProperty('--hc-opacity', opacity.toFixed(3));
    root.style.setProperty('--hc-pass-x', reduced ? '0px' : `${(12 - progress * 24).toFixed(2)}px`);
    root.style.setProperty('--hc-pass-y', reduced ? '0px' : `${(-Math.sin(progress * Math.PI) * 6).toFixed(2)}px`);
    root.style.setProperty('--hc-scale', reduced ? '1' : (.97 + Math.sin(progress * Math.PI) * .04).toFixed(4));
    if (reduced) {
      for (const animation of animations) animation.cancel();
      animations.clear();
      root.style.setProperty('--hc-lean-x', '0deg');
      root.style.setProperty('--hc-lean-y', '0deg');
    }
    if (!visible && open) setOpen(false);
    if (changed || !initialized) {
      index = nextIndex;
      stage = nextStage;
      root.dataset.state = stage;
      character.src = POSES[stage];
      const dimensions = stage === 'greeting' ? [1024, 1536] : [1254, 1254];
      character.width = dimensions[0];
      character.height = dimensions[1];
      refreshCopy();
      if (initialized && visible) react('stage');
      initialized = true;
    }
  }

  refreshCopy();
  return {
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const cleanup of cleanups) cleanup();
      for (const animation of animations) animation.cancel();
      animations.clear();
      posePreloads.length = 0;
      root.remove();
      if (!alreadyHost) container.classList.remove('hall-companion-host');
    },
  };
}
