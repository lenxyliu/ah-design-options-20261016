// Brand illustrations, not product screenshots or live service status.
// ClawPro narrative follows 语料库/ClawPro生态大会物料文案_v4.md.
const icon = (name, className = '') => {
  const paths = {
    agent: '<rect x="5" y="5" width="22" height="19" rx="6"/><path d="m11 24-3 5m13-5 3 5M16 2v3M10 12h.01M22 12h.01M11 18h10"/>',
    cloud: '<path d="M9 25h16a6 6 0 0 0 .5-12 9.5 9.5 0 0 0-18-2A7.1 7.1 0 0 0 9 25Z"/><path d="M16 14v9m-4-5 4-4 4 4"/>',
    clock: '<circle cx="16" cy="16" r="12"/><path d="M16 8v8l5 3"/>',
    document: '<path d="M9 3h11l6 6v20H6V3h3Zm11 0v7h6M11 16h10M11 21h10M11 26h6"/>',
    search: '<circle cx="14" cy="14" r="9"/><path d="m21 21 8 8M9 14h10M14 9v10"/>',
    code: '<path d="m10 8-8 8 8 8m12-16 8 8-8 8M19 4l-6 24"/>',
    member: '<circle cx="16" cy="10" r="5"/><path d="M5 29v-4a11 11 0 0 1 22 0v4"/>',
    book: '<path d="M3 5c5-2 9-2 13 1 4-3 8-3 13-1v22c-5-2-9-2-13 1-4-3-8-3-13-1V5Zm13 1v22M7 11h5m-5 5h5m8-5h5m-5 5h5"/>',
    spark: '<path d="m16 2 3.8 10.2L30 16l-10.2 3.8L16 30l-3.8-10.2L2 16l10.2-3.8L16 2Z"/>',
    memory: '<path d="M16 5c-5-6-13 0-10 6-6 2-5 11 1 12 0 6 7 9 9 3 2 6 9 3 9-3 6-1 7-10 1-12 3-6-5-12-10-6Zm0 0v21M8 11l4 3m-5 9 5-4m12-8-4 3m5 9-5-4"/>',
    lock: '<rect x="6" y="13" width="20" height="16" rx="3"/><path d="M10 13V8a6 6 0 0 1 12 0v5M16 20v3"/>',
    layers: '<path d="m16 3 14 8-14 8L2 11l14-8Zm-14 16 14 8 14-8M2 25l14 8 14-8"/>',
  };
  return `<svg class="ps-icon${className ? ` ${className}` : ''}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
};

const frame = (id, name, content, footer) => `
  <div class="product-scene ps-scene-${id}" role="img" aria-label="${name}能力示意：${footer}">
    <div class="ps-canvas">
      <div class="ps-header"><span><i></i>${name}</span><span class="ps-figure-note">能力示意</span></div>
      ${content}
      <div class="ps-footer"><span>${footer}</span><span class="ps-footer-mark" aria-hidden="true">＋</span></div>
    </div>
  </div>`;

export const productScenes = [
  {
    id: 'lighthouse',
    label: '云端运行',
    title: 'Agent 的云端工作现场',
    description: '部署、配置与协作在一个云端工作台展开，让不同角色围绕任务各司其职。',
    html: frame('lighthouse', 'Lighthouse Agent', `
      <div class="ps-lh-floor" aria-hidden="true"></div>
      <div class="ps-lh-window">
        <div class="ps-window-bar"><span>云端 Agent 工作台</span><span class="ps-window-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>
        <div class="ps-lh-lead">${icon('agent')}<strong>主 Agent</strong><span>拆解任务 · 协调分工</span></div>
        <svg class="ps-lh-wires" viewBox="0 0 120 170" fill="none" aria-hidden="true"><path d="M1 85H43V22H119M43 85H119M43 85v63H119"/><path class="ps-flow" d="M1 85H43V22H119"/></svg>
        <div class="ps-lh-roles">
          <div class="ps-role">${icon('document')}<div><strong>内容 Agent</strong><span>创作任务</span></div><i>01</i></div>
          <div class="ps-role">${icon('search')}<div><strong>研究 Agent</strong><span>信息收集</span></div><i>02</i></div>
          <div class="ps-role">${icon('code')}<div><strong>开发 Agent</strong><span>代码任务</span></div><i>03</i></div>
        </div>
      </div>
      <div class="ps-lh-schedule">${icon('clock')}<div><strong>定时任务</strong><span>按计划发起工作</span></div><span class="ps-schedule-tick" aria-hidden="true"></span></div>
      <div class="ps-lh-cloud">${icon('cloud')}<strong>云端环境</strong><span>模型 · 通道 · 工具</span><i aria-hidden="true"></i></div>
    `, '从任务分工，到云端持续运行'),
  },
  {
    id: 'clawpro',
    label: '企业经验复用',
    title: '让企业经验，流向业务应用',
    description: '连接组织成员、知识与技能资产，让成熟方法在团队中复用，并融入企业产品与服务。',
    html: frame('clawpro', 'ClawPro', `
      <div class="ps-cp-outline" aria-hidden="true"></div>
      <div class="ps-cp-team"><span class="ps-layer-label">组织成员</span><div>${icon('member')}<span>业务专家</span></div><div>${icon('member')}<span>产品团队</span></div><div>${icon('member')}<span>运营团队</span></div></div>
      <svg class="ps-cp-wires" viewBox="0 0 460 230" fill="none" aria-hidden="true"><path d="M90 1v38h280V1M230 39v31M90 139v25h280v-25M230 164v50"/><path class="ps-flow" d="M230 39v31M230 164v50"/></svg>
      <div class="ps-cp-assets">
        <div class="ps-cp-assets-title"><span class="ps-cp-logo">C</span><strong>企业经验资产</strong><span>集中维护 · 按需分发</span></div>
        <div class="ps-cp-asset-items"><span>${icon('book')}知识库</span><span>${icon('spark')}技能与规范</span><span>${icon('layers')}工作方法</span></div>
      </div>
      <div class="ps-cp-base"><span class="ps-layer-label">业务应用</span><div><strong>团队经验复用</strong><span>推动工作方式升级</span></div><i aria-hidden="true">↗</i><div><strong>企业产品与服务</strong><span>探索 AI 应用创新</span></div></div>
      <span class="ps-cp-governance">权限 · 配额 · 持续治理</span>
    `, '组织经验沉淀为资产，支撑团队与业务创新'),
  },
  {
    id: 'skillhub',
    label: '专业能力接入',
    title: '按任务，装上专业能力',
    description: '像接入可插拔模块一样，为现有 Agent 选择技能、工具与专业服务。',
    html: frame('skillhub', 'SkillHub', `
      <div class="ps-sh-guide">发现专业技能<span>选择所需能力，接入现有 Agent</span></div>
      <div class="ps-sh-modules">
        <div class="ps-skill ps-skill-one"><span class="ps-skill-icon">${icon('search')}</span><div><strong>信息整理</strong><span>汇集资料 · 提炼要点</span></div><i aria-hidden="true"></i></div>
        <div class="ps-skill ps-skill-two"><span class="ps-skill-icon">${icon('document')}</span><div><strong>文档处理</strong><span>阅读分析 · 编辑输出</span></div><i aria-hidden="true"></i></div>
        <div class="ps-skill ps-skill-three"><span class="ps-skill-icon">${icon('code')}</span><div><strong>开发工具</strong><span>调用工具 · 辅助开发</span></div><i aria-hidden="true"></i></div>
      </div>
      <svg class="ps-sh-wires" viewBox="0 0 170 210" fill="none" aria-hidden="true"><path d="M0 17h58q14 0 14 14v53q0 17 17 17h81M0 101h170M0 185h58q14 0 14-14v-53q0-17 17-17h81"/><path class="ps-flow" d="M0 101h170"/></svg>
      <div class="ps-sh-agent"><div class="ps-sh-ring" aria-hidden="true"></div><div class="ps-sh-agent-face">${icon('agent')}<strong>你的 Agent</strong></div><span>专业能力，按需补充</span></div>
      <div class="ps-sh-types"><span>Skill</span><span>Plugin</span><span>MCP</span></div>
    `, '将专业经验，变成 Agent 可调用的能力'),
  },
  {
    id: 'octop',
    label: '自有工作空间',
    title: '把知识与专家，留在你的空间',
    description: '在自有环境中组织知识、长期记忆与专属专家，让积累支持后续工作。',
    html: frame('octop', 'Octop', `
      <div class="ps-ot-environment"><span>${icon('lock')}自有环境</span><i>自主部署 · 自主管理</i><b aria-hidden="true"></b></div>
      <div class="ps-ot-documents"><div aria-hidden="true"></div><div aria-hidden="true"></div><div>${icon('book')}<strong>知识资料</strong><span>你的文件与知识库</span><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i></div></div>
      <svg class="ps-ot-wires" viewBox="0 0 330 170" fill="none" aria-hidden="true"><path d="M0 55h75q15 0 15 15v20h88M35 145h50q15 0 15-15v-25h78"/><path class="ps-flow" d="M0 55h75q15 0 15 15v20h88"/></svg>
      <div class="ps-ot-workspace"><div class="ps-window-bar"><span>Octop 工作空间</span><span class="ps-window-dots" aria-hidden="true"><i></i><i></i></span></div><div class="ps-ot-expert">${icon('agent')}<div><strong>专属专家</strong><span>基于已有知识</span></div></div><div class="ps-ot-message"><span>从已有资料，继续工作</span><i aria-hidden="true">↗</i></div><div class="ps-ot-context"><span>${icon('book')}知识</span><span>${icon('memory')}记忆</span><span>${icon('spark')}工具</span></div></div>
      <div class="ps-ot-memory">${icon('memory')}<div><strong>长期记忆</strong><span>积累上下文，支持后续任务</span></div><span class="ps-memory-lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>
    `, '知识、记忆与专家，在自有环境中协作'),
  },
];
