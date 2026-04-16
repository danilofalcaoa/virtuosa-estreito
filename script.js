/* ============================================================
   CLÍNICA VIRTUOSA — SCRIPT.JS v2
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     LUCIDE ICONS
  ---------------------------------------------------------- */
  if (typeof lucide !== 'undefined') lucide.createIcons();


  /* ----------------------------------------------------------
     NAVBAR — scroll + hamburger
  ---------------------------------------------------------- */
  const navbar     = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const navMenu    = document.getElementById('navMenu');

  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    navMenu.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  menuToggle?.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      navMenu.classList.add('open');
      menuToggle.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
  });

  navMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  document.addEventListener('click', e => {
    if (navMenu?.classList.contains('open') &&
        !navMenu.contains(e.target) &&
        !menuToggle.contains(e.target)) {
      closeMenu();
    }
  });


  /* ----------------------------------------------------------
     FADE-UP — IntersectionObserver
  ---------------------------------------------------------- */
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));


  /* ----------------------------------------------------------
     FAQ ACCORDION
  ---------------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-item__pergunta')?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Fechar todos
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-item__pergunta')?.setAttribute('aria-expanded', 'false');
      });
      // Abrir o clicado (se estava fechado)
      if (!isOpen) {
        item.classList.add('open');
        item.querySelector('.faq-item__pergunta')?.setAttribute('aria-expanded', 'true');
      }
    });
  });


  /* ----------------------------------------------------------
     CARROSSEL DE VÍDEOS
  ---------------------------------------------------------- */
  const track    = document.getElementById('resultadosTrack');
  const btnPrev  = document.getElementById('resultadosPrev');
  const btnNext  = document.getElementById('resultadosNext');
  const dotsWrap = document.getElementById('resultadosDots');

  if (!track) return;

  const cards = Array.from(track.querySelectorAll('.resultado-card'));
  let index   = 0;

  /* Quantos cards aparecem de uma vez */
  function visibleCount() {
    const w = window.innerWidth;
    if (w >= 1280) return 4;
    if (w >= 1024) return 3;
    if (w >= 768)  return 3;
    if (w >= 480)  return 2;
    return 1;
  }

  /* Largura de um passo (card + gap) */
  function stepPx() {
    if (!cards.length) return 220;
    const gap = parseInt(getComputedStyle(track).gap) || 14;
    return cards[0].offsetWidth + gap;
  }

  function maxIndex() {
    return Math.max(0, cards.length - visibleCount());
  }

  /* Navega para o índice dado */
  function goTo(i) {
    index = Math.max(0, Math.min(i, maxIndex()));
    track.style.transform = `translateX(-${index * stepPx()}px)`;
    syncUI();
    pauseAll();
  }

  /* Atualiza dots e botões */
  function syncUI() {
    dotsWrap?.querySelectorAll('.carousel-dot').forEach((d, i) =>
      d.classList.toggle('active', i === index)
    );
    if (btnPrev) btnPrev.disabled = index === 0;
    if (btnNext) btnNext.disabled = index >= maxIndex();
  }

  /* Constrói os dots */
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (let i = 0; i <= maxIndex(); i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === index ? ' active' : '');
      dot.setAttribute('aria-label', `Vídeo ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  btnPrev?.addEventListener('click', () => goTo(index - 1));
  btnNext?.addEventListener('click', () => goTo(index + 1));


  /* ---------- SWIPE / DRAG ---------- */
  const viewport = track.closest('.resultados__track-wrapper');
  let startX = 0;
  let dragDist = 0;
  let dragging = false;

  function pointerStart(x) {
    startX   = x;
    dragDist = 0;
    dragging = true;
  }
  function pointerMove(x) {
    dragDist = x - startX;
  }
  function pointerEnd() {
    dragging = false;
    if (Math.abs(dragDist) > 48) {
      dragDist < 0 ? goTo(index + 1) : goTo(index - 1);
    }
    dragDist = 0;
  }

  if (viewport) {
    /* Touch */
    viewport.addEventListener('touchstart', e => pointerStart(e.touches[0].clientX), { passive: true });
    viewport.addEventListener('touchmove',  e => pointerMove(e.touches[0].clientX),  { passive: true });
    viewport.addEventListener('touchend',   pointerEnd, { passive: true });

    /* Mouse drag */
    let mouseDown = false;
    viewport.addEventListener('mousedown', e => { mouseDown = true; pointerStart(e.clientX); track.style.transition = 'none'; });
    window.addEventListener('mousemove',   e => { if (mouseDown) pointerMove(e.clientX); });
    window.addEventListener('mouseup',     () => {
      if (!mouseDown) return;
      mouseDown = false;
      track.style.transition = '';
      pointerEnd();
    });
  }

  /* Teclas de seta */
  document.addEventListener('keydown', e => {
    const sec = document.getElementById('resultados');
    if (!sec) return;
    const r = sec.getBoundingClientRect();
    if (r.top > window.innerHeight || r.bottom < 0) return;
    if (e.key === 'ArrowRight') { goTo(index + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { goTo(index - 1); e.preventDefault(); }
  });


  /* ---------- VÍDEOS — click-to-play com áudio ---------- */

  function pauseAll(except) {
    cards.forEach(card => {
      if (card === except) return;
      const v = card.querySelector('video');
      if (v && !v.paused) { v.pause(); card.classList.remove('playing'); }
    });
  }

  cards.forEach(card => {
    const video = card.querySelector('video');
    if (!video) return;

    /* Click para play/pause — ignorar se foi drag */
    card.addEventListener('click', () => {
      if (Math.abs(dragDist) > 8 || dragging) return;

      if (video.paused) {
        pauseAll(card);
        video.play()
          .then(() => card.classList.add('playing'))
          .catch(err => {
            if (err.name === 'NotAllowedError') {
              video.muted = true;
              video.play().then(() => card.classList.add('playing'));
            }
          });
      } else {
        video.pause();
        card.classList.remove('playing');
      }
    });

    video.addEventListener('ended',  () => card.classList.remove('playing'));
    video.addEventListener('pause',  () => card.classList.remove('playing'));
    video.addEventListener('play',   () => card.classList.add('playing'));
  });

  /* Auto-pause ao sair da seção */
  const secObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) pauseAll();
    });
  }, { threshold: 0.05 });

  const secResultados = document.getElementById('resultados');
  if (secResultados) secObserver.observe(secResultados);


  /* ---------- INIT ---------- */
  buildDots();
  syncUI();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      goTo(Math.min(index, maxIndex()));
      buildDots();
    }, 180);
  });

});
