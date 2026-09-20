# Changelog

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