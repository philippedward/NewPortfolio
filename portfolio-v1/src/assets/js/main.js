"use strict";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  const spiral = document.getElementById("spiral");
  const galleryTrack = document.getElementById("galleryTrack");
  const projectStage = document.getElementById("projectStage");
  const galleryStage = document.getElementById("galleryStage");
  const showcasePin = document.getElementById("showcasePin");

  if (spiral && galleryTrack && showcasePin) {
    // -------------------------------------------------------------
    // 1. SETUP SPIRALE (Projets)
    // -------------------------------------------------------------
    // const projectCards = Array.from(
    //   spiral.querySelectorAll("[data-project-card]"),
    // );
    // const N_PROJECTS = projectCards.length;
    // const LOOPSP = 3;
    // const ROTATION_SPEED = 55;

    // const FADE_IN_END = 0.12;
    // const FADE_OUT_START = 0.9;
    // const FADE_OUT_END = 1.15;
    // const TOTAL_P_RANGE = FADE_OUT_END;

    // let maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.45;

    // window.addEventListener("resize", () => {
    //   maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.45;
    // });

    // const renderSpiral = (progress) => {
    //   const p = progress * TOTAL_P_RANGE;

    //   projectCards.forEach((el, i) => {
    //     const phase = i / N_PROJECTS;
    //     const t = phase + p;

    //     const angleDeg = t * LOOPSP * 360 + p * ROTATION_SPEED;
    //     const rad = (angleDeg * Math.PI) / 180;
    //     const radius = t * maxRadius;

    //     const x = Math.cos(rad) * radius;
    //     const y = Math.sin(rad) * radius;
    //     const scale = 0.32 + Math.min(t, 1.3) * 0.78;

    //     let opacity;
    //     if (t < FADE_IN_END) {
    //       opacity = Math.max(0, t) / FADE_IN_END;
    //     } else if (t > FADE_OUT_START) {
    //       opacity = 1 - (t - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START);
    //     } else {
    //       opacity = 1;
    //     }
    //     opacity = Math.max(0, Math.min(1, opacity));

    //     // Placement fluide grâce aux marges négatives du SCSS
    //     el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0px) scale(${scale.toFixed(2)})`;
    //     el.style.opacity = opacity;
    //     el.style.zIndex = Math.round(t * 1000) + 20;
    //     el.style.visibility =
    //       opacity <= 0 && t > FADE_OUT_START ? "hidden" : "visible";
    //   });
    // };

    // -------------------------------------------------------------
    // 2. SETUP GALERIE 3D (Draws)
    // -------------------------------------------------------------
    const galleryCardEls = Array.from(
      galleryTrack.querySelectorAll("[data-draw-card]"),
    );
    const N_GALLERY = galleryCardEls.length;
    const RADIUS = 420;
    const TILT = (60 * Math.PI) / 180;
    const BOB_AMP = 280;
    const BOB_CYCLES = 3;

    const pointAtAngle = (a) => {
      const rad = a * Math.PI * 2;
      return {
        x: RADIUS * Math.cos(rad),
        y: -BOB_AMP * Math.sin(rad * BOB_CYCLES),
        z: RADIUS * Math.sin(rad) * Math.sin(TILT),
      };
    };

    const galleryCards = galleryCardEls.map((el, index) => ({
      el,
      base: index / N_GALLERY,
    }));

    const renderGallery = (progress) => {
      galleryCards.forEach((card) => {
        const a = card.base + progress;
        const p = pointAtAngle(a);

        const scale = 0.5 + ((p.z + RADIUS) / (2 * RADIUS)) * 0.8;

        card.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, ${p.z.toFixed(1)}px) scale(${scale.toFixed(2)})`;
        card.el.style.zIndex = Math.round(p.z + 1000);
      });
    };

    // Rendu initial
    renderSpiral(0);
    renderGallery(0);

    // -------------------------------------------------------------
    // 3. TIMELINE GSAP SCROLLTRIGGER
    // -------------------------------------------------------------
    const mainTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: showcasePin,
        start: "top top",
        end: "+=8000",
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        refreshPriority: 1,
      },
    });

    // Étape 1 : Spirale
    mainTimeline.to(
      {},
      {
        duration: 3,
        onUpdate: function () {
          renderSpiral(this.progress());
        },
      },
    );

    // Étape 2 : Transition
    mainTimeline
      .to(projectStage, {
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
      })
      .to(
        galleryStage,
        {
          opacity: 1,
          duration: 1,
          ease: "power2.inOut",
          onStart: () => galleryStage.classList.add("is-active"),
          onReverseComplete: () => galleryStage.classList.remove("is-active"),
        },
        "<",
      );

    // Étape 3 : Galerie
    mainTimeline.to(
      {},
      {
        duration: 6,
        onUpdate: function () {
          renderGallery(this.progress());
        },
      },
    );

    ScrollTrigger.refresh();
  }
});

/* ============================================================
   DONNÉES DES CARTES — remplace img/title/desc par les tiennes
   ============================================================ */
const cardsData = [
  {
    img: "https://picsum.photos/seed/spiral1/300/300",
    title: "Aurora",
    desc: "Étude de lumière et de mouvement.",
  },
  {
    img: "https://picsum.photos/seed/spiral2/300/300",
    title: "Monolithe",
    desc: "Formes brutes, matière dense.",
  },
  {
    img: "https://picsum.photos/seed/spiral3/300/300",
    title: "Fragment",
    desc: "Détail extrait d'une série plus large.",
  },
  {
    img: "https://picsum.photos/seed/spiral4/300/300",
    title: "Nébuleuse",
    desc: "Textures organiques en mouvement.",
  },
  {
    img: "https://picsum.photos/seed/spiral5/300/300",
    title: "Vertige",
    desc: "Perspective et profondeur.",
  },
  {
    img: "https://picsum.photos/seed/spiral6/300/300",
    title: "Écho",
    desc: "Répétition et variation.",
  },
  {
    img: "https://picsum.photos/seed/spiral7/300/300",
    title: "Silhouette",
    desc: "Contraste et contour.",
  },
  {
    img: "https://picsum.photos/seed/spiral8/300/300",
    title: "Dérive",
    desc: "Flottement dans l'espace.",
  },
  {
    img: "https://picsum.photos/seed/spiral9/300/300",
    title: "Prisme",
    desc: "Réfraction de la couleur.",
  },
  {
    img: "https://picsum.photos/seed/spiral10/300/300",
    title: "Latence",
    desc: "Temps suspendu, image figée.",
  },
  {
    img: "https://picsum.photos/seed/spiral11/300/300",
    title: "Cristal",
    desc: "Structure et symétrie.",
  },
  {
    img: "https://picsum.photos/seed/spiral12/300/300",
    title: "Origine",
    desc: "Point de départ du motif.",
  },
  {
    img: "https://picsum.photos/seed/spiral13/300/300",
    title: "Résonance",
    desc: "Vibration visuelle.",
  },
  {
    img: "https://picsum.photos/seed/spiral14/300/300",
    title: "Éclipse",
    desc: "Ombre et lumière en tension.",
  },
  {
    img: "https://picsum.photos/seed/spiral15/300/300",
    title: "Spectre",
    desc: "Dégradé de teintes froides.",
  },
  {
    img: "https://picsum.photos/seed/spiral16/300/300",
    title: "Halo",
    desc: "Auréole diffuse autour du centre.",
  },
];

/* ============================================================
   RÉGLAGES DE LA SPIRALE
   ============================================================ */
const CONFIG = {
  radiusMin: 60, // rayon de départ (carte au centre, à peine visible)
  radiusMax: 560, // rayon final de la carte (sa place définitive dans la spirale)
  zFar: -1200, // profondeur de départ (petit, transparent)
  zNear: 620, // profondeur finale (grand, opaque)
  scaleMin: 0.2,
  scaleMax: 1.35,
  spiralTurns: 1.4, // torsion de la trajectoire centre -> place finale
  angleSpread: 1.35, // > 1 = plus d'écart angulaire entre cartes voisines (séparation)

  // --- Comportement FINI (pas de boucle infinie, pensé pour un nombre de
  //     cartes fixe, ex. 10) : chaque carte part du centre UNE SEULE FOIS
  //     et rejoint sa place définitive, puis n'y retourne plus.
  entryDuration: 0.55, // durée (en fraction de progress 0-1) du trajet centre -> place finale pour UNE carte
  extraSpinTurns: 0.6, // rotation d'ensemble supplémentaire une fois toutes les cartes en place
  smoothing: 0.08, // 0 = instantané, plus petit = plus "lourd"/inertiel
  fadeInEnd: 0.15, // fraction du trajet d'une carte à laquelle son opacité atteint 1
};

const track = document.getElementById("spiralTrack");
const debugEl = document.getElementById("progressDebug");
const N = cardsData.length;
const cards = [];

// Espace de départ de chaque carte dans le scroll global, réparti sur
// [0, 1 - entryDuration] pour que TOUTES les cartes aient fini leur
// trajet avant la fin du scroll (progress = 1).
const stagger = N > 1 ? (1 - CONFIG.entryDuration) / (N - 1) : 0;

cardsData.forEach((data, i) => {
  const el = document.createElement("div");
  el.className = "spiral-card";
  el.innerHTML = `
    <div class="spiral-card-media">
      <img src="${data.img}" alt="${data.title}" loading="lazy">
    </div>
    <div class="spiral-card-content">
      <h3>${data.title}</h3>
      <p>${data.desc}</p>
    </div>
  `;
  track.appendChild(el);

  cards.push({
    el,
    finalAngle: (i / N) * Math.PI * 2 * CONFIG.angleSpread, // place définitive sur le cercle
    startAt: i * stagger, // moment (en progress 0-1) où cette carte démarre son trajet
  });
});

function opacityForT(t) {
  if (t < CONFIG.fadeInEnd) return t / CONFIG.fadeInEnd;
  return 1; // une fois arrivée, la carte reste pleinement visible (pas de re-fade)
}

function render(progress) {
  cards.forEach((c) => {
    // t = avancement du trajet PROPRE à cette carte, de 0 (au centre) à 1 (place finale)
    // clampé : une carte qui n'a pas encore commencé reste à 0, une carte arrivée reste à 1
    let t = (progress - c.startAt) / CONFIG.entryDuration;
    t = Math.max(0, Math.min(1, t));

    const radius = CONFIG.radiusMin + (CONFIG.radiusMax - CONFIG.radiusMin) * t;
    const z = CONFIG.zFar + (CONFIG.zNear - CONFIG.zFar) * t;
    const scale = CONFIG.scaleMin + (CONFIG.scaleMax - CONFIG.scaleMin) * t;

    // torsion pendant le trajet + léger supplément de rotation d'ensemble une fois en place
    const angle =
      c.finalAngle +
      (1 - t) * CONFIG.spiralTurns * Math.PI * 2 +
      progress * CONFIG.extraSpinTurns * Math.PI * 2;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.62;

    c.el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`;
    c.el.style.opacity = opacityForT(t);
    c.el.style.zIndex = Math.round(t * 1000);
  });
}

/* ============================================================
   SCROLLTRIGGER : la progression 0 -> 1 vient uniquement du scroll.
   start: "top top" -> la spirale commence dès le tout début du
   scroll, sans zone morte avant.
   ============================================================ */
let targetProgress = 0;
let currentProgress = 0;

ScrollTrigger.create({
  trigger: ".spiral-section",
  start: "top top",
  end: "bottom bottom",
  scrub: true,
  onUpdate: (self) => {
    targetProgress = self.progress;
  },
});

// petit lissage supplémentaire (inertie) piloté par le ticker GSAP
gsap.ticker.add(() => {
  currentProgress += (targetProgress - currentProgress) * CONFIG.smoothing;
  render(currentProgress);
  debugEl.textContent = "progress: " + currentProgress.toFixed(3);
});
