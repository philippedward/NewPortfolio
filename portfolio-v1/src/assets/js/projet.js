"use strict";

import gsap from "gsap";

/* ==============================
   CONFIG — à personnaliser
============================== */
const FALLBACK_CARDS = [
  {
    img: "/images/icon-star.webp",
    title: "Projet 01",
  },
];

const LOOPS = 3; // nombre de tours de la spirale sur tout le trajet d'une carte
const ROTATION_SPEED = 55; // rotation globale additionnelle (deg par unité de progression)
const SCRUB_DURATION = 0.8; // inertie du scroll (plus haut = plus "smooth"/lent à suivre)

/* Trajet FINI (non bouclé) : chaque carte va du centre vers l'extérieur puis disparaît
   définitivement (comme si elle sortait par le haut). Une fois arrivée au bas du scroll,
   la dernière carte a fini de disparaître et rien ne recommence. */
const FADE_IN_END = 0.12; // 0 -> ce point : la carte apparaît depuis le fond (centre)
const FADE_OUT_START = 0.9; // à partir de ce point : la carte commence à s'effacer
const FADE_OUT_END = 1.15; // à ce point : la carte a totalement disparu
const TOTAL_P_RANGE = FADE_OUT_END; // progression totale nécessaire pour que TOUTES les cartes (y compris la dernière) aient disparu à la fin du scroll

/* ==============================
   BUILD
============================== */
const spiral = document.getElementById("spiral");
const stage = document.getElementById("stage");
const centerText = document.getElementById("center-text");
const scrollHint = document.getElementById("scroll-hint");

if (!spiral || !stage || !centerText || !scrollHint) {
  console.warn(
    "La structure du portfolio n’est pas complète pour l’animation.",
  );
}

const projectCards = Array.from(
  document.querySelectorAll("[data-project-card]"),
).map((card) => ({
  img: card.dataset.projectImage || FALLBACK_CARDS[0].img,
  title: card.dataset.projectTitle || FALLBACK_CARDS[0].title,
}));

const cardsData = projectCards.length > 0 ? projectCards : FALLBACK_CARDS;
const cardEls = cardsData.map((data) => {
  const el = document.createElement("div");
  el.className = "card";

  const img = document.createElement("img");
  img.src = data.img;
  img.alt = data.title || "";
  el.appendChild(img);

  if (data.title) {
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = data.title;
    el.appendChild(label);
  }

  if (spiral) {
    spiral.appendChild(el);
  }
  return el;
});

const N = cardEls.length;

let maxRadius = 0;
function computeMaxRadius() {
  maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.48;
}
computeMaxRadius();
window.addEventListener("resize", computeMaxRadius);

/* state.p = progression réelle (lissée par GSAP), target.p = valeur brute issue du scroll */
const state = { p: 0 };
const target = { p: 0 };

function render() {
  const p = state.p;

  cardEls.forEach((el, i) => {
    const phase = i / N; // décalage de départ de chaque carte (0 -> proche de 1)
    const t = phase + p; // PAS de modulo : trajet fini, chaque carte avance puis sort pour de bon

    const angleDeg = t * LOOPS * 360 + p * ROTATION_SPEED;
    const rad = (angleDeg * Math.PI) / 180;
    const radius = t * maxRadius;

    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;

    const scale = 0.32 + Math.min(t, 1.3) * 0.78;

    let opacity;
    if (t < FADE_IN_END) opacity = Math.max(0, t) / FADE_IN_END;
    else if (t > FADE_OUT_START)
      opacity = 1 - (t - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START);
    else opacity = 1;
    opacity = Math.max(0, Math.min(1, opacity));

    el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
    el.style.opacity = opacity;
    el.style.zIndex = Math.round(t * 1000);
    // une fois totalement invisible, on l'enlève du flux de rendu (perf + évite tout clic fantôme)
    el.style.visibility =
      opacity <= 0 && t > FADE_OUT_START ? "hidden" : "visible";
  });
}

/* ==============================
   SCROLL -> GSAP SMOOTHING -> RENDER
============================== */
let hintHidden = false;

function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const raw = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  target.p = raw * TOTAL_P_RANGE;

  gsap.to(state, {
    p: target.p,
    duration: SCRUB_DURATION,
    ease: "power3.out",
    overwrite: true,
    onUpdate: render,
  });

  if (!hintHidden && window.scrollY > 20 && scrollHint) {
    hintHidden = true;
    gsap.to(scrollHint, { opacity: 0, duration: 0.5 });
  }
}

window.addEventListener("scroll", onScroll, { passive: true });

/* Entrée initiale */
render();
if (stage) {
  gsap.fromTo(
    stage,
    { opacity: 0 },
    { opacity: 1, duration: 1.2, ease: "power2.out" },
  );
}
if (centerText) {
  gsap.fromTo(
    centerText,
    { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1, duration: 1, delay: 0.3, ease: "power2.out" },
  );
}
