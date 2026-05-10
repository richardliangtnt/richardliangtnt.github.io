const projects = {
  published: {
    title: '已发表研究室',
    summary: '已发表的 VRPTW 研究，结合竞争群优化、路径多样性指标和自适应邻域搜索。',
    tags: ['SCIE', 'JCR Q1', 'VRPTW'],
    status: '已发表',
    link: 'projects/published-research.html'
  },
  rl: {
    title: '强化学习优化实验室',
    summary: '投稿中 EVRPTW 论文的轻量公开展示：学习引导双种群蚁群算法。',
    tags: ['强化学习', 'EVRPTW', 'ACO'],
    status: '投稿中',
    link: 'projects/rl-optimization.html'
  },
  iot: {
    title: 'IoT 基地',
    summary: '基于 RT-Thread 和 ZigBee 的宠物智能监护系统，支持传感器采集与远程设备控制。',
    tags: ['IoT', 'RT-Thread', 'ZigBee'],
    status: '代码可公开',
    link: 'projects/iot-base.html'
  },
  traffic: {
    title: '交通车库',
    summary: 'ROS 智能小车项目，覆盖 SLAM、激光雷达导航、定位、路径规划和轨迹跟踪。',
    tags: ['ROS', 'SLAM', '路径规划'],
    status: '代码可公开',
    link: 'projects/traffic-garage.html'
  },
  python: {
    title: 'Python 工作室',
    summary: 'RAG 文档问答项目：上传文档、构建轻量检索索引，并结合 DeepSeek API 生成可追溯回答。',
    tags: ['Python', 'Streamlit', 'RAG'],
    status: '代码可公开',
    link: 'projects/rag-doc-qa.html'
  }
};

function initProjectMap() {
  const map = document.querySelector('[data-map]');
  const car = document.querySelector('[data-car]');
  const card = document.querySelector('[data-map-card]');
  const title = document.querySelector('[data-card-title]');
  const summary = document.querySelector('[data-card-summary]');
  const status = document.querySelector('[data-card-status]');
  const tags = document.querySelector('[data-card-tags]');
  const link = document.querySelector('[data-card-link]');
  const buildings = [...document.querySelectorAll('[data-project]')];

  if (!map || !car || !card) return;

  const state = {
    x: map.clientWidth * 0.5,
    y: map.clientHeight * 0.54,
    targetX: null,
    targetY: null,
    angle: -8,
    keys: new Set(),
    activeProject: null
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setCarPosition() {
    car.style.left = `${state.x}px`;
    car.style.top = `${state.y}px`;
    car.style.transform = `translate(-50%, -50%) rotate(${state.angle}deg)`;
  }

  function showProject(projectId) {
    const project = projects[projectId];
    if (!project) return;

    state.activeProject = projectId;
    title.textContent = project.title;
    summary.textContent = project.summary;
    status.textContent = project.status;
    tags.innerHTML = '';
    project.tags.forEach((tagName) => {
      const tag = document.createElement('span');
      tag.className = 'tag notranslate';
      tag.setAttribute('translate', 'no');
      tag.textContent = tagName;
      tags.appendChild(tag);
    });
    link.href = project.link;
    card.classList.remove('is-hidden');

    buildings.forEach((building) => {
      building.classList.toggle('is-active', building.dataset.project === projectId);
    });
  }

  function isTextInputTarget(target) {
    return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select'));
  }

  function openActiveProject() {
    const focusedBuilding = document.activeElement instanceof HTMLElement
      ? document.activeElement.closest('[data-project]')
      : null;
    const projectId = state.activeProject || focusedBuilding?.dataset.project;
    const project = projects[projectId];
    if (!project || !project.link) return;
    window.location.href = project.link;
  }

  function hideIfNoActiveBuilding() {
    if (state.activeProject) return;
    card.classList.add('is-hidden');
  }

  function mapPointFromEvent(event) {
    const rect = map.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return {
      x: clamp(point.clientX - rect.left, 36, rect.width - 36),
      y: clamp(point.clientY - rect.top, 36, rect.height - 36)
    };
  }

  function moveTowardTarget() {
    if (state.targetX === null || state.targetY === null) return false;

    const dx = state.targetX - state.x;
    const dy = state.targetY - state.y;
    const distance = Math.hypot(dx, dy);

    if (distance < 3) {
      state.targetX = null;
      state.targetY = null;
      return false;
    }

    const speed = Math.min(5.5, distance);
    state.angle = Math.atan2(dy, dx) * 180 / Math.PI;
    state.x += (dx / distance) * speed;
    state.y += (dy / distance) * speed;
    return true;
  }

  function moveByKeyboard() {
    let dx = 0;
    let dy = 0;
    if (state.keys.has('arrowleft') || state.keys.has('a')) dx -= 1;
    if (state.keys.has('arrowright') || state.keys.has('d')) dx += 1;
    if (state.keys.has('arrowup') || state.keys.has('w')) dy -= 1;
    if (state.keys.has('arrowdown') || state.keys.has('s')) dy += 1;

    if (!dx && !dy) return false;

    state.targetX = null;
    state.targetY = null;
    const length = Math.hypot(dx, dy) || 1;
    state.angle = Math.atan2(dy, dx) * 180 / Math.PI;
    state.x += (dx / length) * 5;
    state.y += (dy / length) * 5;
    return true;
  }

  function checkProximity() {
    let nearest = null;
    let nearestDistance = Infinity;
    const mapRect = map.getBoundingClientRect();

    buildings.forEach((building) => {
      const rect = building.getBoundingClientRect();
      const centerX = rect.left - mapRect.left + rect.width / 2;
      const centerY = rect.top - mapRect.top + rect.height / 2;
      const distance = Math.hypot(centerX - state.x, centerY - state.y);
      if (distance < nearestDistance) {
        nearest = building.dataset.project;
        nearestDistance = distance;
      }
    });

    if (nearest && nearestDistance < 125) {
      showProject(nearest);
    } else {
      state.activeProject = null;
      buildings.forEach((building) => building.classList.remove('is-active'));
      hideIfNoActiveBuilding();
    }
  }

  function tick() {
    const moved = moveByKeyboard() || moveTowardTarget();
    state.x = clamp(state.x, 34, map.clientWidth - 34);
    state.y = clamp(state.y, 34, map.clientHeight - 34);
    if (moved) checkProximity();
    car.classList.toggle('is-moving', moved);
    setCarPosition();
    requestAnimationFrame(tick);
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'enter' && (state.activeProject || document.activeElement?.closest?.('[data-project]')) && !isTextInputTarget(event.target)) {
      event.preventDefault();
      openActiveProject();
      return;
    }
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) {
      event.preventDefault();
      state.keys.add(key);
    }
  }, true);

  window.addEventListener('keyup', (event) => {
    state.keys.delete(event.key.toLowerCase());
  });

  map.addEventListener('click', (event) => {
    map.focus({ preventScroll: true });
    const building = event.target.closest('[data-project]');
    if (building) {
      showProject(building.dataset.project);
      const mapRect = map.getBoundingClientRect();
      const rect = building.getBoundingClientRect();
      state.targetX = rect.left - mapRect.left + rect.width / 2;
      state.targetY = rect.top - mapRect.top + rect.height / 2 + 70;
      return;
    }

    const point = mapPointFromEvent(event);
    state.targetX = point.x;
    state.targetY = point.y;
  });

  map.addEventListener('touchstart', (event) => {
    map.focus({ preventScroll: true });
    const building = event.target.closest('[data-project]');
    if (building) {
      showProject(building.dataset.project);
      return;
    }
    const point = mapPointFromEvent(event);
    state.targetX = point.x;
    state.targetY = point.y;
  }, { passive: true });

  link.addEventListener('click', (event) => {
    if (link.getAttribute('href') === '#contact') {
      return;
    }
  });

  setCarPosition();
  card.classList.add('is-hidden');
  requestAnimationFrame(tick);
}

function initPageEnhancements() {
  const revealItems = [
    ...document.querySelectorAll('.section, .project-hero, .content-block, .project-card, .work-card, .visual-card, .media-item, .paper-gallery figure')
  ];

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach((item) => {
      item.classList.add('reveal');
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const navSections = navLinks
    .map((linkItem) => ({
      linkItem,
      section: document.querySelector(linkItem.getAttribute('href'))
    }))
    .filter((item) => item.section);

  if (!navSections.length) return;

  function updateActiveNav() {
    const current = navSections.reduce((active, item) => {
      const top = item.section.getBoundingClientRect().top;
      if (top <= 120) return item;
      return active;
    }, navSections[0]);

    navLinks.forEach((linkItem) => {
      linkItem.classList.toggle('is-active', linkItem === current.linkItem);
    });
  }

  updateActiveNav();
  window.addEventListener('scroll', updateActiveNav, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
  initProjectMap();
  initPageEnhancements();
});
