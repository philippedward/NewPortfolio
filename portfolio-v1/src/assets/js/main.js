"use strict";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  /* ============================================================
     HELPER GÉNÉRIQUE : une "scène" pinnée avec fade in/out
     Réutilisable pour chaque section (projet, galerie, 3e...)
     ============================================================ */
  function createStage({
    stageId,
    pinDistance,
    fadeInEnd = 0.12,
    fadeOutStart = 0.85,
    onUpdate,
  }) {
    const stage = document.getElementById(stageId);
    if (!stage) return null;

    // Opacité initiale à 0 (sauf pour la toute première section si besoin)
    gsap.set(stage, { opacity: 0 });

    const st = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: `+=${pinDistance}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;

        let opacity = 1;
        if (p < fadeInEnd) opacity = p / fadeInEnd;
        else if (p > fadeOutStart)
          opacity = 1 - (p - fadeOutStart) / (1 - fadeOutStart);

        gsap.set(stage, { opacity: Math.max(0, Math.min(1, opacity)) });

        if (onUpdate) onUpdate(p, self);
      },
    });

    return st;
  }

  /* ============================================================
     SECTION 1 : SPIRALE DES PROJETS
     ============================================================ */
  const spiralTrack =
    document.getElementById("spiralTrack") || document.getElementById("spiral");

  if (spiralTrack) {
    const projectCardEls = Array.from(
      spiralTrack.querySelectorAll("[data-project-card]"),
    );
    const N = projectCardEls.length;

    const projectStageEl = document.getElementById("projectStage");

    // Calcule le rayon max en fonction de la largeur RÉELLE de la scène
    // (qui est déjà cappée par le max-width: 1500px du parent "section")
    function computeRadiusMax() {
      const stageWidth = projectStageEl.clientWidth;
      // On garde une marge (ex: 45% de la largeur dispo) pour que les cartes
      // ne touchent jamais les bords, même à leur scale max
      return Math.min(560, stageWidth * 0.45);
    }

    const CONFIG = {
      radiusMin: 60,
      get radiusMax() {
        return computeRadiusMax();
      },
      zFar: -1200,
      zNear: 620,
      scaleMin: 0.2,
      scaleMax: 1.35,
      spiralTurns: 1.4,
      angleSpread: 1.35,
      entryDuration: 0.55,
      extraSpinTurns: 0.6,
      fadeInEnd: 0.15,
    };

    const stagger = N > 1 ? (1 - CONFIG.entryDuration) / (N - 1) : 0;

    const projectCards = projectCardEls.map((el, i) => ({
      el,
      finalAngle: (i / N) * Math.PI * 2 * CONFIG.angleSpread,
      startAt: i * stagger,
    }));

    function opacityForT(t) {
      if (t < CONFIG.fadeInEnd) return t / CONFIG.fadeInEnd;
      return 1;
    }

    // Le "progress" vient maintenant directement du pin, plus besoin
    // de timeline factice ni de globalFadeOut séparé : createStage()
    // gère déjà le fade global de la scène entière.
    function renderSpiral(progress) {
      projectCards.forEach((c) => {
        let t = (progress - c.startAt) / CONFIG.entryDuration;
        t = Math.max(0, Math.min(1, t));

        const radius =
          CONFIG.radiusMin + (CONFIG.radiusMax - CONFIG.radiusMin) * t;
        const z = CONFIG.zFar + (CONFIG.zNear - CONFIG.zFar) * t;
        const scale = CONFIG.scaleMin + (CONFIG.scaleMax - CONFIG.scaleMin) * t;

        const angle =
          c.finalAngle +
          (1 - t) * CONFIG.spiralTurns * Math.PI * 2 +
          progress * CONFIG.extraSpinTurns * Math.PI * 2;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.62;

        c.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) scale(${scale.toFixed(2)})`;
        c.el.style.opacity = opacityForT(t);
        c.el.style.zIndex = Math.round(t * 1000);
        c.el.style.visibility = opacityForT(t) <= 0 ? "hidden" : "visible";
      });
    }

    renderSpiral(0);

    createStage({
      stageId: "projectStage",
      pinDistance: 8000,
      fadeInEnd: 0.05,
      fadeOutStart: 0.97,
      onUpdate: (p) => renderSpiral(p),
    });

    // Recalcule au resize pour rester cohérent si la fenêtre change de taille
    window.addEventListener("resize", () => {
      ScrollTrigger.refresh();
    });
  }
  /* ============================================================
     SECTION 2 : GALERIE DES DESSINS
     ============================================================ */
  const track = document.getElementById("galleryTrack");

  if (track) {
    const cards = Array.from(track.querySelectorAll("[data-draw-card]"));

    if (cards.length) {
      const RADIUS = window.innerWidth < 700 ? 220 : 340;

      const wheelLeft = document.createElement("div");
      wheelLeft.className = "gallery-wheel gallery-wheel--left";

      const wheelRight = document.createElement("div");
      wheelRight.className = "gallery-wheel gallery-wheel--right";

      track.appendChild(wheelLeft);
      track.appendChild(wheelRight);

      const left = [];
      const right = [];

      cards.forEach((card, i) => {
        (i % 2 === 0 ? left : right).push(card);
      });

      // Sécurité : force un nombre PAIR de cartes sur chaque roue
      // (condition nécessaire pour que gauche et droite se centrent en même temps)
      function padToEven(list, wheelClass) {
        if (list.length % 2 !== 0) {
          const placeholder = document.createElement("div");
          placeholder.className = `draw-card draw-card--empty ${wheelClass}`;
          placeholder.setAttribute("data-draw-card", "");
          placeholder.style.visibility = "hidden"; // occupe l'angle, invisible à l'oeil
          list.push(placeholder);
        }
      }

      padToEven(left, "draw-card--placeholder-left");
      padToEven(right, "draw-card--placeholder-right");

      function place(wheelEl, list, angleOffset = 0) {
        list.forEach((card, i) => {
          const angle = (i / list.length) * Math.PI * 2 + angleOffset;
          const x = Math.cos(angle) * RADIUS;
          const y = Math.sin(angle) * RADIUS;

          const pos = document.createElement("div");
          pos.className = "draw-card-pos";
          pos.style.position = "absolute";
          pos.style.left = `${x}px`;
          pos.style.top = `${y}px`;
          pos.style.transform = "translate(-50%, -50%)";

          card.parentNode?.removeChild(card);
          pos.appendChild(card);
          wheelEl.appendChild(pos);
        });
      }

      // Gauche : une carte face au centre (angle 0) → offset 0
      place(wheelLeft, left, 0);

      // Droite : une carte face au centre (angle π) → offset π
      place(wheelRight, right, Math.PI);

      // Cache une seule fois, avant onUpdate
      const leftCards = wheelLeft.querySelectorAll("[data-draw-card]");
      const rightCards = wheelRight.querySelectorAll("[data-draw-card]");

      createStage({
        stageId: "galleryStage",
        pinDistance: 12000,
        fadeInEnd: 0.1,
        fadeOutStart: 0.9,
        overlap: 400,
        onUpdate: (p) => {
          const angle = p * 360;

          gsap.set(wheelLeft, { rotation: angle });
          gsap.set(wheelRight, { rotation: -angle });

          leftCards.forEach((card) => gsap.set(card, { rotation: -angle }));
          rightCards.forEach((card) => gsap.set(card, { rotation: angle }));
        },
      });
    }
  }

  /* ============================================================
     SECTION 3 : à ajouter — MÊME LOGIQUE
     ============================================================ */
  // createStage({
  //   stageId: "thirdStage",
  //   pinDistance: 5000,
  //   fadeInEnd: 0.1,
  //   fadeOutStart: 0.9,
  //   onUpdate: (p) => {
  //     // ta logique d'animation ici, pilotée par p (0 -> 1)
  //   },
  // });
});
