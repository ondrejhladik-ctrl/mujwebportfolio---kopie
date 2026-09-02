/* =========================================================
   Ondřej Hladík — Portfolio (dark editorial edition)
   Interactions: intro, scramble text, cursor, preview,
   filters, clock, reveal, nav, menu, marquee, counters
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body = document.body;
  const SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/()<>*+=';

  /* ---------------------------------------------------------
     SCRAMBLE TEXT
  --------------------------------------------------------- */
  function scramble(el, duration) {
    duration = duration || 720;
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    const len = final.length;
    const start = performance.now();
    (function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const revealed = Math.floor(p * len);
      let out = '';
      for (let i = 0; i < len; i++) {
        const ch = final[i];
        if (ch === ' ' || ch === ' ' || ch === ',' || ch === '.') { out += ch; continue; }
        out += (i < revealed) ? ch : SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = final;
    })(start);
  }

  function initScramble() {
    const els = document.querySelectorAll('[data-scramble]:not(.ht-line)');
    if (prefersReduced || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { scramble(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
  }

  function scrambleHero() {
    if (prefersReduced) return;
    document.querySelectorAll('.hero__title .ht-line[data-scramble]').forEach((el, i) => {
      setTimeout(() => scramble(el, 680), i * 140);
    });
  }

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
     CURSOR
  --------------------------------------------------------- */
  function initCursor() {
    if (!fine) return;
    const cursor = document.querySelector('.cursor');
    const dot = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      if (!body.classList.contains('cursor-ready')) body.classList.add('cursor-ready');
    });
    (function render() {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(render);
    })();
    const map = { hover: 'cursor-hover', view: 'cursor-view' };
    document.querySelectorAll('[data-cursor]').forEach((el) => {
      const cls = map[el.getAttribute('data-cursor')] || 'cursor-hover';
      el.addEventListener('mouseenter', () => body.classList.add(cls));
      el.addEventListener('mouseleave', () => body.classList.remove(cls));
    });
    document.addEventListener('mouseleave', () => body.classList.remove('cursor-ready'));
    document.addEventListener('mouseenter', () => body.classList.add('cursor-ready'));
  }

  /* ---------------------------------------------------------
     PROJECT PREVIEW (follows cursor over work rows)
  --------------------------------------------------------- */
  function initPreview() {
    if (!fine) return;
    const preview = document.querySelector('[data-preview]');
    const img = preview && preview.querySelector('.preview__img');
    const rows = document.querySelectorAll('.work-row');
    if (!preview || !img || !rows.length) return;
    let tx = innerWidth / 2, ty = innerHeight / 2, px = tx, py = ty;
    rows.forEach((row) => {
      row.addEventListener('mouseenter', () => {
        const n = parseInt((row.dataset.art || '1').replace(/\D/g, ''), 10) || 1;
        const b = ((n - 1) % 3) + 1;                 // cycle beetle-1 / -2 / -3
        img.src = 'img/beetle-' + b + '.svg';
        preview.classList.add('is-on');
      });
      row.addEventListener('mouseleave', () => preview.classList.remove('is-on'));
    });
    addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      px += (tx - px) * 0.16; py += (ty - py) * 0.16;
      preview.style.left = px + 'px'; preview.style.top = py + 'px';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------------------------------------------------
     MAIL BEETLE — follows cursor, head always aimed at the e-mail
  --------------------------------------------------------- */
  function initMailbug() {
    if (!fine) return;
    const bug = document.querySelector('[data-mailbug]');
    const mail = document.querySelector('.contact__mail');
    if (!bug || !mail) return;
    const OFF = 56; // sit a bit below the cursor so the head aims up at the mail
    let mx = innerWidth / 2, my = innerHeight / 2, bx = mx, by = my, on = false;
    mail.addEventListener('mouseenter', () => { on = true; bx = mx; by = my + OFF; bug.classList.add('is-on'); });
    mail.addEventListener('mouseleave', () => { on = false; bug.classList.remove('is-on'); });
    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
    (function loop() {
      if (on) {
        bx += (mx - bx) * 0.2; by += ((my + OFF) - by) * 0.2;
        const r = mail.getBoundingClientRect();
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
     SHOWCASE — horizontal drag slider (Auge-style)
  --------------------------------------------------------- */
  function initSlider() {
    const section = document.querySelector('[data-slider]');
    if (!section) return;
    const viewport = section.querySelector('[data-viewport]');
    const track = section.querySelector('[data-track]');
    const slides = [...section.querySelectorAll('.slide')];
    const nameEl = section.querySelector('[data-slide-name]');
    const barsWrap = section.querySelector('[data-bars]');
    if (!viewport || !track || !slides.length) return;

    const EASE = '.7s cubic-bezier(0.16,1,0.3,1)';
    let index = 0, offset = 0, vpW = 0;
    const centers = [];

    function measure() {
      vpW = viewport.clientWidth;
      centers.length = 0;
      slides.forEach((s) => centers.push(s.offsetLeft + s.offsetWidth / 2));
    }
    function clampOffset(o) {
      if (!centers.length) return o;
      return Math.max(centers[0] - vpW / 2, Math.min(centers[centers.length - 1] - vpW / 2, o));
    }
    function draw(anim) {
      track.style.transition = anim ? 'transform ' + EASE : 'none';
      track.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';
    }
    function setActive(i) {
      index = i;
      if (nameEl) nameEl.textContent = slides[i].dataset.name || '';
      if (barsWrap) [...barsWrap.children].forEach((b, bi) => b.classList.toggle('is-active', bi === i));
      slides.forEach((s, si) => s.classList.toggle('is-current', si === i));
    }
    function goTo(i, anim) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      offset = clampOffset(centers[i] - vpW / 2);
      draw(anim !== false);
      setActive(i);
    }
    function nearest() {
      const c = offset + vpW / 2;
      let best = 0, bd = Infinity;
      centers.forEach((ce, i) => { const d = Math.abs(ce - c); if (d < bd) { bd = d; best = i; } });
      return best;
    }

    // pagination bars
    if (barsWrap) {
      slides.forEach((s, i) => {
        const b = document.createElement('button');
        b.className = 'bar'; b.type = 'button';
        b.setAttribute('aria-label', 'Projekt ' + (i + 1));
        b.addEventListener('click', () => goTo(i, true));
        barsWrap.appendChild(b);
      });
    }

    // drag
    let dragging = false, startX = 0, startOffset = 0, moved = 0;
    viewport.addEventListener('pointerdown', (e) => {
      dragging = true; moved = 0; startX = e.clientX; startOffset = offset;
      track.style.transition = 'none';
      try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      offset = clampOffset(startOffset - dx);
      track.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
      goTo(nearest(), true);
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // suppress click after a drag; block placeholder links from jumping
    viewport.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    slides.forEach((s) => {
      const a = s.querySelector('a');
      if (a) a.addEventListener('click', (e) => { if (a.getAttribute('href') === '#') e.preventDefault(); });
    });

    // horizontal wheel (trackpad) — never traps vertical scroll
    let wheelT;
    viewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        offset = clampOffset(offset + e.deltaX);
        track.style.transition = 'none';
        track.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';
        clearTimeout(wheelT); wheelT = setTimeout(() => goTo(nearest(), true), 120);
      }
    }, { passive: false });

    // arrow keys while the section is on screen
    addEventListener('keydown', (e) => {
      const r = section.getBoundingClientRect();
      if (r.bottom < innerHeight * 0.4 || r.top > innerHeight * 0.6) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1, true); }
    });

    addEventListener('resize', () => { measure(); goTo(index, false); });
    measure(); goTo(0, false);
    addEventListener('load', () => { measure(); goTo(index, false); });
    setTimeout(() => { measure(); goTo(index, false); }, 350);
  }

  /* ---------------------------------------------------------
     FILTERS
  --------------------------------------------------------- */
  function initFilters() {
    const wrap = document.querySelector('[data-filters]');
    if (!wrap) return;
    const btns = wrap.querySelectorAll('.filter');
    const rows = [...document.querySelectorAll('.work-row')];
    const countEl = document.querySelector('[data-work-count]');
    const emptyEl = document.querySelector('[data-work-empty]');
    btns.forEach((btn) => btn.addEventListener('click', () => {
      btns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const f = btn.dataset.filter;
      let visible = 0;
      rows.forEach((row) => {
        const show = f === 'all' || row.dataset.cat === f;
        row.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });
      if (countEl) countEl.textContent = String(visible).padStart(2, '0');
      if (emptyEl) emptyEl.hidden = visible !== 0;
    }));
  }

  /* ---------------------------------------------------------
     CLOCK (Europe/Prague)
  --------------------------------------------------------- */
  function initClock() {
    const el = document.querySelector('[data-clock]');
    if (!el) return;
    const fmt = new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Europe/Prague' });
    function tick() { el.textContent = fmt.format(new Date()); }
    tick(); setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------
     WORD REVEAL (scroll-linked, dragonfly style)
  --------------------------------------------------------- */
  function initWordReveal() {
    const els = [...document.querySelectorAll('[data-reveal-words]')];
    if (!els.length) return;
    if (prefersReduced) return; // leave text fully visible

    // wrap each word in a <span class="rw">, preserving inline elements (e.g. <em>)
    els.forEach((el) => {
      const nodes = [...el.childNodes];
      const frag = document.createDocumentFragment();
      nodes.forEach((node) => {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach((tok) => {
            if (tok === '') return;
            if (/^\s+$/.test(tok)) frag.appendChild(document.createTextNode(tok));
            else { const s = document.createElement('span'); s.className = 'rw'; s.textContent = tok; frag.appendChild(s); }
          });
        } else if (node.nodeType === 1) {
          node.classList.add('rw');
          frag.appendChild(node);
        }
      });
      el.textContent = '';
      el.appendChild(frag);
      el._words = el.querySelectorAll('.rw');
    });

    let ticking = false;
    function update() {
      ticking = false;
      const startLine = innerHeight * 0.9;
      const endLine = innerHeight * 0.42;
      els.forEach((el) => {
        const words = el._words; if (!words.length) return;
        const rect = el.getBoundingClientRect();
        const travel = (startLine - endLine) + rect.height;
        let p = (startLine - rect.top) / travel;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        const rc = p * words.length;
        for (let i = 0; i < words.length; i++) {
          let t = rc - i; t = t < 0 ? 0 : t > 1 ? 1 : t;
          words[i].style.opacity = (0.16 + 0.84 * t).toFixed(3);
        }
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
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
     MARQUEE
  --------------------------------------------------------- */
  function initMarquee() {
    const track = document.querySelector('[data-marquee]');
    if (!track || prefersReduced) return;
    track.innerHTML = track.innerHTML + track.innerHTML;
    let x = 0, half = track.scrollWidth / 2, speed = 0.6, boost = 0, prev = scrollY;
    addEventListener('resize', () => { half = track.scrollWidth / 2; });
    addEventListener('scroll', () => { const dy = scrollY - prev; prev = scrollY; boost = Math.min(Math.abs(dy) * 0.4, 20); }, { passive: true });
    (function loop() {
      boost *= 0.9; x -= (speed + boost);
      if (-x >= half) x += half;
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------------------------------------------------
     COUNTERS
  --------------------------------------------------------- */
  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length || prefersReduced || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target, target = parseInt(el.getAttribute('data-count'), 10), start = performance.now(), dur = 1300;
        (function tick(now) {
          const p = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(e * target);
          if (p < 1) requestAnimationFrame(tick); else el.textContent = target;
        })(start);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => io.observe(n));
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
     "shots" for real images: { img: 'img/xy.jpg', wide: true }.
  --------------------------------------------------------- */
  const PROJECTS = {
    'masaze': {
      web: 'https://masazekostelec.cz/',
      desc: [
        'Masáže Kostelec is a small massage studio run by Jana Hladíková — a mobile masseuse who brings reconditioning and relaxation massage to wherever you feel most at ease. The brief was to give that calm, personal service a visual identity of its own.',
        'The identity grows from one quiet mark — a sun rising over a soft wave — that carries the studio\'s promise: awakening body and mind through touch. Around it sits a warm, earthy palette of cream, terracotta and olive, with a gentle lowercase wordmark that never raises its voice.',
        'I carried that mood across the whole system — business cards, gift vouchers and print — and shot the photography to match: low, honest light, a single orchid, and the stillness of the treatment room. Every piece is meant to feel the way a good massage does: unhurried, warm and calm.'
      ],
      credits: [
        'Branding by Ondřej Hladík',
        'Photos by Ondřej Hladík',
        'Motion video by René Nožička'
      ],
      shots: [
        { img: 'img/masaze/photo-1.jpg', wide: true },
        { img: 'img/masaze/brand-1.png' },
        { img: 'img/masaze/magazine.jpg' },
        { img: 'img/masaze/massage-hands.jpg', wide: true },
        { video: 'img/masaze/masaze.mp4' },
        { img: 'img/masaze/photo-2.jpg' },
        { img: 'img/masaze/logo-mockup.jpg', wide: true }
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
        { img: 'img/molo-lipno/molo-1.jpg', wide: true },
        { img: 'img/molo-lipno/molo-2.jpg' },
        { img: 'img/molo-lipno/molo-5.jpg' },
        { img: 'img/molo-lipno/molo-4.jpg', wide: true },
        { img: 'img/molo-lipno/molo-3.jpg', wide: true }
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
        { img: 'img/live-district/ld-mockup.jpg', wide: true },
        { img: 'img/live-district/ld-roster.jpg' },
        { img: 'img/live-district/ld-logo-tile.svg' },
        { video: 'img/live-district/ld-recording.mp4', wide: true },
        { img: 'img/live-district/ld-dorian-page.jpg', wide: true }
      ]
    },
    'font-design': {
      desc: [
        'A display typeface of my own, drawn from the ground up — uppercase alphabet, numerals and the punctuation needed to set a headline. Antikva bones with the contrast pushed until the serifs read as blunt slabs rather than fine hairlines.',
        'The specimen poster tests it the way the face is meant to be used: one letterform blown up until it stops being a letter and turns into a shape, with the full character set set small inside it. Printed large and mounted in a park — the honest way to find out whether a display face holds together at distance.'
      ],
      shots: [
        { img: 'img/font-design/poster-mockup.jpg', wide: true }
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
    const links = document.querySelectorAll('.pcard__link');
    if (!links.length) return;
    let lastFocused = null;

    function fill(slug, card) {
      const titleNode = card.querySelector('.pcard__title');
      const data = PROJECTS[slug] || {};
      titleEl.textContent = titleNode ? titleNode.textContent.trim() : 'Project';

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
          v.src = shot.video; v.autoplay = true; v.loop = true; v.muted = true;
          v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.playsInline = true;
          fig.appendChild(v);
        } else if (shot.img) {
          const im = document.createElement('img');
          im.src = shot.img; im.alt = ''; im.loading = 'lazy';
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
        link.textContent = 'web: ' + data.web.replace(/^https?:\/\//, '').replace(/\/$/, '');
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
    initClock(); initProgress(); initMagnetic(); initMisc(); initProjectModal(); initTeamModal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
