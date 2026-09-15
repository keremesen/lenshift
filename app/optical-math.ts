export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function snap(value: number, min: number, max: number, step: number) {
  return Number(clamp(min + Math.round((value - min) / step) * step, min, max).toFixed(4));
}

// Unwrap the seam so crossing twelve o'clock never jumps the prescription.
export function angleDelta(next: number, previous: number) {
  return ((next - previous + 540) % 360) - 180;
}

export function pointerAngle(x: number, y: number, centerX: number, centerY: number) {
  return Math.atan2(x - centerX, centerY - y) * 180 / Math.PI;
}

export function dialPoint(angle: number, radius: number, center = 140) {
  const radians = angle * Math.PI / 180;
  // Engines can disagree on the final floating-point bits of trigonometry.
  // Stable SVG attributes avoid server/client hydration mismatches.
  return { x: Number((center + Math.sin(radians) * radius).toFixed(4)), y: Number((center - Math.cos(radians) * radius).toFixed(4)) };
}
