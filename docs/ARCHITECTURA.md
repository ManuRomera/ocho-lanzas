# Arquitectura 0.6

```text
OCHO LANZAS
├── scripts/
│   ├── compat/       # superficie V13/V14
│   ├── data/         # DataModels
│   ├── documents/    # lógica de documentos
│   ├── sheets/       # fichas
│   ├── ui/           # comportamiento transversal de escritorio
│   ├── workflows/    # tiradas, chat y reglas automatizadas
│   └── apps/         # bienvenida y aventura
├── templates/
├── styles/         # CSS modular sin capas históricas
├── assets/           # árbol canónico de recursos
└── packs/            # compendios LevelDB
```

## Principios

1. La lógica de reglas vive fuera de las plantillas.
2. Las diferencias entre Foundry 13 y 14 se concentran en `scripts/compat/`.
3. Posición/tamaño de ventanas son preferencias de cliente; estado de juego es world/document data.
4. Hover y botón derecho comparten `scripts/ui/context-info.mjs`.
5. El Tejido de Yomi es contenido opcional y el motor base no depende de que esté instalado en un world.
6. `assets/` es la única ruta canónica de recursos de la aventura.
7. Las migraciones usan una versión propia del sistema y no la versión de Foundry como sustituto.

## Arquitectura visual 0.6

```text
styles/
  ol-core.css
  ol-character.css
  ol-curse.css
  ol-npc.css
  ol-bakemono.css
  ol-items.css
  ol-dialogs.css
  ol-chat.css
  ol-welcome.css
  ol-yomi.css
```

No existe una hoja legacy cargada por debajo. Cada selector pertenece a una responsabilidad clara y los tamaños iniciales viven en las clases de aplicación, no en una sucesión de overrides históricos.
