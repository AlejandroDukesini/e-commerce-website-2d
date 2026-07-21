# 📦 resources/ — Depósito de assets dinámicos

Esta carpeta está **intencionalmente vacía**. Es el punto de inyección de
imágenes, texturas y modelos para las capas interactivas (canvas / scrollytelling
/ hover-texture / mini-juego).

## Cómo funciona el desacoplamiento

Nada del código importa archivos de aquí de forma rígida. Todo pasa por hooks:

| Hook                     | Rol                                                        |
|--------------------------|-----------------------------------------------------------|
| `useTextureLoader(src)`  | Carga una textura; si falta, devuelve `missing: true` y el canvas dibuja un **fallback procedural** en vez de romperse. |
| `useResourceManifest()`  | `import.meta.glob` sobre `resources/**`; devuelve `{}` si está vacía. |
| `useAnimationDriver()`   | Motor rAF intercambiable (pausa en pestaña oculta, respeta reduced-motion). |

## Para inyectar tus assets

Sugerencia de estructura (crea las subcarpetas que necesites):

```
resources/
├── textures/     # car-body.webp, road-noise.webp, hover-*.webp ...
├── vehicles/     # fotos reales del catálogo (id-1.webp, ...)
└── models/       # glTF/glb si más adelante integras Three.js
```

Al colocar un archivo aquí, pásalo por el hook correspondiente. **No hay que
tocar componentes** para que la app deje de usar el placeholder y use tu asset real.
