"use strict";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   SECTION 1 : SPIRALE DES PROJETS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Récupère le conteneur principal des cartes projets
  const spiralTrack =
    document.getElementById("spiralTrack") || document.getElementById("spiral");

  // Conteneur global qui sera "pin" pendant le scroll
  const projectStage = document.getElementById("projectStage");

  // On ne lance le système que si les éléments existent
  if (spiralTrack && projectStage) {
    // Récupère toutes les cartes projet
    const projectCardEls = Array.from(
      spiralTrack.querySelectorAll("[data-project-card]"),
    );

    // Nombre total de cartes
    const N = projectCardEls.length;

    /* ============================================================
       CONFIGURATION DE LA SPIRALE
       ============================================================ */

    const CONFIG = {
      // Rayon minimum au démarrage
      radiusMin: 60,

      // Rayon maximum à la fin
      radiusMax: 560,

      // Position Z de départ (loin derrière)
      zFar: -1200,

      // Position Z finale (proche de l'utilisateur)
      zNear: 620,

      // Échelle minimale
      scaleMin: 0.2,

      // Échelle maximale
      scaleMax: 1.35,

      // Nombre de tours effectués avant d'arriver à la position finale
      spiralTurns: 1.4,

      // Étalement angulaire des cartes
      angleSpread: 1.35,

      // Durée d'apparition d'une carte
      entryDuration: 0.55,

      // Rotation supplémentaire appliquée à toute la spirale
      extraSpinTurns: 0.6,

      // Fin du fade-in individuel
      fadeInEnd: 0.15,

      // Début du fade-out global
      fadeOutStart: 0.85,

      // Fin du fade-out global
      fadeOutEnd: 1.0,
    };

    /* ============================================================
       CALCUL DES DÉCALAGES ENTRE LES CARTES
       ============================================================ */

    // Répartition de l'apparition des cartes dans le temps
    const stagger = N > 1 ? (1 - CONFIG.entryDuration) / (N - 1) : 0;

    // Préparation des données utiles pour chaque carte
    const projectCards = projectCardEls.map((el, i) => ({
      el,

      // Angle final de la carte dans la spirale
      finalAngle: (i / N) * Math.PI * 2 * CONFIG.angleSpread,

      // Moment où la carte commence son animation
      startAt: i * stagger,
    }));

    /* ============================================================
       FONCTIONS UTILITAIRES
       ============================================================ */

    // Gère l'apparition progressive d'une carte
    function opacityForT(t) {
      if (t < CONFIG.fadeInEnd) return t / CONFIG.fadeInEnd;
      return 1;
    }

    // Gère la disparition de toute la spirale en fin de scroll
    function globalFadeOut(progress) {
      if (progress < CONFIG.fadeOutStart) return 1;

      const raw =
        1 -
        (progress - CONFIG.fadeOutStart) /
          (CONFIG.fadeOutEnd - CONFIG.fadeOutStart);

      return Math.max(0, Math.min(1, raw));
    }

    /* ============================================================
       RENDU DE LA SPIRALE
       ============================================================ */

    const renderSpiral = (progress) => {
      // Niveau global de visibilité
      const fadeOut = globalFadeOut(progress);

      projectCards.forEach((c) => {
        // Progression propre à chaque carte
        let t = (progress - c.startAt) / CONFIG.entryDuration;

        // Limite entre 0 et 1
        t = Math.max(0, Math.min(1, t));

        // Calcul du rayon
        const radius =
          CONFIG.radiusMin + (CONFIG.radiusMax - CONFIG.radiusMin) * t;

        // Calcul de la profondeur
        const z = CONFIG.zFar + (CONFIG.zNear - CONFIG.zFar) * t;

        // Calcul de l'échelle
        const scale = CONFIG.scaleMin + (CONFIG.scaleMax - CONFIG.scaleMin) * t;

        // Calcul de l'angle de rotation
        const angle =
          c.finalAngle +
          (1 - t) * CONFIG.spiralTurns * Math.PI * 2 +
          progress * CONFIG.extraSpinTurns * Math.PI * 2;

        // Position horizontale
        const x = Math.cos(angle) * radius;

        // Position verticale
        const y = Math.sin(angle) * radius * 0.62;

        // Opacité finale
        const opacity = opacityForT(t) * fadeOut;

        // Application des transformations CSS
        c.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) scale(${scale.toFixed(2)})`;

        c.el.style.opacity = opacity;

        // Gestion de l'empilement visuel
        c.el.style.zIndex = Math.round(t * 1000);

        // Cache complètement l'élément lorsqu'il devient invisible
        c.el.style.visibility = opacity <= 0 ? "hidden" : "visible";
      });
    };

    // État initial avant le premier scroll
    renderSpiral(0);

    /* ============================================================
       TIMELINE DE SCROLL PRINCIPALE
       ============================================================ */

    const mainTimeline = gsap.timeline({
      scrollTrigger: {
        // Élément déclencheur
        trigger: projectStage,

        // Début lorsque le haut touche le haut du viewport
        start: "top top",

        // Longueur totale du scroll animé
        end: "+=8000",

        // Bloque la section à l'écran pendant l'animation
        pin: true,

        // Synchronisation avec le scroll
        scrub: 1,

        // Évite certains sauts lors du pin
        anticipatePin: 1,

        // Priorité de rafraîchissement
        refreshPriority: 1,
      },
    });

    // Animation "virtuelle" utilisée uniquement pour récupérer la progression
    mainTimeline.to(
      {},
      {
        duration: 3,
        onUpdate: function () {
          renderSpiral(this.progress());
        },
      },
    );

    // Force le recalcul des positions ScrollTrigger
    ScrollTrigger.refresh();
  }
});

/* ============================================================
   SECTION 2 : GALERIE DES DESSINS
   Deux roues qui tournent en sens opposés
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Ré-enregistrement par sécurité
  gsap.registerPlugin(ScrollTrigger);

  // Conteneur principal de la galerie
  const track = document.getElementById("galleryTrack");

  if (!track) return;

  // Toutes les cartes dessin
  const cards = Array.from(track.querySelectorAll("[data-draw-card]"));

  if (!cards.length) return;

  /* ============================================================
     CONFIGURATION DES ROUES
     ============================================================ */

  // Rayon plus petit sur mobile
  const RADIUS = window.innerWidth < 700 ? 220 : 340;

  /* ============================================================
     CRÉATION DES DEUX ROUES
     ============================================================ */

  const wheelLeft = document.createElement("div");
  wheelLeft.className = "gallery-wheel gallery-wheel--left";

  const wheelRight = document.createElement("div");
  wheelRight.className = "gallery-wheel gallery-wheel--right";

  track.appendChild(wheelLeft);
  track.appendChild(wheelRight);

  /* ============================================================
     RÉPARTITION DES CARTES
     Une carte sur deux dans chaque roue
     ============================================================ */

  const left = [];
  const right = [];

  cards.forEach((card, i) => (i % 2 === 0 ? left : right).push(card));

  /* ============================================================
     POSITIONNEMENT CIRCULAIRE DES CARTES
     ============================================================ */

  function place(wheelEl, list) {
    list.forEach((card, i) => {
      // Angle de la carte autour du cercle
      const angle = (i / list.length) * Math.PI * 2;

      // Coordonnées calculées par trigonométrie
      const x = Math.cos(angle) * RADIUS;
      const y = Math.sin(angle) * RADIUS;

      // Point de positionnement (ancré sur le cercle)
      const pos = document.createElement("div");
      pos.className = "draw-card-pos";
      pos.style.position = "absolute";
      pos.style.left = `${x}px`;
      pos.style.top = `${y}px`;
      pos.style.transform = "translate(-50%, -50%)";

      // Déplace la carte existante dans sa nouvelle structure
      card.parentNode.removeChild(card);

      pos.appendChild(card);
      wheelEl.appendChild(pos);
    });
  }

  // Placement des cartes sur chaque roue
  place(wheelLeft, left);
  place(wheelRight, right);

  /* ============================================================
     CONFIGURATION DE SCROLL COMMUNE
     ============================================================ */

  const scrollConf = {
    trigger: "#galleryStage",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
  };

  /* ============================================================
     ROTATION DES ROUES
     ============================================================ */

  // Roue gauche : sens horaire
  gsap.to(wheelLeft, {
    rotation: 360,
    ease: "none",
    scrollTrigger: scrollConf,
  });

  // Roue droite : sens anti-horaire
  gsap.to(wheelRight, {
    rotation: -360,
    ease: "none",
    scrollTrigger: scrollConf,
  });

  /* ============================================================
     CONTRE-ROTATION DES CARTES
     Permet aux cartes de rester droites
     ============================================================ */

  gsap.utils
    .toArray(wheelLeft.querySelectorAll("[data-draw-card]"))
    .forEach((card) => {
      gsap.to(card, {
        rotation: -360,
        ease: "none",
        scrollTrigger: scrollConf,
      });
    });

  gsap.utils
    .toArray(wheelRight.querySelectorAll("[data-draw-card]"))
    .forEach((card) => {
      gsap.to(card, {
        rotation: 360,
        ease: "none",
        scrollTrigger: scrollConf,
      });
    });

  /* ============================================================
     APPARITION PROGRESSIVE DE LA GALERIE
     ============================================================ */

  gsap.fromTo(
    "#galleryStage",
    { opacity: 0 },
    {
      opacity: 1,
      ease: "none",
      scrollTrigger: {
        // Déclencheur de la galerie
        trigger: "#galleryStage",

        // Début du fade quand la galerie entre dans l'écran
        start: "top bottom",

        // Fin du fade quand elle atteint le haut
        end: "top top",

        // Synchronisé avec le scroll
        scrub: true,
      },
    },
  );
});
