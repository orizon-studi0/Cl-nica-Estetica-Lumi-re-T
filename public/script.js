/* ==========================================================================
   Clínica Lumière Estética — JavaScript Puro (Zero Dependências)
   ========================================================================== */

(function () {
  'use strict';

  const WHATSAPP_NUMBER = '5511999998888';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. PLANO B DE IMAGENS */
  function setupImageFallbacks() {
    const containers = document.querySelectorAll('.media-arch, .hero-media');
    containers.forEach((box) => {
      const img = box.querySelector('img');
      if (!img) return;

      const onFail = () => box.classList.add('is-broken');
      const onPass = () => box.classList.remove('is-broken');

      if (img.complete) {
        if (img.naturalWidth === 0) onFail();
        else onPass();
      } else {
        img.addEventListener('load', () => {
          if (img.naturalWidth === 0) onFail();
          else onPass();
        });
        img.addEventListener('error', onFail);
      }
    });
  }

  /* 2. HEADER AO ROLAR + MENU MOBILE + SCROLLSPY */
  function setupHeaderAndMenu() {
    const header = document.getElementById('siteHeader');
    const toggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const desktopLinks = document.querySelectorAll('.desktop-nav a');
    const sections = document.querySelectorAll('main section[id]');

    function updateScroll() {
      const y = window.scrollY;
      if (header) {
        header.classList.toggle('is-scrolled', y > 36);
      }

      const probe = y + 140;
      let activeId = '';
      sections.forEach((sec) => {
        if (probe >= sec.offsetTop && probe < sec.offsetTop + sec.offsetHeight) {
          activeId = sec.id;
        }
      });

      desktopLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${activeId}`);
      });
    }

    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    if (!toggle || !mobileMenu) return;

    function setMenuOpen(open) {
      mobileMenu.classList.toggle('is-open', open);
      mobileMenu.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open && header) header.classList.add('is-scrolled');
      else updateScroll();
    }

    toggle.addEventListener('click', () => {
      setMenuOpen(!mobileMenu.classList.contains('is-open'));
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        setMenuOpen(false);
        toggle.focus();
      }
    });
  }


  /* 4. PÍLULA ABERTO / FECHADO NO HEADER + HORÁRIO DE HOJE */
  function getClinicScheduleStatus(now = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const weekday = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
    let hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '10', 10);
    if (hour === 24) hour = 0;
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const total = hour * 60 + minute;
    const openAt = 9 * 60;
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = dayMap[weekday] ?? 1;

    if (day >= 1 && day <= 5) {
      if (total >= openAt && total < 19 * 60) {
        return { isOpen: true, pill: 'Aberto agora', todayGroup: 'weekday' };
      }
      if (total < openAt) {
        return { isOpen: false, pill: 'Fechado, abre hoje às 9h', todayGroup: 'weekday' };
      }
      return { isOpen: false, pill: 'Fechado, abre amanhã às 9h', todayGroup: 'weekday' };
    }

    if (day === 6) {
      if (total >= openAt && total < 14 * 60) {
        return { isOpen: true, pill: 'Aberto agora', todayGroup: 'saturday' };
      }
      if (total < openAt) {
        return { isOpen: false, pill: 'Fechado, abre hoje às 9h', todayGroup: 'saturday' };
      }
      return { isOpen: false, pill: 'Fechado, abre segunda às 9h', todayGroup: 'saturday' };
    }

    return { isOpen: false, pill: 'Fechado, abre amanhã às 9h', todayGroup: 'sunday' };
  }

  function setupClinicSchedule() {
    const status = getClinicScheduleStatus();
    const pill = document.getElementById('headerStatusPill');
    const pillText = document.getElementById('headerStatusText');
    if (pill && pillText) {
      pill.classList.toggle('is-open', status.isOpen);
      pillText.textContent = status.pill;
    }

    document.querySelectorAll('[data-hours-group]').forEach((item) => {
      const isToday = item.getAttribute('data-hours-group') === status.todayGroup;
      item.classList.toggle('is-today', isToday);
      const existingTag = item.querySelector('.hours-today-tag');
      if (isToday && !existingTag) {
        const tag = document.createElement('span');
        tag.className = 'hours-today-tag';
        tag.textContent = ' (Hoje)';
        item.appendChild(tag);
      }
    });
  }

  /* 5. CARROSSEL COM DESTAQUE CENTRAL REUTILIZÁVEL */
  function setupCarousels() {
    const carousels = document.querySelectorAll('[data-carousel]');
    carousels.forEach((root) => {
      const track = root.querySelector('.carousel-track');
      const cards = Array.from(root.querySelectorAll('.carousel-card'));
      const dotsWrap = root.querySelector('.carousel-dots');
      const activeCaption = root.querySelector('.space-active-bar');

      if (!track || cards.length === 0) return;

      const AUTO_INTERVAL_MS = 4000;
      const desktopGridQuery = window.matchMedia('(min-width: 1100px)');
      const isStaticGridMode = () => cards.length <= 3 && desktopGridQuery.matches;
      root.classList.toggle('is-static-desktop', cards.length <= 3);

      let activeIndex = 0;
      let isVisibleOnScreen = false;
      let autoTimer = null;
      let resumeTimer = null;
      let scrollDebounce = null;
      let isDragging = false;
      let dragMoved = false;
      let suppressClick = false;
      let startX = 0;
      let startScrollLeft = 0;

      // Criar pontos indicadores
      const dots = cards.map((card, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Ir para item ${index + 1} de ${cards.length}`);
        dot.addEventListener('click', () => {
          goToSlide(index);
          startAuto();
        });
        if (dotsWrap) dotsWrap.appendChild(dot);
        return dot;
      });

      function setActive(index) {
        activeIndex = index;
        cards.forEach((card, i) => {
          card.classList.toggle('is-active', i === index);
        });
        dots.forEach((dot, i) => {
          dot.setAttribute('aria-current', i === index ? 'true' : 'false');
        });
        if (activeCaption) {
          const cap = cards[index]?.getAttribute('data-space-caption') || '';
          activeCaption.textContent = cap;
        }
      }

      function goToSlide(index, smooth = true) {
        if (isStaticGridMode()) return;
        const targetIndex = ((index % cards.length) + cards.length) % cards.length;
        const card = cards[targetIndex];
        if (!card) return;
        const left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
        track.scrollTo({
          left: Math.max(0, left),
          behavior: smooth && !prefersReducedMotion ? 'smooth' : 'auto'
        });
        setActive(targetIndex);
      }

      // Detectar card central com IntersectionObserver (rootMargin lateral -40%)
      if ('IntersectionObserver' in window) {
        let ready = false;
        window.requestAnimationFrame(() => {
          ready = true;
        });
        const centerObserver = new IntersectionObserver(
          (entries) => {
            if (!ready || isDragging || isStaticGridMode()) return;
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const idx = cards.indexOf(entry.target);
                if (idx !== -1) setActive(idx);
              }
            });
          },
          {
            root: track,
            rootMargin: '0px -40% 0px -40%',
            threshold: 0.1
          }
        );
        cards.forEach((card) => centerObserver.observe(card));
      }

      // Encontrar card mais próximo do centro
      function getClosestIndex() {
        const center = track.scrollLeft + track.clientWidth / 2;
        let bestIdx = 0;
        let bestDist = Infinity;
        cards.forEach((card, i) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const dist = Math.abs(cardCenter - center);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        });
        return bestIdx;
      }

      function findClosestToCenter() {
        setActive(getClosestIndex());
      }

      function stopAuto() {
        if (autoTimer) {
          window.clearInterval(autoTimer);
          autoTimer = null;
        }
        if (resumeTimer) {
          window.clearTimeout(resumeTimer);
          resumeTimer = null;
        }
      }

      function startAuto() {
        stopAuto();
        if (isStaticGridMode() || !isVisibleOnScreen || document.hidden) return;
        autoTimer = window.setInterval(() => {
          goToSlide(activeIndex + 1, true);
        }, AUTO_INTERVAL_MS);
      }

      function pauseDuringInteraction() {
        stopAuto();
        if (!isStaticGridMode() && isVisibleOnScreen && !document.hidden) {
          resumeTimer = window.setTimeout(() => {
            startAuto();
          }, AUTO_INTERVAL_MS);
        }
      }

      // Clique em card lateral centraliza ele no carrossel (em vez de abrir detalhes ou ignorar)
      track.addEventListener(
        'click',
        (e) => {
          if (isStaticGridMode()) return;
          if (suppressClick) {
            e.preventDefault();
            e.stopImmediatePropagation();
            suppressClick = false;
            return;
          }
          const clickedCard = e.target.closest('.carousel-card');
          if (!clickedCard) return;
          const idx = cards.indexOf(clickedCard);
          if (idx === -1) return;
          if (!clickedCard.classList.contains('is-active')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            goToSlide(idx, true);
            startAuto();
          }
        },
        true
      );

      // Arrastar com o mouse no desktop para puxar o carrossel para os lados
      track.addEventListener('pointerdown', (e) => {
        if (isStaticGridMode() || e.pointerType !== 'mouse' || e.button !== 0) return;
        isDragging = true;
        dragMoved = false;
        suppressClick = false;
        startX = e.clientX;
        startScrollLeft = track.scrollLeft;
        stopAuto();
      });

      window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        if (!dragMoved && Math.abs(dx) > 5) {
          dragMoved = true;
          track.classList.add('is-dragging');
        }
        if (dragMoved) {
          track.scrollLeft = startScrollLeft - dx;
        }
      });

      function finishMouseDrag() {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('is-dragging');
        if (dragMoved) {
          suppressClick = true;
          window.setTimeout(() => {
            suppressClick = false;
          }, 80);
          goToSlide(getClosestIndex(), true);
        }
        dragMoved = false;
        if (isVisibleOnScreen && !document.hidden) {
          startAuto();
        }
      }

      window.addEventListener('pointerup', finishMouseDrag);
      window.addEventListener('pointercancel', finishMouseDrag);

      // Pausar enquanto usuário interage e reiniciar contagem de 4s ao finalizar
      ['touchstart', 'mouseenter', 'focusin'].forEach((evt) => {
        track.addEventListener(evt, pauseDuringInteraction, { passive: true });
      });

      ['mouseleave', 'touchend'].forEach((evt) => {
        track.addEventListener(
          evt,
          () => {
            if (!isDragging && isVisibleOnScreen && !document.hidden) {
              startAuto();
            }
          },
          { passive: true }
        );
      });

      track.addEventListener(
        'scroll',
        () => {
          if (isDragging || isStaticGridMode()) return;
          window.clearTimeout(scrollDebounce);
          scrollDebounce = window.setTimeout(() => {
            findClosestToCenter();
            if (isVisibleOnScreen && !document.hidden && !autoTimer) {
              startAuto();
            }
          }, 120);
        },
        { passive: true }
      );

      // Navegação por teclado
      root.addEventListener('keydown', (e) => {
        if (isStaticGridMode()) return;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = (activeIndex + 1) % cards.length;
          goToSlide(next);
          startAuto();
          cards[next]?.focus({ preventScroll: true });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = (activeIndex - 1 + cards.length) % cards.length;
          goToSlide(prev);
          startAuto();
          cards[prev]?.focus({ preventScroll: true });
        }
      });

      // Alternar entre grade estática (desktop <= 3 itens) e carrossel (mobile ou > 3 itens)
      const handleViewportSwitch = () => {
        if (isStaticGridMode()) {
          stopAuto();
          track.scrollLeft = 0;
          setActive(0);
        } else {
          setActive(0);
          goToSlide(0, false);
          if (isVisibleOnScreen && !document.hidden) startAuto();
        }
      };

      if (typeof desktopGridQuery.addEventListener === 'function') {
        desktopGridQuery.addEventListener('change', handleViewportSwitch);
      }

      // Pausar ao sair da tela e reiniciar contagem limpa de 4s ao voltar
      if ('IntersectionObserver' in window) {
        const visObs = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              isVisibleOnScreen = entry.isIntersecting;
              if (isVisibleOnScreen) startAuto();
              else stopAuto();
            });
          },
          { threshold: 0.15 }
        );
        visObs.observe(root);
      } else {
        isVisibleOnScreen = true;
        startAuto();
      }

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAuto();
        else if (isVisibleOnScreen) startAuto();
      });

      setActive(0);
    });
  }

  /* 6. GAVETA INFERIOR DE TRATAMENTO (<dialog>) */
  function setupTreatmentDialog() {
    const dialog = document.getElementById('treatmentDialog');
    const titleEl = document.getElementById('dialogTitle');
    const descEl = document.getElementById('dialogDesc');
    const benefitsEl = document.getElementById('dialogBenefits');
    const ctaEl = document.getElementById('dialogCta');
    const closeBtn = document.getElementById('dialogClose');

    if (!dialog || !titleEl || !descEl || !benefitsEl || !ctaEl) return;

    function openDrawer(card) {
      const title = card.getAttribute('data-title') || '';
      const desc = card.getAttribute('data-desc') || '';
      const benefits = (card.getAttribute('data-benefits') || '').split('|').filter(Boolean);
      const waText = card.getAttribute('data-wa') || `Olá! Gostaria de informações sobre ${title}.`;

      titleEl.textContent = title;
      descEl.textContent = desc;
      benefitsEl.innerHTML = '';
      benefits.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        benefitsEl.appendChild(li);
      });

      ctaEl.textContent = `Agendar ${title}`;
      ctaEl.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', 'true');
      }
    }

    function closeDrawer() {
      if (typeof dialog.close === 'function' && dialog.open) {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }

    document.querySelectorAll('.treatment-card').forEach((card) => {
      card.addEventListener('click', () => openDrawer(card));
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeDrawer();
    });
  }

  /* 7. ACORDEÃO DE DÚVIDAS */
  function setupFaq() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach((item) => {
      const btn = item.querySelector('.faq-btn');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        items.forEach((other) => {
          other.classList.remove('is-open');
          const b = other.querySelector('.faq-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        item.classList.toggle('is-open', willOpen);
        btn.setAttribute('aria-expanded', String(willOpen));
      });
    });
  }

  /* 8. REVELAÇÃO AO ROLAR (INTERSECTION OBSERVER — EXECUTA 1 VEZ) */
  function setupReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -24px 0px' }
    );

    items.forEach((el) => obs.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupImageFallbacks();
    setupHeaderAndMenu();
    setupClinicSchedule();
    setupCarousels();
    setupTreatmentDialog();
    setupFaq();
    setupReveal();
  });
})();
