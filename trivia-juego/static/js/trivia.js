(function () {
  "use strict";

  // Lógica principal del juego de trivia, con preguntas, temporizador y respuesta.
  const TIMER_SECS = 15;

  let answered      = false;
  let timerInterval = null;
  let timeLeft      = TIMER_SECS;
  let startTs       = 0;
  let currentData   = null; 

  // Referencias a los elementos de la página usados por el juego.
  const counterEl    = document.getElementById("questionCounter");
  const scoreBadge   = document.getElementById("scoreBadge");
  const timerBar     = document.getElementById("timerBar");
  const timerSecs    = document.getElementById("timerSecs");
  const questionEl   = document.getElementById("questionText");
  const overlay      = document.getElementById("overlay");
  const feedbackCard = document.getElementById("feedbackCard");
  const fbOtter      = document.getElementById("fbOtter");
  const fbResult     = document.getElementById("fbResult");
  const fbAnswer     = document.getElementById("fbAnswer");
  const fbScore      = document.getElementById("fbScore");

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

  // Pide al servidor la pregunta actual en formato JSON.
  async function fetchPregunta() {
    const res  = await fetch("/api/pregunta");
    const data = await res.json();
    return data;
  }

  async function postRespuesta(answerIdx, timeUsed, timeOut) {
    const res = await fetch("/api/responder", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ answer: answerIdx, time_used: timeUsed, time_out: timeOut })
    });
    return res.json();
  }

  async function postSiguiente() {
    const res = await fetch("/api/siguiente", { method: "POST" });
    return res.json();
  }

  async function fetchFinal() {
    const res = await fetch("/api/final");
    return res.json();
  }

  // Carga la pregunta actual y actualiza la interfaz con sus opciones.
  async function loadQuestion() {
    answered      = false;
    currentData   = await fetchPregunta();

    const { index, total, question, options, score } = currentData;

    counterEl.textContent  = `pregunta ${index + 1} de ${total}`;
    scoreBadge.textContent = `${score}/${total}`;
    questionEl.textContent = question;

    answerBtns.forEach((btn, i) => {
      answerSpans[i].textContent = options[i];
      btn.disabled  = false;
      btn.className = "answer-btn";
    });

    startTimer();
    startTs = Date.now();
  }

  // Inicia el temporizador visual y de juego para cada pregunta.
  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = TIMER_SECS;
    updateTimerUI();
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerUI();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        if (!answered) timeUp();
      }
    }, 1000);
  }

  function updateTimerUI() {
    const pct = (timeLeft / TIMER_SECS) * 100;
    timerBar.style.width  = pct + "%";
    timerSecs.textContent = timeLeft + "s";
    timerBar.classList.remove("warning", "danger");
    if      (pct <= 33) timerBar.classList.add("danger");
    else if (pct <= 60) timerBar.classList.add("warning");
  }

  async function timeUp() {
    answered = true;
    answerBtns.forEach(b => b.disabled = true);
    const result = await postRespuesta(null, TIMER_SECS, true);
    answerBtns[result.correct_index].classList.add("correct");
    showFeedback(result);
  }

  // Procesa la selección de una respuesta y bloquea más interacciones.
  window.selectAnswer = async function (idx) {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);

    const usedSecs = Math.round((Date.now() - startTs) / 1000);
    answerBtns.forEach(b => b.disabled = true);

    const result = await postRespuesta(idx, usedSecs, false);

    answerBtns[result.correct_index].classList.add("correct");
    if (!result.correct) answerBtns[idx].classList.add("wrong");

    showFeedback(result);
  };


  // Muestra el resultado rápido después de cada respuesta.
  function showFeedback(result) {
    fbResult.textContent = result.result_text;
    fbAnswer.textContent = `la respuesta es: ${result.correct_text}`;
    fbScore.textContent  = `${result.score}/${result.total}`;

    if (result.correct) {
      fbOtter.src = fbOtter.dataset.happy;
      feedbackCard.classList.remove("wrong-card");
      feedbackCard.classList.add("correct-card");
    } else {
      fbOtter.src = fbOtter.dataset.sad;
      feedbackCard.classList.remove("correct-card");
      feedbackCard.classList.add("wrong-card");
    }

    feedbackCard.style.animation = "none";
    feedbackCard.offsetHeight;
    feedbackCard.style.animation = "";
    overlay.classList.add("show");
  }

  window.nextQuestion = async function () {
    overlay.classList.remove("show");
    const data = await postSiguiente();
    if (data.finished) {
      showFinal();
    } else {
      loadQuestion();
    }
  };

  // Recupera el historial de estadísticas locales.
  function getStoredStats() {
    const raw = localStorage.getItem("trivia_stats");
    if (!raw) return { games: 0, correct: 0, totalTime: 0, bestTime: null, lastName: null, lastPlayed: null };
    try {
      return JSON.parse(raw);
    } catch {
      return { games: 0, correct: 0, totalTime: 0, bestTime: null, lastName: null, lastPlayed: null };
    }
  }

  // Actualiza las estadísticas locales al finalizar una partida.
  function saveStoredStats({ score, total_time_secs, best_time_secs }) {
    const stats = getStoredStats();
    stats.games += 1;
    stats.correct += score;
    stats.totalTime += total_time_secs;
    stats.bestTime = stats.bestTime === null ? best_time_secs : Math.min(stats.bestTime, best_time_secs);
    stats.lastName = localStorage.getItem("trivia_player_name") || "Jugador";
    stats.lastPlayed = new Date().toISOString();
    localStorage.setItem("trivia_stats", JSON.stringify(stats));
  }

  function fmtTime(str) { return str; }

  // Muestra la pantalla final con el puntaje y guarda estadísticas locales.
  async function showFinal() {
    const data = await fetchFinal();
    const { score, total, pct, avg_time, best_time, total_time_secs, best_time_secs, slogan, sub } = data;
    const playerName = localStorage.getItem("trivia_player_name") || "Amigo";
    saveStoredStats({ score, total_time_secs, best_time_secs });

    document.getElementById("gameScreen").outerHTML = `
      <div class="final-screen" id="finalScreen">
        <div class="final-wrapper">
          <div class="final-left">
            <img src="${STATIC_ENTUSIASTA}" alt="nutria" />
            <p class="final-slogan">${slogan}</p>
            <p class="final-sub">${sub}</p>
          </div>
          <div class="final-right">
            <p class="final-title">¡${playerName}, juegas increíble!</p>
            <p class="final-score">${score}/${total}</p>
            <div class="final-progress-track">
              <div class="final-progress-bar" id="finalBar" style="width:0%"></div>
            </div>
            <div class="final-stats">
              <div class="stat-card">
                <span class="stat-label">Tiempo Promedio</span>
                <span class="stat-value">${avg_time}</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Tiempo Récord</span>
                <span class="stat-value">${best_time}</span>
              </div>
            </div>
            <p class="final-note">Tu resultado se guardó localmente para tus próximos juegos.</p>
            <div class="final-btns">
              <button class="btn-replay" onclick="location.href='/reiniciar'">volver a jugar ↺</button>
              <button class="btn-home"   onclick="location.href='/inicio'">inicio</button>
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
    window.location.href = "/inicio";
  };



  // Fondo animado de la pantalla de trivia.
  const canvas = document.getElementById("bgCanvas");
  const ctx    = canvas.getContext("2d");
  let W, H;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener("resize", resize);
  resize();

  const BG_TOP    = "#C2C395";
  const BG_MID    = "#DCD4C1";
  const BG_BOTTOM = "#EFD7CF";

  const PART_COLORS = ["#818263","#C2C395","#DDBAAE","#EFD7CF","#DCD4C1","#F6EAD4"];
  const SHAPES      = ["circle", "ring", "diamond", "cross", "triangle", "dot"];
  const shapes      = [];

  // Genera formas decorativas para el fondo animado.
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
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   BG_TOP);
    grad.addColorStop(0.5, BG_MID);
    grad.addColorStop(1,   BG_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    bT += 0.002;

    [[0.50,0.40,0.7,0.5,0.22,0.14,"rgba(194,195,149,0.32)",0.48],
     [0.82,0.16,1.0,0.8,0.10,0.08,"rgba(221,186,174,0.36)",0.28],
     [0.14,0.80,1.2,0.9,0.10,0.09,"rgba(239,215,207,0.38)",0.28],
     [0.84,0.78,0.6,1.1,0.08,0.08,"rgba(129,130,99,0.22)", 0.22]
    ].forEach(([bxf,byf,sx,sy,wx,wy,color,r], i) => {
      const fn  = i % 2 === 0 ? Math.sin : Math.cos;
      const fn2 = i % 2 === 0 ? Math.cos : Math.sin;
      const bx  = W * bxf + fn (bT * sx + i) * W * wx;
      const by  = H * byf + fn2(bT * sy)      * H * wy;
      const g   = ctx.createRadialGradient(bx, by, 0, bx, by, W * r);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(220,212,193,0)");
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
      case "circle":   ctx.beginPath(); ctx.arc(0,0,s.size*.45,0,Math.PI*2); ctx.fill(); break;
      case "dot":      ctx.beginPath(); ctx.arc(0,0,s.size*.18,0,Math.PI*2); ctx.fill(); break;
      case "ring":     ctx.beginPath(); ctx.arc(0,0,s.size*.42,0,Math.PI*2); ctx.lineWidth=2.5; ctx.stroke(); break;
      case "diamond":  ctx.beginPath(); ctx.moveTo(0,-s.size*.5); ctx.lineTo(s.size*.45,0); ctx.lineTo(0,s.size*.5); ctx.lineTo(-s.size*.45,0); ctx.closePath(); ctx.stroke(); break;
      case "cross":    { const t=s.size*.10,h=s.size*.42; ctx.fillRect(-t,-h,t*2,h*2); ctx.fillRect(-h,-t,h*2,t*2); break; }
      case "triangle": ctx.beginPath(); ctx.moveTo(0,-s.size*.45); ctx.lineTo(s.size*.42,s.size*.42); ctx.lineTo(-s.size*.42,s.size*.42); ctx.closePath(); ctx.stroke(); break;
    }
    ctx.restore();
  }

  function tick() {
    drawBg();
    shapes.forEach(s => {
      drawShape(s);
      s.x += s.speedX; s.y += s.speedY; s.rot += s.rotSpeed;
      if (s.y < -s.size*2)    s.y = H + s.size;
      if (s.x < -s.size*2)    s.x = W + s.size;
      if (s.x > W + s.size*2) s.x = -s.size;
    });
    requestAnimationFrame(tick);
  }
  tick();

  loadQuestion();

})();