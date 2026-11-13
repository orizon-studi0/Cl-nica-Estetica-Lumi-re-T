/* ==========================================================================
   Clínica Lumière Estética — Interações, Movimento e Lógica Clínica
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches || 'ontouchstart' in window;
  const isDesktop = () => window.innerWidth >= 1100;

  /* 1. IMAGENS E ESPAÇOS RESERVADOS */
  function setupImageFallbacks() {
    const imgs = document.querySelectorAll('.media-frame img');
    imgs.forEach((img) => {
      const frame = img.closest('.media-frame');
      if (!frame) return;

      const markBroken = () => frame.classList.add('is-broken');
      const markReady = () => frame.classList.remove('is-broken');

      if (img.complete) {
        if (img.naturalWidth === 0) markBroken();
        else markReady();
      } else {
        img.addEventListener('load', () => {
          if (img.naturalWidth === 0) markBroken();
          else markReady();
        });
        img.addEventListener('error', markBroken);
      }
    });
  }

  /* 2. HEADER DINÂMICO, BARRA DE PROGRESSO E LINK ATIVO */
  function setupScrollChrome() {
    const header = document.getElementById('siteHeader');
    const progressBar = document.getElementById('readingProgress');
    const navLinks = document.querySelectorAll('.desktop-nav a, .mobile-menu-links a');
    const sections = document.querySelectorAll('main section[id]');
    const waPill = document.getElementById('waFloatPill');
    const contactSection = document.getElementById('localizacao');

    let lastScrollY = window.scrollY;
    let isContactVisible = false;

    if (waPill && contactSection && 'IntersectionObserver' in window) {
      const contactObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isContactVisible = entry.isIntersecting;
            waPill.classList.toggle('is-hidden-by-form', isContactVisible);
          });
        },
        { threshold: 0.15 }
      );
      contactObserver.observe(contactSection);
    }

    function onScroll() {
      const currentY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(Math.max(currentY / docHeight, 0), 1) : 0;

      if (progressBar) {
        progressBar.style.transform = `scaleX(${progress})`;
      }

      if (header) {
        header.classList.toggle('is-scrolled', currentY > 40);
        const menuOpen = document.getElementById('mobileMenuOverlay')?.classList.contains('is-open');
        if (!menuOpen && currentY > 140 && currentY > lastScrollY + 4) {
          header.classList.add('is-hidden');
        } else if (currentY < lastScrollY - 4 || currentY <= 140) {
          header.classList.remove('is-hidden');
        }
      }

      if (waPill) {
        waPill.classList.toggle('is-visible', currentY > 360 && !isContactVisible);
      }

      // ScrollSpy para link ativo no menu
      const probeY = currentY + 180;
      let activeId = '';
      sections.forEach((sec) => {
        if (probeY >= sec.offsetTop && probeY < sec.offsetTop + sec.offsetHeight) {
          activeId = sec.id;
        }
      });

      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        link.classList.toggle('is-active', href === `#${activeId}`);
      });

      lastScrollY = currentY;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 3. MENU MOBILE EM TELA CHEIA */
  function setupMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const overlay = document.getElementById('mobileMenuOverlay');
    const header = document.getElementById('siteHeader');
    if (!toggle || !overlay) return;

    const links = overlay.querySelectorAll('a');

    function setOpen(open) {
      overlay.classList.toggle('is-open', open);
      overlay.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open && header) header.classList.remove('is-hidden');
    }

    toggle.addEventListener('click', () => {
      const isOpen = overlay.classList.contains('is-open');
      setOpen(!isOpen);
    });

    links.forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* 4. CONTADORES ANIMADOS (SOBRE) */
  function setupCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const animateValue = (el) => {
      const target = parseInt(el.getAttribute('data-counter') || '0', 10);
      if (prefersReducedMotion) {
        el.textContent = String(target);
        return;
      }

      const duration = 900;
      const startTime = performance.now();

      function step(now) {
        const elapsed = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        const val = Math.round(eased * target);
        el.textContent = String(val);
        if (elapsed < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateValue(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((c) => obs.observe(c));
    } else {
      counters.forEach(animateValue);
    }
  }

  /* 5. TRATAMENTOS (ACORDEÃO + PRÉVIA FLUTUANTE DESKTOP + PROGRESSO MOBILE) */
  function setupTreatments() {
    const items = document.querySelectorAll('.treatment-item');
    const preview = document.getElementById('treatmentPreview');
    const previewImg = document.getElementById('treatmentPreviewImg');

    items.forEach((item) => {
      const trigger = item.querySelector('.treatment-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        items.forEach((other) => {
          other.classList.remove('is-open');
          const otherBtn = other.querySelector('.treatment-trigger');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      // Prévia flutuante que acompanha o cursor no desktop
      if (preview && previewImg && !isTouchDevice) {
        trigger.addEventListener('mouseenter', () => {
          if (!isDesktop()) return;
          const src = item.getAttribute('data-preview');
          const alt = item.getAttribute('data-preview-alt') || '';
          if (src) {
            previewImg.src = src;
            previewImg.alt = alt;
            preview.classList.add('is-visible');
          }
        });

        trigger.addEventListener('mousemove', (e) => {
          if (!isDesktop()) return;
          preview.style.left = `${e.clientX + 24}px`;
          preview.style.top = `${e.clientY - 20}px`;
        });

        trigger.addEventListener('mouseleave', () => {
          preview.classList.remove('is-visible');
        });
      }
    });

    // Barra de progresso do carrossel mobile
    const track = document.getElementById('treatmentsTrack');
    const fill = document.getElementById('treatmentsProgressFill');
    if (track && fill) {
      const updateProgress = () => {
        const maxScroll = track.scrollWidth - track.clientWidth;
        const ratio = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;
        // 6 cards => barra preenche proporcionalmente da 1ª à 6ª posição
        const scale = 1 + ratio * 5;
        fill.style.transform = `scaleX(${scale})`;
      };
      track.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }
  }

  /* 6. EQUIPE (TOQUE NO MOBILE PARA MINI BIO + COR) */
  function setupTeamBios() {
    const members = document.querySelectorAll('.team-member');
    members.forEach((member) => {
      const btn = member.querySelector('.team-bio-toggle');
      if (!btn) return;

      btn.addEventListener('click', () => {
        const isOpen = member.classList.toggle('is-bio-open');
        btn.setAttribute('aria-expanded', String(isOpen));
        btn.textContent = isOpen ? 'Ocultar biografia' : 'Ler biografia';
      });
    });
  }

  /* 7. COMO FUNCIONA (LINHA VERTICAL DESENHADA NO SCROLL) */
  function setupStepsTimeline() {
    const section = document.getElementById('como-funciona');
    const lineFill = document.getElementById('stepsLineFill');
    if (!section || !lineFill) return;

    if (prefersReducedMotion) {
      lineFill.style.transform = 'scaleY(1)';
      return;
    }

    function updateLine() {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.72;
      const total = rect.height * 0.75;
      const scrolled = start - rect.top;
      const ratio = Math.min(Math.max(scrolled / total, 0), 1);
      lineFill.style.transform = `scaleY(${ratio})`;
    }

    window.addEventListener('scroll', updateLine, { passive: true });
    updateLine();
  }

  /* 8. GALERIA LIGHTBOX */
  function setupLightbox() {
    const lightbox = document.getElementById('galleryLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const closeBtn = document.getElementById('lightboxClose');
    const tiles = document.querySelectorAll('.gallery-tile');

    if (!lightbox || !lightboxImg || !lightboxCaption || !closeBtn) return;

    let lastFocused = null;

    function openLightbox(src, alt, title) {
      lastFocused = document.activeElement;
      lightboxImg.src = src;
      lightboxImg.alt = alt;
      lightboxCaption.textContent = title;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    tiles.forEach((tile) => {
      tile.addEventListener('click', () => {
        const img = tile.querySelector('img');
        const titleEl = tile.querySelector('.gallery-tile-title');
        if (img) {
          openLightbox(img.getAttribute('src') || '', img.alt || '', titleEl?.textContent || '');
        }
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  }

  /* 9. FAQ ACORDEÃO */
  function setupFaq() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach((item) => {
      const btn = item.querySelector('.faq-trigger');
      if (!btn) return;

      btn.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        items.forEach((other) => {
          other.classList.remove('is-open');
          const otherBtn = other.querySelector('.faq-trigger');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* 10. SELO DE HORÁRIO AO VIVO (SÃO PAULO) */
  function setupLiveStatus() {
    const badge = document.getElementById('clinicStatusBadge');
    const textEl = document.getElementById('clinicStatusText');
    if (!badge || !textEl) return;

    function computeStatus(date) {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });

      const parts = formatter.formatToParts(date);
      const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
      const hourStr = parts.find((p) => p.type === 'hour')?.value || '10';
      const minuteStr = parts.find((p) => p.type === 'minute')?.value || '00';

      const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const day = dayMap[weekdayStr] ?? 1;
      let hour = parseInt(hourStr, 10);
      if (hour === 24) hour = 0;
      const minute = parseInt(minuteStr, 10);
      const mins = hour * 60 + minute;

      if (day >= 1 && day <= 5) {
        if (mins >= 9 * 60 && mins < 19 * 60) {
          return { open: true, label: 'Aberto agora, fecha às 19h' };
        }
        if (mins < 9 * 60) {
          return { open: false, label: 'Fechado, abre hoje às 9h' };
        }
        return { open: false, label: 'Fechado, abre amanhã às 9h' };
      }

      if (day === 6) {
        if (mins >= 9 * 60 && mins < 14 * 60) {
          return { open: true, label: 'Aberto agora, fecha às 14h' };
        }
        if (mins < 9 * 60) {
          return { open: false, label: 'Fechado, abre hoje às 9h' };
        }
        return { open: false, label: 'Fechado, abre segunda às 9h' };
      }

      return { open: false, label: 'Fechado, abre amanhã às 9h' };
    }

    const status = computeStatus(new Date());
    badge.classList.toggle('is-open', status.open);
    textEl.textContent = status.label;
  }

  /* 11. FORMULÁRIO COM MÁSCARA, VALIDAÇÃO INLINE E WHATSAPP */
  function setupForm() {
    const form = document.getElementById('appointmentForm');
    if (!form) return;

    const nameInput = document.getElementById('inputName');
    const phoneInput = document.getElementById('inputPhone');
    const treatmentSelect = document.getElementById('selectTreatment');
    const timeSelect = document.getElementById('selectTime');
    const notesInput = document.getElementById('inputNotes');

    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 6) {
          e.target.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        } else if (v.length > 2) {
          e.target.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        } else if (v.length > 0) {
          e.target.value = `(${v}`;
        } else {
          e.target.value = '';
        }
        clearError(phoneInput);
      });
    }

    function setError(input, msg) {
      const field = input.closest('.field');
      if (!field) return;
      field.classList.add('has-error');
      const errorEl = field.querySelector('.field-error');
      if (errorEl) errorEl.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
    }

    function clearError(input) {
      const field = input.closest('.field');
      if (!field) return;
      field.classList.remove('has-error');
      const errorEl = field.querySelector('.field-error');
      if (errorEl) errorEl.textContent = '';
      input.removeAttribute('aria-invalid');
    }

    [nameInput, treatmentSelect].forEach((el) => {
      if (el) {
        el.addEventListener('input', () => clearError(el));
        el.addEventListener('change', () => clearError(el));
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const digits = phone.replace(/\D/g, '');
      const treatment = treatmentSelect ? treatmentSelect.value : '';
      const preferredTime = timeSelect ? timeSelect.value : 'Qualquer horário';
      const notes = notesInput ? notesInput.value.trim() : '';

      let firstInvalid = null;

      if (!name) {
        setError(nameInput, 'Informe seu nome completo.');
        firstInvalid = firstInvalid || nameInput;
      } else {
        clearError(nameInput);
      }

      if (digits.length < 10 || digits.length > 11) {
        setError(phoneInput, 'Informe um telefone ou WhatsApp válido com DDD.');
        firstInvalid = firstInvalid || phoneInput;
      } else {
        clearError(phoneInput);
      }

      if (!treatment) {
        setError(treatmentSelect, 'Selecione um tratamento de interesse.');
        firstInvalid = firstInvalid || treatmentSelect;
      } else {
        clearError(treatmentSelect);
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      let message = `Olá! Gostaria de agendar uma avaliação na Clínica Lumière Estética.\n\n`;
      message += `*Nome:* ${name}\n`;
      message += `*Telefone:* ${phone}\n`;
      message += `*Interesse:* ${treatment}\n`;
      message += `*Período preferencial:* ${preferredTime}`;
      if (notes) {
        message += `\n*Observações:* ${notes}`;
      }

      const whatsappUrl = `https://wa.me/5511999998888?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });
  }

  /* 12. MOVIMENTO DE DESKTOP (LENIS, GSAP SCROLLTRIGGER, PARALLAX, CURSOR E MAGNETIC HOVER) */
  function setupDesktopMotion() {
    if (prefersReducedMotion || isTouchDevice || !isDesktop()) return;

    // Lenis Smooth Scroll somente no desktop
    if (typeof window.Lenis === 'function') {
      const lenis = new window.Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      if (window.gsap && window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
      }
    }

    // GSAP ScrollTrigger: revelações com deslocamento 24px e parallax suave (<= 8%)
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);

      const revealGroups = document.querySelectorAll('[data-reveal-group]');
      revealGroups.forEach((group) => {
        const children = group.querySelectorAll('[data-reveal]');
        if (!children.length) return;
        window.gsap.from(children, {
          y: 24,
          opacity: 0,
          duration: 0.75,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: group,
            start: 'top 84%',
            once: true
          }
        });
      });

      const parallaxEls = document.querySelectorAll('[data-parallax]');
      parallaxEls.forEach((el) => {
        const shift = parseFloat(el.getAttribute('data-parallax') || '6');
        window.gsap.to(el, {
          yPercent: shift,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });
    }

    // Cursor customizado sutil
    const cursor = document.getElementById('customCursor');
    if (cursor) {
      window.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        cursor.classList.add('is-visible');
      });

      document.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-visible');
      });

      const hoverTargets = document.querySelectorAll('a, button, .gallery-tile, .team-portrait');
      hoverTargets.forEach((target) => {
        target.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
        target.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
      });
    }

    // Hover magnético sutil nos botões primários
    const magneticBtns = document.querySelectorAll('.btn-pill--primary');
    magneticBtns.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.14;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.14;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* INICIALIZAÇÃO */
  document.addEventListener('DOMContentLoaded', () => {
    setupImageFallbacks();
    setupScrollChrome();
    setupMobileMenu();
    setupCounters();
    setupTreatments();
    setupTeamBios();
    setupStepsTimeline();
    setupLightbox();
    setupFaq();
    setupLiveStatus();
    setupForm();
    setupDesktopMotion();
  });
})();
