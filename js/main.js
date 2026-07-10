/* ═══════════════════════════════════════════════════════════════
   PHOSFOLD STUDIO — interactions & motion
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const docEl = document.documentElement;

  /* Safety: if GSAP failed to load, un-hide everything and bail. */
  if (!window.gsap) {
    docEl.classList.remove('js');
    const pre = document.getElementById('preloader');
    if (pre) pre.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1025px)').matches;

  /* ────────────────────────────────────────────────────────────
     Split text helper — wraps words in masked spans
     ──────────────────────────────────────────────────────────── */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const inners = [];
    words.forEach((word, i) => {
      const w = document.createElement('span');
      w.className = 'w';
      const wi = document.createElement('span');
      wi.className = 'wi';
      wi.textContent = word;
      w.appendChild(wi);
      el.appendChild(w);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      inners.push(wi);
    });
    el.style.visibility = 'visible';
    return inners;
  }

  /* ────────────────────────────────────────────────────────────
     Reduced motion: show everything, minimal JS, no smooth scroll
     ──────────────────────────────────────────────────────────── */
  if (reduceMotion) {
    const pre = document.getElementById('preloader');
    if (pre) pre.remove();
    document.querySelectorAll('[data-split]').forEach(el => { el.style.visibility = 'visible'; });
    initNav(null);
    initForm();
    initDots();
    return;
  }

  /* ────────────────────────────────────────────────────────────
     Lenis smooth scroll
     ──────────────────────────────────────────────────────────── */
  const lenis = new Lenis({
    duration: 1.15,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ────────────────────────────────────────────────────────────
     Initial states (before preloader plays)
     ──────────────────────────────────────────────────────────── */
  gsap.set('.nav', { autoAlpha: 0, y: -18 });
  gsap.set('.hero-mark', { autoAlpha: 0, scale: .82 });
  gsap.set('.hero-foot', { autoAlpha: 0 });
  gsap.set('.shards .shard', { autoAlpha: 0 });
  gsap.set('.hero-glow', { autoAlpha: 0 });

  document.body.classList.add('lock');
  lenis.stop();

  /* ────────────────────────────────────────────────────────────
     Preloader → hero intro
     ──────────────────────────────────────────────────────────── */
  const pre = document.getElementById('preloader');
  const preTl = gsap.timeline();

  preTl
    .fromTo('.pre-spark-path',
      { scale: 0, rotation: -120, transformOrigin: '50% 50%', opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: .9, ease: 'back.out(1.8)' })
    .to('.pre-spark-path', { scale: .88, yoyo: true, repeat: 1, duration: .4, ease: 'sine.inOut' }, '>-.1')
    .to('.pre-word span', { y: 0, duration: .8, stagger: .05, ease: 'power4.out' }, .35)
    .to('.pre-line-fill', { scaleX: 1, duration: 1.05, ease: 'power2.inOut' }, .45)
    .to('.pre-inner', { autoAlpha: 0, y: -26, duration: .5, ease: 'power2.in' }, '+=.15')
    .to(pre, {
      yPercent: -100, duration: .85, ease: 'power4.inOut',
      onComplete: () => { pre.remove(); document.body.classList.remove('lock'); lenis.start(); }
    }, '<+.18')
    .add(heroIntro, '<+.25');

  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl
      .to('.hero-glow', { autoAlpha: 1, duration: 1.8, ease: 'sine.out' }, 0)
      .to('.hero-mark', { autoAlpha: 1, scale: 1, duration: 1.3 }, .05)
      .to('.hero .line-inner', { y: 0, duration: 1.2, stagger: .13 }, .25)
      .fromTo('.hero-eyebrow', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .9 }, .5)
      .fromTo('.hero-sub', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .9 }, .75)
      .fromTo('.hero-cta', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .9 }, .9)
      .to('.nav', { autoAlpha: 1, y: 0, duration: .9 }, 1.0)
      .to('.shards .shard', { autoAlpha: 1, duration: 1.6, stagger: .09, ease: 'sine.out' }, .7)
      .to('.hero-foot', { autoAlpha: 1, duration: 1, ease: 'sine.out' }, 1.3);
  }

  /* ────────────────────────────────────────────────────────────
     Hero: mouse parallax + scroll parallax + dust canvas
     ──────────────────────────────────────────────────────────── */
  const hero = document.querySelector('.hero');

  if (finePointer) {
    const layers = [...document.querySelectorAll('.shards [data-depth], .hero-mark[data-depth]')].map(el => ({
      el,
      depth: parseFloat(el.dataset.depth) || .5,
      xTo: gsap.quickTo(el, 'x', { duration: .9, ease: 'power3.out' }),
      yTo: gsap.quickTo(el, 'y', { duration: .9, ease: 'power3.out' })
    }));
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - .5;
      const ny = (e.clientY - r.top) / r.height - .5;
      layers.forEach(l => { l.xTo(nx * 46 * l.depth); l.yTo(ny * 30 * l.depth); });
    });
  }

  /* Scroll parallax — hero content drifts up & fades as you leave */
  gsap.to('.hero-inner', {
    yPercent: -14, autoAlpha: .18, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 30%', scrub: .6 }
  });
  gsap.to('.hero-glow', {
    yPercent: 22, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 }
  });

  /* Dust particles */
  (function dust() {
    const canvas = document.getElementById('dust');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w, h, parts = [], visible = true, t = 0;

    function size() {
      w = hero.offsetWidth; h = hero.offsetHeight;
      canvas.width = w * DPR; canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function make() {
      const n = Math.min(90, Math.floor(w * h / 26000));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: .4 + Math.random() * 1.5,
        vy: .06 + Math.random() * .22,
        amp: 8 + Math.random() * 26,
        freq: .002 + Math.random() * .004,
        phase: Math.random() * Math.PI * 2,
        a: .08 + Math.random() * .4,
        gold: Math.random() < .55
      }));
    }
    size(); make();
    window.addEventListener('resize', () => { size(); make(); });

    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(hero);

    (function frame() {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      t++;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy;
        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        const x = p.x + Math.sin(t * p.freq * 60 + p.phase) * p.amp * .05;
        const tw = .75 + Math.sin(t * .02 + p.phase * 3) * .25;
        ctx.globalAlpha = p.a * tw;
        ctx.fillStyle = p.gold ? '#f4b51d' : '#fff2d1';
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    })();
  })();

  /* ────────────────────────────────────────────────────────────
     Scroll reveals
     ──────────────────────────────────────────────────────────── */
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.closest('.hero')) return; // hero handled by intro
    gsap.fromTo(el,
      { autoAlpha: 0, y: 26 },
      {
        autoAlpha: 1, y: 0, duration: 1.05, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
  });

  /* Section rules grow in */
  document.querySelectorAll('.section-rule').forEach(el => {
    gsap.fromTo(el, { scaleX: 0, transformOrigin: 'left center' },
      {
        scaleX: 1, duration: 1.3, ease: 'power3.inOut',
        scrollTrigger: { trigger: el.closest('.section-head'), start: 'top 88%', once: true }
      });
  });

  /* Split-word headings */
  document.querySelectorAll('[data-split]').forEach(el => {
    const words = splitWords(el);
    if (el.classList.contains('manifesto-big')) {
      /* reading-light effect: words illuminate as you scroll */
      gsap.fromTo(words, { opacity: .13 }, {
        opacity: 1, stagger: .06, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 32%', scrub: .5 }
      });
    } else {
      gsap.fromTo(words, { yPercent: 118 }, {
        yPercent: 0, duration: 1.05, stagger: .055, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true }
      });
    }
  });

  /* Game art parallax drift inside frame */
  document.querySelectorAll('[data-art]').forEach(art => {
    const inner = art.querySelector('.game-art-inner');
    gsap.fromTo(inner, { yPercent: -6.5 }, {
      yPercent: 6.5, ease: 'none',
      scrollTrigger: { trigger: art, start: 'top bottom', end: 'bottom top', scrub: .55 }
    });
  });

  /* Game info column subtle counter-drift (desktop) */
  if (window.innerWidth > 900) {
    document.querySelectorAll('.game-info').forEach(info => {
      gsap.fromTo(info, { y: 44 }, {
        y: -44, ease: 'none',
        scrollTrigger: { trigger: info.closest('.game'), start: 'top bottom', end: 'bottom top', scrub: .8 }
      });
    });
  }

  /* Footer watermark drift */
  gsap.fromTo('.footer-watermark', { yPercent: 46 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: .6 }
  });

  /* Marquee speed reacts slightly to scroll velocity */
  const track = document.querySelector('.marquee-track');
  if (track) {
    let speed = 1;
    lenis.on('scroll', e => {
      speed = gsap.utils.clamp(.4, 3, 1 + Math.abs(e.velocity) * .04);
      track.style.animationDuration = (46 / speed) + 's';
    });
  }

  /* ────────────────────────────────────────────────────────────
     Nav, dots, cursor, magnetic, form
     ──────────────────────────────────────────────────────────── */
  initNav(lenis);
  initDots();
  initForm();

  if (finePointer) {
    initCursor();
    initMagnetic();
  }

  /* Refresh triggers once fonts are in (metrics change) */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ═══════════════ helpers ═══════════════ */

  function initNav(lenisRef) {
    const nav = document.getElementById('nav');
    const burger = document.getElementById('navBurger');
    const menu = document.getElementById('mobileMenu');

    const onScroll = () => nav.classList.toggle('scrolled', (window.scrollY || 0) > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let menuOpen = false;
    function setMenu(open) {
      menuOpen = open;
      burger.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      if (lenisRef) open ? lenisRef.stop() : lenisRef.start();
      document.body.classList.toggle('lock', open);
    }
    burger.addEventListener('click', () => setMenu(!menuOpen));

    /* Smooth anchor scrolling */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (menuOpen) setMenu(false);
        if (lenisRef) lenisRef.scrollTo(target, { offset: 0, duration: 1.4 });
        else target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function initDots() {
    const dots = [...document.querySelectorAll('.dots .dot')];
    if (!dots.length) return;
    const sections = ['#top', '#manifesto', '#games', '#studio', '#contact'];
    sections.forEach((sel, i) => {
      const el = document.querySelector(sel);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: self => { if (self.isActive) { dots.forEach(d => d.classList.remove('active')); dots[i].classList.add('active'); } }
      });
    });
  }

  function initCursor() {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;
    let mx = -100, my = -100, rx = -100, ry = -100;

    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    window.addEventListener('mousedown', () => dot.classList.add('is-down'));
    window.addEventListener('mouseup', () => dot.classList.remove('is-down'));

    document.addEventListener('mouseover', e => {
      if (e.target.closest('a, button, input, [data-cursor="hover"]')) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest('a, button, input, [data-cursor="hover"]')) ring.classList.remove('is-hover');
    });

    gsap.ticker.add(() => {
      rx += (mx - rx) * .16;
      ry += (my - ry) * .16;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
    });
  }

  function initMagnetic() {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * .32);
        yTo((e.clientY - (r.top + r.height / 2)) * .32);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  function initForm() {
    const form = document.getElementById('signalForm');
    const note = document.getElementById('signalNote');
    const input = document.getElementById('signalEmail');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        note.textContent = 'That address flickered out — try again?';
        note.style.color = 'rgba(255,242,209,.55)';
        return;
      }
      note.textContent = '✦ Signal received. We’ll find you when the light moves.';
      note.style.color = '';
      input.value = '';
      input.blur();
    });
  }

})();
