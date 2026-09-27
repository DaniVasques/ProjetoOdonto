(() => {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 767px)');
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
    const main = document.querySelector('main');
    const footer = document.querySelector('.footer');
    const links = [...menu.querySelectorAll('a')];
    let menuFocusTimer;

    function setMenu(open, restoreFocus = false) {
        clearTimeout(menuFocusTimer);
        const expanded = open && mobile.matches;
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.setAttribute('aria-label', expanded ? 'Fechar menu' : 'Abrir menu');
        menu.classList.toggle('is-open', expanded);
        document.body.classList.toggle('menu-open', expanded);
        menu.inert = mobile.matches && !expanded;
        main.inert = expanded;
        footer.inert = expanded;
        if (expanded) menuFocusTimer = setTimeout(() => {
            if (toggle.getAttribute('aria-expanded') === 'true') links[0].focus();
        }, reducedMotion.matches ? 0 : 240);
        else if (restoreFocus) toggle.focus();
    }

    toggle.hidden = false;
    setMenu(false);
    toggle.addEventListener('click', () => {
        setMenu(toggle.getAttribute('aria-expanded') !== 'true', true);
    });
    links.forEach(link => link.addEventListener('click', () => {
        if (!mobile.matches) return;
        setMenu(false);
        const target = document.querySelector(link.hash);
        if (target) {
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
            target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
    }));
    mobile.addEventListener('change', () => {
        const focusWasInMenu = menu.contains(document.activeElement);
        setMenu(false, mobile.matches && focusWasInMenu);
    });
    document.addEventListener('keydown', event => {
        if (toggle.getAttribute('aria-expanded') !== 'true') return;
        if (event.key === 'Escape') {
            event.preventDefault();
            setMenu(false, true);
        }
        if (event.key === 'Tab') {
            const first = document.querySelector('.logo');
            const last = links[links.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    // Reuse the existing carousel; no autoplay or global keyboard interception.
    let swiper;
    if (typeof window.Swiper === 'function') {
        swiper = new window.Swiper('.swiper-depoimentos', {
            slidesPerView: 1,
            loop: true,
            autoHeight: true,
            speed: reducedMotion.matches ? 0 : 450,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            a11y: {
                prevSlideMessage: 'Depoimento anterior',
                nextSlideMessage: 'Próximo depoimento',
                slideLabelMessage: 'Depoimento {{index}} de {{slidesLength}}',
            },
        });
    }

    // Elements stay readable without JS or IntersectionObserver. Animate only
    // on first entry, rather than hiding the entire page while it loads.
    const running = new Set();
    let observer;
    function reveal(element, delay = 0) {
        if (reducedMotion.matches || !element.animate) return;
        const animation = element.animate([
            { opacity: 0, transform: 'translateY(16px)' },
            { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 580, delay, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'backwards' });
        running.add(animation);
        animation.finished.then(() => running.delete(animation)).catch(() => running.delete(animation));
    }

    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver(entries => {
            const visible = entries.filter(entry => entry.isIntersecting);
            visible.forEach((entry, index) => {
                reveal(entry.target, Math.min(index * 65, 195));
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12 });
        document.querySelectorAll(
            '.hero .container > *, .sobre-image, .sobre-content > *, ' +
            '.servicos h2, .servicos .container > p, .servico-item, ' +
            '.agendamento-conteudo > *, .agendamento-image, .depoimentos h2, ' +
            '.swiper-depoimentos, .content-fale-conosco, .mapa'
        ).forEach(element => observer.observe(element));
    }

    reducedMotion.addEventListener('change', () => {
        if (swiper) swiper.params.speed = reducedMotion.matches ? 0 : 450;
        if (reducedMotion.matches) {
            observer?.disconnect();
            running.forEach(animation => animation.cancel());
            running.clear();
        }
    });
})();
