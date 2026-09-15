# Lenshift

A full-screen vision simulator with a cinematic, interactive optical introduction, built with Next.js, React, and a custom WebGL shader. A refractive glass portal follows the pointer, surrounded by moving orbital rings and staggered typography. Entering the experience expands the portal into the working scene, where compact prescription controls float over the photograph. Shared prescription links open directly in the simulator.

## Development

```sh
npm install
npm run dev
```

Open http://localhost:3000. `npm run build` creates a static export in `out/`; `npm run lint` checks the application.

## Experience

- Pointer-responsive glass portal with chromatic dispersion, animated calibration rings, and a continuous transition into the simulator.
- Responsive introduction with keyboard navigation and reduced-motion support; click the wordmark to revisit it.
- Liquid-glass prescription controls with left/right scrubbing, spring-settled motion, per-step synthesized detent clicks, optional haptics, and a persistent sound toggle.

- Sphere from +6.00 to −10.00 D, with continuous spring interpolation.
- Three smoothly joined spatial depth regions that respond differently to myopia and hyperopia.
- Cylinder from 0.00 to −4.00 D with directional sampling and a rotating 0–180° axis.
- Movable glasses rendered in the shader, with sharp image sampling strictly inside each lens.
- Pointer- and keyboard-held 20/20 comparison, evening/night lighting, and reduced-motion support.
- URL-preserved sphere, cylinder, axis, mode, and lighting; native sharing with clipboard and manual-copy fallbacks.

The scene is an original generated Copenhagen cafe photograph, with an in-scene printed menu for near-vision detail. The optical depth map is an artistic spatial approximation, not measured scene geometry. Sphere and cylinder effects do not model individual accommodation or retinal optics and are not diagnostic.

WebGL is required for optical effects. If unavailable, the original image remains visible with a compatibility notice. No account, database, or external image service is required.
