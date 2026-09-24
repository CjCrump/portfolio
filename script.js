/* ============================================================
   Chance IT Studio — script.js  (radial hamster wheel)
   ============================================================ */
(function () {
  'use strict';

  var NAMES   = ['Home', 'About', 'Work', 'Services', 'Process', 'Contact'];
  var ACCENTS = ['--green', '--cyan', '--orange', '--lime', '--magenta', '--green'];
  var N = NAMES.length, STEP = Math.PI * 2 / N, VIS = 1.40;

  var root   = document.documentElement;
  var stage  = document.getElementById('stage');
  var tiles  = Array.prototype.slice.call(document.querySelectorAll('.tile'));
  var deck   = document.getElementById('deck');
  var runner = document.getElementById('runner');
  function $(id) { return document.getElementById(id); }
  var av = {
    body: $('av-body'), head: $('av-head'), torso: $('av-torso'), collar: $('av-collar'),
    hair: $('svga-group-hair-front'), temple: $('av-temple'),
    browN: $('svga-group-eyebrows-left-rotate'), browF: $('svga-group-eyebrows-right-rotate'),
    eyeN: $('svga-group-eyes-left'), eyeF: $('svga-group-eyes-right'),
    irisN: $('svga-group-eyesiriscontrol-left'), irisF: $('svga-group-eyesiriscontrol-right'),
    legF: $('av-legF'), shinF: $('av-shinF'), footF: $('av-footF'),
    legB: $('av-legB'), shinB: $('av-shinB'), footB: $('av-footB'),
    armF: $('av-armF'), foreF: $('av-foreF'), armB: $('av-armB'), foreB: $('av-foreB')
  };
  var rwBtn = document.getElementById('rw'), ffBtn = document.getElementById('ff');
  var dotsWrap = document.getElementById('navDots'), label = document.getElementById('navLabel');
  var hint = document.getElementById('hint');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.bg-slide'));
  var slideImgs = slides.map(function (sl) { return sl.querySelector('.bg-img'); });

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header dots */
  var dots = NAMES.map(function (nm, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', nm);
    b.addEventListener('click', function () { setTarget(i); });
    dotsWrap.appendChild(b);
    return b;
  });

  /* ---------- geometry ---------- */
  var W, H, cx, cy, R, apexY, avatarY;
  function geo() {
    W = stage.clientWidth; H = stage.clientHeight;
    cx = W / 2;
    var dh = deck.offsetHeight || 110;
    avatarY = H - Math.max(70, dh / 2 + 22);
    var top = 16, bot = avatarY - dh / 2 - 10;
    apexY = (top + bot) / 2;
    var zoneH = Math.max(220, bot - top);
    root.style.setProperty('--zoneh', zoneH + 'px');
    lastBgRot = null;
    R = Math.max(H * 0.72, W * 0.52);
    cy = apexY + R;
    deck.style.left = cx + 'px'; deck.style.top = avatarY + 'px';
  }

  /* ---------- state ---------- */
  var rot = 0, vel = 0, mode = 'rest', target = 0, hold = 0, dir = 1, phase = 0, lastActive = -1;

  function norm(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
  function clampv(v) { return Math.max(-0.5, Math.min(0.5, v)); }

  function activeIndex() {
    var best = 0, bd = 99;
    for (var i = 0; i < N; i++) { var d = Math.abs(norm(rot + i * STEP)); if (d < bd) { bd = d; best = i; } }
    return best;
  }
  function rotForIndex(i) {
    var want = -i * STEP;
    while (want - rot > Math.PI) want -= Math.PI * 2;
    while (want - rot < -Math.PI) want += Math.PI * 2;
    return want;
  }
  function setTarget(i) { target = rotForIndex(i); mode = 'snap'; }
  function stepN(d) { setTarget(activeIndex() + d); }

  /* ---------- theming + header ---------- */
  function applyAccent(i) {
    var v = getComputedStyle(root).getPropertyValue(ACCENTS[i]).trim();
    if (v) root.style.setProperty('--acc', v);
  }
  function onActive(i) {
    label.textContent = NAMES[i];
    applyAccent(i);
    for (var k = 0; k < N; k++) dots[k].classList.toggle('on', k === i);
  }

  function face(forward) { if (forward) dir = 1; else dir = -1; }

  /* ---------- placement ---------- */
  function place() {
    var act = activeIndex();
    for (var i = 0; i < N; i++) {
      var th = norm(rot + i * STEP), el = tiles[i];
      var p = Math.abs(th) / VIS;
      if (p >= 1) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; el.style.visibility = 'hidden'; continue; }
      el.style.visibility = 'visible';
      var fade = 1 - p * p;
      var x = cx + R * Math.sin(th);
      var y = apexY + R * (1 - Math.cos(th));
      var sc = 0.5 + 0.5 * fade;
      el.style.left = x + 'px'; el.style.top = y + 'px';
      el.style.opacity = fade.toFixed(3);
      el.style.transform = 'translate(-50%,-50%) scale(' + sc.toFixed(3) + ')';
      el.style.zIndex = String(10 + Math.round(fade * 40));
      el.style.pointerEvents = (i === act && Math.abs(th) < STEP * 0.5) ? 'auto' : 'none';
    }
    if (act !== lastActive) { lastActive = act; onActive(act); }
    placeBg();
  }

  /* ---------- background: a filmstrip locked to the wheel ---------- */
  var lastBgRot = null;
  function placeBg() {
    if (rot === lastBgRot) return;
    lastBgRot = rot;
    var span = window.innerWidth * 1.04;
    for (var i = 0; i < slides.length; i++) {
      var u = norm(rot + i * STEP) / STEP, sl = slides[i];
      if (Math.abs(u) >= 1) { sl.style.visibility = 'hidden'; continue; }
      sl.style.visibility = 'visible';
      sl.style.transform = 'translate3d(' + (u * span).toFixed(1) + 'px,0,0)';
      slideImgs[i].style.transform = 'translate3d(' + (-u * span * 0.35).toFixed(1) + 'px,0,0)';
    }
  }
  slides.forEach(function (sl) {
    var src = sl.getAttribute('data-bg');
    if (!src) return;
    var im = new Image();
    im.onload = function () { sl.style.setProperty('--img', 'url("' + src + '")'); sl.classList.add('has-img'); };
    im.src = src;
  });

  /* ---------- runner ----------
     Rig pivots are in the SVG's own units (see the avatar markup in index.html).
     The figure faces right; a positive rotation swings a hanging limb backward. */
  var HIP = [215, 552], KNEE = [217, 695], ANKLE = [217, 826], SHOULDER = [230, 360], ELBOW = [228, 462],
      NECK = [200, 330], FEET = [215, 872];
  var amt = 0, clock = 0, blinkAt = 90, dustTick = 0, sx = 1;
  var wave = 0, waveT = 0, glance = 0, glanceTo = 0, glanceAt = 240;

  function mix(a, b, t) { return a + (b - a) * t; }
  function tf(el, dy, deg, pv) {
    el.setAttribute('transform', 'translate(0 ' + dy.toFixed(2) + ') rotate(' + deg.toFixed(2) + ' ' + pv[0] + ' ' + pv[1] + ')');
  }
  function puff() {
    var d = document.createElement('span');
    d.className = 'dust';
    d.style.setProperty('--dx', (-10 - Math.random() * 12).toFixed(0) + 'px');
    d.style.marginLeft = (-8 + Math.random() * 6).toFixed(0) + 'px';
    runner.appendChild(d);
    setTimeout(function () { d.remove(); }, 600);
  }
  /* Three-quarter head turn. The avatar head is drawn straight-on, so the face slides
     toward the facing side, the far eye and brow narrow, and the far ear tucks behind the
     face. Values are in the head's own 200-unit space; "left" there is the near side. */
  function part(n) { return $('svga-group-' + n); }
  var FACE = [
    [part('eyes-left-move'), 8, 1, 0], [part('eyes-right-move'), 3, 0.8, 119],
    [part('eyebrows-left-move'), 8, 1, 0], [part('eyebrows-right-move'), 4, 0.8, 122],
    [part('glasses-single-move'), 8.5, 0.86, 61.5], [part('nose-single-move'), 12, 1, 0],
    [part('mustache-single-move'), 9, 0.94, 100], [part('mouth-single-move'), 9, 0.94, 100],
    [part('ears-left-move'), 6, 1, 0], [part('ears-right-move'), -13, 1, 0],
    [part('faceshape-wrap'), 3, 1, 0], [$('av-hairback'), -12, 1, 0]   // clone of the front hair, so it inherits its +4.5 slide
  ].filter(function (f) { return f[0]; });
  var turn = 0, headSvg = part('head');
  function turnHead(t) {
    // the whole head narrows a touch as it turns away from straight-on
    headSvg.setAttribute('transform', 'translate(100 0) scale(' + (1 - 0.06 * t).toFixed(3) + ' 1) translate(-100 0)');
    FACE.forEach(function (f) {
      var sc = 1 - (1 - f[2]) * t, cx = f[3];
      f[0].setAttribute('transform', 'translate(' + (f[1] * t).toFixed(2) + ' 0)' +
        (sc < 1 ? ' translate(' + cx + ' 0) scale(' + sc.toFixed(3) + ' 1) translate(' + (-cx) + ' 0)' : ''));
    });
    // near temple: from the frame's hinge (which slides with the face) back to the ear
    if (av.temple) av.temple.setAttribute('d', 'M' + (61.5 + 8.5 * t).toFixed(2) + ' 89.6 L' + (52 + 4 * t).toFixed(2) + ' 92');
  }
  // eye centers for blinking, measured once in the head's own units
  function midY(el) { var b = el.getBBox(); return b.y + b.height / 2; }
  var eyeCY = [midY(av.eyeN), midY(av.eyeF)];
  function blink(on) {
    [av.eyeN, av.eyeF].forEach(function (el, k) {
      if (on) el.setAttribute('transform', 'translate(0 ' + eyeCY[k] + ') scale(1 .1) translate(0 ' + (-eyeCY[k]) + ')');
      else el.removeAttribute('transform');
    });
  }

  function sayHi() { if (!reduce && amt < 0.2) waveT = 130; }

  function runAnim(speed) {
    clock++;
    amt += ((reduce ? 0 : Math.min(1, speed * 14)) - amt) * 0.12;
    if (amt > 0.03) phase += 0.1 + Math.min(speed, 0.6) * 5;
    if (amt > 0.3) waveT = 0;
    if (waveT > 0) waveT--;
    wave += ((waveT > 0 ? 1 : 0) - wave) * 0.14;

    var a = amt, s = Math.sin(phase), c = Math.cos(phase);
    var br = (1 - a) * Math.sin(clock / 42);                 // idle breathing, -1..1

    // legs: thigh swing, knee folds on the forward swing, toe points down on push-off
    tf(av.legF, 0, -34 * s * a, HIP);
    tf(av.shinF, 0, a * (10 + 75 * Math.pow(Math.max(0, c), 1.4)), KNEE);
    tf(av.footF, 0, a * (22 * Math.max(0, -s) - 10 * Math.max(0, s)), ANKLE);
    tf(av.legB, 0, 34 * s * a, HIP);
    tf(av.shinB, 0, a * (10 + 75 * Math.pow(Math.max(0, -c), 1.4)), KNEE);
    tf(av.footB, 0, a * (22 * Math.max(0, s) - 10 * Math.max(0, -s)), ANKLE);

    // arms counter-swing with bent elbows; the front arm blends into a wave
    var armRun = 40 * s * a, foreRun = -(12 + 72 * a) + 12 * c * a;
    var waveFore = -35 + 25 * Math.sin(clock * 0.3);   // arm out to the side, clear of the face
    tf(av.armF, br * 1.5, mix(armRun, -125, wave), SHOULDER);
    tf(av.foreF, 0, mix(foreRun, waveFore, wave), ELBOW);
    tf(av.armB, br * 1.5, -40 * s * a, SHOULDER);
    tf(av.foreB, 0, foreRun, ELBOW);

    // body: lean into the run, bob each stride; head counters the lean and bounces a beat late
    // squash a touch as each foot lands, stretch through the stride
    var squash = 1 - 0.035 * a * (1 - Math.abs(s));
    av.body.setAttribute('transform', 'translate(0 ' + (-16 * a * Math.abs(s)).toFixed(2) + ') rotate(' + (7 * a).toFixed(2) + ' ' + FEET[0] + ' ' + FEET[1] + ')' +
      ' translate(' + FEET[0] + ' ' + FEET[1] + ') scale(1 ' + squash.toFixed(3) + ') translate(' + (-FEET[0]) + ' ' + (-FEET[1]) + ')');
    // brows lift for the wave and when he takes off
    var lift = (-3 * wave - 1.5 * a).toFixed(2);
    if (av.browN) { av.browN.setAttribute('transform', 'translate(0 ' + lift + ')'); av.browF.setAttribute('transform', 'translate(0 ' + lift + ')'); }
    av.torso.setAttribute('transform', 'translate(0 ' + (br * 1.5).toFixed(2) + ')');
    av.collar.setAttribute('transform', 'translate(0 ' + (br * 1.5).toFixed(2) + ')');
    // hair sits between the skull and the face in depth, so it slides less than the face
    if (av.hair) av.hair.setAttribute('transform', 'translate(' + (4.5 * turn).toFixed(2) + ' ' + (1.6 * a * Math.abs(c)).toFixed(2) + ')');

    // face the camera more when idle or waving, more toward the run when running
    turn += ((0.55 + 0.45 * a - 0.25 * wave) - turn) * 0.12;
    turnHead(turn);
    tf(av.head, br * 2.5 + 4 * a * Math.abs(c), -5 * a + 2.5 * Math.sin(phase * 2) * a + 4 * wave, NECK);

    // eyes: look ahead when running, glance around when idle, blink every few seconds
    if (clock >= glanceAt) {
      glanceTo = glanceTo ? 0 : (Math.random() < 0.5 ? -2 : 2.5);
      glanceAt = clock + (glanceTo ? 50 : 200 + Math.random() * 220);
    }
    glance += ((a > 0.2 || wave > 0.2 ? 2 * a : glanceTo) - glance) * 0.2;
    var g = 'translate(' + glance.toFixed(2) + ' 0)';
    av.irisN.setAttribute('transform', g); av.irisF.setAttribute('transform', g);
    if (clock >= blinkAt) {
      blink(true);
      if (clock >= blinkAt + 7) { blink(false); blinkAt = clock + 150 + Math.random() * 180; }
    }

    if (a > 0.6 && ++dustTick % 7 === 0) puff();

    // turning around squashes through zero instead of snapping
    sx = reduce ? dir : sx + (dir - sx) * 0.3;
    runner.style.transform = 'scaleX(' + sx.toFixed(3) + ')';
  }
  runner.addEventListener('pointerenter', sayHi);
  setTimeout(sayHi, 700);

  /* ---------- loop ---------- */
  function frame() {
    var speed = 0;
    if (mode === 'drag') {
      speed = Math.abs(vel);
    } else if (mode === 'hold') {
      vel = clampv(vel + hold * (reduce ? 0.012 : 0.008));
      rot += vel; speed = Math.abs(vel); if (Math.abs(vel) > 0.0008) face(vel < 0);
    } else if (mode === 'free') {
      rot += vel; vel *= (reduce ? 0.8 : 0.92); speed = Math.abs(vel);
      if (Math.abs(vel) > 0.0008) face(vel < 0);
      if (speed < 0.0016) { target = rotForIndex(activeIndex()); mode = 'snap'; }
    } else if (mode === 'snap') {
      var dd = (target - rot) * (reduce ? 0.4 : 0.16);
      rot += dd; speed = Math.abs(dd) * 4; if (Math.abs(dd) > 0.0008) face(dd < 0);
      if (Math.abs(target - rot) < 0.0005) { rot = target; vel = 0; speed = 0; mode = 'rest'; if (activeIndex() === N - 1) setTimeout(sayHi, 250); }
    }
    runAnim(speed);
    place();
    requestAnimationFrame(frame);
  }

  /* ---------- pointer: drag / swipe ---------- */
  var K = 0.0042;
  var downX = 0, downY = 0, lastX = 0, downT = 0, axis = 0, dragging = false, captured = false, pid = null, justDragged = false, moved = 0;

  function blocked(t) { return t.closest('input,textarea,select,button'); }

  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (blocked(e.target)) return;
    downX = lastX = e.clientX; downY = e.clientY; downT = Date.now();
    axis = 0; dragging = true; captured = false; pid = e.pointerId; moved = 0; vel = 0;
  });

  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var mx = e.clientX - downX, my = e.clientY - downY;
    if (axis === 0) {
      if (Math.abs(mx) > 6 || Math.abs(my) > 6) axis = (Math.abs(mx) > Math.abs(my)) ? 1 : -1; else return;
      if (axis === -1) {                                  // vertical
        var act = tiles[activeIndex()];
        if (act && act.scrollHeight > act.clientHeight + 2) { dragging = false; return; } // let the card scroll
        dragging = false; return;
      }
    }
    if (axis !== 1) return;
    if (!captured) { try { stage.setPointerCapture(pid); } catch (_) {} captured = true; mode = 'drag'; }
    e.preventDefault();
    var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    var dd = dx * K; rot += dd; vel = dd; if (Math.abs(dd) > 0.0008) face(dd < 0);
  });

  function release(e) {
    if (!dragging) return;
    dragging = false;
    if (captured) { try { stage.releasePointerCapture(pid); } catch (_) {} captured = false; }
    if (axis === 1) {
      mode = 'free';
      if (moved > 6) { justDragged = true; setTimeout(function () { justDragged = false; }, 60); }
    }
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('click', function (e) { if (justDragged) { e.preventDefault(); e.stopPropagation(); } }, true);

  /* ---------- wheel / trackpad ---------- */
  var lastWheel = 0;
  stage.addEventListener('wheel', function (e) {
    var now = Date.now(), horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (!horiz) {
      var act = tiles[activeIndex()];
      if (act && act.scrollHeight > act.clientHeight + 2) return;   // let the card scroll
    }
    var d = horiz ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 8) return;
    e.preventDefault();
    if (now - lastWheel > 300) { stepN(d > 0 ? 1 : -1); lastWheel = now; }
  }, { passive: false });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    var a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stepN(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stepN(-1); }
    else if (e.key === 'Home') { e.preventDefault(); setTarget(0); }
    else if (e.key === 'End') { e.preventDefault(); setTarget(N - 1); }
  });

  /* ---------- rewind / fast-forward (tap = step, hold = spin) ---------- */
  function bindHold(btn, d) {
    var t = null;
    function down(e) {
      e.preventDefault(); btn.classList.add('live');
      stepN(d);
      t = setTimeout(function () { hold = -d; mode = 'hold'; }, 280);
      try { btn.setPointerCapture(e.pointerId); } catch (_) {}
    }
    function up() {
      btn.classList.remove('live');
      if (t) { clearTimeout(t); t = null; }
      if (mode === 'hold') { hold = 0; mode = 'free'; }
    }
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  }
  bindHold(ffBtn, 1);
  bindHold(rwBtn, -1);

  /* ---------- data-go links ---------- */
  document.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); setTarget(parseInt(el.dataset.go, 10)); });
  });

  /* ---------- hide hint after first move ---------- */
  ['pointerdown', 'keydown', 'wheel'].forEach(function (ev) {
    window.addEventListener(ev, function once() { if (hint) hint.style.opacity = '0'; window.removeEventListener(ev, once); }, { passive: true });
  });

  /* ---------- resize ---------- */
  window.addEventListener('resize', geo);
  window.addEventListener('orientationchange', geo);
  window.addEventListener('hashchange', function () {
    var idx = NAMES.findIndex(function (nm) { return '#' + nm.toLowerCase() === location.hash.toLowerCase(); });
    if (idx >= 0) setTarget(idx);
  });
  if (window.visualViewport) visualViewport.addEventListener('resize', geo);

  /* ============================================================
     CONTACT FORM — Web3Forms + spam protection
     ============================================================ */
  var form = document.getElementById('cform');
  if (form) {
    var status = document.getElementById('fstatus'), btn = document.getElementById('fsubmit'), loadTime = Date.now();
    function getLog() { try { return JSON.parse(sessionStorage.getItem('_cit_sl') || '[]'); } catch (_) { return []; } }
    function rec() { var l = getLog(); l.push(Date.now()); sessionStorage.setItem('_cit_sl', JSON.stringify(l.slice(-5))); }
    function tooMany() { return getLog().filter(function (t) { return Date.now() - t < 36e5; }).length >= 3; }
    function st(m, err) { status.textContent = m; status.style.color = err ? 'var(--orange)' : 'var(--acc)'; status.style.opacity = '1'; if (!err) setTimeout(function () { status.style.opacity = '0'; }, 6000); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('[name="botcheck"]').checked) return;
      if (Date.now() - loadTime < 3000) return;
      if (tooMany()) { st('✕ Too many submissions. Try again later.', true); return; }
      var name = form.querySelector('[name="name"]').value.trim(),
          email = form.querySelector('[name="email"]').value.trim(),
          msg = form.querySelector('[name="message"]').value.trim();
      if (!name || !email || !msg) { st('✕ Please fill in all fields.', true); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { st('✕ Check your email address.', true); return; }
      if (msg.length < 20) { st('✕ Tell me a bit more about your project.', true); return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      var data = new FormData(form); data.set('name', name); data.set('email', email); data.set('message', msg);
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j.success) { rec(); st("✓ Sent. I'll be in touch soon.", false); form.reset(); } else { st('✕ Something went wrong. Try again.', true); } })
        .catch(function () { st('✕ Network error. Check your connection.', true); })
        .finally(function () { btn.disabled = false; btn.textContent = 'Send it →'; });
    });
  }

  /* ---------- latest blog post (static fallback lives in the HTML) ---------- */
  var latest = document.getElementById('latest');
  if (latest && window.fetch) {
    fetch('blog/data/posts.json')
      .then(function (r) { return r.json(); })
      .then(function (posts) {
        posts.sort(function (a, b) { return b.date.localeCompare(a.date); });
        var p = posts[0]; if (!p) return;
        var d = new Date(p.date + 'T12:00:00');
        latest.href = '/blog/posts/' + p.slug + '.html';
        document.getElementById('latestTitle').textContent = p.title;
        document.getElementById('latestDate').textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      })
      .catch(function () {});
  }

  /* ---------- init ---------- */
  geo();
  (function initFromHash() {
    var idx = NAMES.findIndex(function (nm) { return '#' + nm.toLowerCase() === location.hash.toLowerCase(); });
    if (idx > 0) { rot = target = rotForIndex(idx); onActive(idx); }
    else { onActive(0); }
  })();
  place();
  requestAnimationFrame(frame);
})();