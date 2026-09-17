// ===== INTRO ANIMATION =====
  // Dismissible at any time, and shown once per browser session rather than
  // on every page load — nobody should be gated behind the same animation twice.
  const introOverlay = document.getElementById('introOverlay');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let introSeen = false;
  try { introSeen = sessionStorage.getItem('tw_intro') === '1'; } catch (e) {}

  if (introOverlay) {
    // skip it when arriving for a specific section (e.g. a Quote link from another page),
    // since the intro locks scrolling and would stop the jump to that section
    if (prefersReduced || introSeen || location.hash) {
      introOverlay.remove();
    } else {
      try { sessionStorage.setItem('tw_intro', '1'); } catch (e) {}
      document.documentElement.style.overflow = 'hidden';

      let dismissed = false;
      const dismissIntro = () => {
        if (dismissed) return;
        dismissed = true;
        introOverlay.classList.add('hide');
        document.documentElement.style.overflow = '';
        window.removeEventListener('keydown', dismissIntro);
        window.removeEventListener('wheel', dismissIntro);
        window.removeEventListener('touchstart', dismissIntro);
        window.setTimeout(() => introOverlay.remove(), 650);
      };

      introOverlay.addEventListener('click', dismissIntro);
      window.addEventListener('keydown', dismissIntro);
      window.addEventListener('wheel', dismissIntro, { passive: true });
      window.addEventListener('touchstart', dismissIntro, { passive: true });

      // shortened from 2600ms — the sequence resolves by ~1.4s
      window.setTimeout(dismissIntro, 2100);
    }
  }

  // ===== MOBILE NAV =====
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const mqMobileNav = window.matchMedia('(max-width: 1080px)');

  // Keep collapsed links out of the tab order. Without this, keyboard and
  // switch-control users tab into four invisible links.
  const syncNavInert = () => {
    const collapsed = mqMobileNav.matches && !navLinks.classList.contains('open');
    navLinks.inert = collapsed;
    navLinks.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
  };

  const setNav = (open) => {
    navLinks.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    syncNavInert();
  };

  navToggle.addEventListener('click', () => setNav(!navLinks.classList.contains('open')));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNav(false)));

  // Escape closes the menu and returns focus to the toggle
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      setNav(false);
      navToggle.focus();
    }
  });

  mqMobileNav.addEventListener('change', () => setNav(false));
  syncNavInert();

  // Drive the mobile menu's top offset from the real header height
  const header = document.querySelector('header');
  const syncHeaderHeight = () => {
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  };
  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);

  // ===== HERO VIDEO =====
  // Picks the encode that matches the viewport so phones don't pull the 3.3MB
  // desktop file, and drops to the poster frame entirely under reduced-motion
  // or Save-Data.
  (function initHeroVideo(){
    const video = document.getElementById('heroVideo');
    const poster = document.getElementById('heroPoster');
    if (!video) return;

    const saveData = navigator.connection && navigator.connection.saveData;
    if (prefersReduced || saveData) {
      video.remove();
      poster.hidden = false;
      return;
    }

    const variant = window.matchMedia('(max-width: 760px)').matches ? 'mobile' : 'desktop';
    [['webm','video/webm'],['mp4','video/mp4']].forEach(([ext, type]) => {
      const s = document.createElement('source');
      s.src = 'assets/hero-' + variant + '.' + ext;
      s.type = type;
      video.appendChild(s);
    });
    // preload="none" + sources appended after parse means the autoplay
    // attribute alone won't start it, and play() before any data buffers is
    // rejected — so wait for the first frame, then kick it.
    video.addEventListener('loadeddata', () => { video.play().catch(() => {}); }, { once: true });
    video.load();

    // if it can't play at all, fall back to the still
    video.addEventListener('error', () => { video.remove(); poster.hidden = false; }, true);

    // don't burn battery decoding frames nobody can see
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    });
  })();

  // ===== STAT COUNTERS =====
  // Numbers roll up once, when the card first scrolls into view.
  (function initCounters(){
    const nums = document.querySelectorAll('[data-count-to]');
    // non-numeric stats ("Zero") can't roll — fade them in on the same beat
    const words = document.querySelectorAll('[data-count-word]');
    if (!nums.length && !words.length) return;

    // thousands separators, so 24600 reads as 24,600
    const fmt = (n) => n.toLocaleString('en-CA');

    const run = (el) => {
      const target = parseInt(el.dataset.countTo, 10);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const paint = (n) => { el.textContent = prefix + fmt(n) + suffix; };
      if (prefersReduced) { paint(target); return; }

      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        // ease-out cubic: fast off the line, settles onto the number
        const eased = 1 - Math.pow(1 - p, 3);
        paint(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    words.forEach(w => { if (!prefersReduced) { w.style.opacity = '0'; w.style.transition = 'opacity .6s ease'; } });

    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        if (e.target.hasAttribute('data-count-word')) e.target.style.opacity = '1';
        else run(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -15% 0px' });
    [...nums, ...words].forEach(n => cio.observe(n));
  })();

  // ===== R-VALUE BARS =====
  // Bars grow from zero when the comparison scrolls into view, so the
  // difference between the two walls reads as a movement, not a static graphic.
  (function initBars(){
    const bars = document.querySelectorAll('[data-bar]');
    if (!bars.length) return;

    const fill = (el) => {
      const pct = el.dataset.bar + '%';
      if (prefersReduced) { el.style.transition = 'none'; el.style.width = pct; return; }
      requestAnimationFrame(() => { el.style.width = pct; });
    };

    const bio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { fill(e.target); bio.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    bars.forEach(b => bio.observe(b));
  })();

  // ===== CONTACT FORM =====
  // Inline validation + status, no blocking alert(). The submit handler is the
  // single place to swap in the real backend.
  const quoteForm = document.getElementById('quoteForm');
  const formStatus = document.getElementById('formStatus');
  const quoteSubmit = document.getElementById('quoteSubmit');

  // project pages share this script but carry no form
  if (quoteForm) {

  const showStatus = (msg, kind) => {
    formStatus.textContent = msg;
    formStatus.className = 'form-status ' + kind;
    formStatus.hidden = false;
  };

  quoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = quoteForm.name.value.trim();
    const email = quoteForm.email.value.trim();
    const message = quoteForm.message.value.trim();

    if (!name || !email || !message) {
      showStatus('Please fill in every field so we can get back to you.', 'err');
      (!name ? quoteForm.name : !email ? quoteForm.email : quoteForm.message).focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus('That email address doesn\'t look right — mind checking it?', 'err');
      quoteForm.email.focus();
      return;
    }

    // ---------------------------------------------------------------
    // No backend is connected yet. Rather than claim a send that didn't
    // happen, hand the visitor a mailto: they can actually complete.
    // When the backend lands, replace this block with the POST and
    // restore the "your inquiry is in" success message.
    // ---------------------------------------------------------------
    const subject = encodeURIComponent((quoteForm.dataset.interest ? quoteForm.dataset.interest + ' — ' : '') + 'Project inquiry from ' + name);
    const body = encodeURIComponent(message + '\n\n— ' + name + '\n' + email);
    window.location.href = 'mailto:marc@titanwall.com?subject=' + subject + '&body=' + body;
    showStatus('Opening your email app with this inquiry ready to send. If nothing happens, email marc@titanwall.com directly.', 'ok');
  });

  } // end form guard

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // ===== R-VALUE CORE SELECTOR =====
  // The EPS / GPS swatches set data-core on the section; CSS swaps the core
  // texture in every cutaway and highlights the matching R-values.
  (function initCoreSelector(){
    const rv = document.querySelector('.rv[data-core]');
    if (!rv) return;
    const buttons = rv.querySelectorAll('[data-set-core]');
    const label = rv.querySelector('[data-core-label]');
    buttons.forEach(btn => btn.addEventListener('click', () => {
      const core = btn.dataset.setCore;
      rv.dataset.core = core;
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      if (label) label.textContent = core.toUpperCase();
    }));
  })();

  // ===== INSIDE THE BUILD: X-RAY WALKTHROUGH =====
  // The building stays pinned while the steps scroll past; whichever step sits
  // nearest the reading line lights up its part of the building. The numbered
  // pins on the building jump to the matching step.
  (function initXray(){
    const xray = document.querySelector('.xray');
    if (!xray) return;
    const steps = [...xray.querySelectorAll('.xr-step')];
    const pins = [...xray.querySelectorAll('.xr-pin')];
    const dims = [...xray.querySelectorAll('.xr-dim')];
    const outs = [...xray.querySelectorAll('.xr-out')];
    const phone = window.matchMedia('(max-width: 760px)');
    // mid-screen on desktop; on phones, below the pinned building
    const readingLine = () => window.innerHeight * (phone.matches ? 0.74 : 0.5);
    let current;

    const activate = (zone) => {
      if (zone === current) return;
      current = zone;
      xray.dataset.active = zone || '';
      steps.forEach(s => s.classList.toggle('is-active', s.dataset.zone === zone));
      pins.forEach(p => p.setAttribute('aria-pressed', String(p.dataset.zone === zone)));
      dims.forEach(d => d.classList.toggle('on', d.dataset.zone === zone));
      outs.forEach(o => o.classList.toggle('on', o.dataset.zone === zone));
    };

    let ticking = false;
    const update = () => {
      ticking = false;
      const line = readingLine();
      const first = steps[0].getBoundingClientRect();
      const last = steps[steps.length - 1].getBoundingClientRect();
      if (first.top > line || last.bottom < line) { activate(null); return; }
      let best = null, bestDist = Infinity;
      steps.forEach(s => {
        const r = s.getBoundingClientRect();
        const d = Math.abs((r.top + r.bottom) / 2 - line);
        if (d < bestDist) { bestDist = d; best = s; }
      });
      activate(best.dataset.zone);
    };
    const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();

    pins.forEach(pin => pin.addEventListener('click', () => {
      const step = steps.find(s => s.dataset.zone === pin.dataset.zone);
      if (!step) return;
      const r = step.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + r.top + r.height / 2 - readingLine(),
        behavior: prefersReduced ? 'auto' : 'smooth'
      });
      activate(pin.dataset.zone);
    }));
  })();

  // ===== BASE PLATE STEP-THROUGH =====
  // The drawing builds up with each step; component chips highlight their part.
  // Without JS the section shows the finished drawing and every step as a list.
  (function initBasePlate(){
    const bp = document.querySelector('.bp');
    if (!bp) return;
    bp.classList.add('js');

    const stage = bp.querySelector('.bp-stage');
    const tabs = [...bp.querySelectorAll('[role="tab"]')];
    const panels = [...bp.querySelectorAll('.bp-step')];
    const prev = bp.querySelector('.bp-prev');
    const next = bp.querySelector('.bp-next');
    const num = bp.querySelector('[data-bp-num]');
    const bars = [...bp.querySelectorAll('.bp-progress i')];
    const chips = [...bp.querySelectorAll('.bp-chip')];
    const LAST = tabs.length;
    let step = 1;

    const clearHighlight = () => {
      stage.removeAttribute('data-hl');
      chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
    };

    const setStep = (n, opts = {}) => {
      step = Math.max(1, Math.min(LAST, n));
      bp.dataset.step = stage.dataset.step = step;
      stage.querySelectorAll('[data-from]').forEach(g => {
        const from = +g.dataset.from;
        g.classList.toggle('on', from <= step);
        g.classList.toggle('now', from === step);
      });
      stage.querySelectorAll('[data-only]').forEach(g => g.classList.toggle('on', +g.dataset.only === step));
      // restart this step's entrance animation
      stage.classList.remove('play'); void stage.offsetWidth; stage.classList.add('play');

      tabs.forEach((t, i) => {
        const selected = i + 1 === step;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        t.classList.toggle('done', i + 1 < step);
      });
      panels.forEach((p, i) => p.classList.toggle('is-on', i + 1 === step));
      bars.forEach((b, i) => b.classList.toggle('on', i < step));
      num.textContent = String(step).padStart(2, '0');
      prev.disabled = step === 1;
      next.innerHTML = step === LAST ? 'Start over &#8634;' : 'Next step &#8594;';
      if (opts.focus) tabs[step - 1].focus();
      if (!opts.keepHighlight) clearHighlight();
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => setStep(i + 1));
      t.addEventListener('keydown', (e) => {
        const to = { ArrowRight: i + 2, ArrowLeft: i, Home: 1, End: LAST }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        setStep(to > LAST ? 1 : to < 1 ? LAST : to, { focus: true });
      });
    });
    prev.addEventListener('click', () => setStep(step - 1));
    next.addEventListener('click', () => setStep(step === LAST ? 1 : step + 1));

    chips.forEach(chip => chip.addEventListener('click', () => {
      if (chip.getAttribute('aria-pressed') === 'true') { clearHighlight(); return; }
      if (step < LAST) setStep(LAST, { keepHighlight: true });   // every part exists on the last step
      stage.dataset.hl = chip.dataset.part;
      chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    }));

    setStep(1);
    // replay step 1 the first time the section comes into view
    const seen = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { if (step === 1) setStep(1); seen.disconnect(); }
    }, { threshold: 0.35 });
    seen.observe(stage);
  })();

  // ===== EXPANDING CARD GRIDS =====
  // One detail panel open at a time, placed directly under the row of the card
  // that opened it (so on phones it sits right under the card you tapped).
  document.querySelectorAll('[data-xp]').forEach(grid => {
    const cards = [...grid.querySelectorAll('.xp-card')];
    const panels = cards.map(c => document.getElementById(c.getAttribute('aria-controls')));
    let openIdx = -1;

    const columns = () => getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
    const place = () => {
      const cols = columns();
      cards.forEach((c, i) => { c.style.order = i * 10; });
      panels.forEach((p, i) => {
        const rowEnd = Math.min(cards.length - 1, Math.floor(i / cols) * cols + cols - 1);
        p.style.order = rowEnd * 10 + 5;
      });
    };

    const close = () => {
      if (openIdx < 0) return;
      cards[openIdx].setAttribute('aria-expanded', 'false');
      panels[openIdx].hidden = true;
      openIdx = -1;
    };
    const open = (i) => {
      close();
      openIdx = i;
      cards[i].setAttribute('aria-expanded', 'true');
      panels[i].hidden = false;
      const r = panels[i].getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) {
        panels[i].scrollIntoView({ block: 'nearest', behavior: prefersReduced ? 'auto' : 'smooth' });
      }
    };

    cards.forEach((c, i) => c.addEventListener('click', () => (openIdx === i ? close() : open(i))));
    grid.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && openIdx >= 0) { const c = cards[openIdx]; close(); c.focus(); }
    });
    place();
    window.addEventListener('resize', place);
  });

  // ===== ACCORDIONS =====
  document.querySelectorAll('.xp-acc').forEach(acc => {
    const items = [...acc.querySelectorAll('.process-step')];
    items.forEach(item => {
      const btn = item.querySelector('.ps-toggle');
      const body = item.querySelector('.ps-body');
      btn.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        items.forEach(other => {
          const on = other === item && willOpen;
          other.classList.toggle('is-open', on);
          other.querySelector('.ps-toggle').setAttribute('aria-expanded', String(on));
          other.querySelector('.ps-body').inert = !on;
        });
        if (willOpen) body.querySelector('img')?.setAttribute('loading', 'eager');
        // keep the clicked step still while the one above it collapses
        const top0 = btn.getBoundingClientRect().top;
        const t0 = performance.now();
        const hold = () => {
          const d = btn.getBoundingClientRect().top - top0;
          if (Math.abs(d) > 0.5) window.scrollBy(0, d);
          if (performance.now() - t0 < 520) requestAnimationFrame(hold);
        };
        requestAnimationFrame(hold);
      });
    });
  });

  // ===== "ASK ABOUT THIS" → QUOTE FORM =====
  // Links carry ?interest=...; on the homepage the topic is shown above the
  // form and seeded into the message. Same-page links skip the reload.
  (function initInterest(){
    const form = document.getElementById('quoteForm');
    if (!form) return;
    const chip = document.getElementById('formInterest');
    const label = chip.querySelector('b');
    let seeded = '';

    const apply = (topic, flash) => {
      topic = (topic || '').trim().slice(0, 80);
      if (!topic) return;
      label.textContent = topic;
      chip.hidden = false;
      form.dataset.interest = topic;
      const msg = form.message;
      const line = `I'd like to ask about ${topic}.`;
      if (!msg.value.trim() || msg.value === seeded) { msg.value = line + '\n\n'; seeded = msg.value; }
      if (flash) { chip.classList.remove('form-flash'); void chip.offsetWidth; chip.classList.add('form-flash'); }
    };
    chip.querySelector('button').addEventListener('click', () => {
      chip.hidden = true; delete form.dataset.interest;
      if (form.message.value === seeded) form.message.value = '';
      seeded = '';
      const url = new URL(location.href); url.searchParams.delete('interest'); history.replaceState(null, '', url);
    });

    const fromUrl = new URLSearchParams(location.search).get('interest');
    if (fromUrl) apply(fromUrl, true);

    document.querySelectorAll('a[data-interest]').forEach(a => a.addEventListener('click', (e) => {
      e.preventDefault();
      apply(a.dataset.interest, true);
      document.getElementById('contact').scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
      setTimeout(() => form.name.focus({ preventScroll: true }), prefersReduced ? 0 : 650);
    }));
  })();

  // =====================================================================
  // ROUND 2 INTERACTIONS
  // =====================================================================
  const smooth = () => (prefersReduced ? 'auto' : 'smooth');
  // radio-style segmented control: returns a setter
  const radioGroup = (buttons, onChange) => {
    const set = (btn, fire = true) => {
      buttons.forEach(b => b.setAttribute('aria-checked', String(b === btn)));
      if (fire) onChange(btn);
    };
    buttons.forEach(b => b.addEventListener('click', () => set(b)));
    return set;
  };

  // ---- #1 exploded drawing: find a part ----
  (function initExploded(){
    const wrap = document.querySelector('[data-ex]');
    if (!wrap) return;
    const btns = [...document.querySelectorAll('.ex-hl')];
    const zones = [...wrap.querySelectorAll('[data-zone]')];
    let current = null;
    const show = (btn) => {
      current = btn;
      btns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      if (!btn) { wrap.removeAttribute('data-hl'); zones.forEach(z => z.classList.remove('on')); return; }
      const want = btn.dataset.hl.split(' ');
      wrap.dataset.hl = btn.dataset.hl;
      zones.forEach(z => z.classList.toggle('on', want.includes(z.dataset.zone)));
    };
    btns.forEach(b => {
      b.addEventListener('click', () => show(current === b ? null : b));
      // preview on hover for mouse users, without losing a click-selected part
      b.addEventListener('mouseenter', () => { if (!current) { const w = b.dataset.hl.split(' '); wrap.dataset.hl = b.dataset.hl; zones.forEach(z => z.classList.toggle('on', w.includes(z.dataset.zone))); } });
      b.addEventListener('mouseleave', () => { if (!current) show(null); });
    });
  })();

  // ---- #5 comparison table ----
  (function initCompare(){
    const ctl = document.querySelector('[data-cmp-controls]');
    if (!ctl) return;
    const table = document.querySelector('.cmp-table');
    const diff = ctl.querySelector('[data-cmp-diff]');
    const rows = [...table.tBodies[0].rows];
    const markOf = (cell) => (cell.querySelector('.mark') || {}).className || cell.textContent;
    const apply = () => {
      const show = table.dataset.show;
      rows.forEach(r => {
        const own = markOf(r.cells[1]), osb = markOf(r.cells[2]), stick = markOf(r.cells[3]);
        const same = show === 'osb' ? own === osb : show === 'stick' ? own === stick : (own === osb && own === stick);
        r.classList.toggle('is-filtered-out', diff.checked && same);
      });
    };
    radioGroup([...ctl.querySelectorAll('[data-cmp]')], (b) => { table.dataset.show = b.dataset.cmp; apply(); });
    diff.addEventListener('change', apply);
  })();

  // ---- #6 thickness picker ----
  (function initThickness(){
    const tp = document.querySelector('[data-tp]');
    if (!tp) return;
    const DATA = {
      '4.5':  { eps: 16, gps: null, uses: 'Cladding, fences, and interior walls' },
      '6.5':  { eps: 23, gps: 29, uses: 'Cladding, exterior walls, basement floors' },
      '8.5':  { eps: 29, gps: 38, uses: 'Basement walls, larger shop walls, roofs' },
      '10.25':{ eps: 37, gps: 48, uses: 'Roofs' },
    };
    const table = document.querySelector('.tp-table');
    const rows = table ? [...table.tBodies[0].rows] : [];
    const tBtns = [...tp.querySelectorAll('[data-t]')];
    const cBtns = [...tp.querySelectorAll('[data-c]')];
    const rv = tp.querySelector('[data-tp-rv]'), sub = tp.querySelector('[data-tp-sub]');
    const bar = tp.querySelector('[data-tp-bar]'), uses = tp.querySelector('[data-tp-uses]');
    let t = '6.5', c = 'eps';
    const render = () => {
      const d = DATA[t]; const val = d[c];
      rv.textContent = val ? 'R-' + val : 'Not listed';
      sub.textContent = `${t}″ panel · ${c.toUpperCase()} core` + (val ? '' : ' — GPS isn’t listed at this thickness');
      bar.style.width = val ? (val / 48 * 100) + '%' : '0%';
      uses.textContent = d.uses;
      rows.forEach(r => r.classList.toggle('is-sel', r.cells[0].textContent.trim() === t + ' in'));
    };
    const setT = radioGroup(tBtns, (b) => { t = b.dataset.t; render(); });
    radioGroup(cBtns, (b) => { c = b.dataset.c; render(); });
    rows.forEach(r => r.addEventListener('click', () => {
      const val = r.cells[0].textContent.trim().replace(' in', '');
      const btn = tBtns.find(b => b.dataset.t === val); if (btn) setT(btn);
    }));
    render();
  })();

  // ---- #7 stat cards that open an application panel ----
  document.querySelectorAll('a[data-open-app]').forEach(a => a.addEventListener('click', (e) => {
    const card = document.getElementById('app-card-' + a.dataset.openApp);
    if (!card) return;
    e.preventDefault();
    if (card.getAttribute('aria-expanded') !== 'true') card.click();
    card.scrollIntoView({ block: 'start', behavior: smooth() });
  }));

  // ---- #8 fire photo halves + badge explanations ----
  (function initHalves(){
    const box = document.querySelector('[data-halves]');
    if (!box) return;
    const halves = [...box.querySelectorAll('[data-half]')];
    halves.forEach(h => h.addEventListener('click', () => {
      const on = box.dataset.focus !== h.dataset.half;
      box.dataset.focus = on ? h.dataset.half : '';
      halves.forEach(x => x.setAttribute('aria-pressed', String(on && x === h)));
    }));
  })();
  (function initBadges(){
    const wrap = document.querySelector('[data-badges]');
    if (!wrap) return;
    const info = document.getElementById('badge-info');
    const btns = [...wrap.querySelectorAll('[data-info]')];
    btns.forEach(b => b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      btns.forEach(x => x.setAttribute('aria-expanded', String(open && x === b)));
      info.hidden = !open;
      info.querySelectorAll('[data-for]').forEach(p => { p.hidden = p.dataset.for !== b.dataset.info; });
    }));
  })();

  // ---- #9 / #19 filter chips ----
  document.querySelectorAll('[data-filter-for]').forEach(group => {
    const target = document.getElementById(group.dataset.filterFor);
    if (!target) return;
    const items = [...target.querySelectorAll('[data-cat]')];
    const btns = [...group.querySelectorAll('[data-filter]')];
    btns.forEach(b => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      items.forEach(it => {
        const hide = f !== 'all' && it.dataset.cat !== f;
        const wasHidden = it.classList.contains('is-filtered-out');
        it.classList.toggle('is-filtered-out', hide);
        if (!hide && wasHidden) { it.classList.remove('just-shown'); void it.offsetWidth; it.classList.add('just-shown'); }
      });
    }));
  });

  // ---- #10 reels in a pop-up (Instagram loads only when someone chooses to watch) ----
  (function initReels(){
    const reels = document.querySelectorAll('a[data-reel]');
    if (!reels.length || typeof HTMLDialogElement === 'undefined') return;
    const dlg = document.createElement('dialog');
    dlg.className = 'reel-dialog';
    dlg.setAttribute('aria-label', 'Instagram reel');
    dlg.innerHTML = '<div class="rd-bar"><a target="_blank" rel="noopener" data-rd-link>Open on Instagram &#8599;</a><button type="button" class="rd-close" aria-label="Close">&times;</button></div><div class="rd-frame"></div>';
    document.body.appendChild(dlg);
    const frame = dlg.querySelector('.rd-frame');
    // empty the frame as well as closing, so a playing reel stops immediately
    const close = () => { frame.innerHTML = ''; if (dlg.open) dlg.close(); };
    dlg.querySelector('.rd-close').addEventListener('click', close);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => { frame.innerHTML = ''; });   // Esc closes without calling close()
    reels.forEach(a => a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      const id = a.dataset.reel;
      dlg.querySelector('[data-rd-link]').href = a.href;
      frame.innerHTML = `<iframe src="https://www.instagram.com/p/${encodeURIComponent(id)}/embed/" title="Titanwall reel on Instagram" allowfullscreen loading="eager"></iframe>`;
      dlg.showModal();
    }));
  })();

  // ---- #11 on-site clip: plays in view, pauses out of view, button overrides ----
  document.querySelectorAll('[data-clip]').forEach(clip => {
    const v = clip.querySelector('video');
    const btn = clip.querySelector('.clip-btn');
    let userPaused = prefersReduced;
    const state = (playing) => { btn.dataset.state = playing ? 'playing' : 'paused'; btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video'); };
    const play = () => { v.play().then(() => state(true)).catch(() => state(false)); };
    btn.addEventListener('click', () => {
      if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); state(false); }
    });
    new IntersectionObserver((entries) => entries.forEach(e => {
      if (e.isIntersecting && !userPaused) play();
      else if (!e.isIntersecting && !v.paused) { v.pause(); state(false); }
    }), { threshold: 0.5 }).observe(clip);
  });

  // ---- #16 on-this-page menu with the current section highlighted ----
  (function initPageMenu(){
    const menu = document.querySelector('.page-menu');
    if (!menu) return;
    const links = [...menu.querySelectorAll('a')];
    const targets = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const offset = () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72) + menu.offsetHeight + 16;
    const setPad = () => { document.documentElement.style.scrollPaddingTop = offset() + 'px'; };
    setPad(); window.addEventListener('resize', setPad);
    let ticking = false;
    const spy = () => {
      ticking = false;
      const line = offset() + 40;
      let cur = null;
      targets.forEach((t, i) => { if (t.getBoundingClientRect().top <= line) cur = i; });
      links.forEach((a, i) => { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      if (cur !== null) {
        const a = links[cur], ul = a.parentElement.parentElement;
        const l = a.offsetLeft, r = l + a.offsetWidth;
        if (l < ul.scrollLeft || r > ul.scrollLeft + ul.clientWidth) ul.scrollTo({ left: l - 16, behavior: smooth() });
      }
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  })();

  // ---- #13 five-layer panel ----
  (function initLayers(){
    const fig = document.querySelector('[data-fl]');
    if (!fig) return;
    const btns = [...document.querySelectorAll('[data-fl-list] [data-layer]')];
    const select = (layer) => {
      const on = fig.dataset.sel !== layer;
      if (on) fig.dataset.sel = layer; else delete fig.dataset.sel;
      btns.forEach(b => b.setAttribute('aria-pressed', String(on && b.dataset.layer === layer)));
    };
    btns.forEach(b => b.addEventListener('click', () => select(b.dataset.layer)));
    fig.querySelectorAll('.fl-layer').forEach(g => g.addEventListener('click', () => select(g.dataset.layer)));
  })();

  // ---- #15 chase steps light up their spot ----
  (function initPins(){
    const steps = document.querySelector('[data-pins-steps]');
    const img = document.querySelector('[data-pins]');
    if (!steps || !img) return;
    const btns = [...steps.querySelectorAll('[data-pin]')];
    const spots = [...img.querySelectorAll('[data-spot]')];
    const set = (n) => {
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pin === n)));
      spots.forEach(s => s.classList.toggle('on', s.dataset.spot === n));
    };
    btns.forEach(b => b.addEventListener('click', () => set(b.getAttribute('aria-pressed') === 'true' ? null : b.dataset.pin)));
    set('1');
  })();

  // ---- #17 floor system: lift a layer, rebuild the stack ----
  (function initStack(){
    const fig = document.querySelector('.pk-fig');
    if (!fig) return;
    const layers = [...fig.querySelectorAll('.pk-layer')];          // index 0 = layer 1 (bottom)
    const btns = [...fig.querySelectorAll('[data-lift]')];
    btns.forEach(b => b.addEventListener('click', () => {
      const n = +b.dataset.lift;
      const on = b.getAttribute('aria-pressed') !== 'true';
      btns.forEach(x => x.setAttribute('aria-pressed', String(on && x === b)));
      layers.forEach((g, i) => g.classList.toggle('lifted', on && i === n - 1));
      if (on) fig.dataset.lift = n; else delete fig.dataset.lift;
    }));
    const rebuild = fig.querySelector('[data-rebuild]');
    if (rebuild) rebuild.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-pressed', 'false'));
      layers.forEach(g => g.classList.remove('lifted'));
      delete fig.dataset.lift;
      fig.classList.remove('in'); void fig.offsetWidth; fig.classList.add('in');
    });
  })();

  // ---- #18 finished / structure view ----
  (function initXrayView(){
    const xray = document.querySelector('.xray');
    const btns = [...document.querySelectorAll('.xr-view [data-view]')];
    if (!xray || !btns.length) return;
    btns.forEach(b => b.addEventListener('click', () => {
      xray.dataset.view = b.dataset.view;
      btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    }));
  })();

  // ---- #20 cost calculator ----
  (function initCalc(){
    const calc = document.querySelector('[data-calc]');
    if (!calc) return;
    // brochure example: 1,500 sq ft home — $10,600 build saving, $1,400 a year energy saving
    const BASE = 1500, BUILD = 10600, ENERGY = 1400;
    const money = (n) => '$' + (Math.round(n / 100) * 100).toLocaleString('en-CA');
    const out = (k) => calc.querySelector(`[data-o="${k}"]`);
    const size = calc.querySelector('[data-in="size"]'), years = calc.querySelector('[data-in="years"]');
    const render = () => {
      const k = +size.value / BASE, y = +years.value;
      const build = BUILD * k, energy = ENERGY * k * y;
      out('size').textContent = (+size.value).toLocaleString('en-CA') + ' sq ft';
      out('years').textContent = y + (y === 1 ? ' year' : ' years');
      out('build').textContent = money(build);
      out('energy').textContent = money(energy);
      out('total').textContent = money(build + energy);
    };
    size.addEventListener('input', render); years.addEventListener('input', render);
    render();
  })();

  // ---- #21 frost wall vs concrete race ----
  (function initRace(){
    const race = document.querySelector('[data-race]');
    if (!race) return;
    const bars = [...race.querySelectorAll('.race-track i')];
    const ends = [...race.querySelectorAll('.race-end')];
    const day = race.querySelector('[data-race-day]');
    const MAX = 28, DURATION = 3200;
    let raf = null;
    const paint = (d) => {
      day.textContent = Math.min(MAX, Math.floor(d));
      bars.forEach((b, i) => {
        const days = +b.dataset.days;
        b.style.width = (Math.min(d, days) / MAX * 100) + '%';
        ends[i].classList.toggle('done', d >= days);
      });
    };
    const run = () => {
      cancelAnimationFrame(raf);
      if (prefersReduced) { paint(MAX); return; }
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / DURATION, 1);
        paint(p * MAX);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    paint(0);
    race.querySelector('[data-race-replay]').addEventListener('click', run);
    new IntersectionObserver((entries, obs) => {
      if (entries.some(e => e.isIntersecting)) { run(); obs.disconnect(); }
    }, { threshold: 0.5 }).observe(race);
  })();

  // ---- #24 back to top ----
  (function initToTop(){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    btn.tabIndex = -1;
    document.body.appendChild(btn);
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: smooth() });
      const skip = document.querySelector('.logo'); if (skip) skip.focus({ preventScroll: true });
    });
    let ticking = false;
    const check = () => {
      ticking = false;
      const show = window.scrollY > window.innerHeight * 1.5;
      btn.classList.toggle('show', show);
      btn.tabIndex = show ? 0 : -1;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
    check();
  })();
