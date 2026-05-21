/* ============================================================
   inicio.js — Trivia Party · Fondo animado con nubes
   Responsabilidades: canvas, animación, botón de navegación.
   NO contiene lógica de trivia.
   ============================================================ */
(function () {
  "use strict";

  /* ── Canvas setup ─────────────────────────────────────────── */
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  /* ── Fondo degradado ───────────────────────────────────────── */
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#F2C49B");
    grad.addColorStop(1, "#E8A87C");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Imagen de nube ────────────────────────────────────────── */
  const cloudImg = new Image();
  cloudImg.src   = "/static/imagenes/nube.png";

  /* ── Configuración de nubes ────────────────────────────────── */
  function makeCloud(randomX) {
    const w     = 80 + Math.random() * 220;
    const speed = 0.12 + Math.random() * 0.30;
    const y     = Math.random() * (H * 0.85);
    const alpha = Math.random() < 0.5
      ? 0.85 + Math.random() * 0.15   /* nube sólida  */
      : 0.20 + Math.random() * 0.30;  /* nube tenue   */
    const layer = w > 180 ? "front" : "back";
    const x     = randomX ? Math.random() * (W + w) - w : -w - 10;
    return { x, y, w, speed, alpha, layer };
  }

  const clouds = [];

  function initClouds() {
    clouds.length = 0;
    for (let i = 0; i < 18; i++) clouds.push(makeCloud(true));
  }

  function respawnCloud(c) {
    c.w     = 80 + Math.random() * 220;
    c.x     = -c.w - 10;
    c.y     = Math.random() * (H * 0.85);
    c.speed = 0.12 + Math.random() * 0.30;
    c.alpha = Math.random() < 0.5
      ? 0.85 + Math.random() * 0.15
      : 0.20 + Math.random() * 0.30;
    c.layer = c.w > 180 ? "front" : "back";
  }

  /* ── Dibujar una nube ──────────────────────────────────────── */
  function drawCloud(c) {
    if (!cloudImg.complete || cloudImg.naturalWidth === 0) return;
    const ratio = cloudImg.naturalHeight / cloudImg.naturalWidth;
    const h     = c.w * ratio;
    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.drawImage(cloudImg, c.x, c.y, c.w, h);
    ctx.restore();
  }

  /* ── Loop de animación ─────────────────────────────────────── */
  cloudImg.onload = initClouds;
  initClouds(); /* por si ya estaba en caché */

  function tick() {
    drawBackground();

    /* Capa trasera: pequeñas, lentas */
    clouds
      .filter(c => c.layer === "back")
      .forEach(c => {
        drawCloud(c);
        c.x += c.speed * 0.45;
        if (c.x > W + 10) respawnCloud(c);
      });

    /* Capa delantera: grandes, rápidas */
    clouds
      .filter(c => c.layer === "front")
      .forEach(c => {
        drawCloud(c);
        c.x += c.speed;
        if (c.x > W + 10) respawnCloud(c);
      });

    requestAnimationFrame(tick);
  }
  tick();

  /* ── Botón Jugar ───────────────────────────────────────────── */
  const playBtn = document.getElementById("playBtn");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      window.location.href = "/trivia";
    });
  }

})();
