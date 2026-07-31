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
    // 1. SETUP DES PROJETS (Spirale)
    // -------------------------------------------------------------
    const projectCards = Array.from(
      spiral.querySelectorAll("[data-project-card]"),
    );
    const N_PROJECTS = projectCards.length;
    const LOOPSP = 3;
    const ROTATION_SPEED = 55;
    let maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.48;

    window.addEventListener("resize", () => {
      maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.48;
    });

    const renderSpiral = (p) => {
      projectCards.forEach((el, i) => {
        // Calcul de la progression relative
        const phase = i / N_PROJECTS;
        const t = (phase + p * 1.15) % 1.5; // évite que t devienne excessivement grand

        const angleDeg = t * LOOPSP * 360 + p * ROTATION_SPEED;
        const rad = (angleDeg * Math.PI) / 180;
        const radius = t * maxRadius;

        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        const scale = Math.max(0.1, 0.32 + Math.min(t, 1.3) * 0.78);

        // Un seul translate3d propre (combine X et Y)
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0px) scale(${scale.toFixed(2)})`;

        // Gestion de l'opacité progressive
        const opacity =
          t < 0.1 ? t / 0.1 : Math.max(0, Math.min(1, 1 - (t - 1.1) / 0.3));
        el.style.opacity = opacity;
        el.style.zIndex = Math.round(t * 1000) + 20;
      });
    };

    // -------------------------------------------------------------
    // 2. SETUP DE LA GALERIE (3D)
    // -------------------------------------------------------------
    const galleryCardEls = Array.from(
      galleryTrack.querySelectorAll(".gallery-card"),
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

    // Initialisation
    renderSpiral(0);
    renderGallery(0);

    // -------------------------------------------------------------
    // 3. TIMELINE GSAP AVEC PIN
    // -------------------------------------------------------------
    const mainTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: showcasePin,
        start: "top top",
        // 1. Augmentation de la distance totale de scroll (passé de 5000 à 8000)
        end: "+=8000",
        pin: true,
        scrub: 1, // Un scrub un peu plus doux/lissé
        anticipatePin: 1,
        refreshPriority: 1,
      },
    });

    // Étape 1 : Scroll Spirale (durée 2.5s)
    mainTimeline.to(
      {},
      {
        duration: 2.5,
        onUpdate: function () {
          renderSpiral(this.progress());
        },
      },
    );

    // Étape 2 : Transition Fondu Spirale -> Galerie (durée 1s)
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

    // Étape 3 : Scroll Galerie 3D (durée passée de 3s à 6s = 2× plus lente)
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
