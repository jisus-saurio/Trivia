/* ============================================================
   trivia.js — Trivia Party · Comunicación con Flask
   Responsabilidades:
     - fetch a /api/pregunta, /api/responder, /api/siguiente, /api/final
     - actualizar DOM (pregunta, opciones, timer, score)
     - animar canvas de fondo
     - mostrar/ocultar overlay de feedback
     - mostrar pantalla final con datos del servidor
   NO contiene lógica de negocio (score, validación de respuesta).
   ============================================================ */
(function () {
  "use strict";

  /* ── Constantes ────────────────────────────────────────────── */
  const TIMER_SECS = 15;   /* solo para el timer visual; Flask valida */

  /* ── Estado local de UI ────────────────────────────────────── */
  let timerInterval = null;
  let timeLeft      = TIMER_SECS;
  let startTs       = 0;
  let uiAnswered    = false;   /* evita doble clic antes de respuesta del servidor */

  /* ── Refs DOM ──────────────────────────────────────────────── */
  const counterEl    = document.getElementById("questionCounter");
  const scoreBadge   = document.getElementById("scoreBadge");
  const timerBar     = document.getElementById("timerBar");
  const timerSecsEl  = document.getElementById("timerSecs");
  const questionEl   = document.getElementById("questionText");
  const overlay      = document.getElementById("overlay");
  const feedbackCard = document.getElementById("feedbackCard");
  const fbOtter      = document.getElementById("fbOtter");
  const fbResult     = document.getElementById("fbResult");
  const fbAnswer     = document.getElementById("fbAnswer");
  const fbScore      = document.getElementById("fbScore");
  const gameScreen   = document.getElementById("gameScreen");
  const finalScreen  = document.getElementById("finalScreen");
  const finalScore   = document.getElementById("finalScore");
  const finalSlogan  = document.getElementById("finalSlogan");
  const finalSub     = document.getElementById("finalSub");
  const finalAvg     = document.getElementById("finalAvg");
  const finalBest    = document.getElementById("finalBest");
  const finalBar     = document.getElementById("finalBar");

  const answerBtns  = [
    document.getElementById("btnA"),
    document.getElementById("btnB"),
    document.getElementById("btnC"),
    document.getElementById("btnD"),
  ];
  const answerSpans = [
    document.getElementById("ansA"),
    document.getElementById("ansB"),
    document.getElementById("ansC"),
    document.getElementById("ansD"),
  ];

  /* ── URLs de imágenes (inyectadas por Flask en trivia.html) ── */
  const IMG_FELIZ  = window.IMG_FELIZ  || "/static/imagenes/feliz.png";
  const IMG_TRISTE = window.IMG_TRISTE || "/static/imagenes/triste.png";

  /* ================================================================
     FETCH HELPERS
     ================================================================ */

  async function apiFetch(url, options) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn(`[trivia] ${url} →`, res.status, err);
        return null;
      }
      return await res.json();
    } catch (e) {
      console.error("[trivia] fetch error:", e);
      return null;
    }
  }

  /* ================================================================
     CARGAR PREGUNTA
     ================================================================ */

  async function loadQuestion() {
    uiAnswered = false;

    const data = await apiFetch("/api/pregunta");
    if (!data || data.error) {
      questionEl.textContent = "Error cargando pregunta.";
      return;
    }

    /* Actualizar UI */
    counterEl.textContent  = `pregunta ${data.index + 1} de ${data.total}`;
    scoreBadge.textContent = `${data.score}/${data.total}`;
    questionEl.textContent = data.question;

    data.options.forEach((opt, i) => {
      if (answerSpans[i]) answerSpans[i].textContent = opt;
      if (answerBtns[i]) {
        answerBtns[i].disabled  = false;
        answerBtns[i].className = "answer-btn";
      }
    });

    startTimer(data.timer || TIMER_SECS);
    startTs = Date.now();
  }

  /* ================================================================
     TIMER VISUAL
     ================================================================ */

  function startTimer(secs) {
    clearInterval(timerInterval);
    timeLeft = secs;
    updateTimerUI();

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerUI();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        if (!uiAnswered) handleTimeUp();
      }
    }, 1000);
  }

  function updateTimerUI() {
    const pct = (timeLeft / TIMER_SECS) * 100;
    if (timerBar) {
      timerBar.style.width = pct + "%";
      timerBar.classList.remove("warning", "danger");
      if (pct <= 33)      timerBar.classList.add("danger");
      else if (pct <= 60) timerBar.classList.add("warning");
    }
    if (timerSecsEl) timerSecsEl.textContent = timeLeft + "s";
  }

  function handleTimeUp() {
    uiAnswered = true;
    answerBtns.forEach(b => { if (b) b.disabled = true; });
    sendAnswer(null, true);
  }

  /* ================================================================
     SELECCIONAR RESPUESTA (expuesto globalmente)
     ================================================================ */

  window.selectAnswer = function (idx) {
    if (uiAnswered) return;
    uiAnswered = true;
    clearInterval(timerInterval);
    answerBtns.forEach(b => { if (b) b.disabled = true; });

    const usedSecs = Math.round((Date.now() - startTs) / 1000);
    sendAnswer(idx, false, usedSecs);
  };

  async function sendAnswer(selectedIdx, timeOut, usedSecs) {
    const payload = {
      answer:    selectedIdx,
      time_used: usedSecs ?? TIMER_SECS,
      time_out:  timeOut,
    };

    const data = await apiFetch("/api/responder", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!data || data.error) {
      console.error("[trivia] Error al responder:", data);
      return;
    }

    /* Marcar botones según resultado del servidor */
    if (answerBtns[data.correct_index]) {
      answerBtns[data.correct_index].classList.add("correct");
    }
    if (!data.correct && !data.time_out && selectedIdx !== null) {
      if (answerBtns[selectedIdx]) {
        answerBtns[selectedIdx].classList.add("wrong");
      }
    }

    /* Actualizar score badge */
    if (scoreBadge) scoreBadge.textContent = `${data.score}/${data.total}`;

    showFeedback(data);
  }

  /* ================================================================
     FEEDBACK OVERLAY
     ================================================================ */

  function showFeedback(data) {
    if (!feedbackCard || !overlay) return;

    if (fbResult) fbResult.textContent = data.result_text;
    if (fbAnswer) fbAnswer.textContent = `la respuesta es: ${data.correct_text}`;
    if (fbScore)  fbScore.textContent  = `${data.question_num}/${data.total}`;

    if (data.correct) {
      if (fbOtter) fbOtter.src = IMG_FELIZ;
      feedbackCard.classList.remove("wrong-card");
      feedbackCard.classList.add("correct-card");
    } else {
      if (fbOtter) fbOtter.src = IMG_TRISTE;
      feedbackCard.classList.remove("correct-card");
      feedbackCard.classList.add("wrong-card");
    }

    /* Re-trigger animación */
    feedbackCard.style.animation = "none";
    void feedbackCard.offsetHeight; /* reflow */
    feedbackCard.style.animation  = "";

    overlay.classList.add("show");
  }

  /* ================================================================
     SIGUIENTE PREGUNTA (expuesto globalmente)
     ================================================================ */

  window.nextQuestion = async function () {
    if (!overlay) return;
    overlay.classList.remove("show");

    const data = await apiFetch("/api/siguiente", { method: "POST" });
    if (!data) return;

    if (data.finished) {
      showFinalScreen();
    } else {
      loadQuestion();
    }
  };

  /* ================================================================
     PANTALLA FINAL
     ================================================================ */

  async function showFinalScreen() {
    const data = await apiFetch("/api/final");
    if (!data) return;

    /* Ocultar game screen, mostrar final */
    if (gameScreen)  gameScreen.style.display  = "none";
    if (finalScreen) finalScreen.style.display = "flex";

    if (finalSlogan) finalSlogan.textContent = data.slogan;
    if (finalSub)    finalSub.textContent    = data.sub;
    if (finalScore)  finalScore.textContent  = `${data.score}/10`;
    if (finalAvg)    finalAvg.textContent    = data.avg_time;
    if (finalBest)   finalBest.textContent   = data.best_time;

    /* Animar barra de progreso */
    setTimeout(() => {
      if (finalBar) finalBar.style.width = data.pct + "%";
    }, 150);
  }

  /* ================================================================
     VOLVER AL INICIO (expuesto globalmente)
     ================================================================ */

  window.goBack = function () {
    clearInterval(timerInterval);
    window.location.href = "/inicio";
  };

  /* ================================================================
     CANVAS — Fondo animado (paleta sage/blush/peach)
     ================================================================ */
  (function initCanvas() {
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

    /* Paleta */
    const BG_TOP    = "#C2C395";
    const BG_MID    = "#DCD4C1";
    const BG_BOTTOM = "#EFD7CF";

    const PART_COLORS = [
      "#818263", "#C2C395", "#DDBAAE",
      "#EFD7CF", "#DCD4C1", "#F6EAD4",
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
        color:    PART_COLORS[Math.floor(Math.random() * PART_COLORS.length)],
      };
    }

    for (let i = 0; i < 38; i++) shapes.push(randomShape());

    let bT = 0;

    function drawBg() {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0,   BG_TOP);
      grad.addColorStop(0.5, BG_MID);
      grad.addColorStop(1,   BG_BOTTOM);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      bT += 0.002;

      /* Blobs animados */
      const blobs = [
        { bx: W * 0.50 + Math.sin(bT * 0.7) * W * 0.22, by: H * 0.40 + Math.sin(bT * 0.5) * H * 0.14, r: W * 0.48, c0: "rgba(194,195,149,0.32)", c1: "rgba(220,212,193,0)" },
        { bx: W * 0.82 + Math.cos(bT * 1.0 + 1) * W * 0.10, by: H * 0.16 + Math.sin(bT * 0.8) * H * 0.08, r: W * 0.28, c0: "rgba(221,186,174,0.36)", c1: "rgba(239,215,207,0)" },
        { bx: W * 0.14 + Math.sin(bT * 1.2 + 3) * W * 0.10, by: H * 0.80 + Math.cos(bT * 0.9) * H * 0.09, r: W * 0.28, c0: "rgba(239,215,207,0.38)", c1: "rgba(220,212,193,0)" },
        { bx: W * 0.84 + Math.sin(bT * 0.6 + 5) * W * 0.08, by: H * 0.78 + Math.cos(bT * 1.1) * H * 0.08, r: W * 0.22, c0: "rgba(129,130,99,0.22)", c1: "rgba(220,212,193,0)" },
      ];

      blobs.forEach(({ bx, by, r, c0, c1 }) => {
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
        g.addColorStop(0, c0);
        g.addColorStop(1, c1);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });
    }

    function drawShape(s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle   = s.color;
      ctx.strokeStyle = s.color;
      ctx.lineWidth   = 2;

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

    function canvasTick() {
      drawBg();
      shapes.forEach(s => {
        drawShape(s);
        s.x   += s.speedX;
        s.y   += s.speedY;
        s.rot += s.rotSpeed;
        if (s.y < -s.size * 2)    s.y = H + s.size;
        if (s.x < -s.size * 2)    s.x = W + s.size;
        if (s.x > W + s.size * 2) s.x = -s.size;
      });
      requestAnimationFrame(canvasTick);
    }
    canvasTick();
  })();

  /* ================================================================
     INICIO
     ================================================================ */
  loadQuestion();

})();
