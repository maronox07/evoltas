const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const progress = document.getElementById('scroll-progress');
const header = document.querySelector('.site-header');
const preloader = document.getElementById('preloader');
const preloaderStatus = document.querySelector('.preloader-status');
const preloaderLogo = preloader ? preloader.querySelector('.preloader-logo') : null;
const preloaderMessages = [
  'Initializing systems',
  'Syncing interface',
  'Calibrating signal',
  'Activating flow',
];
let preloadInterval;

const handleScroll = () => {
  const scrolled = window.scrollY;
  const height = document.body.scrollHeight - window.innerHeight;
  const ratio = height > 0 ? scrolled / height : 0;
  if (progress) {
    progress.style.transform = `scaleX(${ratio})`;
  }
  if (header) {
    header.classList.toggle('scrolled', scrolled > 20);
  }
};

if (progress || header) {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

const updateHeaderOffset = () => {
  if (!header) return;
  const height = header.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--header-offset', `${height}px`);
};

updateHeaderOffset();
window.addEventListener('resize', updateHeaderOffset);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(updateHeaderOffset);
}

const finishLoading = () => {
  document.body.classList.add('is-loaded');
  if (preloader) {
    preloader.classList.add('is-hidden');
  }
  if (preloadInterval) {
    window.clearInterval(preloadInterval);
    preloadInterval = null;
  }
};

const startPreloader = () => {
  updateHeaderOffset();
  if (preloaderStatus) {
    let index = 0;
    preloadInterval = window.setInterval(() => {
      index = (index + 1) % preloaderMessages.length;
      preloaderStatus.textContent = preloaderMessages[index];
    }, 900);
  }

  const minDelay = 2400;
  const maxDelay = 4200;
  const start = performance.now();
  let finished = false;

  const done = () => {
    if (finished) return;
    finished = true;
    const elapsed = performance.now() - start;
    const remaining = Math.max(minDelay - elapsed, 0);
    window.setTimeout(finishLoading, remaining);
  };

  window.setTimeout(done, maxDelay);

  if (preloaderLogo && preloaderLogo.decode) {
    preloaderLogo.decode().then(done).catch(done);
  } else {
    done();
  }

  preloader.addEventListener('click', finishLoading, { once: true });
};

if (preloader) {
  if (reduceMotion) {
    finishLoading();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPreloader, { once: true });
  } else {
    startPreloader();
  }
} else {
  document.body.classList.add('is-loaded');
}

const navToggle = document.querySelector('.nav-toggle');
const navDrawer = document.getElementById('nav-drawer');
const navBackdrop = document.querySelector('.nav-backdrop');
const navCloseTargets = document.querySelectorAll('[data-nav-close]');

const setNavState = open => {
  document.body.classList.toggle('nav-open', open);
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (navDrawer) {
    navDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
};

if (navToggle && navDrawer) {
  navToggle.addEventListener('click', () => {
    const isOpen = document.body.classList.contains('nav-open');
    setNavState(!isOpen);
  });

  navCloseTargets.forEach(target => {
    target.addEventListener('click', () => setNavState(false));
  });

  navDrawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setNavState(false));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
      setNavState(false);
    }
  });

  window.addEventListener('resize', () => {
    updateHeaderOffset();
    if (window.innerWidth > 980) {
      setNavState(false);
    }
  });
}

const supportsObserver = 'IntersectionObserver' in window;
const revealElements = document.querySelectorAll('[data-reveal]');
const counterElements = document.querySelectorAll('[data-count]');

if (supportsObserver) {
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealElements.forEach(el => revealObserver.observe(el));

  const counterObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  counterElements.forEach(el => counterObserver.observe(el));
} else {
  revealElements.forEach(el => el.classList.add('is-visible'));
  counterElements.forEach(el => animateCount(el));
}

function animateCount(element) {
  const target = parseFloat(element.dataset.count);
  const prefix = element.dataset.prefix || '';
  const suffix = element.dataset.suffix || '';
  const isDecimal = String(target).includes('.');
  const duration = 1200;
  const start = performance.now();

  function update(now) {
    const progressValue = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progressValue, 3);
    const value = target * eased;
    const formatted = isDecimal ? value.toFixed(1) : Math.round(value).toString();
    element.textContent = `${prefix}${formatted}${suffix}`;
    if (progressValue < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

const roleButtons = document.querySelectorAll('.toggle-btn');
const rolePanels = document.querySelectorAll('[data-role-panel]');

roleButtons.forEach(button => {
  button.addEventListener('click', () => {
    const role = button.dataset.role;
    roleButtons.forEach(btn => {
      btn.classList.toggle('active', btn === button);
      btn.setAttribute('aria-pressed', btn === button ? 'true' : 'false');
    });
    rolePanels.forEach(panel => {
      panel.classList.toggle('active', panel.dataset.rolePanel === role);
    });
  });
});

const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('main section[id]');
const navMap = new Map();
navLinks.forEach(link => {
  const target = link.getAttribute('href');
  if (target && target.startsWith('#')) {
    navMap.set(target.slice(1), link);
  }
});

if (navLinks.length && sections.length && supportsObserver) {
  const sectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const link = navMap.get(entry.target.id);
        if (!link) return;
        navLinks.forEach(item => item.classList.remove('active'));
        link.classList.add('active');
      });
    },
    { rootMargin: '-35% 0px -55% 0px' }
  );

  sections.forEach(section => sectionObserver.observe(section));
} else if (navLinks.length) {
  navLinks[0].classList.add('active');
}

if (!reduceMotion) {
  const magnets = document.querySelectorAll('.magnetic');
  magnets.forEach(magnet => {
    magnet.addEventListener('mousemove', event => {
      const rect = magnet.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      magnet.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });
    magnet.addEventListener('mouseleave', () => {
      magnet.style.transform = 'translate(0, 0)';
    });
  });

  const spotlightCards = document.querySelectorAll('.spotlight-card');
  spotlightCards.forEach(card => {
    card.addEventListener('mousemove', event => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
    });
  });

  const tiltTargets = document.querySelectorAll('[data-tilt]');
  tiltTargets.forEach(target => {
    target.addEventListener('mousemove', event => {
      const rect = target.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      target.style.transform = `rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
    });
    target.addEventListener('mouseleave', () => {
      target.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  });

  const floatCards = document.querySelectorAll('[data-depth]');
  window.addEventListener('mousemove', event => {
    const x = (event.clientX / window.innerWidth - 0.5) * 26;
    const y = (event.clientY / window.innerHeight - 0.5) * 26;
    floatCards.forEach(card => {
      const depth = parseFloat(card.dataset.depth);
      card.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
    });
  });
}

const canvas = document.getElementById('constellation');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let animationFrame;
let canvasWidth = 0;
let canvasHeight = 0;

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const ratio = window.devicePixelRatio || 1;
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth * ratio;
  canvas.height = canvasHeight * ratio;
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  initParticles();
}

function initParticles() {
  const count = Math.min(120, Math.floor(canvasWidth / 12));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    vx: (Math.random() - 0.5) * 0.55,
    vy: (Math.random() - 0.5) * 0.55,
  }));
}

function drawParticles() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = 'rgba(244, 251, 255, 0.45)';
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x <= 0 || p.x >= canvasWidth) p.vx *= -1;
    if (p.y <= 0 || p.y >= canvasHeight) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140) {
        ctx.strokeStyle = `rgba(43, 228, 255, ${0.16 - dist / 1200})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  animationFrame = requestAnimationFrame(drawParticles);
}

if (!reduceMotion && canvas && ctx) {
  resizeCanvas();
  drawParticles();
} else if (canvas) {
  canvas.style.display = 'none';
}

window.addEventListener('resize', () => {
  if (!reduceMotion && canvas && ctx) {
    cancelAnimationFrame(animationFrame);
    resizeCanvas();
    drawParticles();
  }
});
