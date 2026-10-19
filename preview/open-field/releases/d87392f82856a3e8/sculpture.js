import * as THREE from './vendor/three.module.min.js';

const historicalProducts = [
  { kind: 'hero', width: .76, color: 0xdee4ed, roughness: .15, rotation: [.12, -.12, -.14] },
  { kind: 'fold', width: .9, color: 0x1449f5, roughness: .235, rotation: [.35, -.12, -.14] },
  { kind: 'infinity', width: .9, color: 0x28b878, roughness: .235, rotation: [.12, -.12, -.31] },
  { kind: 'crown', width: .9, color: 0xa17af5, roughness: .235, rotation: [.12, -.12, -.14] }
];
const bounded = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const smoothUnit = value => value * value * (3 - 2 * value);
const PRODUCT_SPIN_RATE = Math.PI * 2 / 60;
const PRODUCT_FRONT_HOLD = 2;
const HERO_SPIN_RATE = Math.PI * 2 / 160;

/** Exact V07 product endpoints, kept separately from the approved homepage. */
export function sampleHistoricalProductGeometry(index, { segments = 420, sides = 24 } = {}) {
  index = Math.round(bounded(index, 0, 3));
  const form = historicalProducts[index];
  class ProductPath extends THREE.Curve {
    getPoint(u, target = new THREE.Vector3()) {
      const t = u * Math.PI * 2, c = Math.cos, s = Math.sin;
      if (form.kind === 'hero') {
        const r = 1.12 + .34 * c(3 * t);
        return target.set(1.12 * r * c(2 * t), r * s(2 * t), .57 * s(3 * t));
      }
      if (form.kind === 'fold') return target.set(1.5 * c(t), 1.03 * s(t), .44 * s(2 * t));
      if (form.kind === 'infinity') {
        const d = 1 + .58 * s(t) ** 2;
        return target.set(1.85 * c(t) / d, 1.85 * s(t) * c(t) / d, .50 * s(t));
      }
      const r = 1.14 + .26 * c(3 * t);
      return target.set(r * c(t), r * s(t), .46 * s(3 * t));
    }
  }
  const path = new ProductPath();
  const frames = path.computeFrenetFrames(segments, true);
  const positions = [], uvs = [], indices = [];
  const center = new THREE.Vector3(), wide = new THREE.Vector3(), thin = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const angle = Math.PI * 2 * u + .32 * Math.sin(u * Math.PI * 4);
    path.getPoint(u, center);
    wide.copy(frames.normals[i]).multiplyScalar(Math.cos(angle)).addScaledVector(frames.binormals[i], Math.sin(angle));
    thin.copy(frames.normals[i]).multiplyScalar(-Math.sin(angle)).addScaledVector(frames.binormals[i], Math.cos(angle));
    const breadth = form.width * (1 + .11 * Math.sin(u * Math.PI * 6 + .7));
    for (let j = 0; j <= sides; j++) {
      const a = j / sides * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const across = Math.sign(ca) * Math.pow(Math.abs(ca), .38) * breadth * .5;
      const depth = Math.sign(sa) * Math.pow(Math.abs(sa), .72) * .063 * .5;
      positions.push(center.x + wide.x * across + thin.x * depth, center.y + wide.y * across + thin.y * depth, center.z + wide.z * across + thin.z * depth);
      uvs.push(u, j / sides);
      if (i < segments && j < sides) {
        const a0 = i * (sides + 1) + j, b0 = a0 + sides + 1;
        indices.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
      }
    }
  }
  return {
    positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices),
    segments, sides, kind: form.kind, color: form.color, roughness: form.roughness,
    width: form.width, thickness: .063, twist: 1, rotation: [...form.rotation]
  };
}

/** One opaque sculpture at a time; swap at the fully faded midpoint. */
export function sampleProductTransition(position, { reduced = false } = {}) {
  position = bounded(position, 0, 3);
  if (reduced) position = Math.round(position);
  const fromIndex = Math.floor(position), toIndex = Math.min(3, fromIndex + 1);
  const progress = toIndex === fromIndex ? 0 : position - fromIndex;
  const activeIndex = progress < .5 ? fromIndex : toIndex;
  const opacity = toIndex === fromIndex ? 1 : smoothUnit(Math.abs(progress - .5) * 2);
  return { position, fromIndex, toIndex, progress, activeIndex, opacity };
}

/** Intact historical forms turn in place while their composited image fades. */
export function sampleProductPose(index, position, { reduced = false, spin = 0 } = {}) {
  index = Math.round(bounded(index, 0, 3));
  const transition = sampleProductTransition(position, { reduced });
  position = transition.position;
  const delta = index - position;
  const weight = transition.activeIndex === index ? transition.opacity : 0;
  const rotation = historicalProducts[index].rotation;
  // The outgoing/incoming turns share a continuous phase. Only the fully
  // faded midpoint changes which intact form is rendered; no pair overlaps.
  const turn = Math.sin(bounded(delta, -1, 1) * Math.PI * .5);
  return {
    index, kind: historicalProducts[index].kind, delta, weight,
    x: 0, y: 0, z: 0, scale: 1,
    rx: rotation[0] + turn * .16,
    ry: rotation[1] + (Number.isFinite(spin) ? spin : 0) + turn * 1.10,
    rz: rotation[2] + turn * .20
  };
}

export function sampleProductHandoff(position, options) {
  return historicalProducts.map((_, index) => sampleProductPose(index, position, options));
}

const fitGeometryCache = new Map();

/**
 * Fit a complete historical ribbon into the fixed sculpture display. The
 * perspective inequalities are solved for every original vertex, rather than
 * relying on a guessed radius or cutting the art with a rectangular mask.
 * Camera faces -Z, as in mountSculpture. rootMatrix is a column-major 4x4 array.
 */
export function fitHistoricalProductPose({
  index, position, width, height, artBounds, rootMatrix, positions,
  cameraPosition = [0, 0, 7.2], cameraFov = 35, cameraNear = .1,
  margin = 8, reduced = false, spin = 0
}) {
  const pose = sampleProductPose(index, position, { reduced, spin });
  width = Math.max(1, Number(width) || 1);
  height = Math.max(1, Number(height) || 1);
  const matrix = new THREE.Matrix4();
  if (rootMatrix) matrix.fromArray(rootMatrix.elements || rootMatrix);
  const artTop = Number(artBounds.top), artBottom = Number(artBounds.bottom);
  const bounds = {
    left: Number(artBounds.left), right: Number(artBounds.right),
    // Keep the moving DOM panel's complete height when it enters or leaves
    // the viewport. Cropping this slot here would shrink the object into the
    // remaining onscreen sliver instead of letting it travel offscreen.
    top: Number.isFinite(artTop) ? artTop : 0,
    bottom: Number.isFinite(artBottom) ? artBottom : height
  };
  const slotHeight = Math.max(0, bounds.bottom - bounds.top);
  const slot = { ...bounds };
  const slotWidth = Math.max(0, slot.right - slot.left);
  const padding = Math.min(margin, slotWidth * .12, slotHeight * .12);
  const inner = {
    left: slot.left + padding, right: slot.right - padding,
    top: slot.top + padding, bottom: slot.bottom - padding
  };
  const targetX = (inner.left + inner.right) * .5;
  const targetY = (inner.top + inner.bottom) * .5;
  const ndcX = targetX / width * 2 - 1, ndcY = 1 - targetY / height * 2;
  const fy = 1 / Math.tan(cameraFov * Math.PI / 360), fx = fy / (width / height);
  const worldZ = matrix.elements[14];
  const cameraDepth = Math.max(cameraNear + .2, cameraPosition[2] - worldZ);
  const worldCenter = new THREE.Vector3(cameraPosition[0] + ndcX * cameraDepth / fx, cameraPosition[1] + ndcY * cameraDepth / fy, cameraPosition[2] - cameraDepth);
  const localCenter = worldCenter.clone().applyMatrix4(matrix.clone().invert());
  const rotation = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(pose.rx, pose.ry, pose.rz));
  const linear = matrix.clone().setPosition(0, 0, 0).multiply(rotation).elements;
  if (!positions) {
    if (!fitGeometryCache.has(pose.index)) fitGeometryCache.set(pose.index, sampleHistoricalProductGeometry(pose.index).positions);
    positions = fitGeometryCache.get(pose.index);
  }
  const left = inner.left / width * 2 - 1, right = inner.right / width * 2 - 1;
  const bottom = 1 - inner.bottom / height * 2, top = 1 - inner.top / height * 2;
  let scale = slotWidth > 0 && slotHeight > 0 ? pose.scale : 0;
  function limit(room, coefficient) {
    if (coefficient > 0) scale = Math.min(scale, Math.max(0, room / coefficient));
  }
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    const vx = linear[0] * x + linear[4] * y + linear[8] * z;
    const vy = linear[1] * x + linear[5] * y + linear[9] * z;
    const vz = linear[2] * x + linear[6] * y + linear[10] * z;
    limit((ndcX - left) * cameraDepth, -(fx * vx + left * vz));
    limit((right - ndcX) * cameraDepth, fx * vx + right * vz);
    limit((ndcY - bottom) * cameraDepth, -(fy * vy + bottom * vz));
    limit((top - ndcY) * cameraDepth, fy * vy + top * vz);
    limit(cameraDepth - cameraNear - .01, vz);
  }
  const projectedBounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    const vx = linear[0] * x + linear[4] * y + linear[8] * z;
    const vy = linear[1] * x + linear[5] * y + linear[9] * z;
    const vz = linear[2] * x + linear[6] * y + linear[10] * z;
    const depth = cameraDepth - scale * vz;
    const px = (fx * (ndcX * cameraDepth / fx + scale * vx) / depth + 1) * width * .5;
    const py = (1 - fy * (ndcY * cameraDepth / fy + scale * vy) / depth) * height * .5;
    projectedBounds.left = Math.min(projectedBounds.left, px);
    projectedBounds.right = Math.max(projectedBounds.right, px);
    projectedBounds.top = Math.min(projectedBounds.top, py);
    projectedBounds.bottom = Math.max(projectedBounds.bottom, py);
  }
  return {
    ...pose, x: localCenter.x, y: localCenter.y, z: localCenter.z, scale,
    slotBounds: slot, projectedBounds, worldCenter: worldCenter.toArray(), slotFraction: 1
  };
}

/** A self-contained, procedural metal sculpture. The canvas spans the viewport. */
export function mountSculpture(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    canvas.dataset.error = String(error.message || error);
    return { setState() {}, flush() {}, resize() {}, dispose() {} };
  }
  const originalCanvasOpacity = canvas.style?.opacity || '';

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.24;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
  camera.position.set(0, 0, 7.2);
  const root = new THREE.Group();
  scene.add(root);

  // An actual room, rendered into a filtered environment map. Broad illuminated
  // panels and dark flags give the metal crisp highlights without remote assets.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0xc4c9d1);
  const roomGeometry = new THREE.BoxGeometry(24, 20, 24);
  const roomMaterial = new THREE.MeshBasicMaterial({ color: 0x9b9fa7, side: THREE.BackSide });
  studio.add(new THREE.Mesh(roomGeometry, roomMaterial));
  const studioResources = [roomGeometry, roomMaterial];
  function softbox(w, h, color, x, y, z, rx = 0, ry = 0) {
    const geometry = new THREE.PlaneGeometry(w, h);
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, toneMapped: false });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(x, y, z);
    plane.rotation.set(rx, ry, 0);
    studio.add(plane);
    studioResources.push(geometry, material);
  }
  softbox(7, 13, 0xffffff, -6, 3, 2, 0, Math.PI / 2);
  softbox(3.1, 15, 0xf5f8ff, 6, 1, 0, 0, -Math.PI / 2);
  softbox(12, 4, 0xffffff, 0, 8, -1, Math.PI / 2);
  softbox(10, 2.6, 0xeff3ff, 0, 2.8, 8, 0, Math.PI);
  softbox(7, 12, 0x171b23, -3.7, 0, -7, 0, .12);
  softbox(2.2, 15, 0x090c12, 3.2, 1, -6, 0, -.15);
  softbox(14, 7, 0x31343b, 0, -7, 0, -Math.PI / 2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .035, .1, 40);
  scene.environment = environment.texture;
  pmrem.dispose();
  studioResources.forEach(resource => resource.dispose());

  scene.add(new THREE.HemisphereLight(0xffffff, 0x5a6072, 2.25));
  const key = new THREE.DirectionalLight(0xffffff, 4.1);
  key.position.set(-4, 5, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xcbdcff, 3.2);
  rim.position.set(5, 1, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 1.2);
  fill.position.set(2, -3, 5);
  scene.add(fill);

  // Restore the original homepage sculpture verbatim: its silver ribbon knot
  // and independent cobalt orbit keep their original geometry and placement.
  class RibbonPath extends THREE.Curve {
    constructor(kind) { super(); this.kind = kind; }
    getPoint(u, target = new THREE.Vector3()) {
      const t = u * Math.PI * 2;
      const c = Math.cos, s = Math.sin;
      if (this.kind === 'hero') {
        const r = 1.12 + .34 * c(3 * t);
        return target.set(1.12 * r * c(2 * t), r * s(2 * t), .57 * s(3 * t));
      }
      return target.set(1.22 * c(t), 1.22 * s(t), .075 * s(2 * t));
    }
  }
  function ribbon(kind, width = .69, thickness = .052, twist = 1) {
    const path = new RibbonPath(kind);
    const segments = 420;
    const sides = 24;
    const frames = path.computeFrenetFrames(segments, true);
    const positions = [];
    const uvs = [];
    const indices = [];
    const p = new THREE.Vector3();
    const wide = new THREE.Vector3();
    const thin = new THREE.Vector3();
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const angle = Math.PI * 2 * u * twist + .32 * Math.sin(u * Math.PI * 4);
      path.getPoint(u, p);
      wide.copy(frames.normals[i]).multiplyScalar(Math.cos(angle)).addScaledVector(frames.binormals[i], Math.sin(angle));
      thin.copy(frames.normals[i]).multiplyScalar(-Math.sin(angle)).addScaledVector(frames.binormals[i], Math.cos(angle));
      const breadth = width * (1 + .11 * Math.sin(u * Math.PI * 6 + .7));
      for (let j = 0; j <= sides; j++) {
        const a = j / sides * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        const across = Math.sign(ca) * Math.pow(Math.abs(ca), .38) * breadth * .5;
        const depth = Math.sign(sa) * Math.pow(Math.abs(sa), .72) * thickness * .5;
        positions.push(p.x + wide.x * across + thin.x * depth, p.y + wide.y * across + thin.y * depth, p.z + wide.z * across + thin.z * depth);
        uvs.push(u, j / sides);
        if (i < segments && j < sides) {
          const a0 = i * (sides + 1) + j, b0 = a0 + sides + 1;
          indices.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }
  function metal(color, roughness = .18) {
    return new THREE.MeshPhysicalMaterial({
      color, metalness: 1, roughness, envMapIntensity: 1.65,
      clearcoat: .34, clearcoatRoughness: .22,
      transparent: false, opacity: 1, side: THREE.DoubleSide,
      depthWrite: true
    });
  }
  const silver = metal(0xe0e4ec, .165);
  const cobalt = metal(0x1449f5, .205);
  const hero = new THREE.Group();
  const knot = new THREE.Mesh(ribbon('hero', .74, .057, 1), silver);
  knot.rotation.set(.12, -.12, -.12);
  hero.add(knot);
  const orbit = new THREE.Mesh(ribbon('orbit', .31, .055, 1), cobalt);
  orbit.rotation.set(1.15, .54, -.42);
  orbit.position.set(.07, -.02, .12);
  hero.add(orbit);
  root.add(hero);

  // Cache the original two surfaces in their shared local space. Only the
  // group moves to clear the idea card; neither surface nor its pose changes.
  const heroPoints=[];
  const heroVertex=new THREE.Vector3(),heroMatrix=new THREE.Matrix4();
  const heroWorldCenter=new THREE.Vector3(),heroParentInverse=new THREE.Matrix4();
  for(const mesh of [knot,orbit]){
    mesh.updateMatrix();
    const positions=mesh.geometry.attributes.position.array;
    for(let i=0;i<positions.length;i+=3){
      heroVertex.fromArray(positions,i).applyMatrix4(mesh.matrix);
      heroPoints.push(heroVertex.x,heroVertex.y,heroVertex.z);
    }
  }

  function positionIdeaSculpture(breath){
    hero.position.set(0,0,0);hero.scale.setScalar(1);
    const layout=state.heroLayout;
    const sides=state.heroSideBounds;
    const hasSides=sides&&Number.isFinite(sides.left)&&Number.isFinite(sides.right)&&sides.right>sides.left;
    canvas.dataset.heroHorizontalShift='0';canvas.dataset.heroSideConflict='0';
    canvas.dataset.heroFitScale='1';
    if(!layout&&!hasSides)return;
    heroParentInverse.copy(root.matrixWorld).invert();
    if(layout){
      const baseScale=worldH/3.9*(mobile ? .50 : .67);
      const transfer=clamp(state.heroToManifesto,0,1);
      const scale=baseScale*(mobile?mix(1,.67,transfer):mix(1,.64,transfer))*layout.sizeFactor;
      heroWorldCenter.set(worldW*(layout.anchorX-.5),worldH*(.5-layout.anchorY)+breath,0);
      hero.position.copy(heroWorldCenter).applyMatrix4(heroParentInverse);
      hero.scale.setScalar(scale/Math.max(current.scale,1e-8));
    }else heroWorldCenter.setFromMatrixPosition(root.matrixWorld);
    hero.updateMatrix();heroMatrix.multiplyMatrices(root.matrixWorld,hero.matrix);
    // Solve all active perspective planes from this exact frame's rotation,
    // breath and drag. Translate the intact pair only when it crosses a plane.
    const fy=1/Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),fx=fy/(width/height);
    const hasBottom=Number.isFinite(state.heroBottom),lowerNdc=1-2*state.heroBottom/height;
    const leftNdc=hasSides?2*sides.left/width-1:0,rightNdc=hasSides?2*sides.right/width-1:0;
    let lift=0,minShift=-Infinity,maxShift=Infinity,minLeftSlope=Infinity,maxRightSlope=-Infinity;
    function measureHero(){
      lift=0;minShift=-Infinity;maxShift=Infinity;minLeftSlope=Infinity;maxRightSlope=-Infinity;
      for(let i=0;i<heroPoints.length;i+=3){
        heroVertex.fromArray(heroPoints,i).applyMatrix4(heroMatrix);
        const depth=camera.position.z-heroVertex.z;
        if(hasBottom)lift=Math.max(lift,camera.position.y+lowerNdc*depth/fy-heroVertex.y);
        if(hasSides){
          minShift=Math.max(minShift,camera.position.x+leftNdc*depth/fx-heroVertex.x);
          maxShift=Math.min(maxShift,camera.position.x+rightNdc*depth/fx-heroVertex.x);
          const dx=heroVertex.x-heroWorldCenter.x,dz=heroVertex.z-heroWorldCenter.z;
          minLeftSlope=Math.min(minLeftSlope,dx+leftNdc*dz/fx);
          maxRightSlope=Math.max(maxRightSlope,dx+rightNdc*dz/fx);
        }
      }
    }
    measureHero();
    let fit=1;
    if(hasSides&&minShift>maxShift){
      // A narrow desktop can have less room than one rotated silhouette.
      // Fit the intact pair by the smallest uniform perspective correction;
      // its original scale and every child mesh remain unchanged elsewhere.
      const room=(rightNdc-leftNdc)*(camera.position.z-heroWorldCenter.z)/fx;
      fit=Math.min(1,Math.max(0,room/(maxRightSlope-minLeftSlope)));
      hero.scale.multiplyScalar(fit);
      hero.updateMatrix();heroMatrix.multiplyMatrices(root.matrixWorld,hero.matrix);
      measureHero();
    }
    canvas.dataset.heroFitScale=String(fit);
    const shift=hasSides?Math.max(minShift,Math.min(0,maxShift)):0;
    if(lift>0||shift!==0){
      heroWorldCenter.x+=shift;heroWorldCenter.y+=lift;
      hero.position.copy(heroWorldCenter).applyMatrix4(heroParentInverse);
    }
    canvas.dataset.heroHorizontalShift=String(shift);
    canvas.dataset.heroSideConflict=String(hasSides?Math.max(0,minShift-maxShift):0);
  }

  // Restore all four distinct V07 forms, rather than variants of one knot.
  // Persistent meshes follow one spatial track; geometry never gets swapped
  // at a tab boundary and no incompatible knot/ring vertex morph is required.
  const octopColors = { purple: 0xa17af5, red: 0xef5b66 };
  const products = historicalProducts.map((form, index) => {
    const sample = sampleHistoricalProductGeometry(index);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(sample.positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(sample.uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(sample.indices, 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const material = metal(form.color, form.roughness);
    material.opacity = 0;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.rotation.set(...form.rotation);
    root.add(mesh);
    return mesh;
  });

  const state = { section: 'hero', progress: 0, product: 0, productPosition: 0, heroToManifesto: undefined, sceneOpacity: undefined, octopColor: 'purple', pointerX: 0, pointerY: 0, drag: 0, heroDragging: false, anchorX: undefined, anchorY: undefined, sizeFactor: 1, paused: false, reduced: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false };
  const current = { x: 0, y: 0, scale: 1, rx: .25, ry: -.42, rz: -.17, opacity: 1, productMix: 0 };
  let width = 1, height = 1, mobile = false, worldW = 1, worldH = 1;
  let raf = 0, disposed = false, inView = true, pageVisible = !document.hidden;
  let lastTime = 0, elapsed = 0, productSpin = 0, heroSpin = 0, first = true;
  let productFacingIndex = null, productEntryPending = false, productSpinStart = 0;
  let productEntryPosition = 0, productEntryStableTime = 0;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = n => n * n * (3 - 2 * n);

  function targets() {
    const p = smooth(clamp(state.progress, 0, 1));
    const product = state.section === 'products';
    const manifesto = state.section === 'manifesto';
    const hidden = state.section === 'other';
    const h = Number.isFinite(state.heroToManifesto) ? clamp(state.heroToManifesto, 0, 1) : (manifesto ? 1 : 0);
    const entry = Number.isFinite(state.productMix) ? clamp(state.productMix,0,1) : (product ? 1 : 0);
    const baseScale = worldH / 3.9 * (mobile ? .50 : .67);
    let x = worldW * (product ? .235 : mix(.18, .255, h));
    let y = (product ? -.05 : mix(.015, -.015, h)) * worldH;
    let scale = baseScale * mix(mix(1,.64,h),.93,entry);
    if (mobile) {
      x = 0;
      y = -.05 * worldH;
      scale = baseScale * mix(mix(1,.67,h),.95,entry);
    }
    // DOM anchors are viewport fractions, including out-of-viewport positions.
    if (Number.isFinite(state.anchorX)) x = worldW * (state.anchorX - .5);
    if (Number.isFinite(state.anchorY)) y = worldH * (.5 - state.anchorY);
    scale *= Number.isFinite(state.sizeFactor) ? Math.max(0, state.sizeFactor) : 1;
    const pointerX = clamp(state.pointerX, -1, 1), pointerY = clamp(state.pointerY, -1, 1);
    const dragX = typeof state.drag === 'object' ? clamp(state.drag.x, -2, 2) : (Number.isFinite(state.drag) ? state.drag : 0);
    const dragY = typeof state.drag === 'object' ? clamp(state.drag.y, -2, 2) : 0;
    return {
      x, y, scale,
      rx: mix(mix(.24,.52,h),.24,entry) + pointerY * .075 + dragY * .28,
      ry: mix(mix(-.44,.25+h*.35,h),-.32,entry) + pointerX * .13 + dragX * .35,
      rz: mix(mix(-.19,-.25+h*.18,h),-.10,entry),
      opacity: Number.isFinite(state.sceneOpacity) ? clamp(state.sceneOpacity, 0, 1) : (hidden ? 0 : 1),
      productMix: entry
    };
  }
  function tick(time) {
    raf = 0;
    if (disposed || !inView || !pageVisible) return;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .06) : 1 / 60;
    lastTime = time;
    const dynamic = !state.paused && !state.reduced;
    if (dynamic) elapsed += dt;
    const target = targets();
    // A continuous underlying clock survives every tab. Each incoming form
    // gets a local front-facing origin while it is invisible at the midpoint.
    // Freeze the clock while paused, reduced, hidden or outside products.
    if (dynamic && target.productMix > .006 && target.opacity > .006) productSpin += dt * PRODUCT_SPIN_RATE;
    // Turn the approved silver/blue pair as one object. Its phase survives
    // reading pauses and handoffs, while pointer dragging temporarily takes over.
    if (dynamic && !state.heroDragging && target.productMix < .994 && target.opacity > .006) heroSpin += dt * HERO_SPIN_RATE;
    const ease = first || state.reduced ? 1 : 1 - Math.exp(-dt * 7);
    let unsettled = false;
    for (const name of ['x', 'y', 'scale', 'rx', 'ry', 'rz', 'opacity', 'productMix']) {
      current[name] = mix(current[name], target[name], ease);
      if (Math.abs(current[name] - target[name]) > .0005) unsettled = true;
    }
    // Explicit DOM anchors follow the actual viewport on this frame. Keeping
    // an eased, stale anchor would let the sculpture trespass into UI below.
    if (Number.isFinite(state.anchorX)) current.x = target.x;
    if (Number.isFinite(state.anchorY)) current.y = target.y;
    if (Number.isFinite(state.sizeFactor)) current.scale = target.scale;
    current.productMix = target.productMix;
    const breath = dynamic ? Math.sin(elapsed * .43) * .022 : 0;
    root.position.set(current.x, current.y + breath, 0);
    root.scale.setScalar(current.scale);
    root.rotation.set(current.rx + (dynamic ? Math.sin(elapsed * .24) * .025 : 0), current.ry + (dynamic ? Math.sin(elapsed * .29) * .048 : 0), current.rz);
    hero.rotation.set(0, heroSpin, 0);
    // The same direct scroll sample positions both sculpture and copy. A stop
    // at 1.47 holds the handoff there; reverse scroll retraces the same poses.
    root.updateMatrixWorld(true);
    // The outgoing idea sculpture and the incoming product use independent
    // anchors while sharing the same uninterrupted scroll sample.
    positionIdeaSculpture(breath);
    const productTransition = sampleProductTransition(state.productPosition, { reduced: state.reduced });
    if (target.productMix > .006) {
      if (productFacingIndex !== productTransition.activeIndex) {
        productFacingIndex = productTransition.activeIndex;
        productEntryPending = true;
        productSpinStart = productSpin;
        productEntryPosition = productTransition.position;
        productEntryStableTime = 0;
      }
      if (Math.abs(productTransition.position - productEntryPosition) > 1e-5) {
        productEntryPosition = productTransition.position;
        productEntryStableTime = 0;
      } else if (dynamic) productEntryStableTime += dt;
      // Keep the incoming sculpture at its approved orientation throughout
      // entry, then briefly show that exact front before its slow idle turn.
      // Readiness comes from the real reading stage, not its visual entrance
      // blend: a header-aligned anchor can legitimately stop below .994.
      const productReady = typeof state.productReady === 'boolean' ? state.productReady : target.productMix >= .994;
      const frontDistance = Math.abs(productTransition.position - productFacingIndex);
      const frontSettled = frontDistance < 1e-5 || (frontDistance <= .01 + 1e-7
        && productTransition.opacity >= .998 && productEntryStableTime >= .18);
      if (productEntryPending && productReady && frontSettled) {
        productEntryPending = false;
        productSpinStart = productSpin + PRODUCT_FRONT_HOLD * PRODUCT_SPIN_RATE;
      }
    }
    const productDisplaySpin = productEntryPending ? 0 : Math.max(0, productSpin - productSpinStart);
    const fitProducts = state.artBounds && Number.isFinite(state.artBounds.left) && Number.isFinite(state.artBounds.bottom);
    const poses = fitProducts ? products.map((mesh, index) => fitHistoricalProductPose({
      index, position: state.productPosition, width, height, artBounds: state.artBounds,
      rootMatrix: root.matrixWorld, positions: mesh.geometry.attributes.position.array,
      cameraPosition: camera.position.toArray(), cameraFov: camera.fov, cameraNear: camera.near,
      reduced: state.reduced, spin: productDisplaySpin
    })) : sampleProductHandoff(state.productPosition, { reduced: state.reduced, spin: productDisplaySpin });
    if (Number.isFinite(state.sceneOpacity)) current.opacity = target.opacity;
    const heroAlpha = current.opacity * (1 - current.productMix);
    const productAlpha = current.opacity * current.productMix;
    for (const mesh of [knot, orbit]) {
      mesh.visible = heroAlpha > .006;
      // Keep metal solid through the handoff. Its document-space trajectory
      // carries it out; alpha blending exposed the ribbon's hidden surfaces.
      mesh.material.opacity = 1;
      mesh.material.depthWrite = true;
    }
    hero.visible = heroAlpha > .006;
    products.forEach((mesh, index) => {
      const pose = poses[index], opacity = productAlpha * pose.weight;
      mesh.position.set(pose.x, pose.y, pose.z);
      mesh.scale.setScalar(pose.scale);
      mesh.rotation.set(pose.rx, pose.ry, pose.rz);
      mesh.visible = opacity > .006;
      mesh.material.opacity = 1;
      mesh.material.depthWrite = true;
    });
    // Fade the already opaque rendered image, never the metal surfaces. Keeping
    // the original inline value outside the product stage preserves the hero's
    // existing handoff and its independent silver/blue material rendering.
    if (canvas.style) canvas.style.opacity = current.productMix >= .994 ? String(productTransition.opacity) : originalCanvasOpacity;
    canvas.dataset.productPosition = clamp(state.productPosition, 0, 3).toFixed(4);
    canvas.dataset.productSpin = productSpin.toFixed(6);
    canvas.dataset.productSpinRate = String(PRODUCT_SPIN_RATE);
    canvas.dataset.productDisplaySpin = productDisplaySpin.toFixed(6);
    canvas.dataset.productFacing = productEntryPending ? 'entering-front' : productDisplaySpin === 0 ? 'front-hold' : 'idle-turn';
    canvas.dataset.productFrontHold = String(PRODUCT_FRONT_HOLD);
    canvas.dataset.heroSpin = heroSpin.toFixed(6);
    canvas.dataset.heroSpinRate = String(HERO_SPIN_RATE);
    canvas.dataset.sculptureHandoff = 'solid-spatial-exit';
    canvas.dataset.productKinds = historicalProducts.map(form => form.kind).join(',');
    canvas.dataset.productWeights = poses.map(pose => pose.weight.toFixed(4)).join(',');
    canvas.dataset.productOpacity = productTransition.opacity.toFixed(6);
    canvas.dataset.productActiveIndex = String(productTransition.activeIndex);
    canvas.dataset.visibleProductCount = String(products.filter(mesh => mesh.visible).length);
    canvas.dataset.productRotations = JSON.stringify(poses.map(pose => [pose.rx, pose.ry, pose.rz]));
    canvas.dataset.productTrack = 'historical-single-sculpture';
    canvas.dataset.productFit = fitProducts ? 'whole-object-projection' : 'off';
    canvas.dataset.productBounds = fitProducts ? JSON.stringify(poses.filter(pose => pose.weight > .006).map(pose => ({
      index: pose.index, slot: pose.slotBounds, projected: pose.projectedBounds, scale: pose.scale
    }))) : '';
    canvas.dataset.meshCount = '6';
    canvas.dataset.visibleMeshCount = String((hero.visible ? 2 : 0) + products.filter(mesh => mesh.visible).length);
    renderer.render(scene, camera);
    first = false;
    canvas.dataset.ready = 'true';
    if (unsettled || (dynamic && current.opacity > .01)) schedule();
  }
  function schedule() {
    if (!raf && !disposed && inView && pageVisible) raf = requestAnimationFrame(tick);
  }
  function resize() {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width || window.innerWidth);
    height = Math.max(1, bounds.height || window.innerHeight);
    mobile = width <= 800;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    worldH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    worldW = worldH * camera.aspect;
    schedule();
  }
  function setState(next = {}) {
    Object.assign(state, next);
    state.product = Math.round(clamp(state.product, 0, 3));
    if (Object.prototype.hasOwnProperty.call(next, 'productPosition')) state.productPosition = clamp(next.productPosition, 0, 3);
    else if (Object.prototype.hasOwnProperty.call(next, 'product')) state.productPosition = state.product;
    state.progress = clamp(state.progress, 0, 1);
    state.octopColor = state.octopColor === 'red' ? 'red' : 'purple';
    products[3].material.color.setHex(octopColors[state.octopColor]);
    schedule();
  }
  function flush(time = performance.now()) {
    if (disposed || !inView || !pageVisible) return;
    // A page-owned RAF can commit copy and this exact sculpture state in one
    // paint. Replace the queued frame; tick retains the single animation loop.
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    tick(Number.isFinite(time) ? Math.max(lastTime, time) : performance.now());
  }
  function visibility() {
    pageVisible = !document.hidden;
    if (!pageVisible && raf) { cancelAnimationFrame(raf); raf = 0; }
    lastTime = 0;
    schedule();
  }
  function contextLost(event) {
    event.preventDefault();
    canvas.dataset.error = 'WebGL context lost';
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
    inView = entries[0]?.isIntersecting ?? true;
    if (!inView && raf) { cancelAnimationFrame(raf); raf = 0; }
    lastTime = 0;
    schedule();
  }) : null;
  observer?.observe(canvas);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('resize', resize, { passive: true });
  canvas.addEventListener('webglcontextlost', contextLost);
  resize();

  function dispose() {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    observer?.disconnect();
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('webglcontextlost', contextLost);
    if (canvas.style) canvas.style.opacity = originalCanvasOpacity;
    root.traverse(object => {
      object.geometry?.dispose();
      if (object.material) object.material.dispose();
    });
    environment.dispose();
    renderer.dispose();
  }
  return { setState, flush, resize, dispose };
}
