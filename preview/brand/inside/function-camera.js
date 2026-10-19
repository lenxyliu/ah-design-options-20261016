/** A forward camera move through the product's working parts, in local units. */
export const FUNCTION_WORLD_SPACING = 7000;

const clamp01 = value => {
  const number = Number(value);
  return Number.isNaN(number) ? 0 : Math.max(0, Math.min(1, number));
};
const productIndex = index => Number.isFinite(index) ? ((Math.trunc(index) % 4) + 4) % 4 : 0;

// [progress, camera x/y/z, look-at x/y/z, vertical field of view]
// The assemblies are split around an open central passage. Position therefore
// remains near the center; a small look-at shift follows each working part as
// the camera keeps advancing. There is no sideways route around a hero board.
const keys = [
  [0,     0, 40,  2200,    0, 40,  -900, 36],
  [.14, -35, 55,  1200, -240, 60, -1250, 36],
  [.28,  45, 70,   200,  260, 40, -1800, 38],
  [.43,  85, 90,  -900, -200, 60, -2700, 41],
  [.59, -70, 100, -2000,  200, 75, -3400, 40],
  [.71, -40, 75, -2800, -180, 50, -4200, 39],
  [.83,  45, 55, -3600,  140, 40, -5600, 37],
  [1,     0, 40, -4800,    0, 40, -7900, 36],
];

function monotoneTangents(column) {
  const slopes = keys.slice(1).map((key, i) => (key[column] - keys[i][column]) / (key[0] - keys[i][0]));
  const result = keys.map((key, i) => {
    if (i === 0) return slopes[0];
    if (i === keys.length - 1) return slopes.at(-1);
    const before = slopes[i - 1];
    const after = slopes[i];
    if (!before || !after || Math.sign(before) !== Math.sign(after)) return 0;
    const hBefore = key[0] - keys[i - 1][0];
    const hAfter = keys[i + 1][0] - key[0];
    const a = 2 * hAfter + hBefore;
    const b = hAfter + 2 * hBefore;
    return (a + b) / (a / before + b / after);
  });
  // Successive product worlds join at the same speed, position and direction.
  result[0] = column === 3 || column === 6 ? -7000 : 0;
  result[result.length - 1] = result[0];
  return result;
}

const tangents = Array.from({ length: 7 }, (_, i) => monotoneTangents(i + 1));

function sampleRoute(progress) {
  const p = clamp01(progress);
  let segment = keys.findIndex((_, i) => i < keys.length - 1 && p <= keys[i + 1][0]);
  if (segment < 0) segment = keys.length - 2;
  const a = keys[segment];
  const b = keys[segment + 1];
  const span = b[0] - a[0];
  const t = (p - a[0]) / span;
  const t2 = t * t;
  const t3 = t2 * t;
  return Array.from({ length: 7 }, (_, column) => (
    (2 * t3 - 3 * t2 + 1) * a[column + 1]
    + (t3 - 2 * t2 + t) * span * tangents[column][segment]
    + (-2 * t3 + 3 * t2) * b[column + 1]
    + (t3 - t2) * span * tangents[column][segment + 1]
  ));
}

/**
 * Local pose; the renderer adds -7000 * index to both z coordinates.
 * All products begin at [0,40,2200], ending at [0,40,-4800]. The forward
 * target begins at [0,40,-900] and ends at [0,40,-7900].
 */
export function sampleFunctionCamera(index, progress, { mobile = false } = {}) {
  const values = sampleRoute(progress);
  const product = productIndex(index);
  const direction = [1, -.75, .8, -1][product];
  return {
    position: [values[0] * direction, values[1], values[2]],
    target: [values[3] * direction * (mobile ? .65 : 1), values[4], values[5]],
    fov: mobile ? 40 + (values[6] - 36) * .8 : values[6],
  };
}

const stageIds = ['task', 'agent', 'roles', 'tools', 'output'];
const stageBounds = [2200, 800, -450, -1700, -2400, -4800];
const captions = [
  [
    ['写下想完成的任务', '从一个目标进入云端工作空间。'],
    ['任务进入主 Agent', '目标、步骤与待办在这里汇合。'],
    ['让不同角色展开工作', '研究、内容与开发角色围绕任务协作。'],
    ['把工具放到工作旁边', '浏览器、终端和运行环境成为任务的一部分。'],
    ['带着成果继续下一步', '把过程收束为可查看、可接续的工作结果。'],
  ],
  [
    ['从业务目标开始', '把具体业务任务带入企业的 AI 工作空间。'],
    ['让任务拥有企业上下文', '知识、方法与工作规范围绕目标汇合。'],
    ['组织可复用的工作分工', '让团队经验进入角色与工作流程。'],
    ['接上业务需要的能力', '工具与业务能力在任务过程中按需组合。'],
    ['把经验变成下一次的起点', '从一次交付走向可复用的能力和产品。'],
  ],
  [
    ['从要完成的工作出发', '先看任务需要什么，再选择合适的能力。'],
    ['把技能交给 Agent', '让可复用的工作方法成为任务的能力模块。'],
    ['展开一组互补技能', '把不同专长组合成清楚的工作分工。'],
    ['在工作中调用能力', '让技能与工具围绕同一个目标配合。'],
    ['让这次能力继续复用', '把有效的组合留给下一次任务。'],
  ],
  [
    ['带着资料和问题进入', '从自己的内容与真实问题开始工作。'],
    ['让任务找到相关上下文', '知识、记忆与当前目标在这里汇合。'],
    ['围绕问题组织专家', '让不同角色共同理解和处理任务。'],
    ['连接自己的工作环境', '把需要的工具放到知识和任务旁边。'],
    ['让成果留下可接续的线索', '保留结果、依据和继续工作的上下文。'],
  ],
];

/** Caption metadata follows the assembly being approached, not a timer. */
export function functionStage(index, progress) {
  const product = productIndex(index);
  const z = sampleRoute(progress)[2];
  let stageIndex = stageBounds.slice(1).findIndex(bound => z > bound);
  if (stageIndex < 0) stageIndex = stageIds.length - 1;
  const [title, description] = captions[product][stageIndex];
  return {
    productIndex: product,
    stageIndex,
    id: stageIds[stageIndex],
    title,
    description,
    progress: clamp01((stageBounds[stageIndex] - z) / (stageBounds[stageIndex] - stageBounds[stageIndex + 1])),
  };
}
