import * as THREE from 'three';

export type FlameUniforms = {
  uTime: { value: number };
  uColor: { value: THREE.Color };
  uScale: { value: number };
};

export type FlameMaterial = THREE.ShaderMaterial & { uniforms: FlameUniforms };

const vertexShader = `
attribute float aSeed;

uniform float uTime;
uniform float uScale;

varying float vLife;
varying float vBright;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  mat4 modelInstance = modelMatrix;
  #ifdef USE_INSTANCING
    modelInstance = modelMatrix * instanceMatrix;
  #endif

  vec3 flameOrigin = (modelInstance * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 modelBasisX = vec3(modelInstance[0].x, modelInstance[0].y, modelInstance[0].z);
  float worldScale = length(modelBasisX) * uScale;

  float instanceRandom = hash12(floor(flameOrigin.xz * 8.0) + 0.5);

  float lifetime = 1.1 + hash11(aSeed * 3.0) * 1.3;
  float speed = 0.7 + hash11(aSeed * 7.0) * 0.8;
  float progress = fract((uTime * speed + aSeed * 17.0 + instanceRandom * 9.0) / lifetime);
  vLife = progress;
  vBright = 0.75 + 0.55 * hash11(aSeed * 23.0);

  float rise = progress * (1.7 + hash11(aSeed) * 1.5) * worldScale;

  float baseRadius = (0.04 + hash11(aSeed * 5.0) * 0.30) * worldScale;
  float swirl = aSeed * 6.2831 + progress * (1.0 + hash11(aSeed * 13.0) * 2.5);
  float taper = 1.0 - progress * 0.55;
  vec3 lateral = vec3(cos(swirl), 0.0, sin(swirl)) * baseRadius * taper;
  lateral.x += sin(uTime * 2.5 + aSeed * 20.0) * 0.06 * worldScale * progress;

  float squareSize = worldScale * (0.06 + hash11(aSeed * 11.0) * 0.07) * (1.0 - progress * 0.7);

  float spin = uTime * (0.6 + hash11(aSeed * 6.0) * 2.0) + aSeed * 12.0;
  float cs = cos(spin);
  float sn = sin(spin);
  vec2 corner = mat2(cs, -sn, sn, cs) * position.xy;

  vec3 camRight = vec3(viewMatrix[0].x, viewMatrix[1].x, viewMatrix[2].x);
  vec3 camUp = vec3(viewMatrix[0].y, viewMatrix[1].y, viewMatrix[2].y);

  vec3 particleCenter = flameOrigin + vec3(lateral.x, 0.1 * worldScale + rise, lateral.z);
  vec3 worldPosition = particleCenter
    + camRight * corner.x * 2.0 * squareSize
    + camUp * corner.y * 2.0 * squareSize;

  gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
}
`;

const fragmentShader = `
uniform vec3 uColor;

varying float vLife;
varying float vBright;

void main() {
  vec3 hot = vec3(1.0, 0.85, 0.55);
  vec3 cool = uColor * vec3(0.55, 0.28, 0.20);

  vec3 color = mix(hot, uColor, smoothstep(0.0, 0.4, vLife));
  color = mix(color, cool, smoothstep(0.45, 1.0, vLife));
  color *= vBright;
  color *= 1.6;

  float fade = smoothstep(0.0, 0.12, vLife) * (1.0 - smoothstep(0.55, 1.0, vLife));
  if (fade < 0.01) discard;

  gl_FragColor = vec4(color, fade);
}
`;

export function createFlameMaterial(color: THREE.ColorRepresentation): FlameMaterial {
  const material = new THREE.ShaderMaterial({
    name: 'FlameMaterial',
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uScale: { value: 1 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  return material as FlameMaterial;
}

export function updateFlameMaterialTime(material: FlameMaterial, elapsedSeconds: number): void {
  material.uniforms.uTime.value = elapsedSeconds;
}
