# Changelog

## 1.1.3

- **Legibilidad y modo oscuro de la Mesa a pantalla completa.** Sin clima, el fondo era la mesa lacada oscura: el texto oscuro no se leía, y en modo oscuro ese arte se invertía y deslumbraba. Ahora el fondo es siempre un arte claro con su propia base y velo, sin mezclarse con la escena de Foundry: el texto se lee sea cual sea la escena activa.
- En modo oscuro la base es tinta y el arte se invierte y se atenúa: sin blancos, pensado para quien tiene sensibilidad a la luz.

## 1.1.2

- La Mesa a pantalla completa ya no pone una zona rellena detrás del rollo: era una mancha clara u oscura según la escena. En su lugar hay un círculo de tinta (ensō) muy atenuado y sin relleno, y el fondo se ve entero detrás del texto. En modo oscuro y en el cine del Gran Final el aro se invierte; con alto contraste o menos efectos desaparece.

## 1.1.1

- **La Mesa a pantalla completa se integra mejor con el fondo.** El rollo central ya no es una hoja con marco: el texto se apoya directamente en el fondo con un halo suave del color del papel (o de la tinta en modo oscuro) y una zona de calma difuminada, sin bordes. Las cartas, los botones y los campos siguen sólidos.
- Los jugadores y la cabecera son tarjetas translúcidas con desenfoque; los jugadores miden lo que su contenido y el rollo tiene un ancho de lectura cómodo.
- El modo oscuro muestra más el fondo; el texto secundario no pierde opacidad sobre el dibujo. Con alto contraste o menos efectos, el centro vuelve a ser una hoja casi opaca.

## 1.1.0

- **La Mesa a pantalla completa** (por defecto): el panel de la Mesa del Duelo deja de ser una ventana y se integra en la escena. Los climas, el claro y el Gran Final pasan a ser el fondo de toda la pantalla, y los controles, la barra lateral y las macros de Foundry siguen encima y reciben los clics.
- Se puede **ocultar** para ver solo la escena (botón-ojo de la cabecera, atajo `Alt + U`, herramienta de la barra de escena) y **recuperar** con una pastilla fija. Se recuerda por persona.
- Nuevo ajuste personal **La Mesa**: a pantalla completa o en ventana (la ventana de siempre, con su memoria de posición y tamaño).
- El Gran Final a pantalla completa ocupa toda la pantalla en blanco y negro con barras de cine.
- La escena de bienvenida se amplía lo justo para cubrir la pantalla sin bandas.
- **Corregir a mano**: todo lo que los automatismos consumen o reparten se puede subir o bajar a mano para arreglar errores en partida. Un botón de llave inglesa en la cabecera pone − y + junto a las Ventajas, el Odio y las Cicatrices de cada jugador y abre un panel con la reserva de marcadores (antes de tirar), los temas clave (marcar o devolver), los personajes clave (asignar o liberar), las virtudes (mazo o descarte) y los capítulos previstos. Lo pueden hacer los dos jugadores y el Director; queda anotado como «Corrección manual» y nunca baja de cero. Si se corrigen las ventajas en pleno Gran Final, el golpe mortal se recoloca solo.
- Capturas nuevas en el README y en la página del repositorio.

## 1.0.1

- **Modo oscuro** en Accesibilidad: todas las ventanas del sistema pasan a tinta, también el papel, los fondos de la Mesa, las cartas, los retratos claros y la Crónica. Pensado para quien los colores claros le hacen daño en los ojos.
- Botón de **accesibilidad** también en la ficha del Samurái y en la Crónica (ya estaba en la Mesa).

## 1.0.0

Primera versión. Ambientación **Bushido** completa.

- **Mesa del Duelo**: ventana principal con dos asientos simétricos (sumi contra washi) y, en el centro, el rollo de cada fase. El estado vive en un diario compartido con propiedad de propietario para los dos asientos: se puede jugar **sin Director conectado**.
- **Partida completa**: escena inicial (nombres, clan, emblema, cuatro declaraciones alternadas y virtud de la historia) → capítulos de seis pasos (virtud, tema clave, personaje clave, reserva de siete marcadores, clímax con dados y consonancia, cierre) → lidiar con el odio (entregarse o escapar) → Gran Final (intercambios, apuesta ciega, golpe mortal, veredicto) → epílogo.
- **Reglas del libro** implementadas en un motor puro con 38 pruebas, entre ellas los ejemplos 5 y 7–13 del libro. Criterios donde el libro es ambiguo: un empate en el golpe mortal falla al atacante; el tope de siete dados incluye la consonancia; las ventajas apostadas a ciegas se gastan; si empatan cicatrices y odio, tablas.
- **Crónica** autogenerada con toda la historia (virtudes, temas, notas de decisiones, ganadores, odio, duelo y epílogo): se copia, se descarga como página limpia o se guarda en Diarios.
- **Ficha de Samurái** (opcional) con clan y emblema; 12 emblemas de clan (kamon) en SVG.
- **Atmósfera**: siete climas con fondo propio, el Gran Final en blanco y negro con barras de cine, sonido sintetizado (ambientes, efectos y un koto muy esporádico) con volúmenes independientes por usuario.
- **Dados** de Foundry, animados con Dice So Nice si está instalado.
- **Accesibilidad**: tamaño de texto, modo lectura, alto contraste, tipografía sencilla, espaciado, botones grandes, reducir movimiento y efectos; ventanas con memoria de posición y tamaño. **Seguridad en mesa**: Pausa, Velo y Tarjeta X anónimos.
- **Árbitro** (Director): corregir contadores, saltar pasos, cambiar el clima, nueva partida.
- Arranque aislado por fases con **diagnóstico** copiable. Compatible con Foundry 13 y 14. Español e inglés.
- Las ambientaciones son datos: otros módulos pueden registrar la suya con `game.mrUnMomentoUnico.registerSetting(...)`.
