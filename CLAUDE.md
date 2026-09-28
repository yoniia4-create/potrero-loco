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

## Combate y movimiento
- No hay piña ni súper tiro. `K` es **barrida** (`doSlide`/`checkSlide` en `sim/player.ts`): solo desposee a quien tiene la pelota, nunca a un rival cualquiera. Si no conecta con nadie durante `PLAY.slideDuration`, el que se tiró queda en el piso (`PLAY.slideMissStun`): no conviene spamearla. Con la pelota en mano, `K` sigue siendo pase (`doPass`).
- `L` (mantener) es **correr**: multiplica la velocidad por `PLAY.sprintMult` mientras `Player.stamina` > 0. El aguante se gasta corriendo y se recupera solo al soltar (`PLAY.staminaDrain`/`staminaRegen`, por equipo vía `TeamMods.staminaRegen`); al llegar a 0 queda bloqueado (`staminaLocked`) hasta recuperar `PLAY.staminaRecoverThreshold`. La IA también usa `inp.sprint` (ver `sim/ai.ts`).
- `Input.sprint` es de nivel (true mientras se mantiene apretado), a diferencia de `kick`/`slide` que son pulsos de un frame — ver `input.ts`.
- La IA solo corre a fondo (`inp.sprint = true`) cuando va a buscar una pelota suelta, o cuando el que lleva la pelota se siente "cercado" (rival a menos de 90px). A propósito NO corre a fondo cuando ya está persiguiendo al rival que tiene la pelota (`sim/ai.ts`, rama `chase`): eso era justo lo que hacía sentir invadido al que ataca. Igual lo puede alcanzar caminando/trotando y tirarle una barrida si se arrima lo suficiente.

## Balance
Para medir el ritmo sin jugar a mano: con `npm run dev`, en la consola del navegador está `__potrero` (G, step, newMatch, kickoff, choose). Poner a todos los `G.players[i].human = false` y llamar `step()` en un loop simula partidos IA contra IA. Referencia actual, formato 4v4 con barrida + correr (sin cartas, IA vs IA, 30 partidos): ~2 goles por partido, posesión mediana ~1,4 s (antes de la barrida era ~1 s), ~20 caídas por partido (antes ~42 con la piña), barrida acierta casi siempre que se intenta (~97%) pero se intenta poco (~18 veces por partido) gracias a `aiSlideChance` bajo. Los goles/partido bajaron bastante respecto a la piña (~4,1); es intencional: menos robos de pelota al voleo, partidos más pausados. Remedir tras tocar `PLAY.aiSlideChance`/`aiSlideCooldown`/`possessionShield` o el aguante.

## Ideas pendientes
- Árbitro con personalidad (cobra cualquier cosa, se lo puede sobornar).
- Álbum de figuritas: desbloquear cartas jugando.
- Lluvia/barro, cancha que cambia en vivo.
- Build para Android con Capacitor.
