/* Opaque, physically layered product environments. Product screens are capability
   illustrations; their surfaces never represent a connected or running service. */
const INK = '#102A50';
const BLUE = '#245BFF';
const SKY = '#3895FF';
const ICE = '#EAF4FF';
const FONT = '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';

function rounded(ctx, x, y, w, h, radius = 18, fill = '#fff', stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}
function label(ctx, value, x, y, size = 32, color = INK, weight = 500) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function line(ctx, points, color = BLUE, width = 8) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
  ctx.lineCap = 'round'; ctx.stroke();
}
function dot(ctx, x, y, r = 10, color = BLUE) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}
function arrow(ctx, x, y, color = BLUE) {
  line(ctx, [[x - 24, y - 24], [x, y], [x - 24, y + 24]], color, 7);
}
function icon(ctx, kind, x, y, scale = 1, color = BLUE) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'spark') {
    line(ctx, [[0, -37], [10, -10], [37, 0], [10, 10], [0, 37], [-10, 10], [-37, 0], [-10, -10], [0, -37]], color, 5);
  } else if (kind === 'book') {
    line(ctx, [[-38, -33], [-8, -28], [0, -20], [8, -28], [38, -33], [38, 32], [8, 36], [0, 44], [-8, 36], [-38, 32], [-38, -33]], color, 5);
    line(ctx, [[0, -20], [0, 44]], color, 5);
  } else if (kind === 'code') {
    line(ctx, [[-20, -27], [-45, 0], [-20, 27]], color, 6);
    line(ctx, [[20, -27], [45, 0], [20, 27]], color, 6);
    line(ctx, [[8, -40], [-8, 40]], color, 6);
  } else if (kind === 'research') {
    ctx.beginPath(); ctx.arc(-7, -7, 27, 0, Math.PI * 2); ctx.stroke();
    line(ctx, [[14, 14], [40, 40]], color, 6);
  } else if (kind === 'plug') {
    line(ctx, [[-26, -39], [-26, -17], [26, -17], [26, -39]], color, 6);
    line(ctx, [[-37, -17], [-37, 1], [-20, 25], [0, 31], [20, 25], [37, 1], [37, -17]], color, 6);
    line(ctx, [[0, 31], [0, 48]], color, 6);
  } else if (kind === 'memory') {
    ctx.strokeRect(-29, -29, 58, 58);
    for (const v of [-15, 15]) {
      line(ctx, [[v, -45], [v, -29]], color, 5); line(ctx, [[v, 29], [v, 45]], color, 5);
      line(ctx, [[-45, v], [-29, v]], color, 5); line(ctx, [[29, v], [45, v]], color, 5);
    }
    ctx.strokeRect(-11, -11, 22, 22);
  } else {
    ctx.strokeRect(-31, -37, 62, 74);
    line(ctx, [[-16, -13], [16, -13]], color, 5);
    line(ctx, [[-16, 3], [16, 3]], color, 5);
    line(ctx, [[-16, 19], [6, 19]], color, 5);
  }
  ctx.restore();
}

const CONTENT = [
  { title: 'Lighthouse Agent', kicker: 'CLOUD COLLABORATION', subtitle: '一个目标，多角色协作', task: '完成一份产品研究',
    roles: [['research', '研究 Agent', '检索信息 · 形成依据'], ['document', '内容 Agent', '整理观点 · 完成表达'], ['code', '开发 Agent', '编写代码 · 调用工具']],
    support: [['research', '研究 Agent', '信息检索 / 依据整理'], ['code', '开发 Agent', '代码与工具协作'], ['document', '云端工作环境', '模型 / 工具 / 消息通道']],
    outcome: ['工作持续推进', '定时收集 · 生成摘要 · 分发结果'], end: '从任务分工，到云端运行' },
  { title: 'ClawPro', kicker: 'ENTERPRISE AGENT PLATFORM', subtitle: '让企业经验，成为业务能力', task: '把企业积累转化为可复用资产',
    roles: [['book', '行业知识', '资料 · 术语 · 业务背景'], ['plug', '专业技能', '工具 · 流程 · 任务方法'], ['document', '成熟方法', '规则 · 模板 · 实践经验']],
    support: [['book', '企业知识', '让经验被理解与复用'], ['plug', '可复用技能', '把成熟方法接入任务'], ['document', '业务应用', '结合工具与业务接口']],
    outcome: ['孵化自己的 AI 产品', '将行业积累融入产品与服务'], end: '经验资产 → 应用与产品孵化' },
  { title: 'SkillHub', kicker: 'PROFESSIONAL CAPABILITY ECOSYSTEM', subtitle: '按任务，接入专业能力', task: '为 Agent 接入所需技能与工具',
    roles: [['research', '深度研究', '搜索信息 · 整理依据'], ['document', '内容创作', '组织观点 · 完成表达'], ['code', '开发工具', '工具接入 · 流程协作']],
    support: [['plug', 'SKILL', '专业方法与可执行流程'], ['code', 'PLUGIN', '把工具带进任务'], ['plug', 'MCP', '连接数据与工作工具']],
    outcome: ['把你的专业，变成能力', '面向 Agent 创作与发布专业技能'], end: '发现技能 → 接入能力 → 扩展任务' },
  { title: 'Octop', kicker: 'YOUR OWN AI WORKSPACE', subtitle: '自己的知识，自己的 AI 空间', task: '在自有环境中，围绕上下文协作',
    roles: [['book', '知识', '围绕已有资料开展工作'], ['memory', '长期记忆', '保留有用的任务上下文'], ['spark', '专属专家', '结合领域与项目经验']],
    support: [['book', '自己的知识', '产品资料 / 方法记录'], ['memory', '长期记忆', '任务背景 / 使用偏好'], ['spark', '专属专家', '业务专家 / 项目助手']],
    outcome: ['在自己的环境持续积累', '自主部署 · 扩展工具 · 多用户协作'], end: '知识 × 记忆 × 专家' },
];

function texture(THREE, width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
  draw(ctx, width, height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.needsUpdate = true;
  return map;
}
function heroTexture(THREE, index) {
  const data = CONTENT[index];
  return texture(THREE, 2048, 1280, (ctx) => {
    ctx.fillStyle = ICE; ctx.fillRect(0, 0, 2048, 14);
    label(ctx, data.kicker, 104, 108, 26, '#53739B', 600);
    label(ctx, '能力示意', 1768, 108, 26, '#53739B', 500);
    label(ctx, data.title, 104, 216, 80, INK, 650);
    label(ctx, data.subtitle, 108, 281, 36, '#53739B', 400);
    line(ctx, [[104, 335], [1944, 335]], '#D6E6FA', 2);
    // One purposeful work surface, with a dominant task and its connected capability flow.
    rounded(ctx, 104, 392, 1838, 180, 22, '#EEF5FF');
    dot(ctx, 159, 445, 8);
    label(ctx, '任务目标', 188, 454, 26, '#53739B', 500);
    label(ctx, data.task, 151, 526, 42, INK, 600);
    const centerX = 1024;
    line(ctx, [[centerX, 575], [centerX, 668], [392, 668]], BLUE, 5);
    line(ctx, [[centerX, 668], [1656, 668]], BLUE, 5);
    [392, 1024, 1656].forEach((cx, i) => {
      line(ctx, [[cx, 668], [cx, 760]], BLUE, 5); dot(ctx, cx, 668, 9);
      icon(ctx, data.roles[i][0], cx, 835, 1.2);
      label(ctx, data.roles[i][1], cx - 142, 946, 44, INK, 650);
      label(ctx, data.roles[i][2], cx - 197, 1010, 29, '#53739B', 400);
    });
    line(ctx, [[104, 1108], [1944, 1108]], '#D6E6FA', 2);
    label(ctx, index === 0 ? '拆解目标' : index === 1 ? '构建 Agent' : index === 2 ? '发现与选择' : '自主部署', 107, 1189, 30, BLUE, 600);
    arrow(ctx, 600, 1180);
    label(ctx, index === 0 ? '多角色协作' : index === 1 ? '沉淀数字资产' : index === 2 ? '接入专业能力' : '知识与记忆', 724, 1189, 30, BLUE, 600);
    arrow(ctx, 1250, 1180);
    label(ctx, index === 0 ? '云端持续运行' : index === 1 ? '应用与产品孵化' : index === 2 ? '完成更多任务' : '专家持续协作', 1376, 1189, 30, BLUE, 600);
  });
}
function moduleTexture(THREE, item, index) {
  return texture(THREE, 1024, 640, (ctx) => {
    ctx.fillStyle = index === 2 ? '#E8F8FF' : ICE; ctx.fillRect(0, 0, 1024, 640);
    icon(ctx, item[0], 118, 119, 1.18);
    label(ctx, item[1], 76, 285, 63, INK, 650);
    label(ctx, item[2], 78, 369, 31, '#53739B', 400);
    line(ctx, [[80, 480], [938, 480]], '#BED6F6', 3);
    const terms = index === 1 ? ['企业经验', '可复用资产'] : index === 3 ? ['自有环境', '持续积累'] : index === 2 ? ['专业能力', '按需接入'] : ['目标', '协作'];
    label(ctx, terms[0], 78, 555, 30, BLUE, 600);
    arrow(ctx, 607, 544);
    label(ctx, terms[1], 665, 555, 30, BLUE, 600);
  });
}
function outcomeTexture(THREE, index) {
  const data = CONTENT[index];
  return texture(THREE, 1400, 800, (ctx) => {
    ctx.fillStyle = BLUE; ctx.fillRect(0, 0, 1400, 800);
    label(ctx, 'THE NEXT POSSIBILITY', 88, 112, 27, '#B6CEFF', 500);
    icon(ctx, 'spark', 125, 239, 1.2, '#fff');
    label(ctx, data.outcome[0], 88, 389, 65, '#fff', 650);
    label(ctx, data.outcome[1], 91, 472, 31, '#DAE6FF', 400);
    line(ctx, [[90, 586], [1308, 586]], '#7D9DFF', 2);
    label(ctx, data.end, 90, 673, 34, '#fff', 500);
    label(ctx, '能力示意', 1185, 744, 24, '#B6CEFF', 500);
  });
}

export function buildProductWorld(THREE, index = 0) {
  index = Math.max(0, Math.min(3, Math.floor(index)));
  const group = new THREE.Group();
  group.name = `product-depth-world-${index}`;
  const colors = {
    blue: new THREE.MeshStandardMaterial({ color: BLUE, roughness: .36, metalness: .16 }),
    dark: new THREE.MeshStandardMaterial({ color: '#1234A2', roughness: .44, metalness: .2 }),
    ink: new THREE.MeshStandardMaterial({ color: INK, roughness: .5, metalness: .15 }),
    white: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .56, metalness: .06 }),
    ice: new THREE.MeshStandardMaterial({ color: '#D5E7FF', roughness: .48, metalness: .08 }),
    sky: new THREE.MeshStandardMaterial({ color: SKY, roughness: .4, metalness: .14 }),
    pale: new THREE.MeshStandardMaterial({ color: '#EDF4FE', roughness: .7, metalness: .02 }),
  };
  function mesh(geometry, material, name, x, y, z, parent = group) {
    const item = new THREE.Mesh(geometry, material);
    item.name = name; item.position.set(x, y, z);
    item.castShadow = true; item.receiveShadow = true;
    parent.add(item); return item;
  }
  function box(w, h, d, material, name, x, y, z, parent) {
    return mesh(new THREE.BoxGeometry(w, h, d), material, name, x, y, z, parent);
  }
  function torus(radius, tube, arc, material, name, x, y, z, rotationZ = 0, parent) {
    const item = mesh(new THREE.TorusGeometry(radius, tube, 12, Math.max(38, Math.ceil(arc * 19)), arc), material, name, x, y, z, parent);
    item.rotation.z = rotationZ; return item;
  }
  function panel(w, h, d, map, name, x, y, z, yaw = 0, parent) {
    const face = new THREE.MeshBasicMaterial({ map, toneMapped: false });
    const item = box(w, h, d, [colors.dark, colors.dark, colors.ice, colors.dark, face, colors.blue], name, x, y, z, parent);
    item.rotation.y = yaw; return item;
  }
  function portal(name, z, radius, tube, material, turn = 0) {
    const structure = new THREE.Group(); structure.name = name; structure.position.set(280, -180, z); structure.rotation.y = turn;
    group.add(structure);
    torus(radius, tube, Math.PI, material, `${name}-arch`, 0, 0, 0, 0, structure);
    box(tube * 2, 520, tube * 2.3, material, `${name}-left-pier`, -radius, -260, 0, structure);
    box(tube * 2, 520, tube * 2.3, material, `${name}-right-pier`, radius, -260, 0, structure);
    box(260, 60, 340, colors.dark, `${name}-left-foot`, -radius, -550, 0, structure);
    box(260, 60, 340, colors.dark, `${name}-right-foot`, radius, -550, 0, structure);
    return structure;
  }

  // A physical ground plane and rails stay visible during the entire camera pass.
  // The ground is a solid slab, so ribs and modules cast real contact shadows.
  box(3350, 150, 7200, colors.pale, 'continuous-ground-plinth', 170, -795, -1900);
  box(2650, 22, 7020, colors.white, 'white-walkway', 170, -708, -1900);
  for (const side of [-1, 1]) {
    const x = side < 0 ? -1260 : 1540;
    box(48, 78, 6900, colors.blue, `deep-guide-rail-${side}`, x, -670, -1880);
    box(125, 26, 6900, colors.ice, `rail-foot-${side}`, x, -705, -1880);
    for (let n = 0; n < 7; n++) {
      box(115, 310, 95, n % 3 === 0 ? colors.blue : colors.white, `architectural-fin-${side}-${n}`, x, -540, 770 - n * 860);
    }
  }
  // Crossed thresholds and tall nearby ribs make forward motion perceptible.
  for (let n = 0; n < 9; n++) box(2630, 8, 13, colors.ice, `floor-threshold-${n}`, 140, -692, 1000 - n * 720);
  portal('entrance-blue-portal', 300, 930, 78, colors.blue, index % 2 ? -.10 : .10);
  portal('deep-white-portal', -2440, 1000, 68, colors.white, -.08);
  portal('outcome-blue-portal', -3300, 850, 72, colors.blue, .08);
  // Off-axis foreground slab: its thick side crosses the field of view as the camera advances.
  const nearFin = box(128, 1080, 450, colors.blue, 'near-left-occluder', -1125, -125, 830);
  nearFin.rotation.y = -.22;
  const farFin = box(150, 940, 460, colors.ice, 'near-right-occluder', 1400, -190, 180);
  farFin.rotation.y = .18;

  const hero = new THREE.Group(); hero.name = 'hero-workbench'; hero.position.set(380, 40, -900); hero.rotation.y = index % 2 ? -.12 : .12;
  group.add(hero);
  panel(1250, 780, 108, heroTexture(THREE, index), 'hero-product-work-surface', 0, 0, 0, 0, hero);
  // Strong blue edges, bevel-like lips, a grounded foot and an exposed ribbed back.
  box(1280, 24, 146, colors.blue, 'hero-lower-edge', 0, -398, -8, hero);
  box(1280, 18, 146, colors.ice, 'hero-upper-edge', 0, 398, -8, hero);
  box(1490, 90, 560, colors.white, 'hero-table-plinth', 0, -575, -25, hero);
  box(1430, 28, 520, colors.blue, 'hero-table-edge', 0, -528, -25, hero);
  box(105, 125, 210, colors.dark, 'hero-left-leg', -470, -460, -30, hero);
  box(105, 125, 210, colors.dark, 'hero-right-leg', 470, -460, -30, hero);
  for (let n = 0; n < 6; n++) box(44, 700, 130, n % 2 ? colors.ice : colors.blue, `hero-back-fin-${n}`, -520 + n * 208, 0, -116, hero);

  const modules = [
    [-650, 230, -150, .14], [1050, -230, -1600, -.2], [-720, -130, -2250, .2],
  ];
  modules.forEach(([x, y, z, yaw], n) => {
    const rig = new THREE.Group(); rig.name = `capability-solid-${n}`; rig.position.set(x, y, z); rig.rotation.y = yaw;
    group.add(rig);
    panel(400, 250, 156, moduleTexture(THREE, CONTENT[index].support[n], index), `capability-face-${n}`, 0, 0, 0, 0, rig);
    box(430, 22, 200, colors.blue, `capability-bottom-${n}`, 0, -137, -8, rig);
    box(22, 250, 185, colors.ice, `capability-side-${n}`, -213, 0, -9, rig);
    for (let pin = 0; pin < 3; pin++) {
      box(32, 28, 90, colors.dark, `capability-pin-${n}-${pin}`, -105 + pin * 105, -162, -14, rig);
    }
  });

  // Each product has a distinct physical silhouette, rather than a repeated card grid.
  if (index === 0) {
    const orbit = torus(670, 48, Math.PI * 1.45, colors.ice, 'collaboration-open-orbit', 400, 35, -1320, -.27);
    orbit.rotation.x = .2;
    // Three branches emerge from the central workbench and extend into the corridor.
    [[-410, -350, -580, -.53], [1020, -410, -1390, .38], [-700, -480, -2050, -.18]].forEach(([x,y,z,r], n) => {
      const beam = box(330, 35, 115, n === 0 ? colors.blue : colors.sky, `collaboration-branch-${n}`, x,y,z);
      beam.rotation.y = r;
    });
    mesh(new THREE.CylinderGeometry(165, 190, 140, 32), colors.blue, 'central-orchestration-node', 400, -584, -1690);
    mesh(new THREE.CylinderGeometry(115, 115, 22, 32), colors.white, 'central-node-cap', 400, -504, -1690);
  } else if (index === 1) {
    // A substantial asset shelf recedes diagonally into the organization corridor.
    for (let n = 0; n < 5; n++) {
      const shelf = box(170, 650 - n * 52, 390, n % 2 ? colors.blue : colors.ice, `reusable-asset-volume-${n}`, 1210 + n * 72, -360 + n * 12, -650 - n * 310);
      shelf.rotation.y = -.2;
    }
    const arch = portal('enterprise-asset-gateway', -1760, 1110, 42, colors.ice, -.11);
    arch.position.x = 270;
    for (let n = 0; n < 3; n++) box(290, 45, 670, n === 2 ? colors.blue : colors.white, `asset-foundation-step-${n}`, 730, -650 + n * 50, -2520 - n * 110);
  } else if (index === 2) {
    // A large cut-open connector socket surrounds the UI, with visible plug pins.
    const socket = torus(730, 80, Math.PI * 1.4, colors.blue, 'skill-connector-socket', 370, 45, -1210, -.62);
    socket.rotation.y = -.12;
    for (let n = 0; n < 4; n++) {
      const pin = box(75, 150, 260, n % 2 ? colors.white : colors.sky, `professional-capability-pin-${n}`, 930 + n * 74, -340 + n * 140, -1610 - n * 95);
      pin.rotation.y = -.2;
    }
    torus(360, 50, Math.PI * 1.65, colors.ice, 'secondary-plug-collar', -590, -240, -2730, .2);
  } else {
    // Open enclosure: thick uprights and roof beams define a self-owned environment.
    for (let n = 0; n < 4; n++) {
      box(145, 1080, 150, n === 0 ? colors.blue : colors.ice, `self-hosted-boundary-pillar-${n}`, 1370, -160, -380 - n * 760);
      box(720, 80, 150, n === 0 ? colors.blue : colors.white, `self-hosted-boundary-roof-${n}`, 1080, 420, -380 - n * 760);
    }
    // Knowledge volumes have solid spines; memory is a layered physical cylinder.
    for (let n = 0; n < 4; n++) box(110, 390 + n * 24, 350, n % 2 ? colors.blue : colors.ice, `knowledge-volume-${n}`, -990 + n * 122, -460, -1670 - n * 58);
    for (let n = 0; n < 3; n++) mesh(new THREE.CylinderGeometry(170, 170, 92, 32), n % 2 ? colors.white : colors.blue, `persistent-memory-layer-${n}`, 1050, -580 + n * 110, -2460);
  }

  // The outcome lives at the far side of a second open gateway, keeping the camera's
  // central path clear. It becomes a new large surface only after passing the hero.
  const outcome = panel(700, 400, 110, outcomeTexture(THREE, index), 'deeper-product-outcome', 800, 15, -3450, -.17);
  box(760, 70, 390, colors.white, 'outcome-pedestal', 800, -320, -3490);
  box(115, 140, 180, colors.blue, 'outcome-stem', 800, -235, -3480);
  box(820, 40, 440, colors.blue, 'outcome-ground-step', 800, -669, -3480);
  for (let n = 0; n < 3; n++) {
    const arch = torus(510 + n * 72, 25, Math.PI * .95, n % 2 ? colors.blue : colors.ice, `outcome-receding-arc-${n}`, 290, -135, -3850 - n * 240, .08);
    arch.rotation.y = -.08;
  }
  // Low exit markers recede toward the next scene rather than closing the view.
  box(90, 210, 180, colors.blue, 'exit-left-marker', -620, -596, -4680);
  box(90, 210, 180, colors.blue, 'exit-right-marker', 1010, -596, -4680);

  group.userData = {
    productIndex: index,
    capabilityIllustration: true,
    hero: { x: 380, y: 40, z: -900, width: 1250, height: 780 },
    clearPassage: { heroX: -650, heroY: 80, minimumY: -550, outcomeX: 100 },
    outcome: { x: 800, y: 15, z: -3450, width: 700, height: 400 },
    depthRange: [1200, -5000],
  };
  return group;
}
