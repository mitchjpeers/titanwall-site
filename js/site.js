// ===== INTRO ANIMATION =====
  // Dismissible at any time, and shown once per browser session rather than
  // on every page load — nobody should be gated behind the same animation twice.
  const introOverlay = document.getElementById('introOverlay');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let introSeen = false;
  try { introSeen = sessionStorage.getItem('tw_intro') === '1'; } catch (e) {}

  if (introOverlay) {
    if (prefersReduced || introSeen) {
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
  const mqMobileNav = window.matchMedia('(max-width: 860px)');

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
      if (prefersReduced) { el.textContent = fmt(target) + suffix; return; }

      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        // ease-out cubic: fast off the line, settles onto the number
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased)) + suffix;
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
    const subject = encodeURIComponent('Project inquiry from ' + name);
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
