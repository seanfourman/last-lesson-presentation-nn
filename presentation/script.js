document.addEventListener("DOMContentLoaded", () => {
  setupHeroInteraction();

  const model = window.MNIST_MODEL;
  const pixels = model?.digitExamples?.["3"];
  setupCompareSection(pixels);
  setupValueSection(pixels);
  setupNetworkDemoSection(model);
  setupMnistHistorySection(model);
  setupMnistWhySection(model);

  const canvas = document.getElementById("heroDigitCanvas");
  if (canvas && pixels) {
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
    state.revealFront =
      startReveal + (state.revealTarget - startReveal) * eased;
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
  const overlayRenderer = createOverlayDigitRenderer(
    overlayCanvas,
    overlayPixels,
  );

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

  if (
    !shell ||
    !stage ||
    !figure ||
    !digitCanvas ||
    !matrixCanvas ||
    !arrow ||
    !output ||
    !copy ||
    !selector ||
    !pixels
  ) {
    return;
  }

  let stateIndex = 0;
  let selectorIndex = 5;
  let selectorDirection = 1;
  let selectorTimerId = 0;
  const copyByState = [
    "נסו לרגע לכתוב תוכנית שמקבלת רשת של 28×28 פיקסלים, ומחזירה מספר אחד בין 0 ל-9.<br><strong>פתאום זו כבר לא משימה טריוויאלית בכלל.</strong>",
    'מבחינת המחשב, זה לא "שלוש" ולא כתב יד.<br>אלה רק 784 ערכים בין 0 ל-1, שכל אחד מהם מתאר כמה הפיקסל שלו בהיר.',
    "מכאן הרשת צריכה לעשות את הצעד הקשה באמת:<br>לקחת ים של מספרים קטנים, ולהפוך אותם להחלטה אחת מתוך 0 עד 9.",
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
    const figureWidth =
      figure.getBoundingClientRect().width || Math.min(stageWidth * 0.92, 840);
    const outputWidth = output.getBoundingClientRect().width || 180;
    const desiredLeft =
      stageWidth > 1180 ? 36 : Math.max(18, Math.round(stageWidth * 0.024));
    const clampedLeft = Math.min(
      desiredLeft,
      Math.max(24, stageWidth - figureWidth - outputWidth - 180),
    );
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
    copy.innerHTML = copyByState[stateIndex];

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

function setupMnistHistorySection(model) {
  const rawCanvases = [
    document.getElementById("mnistRawDigitA"),
    document.getElementById("mnistRawDigitB"),
    document.getElementById("mnistRawDigitC"),
  ];
  const standardCanvas = document.getElementById("mnistStandardDigit");

  if (rawCanvases.some((canvas) => !canvas) || !standardCanvas) {
    return;
  }

  const examples = model?.digitExamples || {};
  const fallbackPixels =
    examples["3"] || Object.values(examples).find((pixels) => Array.isArray(pixels));

  if (!fallbackPixels) {
    return;
  }

  const rawSamples = [
    examples["2"] || fallbackPixels,
    examples["3"] || fallbackPixels,
    examples["7"] || fallbackPixels,
  ];

  const renderAll = () => {
    renderMnistHistoryDigit(rawCanvases[0], rawSamples[0], "pixelated");
    renderMnistHistoryDigit(rawCanvases[1], rawSamples[1], "smooth");
    renderMnistHistoryDigit(rawCanvases[2], rawSamples[2], "sharp");
    renderMnistHistoryDigit(standardCanvas, examples["3"] || fallbackPixels, "standard");
  };

  renderAll();
  window.addEventListener("resize", renderAll);
}

function setupMnistWhySection(model) {
  const visionCanvases = [
    document.getElementById("mnistWhyVisionA"),
    document.getElementById("mnistWhyVisionB"),
    document.getElementById("mnistWhyVisionC"),
  ];
  const coreCanvas = document.getElementById("mnistWhyCoreDigit");

  if (visionCanvases.some((canvas) => !canvas) || !coreCanvas) {
    return;
  }

  const examples = model?.digitExamples || {};
  const fallbackPixels =
    examples["3"] || Object.values(examples).find((pixels) => Array.isArray(pixels));

  if (!fallbackPixels) {
    return;
  }

  const visionSamples = [
    examples["2"] || fallbackPixels,
    examples["5"] || fallbackPixels,
    examples["8"] || fallbackPixels,
  ];

  const renderAll = () => {
    renderMnistHistoryDigit(visionCanvases[0], visionSamples[0], "sharp");
    renderMnistHistoryDigit(visionCanvases[1], visionSamples[1], "smooth");
    renderMnistHistoryDigit(visionCanvases[2], visionSamples[2], "standard");
    renderMnistHistoryDigit(coreCanvas, examples["3"] || fallbackPixels, "standard");
  };

  renderAll();
  window.addEventListener("resize", renderAll);
}

function setupNetworkDemoSection(model) {
  const section = document.getElementById("network");
  const stage = document.getElementById("networkStage");
  const svg = document.getElementById("networkSvg");
  const overlayCanvas = document.getElementById("networkStageOverlay");
  const drawCanvas = document.getElementById("drawCanvas");
  const drawFrame = document.getElementById("drawPanelFrame");
  const clearButton = document.getElementById("networkClearButton");
  const sampleButton = document.getElementById("networkSampleButton");
  const phaseLabel = document.getElementById("networkPhaseLabel");
  const result = document.getElementById("networkResult");

  if (
    !section ||
    !stage ||
    !svg ||
    !overlayCanvas ||
    !drawCanvas ||
    !drawFrame ||
    !clearButton ||
    !sampleButton ||
    !model?.layers?.length
  ) {
    return;
  }

  const drawPad = createDigitDrawPad(drawCanvas, {
    onInkStart() {
      state.userHasDrawn = true;
      state.initialRunPlayed = true;
      stopPendingInference();
      scene.renderIdle();
      if (phaseLabel) {
        phaseLabel.textContent = "קלט חדש";
      }
      if (result) {
        result.textContent =
          "הציור החדש ייכנס עכשיו לרשת בתור קלט חדש, במקום הדוגמה הקודמת.";
      }
    },
    onChange() {
      state.userHasDrawn = true;
      scheduleInference();
    },
  });
  const scene = createNetworkVisualizer(svg, stage, overlayCanvas, model);
  const scrollRoot = document.querySelector(".page");
  const sampleDigits = Object.keys(model.digitExamples || {}).sort(
    (left, right) => Number(left) - Number(right),
  );
  const state = {
    sampleIndex: Math.max(0, sampleDigits.indexOf("7")),
    idleTimerId: 0,
    runId: 0,
    currentSnapshot: null,
    userHasDrawn: false,
    initialRunPlayed: false,
  };

  const stopPendingInference = () => {
    if (state.idleTimerId) {
      window.clearTimeout(state.idleTimerId);
      state.idleTimerId = 0;
    }
  };

  const setIdleMessage = (message) => {
    if (phaseLabel) {
      phaseLabel.textContent = drawPad.isBlank() ? "מחכה לקלט" : "דוגמת MNIST";
    }
    if (result) {
      result.textContent = message;
    }
  };

  const loadSampleDigit = (digit, autorun = false) => {
    const sample = model.digitExamples?.[digit];
    if (!sample) {
      return;
    }

    stopPendingInference();
    drawPad.loadPixels(sample);
    scene.renderIdle();
    if (phaseLabel) {
      phaseLabel.textContent = "דוגמת MNIST";
    }
    if (result) {
      result.innerHTML =
        `זו דוגמה של <strong>${digit}</strong> מתוך MNIST.` +
        ` כך נראה קלט מהמאגר שעליו הרשת אומנה,` +
        ` יחד עם התשובה הנכונה שממנה היא לומדת.`;
    }

    if (autorun) {
      window.requestAnimationFrame(() => {
        runInference("sample");
      });
    }
  };

  const scheduleInference = () => {
    stopPendingInference();
    state.idleTimerId = window.setTimeout(() => {
      runInference("draw");
    }, 620);
  };

  const updatePhaseCopy = (phase) => {
    if (phase === "preprocess") {
      if (phaseLabel) {
        phaseLabel.textContent = "Pre-processing";
      }
      if (result) {
        result.textContent =
          "הציור מיוצג עכשיו כגריד של 28×28, כלומר 784 ערכים שייכנסו לרשת.";
      }
      return;
    }

    if (phase === "input") {
      if (phaseLabel) {
        phaseLabel.textContent = "שכבת input";
      }
      if (result) {
        result.textContent =
          "כל פיקסל נטען לנוירון קלט מתאים, והשכבה הראשונה מקבלת את התמונה כמספרים.";
      }
      return;
    }

    if (phase === "hidden-1") {
      if (phaseLabel) {
        phaseLabel.textContent = "Hidden layer 1";
      }
      if (result) {
        result.textContent =
          "השכבה החבויה הראשונה מתחילה לבנות ייצוגים פשוטים מתוך הפיקסלים.";
      }
      return;
    }

    if (phase === "hidden-2") {
      if (phaseLabel) {
        phaseLabel.textContent = "Hidden layer 2";
      }
      if (result) {
        result.textContent =
          "השכבה הבאה מרכיבה מהייצוגים האלה דפוסים עשירים יותר לקראת ההחלטה.";
      }
      return;
    }

    if (phase === "output") {
      if (phaseLabel) {
        phaseLabel.textContent = "Output · 0–9";
      }
      if (result) {
        result.textContent =
          "בשכבת הפלט הרשת מחלקת ציונים לכל אחת מהספרות 0-9.";
      }
      return;
    }

    if (phaseLabel) {
      phaseLabel.textContent = "ההחלטה של הרשת";
    }
  };

  const runInference = (sourceKind = "draw") => {
    stopPendingInference();

    const processedPixels = preprocessDrawPixels(drawPad.getPixels());
    if (isPixelArrayBlank(processedPixels, 0.02)) {
      state.currentSnapshot = null;
      state.runId += 1;
      scene.renderIdle();
      setIdleMessage(
        "ציירו ספרה, והרשת תפעיל על הקלט החדש את מה שלמדה מתוך דוגמאות האימון של MNIST.",
      );
      return;
    }

    const inference = inferWithMnistModel(model, processedPixels);
    state.currentSnapshot = buildVisibleNetworkSnapshot(model, inference);

    const runId = ++state.runId;
    updatePhaseCopy("preprocess");

    scene.animate({
      drawFrame,
      processedPixels,
      snapshot: state.currentSnapshot,
      shouldContinue: () => runId === state.runId,
      onPhaseChange: updatePhaseCopy,
      onComplete: () => {
        if (runId !== state.runId) {
          return;
        }

        if (phaseLabel) {
          phaseLabel.textContent = "ההחלטה של הרשת";
        }
        if (result) {
          result.innerHTML =
            sourceKind === "sample"
              ? `על הדוגמה הזו הרשת נותנת את הציון הגבוה ביותר ל-<strong>${inference.predictedDigit}</strong> · ${formatPercent(inference.confidence)}`
              : `על הציור הזה הרשת נותנת את הציון הגבוה ביותר ל-<strong>${inference.predictedDigit}</strong> · ${formatPercent(inference.confidence)}`;
        }
      },
    });
  };

  clearButton.addEventListener("click", () => {
    stopPendingInference();
    state.runId += 1;
    state.currentSnapshot = null;
    state.userHasDrawn = true;
    drawPad.clear();
    scene.renderIdle();
    setIdleMessage(
      "ציירו ספרה, והרשת תפעיל על הקלט החדש את מה שלמדה מתוך דוגמאות האימון של MNIST.",
    );
  });

  sampleButton.addEventListener("click", () => {
    if (!sampleDigits.length) {
      return;
    }

    state.sampleIndex = (state.sampleIndex + 1) % sampleDigits.length;
    state.userHasDrawn = false;
    state.initialRunPlayed = true;
    loadSampleDigit(sampleDigits[state.sampleIndex], true);
  });

  window.addEventListener("resize", () => {
    drawPad.refresh();
    if (state.currentSnapshot) {
      scene.renderFinal(state.currentSnapshot);
      return;
    }

    scene.renderIdle();
  });

  if (sampleDigits.length) {
    loadSampleDigit(sampleDigits[state.sampleIndex], false);
  } else {
    setIdleMessage(
      "ציירו ספרה, והרשת תפעיל על הקלט החדש את מה שלמדה מתוך דוגמאות האימון של MNIST.",
    );
  }

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (
        !entry?.isIntersecting ||
        entry.intersectionRatio < 0.45 ||
        state.initialRunPlayed ||
        drawPad.isBlank()
      ) {
        return;
      }

      state.initialRunPlayed = true;
      runInference("sample");
    },
    {
      root: scrollRoot ?? null,
      threshold: [0.45],
    },
  );

  visibilityObserver.observe(section);
}

function createDigitDrawPad(canvas, callbacks = {}) {
  const ctx = canvas.getContext("2d");
  const inkCanvas = document.createElement("canvas");
  inkCanvas.width = 28;
  inkCanvas.height = 28;
  const state = {
    drawing: false,
    hasInk: false,
    sampleMode: false,
    lastPoint: null,
    pixels: new Array(28 * 28).fill(0),
  };

  const getDisplayGeometry = () => {
    const cellSize = Math.max(
      1,
      Math.floor(Math.min(canvas.width, canvas.height) / 28),
    );
    const drawSize = cellSize * 28;
    const drawX = Math.round((canvas.width - drawSize) * 0.5);
    const drawY = Math.round((canvas.height - drawSize) * 0.5);

    return {
      cellSize,
      drawSize,
      drawX,
      drawY,
    };
  };

  const syncInkCanvas = () => {
    const displayPixels = state.sampleMode
      ? boostSampleContrast(state.pixels)
      : state.pixels;
    drawDigit(inkCanvas, displayPixels);
  };

  const renderGrid = (geometry) => {
    const { cellSize, drawX, drawY, drawSize } = geometry;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.055)";
    ctx.lineWidth = 1;

    for (let index = 0; index <= 28; index += 1) {
      const offset = Math.round(drawX + index * cellSize) + 0.5;
      ctx.beginPath();
      ctx.moveTo(offset, drawY);
      ctx.lineTo(offset, drawY + drawSize);
      ctx.stroke();
    }

    for (let index = 0; index <= 28; index += 1) {
      const offset = Math.round(drawY + index * cellSize) + 0.5;
      ctx.beginPath();
      ctx.moveTo(drawX, offset);
      ctx.lineTo(drawX + drawSize, offset);
      ctx.stroke();
    }

    ctx.restore();
  };

  const renderToDisplay = () => {
    resizeCanvasToDisplaySize(canvas);
    clearCanvas(ctx, canvas.width, canvas.height);
    syncInkCanvas();

    const geometry = getDisplayGeometry();
    const { drawX, drawY, drawSize } = geometry;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(inkCanvas, drawX, drawY, drawSize, drawSize);
    ctx.restore();

    renderGrid(geometry);
  };

  const paintBackground = () => {
    state.pixels.fill(0);
    renderToDisplay();
  };

  const clearInternal = () => {
    paintBackground();
    state.drawing = false;
    state.hasInk = false;
    state.sampleMode = false;
    state.lastPoint = null;
  };

  const getPoint = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const localX = (event.clientX - rect.left) * scaleX;
    const localY = (event.clientY - rect.top) * scaleY;
    const { drawX, drawY, cellSize } = getDisplayGeometry();

    return {
      x: clamp((localX - drawX) / cellSize, 0, 27),
      y: clamp((localY - drawY) / cellSize, 0, 27),
    };
  };

  const updateInkState = () => {
    state.hasInk = state.pixels.some((value) => value > 10);
  };

  const stampBrush = (point) => {
    const radius = 2.35;
    const minX = Math.max(0, Math.floor(point.x - radius - 1));
    const maxX = Math.min(27, Math.ceil(point.x + radius + 1));
    const minY = Math.max(0, Math.floor(point.y - radius - 1));
    const maxY = Math.min(27, Math.ceil(point.y + radius + 1));

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x + 0.5 - point.x;
        const dy = y + 0.5 - point.y;
        const distance = Math.hypot(dx, dy);
        if (distance > radius) {
          continue;
        }

        const influence = clamp01(1 - distance / (radius + 0.12));
        const nextValue = Math.round(255 * Math.pow(influence, 0.82));

        const pixelIndex = y * 28 + x;
        state.pixels[pixelIndex] = Math.max(
          state.pixels[pixelIndex],
          nextValue,
        );
      }
    }
  };

  const strokePoint = (from, to) => {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance * 3));

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      stampBrush({
        x: lerp(from.x, to.x, t),
        y: lerp(from.y, to.y, t),
      });
    }

    updateInkState();
    renderToDisplay();
  };

  const startStroke = (event) => {
    if (state.sampleMode) {
      clearInternal();
    }

    callbacks.onInkStart?.();
    state.drawing = true;
    state.lastPoint = getPoint(event);
    strokePoint(
      {
        x: state.lastPoint.x - 0.01,
        y: state.lastPoint.y - 0.01,
      },
      state.lastPoint,
    );
    callbacks.onChange?.();
    canvas.setPointerCapture(event.pointerId);
  };

  const moveStroke = (event) => {
    if (!state.drawing || !state.lastPoint) {
      return;
    }

    const point = getPoint(event);
    strokePoint(state.lastPoint, point);
    state.lastPoint = point;
    callbacks.onChange?.();
  };

  const endStroke = (event) => {
    if (!state.drawing) {
      return;
    }

    state.drawing = false;
    state.lastPoint = null;
    if (
      event.pointerId !== undefined &&
      canvas.hasPointerCapture(event.pointerId)
    ) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  canvas.addEventListener("pointerdown", startStroke);
  canvas.addEventListener("pointermove", moveStroke);
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);
  canvas.addEventListener("pointerleave", (event) => {
    if (state.drawing && event.buttons === 0) {
      endStroke(event);
    }
  });

  clearInternal();

  return {
    clear() {
      clearInternal();
    },
    loadPixels(pixels) {
      clearInternal();
      state.pixels = pixels
        .slice(0, 28 * 28)
        .map((value) => clamp(Math.round(value), 0, 255));
      updateInkState();
      state.sampleMode = true;
      renderToDisplay();
    },
    getPixels() {
      return [...state.pixels];
    },
    isBlank() {
      return !state.hasInk;
    },
    refresh() {
      renderToDisplay();
    },
  };
}

function preprocessDrawPixels(pixels) {
  return pixels.map((value) => clamp(Math.round(value), 0, 255));
}

function boostSampleContrast(pixels) {
  let maxValue = 0;

  for (const value of pixels) {
    maxValue = Math.max(maxValue, value);
  }

  if (maxValue <= 0) {
    return [...pixels];
  }

  return pixels.map((value) => {
    const normalized = clamp(value / maxValue, 0, 1);
    if (normalized <= 0.05) {
      return 0;
    }

    const contrasted = clamp01((normalized - 0.05) / 0.95);
    if (contrasted >= 0.72) {
      return 255;
    }

    const lifted = Math.pow(contrasted, 0.36);
    const boosted = Math.min(1, lifted * 1.08);
    return Math.round(boosted * 255);
  });
}

function inferWithMnistModel(model, pixels) {
  let current = pixels.map((value) => value / 255);
  const activations = [current];
  let logits = null;

  model.layers.forEach((layer, layerIndex) => {
    const output = new Array(layer.output).fill(0);

    for (let outputIndex = 0; outputIndex < layer.output; outputIndex += 1) {
      output[outputIndex] = layer.bias[outputIndex];
    }

    for (let inputIndex = 0; inputIndex < layer.input; inputIndex += 1) {
      const inputValue = current[inputIndex];
      if (inputValue === 0) {
        continue;
      }

      const offset = inputIndex * layer.output;
      for (let outputIndex = 0; outputIndex < layer.output; outputIndex += 1) {
        output[outputIndex] += inputValue * layer.weights[offset + outputIndex];
      }
    }

    if (layerIndex < model.layers.length - 1) {
      current = output.map((value) => Math.max(0, value));
    } else {
      logits = [...output];
      current = softmax(output);
    }

    activations.push(current);
  });

  const output = activations[activations.length - 1];
  const predictedDigit = output.indexOf(Math.max(...output));
  const displayOutput = logits
    ? softmaxWithTemperature(logits, 5.2)
    : [...output];

  return {
    input: activations[0],
    hidden1: activations[1],
    hidden2: activations[2],
    output,
    displayOutput,
    predictedDigit,
    confidence: displayOutput[predictedDigit],
    rawConfidence: output[predictedDigit],
  };
}

function buildVisibleNetworkSnapshot(model, inference) {
  const inputIndices = pickVisibleInputIndices(inference.input, 16);
  const hidden1Indices = pickTopNeuronIndices(inference.hidden1, 12);
  const hidden2Indices = pickTopNeuronIndices(inference.hidden2, 12);
  const outputIndices = Array.from({ length: 10 }, (_, index) => index);
  const displaySeed =
    inference.predictedDigit * 37 + Math.round(inference.confidence * 1000);

  const inputNorms = inputIndices.map((index) => inference.input[index]);
  const hidden1Norms = buildHiddenLayerDisplayNorms(
    inference.hidden1,
    hidden1Indices,
    displaySeed + 11,
  );
  const hidden2Norms = buildHiddenLayerDisplayNorms(
    inference.hidden2,
    hidden2Indices,
    displaySeed + 29,
  );
  const outputScores = outputIndices.map(
    (index) => inference.displayOutput[index],
  );
  const outputNorms = outputScores.map((value) => Math.pow(value, 0.52));

  return {
    input: {
      indices: inputIndices,
      norms: inputNorms,
    },
    hidden1: {
      indices: hidden1Indices,
      norms: hidden1Norms,
    },
    hidden2: {
      indices: hidden2Indices,
      norms: hidden2Norms,
    },
    output: {
      indices: outputIndices,
      norms: outputNorms,
      scores: outputScores,
      predictedDigit: inference.predictedDigit,
      confidence: inference.confidence,
    },
    edges: [
      buildVisibleEdgeSnapshot(
        model.layers[0],
        inputIndices,
        hidden1Indices,
        inputNorms,
        hidden1Norms,
      ),
      buildVisibleEdgeSnapshot(
        model.layers[1],
        hidden1Indices,
        hidden2Indices,
        hidden1Norms,
        hidden2Norms,
      ),
      buildVisibleEdgeSnapshot(
        model.layers[2],
        hidden2Indices,
        outputIndices,
        hidden2Norms,
        outputNorms,
      ),
    ],
  };
}

function createNetworkVisualizer(svg, stage, overlayCanvas) {
  const viewBoxWidth = 1040;
  const viewBoxHeight = 680;
  const layout = {
    input: createSplitColumnPositions(132, 8, 72, 280, 404, 612),
    hidden1: createColumnPositions(450, 12, 68, 612),
    hidden2: createColumnPositions(690, 12, 68, 612),
    output: createColumnPositions(930, 10, 100, 580),
  };
  const scene = {
    nodeLayers: {
      input: [],
      hidden1: [],
      hidden2: [],
      output: [],
    },
    edgeGroups: [],
    highlightRect: null,
    ellipsisDots: [],
  };

  svg.innerHTML = "";

  const edgeRoot = createSvgElement("g");
  svg.append(edgeRoot);

  scene.edgeGroups = [
    createSvgElement("g"),
    createSvgElement("g"),
    createSvgElement("g"),
  ];
  scene.edgeGroups.forEach((group) => edgeRoot.append(group));

  scene.edgeGroups[0].lines = createEdgeLineElements(
    scene.edgeGroups[0],
    layout.input,
    layout.hidden1,
  );
  scene.edgeGroups[1].lines = createEdgeLineElements(
    scene.edgeGroups[1],
    layout.hidden1,
    layout.hidden2,
  );
  scene.edgeGroups[2].lines = createEdgeLineElements(
    scene.edgeGroups[2],
    layout.hidden2,
    layout.output,
  );

  svg.append(
    createSvgElement("path", {
      class: "nn-brace",
      d: makeVerticalBracePath(56, 58, 620, 22),
    }),
  );
  const countText = createSvgElement("text", {
    class: "nn-count",
    x: -62,
    y: 340,
    "text-anchor": "start",
  });
  countText.textContent = "784";
  svg.append(countText);

  const ellipsisGroup = createSvgElement("g");
  const ellipsisCenterY = (layout.input[7].y + layout.input[8].y) * 0.5;
  [ellipsisCenterY - 22, ellipsisCenterY, ellipsisCenterY + 22].forEach((y) => {
    const dot = createSvgElement("circle", {
      class: "nn-ellipsis",
      cx: 132,
      cy: y,
      r: 4.2,
    });
    ellipsisGroup.append(dot);
  });
  svg.append(ellipsisGroup);

  const nodeRoot = createSvgElement("g");
  svg.append(nodeRoot);

  scene.nodeLayers.input = layout.input.map((position) =>
    createNetworkNode(nodeRoot, position.x, position.y),
  );
  scene.nodeLayers.hidden1 = layout.hidden1.map((position) =>
    createNetworkNode(nodeRoot, position.x, position.y),
  );
  scene.nodeLayers.hidden2 = layout.hidden2.map((position) =>
    createNetworkNode(nodeRoot, position.x, position.y),
  );
  scene.nodeLayers.output = layout.output.map((position, index) =>
    createNetworkNode(nodeRoot, position.x, position.y, {
      outputLabel: String(index),
    }),
  );

  scene.highlightRect = createSvgElement("rect", {
    class: "nn-highlight",
    x: layout.output[0].x - 38,
    y: layout.output[0].y - 30,
    width: 184,
    height: 60,
    rx: 18,
    ry: 18,
  });
  svg.append(scene.highlightRect);

  const clearOverlay = () => {
    resizeCanvasToDisplaySize(overlayCanvas);
    const ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  };

  const getStagePoint = (point) => {
    const stageRect = stage.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    return {
      x:
        svgRect.left -
        stageRect.left +
        (point.x / viewBoxWidth) * svgRect.width,
      y:
        svgRect.top -
        stageRect.top +
        (point.y / viewBoxHeight) * svgRect.height,
    };
  };

  const renderNodes = (nodes, norms, progress, options = {}) => {
    nodes.forEach((node, index) => {
      const baseValue = norms?.[index] ?? 0;
      const nodeDelay =
        ((options.stagger ?? 0.18) * index) / Math.max(1, nodes.length - 1);
      const localProgress = clamp01((progress - nodeDelay) / 0.58);
      const eased = easeOutCubic(localProgress);
      const intensity = baseValue * eased;
      const emphasis = options.emphasisIndex === index ? localProgress : 0;
      const glowColor = mixColor([255, 223, 90], [255, 241, 122], intensity);
      const fillColor = mixColor(
        [7, 12, 16],
        [125, 104, 18],
        Math.pow(intensity, 0.88),
      );
      const idleRingOpacity = options.idleRingOpacity ?? 0.16;
      const ringOpacity = idleRingOpacity + intensity * 0.58 + emphasis * 0.24;

      node.fill.style.fill = `rgb(${fillColor[0]}, ${fillColor[1]}, ${fillColor[2]})`;
      node.glow.style.fill = `rgb(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]})`;
      node.glow.style.opacity = String(
        Math.min(
          0.96,
          Math.pow(intensity, 0.96) * (0.9 + emphasis * 0.42) + emphasis * 0.18,
        ),
      );
      node.glow.style.filter = `blur(${5 + intensity * 10 + emphasis * 4}px)`;
      node.fill.style.opacity = String(0.96);
      node.ring.style.stroke = emphasis
        ? `rgba(255, 246, 179, ${Math.min(0.98, ringOpacity + 0.1)})`
        : `rgba(255, 231, 92, ${Math.min(0.96, ringOpacity)})`;
      node.ring.style.strokeWidth = String(
        2.8 + intensity * 1.2 + emphasis * 0.6,
      );

      if (node.score) {
        const scoreValue = options.scoreValues?.[index] ?? norms?.[index] ?? 0;
        node.score.textContent = formatPercent(scoreValue);
        node.score.style.opacity = String(
          localProgress * (0.18 + intensity * 0.82),
        );
      }

      if (node.label) {
        node.label.style.fill =
          emphasis && localProgress > 0.88
            ? "rgba(255, 248, 177, 0.98)"
            : "rgba(255, 255, 255, 0.98)";
      }
    });
  };

  const renderEdges = (edgeElements, edgeSnapshot, progress) => {
    edgeElements.forEach((edge, index) => {
      const strength = edgeSnapshot?.strengths?.[index] ?? 0;
      const delay = edgeSnapshot?.delays?.[index] ?? 0;
      const localProgress = clamp01((progress - delay) / 0.34);
      const pulse = Math.sin(localProgress * Math.PI);
      const settled = localProgress > 0.82 ? (localProgress - 0.82) / 0.18 : 0;
      const lineIntensity =
        strength *
        Math.max(
          0,
          pulse * 1.08 + Math.min(1, settled) * (progress >= 1 ? 0.38 : 0.22),
        );
      const color = mixColor(
        [188, 188, 188],
        [255, 235, 120],
        Math.min(1, strength * 0.55 + lineIntensity * 0.9),
      );

      edge.style.stroke = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.05 + strength * 0.09 + lineIntensity * 0.86})`;
      edge.style.strokeWidth = String(
        0.92 + strength * 0.42 + lineIntensity * 1.76,
      );
      edge.style.filter =
        lineIntensity > 0.12
          ? `drop-shadow(0 0 ${2 + lineIntensity * 6}px rgba(255, 235, 120, ${0.18 + lineIntensity * 0.42}))`
          : "none";
    });
  };

  const renderSnapshot = (snapshot, progressState) => {
    renderEdges(
      scene.edgeGroups[0].lines,
      snapshot?.edges?.[0],
      progressState.h1,
    );
    renderEdges(
      scene.edgeGroups[1].lines,
      snapshot?.edges?.[1],
      progressState.h2,
    );
    renderEdges(
      scene.edgeGroups[2].lines,
      snapshot?.edges?.[2],
      progressState.out,
    );

    renderNodes(
      scene.nodeLayers.input,
      snapshot?.input?.norms,
      progressState.input,
      {
        stagger: 0.12,
        idleRingOpacity: 0.12,
      },
    );
    renderNodes(
      scene.nodeLayers.hidden1,
      snapshot?.hidden1?.norms,
      progressState.h1,
      {
        stagger: 0.2,
        idleRingOpacity: 0.06,
      },
    );
    renderNodes(
      scene.nodeLayers.hidden2,
      snapshot?.hidden2?.norms,
      progressState.h2,
      {
        stagger: 0.2,
        idleRingOpacity: 0.06,
      },
    );
    renderNodes(
      scene.nodeLayers.output,
      snapshot?.output?.norms,
      progressState.out,
      {
        emphasisIndex: snapshot?.output?.predictedDigit,
        scoreValues: snapshot?.output?.scores,
        stagger: 0.12,
        idleRingOpacity: 0.14,
      },
    );

    if (!snapshot?.output) {
      scene.highlightRect.style.opacity = "0";
      return;
    }

    const predictedSlot = snapshot.output.predictedDigit;
    const predictedPosition = layout.output[predictedSlot];
    scene.highlightRect.setAttribute("x", String(predictedPosition.x - 38));
    scene.highlightRect.setAttribute("y", String(predictedPosition.y - 30));
    scene.highlightRect.style.opacity = String(
      progressState.highlight * (0.18 + snapshot.output.confidence * 0.9),
    );
  };

  const renderIngestOverlay = (
    processedPixels,
    snapshot,
    drawFrame,
    progress,
  ) => {
    resizeCanvasToDisplaySize(overlayCanvas);
    const ctx = overlayCanvas.getContext("2d");
    const width = overlayCanvas.width;
    const height = overlayCanvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!processedPixels || progress <= 0) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const sourceRect = relativeRectToContainer(drawFrame, stage);
    const inputTargets = layout.input.map((position) =>
      getStagePoint(position),
    );
    const targetCenter = averagePoints(inputTargets);
    const ghostTarget = {
      x: targetCenter.x - 120,
      y: targetCenter.y - 112,
      width: 150,
      height: 150,
    };
    const ghostRect = lerpRect(
      sourceRect,
      ghostTarget,
      easeOutCubic(Math.min(1, progress * 0.9)),
    );
    const pixelCanvas = createPixelCanvas(processedPixels, {
      transparentBackground: true,
    });

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha =
      0.98 * (1 - easeInOutCubic(clamp01((progress - 0.18) / 0.48)));
    ctx.shadowColor = "rgba(255, 255, 255, 0.16)";
    ctx.shadowBlur = 28;
    ctx.drawImage(
      pixelCanvas,
      ghostRect.x,
      ghostRect.y,
      ghostRect.width,
      ghostRect.height,
    );
    ctx.restore();

    const particles = sampleBrightPixelParticles(
      processedPixels,
      inputTargets,
      stageRect.width,
    );

    particles.forEach((particle) => {
      const localProgress = clamp01((progress - particle.delay) / 0.72);
      if (localProgress <= 0) {
        return;
      }

      const dissolveStart = 0.3;
      const dissolveEnd = 0.54;
      if (localProgress >= dissolveEnd) {
        return;
      }

      const start = pointInRectForPixel(ghostRect, particle.pixelIndex);
      const end = particle.target;
      const mid = {
        x: lerp(start.x, end.x, 0.58) + particle.arcX,
        y: lerp(start.y, end.y, 0.36) + particle.arcY,
      };
      const travelProgress = easeInOutCubic(
        clamp01(localProgress / dissolveEnd),
      );
      const position = quadraticBezierPoint(start, mid, end, travelProgress);
      const fadeIn = easeOutCubic(clamp01(localProgress / 0.1));
      const dissolve =
        1 -
        easeOutCubic(
          clamp01(
            (localProgress - dissolveStart) / (dissolveEnd - dissolveStart),
          ),
        );
      const alpha = particle.intensity * fadeIn * dissolve * 1.18;
      if (alpha <= 0.01) {
        return;
      }

      const shrink =
        1 -
        0.84 *
          easeOutCubic(
            clamp01(
              (localProgress - dissolveStart) / (dissolveEnd - dissolveStart),
            ),
          );
      const drawSize = Math.max(0.65, particle.size * shrink);

      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
      ctx.fillRect(
        position.x - drawSize * 0.5,
        position.y - drawSize * 0.5,
        drawSize,
        drawSize,
      );
    });
  };

  return {
    renderIdle() {
      renderSnapshot(null, {
        input: 0,
        h1: 0,
        h2: 0,
        out: 0,
        highlight: 0,
      });
      clearOverlay();
    },
    renderFinal(snapshot) {
      renderSnapshot(snapshot, {
        input: 1,
        h1: 1,
        h2: 1,
        out: 1,
        highlight: 1,
      });
      clearOverlay();
    },
    animate({
      drawFrame,
      processedPixels,
      snapshot,
      shouldContinue,
      onPhaseChange,
      onComplete,
    }) {
      const startedAt = performance.now();
      let currentPhase = "";

      const frame = (now) => {
        if (!shouldContinue()) {
          clearOverlay();
          return;
        }

        const elapsed = now - startedAt;
        const ingest = getPhaseProgress(elapsed, 0, 680);
        const input = getPhaseProgress(elapsed, 220, 520);
        const h1 = getPhaseProgress(elapsed, 760, 520);
        const h2 = getPhaseProgress(elapsed, 1300, 520);
        const out = getPhaseProgress(elapsed, 1820, 620);
        const highlight = getPhaseProgress(elapsed, 2340, 280);

        let nextPhase = "preprocess";
        if (out > 0.05) {
          nextPhase = "output";
        } else if (h2 > 0.05) {
          nextPhase = "hidden-2";
        } else if (h1 > 0.05) {
          nextPhase = "hidden-1";
        } else if (input > 0.05) {
          nextPhase = "input";
        }

        if (highlight > 0.85) {
          nextPhase = "result";
        }

        if (nextPhase !== currentPhase) {
          currentPhase = nextPhase;
          onPhaseChange?.(currentPhase);
        }

        renderSnapshot(snapshot, {
          input,
          h1,
          h2,
          out,
          highlight,
        });
        renderIngestOverlay(processedPixels, snapshot, drawFrame, ingest);

        if (elapsed < 2740) {
          window.requestAnimationFrame(frame);
          return;
        }

        renderSnapshot(snapshot, {
          input: 1,
          h1: 1,
          h2: 1,
          out: 1,
          highlight: 1,
        });
        clearOverlay();
        onPhaseChange?.("result");
        onComplete?.();
      };

      window.requestAnimationFrame(frame);
    },
  };
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
    const visibilityRatio =
      visibleHeight /
      Math.min(stageRect.height, viewportRect.height || stageRect.height);

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
      if (
        !entry?.isIntersecting ||
        entry.intersectionRatio < 0.55 ||
        state.hasUserMoved
      ) {
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
    const phaseSeed =
      gridX * 0.62 + gridY * 0.48 + (distance / cellSize) * 0.14 + wavePhase;
    const waveCarrier = Math.sin(waveTime * waveFrequency - phaseSeed);
    const waveLift =
      Math.max(0, waveCarrier) *
      waveAmplitude *
      cellSize *
      (0.34 + value * 1.18);
    const swirlCarrier = Math.sin(
      waveTime * (waveFrequency * 1.65) +
        gridX * 0.93 -
        gridY * 0.71 +
        wavePhase,
    );
    const swirl =
      swirlCarrier * swirlStrength * cellSize * (0.22 + value * 0.52);
    const shiftX =
      radialX * (shiftDistance + waveLift * 0.85) + tangentX * swirl;
    const shiftY = radialY * (shiftDistance + waveLift) + tangentY * swirl;

    if (glowBlur > 0 && glowAlpha > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glowAlpha * value})`;
      ctx.shadowBlur = glowBlur;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, value * 0.4)})`;
      ctx.fillRect(
        x + outerOffsetX + shiftX,
        y + outerOffsetY + shiftY,
        outerSize,
        outerSize,
      );
      ctx.restore();
    }

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${value * haloAlpha})`;
    ctx.fillRect(
      x + outerOffsetX + shiftX,
      y + outerOffsetY + shiftY,
      outerSize,
      outerSize,
    );

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, value * pixelAlphaBoost)})`;
    ctx.fillRect(
      x + innerOffsetX + shiftX,
      y + innerOffsetY + shiftY,
      innerSize,
      innerSize,
    );
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

function renderMnistHistoryDigit(canvas, pixels, profile = "pixelated") {
  resizeCanvasToDisplaySize(canvas);

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const inset = Math.round(Math.min(width, height) * 0.14);
  const drawWidth = Math.max(1, width - inset * 2);
  const drawHeight = Math.max(1, height - inset * 2);
  const displayPixels = stylizeMnistHistoryPixels(pixels, profile);

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = 28;
  sourceCanvas.height = 28;
  const sourceCtx = sourceCanvas.getContext("2d");
  const image = sourceCtx.createImageData(28, 28);

  for (let i = 0; i < displayPixels.length; i += 1) {
    const alpha = clamp(Math.round(displayPixels[i]), 0, 255);
    image.data[i * 4] = 255;
    image.data[i * 4 + 1] = 255;
    image.data[i * 4 + 2] = 255;
    image.data[i * 4 + 3] = alpha;
  }

  sourceCtx.putImageData(image, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (profile === "smooth") {
    ctx.imageSmoothingEnabled = true;
    ctx.filter = "blur(0.35px)";
    ctx.drawImage(sourceCanvas, inset, inset, drawWidth, drawHeight);
    ctx.filter = "none";
    return;
  }

  if (profile === "standard") {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceCanvas, inset, inset, drawWidth, drawHeight);
    return;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sourceCanvas, inset, inset, drawWidth, drawHeight);
}

function stylizeMnistHistoryPixels(pixels, profile) {
  return pixels.map((value) => {
    const normalized = value / 255;

    if (profile === "smooth") {
      return clamp(Math.round(Math.pow(normalized, 0.92) * 255), 0, 255);
    }

    if (profile === "sharp") {
      if (normalized > 0.62) {
        return 255;
      }

      if (normalized < 0.12) {
        return 0;
      }

      return clamp(
        Math.round(((normalized - 0.12) / (0.62 - 0.12)) * 255),
        0,
        255,
      );
    }

    if (profile === "standard") {
      return clamp(Math.round(Math.pow(normalized, 0.96) * 255), 0, 255);
    }

    return value;
  });
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
    ctx.fillRect(
      x + gap * 0.5,
      y + gap * 0.5,
      cellWidth - gap,
      cellHeight - gap,
    );

    ctx.fillStyle =
      value > 0.5 ? "rgba(18, 18, 18, 0.92)" : "rgba(255, 255, 255, 0.92)";
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
    const breath =
      state.dragging && !reduceMotion.matches
        ? (Math.sin(now * 0.0062) + 1) * 0.5
        : 0;
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
  const scale =
    Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight) *
    scaleBoost;
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
      ctx.bezierCurveTo(
        values[0],
        values[1],
        values[2],
        values[3],
        values[4],
        values[5],
      );
    }
  }
}

function createColumnPositions(x, count, top, bottom) {
  if (count === 1) {
    return [{ x, y: (top + bottom) * 0.5 }];
  }

  return Array.from({ length: count }, (_, index) => ({
    x,
    y: lerp(top, bottom, index / (count - 1)),
  }));
}

function createSplitColumnPositions(
  x,
  topCount,
  topStart,
  topEnd,
  bottomStart,
  bottomEnd,
) {
  const topPositions = createColumnPositions(x, topCount, topStart, topEnd);
  const bottomPositions = createColumnPositions(
    x,
    topCount,
    bottomStart,
    bottomEnd,
  );

  return [...topPositions, ...bottomPositions];
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    tagName,
  );

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });

  return element;
}

function createEdgeLineElements(group, sourcePositions, targetPositions) {
  const lines = [];

  sourcePositions.forEach((source) => {
    targetPositions.forEach((target) => {
      const line = createSvgElement("line", {
        class: "nn-edge",
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y,
      });
      group.append(line);
      lines.push(line);
    });
  });

  return lines;
}

function createNetworkNode(groupRoot, x, y, options = {}) {
  const group = createSvgElement("g");
  const glow = createSvgElement("circle", {
    class: "nn-node-glow",
    cx: x,
    cy: y,
    r: 26,
  });
  const fill = createSvgElement("circle", {
    class: "nn-node-fill",
    cx: x,
    cy: y,
    r: 18,
  });
  const ring = createSvgElement("circle", {
    class: "nn-node-ring",
    cx: x,
    cy: y,
    r: 18,
  });
  group.append(glow, fill, ring);

  let label = null;
  let score = null;

  if (options.outputLabel !== undefined) {
    label = createSvgElement("text", {
      class: "nn-output-label",
      x: x + 38,
      y: y + 1,
    });
    label.textContent = String(options.outputLabel);
    group.append(label);

    score = createSvgElement("text", {
      class: "nn-output-score",
      x: x + 82,
      y: y + 1,
      opacity: 0,
    });
    score.textContent = "0%";
    group.append(score);
  }

  groupRoot.append(group);

  return {
    glow,
    fill,
    ring,
    label,
    score,
    x,
    y,
  };
}

function makeVerticalBracePath(x, y1, y2, width) {
  const middle = (y1 + y2) * 0.5;
  const curl = 34;

  return [
    `M ${x + width} ${y1}`,
    `C ${x + 3} ${y1}, ${x + 3} ${y1 + 18}, ${x + 3} ${y1 + curl}`,
    `L ${x + 3} ${middle - 44}`,
    `C ${x + 3} ${middle - 18}, ${x - 10} ${middle - 12}, ${x - 10} ${middle}`,
    `C ${x - 10} ${middle + 12}, ${x + 3} ${middle + 18}, ${x + 3} ${middle + 44}`,
    `L ${x + 3} ${y2 - curl}`,
    `C ${x + 3} ${y2 - 18}, ${x + 3} ${y2}, ${x + width} ${y2}`,
  ].join(" ");
}

function pickVisibleInputIndices(values, count) {
  const ranked = values
    .map((value, index) => ({
      index,
      value,
    }))
    .filter((entry) => entry.value > 0.04)
    .sort((left, right) => right.value - left.value)
    .slice(0, count)
    .map((entry) => entry.index);

  if (ranked.length < count) {
    const fallback = values
      .map((value, index) => ({
        index,
        value,
      }))
      .sort((left, right) => right.value - left.value)
      .map((entry) => entry.index);

    for (const index of fallback) {
      if (ranked.includes(index)) {
        continue;
      }

      ranked.push(index);
      if (ranked.length === count) {
        break;
      }
    }
  }

  return sortByGridPosition(ranked.slice(0, count));
}

function pickTopNeuronIndices(values, count) {
  return values
    .map((value, index) => ({
      index,
      value,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, count)
    .map((entry) => entry.index);
}

function normalizeSelectedActivations(values, indices) {
  const maxValue = Math.max(0.00001, ...values);
  return indices.map((index) => values[index] / maxValue);
}

function buildHiddenLayerDisplayNorms(values, indices, seed = 0) {
  const normalized = normalizeSelectedActivations(values, indices);

  return normalized.map((value, slot) => {
    const noise = pseudoRandom01(
      indices[slot] * 0.173 + slot * 1.917 + seed * 0.071,
    );
    const rankProgress = slot / Math.max(1, indices.length - 1);
    const rankWeight = 1 - rankProgress * 0.32;
    let gate = 0.72 + noise * 0.38;

    if (slot > 2 && noise < 0.18) {
      gate = 0.02 + noise * 0.18;
    } else if (slot > 1 && noise < 0.42) {
      gate = 0.16 + noise * 0.55;
    }

    return clamp01(Math.pow(value, 0.9) * gate * rankWeight);
  });
}

function buildVisibleEdgeSnapshot(
  layer,
  sourceIndices,
  targetIndices,
  sourceNorms,
  targetNorms,
) {
  const strengths = [];
  const delays = [];
  let maxStrength = 0.00001;

  sourceIndices.forEach((sourceIndex, sourceSlot) => {
    targetIndices.forEach((targetIndex, targetSlot) => {
      const weight = layer.weights[sourceIndex * layer.output + targetIndex];
      const strength =
        Math.abs(weight) *
        (sourceNorms[sourceSlot] + 0.02) *
        (targetNorms[targetSlot] + 0.04);
      strengths.push(strength);
      delays.push(
        (sourceSlot / Math.max(1, sourceIndices.length - 1)) * 0.48 +
          (targetSlot / Math.max(1, targetIndices.length - 1)) * 0.2,
      );
      maxStrength = Math.max(maxStrength, strength);
    });
  });

  return {
    strengths: strengths.map((value) => value / maxStrength),
    delays,
  };
}

function softmax(values) {
  const maxValue = Math.max(...values);
  const exponentials = values.map((value) => Math.exp(value - maxValue));
  const total = exponentials.reduce((sum, value) => sum + value, 0);

  return exponentials.map((value) => value / total);
}

function softmaxWithTemperature(values, temperature = 1) {
  const safeTemperature = Math.max(0.001, temperature);
  return softmax(values.map((value) => value / safeTemperature));
}

function pseudoRandom01(value) {
  const result = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return result - Math.floor(result);
}

function drawSampleDigitToCanvas(canvas, pixels) {
  const ctx = canvas.getContext("2d");
  const sourceCanvas = createPixelCanvas(pixels);
  const drawSize = canvas.width * 0.72;
  const drawX = (canvas.width - drawSize) * 0.5;
  const drawY = (canvas.height - drawSize) * 0.5;

  clearCanvas(ctx, canvas.width, canvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = "rgba(255, 255, 255, 0.2)";
  ctx.shadowBlur = canvas.width * 0.05;
  ctx.drawImage(sourceCanvas, drawX, drawY, drawSize, drawSize);
  ctx.restore();
}

function createPixelCanvas(pixels, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 28;
  canvas.height = 28;
  const ctx = canvas.getContext("2d");

  if (options.transparentBackground) {
    const image = ctx.createImageData(28, 28);

    for (let i = 0; i < pixels.length; i += 1) {
      const value = clamp(Math.round(pixels[i]), 0, 255);
      image.data[i * 4] = 255;
      image.data[i * 4 + 1] = 255;
      image.data[i * 4 + 2] = 255;
      image.data[i * 4 + 3] = value;
    }

    ctx.putImageData(image, 0, 0);
    return canvas;
  }

  drawDigit(canvas, pixels);
  return canvas;
}

function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
}

function relativeRectToContainer(element, container) {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return {
    x: elementRect.left - containerRect.left,
    y: elementRect.top - containerRect.top,
    width: elementRect.width,
    height: elementRect.height,
  };
}

function lerpRect(from, to, amount) {
  return {
    x: lerp(from.x, to.x, amount),
    y: lerp(from.y, to.y, amount),
    width: lerp(from.width, to.width, amount),
    height: lerp(from.height, to.height, amount),
  };
}

function pointInRectForPixel(rect, pixelIndex) {
  const cellWidth = rect.width / 28;
  const cellHeight = rect.height / 28;
  const column = pixelIndex % 28;
  const row = Math.floor(pixelIndex / 28);

  return {
    x: rect.x + column * cellWidth + cellWidth * 0.5,
    y: rect.y + row * cellHeight + cellHeight * 0.5,
  };
}

function quadraticBezierPoint(start, control, end, amount) {
  const inverse = 1 - amount;

  return {
    x:
      inverse * inverse * start.x +
      2 * inverse * amount * control.x +
      amount * amount * end.x,
    y:
      inverse * inverse * start.y +
      2 * inverse * amount * control.y +
      amount * amount * end.y,
  };
}

function sampleBrightPixelParticles(pixels, targets, stageWidth) {
  const normalizedPixels = pixels.map((value, index) => ({
    index,
    value: value / 255,
  }));
  const brightestValue = normalizedPixels.reduce(
    (maxValue, entry) => Math.max(maxValue, entry.value),
    0,
  );
  const primaryThreshold = Math.max(0.72, brightestValue * 0.8);
  const fallbackThreshold = Math.max(0.5, brightestValue * 0.62);

  let activePixels = normalizedPixels.filter(
    (entry) => entry.value >= primaryThreshold,
  );

  if (activePixels.length < 14) {
    activePixels = normalizedPixels.filter(
      (entry) => entry.value >= fallbackThreshold,
    );
  }

  activePixels = activePixels
    .sort((left, right) => right.value - left.value)
    .slice(0, 42);

  return activePixels.map((entry, index) => {
    const target = targets[index % targets.length];

    return {
      pixelIndex: entry.index,
      intensity: entry.value,
      target,
      delay: index * 0.012 + (index % targets.length) * 0.008,
      size: 2.4 + entry.value * 4.4,
      arcX: (Math.random() - 0.5) * Math.max(60, stageWidth * 0.06),
      arcY: (Math.random() - 0.5) * 120,
    };
  });
}

function sortByGridPosition(indices) {
  return [...indices].sort((left, right) => left - right);
}

function averagePoints(points) {
  const sum = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: sum.x / Math.max(1, points.length),
    y: sum.y / Math.max(1, points.length),
  };
}

function getPhaseProgress(elapsed, start, duration) {
  return clamp01((elapsed - start) / duration);
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - clamp01(value), 3);
}

function easeInOutCubic(value) {
  const clamped = clamp01(value);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function isPixelArrayBlank(pixels, threshold = 0.02) {
  return pixels.every((value) => value / 255 <= threshold);
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
