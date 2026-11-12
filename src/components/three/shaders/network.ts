/**
 * A1 shaders. All animation is a function of uTime and per-pass attributes:
 *   pulse position  s = clamp((t − t_a) / d, 0, 1)
 *   node glow       I_j(t) = a_j · exp(−(t − t_j) / τ)
 */

const glow = /* glsl */ `
  float nodeGlow(float act, float arrive, float t, float tau) {
    float dt = t - arrive;
    return dt < 0.0 ? 0.0 : act * exp(-dt / tau);
  }
`;

export const edgeVertex = /* glsl */ `
  attribute float aT;
  attribute float aStart;
  attribute float aAmp;
  varying float vT;
  varying float vStart;
  varying float vAmp;
  varying float vDepth;
  void main() {
    vT = aT;
    vStart = aStart;
    vAmp = aAmp;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = smoothstep(-14.0, -8.0, mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const edgeFragment = /* glsl */ `
  uniform float uTime;
  uniform float uHop;
  uniform float uBase;
  uniform vec3 uIdle;
  uniform vec3 uSignal;
  varying float vT;
  varying float vStart;
  varying float vAmp;
  varying float vDepth;
  void main() {
    float s = (uTime - vStart) / uHop;
    float band = 0.0;
    float trail = 0.0;
    if (vAmp > 0.0 && s >= 0.0) {
      float d = vT - min(s, 1.0);
      band = s <= 1.0 ? exp(-(d * d) / 0.006) : 0.0;
      // Lit sub-graph fades out after the pulse has crossed the edge.
      float behind = s <= 1.0 ? step(vT, s) : 1.0;
      trail = behind * 0.28 * exp(-max(s - 1.0, 0.0) * uHop / 0.9);
    }
    vec3 col = uIdle * uBase + uSignal * vAmp * (band * 1.25 + trail);
    gl_FragColor = vec4(col * (0.55 + 0.45 * vDepth), 1.0);
  }
`;

export const nodeVertex = /* glsl */ `
  ${glow}
  attribute float aAct;
  attribute float aArrive;
  attribute float aIndex;
  uniform float uTime;
  uniform float uTau;
  uniform float uHover;
  varying float vGlow;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vGlow = nodeGlow(aAct, aArrive, uTime, uTau);
    float hover = abs(aIndex - uHover) < 0.5 ? 1.0 : 0.0;
    vGlow = max(vGlow, hover * 0.9);
    vec4 world = modelMatrix * instanceMatrix * vec4(position * (1.0 + 0.35 * vGlow), 1.0);
    vec4 mv = viewMatrix * world;
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const nodeFragment = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uRim;
  uniform vec3 uActivation;
  varying float vGlow;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.0);
    vec3 base = mix(uBaseColor, uActivation, clamp(vGlow, 0.0, 1.0));
    vec3 col = base + fres * mix(uRim, uActivation * 1.4, vGlow) * (0.6 + vGlow);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const haloVertex = /* glsl */ `
  ${glow}
  attribute float aAct;
  attribute float aArrive;
  attribute float aIndex;
  uniform float uTime;
  uniform float uTau;
  uniform float uHover;
  uniform float uSize;
  varying float vGlow;
  void main() {
    vGlow = nodeGlow(aAct, aArrive, uTime, uTau);
    float hover = abs(aIndex - uHover) < 0.5 ? 1.0 : 0.0;
    vGlow = max(vGlow, hover * 0.8);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = vGlow < 0.02 ? 0.0 : uSize * (0.5 + vGlow) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const haloFragment = /* glsl */ `
  uniform vec3 uActivation;
  uniform float uStrength;
  varying float vGlow;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float a = exp(-r * r * 4.0) * (1.0 - r);
    if (a <= 0.0) discard;
    gl_FragColor = vec4(uActivation * a * vGlow * uStrength, 1.0);
  }
`;

export const pulseVertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute float aStart;
  attribute float aAmp;
  uniform float uTime;
  uniform float uHop;
  uniform float uSize;
  varying float vAmp;
  void main() {
    // \`position\` holds the edge's target node; aFrom its source.
    float s = (uTime - aStart) / uHop;
    float visible = (aAmp > 0.0 && s >= 0.0 && s <= 1.0) ? 1.0 : 0.0;
    vAmp = aAmp * visible;
    vec4 mv = modelViewMatrix * vec4(mix(aFrom, position, clamp(s, 0.0, 1.0)), 1.0);
    gl_PointSize = visible * uSize * (0.6 + 0.4 * aAmp) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const pulseFragment = /* glsl */ `
  uniform vec3 uSignal;
  varying float vAmp;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float a = exp(-r * r * 5.0) * (1.0 - r);
    if (a <= 0.0) discard;
    gl_FragColor = vec4(uSignal * a * (0.6 + vAmp), 1.0);
  }
`;
