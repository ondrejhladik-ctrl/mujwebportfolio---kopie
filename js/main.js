/* =========================================================
   Ondřej Hladík — Portfolio
   Interactions: title reveal, intro loader, mail beetle,
   reveal, nav, menu, magnetic, project + team modals
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  /* clean URLs: the site links to /work and /team (GitHub Pages serves work.html for /work).
     · live: if someone lands on …/work.html, tidy the address bar
     · local preview (Live Server, python http.server): those servers can't resolve /work, so point the links at the .html files */
  (function () {
    const live = location.hostname === 'ohdesign.eu';
    if (live) {
      if (/\.html$/.test(location.pathname)) history.replaceState(null, '', location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '') + location.hash);
    } else {
      document.querySelectorAll('a[href^="/"]').forEach((a) => {
        const h = a.getAttribute('href');
        if (h === '/' || h.startsWith('/#')) a.setAttribute('href', 'index.html' + h.slice(1));
        else if (/^\/(work|team)(#|$)/.test(h)) a.setAttribute('href', h.replace(/^\/(work|team)/, '$1.html'));
      });
    }
  })();
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
      document.dispatchEvent(new Event('intro:done'));   // the wandering beetle on touch screens waits for this
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
     WALKING BEETLE + PREVIEW — hover a project name on the homepage:
     a beetle is sent in from the right edge of the screen and crawls
     slowly to the end of the coral bar, while the project's picture
     appears on the right side of the first screen.
  --------------------------------------------------------- */
  function initWalkBug() {
    if (!fine) return;
    const bug = document.querySelector('[data-walkbug]');
    const box = document.querySelector('[data-home-preview]');
    const links = document.querySelectorAll('.plist__link[data-walk]');
    if (!bug || !links.length) return;
    const img = box ? box.querySelector('img') : null;
    const ART = { 2: 'img/beetle-2.png', 3: 'img/beetle-3.png' };
    const SPEED = 0.42;      // px per ms → ~2.4 s across a 1000 px screen: slow, deliberate
    const GAP = 46;          // centre of the beetle from the end of the bar (its head ends up ~8 px short of it)
    let target = null, x = 0, y = 0, fromX = 0, toX = 0, t0 = 0, dur = 0, leaveTimer = null, raf = 0;

    // warm the picture cache once the page is idle so the first hover doesn't flash
    setTimeout(() => links.forEach((a) => { if (a.dataset.preview) { const im = new Image(); im.src = a.dataset.preview; } }), 1500);
    setTimeout(() => Object.values(ART).forEach((src) => { const im = new Image(); im.src = src; }), 1800);

    function dest(el) { const r = el.getBoundingClientRect(); return { x: r.right + GAP, y: r.top + r.height / 2 }; }
    function place(px, py, ang) { bug.style.transform = 'translate(' + px + 'px,' + py + 'px) translate(-50%,-50%) rotate(' + ang + 'deg)'; }

    function loop(now) {
      if (!target) return;
      const d = dest(target);
      const p = dur ? Math.min((now - t0) / dur, 1) : 1;
      const e = 1 - Math.pow(1 - p, 2);          // ease-out: slows down as it reaches the bar
      x = fromX + (d.x - fromX) * e;
      y += (d.y - y) * 0.18;                      // follows the row smoothly when the target changes
      const walking = p < 1;
      // art points "up" → -90° faces left; while walking it wobbles like legs working
      const wobble = walking ? Math.sin(now / 55) * 4 : 0;
      const bob = walking ? Math.sin(now / 110) * 1.5 : 0;
      place(x, y + bob, -90 + wobble);
      raf = requestAnimationFrame(loop);
    }

    const plist = document.querySelector('.plist'), home = document.querySelector('.home');
    function placePreview() {
      if (!box || !plist || !home) return;
      const l = plist.getBoundingClientRect(), h = home.getBoundingClientRect();
      box.style.setProperty('--pv-top', (l.top + l.height / 2 - h.top) + 'px');
    }
    function send(el) {
      clearTimeout(leaveTimer);
      placePreview();
      const kind = el.dataset.walk;
      if (bug.dataset.kind !== kind && ART[kind]) { bug.src = ART[kind]; bug.dataset.kind = kind; }
      const d = dest(el);
      const wasOn = bug.classList.contains('is-on');
      if (!wasOn) { x = innerWidth + 80; y = d.y; }   // enter from beyond the right edge, on the row's line
      fromX = x; toX = d.x; t0 = performance.now();
      dur = prefersReduced ? 0 : Math.abs(toX - fromX) / SPEED;
      target = el;
      bug.classList.add('is-on');
      if (img && el.dataset.preview) {
        if (img.getAttribute('src') !== el.dataset.preview) img.src = el.dataset.preview;
        box.classList.add('is-on');
      }
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      if (box) swarm.gather(box, el !== swarm.current); swarm.current = el;
    }

    function leave() {
      leaveTimer = setTimeout(() => {
        target = null; cancelAnimationFrame(raf);
        bug.classList.remove('is-on');
        if (box) box.classList.remove('is-on');
        swarm.scatter(); swarm.current = null;
      }, 160);   // small grace so moving between two rows doesn't blink
    }

    links.forEach((a) => {
      a.addEventListener('mouseenter', () => send(a));
      a.addEventListener('mouseleave', leave);
      a.addEventListener('focus', () => send(a));
      a.addEventListener('blur', leave);
    });
    // the beetle should not linger over an open project overlay
    document.addEventListener('click', (e) => { if (e.target.closest('.plist__link')) { clearTimeout(leaveTimer); target = null; bug.classList.remove('is-on'); if (box) box.classList.remove('is-on'); swarm.scatter(); swarm.current = null; } });
  }

  /* ---------------------------------------------------------
     SWARM — four beetles come in from the four edges of the screen
     and settle around the preview square. Change of project or
     leaving = they scatter back out, then crawl in again.
  --------------------------------------------------------- */
  const swarm = (function () {
    const api = { current: null, gather() {}, scatter() {} };
    if (!fine) return api;
    const els = [...document.querySelectorAll('[data-swarm]')];
    if (!els.length) return api;
    const SPEED_IN = 0.42, SPEED_OUT = 0.65;  // px per ms — unhurried in, quicker out (the left one has the longest walk)
    const bugs = els.map((el, i) => ({
      el, edge: el.dataset.swarm, x: 0, y: 0, tx: 0, ty: 0, speed: SPEED_IN * (0.85 + (i % 3) * 0.12),
      delay: i * 140, t0: 0, state: 'hidden', ang: 0, box: null, ret: false
    }));
    let raf = 0, boxEl = null;

    // every time they come in, each beetle draws a new spot: a side of the square (the first four
    // sides are shuffled so the square is surrounded, the rest are random), a random point along
    // that side and a random distance from the edge
    const SIDES = ['top', 'right', 'bottom', 'left'];
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function draw() {
      const deck = shuffle(SIDES.slice());
      bugs.forEach((b, i) => {
        const spot = {
          side: i < 4 ? deck[i] : SIDES[(Math.random() * 4) | 0],
          t: 0.12 + Math.random() * 0.76,            // where along the side (12–88 %)
          off: 28 + Math.random() * 16               // how far outside the edge
        };
        b.wob = Math.random() * 7;                   // phase so they don't wobble in unison
        b.next = spot;
      });
      spread(bugs.map((b) => b.next));
      bugs.forEach((b) => { if (b.state === 'hidden' || b.side === undefined) { b.side = b.next.side; b.t = b.next.t; b.off = b.next.off; } });
    }
    // two spots on the same side must be at least MIN_T of the side apart — the later one slides aside
    const MIN_T = 0.26;
    function spread(spots) {
      SIDES.forEach((side) => {
        const same = spots.filter((p) => p.side === side).sort((a, c) => a.t - c.t);
        for (let i = 1; i < same.length; i++) {
          if (same[i].t - same[i - 1].t < MIN_T) {
            const up = same[i - 1].t + MIN_T;
            same[i].t = up <= 0.88 ? up : Math.max(0.12, same[i - 1].t - MIN_T);
          }
        }
      });
    }
    // where each one rests, facing the square
    function seat(b, r) {
      switch (b.side) {
        case 'top':    return { x: r.left + r.width * b.t,  y: r.top - b.off,     face: 180 };  // head down
        case 'right':  return { x: r.right + b.off,          y: r.top + r.height * b.t, face: -90 }; // head left
        case 'bottom': return { x: r.left + r.width * b.t,  y: r.bottom + b.off,  face: 0 };    // head up
        default:       return { x: r.left - b.off,           y: r.top + r.height * b.t, face: 90 };  // head right
      }
    }
    // where each one comes from / runs to: beyond the viewport edge on its side
    function gate(b, r) {
      const s = seat(b, r), m = 90, j = (Math.random() - 0.5) * 240;
      switch (b.side) {
        case 'top':    return { x: s.x + j, y: -m };
        case 'right':  return { x: innerWidth + m, y: s.y + j };
        case 'bottom': return { x: s.x + j, y: innerHeight + m };
        default:       return { x: -m, y: s.y + j };
      }
    }
    function place(b, wobble) {
      b.el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px) translate(-50%,-50%) rotate(' + (b.ang + wobble) + 'deg)';
    }
    function step(b, now, dt) {
      const dx = b.tx - b.x, dy = b.ty - b.y, dist = Math.hypot(dx, dy);
      const sp = (b.state === 'out' ? SPEED_OUT : b.speed) * dt;
      if (dist <= sp) { b.x = b.tx; b.y = b.ty; return true; }
      b.x += dx / dist * sp; b.y += dy / dist * sp;
      b.ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;   // art points up → +90 to face the way it walks
      return false;
    }
    function loop(now) {
      let busy = false;
      const r = boxEl ? boxEl.getBoundingClientRect() : null;
      bugs.forEach((b) => {
        if (b.state === 'hidden') return;
        busy = true;
        if (now < b.t0) { place(b, 0); return; }         // staggered start
        const dt = Math.min(now - (b.last || now), 40); b.last = now;
        if (b.state === 'in') {
          if (r) { const s = seat(b, r); b.tx = s.x; b.ty = s.y; }
          const arrived = step(b, now, dt);
          if (arrived) { b.state = 'seated'; if (r) b.ang = seat(b, r).face; }
          place(b, Math.sin(now / 55 + b.wob) * 4);
        } else if (b.state === 'seated') {
          if (r) {
            const crowd = bugs.find((o) => o !== b && o.side === b.side && o.state === 'seated' && Math.abs(o.t - b.t) < MIN_T && o.t <= b.t);
            if (crowd) {                                   // someone is already sitting here → move along the side
              const up = crowd.t + MIN_T; b.t = up <= 0.88 ? up : Math.max(0.12, crowd.t - MIN_T);
              b.state = 'in'; b.last = 0;                  // walk to the free spot
            } else { const s = seat(b, r); b.x = s.x; b.y = s.y; b.ang = s.face; }   // follows the box if it moves
          }
          place(b, 0);
        } else if (b.state === 'out') {
          const arrived = step(b, now, dt);
          place(b, Math.sin(now / 45 + b.wob) * 5);
          if (arrived) {
            b.el.classList.remove('is-on');
            if (b.ret && boxEl) { b.side = b.next.side; b.t = b.next.t; b.off = b.next.off; enter(b, now); } else { b.state = 'hidden'; }
          }
        }
      });
      if (busy) raf = requestAnimationFrame(loop); else raf = 0;
    }
    function enter(b, now) {
      if (b.side === undefined) draw();            // first ever entry: deal the spots
      const r = boxEl.getBoundingClientRect(), g = gate(b, r), s = seat(b, r);
      b.x = g.x; b.y = g.y; b.tx = s.x; b.ty = s.y; b.ret = false;
      b.state = 'in'; b.t0 = now + b.delay; b.last = 0;
      b.ang = Math.atan2(s.y - g.y, s.x - g.x) * 180 / Math.PI + 90;
      place(b, 0); b.el.classList.add('is-on');
    }
    api.gather = function (box, changed) {
      boxEl = box;
      const now = performance.now();
      if (changed || bugs.every((b) => b.state === 'hidden')) draw();   // new project or fresh hover → new spots
      bugs.forEach((b) => {
        if (b.state === 'hidden') enter(b, now);
        else if (changed) { b.ret = true; if (b.state !== 'out') runOut(b, now); }   // new project: out first, then back in
      });
      if (!raf) raf = requestAnimationFrame(loop);
    };
    function runOut(b, now) {
      const r = boxEl.getBoundingClientRect(), g = gate(b, r);
      b.tx = g.x; b.ty = g.y; b.state = 'out'; b.t0 = now + b.delay * 0.5; b.last = 0;
    }
    api.scatter = function () {
      const now = performance.now();
      bugs.forEach((b) => { if (b.state !== 'hidden') { b.ret = false; if (b.state !== 'out') runOut(b, now); } });
      if (!raf) raf = requestAnimationFrame(loop);
    };
    return api;
  })();

  /* ---------------------------------------------------------
     MENU BEETLES — while the menu is open, the longer you hesitate
     the more beetles turn up. They circle the cursor at a distance,
     never touch it, and keep off the buttons. Click / close → gone.
  --------------------------------------------------------- */
  function initMenuBugs() {
    if (!fine || prefersReduced) return;
    const menu = document.querySelector('[data-menu]');
    if (!menu) return;
    const ART = ['img/beetle-2.png', 'img/beetle-3.png', 'img/beetle-1.svg'];
    const MAX = 14, FIRST = 1400, RING = 120, KEEP = 78, PAD = 26;
    let bugs = [], timer = null, raf = 0, open = false, mx = innerWidth / 2, my = innerHeight / 2, last = 0;
    let gatherEl = null;     // the button being hovered → everyone rushes to it and bumps into its edges

    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('mouseenter', () => { gatherEl = a; dealSeats(); });
      a.addEventListener('mouseleave', () => { gatherEl = null; });
    });
    // seats around the hovered button: sides cycle so it gets surrounded, spots spread along each side
    const SIDES = ['top', 'bottom', 'right', 'left'];
    function dealSeats() {
      const perSide = {};
      bugs.forEach((b, i) => { b.side = SIDES[i % 4]; (perSide[b.side] = perSide[b.side] || []).push(b); });
      Object.values(perSide).forEach((list) => list.forEach((b, i) => { b.t = (i + 0.5) / list.length + (Math.random() - 0.5) * 0.12; b.off = 14 + Math.random() * 8; b.bumped = false; }));
    }
    function seat(b, r) {
      switch (b.side) {
        case 'top':    return { x: r.left + r.width * b.t, y: r.top - b.off,    face: 180 };
        case 'bottom': return { x: r.left + r.width * b.t, y: r.bottom + b.off, face: 0 };
        case 'right':  return { x: r.right + b.off,        y: r.top + r.height * b.t, face: -90 };
        default:       return { x: r.left - b.off,         y: r.top + r.height * b.t, face: 90 };
      }
    }

    function obstacles() {
      const els = [...menu.querySelectorAll('a'), document.querySelector('[data-burger]')].filter(Boolean);
      return els.map((el) => { const r = el.getBoundingClientRect(); return { l: r.left - PAD, t: r.top - PAD, r: r.right + PAD, b: r.bottom + PAD }; });
    }
    function spawn() {
      if (!open || bugs.length >= MAX) return;
      const el = document.createElement('img');
      el.className = 'menubug'; el.alt = ''; el.setAttribute('aria-hidden', 'true');
      el.src = ART[bugs.length % ART.length];
      document.body.appendChild(el);
      // come in from a random edge
      const side = (Math.random() * 4) | 0, m = 80;
      const b = {
        el, x: 0, y: 0, px: 0, py: 0,
        ang: Math.random() * Math.PI * 2,                    // where on the ring around the cursor it wants to be
        r: RING + Math.random() * 70,                        // its own ring radius
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.0004 + Math.random() * 0.0007),
        wob: Math.random() * 7, out: false
      };
      if (side === 0) { b.x = Math.random() * innerWidth; b.y = -m; }
      else if (side === 1) { b.x = innerWidth + m; b.y = Math.random() * innerHeight; }
      else if (side === 2) { b.x = Math.random() * innerWidth; b.y = innerHeight + m; }
      else { b.x = -m; b.y = Math.random() * innerHeight; }
      b.px = b.x; b.py = b.y;
      bugs.push(b);
      if (gatherEl) dealSeats();                            // a newcomer during a hover gets a seat too
      requestAnimationFrame(() => el.classList.add('is-on'));
      // the next one comes a little sooner each time
      timer = setTimeout(spawn, Math.max(650, 1300 - bugs.length * 60));
      if (!raf) raf = requestAnimationFrame(loop);
    }
    function loop(now) {
      const dt = Math.min(now - (last || now), 40); last = now;
      const obs = obstacles();
      const gr = gatherEl ? gatherEl.getBoundingClientRect() : null;
      bugs.forEach((b) => {
        let tx, ty;
        if (b.out) { tx = b.ox; ty = b.oy; }
        else if (gr && b.side) {
          // rush to the hovered button and bump into its edge (one little shove past the seat, then settle)
          const st = seat(b, gr); tx = st.x; ty = st.y;
          b.x += (tx - b.x) * 0.14; b.y += (ty - b.y) * 0.14;
          if (!b.bumped && Math.hypot(tx - b.x, ty - b.y) < 3) {
            b.bumped = true;
            const cx = gr.left + gr.width / 2, cy = gr.top + gr.height / 2, dx = cx - b.x, dy = cy - b.y, d = Math.hypot(dx, dy) || 1;
            b.x += dx / d * 12; b.y += dy / d * 12;
          }
          bugs.forEach((o) => { if (o === b) return; const ex = b.x - o.x, ey = b.y - o.y, e = Math.hypot(ex, ey) || 1; if (e < 40) { b.x += ex / e * (40 - e) * 0.5; b.y += ey / e * (40 - e) * 0.5; } });
          const vx = b.x - b.px, vy = b.y - b.py, sp = Math.hypot(vx, vy);
          b.face = sp > 0.6 ? Math.atan2(vy, vx) * 180 / Math.PI + 90 : st.face;   // walking → face the way it goes, seated → face the button
          b.el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px) translate(-50%,-50%) rotate(' + (b.face + (sp > 0.6 ? Math.sin(now / 55 + b.wob) * 4 : 0)) + 'deg)';
          b.px = b.x; b.py = b.y;
          return;
        }
        else {
          b.ang += b.spin * dt;
          // aim for a spot on its ring around the cursor — if that spot is over a button, walk round the ring to a free one
          const dir = b.spin < 0 ? -1 : 1;
          let k = 0;
          for (; k < 24; k++) {
            const a = b.ang + dir * k * Math.PI / 12;
            tx = mx + Math.cos(a) * b.r; ty = my + Math.sin(a) * b.r;
            if (!obs.some((o) => tx > o.l && tx < o.r && ty > o.t && ty < o.b)) { if (k) b.ang = a; break; }
          }
        }
        b.x += (tx - b.x) * (b.out ? 0.09 : 0.05);
        b.y += (ty - b.y) * (b.out ? 0.09 : 0.05);
        if (!b.out) {
          // never touch the cursor
          let dx = b.x - mx, dy = b.y - my, d = Math.hypot(dx, dy) || 1;
          if (d < KEEP) { b.x = mx + dx / d * KEEP; b.y = my + dy / d * KEEP; }
          // keep off the buttons: push out of the nearest side of any expanded rect
          obs.forEach((o) => {
            if (b.x > o.l && b.x < o.r && b.y > o.t && b.y < o.b) {
              const dl = b.x - o.l, dr = o.r - b.x, dtp = b.y - o.t, db = o.b - b.y, mn = Math.min(dl, dr, dtp, db);
              if (mn === dl) b.x = o.l; else if (mn === dr) b.x = o.r; else if (mn === dtp) b.y = o.t; else b.y = o.b;
            }
          });
          // and a little personal space from each other
          bugs.forEach((o) => { if (o === b) return; const ex = b.x - o.x, ey = b.y - o.y, e = Math.hypot(ex, ey) || 1; if (e < 58) { b.x += ex / e * (58 - e) * 0.5; b.y += ey / e * (58 - e) * 0.5; } });
        }
        const vx = b.x - b.px, vy = b.y - b.py, sp = Math.hypot(vx, vy);
        if (sp > 0.25) b.face = Math.atan2(vy, vx) * 180 / Math.PI + 90;   // art points up → face the way it walks
        const wob = sp > 0.25 ? Math.sin(now / 55 + b.wob) * 4 : 0;
        b.el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px) translate(-50%,-50%) rotate(' + ((b.face || 0) + wob) + 'deg)';
        b.px = b.x; b.py = b.y;
      });
      // remove the ones that made it off screen
      bugs = bugs.filter((b) => { if (b.out && Math.hypot(b.ox - b.x, b.oy - b.y) < 6) { b.el.remove(); return false; } return true; });
      if (bugs.length) raf = requestAnimationFrame(loop); else raf = 0;
    }
    function start() { if (open) return; open = true; last = 0; clearTimeout(timer); timer = setTimeout(spawn, FIRST); }
    function stop() {
      open = false; clearTimeout(timer);
      bugs.forEach((b) => {                                // run for the nearest edge
        const m = 90, dL = b.x, dR = innerWidth - b.x, dT = b.y, dB = innerHeight - b.y, mn = Math.min(dL, dR, dT, dB);
        b.out = true; b.ox = b.x; b.oy = b.y;
        if (mn === dL) b.ox = -m; else if (mn === dR) b.ox = innerWidth + m; else if (mn === dT) b.oy = -m; else b.oy = innerHeight + m;
        b.el.classList.remove('is-on');
      });
      if (bugs.length && !raf) raf = requestAnimationFrame(loop);
    }
    new MutationObserver(() => { if (body.classList.contains('menu-open')) start(); else stop(); })
      .observe(body, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------------------------------------------------------
     WANDERING BEETLE — touch screens have no hover, so none of the
     beetles above ever turn up there. Instead one beetle potters
     about the empty patch between the nav and PROJECTS on the
     homepage: walks to a spot, stops, turns, walks to the next…
  --------------------------------------------------------- */
  function initWanderBug() {
    const bug = document.querySelector('[data-wanderbug]');
    const home = document.querySelector('.home'), title = document.querySelector('.home__title'), nav = document.querySelector('[data-nav]');
    if (!bug || !home || !title || prefersReduced || !matchMedia('(hover: none), (pointer: coarse)').matches) return;
    const TURN = 0.22;       // deg per ms — turns on the spot, a half-turn takes ~0.8 s
    const PAD = 22;          // keeps its body clear of the edges of the patch
    let area = null, x = 0, y = 0, face = -90, tx = 0, ty = 0, speed = 0.07, state = 'wait', until = 0;
    let raf = 0, last = 0, started = false, visible = true;
    const wobble = Math.random() * 7;

    // the patch: the content width, from under the nav down to just above PROJECTS (in the section's own coordinates)
    function measure() {
      const h = home.getBoundingClientRect(), t = title.getBoundingClientRect();
      const top = (nav ? nav.offsetHeight : 0) - (h.top + scrollY) + PAD + 10, bottom = t.top - h.top - PAD - 6;
      area = bottom - top >= 50 ? { l: PAD, r: h.width - PAD, t: top, b: bottom } : null;
      return area;
    }
    const wrap = (a) => ((a + 180) % 360 + 360) % 360 - 180;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

    // the next spot: a decent step away and, when possible, off to one side so the route bends rather than shuttles
    function pick() {
      if (!measure()) return false;
      let fallback = null;
      for (let k = 0; k < 10; k++) {
        const cx = area.l + Math.random() * (area.r - area.l), cy = area.t + Math.random() * (area.b - area.t);
        if (Math.hypot(cx - x, cy - y) < 60) continue;
        fallback = { x: cx, y: cy };
        if (Math.abs(wrap(Math.atan2(cy - y, cx - x) * 180 / Math.PI + 90 - face)) > 30) break;
      }
      const spot = fallback || { x: (area.l + area.r) / 2, y: (area.t + area.b) / 2 };
      tx = spot.x; ty = spot.y;
      speed = 0.055 + Math.random() * 0.03;   // px per ms — a potter, not a march
      return true;
    }
    function place(now) {
      const wob = state === 'walk' ? Math.sin(now / 55 + wobble) * 4 : 0;   // legs working
      bug.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) rotate(' + (face + wob) + 'deg)';
    }
    function loop(now) {
      const dt = Math.min(now - (last || now), 40); last = now;
      if (state === 'turn' || state === 'walk') {
        // art points up → +90° faces the way it goes
        const diff = wrap(Math.atan2(ty - y, tx - x) * 180 / Math.PI + 90 - face);
        face += Math.sign(diff) * Math.min(Math.abs(diff), TURN * dt);
        if (state === 'turn' && Math.abs(diff) < 2) state = 'walk';
      }
      if (state === 'walk') {
        const d = Math.hypot(tx - x, ty - y), step = speed * dt;
        if (d <= step) { x = tx; y = ty; state = 'wait'; until = now + 500 + Math.random() * 1400; }   // arrived → a moment's pause
        else { x += (tx - x) / d * step; y += (ty - y) / d * step; }
      } else if (state === 'wait' && now >= until && pick()) state = 'turn';
      place(now);
      raf = visible ? requestAnimationFrame(loop) : 0;
    }

    function begin() {
      if (!measure()) { started = true; return; }   // no room (landscape phone) → it waits for a resize
      started = true;
      // comes in from the right edge, level with the middle of the patch, like the walking beetle on desktop
      x = area.r + 30; y = (area.t + area.b) / 2; face = -90;
      pick(); state = 'turn'; place(performance.now());
      bug.classList.add('is-on');
      last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    addEventListener('resize', () => {
      if (!started) return;
      const had = !!area;
      if (!measure()) { bug.classList.remove('is-on'); state = 'wait'; return; }   // patch too small → hides until there's room again
      if (!had) bug.classList.add('is-on');
      x = clamp(x, area.l, area.r); y = clamp(y, area.t, area.b);
      if (tx < area.l || tx > area.r || ty < area.t || ty > area.b) { pick(); state = 'turn'; }
      if (!raf && visible) { last = 0; raf = requestAnimationFrame(loop); }
    });
    // nothing to see while the first screen is scrolled away → the loop rests
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => {
      visible = en[0].isIntersecting;
      if (visible && started && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    }).observe(home);

    // a beat after the intro slides away and PROJECTS has revealed
    const intro = document.querySelector('.intro');
    const go = () => setTimeout(begin, 700);
    if (intro && !intro.classList.contains('is-done')) document.addEventListener('intro:done', go, { once: true });
    else go();
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
     MAGNETIC + MISC
  --------------------------------------------------------- */
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
    'objecta': {
      web: 'https://youtu.be/GiTxhZwwnjs',
      webPrefix: 'video',
      webLabel: 'youtube.com',
      desc: [
        'Objecta Visual Art is a self-initiated visual experiment that ended up as a short film. One geometric rosette — a star folded out of straight lines — is the only building block; everything else comes from running it through colour, scale and damage.',
        'The frames are built like collages: hard primaries against black, halftone screens borrowed from print, and glitch textures that look like a file opened in the wrong program. Symmetry holds each frame together while its surface falls apart.',
        'These are stills from the piece — the whole thing runs as a video.'
      ],
      credits: [
        'Visuals & motion by Ondřej Hladík'
      ],
      shots: [
        { img: 'img/objecta/objecta-1.webp', square: true },
        { img: 'img/objecta/objecta-2.webp', square: true },
        { img: 'img/objecta/objecta-3.webp', square: true },
        { img: 'img/objecta/objecta-4.webp', square: true },
        { img: 'img/objecta/objecta-5.webp', square: true },
        { img: 'img/objecta/objecta-6.webp', square: true }
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
        fig.className = 'pmodal__shot' + (media ? ' has-media' : (shot.art ? ' ' + shot.art : '')) + (shot.wide ? ' is-wide' : '') + (shot.square ? ' is-square' : '');
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
        link.textContent = (data.webPrefix || 'web') + ': ' + (data.webLabel || data.web.replace(/^https?:\/\//, '').replace(/\/$/, ''));
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
    const openers = document.querySelectorAll('a[data-team]');   // real link to team.html; with JS + the overlay present it opens in place
    if (!openers.length) return;
    const closers = modal.querySelectorAll('[data-tmodal-close]');
    const scrollEl = modal.querySelector('[data-tmodal-scroll]');
    let lastFocused = null, pushed = false;
    // the address bar follows the overlay: /team while it is open, back to the page on close (and Back closes it)
    const teamURL = location.hostname === 'ohdesign.eu' ? '/team' : 'team.html';

    function open() {
      lastFocused = document.activeElement;
      modal.querySelectorAll('img[data-src]').forEach((im) => { im.src = im.dataset.src; im.removeAttribute('data-src'); });
      body.classList.add('pmodal-open');
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      if (scrollEl) scrollEl.scrollTop = 0;
      const first = modal.querySelector('[data-tmodal-close]');
      if (first) first.focus();
      if (history.pushState) { history.pushState({ team: true }, '', teamURL); pushed = true; }
    }

    function close(fromHistory) {
      if (!modal.classList.contains('is-open')) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      body.classList.remove('pmodal-open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      if (pushed && !fromHistory) history.back();
      pushed = false;
    }

    openers.forEach((a) => {
      a.addEventListener('click', (e) => { e.preventDefault(); open(); });
    });
    closers.forEach((b) => b.addEventListener('click', () => close(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') close(false); });
    addEventListener('popstate', () => close(true));
  }

  /* ---------------------------------------------------------
     BOOT
  --------------------------------------------------------- */
  function boot() {
    initTitleReveal(); runIntro(); initMailbug(); initWalkBug(); initWanderBug(); initMenuBugs(); initReveal(); initNav(); initMenu();
    initMagnetic(); initMisc(); initProjectModal(); initTeamModal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
