import os
import secrets
from flask import Flask, render_template, jsonify, session, request, redirect, url_for

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# ─── Preguntas (única fuente de verdad) ───────────────────────────────────────
QUESTIONS = [
    {
        "q": "¿Qué país tiene la mayor cantidad de islas en el mundo?",
        "opts": ["Filipinas", "Suecia", "Indonesia", "Canadá"],
        "correct": 1
    },
    {
        "q": "¿Cuál es el océano más grande del mundo?",
        "opts": ["Atlántico", "Índico", "Ártico", "Pacífico"],
        "correct": 3
    },
    {
        "q": "¿Cuántos huesos tiene el cuerpo humano adulto?",
        "opts": ["206", "215", "198", "230"],
        "correct": 0
    },
    {
        "q": "¿En qué año llegó el hombre a la Luna?",
        "opts": ["1965", "1971", "1969", "1972"],
        "correct": 2
    },
    {
        "q": "¿Cuál es el país más grande del mundo?",
        "opts": ["China", "Canadá", "Brasil", "Rusia"],
        "correct": 3
    },
    {
        "q": "¿Qué planeta es conocido como el planeta rojo?",
        "opts": ["Venus", "Marte", "Júpiter", "Saturno"],
        "correct": 1
    },
    {
        "q": "¿Cuál es el animal terrestre más rápido?",
        "opts": ["León", "Guepardo", "Antílope", "Caballo"],
        "correct": 1
    },
    {
        "q": "¿Cuántos lados tiene un hexágono?",
        "opts": ["5", "7", "6", "8"],
        "correct": 2
    },
    {
        "q": "¿Cuál es la capital de Japón?",
        "opts": ["Osaka", "Kioto", "Hiroshima", "Tokio"],
        "correct": 3
    },
    {
        "q": "¿Cuál es el elemento más abundante en la corteza terrestre?",
        "opts": ["Hierro", "Oxígeno", "Silicio", "Aluminio"],
        "correct": 1
    }
]

TOTAL = len(QUESTIONS)
TIMER_SECS = 15


def init_session():
    """Inicializa la sesión de juego si no existe."""
    if "game" not in session:
        session["game"] = {
            "current_q": 0,
            "score": 0,
            "total_time": 0,
            "best_time": None,
            "finished": False,
            "answered": False,
        }
        session.modified = True


# ─── Rutas de páginas ──────────────────────────────────────────────────────────

@app.route("/")
def index():
    return redirect(url_for("inicio"))


@app.route("/inicio")
def inicio():
    return render_template("inicio.html")


@app.route("/trivia")
def trivia():
    init_session()
    return render_template("trivia.html")


@app.route("/reiniciar")
def reiniciar():
    session.pop("game", None)
    return redirect(url_for("trivia"))


# ─── API REST ──────────────────────────────────────────────────────────────────

@app.route("/api/pregunta")
def api_pregunta():
    """Devuelve la pregunta actual (sin revelar la correcta)."""
    init_session()
    g = session["game"]

    if g["finished"]:
        return jsonify({"error": "game_finished"}), 400

    idx = g["current_q"]
    if idx >= TOTAL:
        return jsonify({"error": "no_more_questions"}), 400

    q = QUESTIONS[idx]
    return jsonify({
        "index": idx,
        "total": TOTAL,
        "question": q["q"],
        "options": q["opts"],
        "timer": TIMER_SECS,
        "score": g["score"],
        "answered": g["answered"],
    })


@app.route("/api/responder", methods=["POST"])
def api_responder():
    """Valida la respuesta enviada por el jugador."""
    init_session()
    g = session["game"]

    if g["finished"]:
        return jsonify({"error": "game_finished"}), 400

    if g["answered"]:
        return jsonify({"error": "already_answered"}), 400

    data = request.get_json(silent=True) or {}
    idx_seleccionado = data.get("answer")
    time_used = data.get("time_used", TIMER_SECS)
    time_out = data.get("time_out", False)

    # Validar índice
    if not time_out:
        if idx_seleccionado is None or not isinstance(idx_seleccionado, int):
            return jsonify({"error": "invalid_answer"}), 400
        if idx_seleccionado not in range(4):
            return jsonify({"error": "invalid_answer"}), 400

    current_idx = g["current_q"]
    correct_idx = QUESTIONS[current_idx]["correct"]
    correct_text = QUESTIONS[current_idx]["opts"][correct_idx]

    is_correct = (not time_out) and (idx_seleccionado == correct_idx)

    # Actualizar sesión
    if is_correct:
        g["score"] += 1

    secs_used = min(int(time_used), TIMER_SECS)
    g["total_time"] += secs_used
    if g["best_time"] is None or secs_used < g["best_time"]:
        g["best_time"] = secs_used

    g["answered"] = True
    session.modified = True

    result_text = "¡correcto!" if is_correct else ("¡tiempo!" if time_out else "¡equivocado!")

    return jsonify({
        "correct": is_correct,
        "time_out": time_out,
        "correct_index": correct_idx,
        "correct_text": correct_text,
        "result_text": result_text,
        "score": g["score"],
        "question_num": current_idx + 1,
        "total": TOTAL,
    })


@app.route("/api/siguiente", methods=["POST"])
def api_siguiente():
    """Avanza a la siguiente pregunta."""
    init_session()
    g = session["game"]

    if g["finished"]:
        return jsonify({"error": "game_finished"}), 400

    g["current_q"] += 1
    g["answered"] = False

    if g["current_q"] >= TOTAL:
        g["finished"] = True
        session.modified = True
        return jsonify({"finished": True})

    session.modified = True
    return jsonify({"finished": False, "next_index": g["current_q"]})


@app.route("/api/final")
def api_final():
    """Devuelve los resultados finales."""
    init_session()
    g = session["game"]

    score = g["score"]
    total_time = g["total_time"]
    best_time = g["best_time"] or 0
    avg_secs = round(total_time / TOTAL) if TOTAL > 0 else 0
    pct = round((score / TOTAL) * 100)

    if score == TOTAL:
        slogan = "¡perfecto!"
        sub = "¡Eres un genio de la trivia!"
    elif score < 4:
        slogan = "¡sigue intentando!"
        sub = "La práctica hace al maestro"
    else:
        slogan = "¡bien hecho!"
        sub = "Estás mejorando cada día"

    def fmt_time(secs):
        m = secs // 60
        s = secs % 60
        return f"{m}:{str(s).zfill(2)}"

    return jsonify({
        "score": score,
        "total": TOTAL,
        "pct": pct,
        "avg_time": fmt_time(avg_secs),
        "best_time": fmt_time(best_time),
        "slogan": slogan,
        "sub": sub,
    })


# ─── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True)
