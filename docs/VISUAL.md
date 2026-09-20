# Dirección visual y assets — Ocho Lanzas 0.6

## Lenguaje visual
La interfaz se plantea como un **archivo ritual de Las Ocho Lanzas**: marfil, papel ligero, tinta carbón, rojo hanko oscuro, oro apagado y jade desaturado únicamente para Purificación. La decoración nunca debe ocupar espacio que el contenido necesite.

## Maldición
El indicador utiliza un sello central original y seis marcas rituales. Los estados no dependen solo del color:

- **No alcanzado**: contorno irregular vacío.
- **Activo**: impresión roja rellena.
- **Permanente / mínimo**: sello rojo atravesado por doble trazo oscuro.
- **Nivel 6 / Bakemono**: marca negra quebrada con cruce claro.

## Assets originales
Todos estos recursos fueron creados específicamente para esta implementación y no reproducen iconografía religiosa real ni arte de terceros.

```text
assets/ui/curse/
  curse-seal-center.svg
  curse-pip-empty.svg
  curse-pip-active.svg
  curse-pip-permanent.svg
  curse-pip-bakemono.svg

assets/ui/seals/
  seal-ocho-lanzas.svg

assets/ui/dividers/
  divider-ink-thread.svg

assets/ui/bakemono/
  bakemono-mark.svg
```

## Uso
- `curse-seal-center.svg`: centro del indicador y motivo secundario.
- `curse-pip-*.svg`: estados dinámicos del nivel de Maldición.
- `seal-ocho-lanzas.svg`: bienvenida y marca institucional.
- `divider-ink-thread.svg`: transición discreta al modo de edición de rasgos.
- `bakemono-mark.svg`: contaminación gráfica de la ficha Bakemono.

Los SVG están pensados para escalas pequeñas/medias y no incluyen texto.
