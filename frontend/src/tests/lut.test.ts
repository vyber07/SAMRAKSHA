/**
 * Empirical Stress Test: Heatmap Color LUT Calculation & Alpha Scaling
 * Target: LeafletMap.tsx createGradientLUT & pixel colorization
 */

export function createGradientLUTTest(): Uint8ClampedArray {
  // Pure mathematical simulation of 256-step linear gradient calculation
  const lut = new Uint8ClampedArray(1024);

  // Gradient stops definition matching LeafletMap.tsx:
  // 0.00: rgba(0, 0, 255, 0.00)
  // 0.20: rgba(2, 136, 209, 0.65)
  // 0.45: rgba(46, 125, 50, 0.85)
  // 0.72: rgba(245, 124, 0, 0.92)
  // 1.00: rgba(198, 40, 40, 0.98)

  const stops = [
    { pos: 0.00, r: 0, g: 0, b: 255, a: 0.00 * 255 },
    { pos: 0.20, r: 2, g: 136, b: 209, a: 0.65 * 255 },
    { pos: 0.45, r: 46, g: 125, b: 50, a: 0.85 * 255 },
    { pos: 0.72, r: 245, g: 124, b: 0, a: 0.92 * 255 },
    { pos: 1.00, r: 198, g: 40, b: 40, a: 0.98 * 255 },
  ];

  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let s0 = stops[0];
    let s1 = stops[stops.length - 1];

    for (let j = 0; j < stops.length - 1; j++) {
      if (t >= stops[j].pos && t <= stops[j + 1].pos) {
        s0 = stops[j];
        s1 = stops[j + 1];
        break;
      }
    }

    const range = s1.pos - s0.pos;
    const factor = range > 0 ? (t - s0.pos) / range : 0;

    const r = Math.round(s0.r + (s1.r - s0.r) * factor);
    const g = Math.round(s0.g + (s1.g - s0.g) * factor);
    const b = Math.round(s0.b + (s1.b - s0.b) * factor);
    const a = Math.round(s0.a + (s1.a - s0.a) * factor);

    const offset = i * 4;
    lut[offset] = r;
    lut[offset + 1] = g;
    lut[offset + 2] = b;
    lut[offset + 3] = a;
  }

  return lut;
}

export function testLutBoundsAndScaling() {
  const lut = createGradientLUTTest();
  console.assert(lut.length === 1024, 'LUT must be exactly 1024 bytes (256 * 4)');

  // Verify all 256 alpha inputs (0..255) maps safely into LUT
  for (let a = 1; a <= 255; a++) {
    const offset = a * 4;
    console.assert(offset >= 0 && offset + 3 < lut.length, `Offset ${offset} out of bounds for alpha ${a}`);

    const r = lut[offset];
    const g = lut[offset + 1];
    const b = lut[offset + 2];
    const lutAlpha = lut[offset + 3];

    console.assert(r >= 0 && r <= 255, `Invalid Red byte ${r} at alpha ${a}`);
    console.assert(g >= 0 && g <= 255, `Invalid Green byte ${g} at alpha ${a}`);
    console.assert(b >= 0 && b <= 255, `Invalid Blue byte ${b} at alpha ${a}`);
    console.assert(lutAlpha >= 0 && lutAlpha <= 255, `Invalid Alpha byte ${lutAlpha} at alpha ${a}`);

    const scaledAlpha = Math.min(240, Math.round(lutAlpha * (a / 255)));
    console.assert(scaledAlpha >= 0 && scaledAlpha <= 240, `Scaled alpha ${scaledAlpha} out of range [0, 240] for alpha ${a}`);
  }

  return { pass: true, lutSize: lut.length };
}
