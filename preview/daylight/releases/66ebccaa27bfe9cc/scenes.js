// Purpose-built illustrations of possible workflows, not live product screens.
const paths = {
  spark: '<path d="m8 1 1.65 5.35L15 8l-5.35 1.65L8 15 6.35 9.65 1 8l5.35-1.65L8 1Z"/>',
  calendar: '<rect x="2" y="3.5" width="12" height="11" rx="2"/><path d="M5 1.5v4M11 1.5v4M2 7h12M5 10h2M9 10h2M5 12.5h2"/>',
  file: '<path d="M9.5 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8a1.5 1.5 0 0 0 1.5-1.5V5.5L9.5 1.5Z"/><path d="M9.5 1.5v4h4M5.5 8.5h5M5.5 11h3.5"/>',
  check: '<path d="m3.5 8 3 3 6-6"/>',
  clock: '<circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/>',
  people: '<circle cx="6" cy="5" r="2.25"/><path d="M1.5 14v-1.5A3.5 3.5 0 0 1 5 9h2a3.5 3.5 0 0 1 3.5 3.5V14M10.5 3a2.25 2.25 0 0 1 0 4.5M12 9a3.5 3.5 0 0 1 2.5 3.35V14"/>',
  book: '<path d="M8 3.5C5.5 1.5 2 2 1.5 2.5v10c.5-.5 4-1 6.5 1 2.5-2 6-1.5 6.5-1v-10c-.5-.5-4-1-6.5 1ZM8 3.5v10"/>',
  grid: '<rect x="2" y="2" width="4.5" height="4.5" rx="1"/><rect x="9.5" y="2" width="4.5" height="4.5" rx="1"/><rect x="2" y="9.5" width="4.5" height="4.5" rx="1"/><rect x="9.5" y="9.5" width="4.5" height="4.5" rx="1"/>',
  link: '<path d="m6.5 5.5 1.75-1.75a3.18 3.18 0 0 1 4.5 4.5L11 10M5 6 3.25 7.75a3.18 3.18 0 0 0 4.5 4.5L9.5 10.5M5.5 10.5l5-5"/>',
  search: '<circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/>',
  arrow: '<path d="M3 8h10M9 4l4 4-4 4"/>',
  send: '<path d="m2 2 12 6-12 6 2-6-2-6ZM4 8h10"/>',
  shield: '<path d="M8 1.5 13.5 4v4c0 3-3 5.5-5.5 6.5C5.5 13.5 2.5 11 2.5 8V4L8 1.5Z"/><path d="m5.5 8 1.75 1.75 3.25-3.5"/>',
  folder: '<path d="M1.5 5V4A1.5 1.5 0 0 1 3 2.5h3L8 4h5A1.5 1.5 0 0 1 14.5 5.5v7A1.5 1.5 0 0 1 13 14H3a1.5 1.5 0 0 1-1.5-1.5V5ZM1.5 6h13"/>',
  layers: '<path d="m8 1.5 6.5 3.25L8 8 1.5 4.75 8 1.5ZM1.5 8 8 11.25 14.5 8M1.5 11.25 8 14.5l6.5-3.25"/>',
  globe: '<circle cx="8" cy="8" r="6.25"/><path d="M1.75 8h12.5M8 1.75c2.75 3 2.75 9.5 0 12.5-2.75-3-2.75-9.5 0-12.5Z"/>',
  chart: '<path d="M2 2v12h12M5 10V7M8.5 10V4M12 10V6"/>',
  pen: '<path d="m10.5 2 3.5 3.5-8.5 8.5-4 .5.5-4L10.5 2ZM8.5 4l3.5 3.5M2 10.5 5.5 14"/>',
};

const icon = (name, extra = '') => `<svg class="scene-icon ${extra}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
const dots = '<span class="scene-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
const bars = (extra = '') => `<span class="scene-lines ${extra}" aria-hidden="true"><i></i><i></i><i></i></span>`;
const header = (name, symbol) => `<div class="scene-window-head"><span class="scene-window-title">${icon(symbol)}<b>${name}</b></span>${dots}</div>`;
const choice = (symbol, title, detail, active = false) => `<div class="scene-choice${active ? ' is-chosen' : ''}"><span class="scene-choice-icon">${icon(symbol)}</span><span><b>${title}</b><small>${detail}</small></span><span class="scene-choice-end">${icon(active ? 'check' : 'arrow')}</span></div>`;

/** Return one of five layered, responsive workflow illustrations. */
export function sceneArt(kind, en = false) {
  const t = (zh, english) => en ? english : zh;
  const labels = {
    weekly: t('定时整理每周工作与计划的场景示意', 'Illustration of a scheduled weekly review'),
    team: t('团队共享知识与工作方法的场景示意', 'Illustration of shared team knowledge and working methods'),
    service: t('应用内 AI 服务的场景示意', 'Illustration of an in-app AI service'),
    skills: t('发现并选择专业技能的场景示意', 'Illustration of discovering specialist skills'),
    workspace: t('在自有环境组织专家与知识的场景示意', 'Illustration of experts and knowledge in your own workspace'),
  };
  let art = '';

  if (kind === 'weekly') art = `
    <div class="scene-horizon" aria-hidden="true"></div>
    <div class="scene-paper scene-paper-back" data-depth="20">${icon('file')}${bars()}</div>
    <div class="scene-window scene-weekly-window" data-depth="36">
      ${header(t('每周复盘', 'Weekly review'), 'calendar')}
      <div class="scene-weekly-date"><span>${t('周五 · 下午', 'FRIDAY · AFTERNOON')}</span>${icon('clock')}</div>
      <h4>${t('给这一周，<br>一个清晰的回顾。', 'A clear view<br>of the week.')}</h4>
      <div class="scene-review-item"><span class="scene-check">${icon('check')}</span><span>${t('整理本周进展', 'Gather this week’s updates')}</span></div>
      <div class="scene-review-item"><span class="scene-check">${icon('check')}</span><span>${t('归纳问题与下一步', 'Outline what comes next')}</span></div>
      <div class="scene-mini-document">${icon('file')}<span>${t('本周复盘与下周计划', 'Weekly review & next steps')}</span>${icon('arrow')}</div>
    </div>
    <div class="scene-note scene-weekly-note" data-depth="55"><span class="scene-note-icon">${icon('clock')}</span><span><b>${t('按计划，继续。', 'Keep it on schedule.')}</b><small>${t('每周五 · 整理工作', 'Every Friday · weekly review')}</small></span></div>`;

  if (kind === 'team') art = `
    <div class="scene-orbit scene-team-orbit" aria-hidden="true"></div>
    <div class="scene-window scene-team-window" data-depth="30">
      ${header(t('团队工作空间', 'Team workspace'), 'people')}
      <div class="scene-team-body"><div class="scene-team-rail" aria-hidden="true"><span class="is-active">${icon('grid')}</span><span>${icon('book')}</span><span>${icon('layers')}</span><span>${icon('people')}</span></div>
        <div class="scene-team-content"><span class="scene-eyebrow">${t('把经验带给团队', 'EXPERTISE, SHARED')}</span><h4>${t('好方法，一起用。', 'Good methods.<br>For everyone.')}</h4>
          <div class="scene-asset-row"><span class="scene-asset-icon">${icon('book')}</span><span><b>${t('项目知识', 'Project knowledge')}</b><small>${t('共享资料与业务背景', 'A shared source of context')}</small></span></div>
          <div class="scene-asset-row"><span class="scene-asset-icon">${icon('layers')}</span><span><b>${t('团队技能', 'Team skills')}</b><small>${t('复用成熟的工作方法', 'Proven ways of working')}</small></span></div>
          <div class="scene-member-line"><span class="scene-initials"><i>J</i><i>M</i><i>L</i></span><small>${t('在同一个起点协作', 'A common place to begin')}</small></div>
        </div>
      </div>
    </div>
    <div class="scene-note scene-team-note" data-depth="55"><span class="scene-note-icon">${icon('shield')}</span><span><b>${t('适合团队的规则', 'Rules that fit the team')}</b><small>${t('知识、技能与使用权限', 'Knowledge, skills & permissions')}</small></span></div>`;

  if (kind === 'service') art = `
    <div class="scene-sun scene-service-sun" aria-hidden="true"></div>
    <div class="scene-service-card" data-depth="20"><span>${icon('globe')}</span><b>${t('你的产品', 'Your product')}</b>${bars()}</div>
    <div class="scene-window scene-service-window" data-depth="40">
      ${header(t('品牌服务助手', 'Your service assistant'), 'spark')}
      <div class="scene-chat"><div class="scene-chat-question">${t('我想了解适合我的服务。', 'Help me find the right service.')}</div><div class="scene-chat-answer"><span class="scene-assistant-mark">${icon('spark')}</span><div><p>${t('当然。先从你的需求开始。', 'Of course. Let’s start with what you need.')}</p><div class="scene-service-options"><span>${t('了解产品', 'Explore options')}${icon('arrow')}</span><span>${t('查看服务指南', 'Service guide')}${icon('file')}</span></div></div></div><span class="scene-context-label">${icon('link')}${t('结合企业知识与服务流程', 'Grounded in your knowledge & workflows')}</span></div>
      <div class="scene-chat-input"><span>${t('继续说说你的需要', 'Tell me what you need')}</span><i>${icon('send')}</i></div>
    </div>
    <div class="scene-note scene-service-note" data-depth="55"><span class="scene-note-icon">${icon('link')}</span><span><b>${t('融入已有的服务', 'Part of your service')}</b><small>${t('应用 · 官网 · 业务系统', 'Apps · websites · business systems')}</small></span></div>`;

  if (kind === 'skills') art = `
    <div class="scene-orbit scene-skills-orbit" aria-hidden="true"></div>
    <div class="scene-skill-sheet scene-skill-sheet-back" data-depth="20"></div>
    <div class="scene-skill-sheet scene-skill-sheet-mid" data-depth="28"></div>
    <div class="scene-window scene-skills-window" data-depth="38">
      ${header(t('为任务找到技能', 'A skill for the task'), 'grid')}
      <div class="scene-skills-body"><div class="scene-search">${icon('search')}<span>${t('发现下一项专业能力', 'Find your next capability')}</span></div><span class="scene-eyebrow">${t('从你想完成的事开始', 'START WITH THE TASK')}</span>
        ${choice('globe', t('深度研究', 'Deep research'), t('资料收集与观点整理', 'Sources, research & synthesis'), true)}
        ${choice('chart', t('数据分析', 'Data analysis'), t('整理数据，读懂趋势', 'Find structure in your data'))}
        ${choice('pen', t('内容创作', 'Content creation'), t('从想法到清晰表达', 'From an idea to a clear story'))}
      </div>
    </div>
    <div class="scene-note scene-skills-note" data-depth="55"><span class="scene-note-icon">${icon('link')}</span><span><b>${t('接入正在用的 Agent', 'Extend the Agent you use')}</b><small>${t('发现 · 安装 · 开始使用', 'Discover · install · put to work')}</small></span></div>`;

  if (kind === 'workspace') art = `
    <div class="scene-orbit scene-workspace-orbit" aria-hidden="true"></div>
    <div class="scene-folder" data-depth="20"><span>${icon('folder')}</span><b>${t('你的知识', 'Your knowledge')}</b>${bars()}</div>
    <div class="scene-window scene-workspace-window" data-depth="36">
      ${header(t('我的 AI 空间', 'My AI workspace'), 'grid')}
      <div class="scene-workspace-body"><span class="scene-eyebrow">${t('知识、记忆与专属专家', 'KNOWLEDGE, MEMORY & EXPERTS')}</span><h4>${t('在熟悉的知识里，<br>找到下一步。', 'Your knowledge.<br>A place to grow.')}</h4>
        <div class="scene-expert"><span class="scene-expert-mark">${icon('spark')}</span><span><b>${t('专属知识专家', 'Your knowledge expert')}</b><small>${t('围绕已有资料开展工作', 'Working with your own materials')}</small></span></div>
        <div class="scene-knowledge-item">${icon('book')}<span>${t('团队知识库', 'Team knowledge')}</span>${icon('arrow')}</div>
        <div class="scene-knowledge-item">${icon('layers')}<span>${t('工作空间记忆', 'Workspace memory')}</span>${icon('arrow')}</div>
      </div>
    </div>
    <div class="scene-note scene-workspace-note" data-depth="55"><span class="scene-note-icon">${icon('shield')}</span><span><b>${t('在自己的环境中运行', 'Run it in your environment')}</b><small>${t('开源 · 自托管 · 可扩展', 'Open source · self-hosted · extensible')}</small></span></div>`;

  if (!art) return '';
  return `<div class="scene-art scene-${kind}${en ? ' scene-en' : ''}" role="img" aria-label="${labels[kind]}">${art}<span class="scene-art-caption">${t('场景示意', 'WORKFLOW ILLUSTRATION')}</span></div>`;
}
