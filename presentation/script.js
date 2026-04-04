document.addEventListener("DOMContentLoaded", () => {
  setupHeroInteraction();

  if (!window.MNIST_MODEL) {
    return;
  }

  const canvas = document.getElementById("heroDigitCanvas");
  if (!canvas) {
    return;
  }

  const pixels = window.MNIST_MODEL.digitExamples["3"];
  if (!pixels) {
    return;
  }

  drawDigit(canvas, pixels);
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
