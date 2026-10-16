/* Product capabilities shown as spatial illustrations, never as live product status. */
const icon = (name, cls = '') => {
  const paths = {
    spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
    research: '<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 6 6M7 10h6M10 7v6"/>',
    write: '<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h6"/>',
    code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    cloud: '<path d="M7 18H6a5 5 0 0 1-1-9.9A7 7 0 0 1 18.5 7a5.5 5.5 0 0 1-.5 11h-1M12 12v10m-3-7 3-3 3 3"/>',
    book: '<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7Zm-10 10 10 5 10-5M2 17l10 5 10-5"/>',
    flow: '<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="1" y="16" width="8" height="6" rx="1"/><rect x="15" y="16" width="8" height="6" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>',
    team: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 3a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 5v2"/>',
    grid: '<rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/>',
    plug: '<path d="M8 2v5m8-5v5M5 7h14v3a7 7 0 0 1-7 7v5m0-5a7 7 0 0 1-7-7"/>',
    memory: '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4M9 9h6v6H9z"/>',
    lock: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
    server: '<rect x="3" y="2" width="18" height="8" rx="2"/><rect x="3" y="14" width="18" height="8" rx="2"/><path d="M7 6h.01M7 18h.01M12 6h5m-5 12h5"/>',
    arrow: '<path d="M3 12h18m-7-7 7 7-7 7"/>',
  };
  return `<svg class="iw-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
};
const tag = '<span class="iw-capability">能力示意</span>';
const wire = (kind) => `<div class="iw-layer iw-wires iw-wires-${kind}" aria-hidden="true"><svg viewBox="0 0 1100 600" preserveAspectRatio="none"><defs><linearGradient id="iw-${kind}-line"><stop stop-color="#245BFF" stop-opacity="0"/><stop offset=".4" stop-color="#245BFF" stop-opacity=".55"/><stop offset="1" stop-color="#245BFF" stop-opacity=".15"/></linearGradient></defs><g fill="none" stroke="url(#iw-${kind}-line)" stroke-width="1.3">${kind === 'lh' ? '<path d="M330 190H442V300H590M340 320H590M360 440H442V300M590 300H815V150M590 300H815V420"/><ellipse cx="580" cy="310" rx="365" ry="188" stroke-dasharray="3 8"/>' : kind === 'cp' ? '<path d="M270 170H400L560 300M270 300H560M270 435H400L560 300M560 300H720L850 170M560 300H880M560 300H720L850 430"/><path d="M365 105H750M365 495H750" stroke-dasharray="3 7"/>' : kind === 'sh' ? '<path d="M300 170 550 300 830 155M250 320H550L850 330M355 465 550 300 780 465"/><ellipse cx="550" cy="300" rx="310" ry="195" stroke-dasharray="2 9"/>' : '<path d="M350 175H440V300H565M350 415H440V300M565 300H730V170M565 300H730V410"/><ellipse cx="560" cy="300" rx="300" ry="175" stroke-dasharray="3 9"/>'}</g><g fill="#245BFF" opacity=".6"><circle cx="${kind === 'sh' ? '550' : '560'}" cy="300" r="4"/><circle cx="${kind === 'lh' ? '442' : '400'}" cy="300" r="2.5"/></g></svg></div>`;
const role = (cls, symbol, name, job, detail) => `<div class="iw-layer iw-role ${cls}"><span class="iw-role-icon">${icon(symbol)}</span><div><small>${job}</small><strong>${name}</strong><span>${detail}</span></div><i class="iw-role-node"></i></div>`;

export const immersiveWorlds = [
  {
    id: 'lighthouse', label: '云端的协作现场',
    html: `<div class="iw-world iw-lighthouse" aria-label="Lighthouse Agent 能力示意：主 Agent 协调研究、内容与开发角色，并连接云端环境和定时任务"><div class="iw-rig">
      <div class="iw-layer iw-orbit iw-lh-orbit" aria-hidden="true"><span></span><i></i><b></b></div>
      ${wire('lh')}
      <div class="iw-layer iw-world-word iw-lh-word" aria-hidden="true">COLLABORATE</div>
      ${role('iw-lh-research', 'research', '研究 Agent', 'RESEARCH', '检索信息 · 形成依据')}
      ${role('iw-lh-content', 'write', '内容 Agent', 'CONTENT', '整理观点 · 完成表达')}
      ${role('iw-lh-code', 'code', '开发 Agent', 'DEVELOPMENT', '编写代码 · 调用工具')}
      <div class="iw-layer iw-agent-core iw-lh-core"><span class="iw-core-orb">${icon('spark')}</span><small>ORCHESTRATION</small><h3>主 Agent</h3><p>一个目标，多角色协作</p><div class="iw-core-task"><span>任务目标</span><strong>完成一份产品研究</strong></div><div class="iw-core-steps"><span>拆解</span><b>→</b><span>分工</span><b>→</b><span>协作</span></div></div>
      <div class="iw-layer iw-cloud-env"><span class="iw-symbol">${icon('cloud')}</span><div><small>CLOUD WORKSPACE</small><strong>云端工作环境</strong><span>模型 / 工具 / 消息通道</span></div><div class="iw-cloud-mesh" aria-hidden="true"></div></div>
      <div class="iw-layer iw-schedule"><span class="iw-symbol">${icon('clock')}</span><div class="iw-schedule-copy"><small>SCHEDULED TASK</small><strong>按计划，继续推进</strong><span>定时收集 · 生成摘要 · 分发结果</span></div><div class="iw-time-ruler" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b><i></i><i></i></div></div>
      <div class="iw-layer iw-terminal iw-lh-terminal"><span>WORKFLOW / EXAMPLE</span><code><i>task</i> → <b>research</b><br><i>context</i> → content + code<br><i>result</i> → shared workspace</code></div>
      ${tag}
    </div></div>`,
  },
  {
    id: 'clawpro', label: '企业经验的展开方式',
    html: `<div class="iw-world iw-clawpro" aria-label="ClawPro 能力示意：企业知识、技能、方法沉淀为可复用资产，服务组织协作、业务应用与 AI 产品孵化"><div class="iw-rig">
      <div class="iw-layer iw-cp-plane" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      ${wire('cp')}
      <div class="iw-layer iw-world-word iw-cp-word" aria-hidden="true">BUILD ON EXPERIENCE</div>
      <div class="iw-layer iw-asset iw-asset-knowledge"><span class="iw-symbol">${icon('book')}</span><small>KNOWLEDGE</small><strong>行业知识</strong><p>术语 · 资料 · 业务背景</p><div class="iw-doc-lines" aria-hidden="true"><i></i><i></i><i></i></div></div>
      <div class="iw-layer iw-asset iw-asset-skill"><span class="iw-symbol">${icon('plug')}</span><small>SKILLS</small><strong>专业技能</strong><p>工具 · 流程 · 任务方法</p><div class="iw-asset-code">skill / reusable</div></div>
      <div class="iw-layer iw-asset iw-asset-method"><span class="iw-symbol">${icon('flow')}</span><small>METHODS</small><strong>成熟方法</strong><p>规则 · 模板 · 实践经验</p><div class="iw-method-flow" aria-hidden="true"><i></i><b></b><i></i><b></b><i></i></div></div>
      <div class="iw-layer iw-cp-core"><div class="iw-cp-core-crown" aria-hidden="true"><i></i><i></i><i></i></div><small>ENTERPRISE AGENT PLATFORM</small><h3>ClawPro</h3><p>把企业积累<br>变成可复用的数字资产</p><div class="iw-cp-core-foot"><span>构建 Agent</span><i></i><span>沉淀资产</span><i></i><span>应用与治理</span></div></div>
      <div class="iw-layer iw-outcome iw-outcome-team"><span class="iw-symbol">${icon('team')}</span><div><small>ORGANIZATION</small><strong>让团队共享经验</strong><span>按组织与角色推广成熟方法</span></div><i>01</i></div>
      <div class="iw-layer iw-outcome iw-outcome-business"><span class="iw-symbol">${icon('flow')}</span><div><small>BUSINESS APPLICATIONS</small><strong>让能力进入业务</strong><span>结合模型、工具与业务接口</span></div><i>02</i></div>
      <div class="iw-layer iw-outcome iw-outcome-product"><span class="iw-symbol">${icon('spark')}</span><div><small>AI PRODUCT INCUBATION</small><strong>孵化自己的 AI 产品</strong><span>将行业积累融入产品与服务</span></div><i>03</i></div>
      <div class="iw-layer iw-governance"><span>组织治理</span><i></i><span>效能评测</span><i></i><span>持续运营</span><b>让成熟经验持续服务业务</b></div>
      ${tag}
    </div></div>`,
  },
  {
    id: 'skillhub', label: '为 Agent 接入专业能力',
    html: `<div class="iw-world iw-skillhub" aria-label="SkillHub 能力示意：研究、内容、开发等专业技能以 Skill、Plugin 与 MCP 的方式接入 Agent"><div class="iw-rig">
      <div class="iw-layer iw-orbit iw-sh-orbit" aria-hidden="true"><span></span><i></i><b></b></div>
      ${wire('sh')}
      <div class="iw-layer iw-world-word iw-sh-word" aria-hidden="true">PLUG IN POSSIBILITY</div>
      <div class="iw-layer iw-skill-module iw-skill-research"><span class="iw-module-pins" aria-hidden="true"></span><span class="iw-symbol">${icon('research')}</span><small>SKILL / RESEARCH</small><strong>深度研究</strong><p>搜索信息，交叉整理依据</p><div class="iw-skill-input"><span>Input</span>研究主题 ${icon('arrow')}</div></div>
      <div class="iw-layer iw-skill-module iw-skill-content"><span class="iw-module-pins" aria-hidden="true"></span><span class="iw-symbol">${icon('write')}</span><small>SKILL / CONTENT</small><strong>内容创作</strong><p>把观点组织成完整表达</p><div class="iw-skill-input"><span>Output</span>文稿与内容 ${icon('arrow')}</div></div>
      <div class="iw-layer iw-skill-module iw-skill-code"><span class="iw-module-pins" aria-hidden="true"></span><span class="iw-symbol">${icon('code')}</span><small>PLUGIN / DEVELOPMENT</small><strong>开发工具</strong><p>把工具接入任务流程</p><div class="iw-skill-input"><span>Tool</span>开发环境 ${icon('arrow')}</div></div>
      <div class="iw-layer iw-skill-core"><span class="iw-skill-core-ring" aria-hidden="true"></span><span class="iw-core-orb">${icon('spark')}</span><small>YOUR AGENT</small><h3>Agent</h3><p>按任务，接入所需能力</p><div class="iw-ports"><span>SKILL</span><span>PLUGIN</span><span>MCP</span></div></div>
      <div class="iw-layer iw-skill-module iw-skill-service"><span class="iw-module-pins" aria-hidden="true"></span><span class="iw-symbol">${icon('team')}</span><small>PROFESSIONAL SERVICE</small><strong>专业服务</strong><p>让行业经验被 Agent 调用</p></div>
      <div class="iw-layer iw-skill-module iw-skill-connector"><span class="iw-module-pins" aria-hidden="true"></span><span class="iw-symbol">${icon('plug')}</span><small>MCP / CONNECTOR</small><strong>业务连接</strong><p>连接数据与工作工具</p></div>
      <div class="iw-layer iw-sh-route"><span>发现技能</span><b>↗</b><span>选择接入</span><b>↗</b><span>扩展任务边界</span></div>
      <div class="iw-layer iw-sh-publish"><span>${icon('layers')} 创作者 / 专业服务提供方</span><strong>把你的专业，变成更多 Agent 的能力。</strong></div>
      ${tag}
    </div></div>`,
  },
  {
    id: 'octop', label: '在自己的环境里持续积累',
    html: `<div class="iw-world iw-octop" aria-label="Octop 能力示意：知识、长期记忆与专属专家在自有部署环境内协作，支持个人与团队的 AI 工作空间"><div class="iw-rig">
      <div class="iw-layer iw-own-boundary" aria-hidden="true"><span class="iw-boundary-corner"></span><span class="iw-boundary-corner"></span><span class="iw-boundary-corner"></span><span class="iw-boundary-corner"></span><b>YOUR ENVIRONMENT</b><i>知识 / 对话 / 凭据，由你管理</i></div>
      ${wire('oc')}
      <div class="iw-layer iw-world-word iw-oc-word" aria-hidden="true">YOUR OWN SPACE</div>
      <div class="iw-layer iw-knowledge"><span class="iw-symbol">${icon('book')}</span><small>KNOWLEDGE</small><h4>自己的知识</h4><p>围绕已有资料开展工作</p><div class="iw-knowledge-file"><i>01</i><span>产品与业务资料</span><b>DOC</b></div><div class="iw-knowledge-file"><i>02</i><span>方法与实践记录</span><b>MD</b></div><div class="iw-knowledge-file"><i>03</i><span>团队共享知识</span><b>PDF</b></div></div>
      <div class="iw-layer iw-memory"><span class="iw-symbol">${icon('memory')}</span><small>LONG-TERM MEMORY</small><h4>持续积累的记忆</h4><p>为下一次任务保留有用上下文</p><div class="iw-memory-thread"><i></i><span>任务背景</span><i></i><span>使用偏好</span><i></i><span>长期目标</span></div></div>
      <div class="iw-layer iw-octop-core"><span class="iw-octop-emblem" aria-hidden="true"><i></i><i></i><i></i><i></i><b>${icon('spark')}</b></span><small>SELF-HOSTED WORKSPACE</small><h3>Octop</h3><p>属于自己的<br>AI 工作空间</p><div class="iw-octop-core-foot">知识 × 记忆 × 专家</div></div>
      <div class="iw-layer iw-expert iw-expert-domain"><span class="iw-expert-avatar">${icon('research')}</span><div><small>DOMAIN EXPERT</small><strong>业务专家</strong><span>结合领域知识回答与协作</span></div></div>
      <div class="iw-layer iw-expert iw-expert-project"><span class="iw-expert-avatar">${icon('flow')}</span><div><small>PROJECT EXPERT</small><strong>项目助手</strong><span>围绕项目上下文继续推进</span></div></div>
      <div class="iw-layer iw-selfhost"><span class="iw-symbol">${icon('server')}</span><div><small>SELF-HOSTED</small><strong>自有服务器 / 内网环境</strong><span>自主部署 · 扩展工具 · 多用户协作</span></div><span class="iw-selfhost-lock">${icon('lock')}</span></div>
      ${tag}
    </div></div>`,
  },
];
