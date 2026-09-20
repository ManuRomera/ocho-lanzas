# Ocho Lanzas para Foundry VTT

Sistema **no oficial** para jugar *Ocho Lanzas* en Foundry VTT. El objetivo de esta implementación es que Foundry desaparezca lo máximo posible durante la partida: fichas legibles, información bajo demanda y automatización solo donde reduce trabajo real.

> Menos software visible, más Ocho Lanzas.

## Compatibilidad

La versión 0.5.0 mantiene **un único paquete** para Foundry VTT **13 y 14**. Las diferencias de API se encapsulan en `scripts/compat/foundry-compat.mjs`; no existen builds separados por versión.

> Importante: migrar un world desde Foundry 13 a Foundry 14 debe hacerse siguiendo el procedimiento y copia de seguridad normal de Foundry. La compatibilidad del sistema no convierte una migración de world de Foundry en reversible.

## Qué incluye

- Ficha de Agente centrada en la Maldición y en lo que se necesita durante el juego.
- Fichas diferenciadas para PNJ y Bakemono.
- Trasfondos, Orgullos y Onmyōji compactos durante el juego y editables cuando hace falta.
- Tirada de Riesgo con resumen previo exacto de dados.
- Tirada de Maldición y Purificación integradas en chat.
- Items reales de Foundry para equipo, armas, rituales y estados.
- Información contextual con **hover** y **botón derecho**.
- Memoria por usuario de posición y tamaño de las ventanas propias.
- Integración opcional de Dice So Nice para el dado Maldito.
- Creación de macros estables al arrastrar Actores o Items a la hotbar.
- Aventura integrada **El Tejido de Yomi**, desacoplada de los flujos normales del sistema.

## Instalación

Usa el manifest de la última release:

`https://github.com/ManuRomera/ocho-lanzas/releases/latest/download/system.json`

No se recomienda instalar directamente desde `main`.

## Uso básico

Al abrir por primera vez la versión 0.5 aparece la bienvenida de Ocho Lanzas. Desde ella puedes crear un Agente, PNJ o Bakemono y, si diriges la partida, preparar El Tejido de Yomi.

En la ficha del Agente:

- clic izquierdo ejecuta la acción principal;
- dejar el cursor sobre un rasgo u objeto muestra información breve;
- botón derecho fija esa información para poder leerla;
- doble clic sobre un Item abre su ficha;
- el GM dispone de las correcciones administrativas de Maldición;
- el jugador conserva Purificación cuando las reglas lo permiten.

## El Tejido de Yomi

El contenido de la aventura sigue distribuido con el sistema en esta versión, pero ya no gobierna la interfaz general. Tiene su acceso principal desde la bienvenida; la interfaz normal del sistema no se convierte en un panel de Yomi. La instalación es idempotente mediante identificadores estables (`tejidoSlug`) y el sistema migra las rutas antiguas de assets al árbol canónico `assets/`.

La arquitectura queda preparada para extraer la aventura a un módulo independiente sin que el motor base dependa de ella.

## API pública para macros

Las macros deben usar la API pública del sistema en lugar de copiar lógica interna:

```js
await game.ochoLanzas.roll();
await game.ochoLanzas.rollCurse();
await game.ochoLanzas.openDocument("Actor.xxxxx");
game.ochoLanzas.openWelcome();
game.ochoLanzas.openTejidoDeYomi();
```

Se puede pasar un Actor, su id o UUID a `roll` y `rollCurse`. Sin argumento se intenta usar el token controlado o el personaje asignado al usuario.

## Desarrollo y validación

`node tools/validate-release.mjs`

El workflow de GitHub Actions valida las rutas, manifiesto, plantillas y recursos de texto antes de crear una release versionada.

## Créditos y estado

Implementación y mantenimiento del sistema Foundry: **Manu Romera**.

Este repositorio es un proyecto **no oficial**. Consulta [DERECHOS.md](DERECHOS.md) para la separación entre código del proyecto y materiales de terceros.