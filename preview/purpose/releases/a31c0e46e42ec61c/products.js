export const products = [
  {
    id: 'lighthouse',
    name: 'Lighthouse Agent',
    color: '#87919c',
    role: { zh: '个人与开发者 Agent 平台', en: 'Agent platform for individuals and developers' },
    short: { zh: '让你的 Agent，在云端持续工作。', en: 'Keep your Agent working in the cloud.' },
    headline: { zh: '日常事务，交给云端 Agent。', en: 'An Agent for your everyday work.' },
    description: {
      zh: '面向个人与开发者的云端 Agent 平台。部署和使用主流 Agent，连接模型、消息通道与专业技能，让资料收集、信息整理和定时任务在云端持续进行。从日常助理开始，逐步拓展自己的工作方式。',
      en: 'A cloud Agent platform for individuals and developers. Deploy popular Agents, connect models, messaging channels and specialist skills, and keep research, information gathering and scheduled tasks running. Start with a personal assistant and build it into your everyday work.'
    },
    audience: { zh: '希望让 Agent 参与日常工作的个人与开发者', en: 'Individuals and developers bringing Agents into everyday work' },
    benefits: {
      zh: [
        { title: '在云端持续运行', text: '为 Agent 提供云端运行环境，让计划任务接续进行。' },
        { title: '连接常用工具', text: '配置模型、消息通道与技能，围绕任务组合所需能力。' },
        { title: '逐步扩展应用', text: '从一个日常助理开始，探索更多任务与 Agent 协作方式。' }
      ],
      en: [
        { title: 'Keep work running', text: 'Give your Agent a cloud environment where scheduled work can continue.' },
        { title: 'Connect your tools', text: 'Configure models, messaging channels and skills around the task at hand.' },
        { title: 'Build on what works', text: 'Start with a personal assistant, then explore more tasks and ways for Agents to collaborate.' }
      ]
    },
    useCases: {
      zh: ['按计划收集并整理关注的信息', '准备每周复盘与工作摘要', '尝试自己的 Agent 应用'],
      en: ['Gather and organize information on a schedule', 'Prepare weekly reviews and work summaries', 'Explore an Agent application of your own']
    },
    cta: { zh: '体验 Lighthouse Agent', en: 'Try Lighthouse Agent' },
    url: 'https://lightagent.cloud.tencent.com/',
    secondary: {
      label: { zh: '阅读产品介绍', en: 'Read the product introduction' },
      url: 'https://developer.cloud.tencent.com/article/2710300'
    },
    related: ['skillhub', 'octop']
  },
  {
    id: 'clawpro',
    name: 'ClawPro',
    color: '#2d5df6',
    role: { zh: '企业 Agent 平台', en: 'Enterprise Agent platform' },
    short: { zh: '用好企业经验，打开业务新可能。', en: 'Put expertise to work. Open new possibilities.' },
    headline: { zh: '让企业经验，成为可复用的能力。', en: 'Turn enterprise expertise into reusable capability.' },
    description: {
      zh: '贯通 Agent 构建、经验资产沉淀、业务应用与持续治理。对内，共享知识、技能与工作方法，让成熟经验服务更多团队；对外，连接企业知识与业务接口，为已有产品融入 AI，孵化自有 AI 产品与服务。',
      en: 'Connect Agent building, reusable expertise, business applications and ongoing governance. Share knowledge, skills and proven methods across teams. Bring enterprise knowledge and business interfaces into existing products, and develop your own AI products and services.'
    },
    audience: { zh: '推进 AI 应用的企业管理者、业务团队与产品团队', en: 'Enterprise leaders, business teams and product teams putting AI to work' },
    benefits: {
      zh: [
        { title: '让经验服务团队', text: '集中维护知识与技能，批量推广成熟方法，减少重复摸索。' },
        { title: '让使用精细可控', text: '按组织、部门与成员配置权限和配额，管理团队 Agent 应用。' },
        { title: '让积累成为产品', text: '连接业务接口与企业资产，支持应用集成和自有品牌 AI 服务。' }
      ],
      en: [
        { title: 'Share proven expertise', text: 'Maintain knowledge and skills together, and make established methods available to more teams.' },
        { title: 'Manage use with control', text: 'Configure permissions and quotas for organizations, departments and individuals.' },
        { title: 'Build on your expertise', text: 'Connect business interfaces and enterprise assets to support integrated applications and your own branded AI services.' }
      ]
    },
    useCases: {
      zh: ['在团队中推广成熟知识与方法', '为已有产品和客户服务融入 AI', '孵化自有品牌的 AI 产品'],
      en: ['Share proven knowledge and methods across teams', 'Bring AI into existing products and customer services', 'Develop AI products under your own brand']
    },
    cta: { zh: '了解 ClawPro', en: 'Explore ClawPro' },
    url: 'https://cloud.tencent.com/document/product/213/129156',
    secondary: {
      label: { zh: '查看官方产品资料', en: 'View official product information' },
      url: 'https://cloud.tencent.com/document/product/213/129156'
    },
    related: ['skillhub', 'octop']
  },
  {
    id: 'skillhub',
    name: 'SkillHub',
    color: '#2d8e6d',
    role: { zh: 'Agent 技能生态', en: 'Agent skills ecosystem' },
    short: { zh: '为 Agent，找到下一项专业技能。', en: 'Find your Agent’s next specialist skill.' },
    headline: { zh: '让专业方法，被更多 Agent 使用。', en: 'Give more Agents access to specialist expertise.' },
    description: {
      zh: '发现、使用与分享 Agent 技能，为研究、办公和业务任务增加专业能力。围绕想完成的事找到合适技能，也将自己的工作方法发布给更多人。可以直接访问使用，也可结合 Lighthouse Agent、ClawPro 开展应用。',
      en: 'Discover, use and share Agent skills for research, office work and business tasks. Find a skill for what you want to accomplish, or publish your own working methods for others to use. Explore SkillHub directly, or use it with Lighthouse Agent and ClawPro.'
    },
    audience: { zh: '为 Agent 扩展能力的使用者与技能开发者', en: 'Agent users looking for capabilities and developers sharing skills' },
    benefits: {
      zh: [
        { title: '发现合适技能', text: '围绕具体任务查找技能，为 Agent 增加所需专业能力。' },
        { title: '接入日常工作', text: '选择适用技能，结合已有 Agent 与平台开展应用。' },
        { title: '分享专业方法', text: '发布自己的技能，让成熟经验被发现、使用与复用。' }
      ],
      en: [
        { title: 'Find the right skill', text: 'Search around a concrete task and add the specialist capability your Agent needs.' },
        { title: 'Put skills to work', text: 'Choose suitable skills and use them with your existing Agents and platforms.' },
        { title: 'Share what you know', text: 'Publish your skills so others can discover, use and reuse proven methods.' }
      ]
    },
    useCases: {
      zh: ['为资料研究寻找专业技能', '为办公与业务任务补充工具', '发布并分享自己的 Agent 技能'],
      en: ['Find specialist skills for research', 'Add tools for office work and business tasks', 'Publish and share your own Agent skills']
    },
    cta: { zh: '探索 SkillHub', en: 'Explore SkillHub' },
    url: 'https://skillhub.cn/',
    secondary: {
      label: { zh: '查看开源项目', en: 'View the open-source project' },
      url: 'https://github.com/Tencent/skillhub'
    },
    related: ['lighthouse', 'clawpro']
  },
  {
    id: 'octop',
    name: 'Octop',
    color: '#9770cd',
    role: { zh: '腾讯云自研开源 Agent 内核', en: 'Open-source Agent engine by Tencent Cloud' },
    short: { zh: '用开放的 Agent，构建自己的应用。', en: 'Build your own applications with an open Agent engine.' },
    headline: { zh: '开放内核，自主构建。', en: 'An open engine. Your own way to build.' },
    description: {
      zh: '腾讯云自研的开源 Agent 内核，为开发者提供自主构建与扩展 Agent 的起点。可独立使用，也可通过 Lighthouse Agent、ClawPro 开展应用。从开放代码出发，为自己的场景探索合适的实现方式。',
      en: 'Tencent Cloud’s open-source Agent engine gives developers a starting point for building and extending Agents. Use Octop independently or through Lighthouse Agent and ClawPro. Start from open code and explore an approach that fits your application.'
    },
    audience: { zh: '希望自主构建、部署或扩展 Agent 的开发者与技术团队', en: 'Developers and technical teams building, deploying or extending Agents' },
    benefits: {
      zh: [
        { title: '从开放代码开始', text: '查看开源代码，理解内核设计，为自己的应用选择构建起点。' },
        { title: '围绕需求扩展', text: '结合自己的工具与业务需求，探索 Agent 应用与能力扩展。' },
        { title: '选择合适的方式', text: '独立使用，或通过 Lighthouse Agent、ClawPro 开展应用。' }
      ],
      en: [
        { title: 'Start with open code', text: 'Explore the source, understand the engine and choose a foundation for your application.' },
        { title: 'Extend around your needs', text: 'Bring your tools and business needs into Agent applications and capability extensions.' },
        { title: 'Choose how to use it', text: 'Use Octop independently, or through Lighthouse Agent and ClawPro.' }
      ]
    },
    useCases: {
      zh: ['从开源代码了解 Agent 的运行方式', '开发适合自身需求的 Agent 应用', '通过云端平台使用与管理 Agent'],
      en: ['Explore how an Agent works through its source code', 'Develop an Agent application around your needs', 'Use and manage Agents through a cloud platform']
    },
    cta: { zh: '探索 Octop 开源项目', en: 'Explore Octop on GitHub' },
    url: 'https://github.com/TencentCloud/Octop',
    secondary: {
      label: { zh: '阅读项目说明', en: 'Read the project guide' },
      url: 'https://github.com/TencentCloud/Octop#readme'
    },
    related: ['lighthouse', 'clawpro']
  }
];

export const getProduct = (id) => products.find((product) => product.id === id);
