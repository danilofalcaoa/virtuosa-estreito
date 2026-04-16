/* ============================================================
   CLÍNICA VIRTUOSA — SCRIPT.JS
   Vanilla JS | Sem dependências externas
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     1. LUCIDE ICONS
  ---------------------------------------------------------- */
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }


  /* ----------------------------------------------------------
     2. NAVBAR — scroll + hamburger
  ---------------------------------------------------------- */
  const navbar     = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const navMenu    = document.getElementById('navMenu');

  function handleNavbarScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.contains('open');
      navMenu.classList.toggle('open', !isOpen);
      menuToggle.classList.toggle('open', !isOpen);
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', e => {
      if (
        navMenu.classList.contains('open') &&
        !navMenu.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) closeMenu();
    });
  }

  function closeMenu() {
    navMenu.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }


  /* ----------------------------------------------------------
     3. FADE-UP — IntersectionObserver
  ---------------------------------------------------------- */
  const fadeEls = document.querySelectorAll('.fade-up');

  if (fadeEls.length) {
    const fadeObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    fadeEls.forEach(el => fadeObserver.observe(el));
  }


  /* ----------------------------------------------------------
     4. FAQ ACCORDION
  ---------------------------------------------------------- */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-item__pergunta');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Fechar todos
      faqItems.forEach(other => {
        other.classList.remove('open');
        const otherBtn = other.querySelector('.faq-item__pergunta');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      // Toggle atual
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });


  /* ----------------------------------------------------------
     5. CARROSSEL DE VÍDEOS
  ---------------------------------------------------------- */
  const track    = document.getElementById('resultadosTrack');
  const btnPrev  = document.getElementById('resultadosPrev');
  const btnNext  = document.getElementById('resultadosNext');
  const dotsWrap = document.getElementById('resultadosDots');

  if (!track) return;

  const cards      = Array.from(track.querySelectorAll('.resultado-card'));
  let currentIndex = 0;
  let pointerStartX = 0;
  let wasDragging   = false;

  function getVisibleCount() {
    const vw = window.innerWidth;
    if (vw >= 1280) return 4;
    if (vw >= 1024) return 3;
    if (vw >= 768)  return 3;
    if (vw >= 480)  return 2;
    return 1;
  }

  function getCardWidth() {
    if (!cards.length) return 260;
    const gap = parseInt(getComputedStyle(track).gap) || 16;
    return cards[0].offsetWidth + gap;
  }

  function getMaxIndex() {
    return Math.max(0, cards.length - getVisibleCount());
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    const max = getMaxIndex();
    for (let i = 0; i <= max; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === currentIndex ? ' active' : '');
      dot.setAttribute('aria-label', `Ir para o vídeo ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsWrap) return;
    dotsWrap.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function updateButtons() {
    if (btnPrev) btnPrev.disabled = currentIndex === 0;
    if (btnNext) btnNext.disabled = currentIndex >= getMaxIndex();
  }

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, getMaxIndex()));
    track.style.transform = `translateX(-${currentIndex * getCardWidth()}px)`;
    updateDots();
    updateButtons();
    pauseAllVideos();
  }

  if (btnPrev) btnPrev.addEventListener('click', () => goTo(currentIndex - 1));
  if (btnNext) btnNext.addEventListener('click', () => goTo(currentIndex + 1));

  // Swipe touch e drag mouse
  const viewport = track.closest('.resultados__track-wrapper');
  if (viewport) {
    // Touch
    viewport.addEventListener('touchstart', e => {
      pointerStartX = e.touches[0].clientX;
      wasDragging = false;
    }, { passive: true });

    viewport.addEventListener('touchmove', () => {
      wasDragging = true;
    }, { passive: true });

    viewport.addEventListener('touchend', e => {
      if (!wasDragging) return;
      const delta = e.changedTouches[0].clientX - pointerStartX;
      if (Math.abs(delta) > 50) delta < 0 ? goTo(currentIndex + 1) : goTo(currentIndex - 1);
      wasDragging = false;
    }, { passive: true });

    // Mouse drag
    viewport.addEventListener('mousedown', e => {
      pointerStartX = e.clientX;
      wasDragging = false;
      track.style.transition = 'none';
    });
    window.addEventListener('mousemove', () => { wasDragging = true; });
    window.addEventListener('mouseup', e => {
      track.style.transition = '';
      if (wasDragging) {
        const delta = e.clientX - pointerStartX;
        if (Math.abs(delta) > 50) delta < 0 ? goTo(currentIndex + 1) : goTo(currentIndex - 1);
      }
      // Pequeno delay para o click handler não disparar play
      setTimeout(() => { wasDragging = false; }, 50);
    });
  }

  // Teclas de seta
  document.addEventListener('keydown', e => {
    const section = document.getElementById('resultados');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    if (e.key === 'ArrowRight') { goTo(currentIndex + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { goTo(currentIndex - 1); e.preventDefault(); }
  });


  /* ----------------------------------------------------------
     6. CLICK-TO-PLAY NOS VÍDEOS
  ---------------------------------------------------------- */
  function pauseAllVideos(except) {
    cards.forEach(card => {
      if (card === except) return;
      const video = card.querySelector('video');
      if (video && !video.paused) {
        video.pause();
        card.classList.remove('playing');
      }
    });
  }

  cards.forEach(card => {
    const video = card.querySelector('video');
    if (!video) return;

    card.addEventListener('click', () => {
      // Se foi drag, não faz play
      if (wasDragging) return;

      if (video.paused) {
        pauseAllVideos(card);
        video.play()
          .then(() => card.classList.add('playing'))
          .catch(() => {});
      } else {
        video.pause();
        card.classList.remove('playing');
      }
    });

    video.addEventListener('ended', () => {
      card.classList.remove('playing');
    });
  });

  // Auto-pause ao sair da viewport
  const videoObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          const video = entry.target.querySelector('video');
          if (video && !video.paused) {
            video.pause();
            entry.target.classList.remove('playing');
          }
        }
      });
    },
    { threshold: 0.2 }
  );
  cards.forEach(card => videoObserver.observe(card));


  /* ----------------------------------------------------------
     7. INIT + RESIZE
  ---------------------------------------------------------- */
  buildDots();
  updateButtons();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      goTo(Math.min(currentIndex, getMaxIndex()));
      buildDots();
    }, 200);
  });

});
