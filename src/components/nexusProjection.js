import * as T from 'three';
import { facePlayer } from './facePlayer';

// The Omega suit measures about 1.92 scene units from the boots to the helmet.
export const nexusProjectionHeight = 3.84;

// The sections describe a continuous silhouette without skin textures.
function loft(sections, sides = 24, frontProfile, extendBase) {
  const profile = new T.CatmullRomCurve3(sections.map(([y, x, z]) => new T.Vector3(x, y, z)));
  const rows = sections.length * 4;
  const vertices = [], indices = [];
  for (let row = 0; row <= rows; row++) {
    const { x, y, z } = profile.getPoint(row / rows);
    for (let side = 0; side < sides; side++) {
      const angle = side / sides * Math.PI * 2;
      const width = Math.max(.001, x) * Math.cos(angle);
      const front = Math.sin(angle);
      const contour = frontProfile && front > 0 ? frontProfile(width, y) * front * front : 0;
      vertices.push(width, y, Math.max(.001, z) * front + contour);
      if (!row) continue;
      const a = (row - 1) * sides + side;
      const b = (row - 1) * sides + (side + 1) % sides;
      indices.push(a, a + sides, b, b, a + sides, b + sides);
    }
  }
  extendBase?.(vertices, indices, sides);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function torsoFrontProfile(x, y) {
  const chest = (Math.abs(x) - .17) / .115;
  const height = (y - 2.21) / .12;
  return .145 * Math.exp(-(chest * chest + height * height));
}

function joinThighs(vertices, indices, sides) {
  const front = sides / 4, back = 3 * front;
  const seam = [];
  // Both thigh openings share this interior edge and the original hip vertices.
  for (let step = 1; step < 8; step++) {
    const t = step / 8;
    seam.push(vertices.length / 3);
    vertices.push(0, vertices[front*3+1] - .12 * Math.sin(Math.PI*t),
      T.MathUtils.lerp(vertices[front*3+2], vertices[back*3+2], t));
  }
  for (const side of [-1, 1]) {
    const outerStart = side === 1 ? back : front;
    const outer = Array.from({ length: sides/2 + 1 }, (_, i) => (outerStart+i)%sides);
    const opening = outer.concat(side === 1 ? seam : [...seam].reverse());
    const sections = [
      [1.35,.184,.168,.169,.45],[1.27,.193,.161,.16,.72],
      [1.19,.198,.154,.153,.9],[1.12,.204,.146,.145,1],
      [.97,.213,.117,.122,1],[.82,.22,.091,.092,1],[.69,.224,.068,.074,1],
    ];
    let upperRing = opening;
    for (const [y,center,width,depth,blend] of sections) {
      const lowerRing = opening.map((index, i) => {
        const sweep = i <= sides/2 ? i/(sides/2)*.75 : .75+(i-sides/2)/8*.25;
        const angle = (side === 1 ? -.75 : .25)*Math.PI + sweep*2*Math.PI;
        const x = T.MathUtils.lerp(vertices[index*3], side*center+width*Math.cos(angle), blend);
        const z = T.MathUtils.lerp(vertices[index*3+2], depth*Math.sin(angle), blend);
        const seamOffset = (vertices[index*3+1]-vertices[front*3+1])*(1-blend);
        const vertex = vertices.length/3;
        vertices.push(x,y+seamOffset,z);
        return vertex;
      });
      for (let i=0; i<lowerRing.length; i++) {
        const next=(i+1)%lowerRing.length;
        const a=lowerRing[i], b=lowerRing[next];
        indices.push(a,upperRing[i],b,b,upperRing[i],upperRing[next]);
      }
      upperRing=lowerRing;
    }
  }
  // Shape the rear of the pelvis across the shared hip and thigh vertices.
  for (let i=0; i<vertices.length; i+=3) {
    const height=(vertices[i+1]-1.46)/.245;
    const width=(Math.abs(vertices[i])-.145)/.23;
    const rear=T.MathUtils.smoothstep(-vertices[i+2],.025,.15);
    vertices[i+2]-=.14*Math.exp(-(height*height+width*width))*rear;
  }
  smoothPelvisDepth(vertices, indices);
}

function smoothPelvisDepth(vertices, indices) {
  const count = vertices.length / 3;
  const neighbors = Array.from({length: count}, () => new Set());
  for (let i=0; i<indices.length; i+=3) {
    const [a,b,c] = [indices[i],indices[i+1],indices[i+2]];
    neighbors[a].add(b).add(c);
    neighbors[b].add(c).add(a);
    neighbors[c].add(a).add(b);
  }
  const depth = new Float32Array(count);
  for (let pass=0; pass<4; pass++) {
    for (let i=0; i<count; i++) depth[i]=vertices[i*3+2];
    for (let i=0; i<count; i++) {
      const height=vertices[i*3+1];
      if(height<1.08||height>1.86||depth[i]>=-.045||!neighbors[i].size)continue;
      let sum=0;
      for (const neighbor of neighbors[i]) sum+=depth[neighbor];
      const smoothing=.5*(1-T.MathUtils.smoothstep(Math.abs(height-1.46),.13,.38))
        *T.MathUtils.smoothstep(-depth[i],.045,.16);
      vertices[i*3+2]=T.MathUtils.lerp(depth[i],sum/neighbors[i].size,smoothing);
    }
  }
}

export function buildNexusProjection(core) {
  const figure = new T.Group();
  core.add(figure);
  figure.scale.setScalar(nexusProjectionHeight / 3.04);

  const uniforms = {
    time: { value: 0 }, reveal: { value: 1 }, integrity: { value: 1 },
    glitch: { value: 0 }, color: { value: new T.Color() }, accent: { value: new T.Color() },
    originY: { value: 0 }, projectionHeight: { value: nexusProjectionHeight },
  };
  const surface = new T.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `
      uniform float glitch, time, originY;
      varying vec3 normalView, eye, local;
      varying float height;
      void main() {
        vec3 p = position;
        height = (modelMatrix * vec4(p, 1.)).y - originY;
        p.x += glitch * step(.86, fract(sin(floor(height * 11.) + floor(time * 14.)) * 546.3)) * .14;
        vec4 view = modelViewMatrix * vec4(p, 1.);
        local = position;
        normalView = normalize(normalMatrix * normal);
        eye = -view.xyz;
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: `
      uniform float time, reveal, integrity, projectionHeight;
      uniform vec3 color, accent;
      varying vec3 normalView, eye, local;
      varying float height;
      void main() {
        float noise = fract(sin(dot(floor(local * 95.), vec3(12.9898,78.233,34.213))) * 43758.5453);
        float build = smoothstep(-.3,.75,reveal * (projectionHeight + .75) - height);
        float fade = smoothstep(0.,.15,integrity - noise * (1. - integrity));
        float edge = pow(1. - max(0.,dot(normalize(eye),normalize(normalView))), 2.3);
        float scan = pow(.5 + .5*sin(height * 41. - time * 5.), 5.);
        float data = step(.93,fract(local.x * 19. + sin(local.y * 8.) * .22)) * scan;
        vec3 light = color * (.37 + .62 * edge + .25 * scan) + accent * data * .65;
        light += vec3(.11,.03,.18) * edge;
        float alpha = (.45 + .39 * edge + .12 * scan) * build * fade;
        alpha *= mix(.48,1.,smoothstep(.0,.65,height));
        if (alpha < .025) discard;
        gl_FragColor = vec4(light,alpha);
        #include <colorspace_fragment>
      }`,
  });
  const wire = new T.MeshBasicMaterial({ color: '#c989ff', wireframe: true, transparent: true, depthWrite: false });
  const detail = new T.MeshBasicMaterial({ color: '#d5b9ff', transparent: true, depthWrite: false });
  const eyes = new T.MeshBasicMaterial({ color: '#f4faff', transparent: true, depthWrite: false });
  const wires = [];
  const group = (parent, x, y, z = 0) => {
    const node = new T.Group();
    parent.add(node);
    node.position.set(x, y, z);
    return node;
  };
  function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
    const object = new T.Mesh(geometry, material);
    parent.add(object);
    object.position.set(x, y, z);
    if (material === surface) {
      const outline = new T.Mesh(geometry, wire);
      object.add(outline);
      wires.push(outline);
    } else object.renderOrder = 1;
    return object;
  }
  function filament(parent, points, width, material = detail) {
    const curve = new T.CatmullRomCurve3(points.map(point => new T.Vector3(...point)));
    return mesh(parent, new T.TubeGeometry(curve, 20, width, 5, false), material);
  }

  const torso = loft([
    [1.44,.35,.177],[1.53,.375,.20],[1.68,.30,.165],
    [1.8,.212,.132],[1.9,.206,.129],[2.01,.262,.156],[2.12,.324,.185],
    [2.25,.356,.197],[2.36,.349,.168],[2.43,.307,.144],
    [2.51,.186,.112],[2.68,.12,.105],[2.73,.01,.01],
  ], 48, torsoFrontProfile, joinThighs);
  mesh(figure, torso, surface);
  const head = group(figure, 0, 2.76);
  mesh(head, loft([[-.16,.01,.04],[-.10,.12,.105],[-.04,.17,.15],[.07,.197,.165],
    [.18,.188,.16],[.26,.14,.12],[.29,.005,.005]]), surface);
  filament(head, [[0,.1,.169],[0,.024,.19],[0,-.012,.177]], .011);
  const mouth = filament(head, [[-.059,-.057,.144],[0,-.066,.16],[.059,-.057,.144]], .009);
  for (const side of [-1, 1]) {
    filament(head, [[side*.037,.075,.163],[side*.093,.088,.155],[side*.156,.094,.109]], .013, eyes);
    filament(head, [[side*.039,.125,.164],[side*.11,.137,.139],[side*.162,.126,.106]], .006);
    filament(head, [[side*.156,.073,.112],[side*.163,.021,.107],[side*.106,-.077,.12]], .005);
  }

  const hair = [];
  for (let i = 0; i < 22; i++) {
    const angle = Math.PI * (1.04 + .92 * i / 21);
    const x = Math.cos(angle), z = Math.sin(angle);
    const strand = group(head, x * .1, .21, z * .105);
    filament(strand, [[0,.025,0],[x*.112,-.11,z*.13-.045],
      [x*.17,-.42,-.23],[x*.28,-.76,-.29],[x*.38,-1.1-(i%4)*.08,-.24]], .009 + i%3*.003);
    hair.push(strand);
  }

  const shin = loft([[-.66,.003,.005],[-.58,.053,.083],[-.45,.054,.06],[-.22,.091,.097],[-.08,.079,.083],[.03,.053,.052]]);
  const upper = loft([[-.49,.054,.055],[-.28,.066,.064],[-.1,.082,.073],
    [-.015,.082,.07],[.052,.052,.05],[.077,.008,.012]]);
  const lower = loft([[-.45,.038,.033],[-.28,.054,.05],[-.1,.069,.059],[.035,.048,.045]]);
  const palm = loft([[-.13,.048,.025],[-.06,.062,.038],[.018,.038,.033]]);
  const arms = [-1,1].map(side => {
    const knee = group(figure, side*.224, .705);
    knee.rotation.x = -.13;
    knee.rotation.z = side*.067;
    mesh(knee, shin, surface);
    const shoulder = group(figure, side*.315, 2.36);
    mesh(shoulder, upper, surface);
    const elbow = group(shoulder, 0, -.46);
    mesh(elbow, lower, surface);
    const hand = group(elbow, 0, -.43);
    mesh(hand, palm, surface);
    const fingers = Array.from({ length: 5 }, (_, i) => {
      const finger = group(hand, (i-2)*.025, i === 4 ? -.053 : -.113);
      filament(finger, [[0,0,0],[0,-.044,.004],[0,-.092+Math.abs(i-1)*.009,.013]], .009);
      return finger;
    });
    filament(shoulder, [[0,.05,.077],[side*.045,-.18,.078],[0,-.41,.054]], .006);
    filament(elbow, [[0,0,.048],[side*.023,-.17,.059],[0,-.42,.033]], .005);
    return { side, shoulder, elbow, hand, fingers };
  });
  for (const side of [-1, 1]) {
    filament(figure, [[side*.267,2.43,.092],[side*.28,2.30,.18],[side*.22,2.19,.27],
      [side*.15,2.02,.158],[side*.096,1.82,.133],[side*.28,1.53,.15],[side*.22,1.34,.164]], .009);
    filament(figure, [[side*.29,2.30,.18],[side*.17,2.31,.25],[side*.075,2.32,.214],[side*.029,2.34,.188]], .006);
  }

  const gravityHalo = group(arms[1].hand, 0, -.24);
  const haloMaterial = new T.MeshBasicMaterial({
    color: '#c0abff', transparent: true, opacity: .55, depthWrite: false,
    blending: T.AdditiveBlending,
  });
  const haloGeometry = new T.TorusGeometry(.13, .008, 6, 32);
  mesh(gravityHalo, haloGeometry, haloMaterial);
  mesh(gravityHalo, haloGeometry, haloMaterial).rotation.y = Math.PI / 2;
  gravityHalo.visible = false;
  const world = new T.Vector3();
  const playerWorld = new T.Vector3();
  function update(b, dt, player, reduced, state) {
    const { color, hostile, overload, reveal, integrity, offline, liberation } = state;
    const t = reduced ? 0 : b.elapsed;
    figure.visible = !offline && integrity > .01;
    figure.position.y = -2.08 + .06 * Math.sin(t * 1.1);
    figure.getWorldPosition(world);
    uniforms.originY.value = world.y;
    uniforms.time.value = t;
    uniforms.reveal.value = reveal;
    uniforms.integrity.value = integrity;
    uniforms.glitch.value = reduced ? 0 : overload ? 1 : hostile ? .3 : .06;
    uniforms.color.value.set(color);
    uniforms.accent.value.set(hostile ? '#ff496d' : '#8bf6ff');
    detail.color.copy(uniforms.accent.value);
    detail.opacity = integrity * T.MathUtils.smoothstep(reveal, .74, .97) * (.73 + .15*Math.sin(t*3));
    eyes.opacity = integrity * T.MathUtils.smoothstep(reveal, .86, 1);
    eyes.color.set(hostile ? '#ffbec9' : '#f4faff');
    wire.opacity = .24 * (1 - reveal);
    wires.forEach(outline => { outline.visible = reveal < .98 && !reduced; });

    const previousYaw = figure.rotation.y;
    facePlayer(figure, player);
    const yawDelta = figure.rotation.y - previousYaw;
    // The body follows the shortest arc while the head keeps its aim.
    figure.rotation.y = previousYaw + Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta)) * (1-Math.exp(-7*dt));
    facePlayer(head, player);
    player?.getWorldPosition(playerWorld);
    head.getWorldPosition(world);
    const distance = Math.hypot(playerWorld.x-world.x, playerWorld.z-world.z);
    head.rotation.x = Math.atan2(world.y - playerWorld.y, distance);
    head.rotation.order = 'YXZ';
    head.rotation.z = .035 * Math.sin(t * .8);
    mouth.scale.y = !reduced && b.line && b.lineDelay<=0 ? 1 + .48 * Math.abs(Math.sin(b.lineTime * 15)) : 1;
    hair.forEach((strand, i) => { strand.rotation.z = reduced ? 0 : .042 * Math.sin(t * 1.6 + i*.4); });

    const kind = b.attack?.kind;
    const gesture = ['field','wave'].includes(kind) ? 'gravity' :
      ['laser','drone'].includes(kind) ? 'defense' :
      ['vent','steam'].includes(kind) ? 'oxygen' : kind ? 'assault' :
      b.mode === 'fight' ? ['defense','gravity','assault','oxygen','assault'][b.phase] : 'idle';
    const lift = b.attack ? T.MathUtils.smoothstep(b.attack.age, 0, b.attack.warn*.72) : .5;
    gravityHalo.visible = gesture === 'gravity' && Boolean(b.attack) && lift > .1;
    gravityHalo.rotation.set(t, t*.7, 0);
    gravityHalo.scale.setScalar(.65 + .6*lift);
    for (const { side, shoulder, elbow, hand, fingers } of arms) {
      const lead = side === 1;
      const spread = gesture === 'assault' ? 1 + .2*Math.sin(t*2+side) :
        gesture === 'gravity' && lead ? 2.02 : liberation && gesture === 'idle' ? 1.45*T.MathUtils.smoothstep(reveal, .68, 1) : .22;
      const reach = gesture === 'defense' && lead ? -1.65 : gesture === 'oxygen' && lead ? -.82 : -.12;
      shoulder.rotation.z = T.MathUtils.damp(shoulder.rotation.z, side*(.16+spread*lift), 5, dt);
      shoulder.rotation.x = T.MathUtils.damp(shoulder.rotation.x, reach*lift, 5, dt);
      elbow.rotation.x = T.MathUtils.damp(elbow.rotation.x, gesture === 'defense' ? -.08 : -.48*lift, 5, dt);
      hand.rotation.y = side * .37;
      fingers.forEach((finger, i) => {
        const curl = gesture === 'oxygen' && lead ? -1.35*lift : -.17;
        finger.rotation.x = T.MathUtils.damp(finger.rotation.x, curl, 5, dt);
        finger.rotation.z = (i-2)*.082;
      });
    }
  }
  function focus(target) {
    head.getWorldPosition(target);
    target.y -= .65;
  }
  return { figure, focus, update };
}
