(function () {
  "use strict";

  // Animación de fondo y botón de inicio en la pantalla principal.
  const canvas = document.getElementById("bgCanvas");
  const ctx    = canvas.getContext("2d");
  let W, H;
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Dibuja el degradado de fondo del inicio.
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#F2C49B");
    grad.addColorStop(1, "#E8A87C");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

 
  // Imagen de nube usada para el efecto de fondo.
  const cloudImg = new Image();
  cloudImg.src = "imagenes/nube.png";


  function makeCloud(randomX) {
    const w     = 80  + Math.random() * 220;   
    const speed = 0.12 + Math.random() * 0.30;
    const y     = Math.random() * (H * 0.85);
    const alpha = Math.random() < 0.5
      ? 0.85 + Math.random() * 0.15           
      : 0.20 + Math.random() * 0.30;          
    const layer = w > 180 ? "front" : "back";
    const x     = randomX
      ? Math.random() * (W + w) - w
      : -w - 10;
    return { x, y, w, speed, alpha, layer };
  }

  const clouds = [];

  function initClouds() {
    clouds.length = 0;
    for (let i = 0; i < 18; i++) clouds.push(makeCloud(true));
  }

  function respawn(c) {
    const w     = 80  + Math.random() * 220;
    const alpha = Math.random() < 0.5
      ? 0.85 + Math.random() * 0.15
      : 0.20 + Math.random() * 0.30;
    c.w     = w;
    c.x     = -w - 10;
    c.y     = Math.random() * (H * 0.85);
    c.speed = 0.12 + Math.random() * 0.30;
    c.alpha = alpha;
    c.layer = w > 180 ? "front" : "back";
  }


  function drawCloud(c) {
    if (!cloudImg.complete || cloudImg.naturalWidth === 0) return;
    const ratio = cloudImg.naturalHeight / cloudImg.naturalWidth;
    const h     = c.w * ratio;
    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.drawImage(cloudImg, c.x, c.y, c.w, h);
    ctx.restore();
  }

  
  cloudImg.onload = initClouds;
  initClouds();

  // Loop principal que anima las nubes y el fondo.
  function tick() {
    drawBackground();

   
    clouds.filter(c => c.layer === "back").forEach(c => {
      drawCloud(c);
      c.x += c.speed * 0.45;
      if (c.x > W + 10) respawn(c);
    });

   
    clouds.filter(c => c.layer === "front").forEach(c => {
      drawCloud(c);
      c.x += c.speed;
      if (c.x > W + 10) respawn(c);
    });

    requestAnimationFrame(tick);
  }
  tick();

  
  const playBtn = document.getElementById("playBtn");
  if (playBtn) playBtn.addEventListener("click", () => { window.location.href = "/registro"; });

})();