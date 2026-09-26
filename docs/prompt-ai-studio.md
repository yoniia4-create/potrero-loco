# Prompt para Google AI Studio (modo Build) — Potrero Loco v0.2

Pegá todo lo que está debajo de la línea en AI Studio → Build. Si el resultado sale incompleto, usá los prompts de seguimiento del final, de a uno.

---

Construí un juego web llamado **Potrero Loco**: fútbol arcade 2 vs 2 con personajes cabezones, en una cancha de tierra de barrio argentino (un "potrero"), vista cenital con un poco de perspectiva. Todo el arte se dibuja por código en un `<canvas>` (sin imágenes externas). Textos de la interfaz en español rioplatense.

## Tecnología
- Un solo canvas de resolución interna 960×600, escalado para entrar en la pantalla sin deformarse.
- Loop con paso fijo de 60 actualizaciones por segundo, separado del dibujo.
- Organizá el código en módulos: configuración, cartas (como datos), jugadores, pelota, IA, dibujo, interfaz, sonido.
- Tiene que andar en compu (teclado) y en celular (controles táctiles).

## Cancha y estética
- Cancha de tierra color ocre con manchas y piedritas, pasto en los bordes, líneas de cal irregulares como pintadas a mano (línea media, círculo central, áreas).
- Arriba, una pared de ladrillos con un cartel pintado que dice "PROHIBIDO JUGAR A LA PELOTA" y un par de grafitis.
- Arcos a la izquierda y a la derecha con red. Alto de arco: la pelota entra si pasa la línea dentro de los postes y con altura menor a 46.
- Paredes invisibles en todo el perímetro: la pelota rebota (menos en la boca del arco).
- Tipografía de títulos: "Bungee" de Google Fonts. Cuerpo: "Rubik".
- Paleta: tierra #c48a52, fondo #24190f, cal #f3ebdd, equipo celeste #6ec6ff (camiseta a rayas blancas), equipo rojo #e8433f, amarillo acento #ffd23f, tinta #1b1712.

## Personajes
- 4 jugadores: vos + un compañero IA (equipo celeste, ataca hacia la derecha) contra 2 IA (equipo rojo, un atacante y un defensor).
- Cabezones: cabeza grande (radio ~11) sobre cuerpo chiquito, piernas que se mueven al correr, ojos que miran hacia donde van, sombra en el piso. Los rojos tienen cejas enojadas.
- Tu jugador tiene un triángulo amarillo arriba de la cabeza.
- Cuando alguien está volteado, se dibuja acostado con estrellitas girando.

## Controles
- Mover: flechas o WASD. En celular: joystick virtual a la izquierda.
- Patear (J o Espacio): patea en la dirección en que mirás. Si no tenés la pelota pero está cerca, le pegás igual (volea).
- Piña (K): pequeño dash hacia adelante; si toca a un rival, lo voltea ~1 segundo y le saca la pelota. Si tenés la pelota, K hace un pase a tu compañero.
- Súper tiro (L): solo con la barra de súper llena.
- En celular: botones "Patear", "Piña / pase" y "Súper" a la derecha.
- P o Esc: pausa. M: silenciar.

## Pelota
- Tiene altura (z) con gravedad y rebote, y se dibuja con sombra.
- Conducción: si un jugador la toca y no tiene otra, la lleva pegada adelante del pie.
- Rozamiento en el piso ~0.972 por frame.

## Barra de súper
- Se carga sola despacio, más rápido al patear y mucho más al conectar piñas.
- El súper tiro sale **al azar** entre tres tipos, con cartel grande en pantalla:
  - **Cañonazo**: recto y muy rápido; voltea a los rivales que atraviesa.
  - **Tiro serpiente**: avanza en zigzag; voltea rivales.
  - **Meteorito**: sube muy alto y al caer genera una onda que voltea a los rivales cerca.
- La pelota con súper deja una estela de color.

## IA
- Con pelota: va hacia el arco rival esquivando rivales que tenga adelante; patea a unos 230 px del arco apuntando a un punto al azar dentro del arco; usa el súper si lo tiene cargado y está a menos de ~440 px; a veces pasa.
- Sin pelota: el más cercano de cada equipo va a buscarla; el otro se posiciona (defensa o desmarque para recibir pase). Si un rival con pelota está cerca, le tira una piña de vez en cuando.
- La IA corre un poco más lento que vos (93%).

## La mecánica principal: cartas de caos
- **Antes de arrancar**, elegís 1 de 3 cartas al azar (solo de las que afectan a todos).
- **Cada vez que un equipo recibe un gol, ese equipo elige 1 de 3 cartas.** Si sos vos, elegís con clic o teclas 1-2-3. Si es la IA, se muestra qué eligió.
- Las cartas se acumulan: máximo 4 activas y la más vieja se va. No se ofrecen cartas repetidas.
- Diseño visual de las cartas: como figuritas de álbum, fondo papel #f6e7c8, borde grueso negro, sombra dura, levemente inclinadas, franja superior con la etiqueta ("Para todos", "Para tu equipo", "Para el rival").
- Mostrá las cartas activas como chips arriba de la cancha.

Cartas que afectan a todos:
1. **Pelota de Hielo**: la pelota casi no frena.
2. **Gravedad Lunar**: los tiros suben mucho y caen lento.
3. **Lluvia de Bananas**: 9 cáscaras en la cancha; si las pisás te resbalás y caés. Reaparecen en otro lugar a los 4 segundos.
4. **Multipelota**: entran 2 pelotas más.
5. **Pelota Bomba**: cada 8 segundos la pelota explota y voltea a todos en un radio de ~115 px (con cuenta regresiva 3-2-1 sobre la pelota).
6. **Viento Pampero**: un viento en dirección al azar empuja la pelota (mostrá rayitas de viento).
7. **Colectivo 60**: cada ~10 segundos cruza un colectivo de lado a lado por un carril al azar. 1,5 segundos antes suena una bocina y se marca el carril en el piso. Voltea a quien atropelle y hace rebotar la pelota.
8. **Perro Callejero**: entra un perro que persigue la pelota; si la agarra, sale corriendo con ella ~3 segundos y la suelta. Si le pegás una piña, la suelta enseguida.

Cartas de equipo (las aplica el equipo que la elige):
9. **Cabezón XL**: tu equipo con cabezas casi del doble y piñas de más alcance.
10. **Arco Gigante**: el arco rival se agranda mucho.
11. **Turbo**: tu equipo corre 35% más rápido.
12. **Arquero Fantasma**: un fantasmita patrulla tu arco subiendo y bajando y rechaza tiros.
13. **Súper Barato**: tu equipo carga el súper al doble.

## Partido y pantallas
- Duración: 2 minutos. Marcador y reloj arriba, con la barra de súper de tu jugador (cuando está llena dice "¡Súper listo!").
- Pantalla de título con el nombre, una línea de descripción, las reglas en 3 puntos, los controles y el botón "Jugar".
- Gol: cartel "¡GOL!" grande, sacudida de pantalla y papelitos; después la elección de carta y saque del medio.
- Final: resultado y mensaje ("¡Ganaste el potrero!", "Perdiste. Revancha y listo." o "Empate. Nadie se va a casa.") con botón "Revancha".
- Pausa con botón y tecla, y botón para silenciar.
- Sonidos sintetizados con Web Audio (sin archivos): patada, piña, súper, explosión, gol, carta, resbalón, bocina.
- Respetá `prefers-reduced-motion` (sin sacudidas de pantalla).

---

## Prompts de seguimiento (usalos de a uno si hace falta)

1. "La IA a veces se queda trabada contra las paredes o las dos van a la misma pelota. Hacé que solo el más cercano de cada equipo persiga y el otro se posicione."
2. "Agregá el Colectivo 60 y el Perro Callejero si no están, respetando lo que dice la especificación."
3. "Probá una partida entera en celular: el joystick y los tres botones tienen que entrar abajo de la cancha a 400 px de ancho."
4. "Revisá que las cartas se acumulen hasta 4 y que la más vieja se quite, deshaciendo su efecto (por ejemplo, que desaparezcan las bananas o las pelotas extra)."

## Cómo comparar con la versión de Claude Code

Con el mismo punto de partida, fijate en:
- **Primer resultado**: qué tan completo sale del primer prompt.
- **Cambios**: pedile a los dos la misma carta nueva (por ejemplo "Tormenta: la cancha se embarra y todos corren al 70%") y fijate cuál la agrega sin romper nada.
- **Código**: si lo podés leer y seguir vos, o si se vuelve un solo archivo enorme.
- **Camino a producto**: qué tan fácil es llevarlo a un repo, a Android o a una tienda.
