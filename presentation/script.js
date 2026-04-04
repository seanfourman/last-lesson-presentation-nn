document.addEventListener("DOMContentLoaded", () => {
  setupHeroInteraction();

  const pixels = window.MNIST_MODEL?.digitExamples?.["3"];
  setupCompareSection(pixels);
  setupValueSection(pixels);

  if (!pixels) {
    return;
  }

  const canvas = document.getElementById("heroDigitCanvas");
  if (canvas) {
    drawDigit(canvas, pixels);
  }

  scrollToHashTarget();
});

function setupHeroInteraction() {
  const hero = document.querySelector(".pixel-hero");
  const frame = hero?.querySelector(".digit-frame");
  const overlayCanvas = document.getElementById("heroGridOverlay");
  if (!hero || !frame || !overlayCanvas) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchOnly = window.matchMedia("(hover: none)");
  const state = {
    frame,
    hero,
    overlayCanvas,
    revealFront: 0,
    revealTarget: 0,
    hideFront: 0,
    hideTarget: 0,
    rafId: 0,
  };

  if (window.location.hash === "#preview-grid") {
    state.revealFront = 1;
    state.revealTarget = 1;
    hero.classList.add("is-revealed");
  }

  resizeGridOverlay(state);
  renderGridOverlay(state);

  window.addEventListener("resize", () => {
    resizeGridOverlay(state);
    renderGridOverlay(state);
  });

  const setReveal = (shouldReveal) => {
    hero.classList.toggle("is-revealed", shouldReveal);
    animateGridOverlay(state, shouldReveal ? 1 : 0, reduceMotion.matches);
  };

  hero.addEventListener("pointerenter", () => {
    if (!touchOnly.matches) {
      setReveal(true);
    }
  });

  hero.addEventListener("pointerleave", () => {
    if (!touchOnly.matches) {
      setReveal(false);
    }
  });

  hero.addEventListener("focus", () => {
    setReveal(true);
  });

  hero.addEventListener("blur", () => {
    if (!touchOnly.matches) {
      setReveal(false);
    }
  });

  hero.addEventListener("click", () => {
    if (!touchOnly.matches) {
      return;
    }

    setReveal(!hero.classList.contains("is-revealed"));
  });
}

function animateGridOverlay(state, target, instant = false) {
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }

  if (target > 0.5) {
    state.revealTarget = 1;
    state.hideTarget = 0;
  } else {
    state.revealTarget = state.revealFront;
    state.hideTarget = state.revealFront;
  }

  if (instant) {
    state.revealFront = state.revealTarget;
    state.hideFront = state.hideTarget;

    if (target <= 0.001) {
      state.revealFront = 0;
      state.revealTarget = 0;
      state.hideFront = 0;
      state.hideTarget = 0;
    }

    renderGridOverlay(state);
    return;
  }

  const startReveal = state.revealFront;
  const startHide = state.hideFront;
  const duration = 900;
  const startedAt = performance.now();

  const tick = (now) => {
    const elapsed = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    state.revealFront = startReveal + (state.revealTarget - startReveal) * eased;
    state.hideFront = startHide + (state.hideTarget - startHide) * eased;
    renderGridOverlay(state);

    if (elapsed < 1) {
      state.rafId = requestAnimationFrame(tick);
      return;
    }

    state.revealFront = state.revealTarget;
    state.hideFront = state.hideTarget;

    if (target <= 0.001) {
      state.revealFront = 0;
      state.revealTarget = 0;
      state.hideFront = 0;
      state.hideTarget = 0;
    }

    state.rafId = 0;
    renderGridOverlay(state);
  };

  state.rafId = requestAnimationFrame(tick);
}

function resizeGridOverlay(state) {
  const { frame, overlayCanvas } = state;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(frame.clientWidth * devicePixelRatio));
  const height = Math.max(1, Math.round(frame.clientHeight * devicePixelRatio));

  if (overlayCanvas.width === width && overlayCanvas.height === height) {
    return;
  }

  overlayCanvas.width = width;
  overlayCanvas.height = height;
}

function setupCompareSection(basePixels) {
  const stage = document.getElementById("compareStage");
  const overlay = document.getElementById("overlayDigit");
  const overlayCanvas = document.getElementById("overlayDigitCanvas");
  const compareCanvases = [
    document.getElementById("compareDigit1"),
    document.getElementById("compareDigit2"),
    document.getElementById("compareDigit3"),
  ].filter(Boolean);

  if (!stage || !overlay || !overlayCanvas || compareCanvases.length !== 3) {
    return;
  }

  const generatedDigits = generateCompareDigits().map((pixels) =>
    normalizeDigitPixels(pixels, { padding: 2, threshold: 10 }),
  );
  const overlayPixels = normalizeDigitPixels(basePixels ?? generatedDigits[1], {
    paddingX: 2,
    paddingY: 3,
    threshold: 10,
    scaleBoost: 1.01,
  });
  const overlayRenderer = createOverlayDigitRenderer(overlayCanvas, overlayPixels);

  const renderAll = () => {
    compareCanvases.forEach((canvas, index) => {
      renderScaledDigit(canvas, generatedDigits[index], {
        color: [245, 245, 245],
        glowAlpha: 0.08,
        glowBlur: 12,
      });
    });

    overlayRenderer.render();
  };

  renderAll();
  setupOverlayDrag(stage, overlay, {
    onDragChange: (isDragging) => {
      overlayRenderer.setDragging(isDragging);
    },
    onResize: () => {
      overlayRenderer.render();
    },
  });
  window.addEventListener("resize", renderAll);
}

function setupValueSection(pixels) {
  const shell = document.getElementById("valuesShell");
  const stage = shell?.querySelector(".values-stage");
  const figure = document.getElementById("valueFigure");
  const digitCanvas = document.getElementById("valueDigitCanvas");
  const matrixCanvas = document.getElementById("valueMatrixCanvas");
  const arrow = document.getElementById("valuesArrow");
  const output = document.getElementById("valuesOutput");
  const copy = document.getElementById("valuesCopy");
  const selector = shell.querySelector(".values-selector");

  if (!shell || !stage || !figure || !digitCanvas || !matrixCanvas || !arrow || !output || !copy || !selector || !pixels) {
    return;
  }

  let stateIndex = 0;
  let selectorIndex = 5;
  let selectorDirection = 1;
  let selectorTimerId = 0;
  const copyByState = [
    "מבחינת המחשב, זאת לא באמת ספרה אלא מטריצה של 28×28 ערכים. כל תא מחזיק מספר בין 0 ל־1 שמתאר את עוצמת האפור של הפיקסל שלו.",
    "אחרי ההמרה הזאת, הקלט כבר איננו ציור אלא 784 מספרים. זה החומר הגולמי שהרשת מקבלת לפני שהיא מתחילה להבין מה מופיע בתמונה.",
    "בשלב הבא הרשת משווה את הדפוס הזה לכל אחת מהספרות 0 עד 9, ומנסה להבין לאיזו ספרה הקלט הכי קרוב כרגע.",
  ];
  const labelByState = [
    "לחצו כדי לעבור מתמונת הספרה אל ערכי עוצמת האפור שלה",
    "לחצו שוב כדי להראות איך הרשת מחפשת בין הספרות 0 עד 9",
    "לחצו שוב כדי לחזור לתמונת הספרה",
  ];

  drawDigit(digitCanvas, pixels);

  const renderAll = () => {
    drawValueMatrix(matrixCanvas, pixels);
    updateInferenceLayout();
  };

  const setSelectorIndex = (index) => {
    selectorIndex = clamp(index, 0, 9);
    selector.style.setProperty("--selector-index", String(selectorIndex));
  };

  const stopSelectorLoop = () => {
    if (selectorTimerId) {
      window.clearTimeout(selectorTimerId);
      selectorTimerId = 0;
    }
  };

  const getNextSelectorIndex = () => {
    if (selectorIndex >= 8) {
      selectorDirection = -1;
    } else if (selectorIndex <= 1) {
      selectorDirection = 1;
    } else if (Math.random() < 0.28) {
      selectorDirection *= -1;
    }

    const step = Math.random() < 0.22 ? 2 : 1;
    return clamp(selectorIndex + selectorDirection * step, 0, 9);
  };

  const runSelectorLoop = () => {
    stopSelectorLoop();

    if (stateIndex !== 2) {
      return;
    }

    const delay = 720 + Math.random() * 220;
    selectorTimerId = window.setTimeout(() => {
      setSelectorIndex(getNextSelectorIndex());
      runSelectorLoop();
    }, delay);
  };

  const updateInferenceLayout = () => {
    if (stateIndex !== 2) {
      figure.style.left = "50%";
      figure.style.transform = "translate(-50%, -50%)";
      arrow.style.left = "";
      arrow.style.width = "";
      return;
    }

    const stageWidth = stage.clientWidth;
    const figureWidth = figure.getBoundingClientRect().width || Math.min(stageWidth * 0.92, 840);
    const outputWidth = output.getBoundingClientRect().width || 180;
    const desiredLeft = stageWidth > 1180 ? 36 : Math.max(18, Math.round(stageWidth * 0.024));
    const clampedLeft = Math.min(desiredLeft, Math.max(24, stageWidth - figureWidth - outputWidth - 180));
    const outputLeft = stageWidth - outputWidth - 8;
    const arrowLeft = clampedLeft + figureWidth + 26;
    const arrowWidth = Math.max(76, outputLeft - arrowLeft - 42);

    figure.style.left = `${clampedLeft}px`;
    figure.style.transform = "translateY(-50%)";
    arrow.style.left = `${arrowLeft}px`;
    arrow.style.width = `${arrowWidth}px`;
  };

  const applyState = () => {
    const showValues = stateIndex >= 1;
    const showInference = stateIndex === 2;

    figure.classList.toggle("is-values", showValues);
    shell.classList.toggle("is-inference", showInference);
    output.setAttribute("aria-hidden", String(!showInference));
    figure.setAttribute("aria-pressed", String(showValues));
    figure.setAttribute("aria-label", labelByState[stateIndex]);
    copy.textContent = copyByState[stateIndex];

    if (showInference) {
      setSelectorIndex(5);
      selectorDirection = 1;
      runSelectorLoop();
    } else {
      stopSelectorLoop();
    }

    updateInferenceLayout();
    requestAnimationFrame(updateInferenceLayout);
    setTimeout(updateInferenceLayout, 0);
  };

  renderAll();
  window.addEventListener("resize", renderAll);
  document.fonts?.ready.then(renderAll).catch(() => {});

  figure.addEventListener("click", () => {
    stateIndex = (stateIndex + 1) % 3;
    applyState();
  });

  setSelectorIndex(5);
  applyState();
}

function setupOverlayDrag(stage, overlay, callbacks = {}) {
  const scrollRoot = document.querySelector(".page");
  const state = {
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    initialized: false,
    hasUserMoved: false,
  };

  const placeOverlay = (x, y) => {
    const maxX = Math.max(0, stage.clientWidth - overlay.offsetWidth);
    const maxY = Math.max(0, stage.clientHeight - overlay.offsetHeight);
    state.x = clamp(x, 0, maxX);
    state.y = clamp(y, 0, maxY);
    overlay.style.left = `${state.x}px`;
    overlay.style.top = `${state.y}px`;
  };

  const getViewportRect = () => {
    if (scrollRoot) {
      return scrollRoot.getBoundingClientRect();
    }

    return {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  };

  const resetOverlay = () => {
    const stageRect = stage.getBoundingClientRect();
    const viewportRect = getViewportRect();
    const centerX = viewportRect.left + viewportRect.width * 0.5;
    const centerY = viewportRect.top + viewportRect.height * 0.5;
    const startX = centerX - stageRect.left - overlay.offsetWidth / 2;
    const startY = centerY - stageRect.top - overlay.offsetHeight / 2;
    placeOverlay(startX, startY);
    state.initialized = true;
  };

  const maybeCenterOverlay = () => {
    if (state.hasUserMoved) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const viewportRect = getViewportRect();
    const visibleTop = Math.max(stageRect.top, viewportRect.top);
    const visibleBottom = Math.min(stageRect.bottom, viewportRect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibilityRatio = visibleHeight / Math.min(stageRect.height, viewportRect.height || stageRect.height);

    if (visibilityRatio >= 0.5) {
      resetOverlay();
      callbacks.onResize?.();
    }
  };

  const syncOnResize = () => {
    if (!state.initialized) {
      resetOverlay();
      return;
    }

    placeOverlay(state.x, state.y);
  };

  const stopDragging = (pointerId) => {
    state.dragging = false;
    overlay.classList.remove("is-dragging");
    callbacks.onDragChange?.(false);

    if (pointerId !== undefined && overlay.hasPointerCapture(pointerId)) {
      overlay.releasePointerCapture(pointerId);
    }
  };

  overlay.addEventListener("pointerdown", (event) => {
    const rect = overlay.getBoundingClientRect();
    state.dragging = true;
    state.hasUserMoved = true;
    state.offsetX = event.clientX - rect.left;
    state.offsetY = event.clientY - rect.top;
    overlay.classList.add("is-dragging");
    callbacks.onDragChange?.(true);
    overlay.setPointerCapture(event.pointerId);
  });

  overlay.addEventListener("pointermove", (event) => {
    if (!state.dragging) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const nextX = event.clientX - stageRect.left - state.offsetX;
    const nextY = event.clientY - stageRect.top - state.offsetY;
    placeOverlay(nextX, nextY);
  });

  overlay.addEventListener("pointerup", (event) => {
    stopDragging(event.pointerId);
  });

  overlay.addEventListener("pointercancel", (event) => {
    stopDragging(event.pointerId);
  });

  window.addEventListener("resize", () => {
    syncOnResize();
    callbacks.onResize?.();
    maybeCenterOverlay();
  });

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting || entry.intersectionRatio < 0.55 || state.hasUserMoved) {
        return;
      }

      resetOverlay();
      callbacks.onResize?.();
    },
    {
      root: scrollRoot ?? null,
      threshold: [0.55],
    },
  );

  visibilityObserver.observe(stage);
  scrollRoot?.addEventListener("scroll", maybeCenterOverlay, { passive: true });
  requestAnimationFrame(resetOverlay);
}

function renderGridOverlay(state) {
  const { overlayCanvas, frame, revealFront, hideFront } = state;
  const ctx = overlayCanvas.getContext("2d");
  const { width, height } = overlayCanvas;

  ctx.clearRect(0, 0, width, height);

  const visibleSpan = revealFront - hideFront;
  if (visibleSpan <= 0.002) {
    return;
  }

  const devicePixelRatio = width / Math.max(1, frame.clientWidth);
  const lineWidth = Math.max(1, devicePixelRatio);
  const cellWidth = width / 28;
  const cellHeight = height / 28;

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  for (let i = 0; i <= 28; i += 1) {
    const x = Math.round(i * cellWidth);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }

  for (let i = 0; i <= 28; i += 1) {
    const y = Math.round(i * cellHeight);
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.62)";
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  const softness = Math.min(0.12, visibleSpan * 0.45);
  const visibleStart = clamp01(hideFront);
  const visibleEnd = clamp01(revealFront);
  const fadeInStart = clamp01(visibleStart - softness);
  const fadeInEnd = clamp01(visibleStart + softness);
  const fadeOutStart = clamp01(visibleEnd - softness);
  const fadeOutEnd = clamp01(visibleEnd + softness);
  const mask = ctx.createLinearGradient(0, 0, width, height);
  const stops = [
    [0, 0],
    [fadeInStart, 0],
    [fadeInEnd, 1],
    [fadeOutStart, 1],
    [fadeOutEnd, 0],
    [1, 0],
  ].sort((a, b) => a[0] - b[0]);

  for (const [position, alpha] of stops) {
    addMaskStop(mask, position, alpha);
  }

  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

function addMaskStop(gradient, position, alpha) {
  gradient.addColorStop(clamp01(position), `rgba(0, 0, 0, ${alpha})`);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function scrollToHashTarget() {
  const hash = window.location.hash;
  if (!hash) {
    return;
  }

  const target = document.querySelector(hash);
  target?.scrollIntoView({ block: "start" });
}

function drawDigit(canvas, pixels) {
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(28, 28);

  for (let i = 0; i < pixels.length; i += 1) {
    const value = pixels[i];
    image.data[i * 4] = value;
    image.data[i * 4 + 1] = value;
    image.data[i * 4 + 2] = value;
    image.data[i * 4 + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
}

function renderPixelDigit(canvas, pixels, options = {}) {
  resizeCanvasToDisplaySize(canvas);

  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const color = options.color ?? [255, 255, 255];
  const haloAlpha = options.haloAlpha ?? 0.18;
  const pixelAlphaBoost = options.pixelAlphaBoost ?? 1;
  const spread = options.spread ?? 0;
  const glowBlur = options.glowBlur ?? 0;
  const glowAlpha = options.glowAlpha ?? 0;
  const waveTime = options.waveTime ?? 0;
  const waveAmplitude = options.waveAmplitude ?? 0;
  const waveFrequency = options.waveFrequency ?? 0.012;
  const wavePhase = options.wavePhase ?? 0;
  const swirlStrength = options.swirlStrength ?? 0;
  const cellWidth = width / 28;
  const cellHeight = height / 28;
  const cellSize = Math.min(cellWidth, cellHeight);
  const outerScale = options.outerScale ?? 0.86;
  const innerScale = options.innerScale ?? 0.6;
  const outerSize = cellSize * outerScale;
  const innerSize = cellSize * innerScale;
  const outerOffsetX = (cellWidth - outerSize) * 0.5;
  const outerOffsetY = (cellHeight - outerSize) * 0.5;
  const innerOffsetX = (cellWidth - innerSize) * 0.5;
  const innerOffsetY = (cellHeight - innerSize) * 0.5;

  ctx.clearRect(0, 0, width, height);

  for (let index = 0; index < pixels.length; index += 1) {
    const value = pixels[index] / 255;
    if (value <= 0.03) {
      continue;
    }

    const gridX = index % 28;
    const gridY = Math.floor(index / 28);
    const x = gridX * cellWidth;
    const y = gridY * cellHeight;
    const [r, g, b] = color;
    const centerX = x + cellWidth * 0.5;
    const centerY = y + cellHeight * 0.5;
    const dirX = centerX - width * 0.5;
    const dirY = centerY - height * 0.5;
    const distance = Math.hypot(dirX, dirY) || 1;
    const radialX = dirX / distance;
    const radialY = dirY / distance;
    const tangentX = -radialY;
    const tangentY = radialX;
    const shiftDistance = spread * cellSize * (0.72 + value * 0.9);
    const phaseSeed = gridX * 0.62 + gridY * 0.48 + (distance / cellSize) * 0.14 + wavePhase;
    const waveCarrier = Math.sin(waveTime * waveFrequency - phaseSeed);
    const waveLift = Math.max(0, waveCarrier) * waveAmplitude * cellSize * (0.34 + value * 1.18);
    const swirlCarrier = Math.sin(waveTime * (waveFrequency * 1.65) + gridX * 0.93 - gridY * 0.71 + wavePhase);
    const swirl = swirlCarrier * swirlStrength * cellSize * (0.22 + value * 0.52);
    const shiftX = radialX * (shiftDistance + waveLift * 0.85) + tangentX * swirl;
    const shiftY = radialY * (shiftDistance + waveLift) + tangentY * swirl;

    if (glowBlur > 0 && glowAlpha > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glowAlpha * value})`;
      ctx.shadowBlur = glowBlur;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, value * 0.4)})`;
      ctx.fillRect(x + outerOffsetX + shiftX, y + outerOffsetY + shiftY, outerSize, outerSize);
      ctx.restore();
    }

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${value * haloAlpha})`;
    ctx.fillRect(x + outerOffsetX + shiftX, y + outerOffsetY + shiftY, outerSize, outerSize);

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, value * pixelAlphaBoost)})`;
    ctx.fillRect(x + innerOffsetX + shiftX, y + innerOffsetY + shiftY, innerSize, innerSize);
  }
}

function renderScaledDigit(canvas, pixels, options = {}) {
  resizeCanvasToDisplaySize(canvas);

  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const color = options.color ?? [255, 255, 255];
  const alphaBoost = options.alphaBoost ?? 1;
  const glowBlur = options.glowBlur ?? 0;
  const glowAlpha = options.glowAlpha ?? 0;
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = 28;
  sourceCanvas.height = 28;
  const sourceCtx = sourceCanvas.getContext("2d");
  const image = sourceCtx.createImageData(28, 28);

  for (let i = 0; i < pixels.length; i += 1) {
    const alpha = Math.min(255, pixels[i] * alphaBoost);
    image.data[i * 4] = color[0];
    image.data[i * 4 + 1] = color[1];
    image.data[i * 4 + 2] = color[2];
    image.data[i * 4 + 3] = alpha;
  }

  sourceCtx.putImageData(image, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (glowBlur > 0 && glowAlpha > 0) {
    ctx.save();
    ctx.filter = `blur(${glowBlur}px)`;
    ctx.globalAlpha = glowAlpha;
    ctx.drawImage(sourceCanvas, 0, 0, width, height);
    ctx.restore();
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sourceCanvas, 0, 0, width, height);
}

function drawValueMatrix(canvas, pixels) {
  resizeCanvasToDisplaySize(canvas);

  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const cellWidth = width / 28;
  const cellHeight = height / 28;
  const gap = Math.max(0.8, Math.min(cellWidth, cellHeight) * 0.03);
  const fontSize = Math.max(8, Math.min(cellWidth, cellHeight) * 0.43);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fontSize}px Rubik, Heebo, sans-serif`;

  for (let index = 0; index < pixels.length; index += 1) {
    const value = pixels[index] / 255;
    const displayValue = (Math.round(value * 10) / 10).toFixed(1);
    const x = (index % 28) * cellWidth;
    const y = Math.floor(index / 28) * cellHeight;
    const fill = Math.round(value * 255);

    ctx.fillStyle = `rgb(${fill}, ${fill}, ${fill})`;
    ctx.fillRect(x + gap * 0.5, y + gap * 0.5, cellWidth - gap, cellHeight - gap);

    ctx.fillStyle = value > 0.5 ? "rgba(18, 18, 18, 0.92)" : "rgba(255, 255, 255, 0.92)";
    ctx.fillText(displayValue, x + cellWidth * 0.5, y + cellHeight * 0.56);
  }
}

function createOverlayDigitRenderer(canvas, pixels) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    canvas,
    pixels,
    dragging: false,
    spread: 0,
    glow: 0.16,
    targetSpread: 0,
    targetGlow: 0.16,
    rafId: 0,
  };

  const render = (now = performance.now()) => {
    const breath = state.dragging && !reduceMotion.matches ? (Math.sin(now * 0.0062) + 1) * 0.5 : 0;
    const spread = state.spread + breath * 0.02;
    const glow = state.glow + breath * 0.24;
    const dragMix = state.dragging ? Math.min(1, 0.7 + breath * 0.3) : 0;
    const color = mixColor([191, 181, 43], [255, 230, 84], dragMix);

    if (spread <= 0.012) {
      renderScaledDigit(state.canvas, state.pixels, {
        color,
        alphaBoost: 0.93,
        glowBlur: 16 + glow * 10,
        glowAlpha: 0.16 + glow * 0.14,
      });
      return;
    }

    renderPixelDigit(state.canvas, state.pixels, {
      color,
      haloAlpha: 0.26 + glow * 0.18,
      pixelAlphaBoost: 0.92 + breath * 0.08,
      spread,
      outerScale: 0.8 + breath * 0.015,
      innerScale: 0.58 + breath * 0.015,
      glowBlur: 18 + glow * 24,
      glowAlpha: 0.18 + glow * 0.22,
      waveTime: now,
      waveAmplitude: 0.28 + breath * 0.08,
      waveFrequency: 0.015,
      wavePhase: 1.2,
      swirlStrength: 0.1 + breath * 0.04,
    });
  };

  const animate = (now) => {
    state.rafId = 0;
    const spreadDelta = state.targetSpread - state.spread;
    const glowDelta = state.targetGlow - state.glow;
    const settled = Math.abs(spreadDelta) < 0.003 && Math.abs(glowDelta) < 0.01;

    if (settled) {
      state.spread = state.targetSpread;
      state.glow = state.targetGlow;
    } else {
      state.spread += spreadDelta * 0.18;
      state.glow += glowDelta * 0.18;
    }

    render(now);

    if (state.dragging || !settled) {
      state.rafId = requestAnimationFrame(animate);
    }
  };

  return {
    render,
    setDragging(isDragging) {
      state.dragging = isDragging;
      state.targetSpread = isDragging ? 0.12 : 0;
      state.targetGlow = isDragging ? 1 : 0.16;

      if (reduceMotion.matches) {
        state.spread = state.targetSpread;
        state.glow = state.targetGlow;
        render();
        return;
      }

      if (!state.rafId) {
        state.rafId = requestAnimationFrame(animate);
      }
    },
  };
}

function resizeCanvasToDisplaySize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function generateCompareDigits() {
  const variants = [
    {
      strokeWidth: 40,
      path: [
        ["M", 112, 40],
        ["C", 168, 24, 199, 47, 183, 90],
        ["C", 170, 124, 128, 130, 116, 136],
        ["C", 129, 143, 168, 161, 176, 204],
        ["C", 183, 246, 144, 267, 90, 245],
      ],
    },
    {
      strokeWidth: 40,
      path: [
        ["M", 72, 62],
        ["C", 151, 33, 204, 47, 189, 92],
        ["C", 176, 122, 134, 136, 124, 141],
        ["C", 144, 149, 189, 169, 190, 214],
        ["C", 192, 252, 140, 267, 84, 238],
      ],
    },
    {
      strokeWidth: 46,
      path: [
        ["M", 88, 56],
        ["C", 146, 34, 210, 54, 186, 105],
        ["C", 171, 135, 126, 144, 112, 147],
        ["C", 129, 153, 178, 174, 181, 216],
        ["C", 183, 255, 132, 271, 74, 239],
      ],
    },
  ];

  return variants.map((variant) => rasterizeThreeVariant(variant));
}

function normalizeDigitPixels(pixels, options = {}) {
  const threshold = options.threshold ?? 8;
  const padding = options.padding ?? 2;
  const paddingX = options.paddingX ?? padding;
  const paddingY = options.paddingY ?? padding;
  const scaleBoost = options.scaleBoost ?? 1;
  let minX = 28;
  let minY = 28;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < pixels.length; index += 1) {
    if (pixels[index] <= threshold) {
      continue;
    }

    const x = index % 28;
    const y = Math.floor(index / 28);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (maxX < 0 || maxY < 0) {
    return [...pixels];
  }

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = 28;
  sourceCanvas.height = 28;
  const sourceCtx = sourceCanvas.getContext("2d");
  const sourceImage = sourceCtx.createImageData(28, 28);

  for (let i = 0; i < pixels.length; i += 1) {
    const value = pixels[i];
    sourceImage.data[i * 4] = value;
    sourceImage.data[i * 4 + 1] = value;
    sourceImage.data[i * 4 + 2] = value;
    sourceImage.data[i * 4 + 3] = 255;
  }

  sourceCtx.putImageData(sourceImage, 0, 0);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = 28;
  outputCanvas.height = 28;
  const outputCtx = outputCanvas.getContext("2d");
  outputCtx.clearRect(0, 0, 28, 28);
  outputCtx.imageSmoothingEnabled = true;

  const sourceWidth = maxX - minX + 1;
  const sourceHeight = maxY - minY + 1;
  const targetWidth = 28 - paddingX * 2;
  const targetHeight = 28 - paddingY * 2;
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight) * scaleBoost;
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = (28 - drawWidth) * 0.5;
  const drawY = (28 - drawHeight) * 0.5;

  outputCtx.drawImage(
    sourceCanvas,
    minX,
    minY,
    sourceWidth,
    sourceHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
  );

  const { data } = outputCtx.getImageData(0, 0, 28, 28);
  const normalizedPixels = new Array(28 * 28);

  for (let i = 0; i < normalizedPixels.length; i += 1) {
    normalizedPixels[i] = data[i * 4];
  }

  return normalizedPixels;
}

function rasterizeThreeVariant(variant) {
  const sourceSize = 280;
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = sourceSize;
  sourceCanvas.height = sourceSize;
  const sourceCtx = sourceCanvas.getContext("2d");

  sourceCtx.fillStyle = "#000";
  sourceCtx.fillRect(0, 0, sourceSize, sourceSize);
  sourceCtx.lineCap = "round";
  sourceCtx.lineJoin = "round";

  tracePath(sourceCtx, variant.path);
  sourceCtx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  sourceCtx.lineWidth = variant.strokeWidth + 18;
  sourceCtx.stroke();

  tracePath(sourceCtx, variant.path);
  sourceCtx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  sourceCtx.lineWidth = variant.strokeWidth;
  sourceCtx.stroke();

  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 28;
  sampleCanvas.height = 28;
  const sampleCtx = sampleCanvas.getContext("2d");
  sampleCtx.imageSmoothingEnabled = true;
  sampleCtx.drawImage(sourceCanvas, 0, 0, 28, 28);

  const { data } = sampleCtx.getImageData(0, 0, 28, 28);
  const pixels = new Array(28 * 28);

  for (let i = 0; i < pixels.length; i += 1) {
    pixels[i] = data[i * 4];
  }

  return pixels;
}

function tracePath(ctx, commands) {
  ctx.beginPath();

  for (const command of commands) {
    const [type, ...values] = command;

    if (type === "M") {
      ctx.moveTo(values[0], values[1]);
      continue;
    }

    if (type === "C") {
      ctx.bezierCurveTo(values[0], values[1], values[2], values[3], values[4], values[5]);
    }
  }
}

function mixColor(from, to, amount) {
  return [
    Math.round(lerp(from[0], to[0], amount)),
    Math.round(lerp(from[1], to[1], amount)),
    Math.round(lerp(from[2], to[2], amount)),
  ];
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}
