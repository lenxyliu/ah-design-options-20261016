import {products as baseline} from './products.js';
export const products=structuredClone(baseline);
Object.assign(products[1],{category:'企业 Agent 平台',intro:'贯通 Agent 构建、数字资产沉淀、业务应用与持续治理，助力企业 AI 转型与新产品孵化。',audience:'推进 AI 转型、团队经验复用与自有 AI 产品孵化的企业。',features:[{title:'组织治理与经验复用',text:'按组织、部门与成员管理 Agent 使用，将成熟方法沉淀为可复用的数字资产。'},{title:'应用集成与产品孵化',text:'结合模型、工具与业务接口，将企业积累融入现有业务与自有品牌 AI 产品。'},{title:'持续运营与实践',text:'结合云端运行、团队协作与效能评测，让成熟经验持续服务业务应用。'}],scenes:[{title:'推进企业 AI 转型',text:'规范团队 Agent 使用，将成熟方法沉淀和推广，让经验服务更多团队。'},{title:'孵化 AI 产品与服务',text:'将行业知识与业务方法融入现有产品和新服务，通过场景适配与验证探索业务创新。'}]});
export const chapters=[
 {id:'lighthouse',number:'01',label:'云端运行',rule:'CLOUD RUNTIME',headline:'让 Agent，<br>在云端持续工作。',keywords:['云端部署','多 Agent 协作','运行观测'],note:'从任务分工，到云端持续运行'},
 {id:'clawpro',number:'02',label:'企业应用',rule:'ENTERPRISE PLATFORM',headline:'把企业经验，<br>转化为业务能力。',keywords:['组织治理','经验资产','应用与产品孵化'],note:'组织经验沉淀为资产，服务团队与业务'},
 {id:'skillhub',number:'03',label:'技能生态',rule:'SKILL ECOSYSTEM',headline:'给 Agent，<br>更多专业能力。',keywords:['技能发现','创作发布','专业服务'],note:'将专业经验，变成 Agent 可调用的能力'},
 {id:'octop',number:'04',label:'开源自托管',rule:'YOUR OWN AI WORKSPACE',headline:'你的知识，<br>你的 AI 工作空间。',keywords:['自主部署','知识与记忆','专家协作'],note:'知识、记忆与专家，在自有环境中协作'},
];
