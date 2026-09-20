# Arquitectura 0.5

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
├── styles/
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