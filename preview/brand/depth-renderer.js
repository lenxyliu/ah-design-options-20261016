import * as THREE from './vendor/three.module.js';
import { buildProductWorld } from './depth-scenes.js';
import { sampleDepthCamera } from './depth-camera.js';

const WORLD_COUNT = 4;
const WORLD_SPACING = 7000;
const CLOUD = 0xf4f8fe;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

/**
 * A real, shared 3D corridor. The exhibition's damped scroll loop is the only
 * frame clock: this module intentionally never starts requestAnimationFrame.
 */
export function createDepthExperience({ container } = {}) {
  let renderer;
  let scene;
  let camera;
  let sunlight;
  let sunlightTarget;
  let canvas;
  let worlds = [];
  let disposed = false;
  let contextLost = false;
  let ready = false;
  let width = 0;
  let height = 0;
  let ratio = 0;
  let mobile = false;
  let lastState = { index: 0, progress: 0, opacity: 0, reduced: false };
  const target = new THREE.Vector3();

  const showFallback = () => {
    container?.classList.remove('has-depth');
    if (canvas) canvas.style.visibility = 'hidden';
  };

  const releaseScene = () => {
    if (!scene) return;
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      const entries = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of entries) {
        if (!material) continue;
        materials.add(material);
        for (const property of Object.values(material)) {
          if (property?.isTexture) textures.add(property);
        }
        // Shader materials can hold textures in uniforms instead of map slots.
        for (const uniform of Object.values(material.uniforms || {})) {
          if (uniform?.value?.isTexture) textures.add(uniform.value);
        }
      }
      if (object.shadow?.map) object.shadow.map.dispose();
      if (object.shadow?.mapPass) object.shadow.mapPass.dispose();
    });
    for (const texture of textures) texture.dispose();
    for (const material of materials) material.dispose();
    for (const geometry of geometries) geometry.dispose();
    scene.clear();
    worlds = [];
  };

  function resize() {
    if (disposed || !renderer || !container) return;
    const rect = container.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width || container.clientWidth || 1));
    const nextHeight = Math.max(1, Math.round(rect.height || container.clientHeight || 1));
    mobile = nextWidth <= 760;
    const nextRatio = Math.min(globalThis.devicePixelRatio || 1, mobile ? 1.5 : 1.7);
    if (nextWidth !== width || nextHeight !== height || nextRatio !== ratio) {
      width = nextWidth;
      height = nextHeight;
      ratio = nextRatio;
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function render(state = {}) {
    if (disposed || !renderer || !scene || !camera) return;
    lastState = {
      index: clamp(Math.round(finite(state.index, lastState.index)), 0, WORLD_COUNT - 1),
      progress: clamp(finite(state.progress, lastState.progress), 0, 1),
      opacity: clamp(finite(state.opacity, 1), 0, 1),
      reduced: Boolean(state.reduced),
    };
    if (lastState.reduced || contextLost) {
      showFallback();
      return;
    }
    canvas.style.opacity = String(lastState.opacity);
    if (lastState.opacity <= 0) {
      canvas.style.visibility = 'hidden';
      return;
    }
    resize();
    if (width < 2 || height < 2) return;

    try {
      const { index, progress } = lastState;
      const pose = sampleDepthCamera(index, progress, { mobile });
      const worldZ = -WORLD_SPACING * index;
      camera.position.set(pose.position[0], pose.position[1], pose.position[2] + worldZ);
      target.set(pose.target[0], pose.target[1], pose.target[2] + worldZ);
      camera.fov = pose.fov || 48;
      camera.lookAt(target);
      camera.updateProjectionMatrix();

      // Shadow detail follows the camera continuously. Neighboring rooms remain
      // visible through portals in this same shared world.
      const shadowCenterZ = camera.position.z - 1400;
      sunlight.position.set(-1000, 1650, shadowCenterZ + 1500);
      sunlightTarget.position.set(100, -150, shadowCenterZ - 900);
      sunlightTarget.updateMatrixWorld();
      for (let i = 0; i < worlds.length; i += 1) worlds[i].visible = Math.abs(i - index) <= 1;

      renderer.render(scene, camera);
      ready = true;
      canvas.style.visibility = 'visible';
      container.classList.add('has-depth');
      container.dataset.depthIndex = String(index);
      container.dataset.depthProgress = progress.toFixed(4);
      container.dataset.cameraZ = camera.position.z.toFixed(2);
      container.dataset.cameraX = camera.position.x.toFixed(2);
      container.dataset.cameraY = camera.position.y.toFixed(2);
    } catch (error) {
      ready = false;
      showFallback();
      // Product copy and the existing diagrams remain usable if a GPU or
      // individual device cannot render the enhanced scene.
      console.warn('Agent Hosting spatial preview is unavailable.', error);
    }
  }

  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    ready = false;
    showFallback();
  }

  function onContextRestored() {
    if (disposed) return;
    contextLost = false;
    // Three.js restores its GPU resources on this event. Reapply viewport
    // settings and redraw the latest scroll position without starting a loop.
    width = 0;
    height = 0;
    ratio = 0;
    render(lastState);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    ready = false;
    showFallback();
    if (canvas) {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    }
    releaseScene();
    if (renderer) {
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
    canvas?.remove();
    if (container) {
      for (const key of ['depthIndex', 'depthProgress', 'cameraZ', 'cameraX', 'cameraY']) {
        delete container.dataset[key];
      }
    }
  }

  const api = {
    get available() { return Boolean(renderer && !contextLost && !disposed); },
    get ready() { return ready; },
    render,
    resize,
    dispose,
  };

  if (!container?.appendChild) return api;

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      depth: true,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    canvas = renderer.domElement;
    canvas.className = 'depth-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('role', 'presentation');
    canvas.tabIndex = -1;
    Object.assign(canvas.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      display: 'block', pointerEvents: 'none', visibility: 'hidden', opacity: '0',
    });
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(CLOUD, 1);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(CLOUD);
    scene.fog = new THREE.Fog(CLOUD, 1800, 9000);
    camera = new THREE.PerspectiveCamera(48, 1, 1, 18000);

    scene.add(new THREE.AmbientLight(0xc8daf3, 0.58));
    scene.add(new THREE.HemisphereLight(0xf5faff, 0x7895bc, 1.85));
    sunlight = new THREE.DirectionalLight(0xffffff, 3.1);
    sunlightTarget = new THREE.Object3D();
    sunlight.target = sunlightTarget;
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(2048, 2048);
    sunlight.shadow.camera.left = -2400;
    sunlight.shadow.camera.right = 2400;
    sunlight.shadow.camera.top = 1800;
    sunlight.shadow.camera.bottom = -1800;
    sunlight.shadow.camera.near = 50;
    sunlight.shadow.camera.far = 8000;
    sunlight.shadow.bias = -0.00015;
    sunlight.shadow.normalBias = 2;
    sunlight.shadow.radius = 4;
    scene.add(sunlight, sunlightTarget);

    const rim = new THREE.DirectionalLight(0x739dff, 0.9);
    rim.position.set(1400, 300, -7000);
    scene.add(rim);

    for (let index = 0; index < WORLD_COUNT; index += 1) {
      const world = buildProductWorld(THREE, index);
      world.position.z -= WORLD_SPACING * index;
      world.name ||= `product-world-${index}`;
      world.traverse((object) => {
        if (!object.isMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        // Opaque geometry participates in a real depth buffer. Transparent
        // glass can still occlude against opaque architecture without writing
        // a flat rectangle over everything behind it.
        for (const material of materials) {
          if (!material) continue;
          material.depthTest = true;
          material.depthWrite = !material.transparent;
        }
      });
      worlds.push(world);
      scene.add(world);
    }

    container.appendChild(canvas);
    resize();
    // Establish the enhancement class before the exhibition measures chapter
    // widths. A single successful GPU frame validates the enhancement; it is
    // hidden until the exhibition supplies its actual scroll position.
    render({ index: 0, progress: 0, opacity: 1, reduced: false });
    lastState.opacity = 0;
    canvas.style.opacity = '0';
    canvas.style.visibility = 'hidden';
  } catch (error) {
    showFallback();
    releaseScene();
    if (renderer) {
      canvas?.removeEventListener('webglcontextlost', onContextLost);
      canvas?.removeEventListener('webglcontextrestored', onContextRestored);
      renderer.dispose();
    }
    canvas?.remove();
    renderer = undefined;
    console.warn('Agent Hosting spatial preview is unavailable.', error);
  }

  return api;
}
