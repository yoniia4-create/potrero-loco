# Potrero Loco — guía para Claude Code

Juego web de fútbol arcade 4 vs 4 (3 jugadores de campo + un arquero IA por equipo) con cabezones en un potrero argentino. La mecánica central son las **cartas de caos**: el equipo que recibe un gol elige 1 de 3 cartas que cambian las reglas (se acumulan hasta 4).

## Comandos
- `npm run dev` — servidor local con recarga.
- `npm run typecheck` — TypeScript estricto. Correrlo después de cada cambio.
- `npm run build` — typecheck + build a un único `dist/index.html` autocontenido.

## Arquitectura
- `src/config.ts` — todas las constantes ajustables. `PHYS` (física), `PLAY` (ritmo de juego, IA y arqueros), `HAZARD` (peligros de cartas). Tocá números acá, no en la lógica.
- Orden de `G.players`: vos (att), compañero mediocampo (sup), compañero defensor (def), rival atacante (att), rival mediocampo (sup), rival defensor (def), arquero celeste, arquero rojo. `teammatesOf()` devuelve todos los compañeros de campo (nunca el arquero); `mateOf()` devuelve el más cercano (se usa para pases y decisiones simples de la IA).
- `src/state.ts` — objeto global `G` con el estado del partido. Simulación, dibujo y UI lo leen.
- `src/cards.ts` — **las cartas son datos**. Cada una tiene `apply()` que modifica `Mods` (global) o `TeamMods` (por equipo). `recompute()` rehace todo desde cero con las cartas activas; `syncEntities()` crea/quita entidades (bananas, pelotas extra, colectivo, perro).
- `src/sim/` — simulación pura, sin DOM: `player.ts` (acciones), `ball.ts` (física, goles), `hazards.ts` (bananas, Colectivo 60, perro), `ai.ts`.
- `src/flow.ts` — fases del partido (`title → pick → play → goal → pick … → end`), `step()` a 60 Hz fijos.
- `src/render/` — dibujo en canvas. `background.ts` se pre-renderiza una vez; `draw.ts` dibuja cada frame ordenando entidades por `y`.
- `src/ui/` — HUD y overlays en DOM. `src/input.ts` — teclado y controles táctiles.

## Convenciones
- Coordenadas internas fijas 960×600; el canvas se escala con CSS.
- La simulación corre en frames (1 frame = 1/60 s). Duraciones en frames.
- Todo el arte se dibuja por código. Nada de imágenes externas por ahora.
- Estilo visual "figurita/sticker": contorno grueso (`outline()` en `render/draw.ts`, ~1.6px) en cada forma del cuerpo, colores planos bien saturados, cabezas grandes (`r = 13 * headOf(p)`) y un brillo plano en la frente. Cualquier elemento nuevo (cartas, hazards) debería sumar el mismo contorno para no desentonar.
- Textos de UI en español rioplatense, cortos y directos.
- Sonidos sintetizados en `audio.ts` (sin archivos).

## Cómo agregar una carta
1. Sumar el id a `CardId` en `types.ts`.
2. Agregar la definición en `CARDS` (`cards.ts`) con `d` y, si es de equipo, `dr`.
3. Si necesita un flag nuevo, agregarlo a `Mods`/`TeamMods` y a `defaultMods()`/`defaultTeamMods()`.
4. Si crea entidades, manejarlas en `syncEntities()`, actualizarlas en `flow.step()` y dibujarlas en `draw.ts`.
5. Si la IA debería reaccionar, ajustar `sim/ai.ts`.

## Balance
Para medir el ritmo sin jugar a mano: con `npm run dev`, en la consola del navegador está `__potrero` (G, step, newMatch, kickoff, choose). Poner a todos los `G.players[i].human = false` y llamar `step()` en un loop simula partidos IA contra IA. Referencia actual, formato 4v4 (sin cartas, IA vs IA): ~4,1 goles por partido, posesión mediana ~1 s. Al pasar de 2v2 a 4v4 los goles/partido bajaron levemente (más defensores) y los "knockdowns" por partido subieron (hay más jugadores pegándose), pero cada caída dura menos (`PHYS.punchStun` 42→30 cuadros, `PHYS.knockback` 6→4.5) para que se sienta menos frágil recibir una piña.

## Ideas pendientes
- Árbitro con personalidad (cobra cualquier cosa, se lo puede sobornar).
- Álbum de figuritas: desbloquear cartas jugando.
- Lluvia/barro, cancha que cambia en vivo.
- Build para Android con Capacitor.
