# Lenshift

A single-page visual experiment in seeing through different prescriptions, built with Next.js, React, and a custom WebGL optical shader.

## Development

```sh
npm install
npm run dev
```

Open http://localhost:3000. `npm run build` creates a static export in `out/`; `npm run lint` checks the application.

## Experience

- Sphere from +6.00 to −10.00 D, with continuous spring interpolation.
- Three smoothly joined spatial depth regions that respond differently to myopia and hyperopia.
- Cylinder from 0.00 to −4.00 D with directional sampling and a rotating 0–180° axis.
- Movable glasses rendered in the shader, with sharp image sampling strictly inside each lens.
- Pointer- and keyboard-held 20/20 comparison, evening/night lighting, and reduced-motion support.
- URL-preserved sphere, cylinder, axis, mode, and lighting; native sharing with clipboard and manual-copy fallbacks.

The scene is an original generated image. A nearby readable cafe card is composited into the optical texture. The optical depth map is an artistic spatial approximation, not measured scene geometry. Sphere and cylinder effects do not model individual accommodation or retinal optics and are not diagnostic.

WebGL is required for optical effects. If unavailable, the original image remains visible with a compatibility notice. No account, database, or external image service is required.
