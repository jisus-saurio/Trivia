/* ============================================================
   trivia.js — Trivia Party · Fondo beige animado #E6E2D7
   ============================================================ */
(function () {
  "use strict";

  /* ---- Preguntas ---- */
  const QUESTIONS = [
    { q: "¿Qué país tiene la mayor cantidad de islas en el mundo?",      opts: ["Filipinas", "Suecia", "Indonesia", "Canadá"],     correct: 1 },
    { q: "¿Cuál es el océano más grande del mundo?",                      opts: ["Atlántico", "Índico", "Ártico", "Pacífico"],      correct: 3 },
    { q: "¿Cuántos huesos tiene el cuerpo humano adulto?",               opts: ["206", "215", "198", "230"],                       correct: 0 },
    { q: "¿En qué año llegó el hombre a la Luna?",                       opts: ["1965", "1971", "1969", "1972"],                   correct: 2 },
    { q: "¿Cuál es el país más grande del mundo?",                       opts: ["China", "Canadá", "Brasil", "Rusia"],             correct: 3 },
    { q: "¿Qué planeta es conocido como el planeta rojo?",               opts: ["Venus", "Marte", "Júpiter", "Saturno"],           correct: 1 },
    { q: "¿Cuál es el animal terrestre más rápido?",                     opts: ["León", "Guepardo", "Antílope", "Caballo"],        correct: 1 },
    { q: "¿Cuántos lados tiene un hexágono?",                            opts: ["5", "7", "6", "8"],                               correct: 2 },
    { q: "¿Cuál es la capital de Japón?",                                opts: ["Osaka", "Kioto", "Hiroshima", "Tokio"],           correct: 3 },
    { q: "¿Cuál es el elemento más abundante en la corteza terrestre?",  opts: ["Hierro", "Oxígeno", "Silicio", "Aluminio"],       correct: 1 }
  ];

  const TIMER_SECS = 15;

  let currentQ  = 0;
  let score     = 0;
  let answered  = false;
  let timerInterval = null;
  let timeLeft  = TIMER_SECS;

  let totalTime = 0;
  let bestTime  = Infinity;
  let startTs   = 0;

  /* ---- DOM refs ---- */
  const counterEl   = document.getElementById("questionCounter");
  const scoreBadge  = document.getElementById("scoreBadge");
  const timerBar    = document.getElementById("timerBar");
  const timerSecs   = document.getElementById("timerSecs");
  const questionEl  = document.getElementById("questionText");
  const overlay     = document.getElementById("overlay");
  const feedbackCard= document.getElementById("feedbackCard");
  const fbOtter     = document.getElementById("fbOtter");
  const fbResult    = document.getElementById("fbResult");
  const fbAnswer    = document.getElementById("fbAnswer");
  const fbScore     = document.getElementById("fbScore");

  const answerBtns  = [
    document.getElementById("btnA"),
    document.getElementById("btnB"),
    document.getElementById("btnC"),
    document.getElementById("btnD")
  ];
  const answerSpans = [
    document.getElementById("ansA"),
    document.getElementById("ansB"),
    document.getElementById("ansC"),
    document.getElementById("ansD")
  ];

  /* ---- Load question ---- */
  function loadQuestion() {
    answered = false;
    const q = QUESTIONS[currentQ];
    counterEl.textContent  = `pregunta ${currentQ + 1} de ${QUESTIONS.length}`;
    scoreBadge.textContent = `${currentQ + 1}/${QUESTIONS.length}`;
    questionEl.textContent = q.q;

    answerBtns.forEach((btn, i) => {
      answerSpans[i].textContent = q.opts[i];
      btn.disabled  = false;
      btn.className = "answer-btn";
    });

    startTimer();
    startTs = Date.now();
  }

  /* ---- Timer ---- */
  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = TIMER_SECS;
    updateTimerUI();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerUI();
      if (timeLeft <= 0) { clearInterval(timerInterval); if (!answered) timeUp(); }
    }, 1000);
  }

  function updateTimerUI() {
    const pct = (timeLeft / TIMER_SECS) * 100;
    timerBar.style.width = pct + "%";
    timerSecs.textContent = timeLeft + "s";
    timerBar.classList.remove("warning", "danger");
    if (pct <= 33)      timerBar.classList.add("danger");
    else if (pct <= 60) timerBar.classList.add("warning");
  }

  function timeUp() {
    answered = true;
    recordTime(TIMER_SECS);
    answerBtns.forEach(b => b.disabled = true);
    answerBtns[QUESTIONS[currentQ].correct].classList.add("correct");
    showFeedback(false, true);
  }

  function recordTime(secs) {
    totalTime += secs;
    if (secs < bestTime) bestTime = secs;
  }

  /* ---- Select answer ---- */
  window.selectAnswer = function (idx) {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);

    const usedSecs = Math.round((Date.now() - startTs) / 1000);
    recordTime(usedSecs);

    answerBtns.forEach(b => b.disabled = true);
    const correct   = QUESTIONS[currentQ].correct;
    const isCorrect = idx === correct;
    answerBtns[correct].classList.add("correct");
    if (!isCorrect) answerBtns[idx].classList.add("wrong");
    if (isCorrect) score++;
    showFeedback(isCorrect, false);
  };

  /* ---- Feedback overlay ---- */
  function showFeedback(isCorrect, timeOut) {
    const correctText = QUESTIONS[currentQ].opts[QUESTIONS[currentQ].correct];
    fbResult.textContent = isCorrect ? "¡correcto!" : (timeOut ? "¡tiempo!" : "¡equivocado!");
    fbAnswer.textContent = `la respuesta es: ${correctText}`;
    fbScore.textContent  = `${currentQ + 1}/${QUESTIONS.length}`;

    if (isCorrect) {
      fbOtter.src = "imagenes/feliz.png";
      feedbackCard.classList.remove("wrong-card");
      feedbackCard.classList.add("correct-card");
    } else {
      fbOtter.src = "imagenes/triste.png";
      feedbackCard.classList.remove("correct-card");
      feedbackCard.classList.add("wrong-card");
    }

    feedbackCard.style.animation = "none";
    feedbackCard.offsetHeight;
    feedbackCard.style.animation = "";
    overlay.classList.add("show");
  }

  /* ---- Next question ---- */
  window.nextQuestion = function () {
    overlay.classList.remove("show");
    currentQ++;
    if (currentQ < QUESTIONS.length) {
      loadQuestion();
    } else {
      showFinal();
    }
  };

  /* ---- Final screen ---- */
  function fmtTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function showFinal() {
    const avgSecs  = Math.round(totalTime / QUESTIONS.length);
    const recSecs  = bestTime === Infinity ? 0 : bestTime;
    const pct      = Math.round((score / QUESTIONS.length) * 100);

    let sloganText = "¡bien hecho!";
    let subText    = "Estás mejorando cada día";
    if (score === QUESTIONS.length) { sloganText = "¡perfecto!"; subText = "¡Eres un genio de la trivia!"; }
    else if (score < 4)             { sloganText = "¡sigue intentando!"; subText = "La práctica hace al maestro"; }

    document.getElementById("gameScreen").outerHTML = `
      <div class="final-screen" id="finalScreen">
        <div class="final-wrapper">
          <div class="final-left">
            <img src="imagenes/entusiasta.png" alt="nutria" />
            <p class="final-slogan">${sloganText}</p>
            <p class="final-sub">${subText}</p>
          </div>
          <div class="final-right">
            <p class="final-title">PUNTAJE FINAL</p>
            <p class="final-score">${score}/10</p>
            <div class="final-progress-track">
              <div class="final-progress-bar" id="finalBar" style="width:0%"></div>
            </div>
            <div class="final-stats">
              <div class="stat-card">
                <span class="stat-icon">⏱️</span>
                <span class="stat-label">Tiempo Promedio</span>
                <span class="stat-value">${fmtTime(avgSecs)}</span>
              </div>
              <div class="stat-card">
                <span class="stat-icon">🏆</span>
                <span class="stat-label">Tiempo Récord</span>
                <span class="stat-value">${fmtTime(recSecs)}</span>
              </div>
            </div>
            <div class="final-btns">
              <button class="btn-replay" onclick="location.reload()">volver a jugar ↺</button>
              <button class="btn-home" onclick="location.href='inicio.html'">inicio</button>
            </div>
          </div>
        </div>
      </div>`;

    setTimeout(() => {
      const bar = document.getElementById("finalBar");
      if (bar) bar.style.width = pct + "%";
    }, 100);
  }

  window.goBack = function () {
    clearInterval(timerInterval);
    window.location.href = "inicio.html";
  };

  /* ===== CANVAS BACKGROUND — paleta sage/blush/peach animada ===== */
  const canvas = document.getElementById("bgCanvas");
  const ctx    = canvas.getContext("2d");
  let W, H;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener("resize", resize);
  resize();

  /* Paleta de la imagen: savory sage, avocado smoothie, blush beet, peach protein, oat latte */
  const BG_TOP    = "#C2C395";   /* avocado smoothie  */
  const BG_MID    = "#DCD4C1";   /* oat latte         */
  const BG_BOTTOM = "#EFD7CF";   /* peach protein     */

  /* Partículas con colores de la paleta */
  const PART_COLORS = [
    "#818263",   /* savory sage    */
    "#C2C395",   /* avocado smooth */
    "#DDBAAE",   /* blush beet     */
    "#EFD7CF",   /* peach protein  */
    "#DCD4C1",   /* oat latte      */
    "#F6EAD4",   /* honey oatmilk  */
  ];

  const SHAPES = ["circle", "ring", "diamond", "cross", "triangle", "dot"];
  const shapes = [];

  function randomShape() {
    return {
      type:     SHAPES[Math.floor(Math.random() * SHAPES.length)],
      x:        Math.random() * W,
      y:        Math.random() * H,
      size:     14 + Math.random() * 36,
      speedX:   (Math.random() - 0.5) * 0.22,
      speedY:   -(0.08 + Math.random() * 0.22),
      rot:      Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.008,
      alpha:    0.30 + Math.random() * 0.30,
      color:    PART_COLORS[Math.floor(Math.random() * PART_COLORS.length)]
    };
  }
  for (let i = 0; i < 38; i++) shapes.push(randomShape());

  let bT = 0;
  function drawBg() {
    /* Gradiente con la paleta */
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   BG_TOP);
    grad.addColorStop(0.5, BG_MID);
    grad.addColorStop(1,   BG_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    bT += 0.002;

    /* Blob sage — centro */
    const bx1 = W * 0.50 + Math.sin(bT * 0.7) * W * 0.22;
    const by1 = H * 0.40 + Math.sin(bT * 0.5) * H * 0.14;
    const g1  = ctx.createRadialGradient(bx1, by1, 0, bx1, by1, W * 0.48);
    g1.addColorStop(0, "rgba(194,195,149,0.32)");
    g1.addColorStop(1, "rgba(220,212,193,0)");
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    /* Blob blush — esquina superior derecha */
    const bx2 = W * 0.82 + Math.cos(bT * 1.0 + 1) * W * 0.10;
    const by2 = H * 0.16 + Math.sin(bT * 0.8) * H * 0.08;
    const g2  = ctx.createRadialGradient(bx2, by2, 0, bx2, by2, W * 0.28);
    g2.addColorStop(0, "rgba(221,186,174,0.36)");
    g2.addColorStop(1, "rgba(239,215,207,0)");
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    /* Blob peach — esquina inferior izquierda */
    const bx3 = W * 0.14 + Math.sin(bT * 1.2 + 3) * W * 0.10;
    const by3 = H * 0.80 + Math.cos(bT * 0.9) * H * 0.09;
    const g3  = ctx.createRadialGradient(bx3, by3, 0, bx3, by3, W * 0.28);
    g3.addColorStop(0, "rgba(239,215,207,0.38)");
    g3.addColorStop(1, "rgba(220,212,193,0)");
    ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H);

    /* Blob avocado — esquina inferior derecha */
    const bx4 = W * 0.84 + Math.sin(bT * 0.6 + 5) * W * 0.08;
    const by4 = H * 0.78 + Math.cos(bT * 1.1) * H * 0.08;
    const g4  = ctx.createRadialGradient(bx4, by4, 0, bx4, by4, W * 0.22);
    g4.addColorStop(0, "rgba(129,130,99,0.22)");
    g4.addColorStop(1, "rgba(220,212,193,0)");
    ctx.fillStyle = g4; ctx.fillRect(0, 0, W, H);
  }

  function drawShape(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalAlpha  = s.alpha;
    ctx.fillStyle    = s.color;
    ctx.strokeStyle  = s.color;
    ctx.lineWidth    = 2;

    switch (s.type) {
      case "circle":
        ctx.beginPath(); ctx.arc(0, 0, s.size * 0.45, 0, Math.PI * 2);
        ctx.fill(); break;
      case "dot":
        ctx.beginPath(); ctx.arc(0, 0, s.size * 0.18, 0, Math.PI * 2);
        ctx.fill(); break;
      case "ring":
        ctx.beginPath(); ctx.arc(0, 0, s.size * 0.42, 0, Math.PI * 2);
        ctx.lineWidth = 2.5; ctx.stroke(); break;
      case "diamond":
        ctx.beginPath();
        ctx.moveTo(0, -s.size * 0.5);
        ctx.lineTo(s.size * 0.45, 0);
        ctx.lineTo(0, s.size * 0.5);
        ctx.lineTo(-s.size * 0.45, 0);
        ctx.closePath(); ctx.stroke(); break;
      case "cross": {
        const t = s.size * 0.10, h = s.size * 0.42;
        ctx.fillRect(-t, -h, t * 2, h * 2);
        ctx.fillRect(-h, -t, h * 2, t * 2);
        break;
      }
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(0, -s.size * 0.45);
        ctx.lineTo(s.size * 0.42, s.size * 0.42);
        ctx.lineTo(-s.size * 0.42, s.size * 0.42);
        ctx.closePath(); ctx.stroke(); break;
    }
    ctx.restore();
  }

  function tick() {
    drawBg();
    shapes.forEach(s => {
      drawShape(s);
      s.x += s.speedX;
      s.y += s.speedY;
      s.rot += s.rotSpeed;
      if (s.y < -s.size * 2)     s.y = H + s.size;
      if (s.x < -s.size * 2)     s.x = W + s.size;
      if (s.x > W + s.size * 2)  s.x = -s.size;
    });
    requestAnimationFrame(tick);
  }
  tick();

  /* ---- Start ---- */
  loadQuestion();

})();