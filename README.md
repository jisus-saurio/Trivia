# Trivia Party

**Trivia Party** es una mini aplicación web de trivia creada con Flask y una interfaz animada en HTML/CSS/JavaScript.

## 🌟 Qué incluye

- Pantalla de inicio con fondo animado y estilo llamativo.
- Página de registro para introducir tu nombre antes de jugar.
- Trivia con temporizador, preguntas y respuestas dinámicas.
- Resultados finales con puntaje, tiempos.
- Estadísticas guardadas en `localStorage` para ver tus avances.

## 🧩 Estructura del proyecto

- `app.py` - servidor Flask con rutas y API REST para el juego.
- `templates/` - vistas HTML: `inicio.html`, `registro.html`, `trivia.html`.
- `static/CSS/` - estilos de interfaz.
- `static/js/` - lógica de interacción, animaciones y juego.
- `static/imagenes/` - recursos gráficos usados en la app.

## 🚀 Cómo iniciar el proyecto

1. Abre una terminal en la carpeta del proyecto:
   ```powershell
   cd C:\Users\stanl\Desktop\Trivia\trivia-juego
   ```

2. Instala Flask si no lo tienes:
   ```powershell
   python -m pip install flask
   ```

3. Ejecuta la aplicación:
   ```powershell
   python app.py
   ```

## 🎮 Cómo jugar

1. Pulsa `jugar` en la pantalla de inicio.
2. Escribe tu nombre en la página de registro.
3. Responde las preguntas antes de que se acabe el tiempo.
4. Al finalizar verás tu puntaje y tus tiempos.
5. El juego guarda tus estadísticas localmente para futuras partidas.
