/* =========================================================
   LOCALES LA OFERTA · script.js
   Stack: GSAP + ScrollTrigger + Lenis + AOS + Lucide
   ========================================================= */

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
const isTouch = window.matchMedia('(hover:none)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- PRELOADER (DOMContentLoaded, no espera al video) ---------- */
const preloader = document.getElementById('preloader');
function startReveal() {
    if (!preloader) return;
    setTimeout(() => {
        preloader.classList.add('done');
        gsap.to('.word-reveal > span', {
            y: 0,
            duration: 1,
            stagger: 0.12,
            ease: 'power3.out',
            delay: 0.2,
            onComplete: () => {
                // Liberar el overflow para que la sombra no se vea como un rectángulo cortado
                document.querySelectorAll('.word-reveal').forEach(w => {
                    w.style.overflow = 'visible';
                });
            }
        });
        if (!prefersReduced) {
            const heroSection = document.querySelector('section');
            if (heroSection) {
                gsap.to('#heroBg', {
                    yPercent: 15,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: heroSection,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: 1
                    }
                });
            }
        }
        setTimeout(() => preloader.remove(), 1000);
    }, 1500);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startReveal);
} else {
    startReveal();
}

/* Asegurar autoplay del video del hero (iOS a veces necesita un nudge) */
const heroVideo = document.getElementById('heroBg');
if (heroVideo && heroVideo.tagName === 'VIDEO') {
    const tryPlay = () => heroVideo.play().catch(() => {});
    heroVideo.addEventListener('canplay', tryPlay, { once: true });
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
}

/* ---------- LENIS SMOOTH SCROLL (defensive, responsive) ---------- */
let lenis = null;
if (typeof Lenis !== 'undefined' && !prefersReduced) {
    try {
        lenis = new Lenis({
            lerp: 0.12,           // más responsivo que duration (0.08-0.15 = sweet spot)
            wheelMultiplier: 1.0, // no acelerar/desacelerar el wheel
            smoothWheel: true,
            smoothTouch: false,   // touch nativo en móvil
            // Lenis respeta [data-lenis-prevent] por default
        });
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        lenis.on('scroll', ScrollTrigger.update);

        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', (e) => {
                const id = a.getAttribute('href');
                if (id.length > 1) {
                    const target = document.querySelector(id);
                    if (target) {
                        e.preventDefault();
                        lenis.scrollTo(target, { offset: -80, duration: 1.0 });
                    }
                }
            });
        });
    } catch (err) { console.warn('Lenis init failed:', err); lenis = null; }
}
// Stub mínimo si Lenis no está disponible (touch / reduced-motion / fail)
if (!lenis) lenis = { stop(){}, start(){}, scrollTo(t){ if(t&&t.scrollIntoView) t.scrollIntoView({behavior:'smooth'}); } };

/* ---------- AOS ---------- */
AOS.init({ duration: 1000, once: true, disable: prefersReduced });

/* ---------- LUCIDE ---------- */
lucide.createIcons();

/* ---------- CURSOR CUSTOM ---------- */
if (!isTouch && !prefersReduced) {
    const dot   = document.getElementById('cursorDot');
    const ring  = document.getElementById('cursorRing');
    const trails = [
        document.getElementById('cursorTrail1'),
        document.getElementById('cursorTrail2'),
        document.getElementById('cursorTrail3'),
    ];

    const dotX  = gsap.quickTo(dot,  'x', { duration: 0.05, ease: 'power3.out' });
    const dotY  = gsap.quickTo(dot,  'y', { duration: 0.05, ease: 'power3.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.4,  ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.4,  ease: 'power3.out' });
    const trailMovers = trails.map((t, i) => ({
        x: gsap.quickTo(t, 'x', { duration: 0.6 + i * 0.15, ease: 'power3.out' }),
        y: gsap.quickTo(t, 'y', { duration: 0.6 + i * 0.15, ease: 'power3.out' }),
    }));

    let mouseDown = false;
    document.addEventListener('mousemove', (e) => {
        dotX(e.clientX); dotY(e.clientY);
        ringX(e.clientX); ringY(e.clientY);
        trailMovers.forEach(t => { t.x(e.clientX); t.y(e.clientY); });
        trails.forEach((t, i) => { t.style.opacity = mouseDown ? 0.9 : (0.5 - i * 0.15); });
    });
    document.addEventListener('mousedown', () => { mouseDown = true; gsap.to(ring, { scale: 0.7, duration: 0.2 }); });
    document.addEventListener('mouseup',   () => { mouseDown = false; gsap.to(ring, { scale: 1,   duration: 0.2 }); });

    document.querySelectorAll('a, button, [data-cursor], summary, input, select, textarea').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // Ocultar cursor sobre iframes (si hubiera)
    document.querySelectorAll('iframe').forEach(f => {
        f.addEventListener('mouseenter', () => {
            dot.style.opacity = ring.style.opacity = '0';
        });
        f.addEventListener('mouseleave', () => {
            dot.style.opacity = ring.style.opacity = '1';
        });
    });
}

/* ---------- NAV SCROLL ---------- */
const nav = document.getElementById('mainNav');
ScrollTrigger.create({
    start: 'top -50',
    end: 99999,
    onUpdate: (self) => {
        if (self.scroll() > 50) nav.classList.add('nav-scrolled');
        else nav.classList.remove('nav-scrolled');
    }
});

/* ---------- REVEAL UP (helper, se llama después de inyectar contenido dinámico) ---------- */
function setupReveals() {
    document.querySelectorAll('.reveal-up:not(.reveal-bound)').forEach((el) => {
        el.classList.add('reveal-bound');
        // Si ya está en viewport al crearse, mostrar inmediatamente
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.9 && r.bottom > 0) {
            el.classList.add('is-visible');
            return;
        }
        ScrollTrigger.create({
            trigger: el,
            start: 'top 88%',
            once: true,
            onEnter: () => el.classList.add('is-visible')
        });
    });
}
// Primer pase para los reveals del HTML estático
setupReveals();

/* ---------- TILT 3D (CSS direct, NO :hover transform) ---------- */
if (!isTouch && !prefersReduced) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
        let rect;
        let raf = null;
        let targetX = 0, targetY = 0;
        let curX = 0, curY = 0;

        const onEnter = () => { rect = card.getBoundingClientRect(); };

        const onMove = (e) => {
            if (!rect) rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width  - 0.5;
            const y = (e.clientY - rect.top)  / rect.height - 0.5;
            targetX = -y * 8; // rotateX
            targetY =  x * 12; // rotateY
            if (!raf) raf = requestAnimationFrame(loop);
        };

        const loop = () => {
            curX += (targetX - curX) * 0.12;
            curY += (targetY - curY) * 0.12;
            card.style.transform = `perspective(1000px) rotateX(${curX}deg) rotateY(${curY}deg)`;
            if (Math.abs(targetX - curX) > 0.05 || Math.abs(targetY - curY) > 0.05) {
                raf = requestAnimationFrame(loop);
            } else {
                raf = null;
            }
        };

        const onLeave = () => {
            targetX = 0; targetY = 0;
            if (!raf) raf = requestAnimationFrame(loop);
            setTimeout(() => { card.style.transform = ''; }, 600);
        };

        card.addEventListener('mouseenter', onEnter);
        card.addEventListener('mousemove',  onMove);
        card.addEventListener('mouseleave', onLeave);
    });
}

/* ---------- KPI COUNTERS + LINE ---------- */
ScrollTrigger.create({
    trigger: '#kpi-ignition',
    start: 'top 80%',
    onEnter: triggerKpi,
    onEnterBack: triggerKpi,
    onLeave: resetKpi,
    onLeaveBack: resetKpi
});

function triggerKpi() {
    const line = document.getElementById('kpiLine');
    line.classList.add('run');

    document.querySelectorAll('.kpi-dot').forEach((d, i) => {
        setTimeout(() => d.classList.add('run'), 380 * i);
    });

    document.querySelectorAll('[data-counter]').forEach((el) => {
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const obj = { v: 0 };
        gsap.to(obj, {
            v: target,
            duration: 1.6,
            ease: 'power3.out',
            onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; }
        });
    });
}

function resetKpi() {
    document.getElementById('kpiLine').classList.remove('run');
    document.querySelectorAll('.kpi-dot').forEach(d => d.classList.remove('run'));
    document.querySelectorAll('[data-counter]').forEach(el => { el.textContent = '0'; });
}

/* ---------- MAGNETIC BUTTONS ---------- */
if (!isTouch && !prefersReduced) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
        const inner = btn.querySelector('.magnetic-inner') || btn;
        const strength = 0.35;
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - (rect.left + rect.width / 2);
            const y = e.clientY - (rect.top + rect.height / 2);
            gsap.to(btn,   { x: x * strength * 0.5, y: y * strength * 0.5, duration: 0.5, ease: 'power3.out' });
            gsap.to(inner, { x: x * strength,       y: y * strength,       duration: 0.5, ease: 'power3.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn,   { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,.5)' });
            gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,.5)' });
        });
    });
}

/* ---------- COUPON MODAL (Mersan 10%) ---------- */
const modal    = document.getElementById('couponModal');
const closeBtn = document.getElementById('closeCoupon');
const saveBtn  = document.getElementById('saveCoupon');

const openModal  = () => {
    modal.classList.add('active');
    document.body.classList.add('menu-open'); // oculta WA FAB
    lenis.stop();
};
const closeModal = () => {
    modal.classList.remove('active');
    document.body.classList.remove('menu-open');
    lenis.start();
};

// Trigger: cuando el usuario hace 2 ráfagas de scroll separadas O después de 14s
sessionStorage.removeItem('couponShown');
let couponTriggered = false;

const fireCoupon = () => {
    if (couponTriggered) return;
    couponTriggered = true;
    sessionStorage.setItem('couponShown', '1');
    setTimeout(openModal, 250);
};

let burstCount = 0, isInBurst = false, burstTimer;
const onAnyScroll = () => {
    if (couponTriggered) return;
    if (!isInBurst) {
        isInBurst = true;
        burstCount++;
        if (burstCount >= 2) { fireCoupon(); cleanup(); return; }
    }
    clearTimeout(burstTimer);
    burstTimer = setTimeout(() => { isInBurst = false; }, 700);
};
const cleanup = () => {
    window.removeEventListener('scroll', onAnyScroll);
    window.removeEventListener('wheel', onAnyScroll);
    window.removeEventListener('touchmove', onAnyScroll);
    clearTimeout(idleFire);
};
window.addEventListener('scroll',    onAnyScroll, { passive: true });
window.addEventListener('wheel',     onAnyScroll, { passive: true });
window.addEventListener('touchmove', onAnyScroll, { passive: true });
const idleFire = setTimeout(fireCoupon, 14000);

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); });

saveBtn.addEventListener('click', () => {
    saveBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Cupón Mersan Guardado ✓';
    saveBtn.classList.replace('bg-laOfertaBlue', 'bg-green-500');
    lucide.createIcons();
});

/* ---------- DIRECTORIO DE LOCALES ---------- */
const locales = [
    { id: 57, name: "San Pablo",        title: "LOCAL 57 LA OFERTA COMERCIAL LIMITADA",       addr: "San Pablo 2829, Santiago, Región Metropolitana" },
    { id: 56, name: "Cerrillos",        title: "LOCAL 56 LA OFERTA COMERCIAL LIMITADA",       addr: "Gral. Velásquez 3421, Cerrillos, Región Metropolitana" },
    { id: 53, name: "San Miguel",       title: "LOCAL 53 LA OFERTA COMERCIAL LIMITADA",       addr: "C. Valdovinos N°1229, San Miguel, Chile" },
    { id: 54, name: "Arturo Prat",      title: "LOCAL 54 LA OFERTA COMERCIAL LIMITADA",       addr: "Arturo Prat 2198, Santiago, Región Metropolitana" },
    { id: 59, name: "PAC Hurtado",      title: "LOCAL 59 LA OFERTA COMERCIAL LIMITADA",       addr: "Av. Padre Alberto Hurtado 4030, Pedro Aguirre Cerda, Región Metropolitana" },
    { id: 60, name: "La Florida",       title: "LOCAL 60 LA OFERTA COMERCIAL LIMITADA",       addr: "Lía Aguirre 153, La Florida, Región Metropolitana" },
    { id: 61, name: "Quinta Normal",    title: "LOCAL 61 LA OFERTA COMERCIAL LIMITADA",       addr: "Av. José Joaquín Pérez 5881, Santiago, Quinta Normal, Región Metropolitana" },
    { id: 62, name: "Peñalolén",        title: "LOCAL 62 LA OFERTA COMERCIAL LIMITADA",       addr: "Av. Mariano Sánchez Fontecilla 1520, Peñalolén, Región Metropolitana" },
    { id: 65, name: "Cerrillos II",     title: "LOCAL 65 LA OFERTA COMERCIAL LIMITADA",       addr: "Gral. Velásquez 3421, Cerrillos, Región Metropolitana" },
    { id: 63, name: "La Estrella",      title: "LOCAL 63 LA OFERTA COMERCIAL LIMITADA",       addr: "Av. San José de la Estrella 1370, b, La Florida, Región Metropolitana" },
    { id: 68, name: "La Rural",         title: "LOCAL 68 LA OFERTA COMERCIAL LIMITADA",       addr: "Nueva La Rural 3871, Cerrillos, Región Metropolitana" },
    { id: 70, name: "Cerrillos III",    title: "LOCAL 70 LA OFERTA COMERCIAL LIMITADA",       addr: "Gral. Velásquez 3421, Cerrillos, Región Metropolitana" },
    { id: 71, name: "PAC L13",          title: "LOCAL 71 LA OFERTA COMERCIAL LIMITADA",       addr: "Av. Padre Alberto Hurtado 4030, Local 13, Pedro Aguirre Cerda, Región Metropolitana" },
    { id: 73, name: "PAC L16-17",       title: "LOCAL 73 LA OFERTA COMERCIAL LIMITADA",       addr: "Av. Padre Alberto Hurtado 4030, Local 16-17, Pedro Aguirre Cerda, Región Metropolitana" },
    { id: 75, name: "PAC Cerrillos",    title: "LOCAL 75 LA OFERTA COMERCIAL LIMITADA",       addr: "Av. Padre Alberto Hurtado 4030, Cerrillos, Pedro Aguirre Cerda, Región Metropolitana" },
    { id: 74, name: "PAC L1-3",         title: "LOCAL 74 LA OFERTA COMERCIAL LIMITADA",       addr: "Av. Padre Alberto Hurtado 4030, Local 1-3, Pedro Aguirre Cerda, Región Metropolitana" },
    { id: 77, name: "Bodegas Mersan",   title: "LOCAL 77 — BODEGAS MERSAN (GALPÓN 5)",        addr: "Av. José Joaquín Prieto 9001, Lo Espejo, Región Metropolitana" }
];

const accordion = document.getElementById('locales-accordion');
locales.forEach((local, index) => {
    const isHighlight = local.id === 77;
    const q          = encodeURIComponent(local.addr);
    const mapEmbed   = `https://www.google.com/maps?q=${q}&output=embed`;
    const directions = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
    const viewMaps   = `https://www.google.com/maps/search/?api=1&query=${q}`;

    const item = document.createElement('details');
    item.className = `group glass-news rounded-2xl overflow-hidden transition-all reveal-up ${isHighlight ? 'border-laOfertaYellow/40' : ''}`;

    item.innerHTML = `
        <summary data-cursor class="flex items-center gap-4 md:gap-6 p-5 md:p-6 list-none hover:bg-white/[0.03] transition-colors">
            <span class="font-anton text-2xl md:text-3xl ${isHighlight ? 'text-laOfertaYellow' : 'text-laOfertaRed/70'} w-10 md:w-14 flex-shrink-0">${String(index + 1).padStart(2, '0')}</span>
            <div class="flex-1 min-w-0">
                <p class="text-laOfertaYellow text-[9px] font-black uppercase tracking-[0.3em] mb-1">${isHighlight ? '⭐ Cupón 10% disponible' : 'Abarrotes'}</p>
                <h4 class="font-syne text-sm md:text-lg uppercase tracking-tight leading-tight ${isHighlight ? 'text-laOfertaYellow' : ''}">${local.title}</h4>
                <p class="text-white/50 text-xs mt-1.5 leading-snug hidden md:block">${local.addr}</p>
            </div>
            <span class="bg-laOfertaRed/15 text-laOfertaRed w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-open:rotate-45">
                <i data-lucide="plus" class="w-5 h-5"></i>
            </span>
        </summary>

        <div class="px-5 md:px-6 pb-6 pt-2">
            <p class="md:hidden text-white/60 text-sm mb-4 leading-snug"><span class="font-bold text-white/80">Dirección:</span> ${local.addr}</p>

            <div class="relative overflow-hidden rounded-2xl border border-white/10 mb-4 bg-white/5" style="aspect-ratio: 16/9;">
                <iframe
                    loading="lazy"
                    src="${mapEmbed}"
                    class="absolute inset-0 w-full h-full"
                    style="border:0; filter: invert(0.92) hue-rotate(180deg) saturate(0.7);"
                    referrerpolicy="no-referrer-when-downgrade"
                    allowfullscreen></iframe>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
                <a href="${directions}" target="_blank" rel="noopener" data-cursor
                   class="flex-1 bg-laOfertaRed text-white font-bold py-4 px-5 rounded-xl hover:bg-white hover:text-laOfertaRed transition-all uppercase tracking-tight text-xs flex items-center justify-center gap-2 shadow-lg">
                    <i data-lucide="navigation" class="w-4 h-4"></i>
                    Cómo llegar
                </a>
                <a href="${viewMaps}" target="_blank" rel="noopener" data-cursor
                   class="flex-1 bg-white/5 border border-white/10 text-white font-bold py-4 px-5 rounded-xl hover:bg-white/10 hover:border-laOfertaYellow transition-all uppercase tracking-tight text-xs flex items-center justify-center gap-2">
                    <i data-lucide="map-pin" class="w-4 h-4"></i>
                    Ver en Google Maps
                </a>
            </div>
        </div>
    `;
    accordion.appendChild(item);
});

/* ---------- LISTADO RÁPIDO ---------- */
const listEl = document.getElementById('locales-list');
locales.slice(0, 12).forEach(l => {
    const q       = encodeURIComponent(l.addr);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
    const card = document.createElement('article');
    card.className = 'glass-news rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform reveal-up';
    card.innerHTML = `
        <div class="flex items-start gap-3">
            <span class="font-anton text-3xl text-laOfertaRed leading-none">${l.id}</span>
            <div>
                <p class="text-laOfertaYellow text-[9px] font-black uppercase tracking-[0.3em] mb-1">Local ${l.id}</p>
                <h4 class="font-syne text-base uppercase tracking-tight leading-tight">${l.name}</h4>
            </div>
        </div>
        <p class="text-white/60 text-sm leading-snug flex-1">
            <span class="text-white/80 font-bold">Dirección:</span> ${l.addr}
        </p>
        <a href="${mapsUrl}" target="_blank" rel="noopener" data-cursor
           class="inline-flex items-center gap-2 text-laOfertaRed hover:text-laOfertaYellow transition-colors text-xs font-bold uppercase tracking-widest mt-auto">
            Ver mapa
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </a>
    `;
    listEl.appendChild(card);
});

/* ---------- STORE CAROUSEL HORIZONTAL (pointer events, no Draggable) ---------- */
const storeImages = [
    { url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=900', label: 'San Pablo 2829', tag: 'Local 57' },
    { url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=900', label: 'Cerrillos · Velásquez 3421', tag: 'Local 56' },
    { url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=900', label: 'San Miguel · Valdovinos', tag: 'Local 53' },
    { url: 'https://images.unsplash.com/photo-1553787499-6f9133860278?auto=format&fit=crop&q=80&w=900', label: 'Bodegas Mersan · Galpón 5', tag: '⭐ Cupón 10%' },
    { url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=900', label: 'La Florida · Lía Aguirre', tag: 'Local 60' },
    { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&q=80&w=900', label: 'Quinta Normal · J.J. Pérez', tag: 'Local 61' },
    { url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=900', label: 'PAC Hurtado · Galpón', tag: 'Local 59' },
];

const carousel = document.getElementById('storeCarousel');
storeImages.forEach((s, i) => {
    const isHighlight = s.tag.includes('Cupón');
    const slide = document.createElement('article');
    slide.className = `store-card relative w-[300px] md:w-[420px] aspect-[3/4] rounded-3xl overflow-hidden ${isHighlight ? 'ring-2 ring-laOfertaYellow' : ''}`;
    slide.innerHTML = `
        <img src="${s.url}" alt="${s.label}" loading="lazy" decoding="async" class="w-full h-full object-cover transition-all duration-700">
        <div class="absolute inset-0 bg-gradient-to-t from-brandDark via-brandDark/40 to-transparent"></div>
        <div class="absolute top-4 left-4">
            <span class="inline-block px-3 py-1.5 rounded-md ${isHighlight ? 'bg-laOfertaYellow text-brandDark' : 'bg-laOfertaRed text-white'} text-[10px] font-black uppercase tracking-[0.3em] badge-flash">${s.tag}</span>
        </div>
        <div class="absolute bottom-6 left-6 right-6">
            <p class="text-white/60 text-[10px] uppercase tracking-[0.3em] mb-2">Locales La Oferta</p>
            <h3 class="font-syne text-2xl md:text-3xl uppercase tracking-tight leading-tight text-white">${s.label}</h3>
        </div>
    `;
    carousel.appendChild(slide);
});

/* Pointer-events drag (igual que digitals.cl, NO Draggable) */
(function setupHCarousel(el) {
    let isDown = false, startX, startScrollLeft, pointerId;
    let dragMoved = false;

    el.addEventListener('pointerdown', (e) => {
        isDown = true;
        dragMoved = false;
        startX = e.pageX - el.offsetLeft;
        startScrollLeft = el.scrollLeft;
        pointerId = e.pointerId;
        try { el.setPointerCapture(pointerId); } catch (_) {}
        el.classList.add('dragging');
    });

    el.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX) * 1.4;
        if (Math.abs(walk) > 5) dragMoved = true;
        el.scrollLeft = startScrollLeft - walk;
    });

    const release = (e) => {
        if (!isDown) return;
        isDown = false;
        el.classList.remove('dragging');
        try { if (pointerId !== undefined) el.releasePointerCapture(pointerId); } catch (_) {}
    };
    el.addEventListener('pointerup',     release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave',  release);

    // Click suppressor durante drag
    el.addEventListener('click', (e) => {
        if (dragMoved) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    // No interceptamos wheel: Lenis maneja vertical, navegador maneja horizontal
})(carousel);

/* ---------- FORM ---------- */
document.getElementById('leadForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const inner = btn.querySelector('.magnetic-inner') || btn;
    inner.textContent = "CONECTANDO...";
    btn.classList.add('animate-pulse');
    setTimeout(() => {
        inner.textContent = "✓ ACCESO CONCEDIDO";
        btn.classList.replace('bg-white', 'bg-green-400');
        btn.classList.remove('animate-pulse');
    }, 1600);
});

/* Refresh icons after dynamic injection */
lucide.createIcons();

/* Crear reveals para todo el contenido inyectado (locales, listado, carrusel) */
setupReveals();

/* Refresh ScrollTrigger after dynamic content */
setTimeout(() => {
    ScrollTrigger.refresh();
    setupReveals(); // segundo pase por si el primero no atrapó alguno
}, 250);

/* Fallback final defensivo: en 4s, si quedó algún .reveal-up sin mostrar, lo mostramos */
setTimeout(() => {
    document.querySelectorAll('.reveal-up:not(.is-visible)').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('is-visible');
    });
}, 4000);
