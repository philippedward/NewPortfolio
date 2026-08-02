"use strict";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  const spiralTrack =
    document.getElementById("spiralTrack") || document.getElementById("spiral");
  const showcasePin = document.getElementById("showcasePin");

  if (spiralTrack && showcasePin) {
    const projectCardEls = Array.from(
      spiralTrack.querySelectorAll("[data-project-card]"),
    );
    const N = projectCardEls.length;

    const CONFIG = {
      radiusMin: 60,
      radiusMax: 560,
      zFar: -1200,
      zNear: 620,
      scaleMin: 0.2,
      scaleMax: 1.35,
      spiralTurns: 1.4,
      angleSpread: 1.35,
      entryDuration: 0.55,
      extraSpinTurns: 0.6,
      fadeInEnd: 0.15, // fraction du trajet d'UNE carte pour apparaître
      fadeOutStart: 0.85, // fraction de la progression GLOBALE à partir de laquelle tout s'efface
      fadeOutEnd: 1.0, // fraction de la progression GLOBALE où tout est invisible
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

    function globalFadeOut(progress) {
      if (progress < CONFIG.fadeOutStart) return 1;
      const raw =
        1 -
        (progress - CONFIG.fadeOutStart) /
          (CONFIG.fadeOutEnd - CONFIG.fadeOutStart);
      return Math.max(0, Math.min(1, raw));
    }

    const renderSpiral = (progress) => {
      const fadeOut = globalFadeOut(progress);

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

        const opacity = opacityForT(t) * fadeOut;

        c.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) scale(${scale.toFixed(2)})`;
        c.el.style.opacity = opacity;
        c.el.style.zIndex = Math.round(t * 1000);
        c.el.style.visibility = opacity <= 0 ? "hidden" : "visible";
      });
    };

    renderSpiral(0);

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

    mainTimeline.to(
      {},
      {
        duration: 3,
        onUpdate: function () {
          renderSpiral(this.progress());
        },
      },
    );

    ScrollTrigger.refresh();
  }
});

/* ============================================================
   ZONE DÉSACTIVÉE — GALERIE 3D (Draws)
   À réactiver plus tard : il suffira de décommenter ce bloc et
   de remettre galleryTrack + galleryStage dans le if() du dessus,
   ainsi que les étapes 2 et 3 de la timeline (transition + galerie).
   ============================================================ */

// document.addEventListener("DOMContentLoaded", () => {
//   const galleryTrack = document.getElementById("galleryTrack");
//   const galleryStage = document.getElementById("galleryStage");
//   const projectStage = document.getElementById("projectStage");
//   const showcasePin = document.getElementById("showcasePin");

//   if (galleryTrack && galleryStage) {
//     const galleryCardEls = Array.from(
//       galleryTrack.querySelectorAll("[data-draw-card]"),
//     );
//     const N_GALLERY = galleryCardEls.length;
//     const RADIUS = 420;
//     const TILT = (60 * Math.PI) / 180;
//     const BOB_AMP = 280;
//     const BOB_CYCLES = 3;

//     const pointAtAngle = (a) => {
//       const rad = a * Math.PI * 2;
//       return {
//         x: RADIUS * Math.cos(rad),
//         y: -BOB_AMP * Math.sin(rad * BOB_CYCLES),
//         z: RADIUS * Math.sin(rad) * Math.sin(TILT),
//       };
//     };

//     const galleryCards = galleryCardEls.map((el, index) => ({
//       el,
//       base: index / N_GALLERY,
//     }));

//     const renderGallery = (progress) => {
//       galleryCards.forEach((card) => {
//         const a = card.base + progress;
//         const p = pointAtAngle(a);

//         const scale = 0.5 + ((p.z + RADIUS) / (2 * RADIUS)) * 0.8;

//         card.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, ${p.z.toFixed(1)}px) scale(${scale.toFixed(2)})`;
//         card.el.style.zIndex = Math.round(p.z + 1000);
//       });
//     };

//     renderGallery(0);

//     // Étapes à réintégrer dans mainTimeline :
//     //
//     // mainTimeline
//     //   .to(projectStage, {
//     //     opacity: 0,
//     //     duration: 1,
//     //     ease: "power2.inOut",
//     //   })
//     //   .to(
//     //     galleryStage,
//     //     {
//     //       opacity: 1,
//     //       duration: 1,
//     //       ease: "power2.inOut",
//     //       onStart: () => galleryStage.classList.add("is-active"),
//     //       onReverseComplete: () => galleryStage.classList.remove("is-active"),
//     //     },
//     //     "<",
//     //   );
//     //
//     // mainTimeline.to(
//     //   {},
//     //   {
//     //     duration: 6,
//     //     onUpdate: function () {
//     //       renderGallery(this.progress());
//     //     },
//     //   },
//     // );
//   }
// });

/* ============================================================
   ANCIEN SYSTÈME (obsolète, basé sur cardsData en JS) — à supprimer
   définitivement une fois sûr de ne plus en avoir besoin.
   ============================================================ */

// const CONFIG = { ... }  // voir version précédente si besoin de retrouver ce code
