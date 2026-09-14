/* =========================================================
   Ondřej Hladík — Portfolio
   Interactions: title reveal, intro loader, mail beetle,
   reveal, nav, menu, progress, magnetic, project + team modals
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body = document.body;

  /* ---------------------------------------------------------
     TITLE REVEAL — mask slide-up per word (program.studio style)
  --------------------------------------------------------- */
  let revealHeroTitles = function () {};

  function splitTitle(el) {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    const words = text.split(' ');
    words.forEach((w, i) => {
      const mask = document.createElement('span'); mask.className = 'wmask';
      const inner = document.createElement('span'); inner.className = 'win'; inner.textContent = w;
      inner.style.transitionDelay = (i * 0.05) + 's';
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  function initTitleReveal() {
    const titles = [...document.querySelectorAll('[data-title]')];
    if (!titles.length || prefersReduced) return; // reduced motion → plain text stays
    titles.forEach(splitTitle);
    const hero = titles.filter((t) => t.classList.contains('ht-line'));
    const rest = titles.filter((t) => !t.classList.contains('ht-line'));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-revealed'); io.unobserve(e.target); } });
      }, { threshold: 0.25 });
      rest.forEach((t) => io.observe(t));
    } else {
      rest.forEach((t) => t.classList.add('is-revealed'));
    }
    revealHeroTitles = function () {
      hero.forEach((t, i) => setTimeout(() => t.classList.add('is-revealed'), i * 110));
    };
  }

  /* ---------------------------------------------------------
     INTRO
  --------------------------------------------------------- */
  // "oh" morph loader — glyphs deform from a spread-out start into the logo
  function playOhLoader(svg, duration) {
    if (!svg) return null;
    const NS = 'http://www.w3.org/2000/svg';
    const SIZE_O = 335.79, Y_START = 284.23;
    const O_END = { ty: 408.77, sx: 2.11 };
    const H_END = { tx: 14.72, ty: 333.35 };
    const kH = SIZE_O / 393.82;                        // shrink "h" to start size
    const EASE = 'cubic-bezier(.76,0,.24,1)';          // calm, viscous morph
    const mark = svg.querySelector('.mark');
    const o = svg.querySelector('.gl-o');
    const h = svg.querySelector('.gl-h');
    if (!o || !h) return null;

    // measure real width of "o" so "h" starts flush next to it
    let Wox = 190;
    try {
      const probe = document.createElementNS(NS, 'text');
      probe.setAttribute('font-size', SIZE_O);
      probe.setAttribute('x', '-99999'); probe.setAttribute('y', '0');
      probe.textContent = 'o'; mark.appendChild(probe);
      const w = probe.getComputedTextLength(); probe.remove();
      if (w && isFinite(w)) Wox = w;
    } catch (_) {}

    const startO = 'translate(0px,' + Y_START + 'px) scale(1,1)';
    const endO = 'translate(0px,' + O_END.ty + 'px) scale(' + O_END.sx + ',1)';
    const startH = 'translate(' + Wox + 'px,' + Y_START + 'px) scale(' + kH + ',' + kH + ')';
    const endH = 'translate(' + H_END.tx + 'px,' + H_END.ty + 'px) scale(1,1)';

    svg.style.opacity = '1';
    o.style.transform = startO; h.style.transform = startH;

    if (typeof o.animate !== 'function') { o.style.transform = endO; h.style.transform = endH; return null; }
    const timing = { duration: duration || 1300, easing: EASE, fill: 'forwards' };
    o.animate([{ transform: startO }, { transform: endO }], timing);
    return h.animate([{ transform: startH }, { transform: endH }], timing);
  }

  function runIntro() {
    const intro = document.querySelector('.intro');
    if (!intro || prefersReduced) { if (intro) intro.style.display = 'none'; revealHeroTitles(); return; }
    const anim = playOhLoader(intro.querySelector('.oh-loader'), 1300);
    const finish = () => setTimeout(() => {
      intro.classList.add('is-done');
      revealHeroTitles();
      intro.addEventListener('transitionend', () => intro.remove(), { once: true });
    }, 450);
    if (anim && anim.finished && typeof anim.finished.then === 'function') anim.finished.then(finish).catch(finish);
    else setTimeout(finish, 1350);
  }

  /* ---------------------------------------------------------
     BEETLE — follows the cursor over any [data-bug] target (e-mail,
     project names), head always aimed at the target; the number picks the art
  --------------------------------------------------------- */
  function initMailbug() {
    if (!fine) return;
    const bug = document.querySelector('[data-mailbug]');
    const targets = document.querySelectorAll('[data-bug]');
    if (!bug || !targets.length) return;
    // which artwork belongs to which data-bug number; 1 = e-mail, 2/3 alternate over the project list
    const ART = { 1: 'img/beetle-1.svg', 2: 'img/beetle-2.png', 3: 'img/beetle-3.png' };
    const OFF = 56; // sit a bit below the cursor so the head aims up at the target (same for e-mail and project names)
    let mx = innerWidth / 2, my = innerHeight / 2, bx = mx, by = my, on = false, target = null;
    const used = new Set([...targets].map((t) => t.dataset.bug));
    // fetch only the beetles this page actually uses, and only once the page is idle
    setTimeout(() => used.forEach((k) => { if (ART[k]) { const im = new Image(); im.src = ART[k]; } }), 1500);
    targets.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        const kind = el.dataset.bug;
        if (bug.dataset.kind !== kind && ART[kind]) { bug.src = ART[kind]; bug.dataset.kind = kind; }
        target = el; on = true; bx = mx; by = my + OFF; bug.classList.add('is-on');
      });
      el.addEventListener('mouseleave', () => { on = false; target = null; bug.classList.remove('is-on'); });
    });
    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      if (on && target) {
        bx += (mx - bx) * 0.2; by += ((my + OFF) - by) * 0.2;
        const r = target.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        // beetle art points "up" by default → offset by +90°
        const ang = Math.atan2(cy - by, cx - bx) * 180 / Math.PI + 90;
        bug.style.left = bx + 'px';
        bug.style.top = by + 'px';
        bug.style.transform = 'translate(-50%, -50%) rotate(' + ang + 'deg)';
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------------------------------------------------
     REVEAL
  --------------------------------------------------------- */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (prefersReduced || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
     NAV
  --------------------------------------------------------- */
  function initNav() {
    const nav = document.querySelector('[data-nav]');
    let lastY = 0;
    function onScroll() {
      const y = scrollY;
      nav.classList.toggle('is-stuck', y > 40);
      if (y > 640 && y > lastY && !body.classList.contains('menu-open')) nav.classList.add('is-hidden');
      else nav.classList.remove('is-hidden');
      lastY = y;
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    const links = document.querySelectorAll('.nav__links a');
    const sections = [...links].map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = '#' + e.target.id;
            links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
          }
        });
      }, { threshold: 0.3, rootMargin: '-30% 0px -55% 0px' });
      sections.forEach((s) => io.observe(s));
    }
  }

  /* ---------------------------------------------------------
     MENU
  --------------------------------------------------------- */
  function initMenu() {
    const burger = document.querySelector('[data-burger]');
    const menu = document.querySelector('[data-menu]');
    if (!burger || !menu) return;
    function close() { body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); }
    burger.addEventListener('click', () => {
      const open = body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ---------------------------------------------------------
     PROGRESS + MAGNETIC + MISC
  --------------------------------------------------------- */
  function initProgress() {
    const bar = document.querySelector('[data-progress]'); if (!bar) return;
    function update() { const h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%'; }
    addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
  }

  function initMagnetic() {
    if (!fine || prefersReduced) return;
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const s = 0.3;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${((e.clientX - (r.left + r.width / 2)) * s).toFixed(1)}px ${((e.clientY - (r.top + r.height / 2)) * s).toFixed(1)}px`;
      });
      el.addEventListener('mouseleave', () => { el.style.translate = ''; });
    });
  }

  function initMisc() {
    const yr = new Date().getFullYear();
    document.querySelectorAll('[data-year]').forEach((y) => { y.textContent = yr; });
  }

  /* ---------------------------------------------------------
     PROJECT DETAIL — full-screen overlay opened from a card
     Title + category are read from the clicked card; the copy
     and gallery come from PROJECTS[slug]. Swap the gradient
     "shots" for real images: { img: 'img/xy.webp', wide: true }.
  --------------------------------------------------------- */
  const PROJECTS = {
    'skola': {
      web: 'https://newhow.archi/cs/projekty/novy-pavilon-zs-kostelec-u-krizku-kostelec-u-krizku-2020/',
      webLabel: 'newhow.archi/cs',   // shown instead of the full URL
      desc: [
        'The primary school in Kostelec u Křížků is getting a new pavilion — a dining hall and a gym designed by NEW HOW architekti, tucked behind the old school with a roofline of three gables stepping down into the garden. The architects planned a plain white facade; my job was to give it a story.',
        'I drew the village’s history as a set of line pictograms: Benedictine monks visiting Kalifáč, the laying of the foundation stone of St Martin’s rotunda and the rotunda itself, Josef Ringhoffer’s first copper hammer mill on the Kamenice brook, and horses that traded farm work for sport. One violet, one continuous outline per scene, with a few solid accents — so the whole wall reads as a single drawing wrapping around the windows.',
        'The rearing horse became the mark of the set: a solid version that stands on its own, in the same violet and the acid yellow-green of the presentation.'
      ],
      credits: [
        'Illustrations by Ondřej Hladík',
        'Architecture & visualisation by NEW HOW architekti'
      ],
      shots: [
        { img: 'img/skola/skola-elevation.webp', wide: true },
        { img: 'img/skola/skola-horse.webp' },
        { img: 'img/skola/skola-render-1200.webp' },
        { img: 'img/skola/skola-sheet.webp', wide: true }
      ]
    },
    'masaze': {
      web: 'https://masazekostelec.cz/',
      desc: [
        'Massage Kostelec is a small massage studio run by Jana Hladíková — a mobile masseuse who brings reconditioning and relaxation massage to wherever you feel most at ease. The brief was to give that calm, personal service a visual identity of its own.',
        'The identity grows from one quiet mark — a sun rising over a soft wave — that carries the studio\'s promise: awakening body and mind through touch. Around it sits a warm, earthy palette of cream, terracotta and olive, with a gentle lowercase wordmark that never raises its voice.',
        'I carried that mood across the whole system — business cards, gift vouchers and print — and shot the photography to match: low, honest light, a single orchid, and the stillness of the treatment room. Every piece is meant to feel the way a good massage does: unhurried, warm and calm.'
      ],
      credits: [
        'Branding by Ondřej Hladík',
        'Photos by Ondřej Hladík',
        'Motion video by René Nožička'
      ],
      shots: [
        { img: 'img/masaze/photo-1.webp', wide: true },
        { img: 'img/masaze/brand-1.webp' },
        { img: 'img/masaze/magazine.webp' },
        { img: 'img/masaze/massage-hands.webp', wide: true },
        { video: 'img/masaze/masaze.mp4' },
        { img: 'img/masaze/photo-2.webp' },
        { img: 'img/masaze/logo-mockup.webp', wide: true }
      ]
    },
    'molo-lipno': {
      desc: [
        'Molo Lipno is a resort on the shore of Lipno lake, where every apartment is built around the same warm palette — oak, bouclé and low, honest light. The brief was simple: photograph the interiors so they feel the way the rooms actually feel when you walk in.',
        'I shot everything in available light, waiting for the sun to come through the sheer curtains rather than fighting it with flash. Straight-on frames hold the architecture — the kitchen line, the slatted oak wall behind the bed — while tighter shots pick up the details that give the place its character.',
        'The set closes on two frames that step away from the room itself: a wall light read as pure geometry, and one long exposure where the interior dissolves into colour and movement.'
      ],
      credits: [
        'Photos by Ondřej Hladík'
      ],
      shots: [
        { img: 'img/molo-lipno/molo-1.webp', wide: true },
        { img: 'img/molo-lipno/molo-2.webp' },
        { img: 'img/molo-lipno/molo-5.webp' },
        { img: 'img/molo-lipno/molo-4.webp', wide: true },
        { img: 'img/molo-lipno/molo-3.webp', wide: true }
      ]
    },
    'live-district': {
      web: 'https://livedistrict.cz/',
      desc: [
        'Live District is a booking and management agency for the current Czech rap scene. The website had one job: make a roster of street artists feel as sharp and professional as the music business they are stepping into — without losing any of the edge.',
        'I designed and built the whole thing front to back. A full-bleed hero video sets the tone, a bold Helvetica-driven type system carries the artists\' names, and every act gets its own page — bio, links and video — held together by one consistent black-and-white identity.',
        'Beyond the look, it is a real working site: a live event calendar, the full artist roster, a booking inquiry form, and image loading that adapts to the visitor\'s connection speed. Design and code, shipped as one.'
      ],
      credits: [
        'Website by Ondřej Hladík',
        'Logo by Tadeáš Vávra'
      ],
      shots: [
        { img: 'img/live-district/ld-mockup.webp', wide: true },
        { img: 'img/live-district/ld-roster.webp' },
        { img: 'img/live-district/ld-logo-tile.svg' },
        { video: 'img/live-district/ld-recording.mp4', wide: true },
        { img: 'img/live-district/ld-dorian-page.webp', wide: true }
      ]
    },
    'font-design': {
      desc: [
        'A display typeface of my own, drawn from the ground up — uppercase alphabet, numerals and the punctuation needed to set a headline. Antikva bones with the contrast pushed until the serifs read as blunt slabs rather than fine hairlines.',
        'The specimen poster tests it the way the face is meant to be used: one letterform blown up until it stops being a letter and turns into a shape, with the full character set set small inside it. Printed large and mounted in a park — the honest way to find out whether a display face holds together at distance.'
      ],
      shots: [
        { img: 'img/font-design/poster-mockup.webp', wide: true }
      ]
    }
  };

  function initProjectModal() {
    const modal = document.querySelector('[data-pmodal]');
    if (!modal) return;
    const titleEl = modal.querySelector('[data-pm-title]');
    const introEl = modal.querySelector('[data-pm-intro]');
    const galleryEl = modal.querySelector('[data-pm-gallery]');
    const creditsEl = modal.querySelector('[data-pm-credits]');
    const scrollEl = modal.querySelector('[data-pmodal-scroll]');
    const closers = modal.querySelectorAll('[data-pmodal-close]');
    const links = document.querySelectorAll('a[data-project]');
    if (!links.length) return;
    let lastFocused = null;

    function fill(slug, card) {
      const titleNode = card.querySelector('.pcard__title') || card;
      const data = PROJECTS[slug] || {};
      titleEl.textContent = titleNode.textContent.trim() || 'Project';

      introEl.innerHTML = '';
      const desc = data.desc || ['A closer look at this project is coming soon.'];
      desc.forEach((text) => {
        const p = document.createElement('p');
        p.textContent = text;
        introEl.appendChild(p);
      });

      galleryEl.innerHTML = '';
      const shots = data.shots || [{ art: 'art--1', wide: true }, { art: 'art--3' }, { art: 'art--6' }];
      shots.forEach((shot) => {
        const fig = document.createElement('div');
        const media = shot.img || shot.video;
        fig.className = 'pmodal__shot' + (media ? ' has-media' : (shot.art ? ' ' + shot.art : '')) + (shot.wide ? ' is-wide' : '');
        if (shot.video) {
          const v = document.createElement('video');
          v.src = shot.video; v.autoplay = true; v.loop = true; v.muted = true; v.preload = 'metadata';
          v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.playsInline = true;
          fig.appendChild(v);
        } else if (shot.img) {
          const im = document.createElement('img');
          im.src = shot.img; im.alt = titleEl.textContent + ' — ' + (galleryEl.children.length + 1); im.loading = 'lazy'; im.decoding = 'async';
          fig.appendChild(im);
        }
        galleryEl.appendChild(fig);
      });

      creditsEl.innerHTML = '';
      if (data.credits && data.credits.length) {
        const details = document.createElement('details');
        details.className = 'credits';
        const summary = document.createElement('summary');
        summary.textContent = 'Show credits';
        details.appendChild(summary);
        const ul = document.createElement('ul');
        ul.className = 'credits__list';
        data.credits.forEach((line) => {
          const li = document.createElement('li');
          li.textContent = line;
          ul.appendChild(li);
        });
        details.appendChild(ul);
        creditsEl.appendChild(details);
      }

      if (data.web) {
        const link = document.createElement('a');
        link.className = 'pmodal__web';
        link.href = data.web;
        link.target = '_blank';
        link.rel = 'noopener';
        link.setAttribute('data-cursor', 'hover');
        link.textContent = 'web: ' + (data.webLabel || data.web.replace(/^https?:\/\//, '').replace(/\/$/, ''));
        creditsEl.appendChild(link);
      }
    }

    function open(slug, card) {
      lastFocused = document.activeElement;
      fill(slug, card);
      body.classList.add('pmodal-open');
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      if (scrollEl) scrollEl.scrollTop = 0;
      const first = modal.querySelector('[data-pmodal-close]');
      if (first) first.focus();
    }

    function close() {
      if (!modal.classList.contains('is-open')) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      body.classList.remove('pmodal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    links.forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const card = a.closest('.pcard') || a;
        const bug = document.querySelector('[data-mailbug]'); if (bug) bug.classList.remove('is-on');
        open(a.getAttribute('data-project') || '', card);
      });
    });
    closers.forEach((b) => b.addEventListener('click', close));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ---------------------------------------------------------
     TEAM — same overlay treatment as a project, opened from
     the menu link instead of a card.
  --------------------------------------------------------- */
  function initTeamModal() {
    const modal = document.querySelector('[data-tmodal]');
    if (!modal) return;
    const openers = document.querySelectorAll('a[href="#team"]');
    if (!openers.length) return;
    const closers = modal.querySelectorAll('[data-tmodal-close]');
    const scrollEl = modal.querySelector('[data-tmodal-scroll]');
    let lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      modal.querySelectorAll('img[data-src]').forEach((im) => { im.src = im.dataset.src; im.removeAttribute('data-src'); });
      body.classList.add('pmodal-open');
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      if (scrollEl) scrollEl.scrollTop = 0;
      const first = modal.querySelector('[data-tmodal-close]');
      if (first) first.focus();
    }

    function close() {
      if (!modal.classList.contains('is-open')) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      body.classList.remove('pmodal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    openers.forEach((a) => {
      a.addEventListener('click', (e) => { e.preventDefault(); open(); });
    });
    closers.forEach((b) => b.addEventListener('click', close));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ---------------------------------------------------------
     BOOT
  --------------------------------------------------------- */
  function boot() {
    initTitleReveal(); runIntro(); initMailbug(); initReveal(); initNav(); initMenu();
    initProgress(); initMagnetic(); initMisc(); initProjectModal(); initTeamModal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
