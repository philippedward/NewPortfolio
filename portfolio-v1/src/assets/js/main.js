"use strict";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ==============================
   Config — trajet FINI (pas de boucle infinie)
============================== */
const LOOPSP = 3; // tours de spirale sur tout le trajet d'une carte
const ROTATION_SPEED = 55; // rotation globale additionnelle (deg / unité de progression)
const SCRUB_DURATION = 0.8; // inertie du scroll

const FADE_IN_END = 0.12; // 0 -> ce point : la carte apparaît depuis le fond (centre)
const FADE_OUT_START = 0.9; // à partir de là : la carte commence à s'effacer
const FADE_OUT_END = 1.15; // à ce point : la carte a totalement disparu
const TOTAL_P_RANGE = FADE_OUT_END; // toutes les cartes ont disparu à la fin du scroll

document.addEventListener("DOMContentLoaded", () => {
  const spiral = document.getElementById("spiral");
  const stage = document.getElementById("stage");
  const centerText = document.getElementById("center-text");
  const scrollHint = document.getElementById("scroll-hint");

  if (!spiral) return;

  // Les vraies cartes (image + hover + lien) sont déjà rendues par
  // card-project.njk directement dans #spiral. On ne les reconstruit
  // plus en JS : on se contente de les récupérer pour les positionner.
  const cardEls = Array.from(spiral.querySelectorAll("[data-project-card]"));
  if (cardEls.length === 0) return;

  const N = cardEls.length;
  let maxRadius = 0;

  function computeMaxRadius() {
    maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.48;
  }
  computeMaxRadius();
  window.addEventListener("resize", computeMaxRadius);

  const state = { p: 0 };
  const target = { p: 0 };

  function render() {
    const p = state.p;

    cardEls.forEach((el, i) => {
      const phase = i / N;
      const t = phase + p; // pas de modulo : chaque carte sort pour de bon, une seule fois

      const angleDeg = t * LOOPSP * 360 + p * ROTATION_SPEED;
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
      el.style.zIndex = Math.round(t * 1000) + 20; // reste au-dessus des vignettes
      el.style.visibility =
        opacity <= 0 && t > FADE_OUT_START ? "hidden" : "visible";
    });
  }

  let hintHidden = false;

  function onScroll() {
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
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

  // Entrée initiale
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
});

/* ==============================
   gallery draws
============================== */

/* ================= GALLERY PARAMETERS ================= */
const RADIUS = 300; // Gallery loop radius (px)
const TILT = (60 * Math.PI) / 180; // Tilt angle -> depth scaling
const BOB_AMP = 170; // Vertical wave height (up/down)
const BOB_CYCLES = 3; // Number of vertical peaks per loop
const GALLERY_ITEMS_COUNT = 10; // Number of gallery items

/* Calculates 3D coordinates on the gallery path for a given angle */
function pointAtAngle(a) {
  const rad = a * Math.PI * 2;
  return {
    x: RADIUS * Math.cos(rad),
    y: -BOB_AMP * Math.sin(rad * BOB_CYCLES), // Up & down motion
    z: RADIUS * Math.sin(rad) * Math.sin(TILT), // Near & far depth
  };
}

const galleryTrack = document.getElementById("galleryTrack");
if (!galleryTrack) {
  console.warn("Le conteneur de galerie n’est pas présent sur cette page.");
} else {
  /* ---------- Create gallery items ---------- */
  const galleryCards = [];
  for (let i = 0; i < GALLERY_ITEMS_COUNT; i++) {
    const card = document.createElement("div");
    card.className = "gallery-card";
    const img = document.createElement("img");
    img.src = `https://picsum.photos/seed/draw${i}/300/300`;
    img.alt = "";
    card.appendChild(img);
    galleryTrack.appendChild(card);

    galleryCards.push({
      el: card,
      base: i / GALLERY_ITEMS_COUNT,
    });
  }

  /* ---------- Fonction de rendu 3D au scroll ---------- */
  function render(progress) {
    galleryCards.forEach((card) => {
      const a = card.base + progress;
      const p = pointAtAngle(a);

      card.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, ${p.z.toFixed(1)}px)`;
      card.el.style.zIndex = Math.round(p.z + 1000);
    });
  }

  // Premier rendu
  render(0);

  /* ---------- GSAP ScrollTrigger ---------- */
  const LOOPSG = 1;

  ScrollTrigger.create({
    trigger: ".gallery-section",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => render(self.progress * LOOPSG),
  });
}
