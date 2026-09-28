# Potrero Loco

Fútbol cabezón de potrero, 4 vs 4. El que va perdiendo elige el caos.

## Jugar en local
```bash
npm install
npm run dev
```
Abrí la dirección que muestra la terminal.

## Controles
| Acción | Teclado | Celular |
|---|---|---|
| Mover | Flechas / WASD | Joystick |
| Patear | J o Espacio | Patear |
| Barrida (o pase con pelota) | K | Barrida / pase |
| Correr (mantener) | L | Correr |
| Pausa | P o Esc | Botón Pausa |
| Silenciar | M | Botón Sonido |

## Build
```bash
npm run build
```
Genera `dist/index.html`, un solo archivo que se puede abrir directo o subir a itch.io.

## Seguir desarrollando con Claude Code
Abrí la carpeta con Claude Code; `CLAUDE.md` explica la arquitectura y cómo agregar cartas. La especificación equivalente para AI Studio está en `docs/prompt-ai-studio.md`.

## Publicación automática
Cada push a `main` compila el juego y lo publica en GitHub Pages (`.github/workflows/deploy.yml`).
La dirección queda en `https://<usuario>.github.io/<repo>/`.
