# QA manual — Ocho Lanzas 0.6

La validación automática no sustituye una prueba dentro de Foundry. Antes de considerar una release verificada se debe recorrer el mismo paquete en V13 y V14.

## Matriz visual
Probar, como mínimo, en:
- 1920×1080 (escenario principal).
- 2560×1440 (confirmar que el contenido usa el ancho añadido).
- Ventanas reducidas hasta su mínimo permitido.
- Agente vacío, con muchos Items, sin Onmyōji y con varios Onmyōji.
- PNJ con pocas notas y con notas largas.
- Bakemono completo.
- Item simple y arma.
- Bienvenida GM y jugador.

## Criterios visuales
1. Agente normal: objetivo aproximado 1060×780, casi completo sin scroll inicial significativo.
2. PNJ: identidad, retrato, notas y Maldición visibles al abrir.
3. Bakemono: Naturaleza, Manifestación, Propósito, Amenazas, Debilidades, Notas y Maldición visibles sin celda vacía accidental.
4. Maldición: cuatro estados distinguibles por forma/borde/símbolo, no solo por color.
5. Sin cajas vacías de altura fija ni grandes márgenes interiores por max-width.
6. Texto funcional nunca por debajo de 10.5px.
7. Revisar hover, foco, clic izquierdo en chips, botón derecho y Escape.
8. Con prefers-reduced-motion no debe haber animaciones significativas.

## Flujo de Agente
1. Crear Agente y comprobar bienvenida.
2. Seleccionar Trasfondo, Orgullo y Onmyōji; cerrar edición y confirmar vista compacta en cabecera.
3. Comprobar mínimo de Maldición tras Onmyōji.
4. Añadir Item, abrirlo con doble clic, arrastrarlo y eliminarlo con confirmación.
5. Arrastrar Actor/Item a hotbar y comprobar la macro generada.
6. Hover, clic izquierdo y botón derecho sobre rasgos; hover/botón derecho sobre Items.
7. Tirada base, con fuente blanca, con Maldito y modo Maldición.
8. Confirmar preview y tarjetas de chat compactas.
9. Purificación: requisito 4+, límite mínimo, consecuencia y una vez por escena.

## Ventanas
1. Mover/redimensionar cada ficha y aplicación propia.
2. Cerrar y reabrir; confirmar geometría.
3. Cambiar entre 2560×1440 y 1920×1080; comprobar clamp dentro del viewport.
4. Confirmar mínimos: Agente/PNJ 850, Bakemono 900, Item 540, Welcome 630.
5. Restablecer disposición y confirmar que no se modifica ningún dato del world.

## GM
1. Crear PNJ y Bakemono; confirmar fichas diferenciadas.
2. Confirmar que los controles administrativos de Maldición son secundarios y solo GM.
3. Preparar Yomi dos veces y confirmar ausencia de duplicados.
4. Confirmar que la toolbar Yomi es compacta y el iframe ocupa el resto de la ventana.

## Compatibilidad
Ejecutar exactamente el mismo ZIP en Foundry VTT 13 y 14 y comparar consola, fichas, Items, tiradas, chat, drag/drop, compendios, Yomi y audio.
