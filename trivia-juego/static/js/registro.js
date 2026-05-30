(function () {
  "use strict";

  // Claves de localStorage para nombre de jugador y estadísticas.
  const NAME_KEY = "trivia_player_name";
  const STATS_KEY = "trivia_stats";

  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");
  const form = document.getElementById("nameForm");
  const nameInput = document.getElementById("playerName");
  const statsPanel = document.getElementById("statsPanel");

  let W, H;
  const bubbles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // Crea una burbuja con posición y velocidad aleatorias.
  function makeBubble() {
    return {
      x: Math.random() * W,
      y: H + Math.random() * 120,
      size: 18 + Math.random() * 50,
      speed: 0.4 + Math.random() * 1.1,
      alpha: 0.12 + Math.random() * 0.18,
      drift: (Math.random() - 0.5) * 0.45,
    };
  }

  function initBubbles() {
    bubbles.length = 0;
    for (let i = 0; i < 24; i++) bubbles.push(makeBubble());
  }

  // Dibuja un fondo animado con burbujas para la pantalla de registro.
  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "rgba(242, 205, 182, 0.85)");
    gradient.addColorStop(1, "rgba(246, 229, 209, 0.95)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    bubbles.forEach((bubble) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${bubble.alpha})`;
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fill();
      bubble.y -= bubble.speed;
      bubble.x += bubble.drift;
      if (bubble.y < -bubble.size) {
        Object.assign(bubble, makeBubble());
        bubble.y = H + bubble.size;
      }
    });
  }

  // Animación continua del fondo de registro.
  function loop() {
    drawBackground();
    requestAnimationFrame(loop);
  }

  // Recupera el historial de partidas guardado en localStorage.
  function getStoredStats() {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return { games: 0, correct: 0, totalTime: 0, bestTime: null, lastName: null };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { games: 0, correct: 0, totalTime: 0, bestTime: null, lastName: null };
    }
  }

  function formatMinutes(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function buildStatCard(title, value) {
    return `
      <div class="stat-card">
        <span class="stat-title">${title}</span>
        <span class="stat-value">${value}</span>
      </div>`;
  }

  // Muestra las estadísticas guardadas o un mensaje inicial si no hay datos.
  function renderStats() {
    const stats = getStoredStats();
    const name = localStorage.getItem(NAME_KEY);

    if (stats.games === 0) {
      statsPanel.innerHTML = `
        <p class="stats-empty">Aún no hay partidas guardadas. Escribe tu nombre y empieza la trivia para crear tu historial.</p>
        <p class="stats-note">Tus aciertos y tiempos se guardarán automáticamente en este navegador.</p>
      `;
      if (name) {
        statsPanel.innerHTML += `<p class="stats-note">Bienvenido de nuevo, <strong>${name}</strong>!</p>`;
      }
      return;
    }

    statsPanel.innerHTML = `
      <div class="stats-grid">
        ${buildStatCard("Partidas jugadas", stats.games)}
        ${buildStatCard("Aciertos totales", stats.correct)}
        ${buildStatCard("Tiempo acumulado", formatMinutes(stats.totalTime))}
        ${buildStatCard("Mejor tiempo", stats.bestTime === null ? "—" : formatMinutes(stats.bestTime))}
      </div>
      <p class="stats-note">Última vez: ${stats.lastName || "Amigo"}. Sigue mejorando tus récords en cada partida.</p>
    `;
  }

  function savePlayerName(name) {
    localStorage.setItem(NAME_KEY, name);
  }

  // Al enviar el formulario, se guarda el nombre y se inicia la trivia.
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    savePlayerName(name);
    window.location.href = "/trivia";
  });

  window.addEventListener("resize", resize);
  resize();
  initBubbles();
  loop();
  renderStats();
})();
