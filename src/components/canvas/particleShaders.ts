/**
 * A2 Particle Data Flow — WebGL2 shaders. Every particle's position is a pure function of
 * (seed, uTime): no CPU simulation, no FBOs. Velocity ≈ ∇×ψ (curl of 3D simplex noise,
 * divergence-free, so particles swirl without clumping) plus a constant downward drift.
 */

// 3D simplex noise — Ashima Arts / Stefan Gustavson, "webgl-noise" (MIT licence).
const simplex = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const particleVertex = /* glsl */ `#version 300 es
precision highp float;
in float aSeed;
uniform float uTime;      // flow time (sped up briefly by scroll velocity)
uniform float uScroll;    // window.scrollY
uniform vec2 uView;       // viewport, CSS px
uniform vec2 uEmitter;    // document px — the hero network's output layer
uniform float uLength;    // band from the emitter down to Contact, px
uniform float uDpr;
uniform vec2 uLabels[8];  // section layer labels, document px
uniform int uLabelCount;
out float vAlpha;
out float vTint;

${simplex}

float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

// ψ = three decorrelated noise fields; v = ∇ × ψ by central differences (xy projection).
vec2 curl(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0), dy = vec3(0.0, e, 0.0), dz = vec3(0.0, 0.0, e);
  vec3 o1 = vec3(31.4, 0.0, 0.0), o2 = vec3(0.0, 47.2, 0.0);
  float psiZ_dy = snoise(p + o2 + dy) - snoise(p + o2 - dy);
  float psiY_dz = snoise(p + o1 + dz) - snoise(p + o1 - dz);
  float psiX_dz = snoise(p + dz) - snoise(p - dz);
  float psiZ_dx = snoise(p + o2 + dx) - snoise(p + o2 - dx);
  return vec2(psiZ_dy - psiY_dz, psiX_dz - psiZ_dx) / (2.0 * e);
}

void main() {
  float h1 = hash(aSeed + 0.13), h2 = hash(aSeed + 1.37), h3 = hash(aSeed + 2.71);
  float h4 = hash(aSeed + 3.93), h5 = hash(aSeed + 5.11), h6 = hash(aSeed + 6.29);

  // Progress through the band; pow() packs particles near the hero and thins them lower down.
  float u = fract(h1 + uTime * mix(0.010, 0.022, h2));
  // Hand-off: particles leave the hero's output layer as a narrow, brighter stream, then fan out.
  float spread = pow(smoothstep(0.0, 0.4, u), 1.6);
  vec2 p = vec2(
    mix(uEmitter.x, h3 * uView.x, spread),
    uEmitter.y + uLength * pow(u, 1.7)
  );

  // Swirl along the curl-noise field (displacement grows as particles leave the emitter).
  p += curl(vec3(p * 0.0015, uTime * 0.025 + h4 * 7.0)) * 70.0 * (0.25 + 0.75 * spread);

  // Converge slightly toward section layer labels as they pass.
  for (int i = 0; i < 8; i++) {
    if (i >= uLabelCount) break;
    vec2 d = uLabels[i] - p;
    p += d * 0.32 * exp(-dot(d, d) / (2.0 * 170.0 * 170.0));
  }

  vec2 screen = vec2(p.x, p.y - uScroll);
  gl_Position = vec4(screen.x / uView.x * 2.0 - 1.0, 1.0 - screen.y / uView.y * 2.0, 0.0, 1.0);
  gl_PointSize = mix(1.0, 2.2, h5) * uDpr;
  vAlpha = mix(0.10, 0.25, h6) * (1.0 + 1.8 * (1.0 - spread))
         * smoothstep(0.0, 0.04, u) * (1.0 - smoothstep(0.85, 1.0, u));
  vTint = h4;
}
`;

export const particleFragment = /* glsl */ `#version 300 es
precision mediump float;
in float vAlpha;
in float vTint;
uniform vec3 uSignal;
uniform vec3 uActivation;
out vec4 outColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  vec3 col = mix(uSignal, uActivation, step(0.78, vTint));
  outColor = vec4(col * vAlpha, vAlpha); // premultiplied
}
`;
