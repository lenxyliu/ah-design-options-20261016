// Product copy and media slots are intentionally centralized for product-team updates.
// Source baseline: 2026-10-14 integrated brochure and the current four-product corpus.
// The prototype has no confirmed destination URLs; resources open a local detail view.

export const products = [
  {
    id: 'lighthouse',
    name: 'Lighthouse Agent',
    short: 'Lighthouse',
    category: '云端 Agent 平台',
    intro: '在云端部署主流 Agent，集中完成配置、使用与运行管理。',
    intent: '我想让 Agent 在云端运行',
    audience: '希望便捷部署云端 Agent 的个人、开发者与小型团队。',
    features: [
      { title: '部署与配置', text: '支持主流 Agent 上云，在一个控制台配置模型、消息通道与 Skills。' },
      { title: '多 Agent 协作', text: '按任务组织不同角色，通过群聊、定时任务与工具协同执行。' },
      { title: '运行与观测', text: '集中查看云资源、Token 消耗与 Agent 运行情况。' },
    ],
    scenes: [
      { title: '办公自动化', text: '让云端 Agent 按计划处理重复任务，通过连接器使用工作工具。' },
      { title: '内容与开发协作', text: '组织不同角色分工，协作处理创作、开发与研究任务。' },
    ],
    ctaLabel: '了解 Lighthouse Agent',
    detailLabel: '探索云端部署',
    media: {
      type: 'placeholder',
      title: '云端 Agent 的工作现场',
      caption: '预留产品界面或演示视频，由 Lighthouse Agent 团队提供。',
    },
  },
  {
    id: 'clawpro',
    name: 'ClawPro',
    short: 'ClawPro',
    category: '企业 Agent 管控平台',
    intro: '统一管理云端与 PC 本地 Agent，让配置、资产、成本与安全可见可控。',
    intent: '我想统一管理企业的 Agent',
    audience: '规模化使用 Agent 的企业，以及 IT、平台、安全与成本管理团队。',
    features: [
      { title: '多类型 Agent 纳管', text: '在统一视图中管理云端与 PC 本地的多类型 Agent。' },
      { title: '企业资产分发', text: '按团队或项目集中配置与更新模型、Token、Skills 和 Rules。' },
      { title: '成本与安全治理', text: '结合消耗分析、权限管理、凭据保护与操作审计开展治理。' },
    ],
    scenes: [
      { title: '企业规模化使用', text: '让不同团队按组织规则获取、配置和使用 Agent 资源。' },
      { title: '成本与风险管理', text: '查看使用消耗与操作情况，管理资源权限和企业资产。' },
    ],
    ctaLabel: '了解 ClawPro',
    detailLabel: '探索企业管控',
    media: {
      type: 'placeholder',
      title: '企业 Agent 的统一视图',
      caption: '预留管控台界面或演示视频，由 ClawPro 团队提供。',
    },
  },
  {
    id: 'skillhub',
    name: 'SkillHub',
    short: 'SkillHub',
    category: 'Agent 技能社区与能力市场',
    intro: '发现、安装与发布专业技能，为现有 Agent 补充能力，也让专业服务被调用。',
    intent: '我想为 Agent 增加专业能力',
    audience: '技能使用者、创作者、专业服务提供方与企业团队。',
    features: [
      { title: '发现与安装', text: '通过搜索、推荐与榜单找到技能，将所需能力接入 Agent。' },
      { title: '发布与治理', text: '发布 Skill、Plugin 与 MCP，以评估、审核与风险检查辅助选择。' },
      { title: '专业服务', text: '将专业经验与工具组织为可供 Agent 调用的服务。' },
    ],
    scenes: [
      { title: '按任务补充能力', text: '为办公、研究或内容任务找到相应工具与技能。' },
      { title: '发布专业服务', text: '将经验、工具与专业服务组织为可供 Agent 调用的技能。' },
    ],
    ctaLabel: '了解 SkillHub',
    detailLabel: '探索技能生态',
    media: {
      type: 'placeholder',
      title: '从技能发现到实际调用',
      caption: '预留技能详情、安装流程或演示视频，由 SkillHub 团队提供。',
    },
  },
  {
    id: 'octop',
    name: 'Octop',
    short: 'Octop',
    category: '开源自托管 AI 助手',
    intro: '在自有环境中组织专家、知识与记忆，构建可持续使用的 AI 工作空间。',
    intent: '我想自主部署和扩展 AI 助手',
    audience: '重视自托管、知识留存与多用户协作的个人、团队和开发者。',
    features: [
      { title: '自托管与扩展', text: '部署于自有服务器与内网，自主管理对话、文件与凭据。' },
      { title: '知识与长期记忆', text: '在工作空间中积累知识与记忆，支持后续任务按需调用。' },
      { title: '专家与团队协作', text: '创建专属专家，结合知识库、连接器与工具协作执行任务。' },
    ],
    scenes: [
      { title: '专属知识助手', text: '结合个人或组织资料，让专家围绕已有知识开展工作。' },
      { title: '团队工作空间', text: '让多位用户共享知识和专家能力，在自有环境中协作。' },
    ],
    ctaLabel: '了解 Octop',
    detailLabel: '探索自托管助手',
    media: {
      type: 'placeholder',
      title: '知识、记忆与专家工作空间',
      caption: '预留工作空间界面或演示视频，由 Octop 团队提供。',
    },
  },
];

export const resources = products.flatMap((product) => [
  {
    id: `${product.id}-overview`,
    productId: product.id,
    label: '产品介绍',
    description: `${product.name} 的定位、适用需求与核心能力。正式文案可由产品团队更新。`,
    url: null,
  },
  {
    id: `${product.id}-docs`,
    productId: product.id,
    label: '使用文档',
    description: '预留快速开始、配置指南与使用文档入口，待产品团队补充正式链接。',
    url: null,
  },
  {
    id: `${product.id}-demo`,
    productId: product.id,
    label: '演示素材',
    description: product.media.caption,
    url: null,
  },
  {
    id: `${product.id}-entry`,
    productId: product.id,
    label: '产品入口',
    description: '预留产品体验、官网或开源资源入口，按实际开放状态配置。',
    url: null,
  },
]);
