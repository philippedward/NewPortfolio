"use strict";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  /* ============================================================
     HELPER GÉNÉRIQUE : une "scène" pinnée avec fade in/out
     Réutilisable pour chaque section (projet, galerie, cv...)
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

        // Calcul du fondu : montée linéaire jusqu'à fadeInEnd,
        // plein pendant le milieu, descente linéaire après fadeOutStart
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
     SECTION 1 — SPIRALE DES PROJETS
     Chaque carte part du fond (petite, loin, floue en z) et vient
     se placer sur un cercle (spirale) au fur et à mesure du scroll.
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
    // (déjà cappée par le max-width: 1500px du parent "section")
    // → on garde une marge (45% de la largeur dispo) pour que les cartes
    //   ne touchent jamais les bords, même à leur scale max
    function computeRadiusMax() {
      const stageWidth = projectStageEl.clientWidth;
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

    // "stagger" = décalage de départ entre chaque carte, pour qu'elles
    // n'arrivent pas toutes en même temps (effet de cascade)
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

    // Le "progress" vient directement du pin (createStage gère déjà
    // le fade global de la scène entière, donc ici on ne s'occupe que
    // du positionnement 3D de chaque carte)
    function renderSpiral(progress) {
      projectCards.forEach((c) => {
        // t = progression individuelle de CETTE carte (0 → 1), décalée
        // par son propre startAt pour créer l'effet de cascade
        let t = (progress - c.startAt) / CONFIG.entryDuration;
        t = Math.max(0, Math.min(1, t));

        const radius =
          CONFIG.radiusMin + (CONFIG.radiusMax - CONFIG.radiusMin) * t;
        const z = CONFIG.zFar + (CONFIG.zNear - CONFIG.zFar) * t;
        const scale = CONFIG.scaleMin + (CONFIG.scaleMax - CONFIG.scaleMin) * t;

        // Angle final + rotation résiduelle qui se "dénoue" pendant l'entrée
        // + rotation globale continue liée au scroll (extraSpinTurns)
        const angle =
          c.finalAngle +
          (1 - t) * CONFIG.spiralTurns * Math.PI * 2 +
          progress * CONFIG.extraSpinTurns * Math.PI * 2;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.62; // *0.62 = aplatit le cercle en ellipse

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
  }

  /* ============================================================
     SECTION 2 — GALERIE DES DESSINS
     Deux "roues" (gauche/droite) de cartes disposées en cercle,
     qui tournent en sens opposé pendant le scroll. Chaque carte
     tourne aussi sur elle-même en sens inverse de la roue pour
     rester lisible (pas de rotation visible sur l'image elle-même).
     ============================================================ */
  const track = document.getElementById("galleryTrack");

  if (track) {
    const cards = Array.from(track.querySelectorAll("[data-draw-card]"));

    if (cards.length) {
      // Rayon du cercle, calculé une seule fois au chargement selon
      // la largeur d'écran (mobile vs desktop). Ne se recalcule pas
      // si l'utilisateur redimensionne la fenêtre après coup.
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

      // Cache une seule fois, avant onUpdate (évite un querySelectorAll à chaque frame)
      const leftCards = wheelLeft.querySelectorAll("[data-draw-card]");
      const rightCards = wheelRight.querySelectorAll("[data-draw-card]");

      createStage({
        stageId: "galleryStage",
        pinDistance: 12000,
        fadeInEnd: 0.1,
        fadeOutStart: 0.9,
        // Note : "overlap" n'est pas un paramètre géré par createStage()
        // (il est ignoré actuellement, aucun effet). Je le laisse au cas
        // où tu comptais l'utiliser plus tard, mais sache qu'il ne fait rien pour l'instant.
        overlap: 400,
        onUpdate: (p) => {
          const angle = p * 360;

          gsap.set(wheelLeft, { rotation: angle });
          gsap.set(wheelRight, { rotation: -angle });

          // Contre-rotation des cartes pour qu'elles restent "droites"
          // visuellement pendant que la roue tourne
          leftCards.forEach((card) => gsap.set(card, { rotation: -angle }));
          rightCards.forEach((card) => gsap.set(card, { rotation: angle }));
        },
      });
    }
  }

  /* ============================================================
     SECTION 3 — ZOOM DES DESSINS (boîte zoom/dézoom + pan + rotation)
     Zoom molette ou boutons, centré sur le curseur ; pan à la souris
     quand zoomé ; bouton rotation 180°.
     ============================================================ */
  document.querySelectorAll("[data-zoom-box]").forEach((box) => {
    const img = box.querySelector("[data-zoom-img]");
    const zoomInBtn = box.querySelector("[data-zoom-in]");
    const zoomOutBtn = box.querySelector("[data-zoom-out]");
    const rotateBtn = box.querySelector("[data-rotate]");
    const STEP = 0.2;
    let scale = 1,
      x = 0,
      y = 0,
      rotation = 0,
      dragging = false,
      startX,
      startY,
      startPanX,
      startPanY;

    // Empêche l'image de sortir de sa boîte quand elle est zoomée
    const clamp = () => {
      const r = box.getBoundingClientRect();
      const maxX = ((scale - 1) * r.width) / 2;
      const maxY = ((scale - 1) * r.height) / 2;
      x = Math.max(-maxX, Math.min(maxX, x));
      y = Math.max(-maxY, Math.min(maxY, y));
    };

    const apply = () =>
      (img.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`);

    // Zoom "vers le point du curseur" : on recalcule x/y pour que le point
    // (cx, cy) sous le curseur reste au même endroit visuellement après le zoom
    function setScale(newScale, cx = 0, cy = 0) {
      newScale = Math.max(1, Math.min(3, newScale));
      x = cx - (newScale / scale) * (cx - x);
      y = cy - (newScale / scale) * (cy - y);
      scale = newScale;
      clamp();
      apply();
      updateButtonsState();
    }

    function updateButtonsState() {
      if (zoomInBtn) zoomInBtn.disabled = scale >= 3;
      if (zoomOutBtn) zoomOutBtn.disabled = scale <= 1;
    }

    // ===== boutons zoom + / - =====
    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", () => setScale(scale + STEP));
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", () => setScale(scale - STEP));
    }
    updateButtonsState();

    // ===== rotation via le bouton =====
    if (rotateBtn) {
      rotateBtn.addEventListener("click", () => {
        rotation += 180;
        apply();
      });
    }

    box.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const r = box.getBoundingClientRect();
        setScale(
          scale + (e.deltaY < 0 ? 0.1 : -0.1),
          e.clientX - r.left - r.width / 2,
          e.clientY - r.top - r.height / 2,
        );
      },
      { passive: false },
    );

    img.addEventListener("mousedown", (e) => {
      if (scale <= 1) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startPanX = x;
      startPanY = y;
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      x = startPanX + (e.clientX - startX);
      y = startPanY + (e.clientY - startY);
      clamp();
      apply();
    });
    window.addEventListener("mouseup", () => (dragging = false));
  });

  /* ============================================================
     SECTION 4 — BOUTON RETOUR (pages projet / dessin)
     ============================================================ */
  const returnBtn = document.querySelector("[data-return]");

  if (returnBtn) {
    returnBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  /* ============================================================
     SECTION 5 — PAGE CV : zoom main centré + reveal en cascade
     Deux phases sur une seule scène pinnée :
       Phase 1 (0 → PHASE1_END) : la main zoome, la "boîte" cvBox grandit
         jusqu'à couvrir tout l'écran.
       Phase 2 (PHASE1_END → 1) : la main disparaît, puis les feuilles
         du CV apparaissent l'une après l'autre (cvFinal → cvPaper2 → cvPaper3).
     ============================================================ */
  const handWrapper = document.getElementById("handWrapper");
  const handImg = document.getElementById("handImg");
  const cvBox = document.getElementById("cvBox");

  const cvFinal = document.getElementById("cvFinal");
  const cvPaper2 = document.getElementById("cvPaper2");
  const cvPaper3 = document.getElementById("cvPaper3");

  const easeScale = gsap.parseEase("power1.inOut");
  const easeBox = gsap.parseEase("power3.in");
  const easeFade = gsap.parseEase("power1.inOut");

  // PHASE1_END = jusqu'où va la phase 1 (zoom + box) sur l'échelle
  // du pinDistance total (0.4 = 40% du scroll pour zoom+box, 60% pour la suite)
  const PHASE1_END = 0.4;

  createStage({
    stageId: "cvStage",
    pinDistance: 15000,
    fadeInEnd: 0,
    fadeOutStart: 1,
    onUpdate: (p) => {
      if (p <= PHASE1_END) {
        // ===== PHASE 1 : zoom de la main + agrandissement de la boîte =====
        // on remappe p (0 → PHASE1_END) en pp (0 → 1) pour garder le
        // même timing que si la phase 1 était seule sur toute la scène
        const pp = p / PHASE1_END;

        const maxScale = 15;
        const scaleProgress = easeScale(pp);
        const scale = 1 + (maxScale - 1) * scaleProgress;
        gsap.set(handImg, { scale });
        gsap.set(handWrapper, { opacity: 1 }); // main bien visible pendant phase 1

        const boxProgress = easeBox(pp);
        const startSize = 60;
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;

        const width = startSize + (maxWidth - startSize) * boxProgress;
        const height = startSize + (maxHeight - startSize) * boxProgress;
        gsap.set(cvBox, { width, height });

        // papiers pas encore touchés
        gsap.set([cvFinal, cvPaper2, cvPaper3], { opacity: 1 });
      } else {
        // ===== PHASE 2 : main disparaît + cascade des papiers =====

        gsap.set(handImg, { scale: 15 });

        gsap.set(cvBox, {
          width: window.innerWidth,
          height: window.innerHeight,
        });

        // p2 = progression remappée (0 → 1) sur toute la phase 2
        const p2 = (p - PHASE1_END) / (1 - PHASE1_END);

        // MAIN : disparaît pendant le premier quart de la phase 2
        const handFadeP = Math.min(p2 / 0.25, 1);

        gsap.set(handWrapper, {
          opacity: 1 - easeFade(handFadeP),
        });

        // PAPIERS : ne commencent qu'après la disparition complète de la main
        const paperP = Math.min(Math.max((p2 - 0.25) / 0.75, 0), 1);

        const step = 1 / 3;

        let opacityFinal = 0;
        let opacityPaper2 = 0;
        let opacityPaper3 = 0;

        if (paperP < step) {
          // ÉTAPE 1 : cvFinal
          opacityFinal = 1;
        } else if (paperP < step * 2) {
          // ÉTAPE 2 : cvPaper2
          opacityPaper2 = 1;
        } else {
          // ÉTAPE 3 : cvPaper3 (reste visible jusqu'à la fin)
          opacityPaper3 = 1;
        }

        gsap.set(cvFinal, { opacity: opacityFinal });
        gsap.set(cvPaper2, { opacity: opacityPaper2 });
        gsap.set(cvPaper3, { opacity: opacityPaper3 });
      }
    },
  });

  /* ============================================================
     FIX : recalcul ScrollTrigger au resize (toutes sections)
     Avant, ce recalcul n'était fait QUE si la spirale de projets
     existait sur la page — du coup les autres sections pinnées
     (galerie, cv) ne se remettaient jamais à jour après un resize.
     Je l'ai sorti du bloc "if (spiralTrack)" pour que ça marche
     partout, peu importe la page.
     ============================================================ */
  window.addEventListener("resize", () => {
    ScrollTrigger.refresh();
  });

  /* ============================================================
     SECTION 6 — INDICATEUR DE SCROLL (flèche haut/bas)
     ============================================================ */
  const scrollHint = document.getElementById("scroll-hint");

  if (scrollHint) {
    window.addEventListener("scroll", () => {
      const isBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 5;

      scrollHint.textContent = isBottom ? "Scroll ↑" : "Scroll ↓";
    });
  }

  /* ============================================================
     SECTION 7 — ÉCRAN DE VEILLE (screensaver) après inactivité
     Se déclenche après IDLE_TIME ms sans interaction ; se coupe
     dès qu'il y a un mouvement/clic/touche/scroll.
     ============================================================ */
  (function () {
    const overlay = document.getElementById("screensaver-overlay");
    const starsScreen = document.getElementById("stars-screen"); // (anciennement nommé "pasta")

    if (!overlay || !starsScreen) return;

    const IDLE_TIME = 12000;
    let idleTimer = null;

    function startScreensaver() {
      overlay.classList.add("active");
    }

    function stopScreensaver() {
      overlay.classList.remove("active");
    }

    function resetIdleTimer() {
      stopScreensaver();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(startScreensaver, IDLE_TIME);
    }

    ["mousemove", "mousedown", "keydown", "wheel", "touchstart"].forEach(
      (evt) => {
        window.addEventListener(evt, resetIdleTimer, { passive: true });
      },
    );

    overlay.addEventListener("mousemove", resetIdleTimer);
    overlay.addEventListener("click", resetIdleTimer);

    resetIdleTimer();
  })();

  /* ============================================================
     SECTION 8 — LOADER AU RECHARGEMENT DE PAGE
     Ne se déclenche QUE si la navigation est un vrai "reload"
     (F5 / Ctrl+R), pas au premier chargement normal. Bloque le
     scroll pendant 4s le temps que la vidéo du loader se joue.
     ============================================================ */
  const loader = document.querySelector(".loader");
  const loaderVideo = document.getElementById("hair-cut");

  const navEntry = performance.getEntriesByType("navigation")[0];
  const isReload = navEntry && navEntry.type === "reload";

  if (loader && loaderVideo && isReload) {
    const preventScroll = (event) => {
      if (event.type === "keydown") {
        const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Space"];
        if (keys.includes(event.key)) {
          event.preventDefault();
        }
        return;
      }

      event.preventDefault();
    };

    ["wheel", "touchmove", "keydown"].forEach((eventName) => {
      window.addEventListener(eventName, preventScroll, { passive: false });
    });

    document.body.classList.add("loading");
    loader.classList.add("active");
    loaderVideo.currentTime = 0;

    setTimeout(() => {
      ["wheel", "touchmove", "keydown"].forEach((eventName) => {
        window.removeEventListener(eventName, preventScroll, {
          passive: false,
        });
      });

      loader.classList.remove("active");
      document.body.classList.remove("loading");
    }, 4000);
  }
});
