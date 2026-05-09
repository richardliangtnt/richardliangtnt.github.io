import * as THREE from '../vendor/three.module.js';

const projects = {
  published: {
    title: '已发表研究室',
    summary: '已发表的 VRPTW 研究，结合竞争群优化、路径多样性指标和自适应邻域搜索。',
    tags: ['SCIE', 'JCR Q1', 'VRPTW'],
    status: '已发表',
    link: 'projects/published-research.html',
    color: 0x2f6fed,
    position: [-7.2, 0, -4.2]
  },
  rl: {
    title: '强化学习优化实验室',
    summary: '投稿中 EVRPTW 论文的轻量公开展示：学习引导双种群蚁群算法。',
    tags: ['强化学习', 'EVRPTW', 'ACO'],
    status: '投稿中',
    link: 'projects/rl-optimization.html',
    color: 0x6757c8,
    position: [-1.8, 0, -5.1]
  },
  iot: {
    title: 'IoT 基地',
    summary: '基于 RT-Thread 和 ZigBee 的宠物智能监护系统，支持传感器采集与远程设备控制。',
    tags: ['IoT', 'RT-Thread', 'ZigBee'],
    status: '代码可公开',
    link: 'projects/iot-base.html',
    color: 0x2f8a68,
    position: [5.2, 0, -2.3]
  },
  traffic: {
    title: '交通车库',
    summary: 'ROS 智能小车项目，覆盖 SLAM、激光雷达导航、定位、路径规划和轨迹跟踪。',
    tags: ['ROS', 'SLAM', '路径规划'],
    status: '代码可公开',
    link: 'projects/traffic-garage.html',
    color: 0xb97124,
    position: [-4.2, 0, 3.7]
  },
  python: {
    title: 'Python 工作室',
    summary: '后续用于放置数据分析和机器学习项目。第一版先诚实标记为建设中。',
    tags: ['Python', '数据分析', '建设中'],
    status: '规划中',
    link: 'index.html#contact',
    color: 0xffe38f,
    position: [4.3, 0, 4.1]
  }
};

const stage = document.querySelector('[data-three-stage]');
const labelLayer = document.querySelector('[data-three-labels]');
const loading = document.querySelector('[data-three-loading]');
const card = document.querySelector('[data-three-card]');
const cardTitle = document.querySelector('[data-three-title]');
const cardSummary = document.querySelector('[data-three-summary]');
const cardStatus = document.querySelector('[data-three-status]');
const cardTags = document.querySelector('[data-three-tags]');
const cardLink = document.querySelector('[data-three-link]');

if (!stage) {
  throw new Error('Missing 3D preview stage.');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffa65a);
scene.fog = new THREE.Fog(0xffa65a, 18, 34);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
const cameraState = {
  theta: -0.72,
  phi: 0.92,
  radius: 18,
  target: new THREE.Vector3(0, 0.4, 0)
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();
const keys = new Set();
const buildings = [];
const labels = [];

function setCamera() {
  const x = cameraState.target.x + cameraState.radius * Math.sin(cameraState.phi) * Math.sin(cameraState.theta);
  const y = cameraState.target.y + cameraState.radius * Math.cos(cameraState.phi);
  const z = cameraState.target.z + cameraState.radius * Math.sin(cameraState.phi) * Math.cos(cameraState.theta);
  camera.position.set(x, y, z);
  camera.lookAt(cameraState.target);
}

function resize() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  setCamera();
}

function makeMaterial(color, roughness = 0.72) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02
  });
}

function addMesh(mesh, receive = true, cast = true) {
  mesh.receiveShadow = receive;
  mesh.castShadow = cast;
  scene.add(mesh);
  return mesh;
}

function makeBox(width, height, depth, color) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry, makeMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeBuilding(id, data) {
  const group = new THREE.Group();
  const [x, y, z] = data.position;
  group.position.set(x, y, z);
  group.userData.projectId = id;

  const base = makeBox(1.75, 1.45, 1.55, data.color);
  base.position.y = 0.72;
  group.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.45, 0.8, 4),
    makeMaterial(new THREE.Color(data.color).offsetHSL(0, -0.02, -0.12))
  );
  roof.position.y = 1.82;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const door = makeBox(0.38, 0.62, 0.045, 0x33251f);
  door.position.set(0, 0.31, 0.8);
  group.add(door);

  const windowLeft = makeBox(0.36, 0.28, 0.045, 0xf7f1b4);
  windowLeft.position.set(-0.52, 0.92, 0.8);
  group.add(windowLeft);

  const windowRight = windowLeft.clone();
  windowRight.position.x = 0.52;
  group.add(windowRight);

  const label = document.createElement('button');
  label.className = 'three-label notranslate';
  label.setAttribute('translate', 'no');
  label.type = 'button';
  label.textContent = data.title;
  label.addEventListener('click', () => showProject(id));
  labelLayer.appendChild(label);
  labels.push({ element: label, group });

  group.traverse((item) => {
    if (item.isMesh) item.userData.projectId = id;
  });
  scene.add(group);
  buildings.push(group);
}

function addRoad(x, z, width, depth, rotation = 0) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.08, depth),
    makeMaterial(0xf5c69a, 0.88)
  );
  road.position.set(x, 0.07, z);
  road.rotation.y = rotation;
  road.receiveShadow = true;
  scene.add(road);
}

function addTree(x, z, scale = 1) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.72, 8), makeMaterial(0x9b5d35));
  trunk.position.set(x, 0.36 * scale, z);
  trunk.scale.setScalar(scale);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.35, 8), makeMaterial(0xf3e15f));
  crown.position.set(x, 1.12 * scale, z);
  crown.scale.setScalar(scale);
  crown.castShadow = true;
  scene.add(crown);
}

const ambient = new THREE.HemisphereLight(0xfff1d0, 0x7b4a2f, 2.0);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 2.8);
sun.position.set(-6, 12, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(17.5, 0.36, 12.5),
  makeMaterial(0xffedd4, 0.86)
);
ground.position.y = -0.18;
ground.receiveShadow = true;
ground.castShadow = false;
scene.add(ground);

addRoad(0, 0, 15.2, 1.0, 0);
addRoad(0.4, -0.6, 1.0, 10.3, 0);
addRoad(-4.6, -1.8, 6.6, 0.8, -0.45);
addRoad(4.3, 1.6, 5.6, 0.8, 0.45);

Object.entries(projects).forEach(([id, data]) => makeBuilding(id, data));

[
  [-7.7, 2.1, 0.9], [7.6, 2.2, 0.8], [7.5, -5.0, 1.0],
  [-8.0, -5.2, 0.75], [0.3, 5.4, 0.75], [-0.3, -5.9, 0.82]
].forEach(([x, z, scale]) => addTree(x, z, scale));

const car = new THREE.Group();
const carBody = makeBox(1.15, 0.42, 0.72, 0xd64d42);
carBody.position.y = 0.42;
car.add(carBody);
const carCabin = makeBox(0.58, 0.34, 0.52, 0xf5a069);
carCabin.position.set(-0.1, 0.78, 0);
car.add(carCabin);

const wheelMaterial = makeMaterial(0x2b2421);
[-0.36, 0.36].forEach((x) => {
  [-0.42, 0.42].forEach((z) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 16), wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.18, z);
    wheel.castShadow = true;
    wheel.userData.isWheel = true;
    car.add(wheel);
  });
});
car.position.set(0, 0, 1.2);
scene.add(car);

function showProject(projectId) {
  const project = projects[projectId];
  if (!project) return;

  cardTitle.textContent = project.title;
  cardSummary.textContent = project.summary;
  cardStatus.textContent = project.status;
  cardLink.href = project.link;
  cardTags.innerHTML = '';
  project.tags.forEach((tagText) => {
    const tag = document.createElement('span');
    tag.className = 'tag notranslate';
    tag.setAttribute('translate', 'no');
    tag.textContent = tagText;
    cardTags.appendChild(tag);
  });
  card.classList.add('is-visible');

  buildings.forEach((building) => {
    const active = building.userData.projectId === projectId;
    building.scale.setScalar(active ? 1.08 : 1);
  });
}

function pointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickBuilding(event) {
  pointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(buildings, true);
  const hit = hits.find((item) => item.object.userData.projectId);
  if (hit) {
    showProject(hit.object.userData.projectId);
  }
}

let dragging = false;
let dragStart = null;

stage.addEventListener('pointerdown', (event) => {
  dragging = true;
  dragStart = { x: event.clientX, y: event.clientY, theta: cameraState.theta, phi: cameraState.phi, moved: false };
  stage.setPointerCapture(event.pointerId);
});

stage.addEventListener('pointermove', (event) => {
  if (!dragging || !dragStart) return;
  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) dragStart.moved = true;
  cameraState.theta = dragStart.theta - dx * 0.008;
  cameraState.phi = THREE.MathUtils.clamp(dragStart.phi + dy * 0.006, 0.45, 1.25);
  setCamera();
});

stage.addEventListener('pointerup', (event) => {
  if (dragging && dragStart && !dragStart.moved) {
    pickBuilding(event);
  }
  dragging = false;
  dragStart = null;
});

stage.addEventListener('wheel', (event) => {
  event.preventDefault();
  cameraState.radius = THREE.MathUtils.clamp(cameraState.radius + event.deltaY * 0.015, 11, 27);
  setCamera();
}, { passive: false });

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

function updateCar(delta) {
  let dx = 0;
  let dz = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dz -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dz += 1;

  const moving = dx !== 0 || dz !== 0;
  if (!moving) return;

  const length = Math.hypot(dx, dz) || 1;
  car.position.x = THREE.MathUtils.clamp(car.position.x + (dx / length) * delta * 4.2, -8, 8);
  car.position.z = THREE.MathUtils.clamp(car.position.z + (dz / length) * delta * 4.2, -5.6, 5.6);
  car.rotation.y = Math.atan2(dx, dz);
  car.children.forEach((child) => {
    if (child.userData.isWheel) child.rotation.x += delta * 12;
  });
}

function updateLabels() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  labels.forEach(({ element, group }) => {
    const pos = new THREE.Vector3();
    group.getWorldPosition(pos);
    pos.y += 2.55;
    pos.project(camera);
    const visible = pos.z < 1;
    element.style.display = visible ? 'block' : 'none';
    element.style.transform = `translate(-50%, -50%) translate(${(pos.x * 0.5 + 0.5) * width}px, ${(-pos.y * 0.5 + 0.5) * height}px)`;
  });
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.04);
  updateCar(delta);
  updateLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

resize();
showProject('published');
if (loading) loading.remove();
window.addEventListener('resize', resize);
requestAnimationFrame(animate);
