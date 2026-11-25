import * as THREE from 'three';
import { clampDistance, DEFAULT_DISTANCE, rotateObject } from './interaction.js';
import './style.css';

const stage = document.querySelector('#stage');
const container = document.querySelector('#canvas-container');
const message = document.querySelector('#viewer-message');
const controls = document.querySelectorAll('.controls button');
const spinButton = document.querySelector('#spin');
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');

function showError(text) {
  message.textContent = text;
  message.hidden = false;
  stage.removeAttribute('tabindex');
  stage.setAttribute('aria-label', '3D 模型無法顯示，請參閱錯誤訊息。');
  controls.forEach((button) => { button.disabled = true; });
}

try {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, DEFAULT_DISTANCE);
  const sculpture = new THREE.Group();
  sculpture.rotation.set(-0.3, 0.35, 0.15);
  const initialRotation = sculpture.quaternion.clone();
  scene.add(sculpture);

  const sage = new THREE.MeshStandardMaterial({ color: 0x789d7a, roughness: 0.3, metalness: 0.14 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x406b52, roughness: 0.42, metalness: 0.2 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xe9f1df, roughness: 0.3, metalness: 0.08 });
  const gold = new THREE.MeshStandardMaterial({ color: 0x9d9a6a, roughness: 0.32, metalness: 0.6 });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.02, 3), sage);
  sculpture.add(core);
  const band = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.065, 20, 150), dark);
  band.rotation.set(0.85, 0.25, 0.12);
  sculpture.add(band);
  const band2 = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.022, 12, 150), gold);
  band2.rotation.set(-0.35, 0.7, 0.45);
  sculpture.add(band2);
  const band3 = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.03, 12, 120), cream);
  band3.rotation.set(1.3, 0.1, -0.9);
  sculpture.add(band3);
  const sphereGeometry = new THREE.SphereGeometry(0.22, 32, 24);
  for (const [position, scale, material] of [
    [[1.52, 0.9, 0.12], 1.1, cream],
    [[-1.55, -0.25, 0.8], 0.68, gold],
    [[0.25, -1.46, -0.65], 0.8, dark],
  ]) {
    const sphere = new THREE.Mesh(sphereGeometry, material);
    sphere.position.set(...position);
    sphere.scale.setScalar(scale);
    sculpture.add(sphere);
  }
  scene.add(new THREE.HemisphereLight(0xfafff3, 0x4e6959, 2.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.3);
  keyLight.position.set(4, 6, 7);
  scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0xc8e9c5, 2.4);
  rim.position.set(-4, -1, -5);
  scene.add(rim);

  let spinning = false;
  let distance = DEFAULT_DISTANCE;
  let previousTime = 0;
  const pointers = new Map();
  let pinchDistance = 0;
  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.position.z = distance * (camera.aspect < 1 ? 1 / Math.max(camera.aspect, 0.55) : 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  function zoom(factor) { distance = clampDistance(distance * factor); resize(); }
  function stopSpin() { spinning = false; spinButton.setAttribute('aria-pressed', 'false'); }
  function pinchLength() {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault(); stage.focus({ preventScroll: true }); stopSpin();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    stage.setPointerCapture(event.pointerId);
    if (pointers.size === 2) pinchDistance = pinchLength();
  });
  stage.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    const old = pointers.get(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) rotateObject(sculpture, event.clientX - old.x, event.clientY - old.y);
    else if (pointers.size === 2) {
      const current = pinchLength();
      if (current > 0 && pinchDistance > 0) zoom(pinchDistance / current);
      pinchDistance = current;
    }
  });
  function release(event) {
    pointers.delete(event.pointerId);
    pinchDistance = pointers.size === 2 ? pinchLength() : 0;
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('lostpointercapture', release);
  stage.addEventListener('wheel', (event) => {
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
    const next = clampDistance(distance * Math.exp(delta * 0.001));
    if (next !== distance) { event.preventDefault(); zoom(next / distance); }
  }, { passive: false });
  stage.addEventListener('keydown', (event) => {
    const actions = {
      ArrowLeft: () => rotateObject(sculpture, -30, 0),
      ArrowRight: () => rotateObject(sculpture, 30, 0),
      ArrowUp: () => rotateObject(sculpture, 0, -30),
      ArrowDown: () => rotateObject(sculpture, 0, 30),
      '+': () => zoom(0.9), '=': () => zoom(0.9), '-': () => zoom(1.1),
    };
    if (actions[event.key]) { event.preventDefault(); stopSpin(); actions[event.key](); }
  });
  document.querySelector('#zoom-in').addEventListener('click', () => zoom(0.85));
  document.querySelector('#zoom-out').addEventListener('click', () => zoom(1.18));
  for (const [id, dx, dy] of [['rotate-left', -45, 0], ['rotate-right', 45, 0], ['rotate-up', 0, -45], ['rotate-down', 0, 45]]) {
    document.querySelector(`#${id}`).addEventListener('click', () => { stopSpin(); rotateObject(sculpture, dx, dy); });
  }
  document.querySelector('#reset').addEventListener('click', () => {
    stopSpin(); sculpture.quaternion.copy(initialRotation); distance = DEFAULT_DISTANCE; resize();
  });
  spinButton.addEventListener('click', () => {
    spinning = !spinning; spinButton.setAttribute('aria-pressed', String(spinning));
  });
  reducedMotion?.addEventListener?.('change', (event) => { if (event.matches) stopSpin(); });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault(); renderer.setAnimationLoop(null);
    showError('3D 畫面已中斷。請重新整理頁面，或嘗試其他支援 WebGL 的瀏覽器。');
  });
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();
  renderer.setAnimationLoop((time) => {
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    if (spinning) rotateObject(sculpture, delta * 30, 0);
    renderer.render(scene, camera);
  });
  message.hidden = true;
} catch (error) {
  console.error('3D initialization failed:', error);
  showError('目前無法顯示 3D 模型。請確認瀏覽器支援 WebGL，或啟用硬體加速後重新整理。');
}
