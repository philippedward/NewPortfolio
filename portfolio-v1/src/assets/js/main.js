"use strict";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  /* ==============================================================
     SECTION 1 : Animation Spirale (Page d'accueil / Projets)
     ============================================================== */
  const spiral = document.getElementById("spiral");
  const stage = document.getElementById("stage");
  const centerText = document.getElementById("center-text");
  const scrollHint = document.getElementById("scroll-hint");

  if (spiral) {
    const cardEls = Array.from(spiral.querySelectorAll("[data-project-card]"));

    if (cardEls.length > 0) {
      const LOOPSP = 3;
      const ROTATION_SPEED = 55;
      const SCRUB_DURATION = 0.8;
      const FADE_IN_END = 0.12;
      const FADE_OUT_START = 0.9;
      const FADE_OUT_END = 1.15;
      const TOTAL_P_RANGE = FADE_OUT_END;

      const N = cardEls.length;
      let maxRadius = 0;

      const computeMaxRadius = () => {
        maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.48;
      };
      computeMaxRadius();
      window.addEventListener("resize", computeMaxRadius);

      const state = { p: 0 };
      const target = { p: 0 };

      const renderSpiral = () => {
        const p = state.p;

        cardEls.forEach((el, i) => {
          const phase = i / N;
          const t = phase + p;

          const angleDeg = t * LOOPSP * 360 + p * ROTATION_SPEED;
          const rad = (angleDeg * Math.PI) / 180;
          const radius = t * maxRadius;

          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const scale = 0.32 + Math.min(t, 1.3) * 0.78;

          let opacity;
          if (t < FADE_IN_END) {
            opacity = Math.max(0, t) / FADE_IN_END;
          } else if (t > FADE_OUT_START) {
            opacity =
              1 - (t - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START);
          } else {
            opacity = 1;
          }

          opacity = Math.max(0, Math.min(1, opacity));

          el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
          el.style.opacity = opacity;
          el.style.zIndex = Math.round(t * 1000) + 20;
          el.style.visibility =
            opacity <= 0 && t > FADE_OUT_START ? "hidden" : "visible";
        });
      };

      let hintHidden = false;

      window.addEventListener(
        "scroll",
        () => {
          const maxScroll =
            document.documentElement.scrollHeight - window.innerHeight;
          const raw = maxScroll > 0 ? window.scrollY / maxScroll : 0;
          target.p = raw * TOTAL_P_RANGE;

          gsap.to(state, {
            p: target.p,
            duration: SCRUB_DURATION,
            ease: "power3.out",
            overwrite: true,
            onUpdate: renderSpiral,
          });

          if (!hintHidden && window.scrollY > 20 && scrollHint) {
            hintHidden = true;
            gsap.to(scrollHint, { opacity: 0, duration: 0.5 });
          }
        },
        { passive: true },
      );

      renderSpiral();
    }
  }

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

  /* ==============================================================
     SECTION 2 : Galerie Dessins (Page Galerie 3D)
     ============================================================== */
  const galleryTrack = document.getElementById("galleryTrack");

  if (galleryTrack) {
    // Sélectionne UNIQUEMENT les cartes générées par Nunjucks
    const cardElements = Array.from(
      galleryTrack.querySelectorAll(".gallery-card"),
    );
    const totalCards = cardElements.length;

    if (totalCards > 0) {
      const RADIUS = 300;
      const TILT = (60 * Math.PI) / 180;
      const BOB_AMP = 170;
      const BOB_CYCLES = 3;

      const pointAtAngle = (a) => {
        const rad = a * Math.PI * 2;
        return {
          x: RADIUS * Math.cos(rad),
          y: -BOB_AMP * Math.sin(rad * BOB_CYCLES),
          z: RADIUS * Math.sin(rad) * Math.sin(TILT),
        };
      };

      const galleryCards = cardElements.map((el, index) => ({
        el,
        base: index / totalCards,
      }));

      const renderGallery = (progress) => {
        galleryCards.forEach((card) => {
          const a = card.base + progress;
          const p = pointAtAngle(a);
          card.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, ${p.z.toFixed(1)}px)`;
          card.el.style.zIndex = Math.round(p.z + 1000);
        });
      };

      // Premier affichage
      renderGallery(0);

      // Animation liée au scroll avec ScrollTrigger
      const LOOPSG = 1;
      ScrollTrigger.create({
        trigger: ".gallery-section",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => renderGallery(self.progress * LOOPSG),
      });
    }
  }
});
