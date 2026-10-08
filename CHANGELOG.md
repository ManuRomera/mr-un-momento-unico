# Changelog

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
