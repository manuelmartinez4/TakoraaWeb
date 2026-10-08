(() => {
  const root = document.documentElement;
  if (root.dataset.page !== 'home') return;

  let language = 'es';
  const readPreference = (key) => {
    try { return window.localStorage.getItem(key); } catch { return null; }
  };
  const savePreference = (key, value) => {
    try { window.localStorage.setItem(key, value); } catch { /* Preferences are optional. */ }
  };
  const localize = (spanish, english) => language === 'en' ? english : spanish;
  // Only these explicitly marked homepage strings are translated; markup and links stay intact.
  const translations = [...document.querySelectorAll('[data-en]')].map((element) => ({
    element,
    es: [...element.childNodes].map((node) => node.nodeName === 'BR' ? '\n' : node.textContent).join(''),
    en: element.dataset.en,
  }));
  const translatedAttributes = ['aria-label', 'title'].flatMap((attribute) =>
    [...document.querySelectorAll('[data-en-' + attribute + ']')].map((element) => ({
      element, attribute, es: element.getAttribute(attribute), en: element.getAttribute('data-en-' + attribute),
    })));
  const spanishTitle = document.title;
  const description = document.querySelector('meta[name="description"]');
  const spanishDescription = description.content;
  const themeButton = document.querySelector('.theme-toggle');
  const languageButton = document.querySelector('.language-toggle');
  const syncPreferenceLabels = () => {
    const dark = root.dataset.theme === 'dark';
    themeButton.setAttribute('aria-checked', String(dark));
    themeButton.setAttribute('aria-label', localize('Modo oscuro', 'Dark mode'));
    themeButton.title = dark ? localize('Cambiar a modo claro', 'Switch to light mode') : localize('Cambiar a modo oscuro', 'Switch to dark mode');
    const languageLabel = localize('Switch to English', 'Cambiar a español');
    languageButton.setAttribute('aria-label', languageLabel);
    languageButton.title = languageLabel;
    languageButton.lang = language === 'en' ? 'es' : 'en';
  };
  themeButton.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#081120' : '#f7f6f2';
    savePreference('takoraa-theme', theme);
    syncPreferenceLabels();
  });
  themeButton.hidden = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.querySelector('.motion-toggle');
  const scene = document.querySelector('.playground');
  const revealItems = [...document.querySelectorAll('.reveal')];
  let savedMotion = null;

  try {
    savedMotion = window.localStorage.getItem('takoraa-motion');
  } catch {
    // The site remains usable when storage is unavailable.
  }

  const motionEnabled = () => root.dataset.motion === 'on';
  const resetScene = () => {
    if (!scene) return;
    for (const [name, value] of Object.entries({ '--mx': '0px', '--my': '0px', '--rx': '0deg', '--ry': '0deg' })) {
      scene.style.setProperty(name, value);
    }
  };

  const setMotion = (enabled, persist = false) => {
    root.dataset.motion = enabled ? 'on' : 'off';
    const label = enabled ? localize('Pausar animaciones', 'Pause animations') : localize('Activar animaciones', 'Enable animations');
    motionButton?.setAttribute('aria-label', label);
    motionButton?.setAttribute('title', label);
    if (motionButton) motionButton.querySelector('.motion-label').textContent = label;
    if (!enabled) {
      resetScene();
      revealItems.forEach((item) => item.classList.add('is-visible'));
    }
    if (persist) {
      try {
        window.localStorage.setItem('takoraa-motion', root.dataset.motion);
      } catch {
        // A blocked preference store must not interrupt an interaction.
      }
    }
  };

  setMotion(!reducedMotion.matches && savedMotion !== 'off');
  if (motionButton) {
    motionButton.addEventListener('click', () => setMotion(!motionEnabled(), true));
    motionButton.hidden = false;
  }
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) setMotion(false);
  });

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#site-nav');
  if (menuButton && navigation) {
    const mobileViewport = window.matchMedia('(max-width: 980px)');
    const closeMenu = ({ restoreFocus = false } = {}) => {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.hidden = mobileViewport.matches;
      if (restoreFocus) menuButton.focus();
    };
    const syncNavigation = () => {
      const focusWasInNavigation = navigation.contains(document.activeElement);
      menuButton.hidden = !mobileViewport.matches;
      closeMenu({ restoreFocus: mobileViewport.matches && focusWasInNavigation });
      if (!mobileViewport.matches && document.activeElement === menuButton) {
        navigation.querySelector('a')?.focus();
      }
    };
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      navigation.hidden = isOpen;
    });
    navigation.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link || !mobileViewport.matches) return;
      closeMenu();
      document.querySelector(link.hash)?.focus({ preventScroll: true });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        closeMenu({ restoreFocus: true });
      }
    });
    document.addEventListener('click', (event) => {
      if (mobileViewport.matches && !event.target.closest('.site-header')) {
        closeMenu({ restoreFocus: navigation.contains(document.activeElement) });
      }
    });
    mobileViewport.addEventListener('change', syncNavigation);
    syncNavigation();
  }

  if (scene) {
    const demoControls = scene.querySelector('.demo-controls');
    const demoButtons = [...scene.querySelectorAll('[data-demo]')];
    const panels = [...scene.querySelectorAll('.demo-panel')];
    demoButtons.forEach((button) => {
      button.addEventListener('click', () => {
        demoButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
        scene.dataset.demo = button.dataset.demo;
        panels.forEach((panel) => { panel.hidden = panel.id !== button.getAttribute('aria-controls'); });
      });
    });
    if (demoControls) demoControls.hidden = false;

    const shuffleButton = scene.querySelector('.shuffle-scene');
    if (shuffleButton) {
      shuffleButton.addEventListener('click', () => {
        scene.dataset.layout = String((Number(scene.dataset.layout) + 1) % 3);
      });
      shuffleButton.hidden = false;
    }
    const flowerButton = scene.querySelector('.flower-toy');
    if (flowerButton) {
      let flowerTurn = 0;
      let flowerClicks = 0;
      flowerButton.addEventListener('click', () => {
        flowerTurn += 225;
        scene.style.setProperty('--flower-turn', flowerTurn + 'deg');
        flowerClicks += 1;
        if (flowerClicks === 30) document.body.classList.add('surprise-unlocked');
      });
      flowerButton.hidden = false;
    }

    const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    scene.addEventListener('pointermove', (event) => {
      if (!motionEnabled() || !precisePointer.matches || event.pointerType === 'touch') return;
      const bounds = scene.getBoundingClientRect();
      pointerX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!motionEnabled()) return;
        scene.style.setProperty('--mx', (pointerX * 7).toFixed(2) + 'px');
        scene.style.setProperty('--my', (pointerY * 5).toFixed(2) + 'px');
        scene.style.setProperty('--rx', (-pointerY * 2).toFixed(2) + 'deg');
        scene.style.setProperty('--ry', (pointerX * 2).toFixed(2) + 'deg');
      });
    });
    scene.addEventListener('pointerleave', () => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      resetScene();
    });
  }

  const ticker = document.querySelector('.ticker');
  const tickerTrack = ticker?.querySelector('.ticker-track');
  const tickerCycle = tickerTrack?.firstElementChild;
  let fitTicker = () => {};
  if (tickerCycle) {
    fitTicker = (refreshCopies = false) => {
      const cycleWidth = tickerCycle.getBoundingClientRect().width;
      if (!cycleWidth) return;
      if (refreshCopies) tickerTrack.replaceChildren(tickerCycle);
      // Keep a full viewport of text after the cycle that is sliding out.
      const copies = Math.max(2, Math.ceil(ticker.clientWidth / cycleWidth) + 1);
      while (tickerTrack.children.length < copies) tickerTrack.append(tickerCycle.cloneNode(true));
      while (tickerTrack.children.length > copies) tickerTrack.lastElementChild.remove();
      tickerTrack.style.setProperty('--ticker-step', cycleWidth + 'px');
      tickerTrack.style.setProperty('--ticker-duration', cycleWidth / 45 + 's');
      tickerTrack.dataset.loopReady = '';
    };
    document.fonts.ready.then(() => fitTicker());
    if ('ResizeObserver' in window) new ResizeObserver(() => fitTicker()).observe(ticker);
    else window.addEventListener('resize', () => fitTicker());
  }

  const services = {
    apps: { title: ['Apps', 'Apps'], description: ['Software a medida para empresas y profesionales.', 'Custom software for businesses and professionals.'], icon: 'app', color: '#8268ff' },
    portales: { title: ['Portales', 'Portals'], description: ['Portales a medida para empresas y profesionales.', 'Custom portals for businesses and professionals.'], icon: 'portal', color: '#20d4bf' },
    dashboards: { title: ['Dashboards', 'Dashboards'], description: ['Un dashboard de métricas entregado con el MVP.', 'A metrics dashboard delivered with your MVP.'], icon: 'chart', color: '#e4ddfa' },
    agentes: { title: ['Agentes', 'Agents'], description: ['La IA acelera el trabajo. El criterio es humano y no se delega.', 'AI speeds up the work. Judgment stays human and is never delegated.'], icon: 'agent', color: '#d96491' },
    automatizaciones: { title: ['Automatizaciones', 'Automations'], description: ['Automatizaciones a medida para empresas y profesionales.', 'Custom automations for businesses and professionals.'], icon: 'flow', color: '#081120', ink: '#f7f6f2' },
    integraciones: { title: ['Integraciones', 'Integrations'], description: ['Integraciones a medida para empresas y profesionales.', 'Custom integrations for businesses and professionals.'], icon: 'connect', color: '#bce9e2' },
    mantenimiento: { title: ['Mantenimiento', 'Maintenance'], description: ['Operación y mantenimiento desde el mes siguiente a la entrega.', 'Operations and maintenance starting the month after delivery.'], icon: 'support', color: '#e8a24c' },
  };
  const servicePreview = document.querySelector('#service-preview');
  const serviceButtons = [...document.querySelectorAll('button[data-service]')];
  let serviceTimer = 0;
  const translateService = () => {
    if (!servicePreview) return;
    const service = services[servicePreview.dataset.service];
    const title = localize(...service.title);
    servicePreview.querySelector('h3').textContent = title;
    servicePreview.querySelector('.service-preview-bottom p').textContent = localize(...service.description);
    servicePreview.querySelector('.service-preview-bottom a').setAttribute('aria-label', localize('Hablar sobre ', 'Talk about ') + title.toLowerCase());
  };
  if (servicePreview) {
    serviceButtons.forEach((button, index) => {
      button.disabled = false;
      button.addEventListener('click', () => {
        const service = services[button.dataset.service];
        if (!service || servicePreview.dataset.service === button.dataset.service) return;
        serviceButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
        servicePreview.dataset.service = button.dataset.service;
        servicePreview.style.setProperty('--plate', service.color);
        servicePreview.style.setProperty('--plate-ink', service.ink || '#081120');
        translateService();
        servicePreview.querySelector('.service-position').textContent = String(index + 1).padStart(2, '0') + ' / 07';
        servicePreview.querySelectorAll('.service-sculpture use').forEach((icon) => icon.setAttribute('href', '#icon-' + service.icon));
        clearTimeout(serviceTimer);
        servicePreview.classList.remove('is-changing');
        if (motionEnabled()) {
          // Restart only this short, user-triggered transition.
          void servicePreview.offsetWidth;
          servicePreview.classList.add('is-changing');
          serviceTimer = window.setTimeout(() => servicePreview.classList.remove('is-changing'), 660);
        }
      });
    });
  }

  const setLanguage = (value, persist = false) => {
    language = value === 'en' ? 'en' : 'es';
    root.lang = language === 'en' ? 'en' : 'es-AR';
    root.dataset.language = language;
    translations.forEach(({ element, ...text }) => {
      const lines = text[language].split('\n');
      element.replaceChildren(...lines.flatMap((line, index) => index ? [document.createElement('br'), document.createTextNode(line)] : [document.createTextNode(line)]));
    });
    translatedAttributes.forEach(({ element, attribute, ...text }) => element.setAttribute(attribute, text[language]));
    document.title = localize(spanishTitle, 'Takoraa | Custom software. We build it. You see it.');
    description.content = localize(spanishDescription, 'Custom software for businesses and professionals. And we stay on to run what we build.');
    syncPreferenceLabels();
    setMotion(motionEnabled());
    translateService();
    fitTicker(true);
    if (persist) savePreference('takoraa-language', language);
  };
  languageButton.addEventListener('click', () => setLanguage(language === 'en' ? 'es' : 'en', true));
  setLanguage(readPreference('takoraa-language'));
  languageButton.hidden = false;

  const track = document.querySelector('#principles-track');
  const carouselControls = document.querySelector('.carousel-controls');
  if (track && carouselControls) {
    const cards = [...track.querySelectorAll('.principle')];
    const previousButton = carouselControls.querySelector('.carousel-prev');
    const nextButton = carouselControls.querySelector('.carousel-next');
    let carouselFrame = 0;

    const maximumScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const stepSize = () => cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
    const syncCarousel = () => {
      const maximum = maximumScroll();
      const atEnd = track.scrollLeft >= maximum - 3;
      previousButton.disabled = track.scrollLeft < 3;
      nextButton.disabled = atEnd;
    };
    const scrollToPosition = (position) => {
      track.scrollTo({ left: Math.max(0, Math.min(maximumScroll(), position)), behavior: motionEnabled() ? 'smooth' : 'instant' });
    };
    const advance = (direction) => scrollToPosition(track.scrollLeft + direction * stepSize());
    previousButton.addEventListener('click', () => advance(-1));
    nextButton.addEventListener('click', () => advance(1));

    let dragPointerId = null;
    let dragStartX = 0;
    let dragStartScroll = 0;
    const finishDrag = (event) => {
      if (dragPointerId === null || (event.pointerId !== undefined && event.pointerId !== dragPointerId)) return;
      const pointerId = dragPointerId;
      dragPointerId = null;
      track.classList.remove('is-dragging');
      if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
      syncCarousel();
    };
    track.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || dragPointerId !== null) return;
      if (event.target.closest('a, button, input, textarea, select, [contenteditable]')) return;
      event.preventDefault();
      dragPointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      track.scrollTo({ left: dragStartScroll, behavior: 'instant' });
      track.setPointerCapture(event.pointerId);
      track.focus({ preventScroll: true });
    });
    track.addEventListener('pointermove', (event) => {
      if (event.pointerId !== dragPointerId) return;
      event.preventDefault();
      track.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
    });
    track.addEventListener('pointerup', finishDrag);
    track.addEventListener('pointercancel', finishDrag);
    track.addEventListener('lostpointercapture', finishDrag);
    window.addEventListener('blur', finishDrag);
    track.addEventListener('dragstart', (event) => event.preventDefault());
    track.classList.add('is-draggable');

    track.addEventListener('scroll', () => {
      if (carouselFrame) return;
      carouselFrame = requestAnimationFrame(() => {
        carouselFrame = 0;
        syncCarousel();
      });
    }, { passive: true });
    track.addEventListener('keydown', (event) => {
      if (event.target !== track) return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') scrollToPosition(0);
      else if (event.key === 'End') scrollToPosition(maximumScroll());
      else advance(event.key === 'ArrowRight' ? 1 : -1);
    });
    if ('ResizeObserver' in window) new ResizeObserver(syncCarousel).observe(track);
    else window.addEventListener('resize', syncCarousel);
    carouselControls.hidden = false;
    syncCarousel();
  }

  if ('IntersectionObserver' in window && motionEnabled()) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach((item) => {
      if (item.getBoundingClientRect().top < window.innerHeight - 35) return;
      item.classList.add('will-reveal');
      revealObserver.observe(item);
    });
  }

  const previousSections = {
    '#top': '#inicio',
    '#platform': '#servicios',
    '#how-it-works': '#como-trabajamos',
    '#developers': '#contacto',
  };
  const restorePreviousLink = () => {
    const destination = previousSections[window.location.hash];
    if (!destination) return;
    window.history.replaceState(null, '', destination);
    document.querySelector(destination)?.scrollIntoView();
  };
  window.addEventListener('hashchange', restorePreviousLink);
  restorePreviousLink();
})();
