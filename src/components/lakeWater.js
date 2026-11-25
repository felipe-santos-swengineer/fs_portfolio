import * as THREE from 'three';

const fogColor = '#344e65';

export function createLakeWater(scene) {
  const clock = { value: 0 };
  const geometry = new THREE.PlaneGeometry(27.2, 138, 28, 100);
  geometry.rotateX(-Math.PI / 2);
  const surface = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      time: clock,
      deep: { value: new THREE.Color('#0b1b35') },
      shallow: { value: new THREE.Color('#22b8cf') },
      violet: { value: new THREE.Color('#8b5cf6') },
      moon: { value: new THREE.Color('#a5d9ed') },
      haze: { value: new THREE.Color(fogColor) },
    },
    vertexShader: `
      uniform float time;
      varying vec3 surface;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        world.y += .05 * sin(world.x * .85 + world.z * .26 + time * 1.15)
          + .032 * sin(world.z * .57 - world.x * .32 - time * .82);
        surface = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 deep, shallow, violet, moon, haze;
      varying vec3 surface;
      float glow(vec2 p, vec2 source, vec2 spread) {
        vec2 d = (p - source) / spread;
        return exp(-dot(d, d));
      }
      void main() {
        vec2 p = surface.xz;
        float shore = smoothstep(6.0, 12.0,
          abs(p.x) + .55 * sin(p.y * .37 + sign(p.x)) + .3 * cos(p.y * .91));
        float wave = sin(p.x * .85 + p.y * .26 + time * 1.15);
        float crossWave = cos(p.y * .57 - p.x * .32 - time * .82);
        vec3 normal = normalize(vec3(-wave * .06, 1.0, -crossWave * .07));
        vec3 view = normalize(cameraPosition - surface);
        float grazing = pow(1.0 - clamp(dot(view, normal), 0.0, 1.0), 3.0);
        float striation = pow(.5 + .5 * sin(p.y * 4.4 + wave * 1.3 + crossWave + time * .65), 9.0);
        float patches = .5 + .5 * sin(p.y * .13 + p.x * .44 + wave * .45);
        vec3 water = mix(deep, shallow, .16 + shore * .32 + patches * .08);
        water = mix(water, violet, (.025 + patches * .09) * (1.0 - shore * .6));
        water = mix(water, haze, grazing * .33);
        float moonlight = pow(max(dot(reflect(-view, normal), normalize(vec3(-.42,.48,-.63))), 0.0), 18.0);
        water += moon * (moonlight * .28 + striation * (.019 + grazing * .031 + shore * .025));
        water += shallow * glow(p, vec2(-11.0, 10.6), vec2(4.0, 8.0)) * (.15 + striation * .22);
        water += violet * glow(p, vec2(11.0, -27.0), vec2(4.0, 6.0)) * (.09 + striation * .16);
        water += moon * glow(p, vec2(0.0, -114.0), vec2(5.0, 5.0)) * (.05 + striation * .09);
        float distanceFog = smoothstep(35.0, 78.0, distance(cameraPosition, surface));
        gl_FragColor = vec4(mix(water, haze, distanceFog), mix(.74 + grazing * .16, .51 + grazing * .22, shore));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  }));
  surface.position.set(0, .025, -49);
  surface.renderOrder = 2;
  scene.add(surface);

  const rippleShape = new THREE.RingGeometry(.92, 1, 32);
  const ripples = [[-10.5, 13], [9.7, -25], [-8.9, -46], [9.5, -74], [-8.7, -95]].map(([x, z], index) => {
    const ring = new THREE.Mesh(rippleShape, new THREE.MeshBasicMaterial({
      color: index % 2 ? '#bd9bea' : '#9be1e5', transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, .13, z);
    ring.renderOrder = 3;
    scene.add(ring);
    return ring;
  });

  return (time, reduced) => {
    clock.value = time;
    ripples.forEach((ring, index) => {
      const progress = ((time + index * 5.3) % 19) / 3.7;
      ring.visible = !reduced && progress < 1;
      if (!ring.visible) return;
      ring.scale.setScalar(.3 + progress * 2.65);
      ring.material.opacity = Math.sin(progress * Math.PI) * .28;
    });
  };
}

export { fogColor as lakeFogColor };
