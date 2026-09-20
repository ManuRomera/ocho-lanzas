# Changelog

## 0.6.0 — 2026-09-20

### Layout y escritorio
- Ficha de Agente rediseñada a una geometría horizontal de referencia 1060×780.
- Rasgos seleccionados integrados en la cabecera; el catálogo completo solo aparece en modo edición.
- Equipo vacío colapsa y las áreas narrativas parten de alturas útiles, sin reservas históricas.
- PNJ ajustado a 1080×700 con Notas como superficie principal y scroll interno controlado.
- Bakemono reorganizado en identidad + tríada narrativa + Notas + columna de Maldición.
- Item reducido a 700×500 y Bienvenida con altura automática.
- Mínimos de ventana específicos por tipo y recuperación segura al cambiar monitor/resolución.

### Maldición
- Nuevo indicador de firma con sello central y seis marcas rituales.
- Estados vacío, activo, permanente y Bakemono diferenciados por forma, trazo y relleno.
- Controles administrativos del GM relegados a una capa secundaria visible al hover/foco.
- Purificación explica por qué está desactivada y evita resoluciones sin reducción posible.

### Dirección artística
- Sustituido el sol rojo genérico por un lenguaje propio de sello/tinta.
- Añadidos ocho SVG originales para Maldición, Las Ocho Lanzas, divisores y Bakemono.
- Bakemono recibe contaminación gráfica discreta sin sacrificar legibilidad.
- Purificación adopta jade desaturado en lugar de un turquesa saturado.

### CSS y mantenibilidad
- Eliminadas por completo las capas `ocho-lanzas.css`, `ocho-lanzas-v5.css` y `tejido-de-yomi.css`.
- Nueva arquitectura modular: core, Agente, PNJ, Bakemono, Items, diálogos, chat, bienvenida y Yomi.
- Eliminados max-width, min-height y selectores de fases históricas que condicionaban el layout actual.
- Validador ampliado para impedir el regreso de CSS legacy, microtexto funcional inferior a 10.5 px y assets de UI ausentes.

### UX
- Clic izquierdo sobre chips fija información contextual; hover y botón derecho se mantienen.
- Textareas autogrow quedan limitados y pasan a scroll interno al superar su máximo.
- Chat de Maldición y Purificación compactado.
- Welcome adapta su grid automáticamente a dos o tres acciones.

## 0.5.0 — 2026-09-20

### Arquitectura
- Un único código base y un único paquete para Foundry VTT 13 y 14.
- Nueva capa `scripts/compat/` para centralizar las diferencias de API.
- Migraciones de world versionadas mediante `systemDataVersion`.
- API pública `game.ochoLanzas` para macros y automatizaciones.

### UX de escritorio
- Sistema común de información contextual: hover con retardo y botón derecho persistente.
- Memoria por usuario de posición y tamaño de fichas, Items, bienvenida y panel de Yomi.
- Recuperación automática de ventanas que quedarían fuera del viewport tras cambiar monitor o resolución.
- Acción para restablecer solo la disposición visual de ventanas.

### Agentes
- Ficha de juego más compacta: solo muestra normalmente los Trasfondos, Orgullos y Onmyōji seleccionados.
- Selector completo bajo “Editar rasgos”.
- Equipo basado en Items reales de Foundry.
- `equipmentText` se conserva temporalmente como “Equipo heredado”, sin borrar datos de mundos anteriores.
- Correcciones manuales de Maldición reservadas al GM; Purificación sigue disponible al jugador cuando corresponde.

### PNJ y Bakemono
- PNJ conserva una ficha ancha y orientada a dirección.
- Bakemono deja de reutilizar la ficha PNJ y obtiene ficha/modelo propios con Naturaleza, Manifestación, Propósito, Amenazas, Debilidades, Maldición y Notas.
- Migración conservadora de los antiguos campos narrativos de Bakemono.

### Tiradas
- Diálogo de Riesgo simplificado y sin estilos inline.
- Una única fuente mecánica blanca y una única fuente Maldita, eliminando la ambigüedad visual de checkboxes acumulables.
- Vista previa de los dados antes de lanzar.
- El modo Maldición oculta las opciones que no le pertenecen.
- Purificación simplificada con visualización antes/después y precio obligatorio.

### El Tejido de Yomi
- Eliminada la sobreexposición de botones en directorios y ajustes.
- Acceso principal desde la bienvenida; la paleta de escena solo añade una entrada discreta de Ocho Lanzas para GM.
- Un único HTML canónico en `assets/adventures/`.
- Eliminada la dependencia de Google Fonts en tiempo de ejecución.
- Rutas de assets migradas desde el árbol duplicado histórico al árbol canónico `assets/`.
- Instalación reforzada para localizar contenido por flags estables antes que por nombre.
- Eliminada la acción de “reiniciar estado local” que no correspondía al estado real de la aventura.

### Distribución
- Autor visible normalizado a Manu Romera.
- README, changelog, derechos y documentación de QA.
- Manifest preparado para releases versionadas.
- Compendios declarados mediante sus directorios LevelDB; retiradas del manifest las variantes `.db` heredadas.
- GitHub Actions valida cada PR y, al fusionar una versión nueva en `main`, crea automáticamente el tag/release correspondiente con `ocho-lanzas.zip` y `system.json`.

### Macros
- Arrastrar un Actor a la hotbar crea una macro estable de tirada mediante la API pública del sistema.
- Arrastrar un Item crea una macro por UUID para abrirlo, evitando copiar lógica interna.