import * as THREE from 'three';

// Static scenery is batched independently of movement bounds and event triggers.
export function buildCastleExterior(scene, gate, masonryMap) {
  const shape = points => {
    const outline = new THREE.Shape();
    points.forEach(([x, y], i) => i ? outline.lineTo(x, y) : outline.moveTo(x, y));
    outline.closePath();
    return new THREE.ExtrudeGeometry(outline, { depth: 1, bevelEnabled: false });
  };
  const forms = {
    block: new THREE.BoxGeometry(1, 1, 1),
    drum: new THREE.CylinderGeometry(.46, .5, 1, 8),
    spire: new THREE.ConeGeometry(.5, 1, 8),
    shard: new THREE.IcosahedronGeometry(.5, 0),
    ring: new THREE.TorusGeometry(.4, .075, 5, 12),
    lancet: shape([[-.5,0],[.5,0],[.5,.62],[.32,.83],[0,1],[-.32,.83],[-.5,.62]]),
    shield: shape([[-.5,1],[.5,1],[.42,.35],[0,0],[-.42,.35]]),
    branch: new THREE.CylinderGeometry(.29, .5, 1, 5),
  };
  const targetView = { value: new THREE.Vector3() };
  const stone = new THREE.MeshStandardMaterial({ roughness: .94, flatShading: true });
  const ashlar = stone.clone();
  ashlar.map = masonryMap;
  const wet = new THREE.MeshStandardMaterial({ roughness: .19, metalness: .3 });
  const glow = new THREE.MeshBasicMaterial();
  // Cut a soft-edged sightline through scenery only when orbiting behind it.
  for (const material of [stone, ashlar, wet, glow]) {
    material.onBeforeCompile = shader => {
      shader.uniforms.castleTarget = targetView;
      shader.vertexShader = 'varying vec3 castleView;\n' + shader.vertexShader.replace(
        '#include <project_vertex>', '#include <project_vertex>\ncastleView = mvPosition.xyz;');
      shader.fragmentShader = 'varying vec3 castleView; uniform vec3 castleTarget;\n' + shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n        float t = dot(castleView, castleTarget) / max(dot(castleTarget, castleTarget), .01);\n        if (t > 0. && t < 1.) {\n          float d = length(castleView - t * castleTarget);\n          float grain = fract(dot(floor(gl_FragCoord.xy), vec2(.7548777,.5698403)));\n          if (grain > smoothstep(1., 1.9, d)) discard;\n        }`);
    };
  }
  const batches = new Map();
  const pose = new THREE.Object3D();
  const put = (form, color, x,y,z, w,h,d, rz=0, ry=0, material=stone, parent=scene) => {
    const key = [form, material.id, parent.id].join('/');
    if (!batches.has(key)) batches.set(key, { form, material, parent, parts: [] });
    pose.position.set(x,y,z);
    pose.rotation.set(0,ry,rz,'YXZ');
    pose.scale.set(w,h,d);
    pose.updateMatrix();
    batches.get(key).parts.push([pose.matrix.clone(),color]);
  };
  const slate='#45444a', trim='#79716a', iron='#393738', wood='#594033', moss='#454f43';
  const wall=(x,y,z,w,h,d)=>put('block','#8c8784',x,y,z,w,h,d,0,0,ashlar);
  const pane=(x,y,z,w,h)=>{
    put('lancet',trim,x,y-.14,z,w+.35,h+.4,.16);
    put('lancet','#231f29',x,y,z+.17,w,h,.1);
    put('lancet','#61505b',x,y+.2,z+.28,w*.68,h*.79,.05);
    put('block',iron,x,y+h*.43,z+.36,.13,h*.83,.08);
  };
  for (const side of [-1,1]) {
    wall(side*15,7.4,-20,19,14.8,4);
    for (let i=0;i<3;i++) {
      const x=side*(8+i*5.2);
      wall(x,4,-17.9,1.45,8,2.6);
      put('lancet',trim,x,7.8,-19,1.65,4.2,2.48);
      pane(x+side*2.2,8,-17.94,1.45,5);
    }
    for (let i=0;i<9;i++) put('block',trim,side*(6+i*2.15),15.25,-19,1.2,1.25,2.8);
    for (const [dist,z,r,h] of [[7,-21,2.8,22],[23,-21,4.6,24],[15,-27,2.6,29],[30,-26,2.4,19]]) {
      const x=dist*side;
      put('drum',slate,x,h/2,z,r*2,h,r*2);
      for (const level of [.36,.7,.96]) put('drum',trim,x,h*level,z,r*2.14,.5,r*2.14);
      put('spire','#303342',x,h+4.3,z,r*2.35,9,r*2.35);
      put('spire',iron,x,h+9.3,z,.42,2,.42);
      pane(x,h*.74,z+r*.93,1.1,3.2);
    }
  }
  wall(0,17,-21,11.1,12,4);
  pane(0,16.3,-18.94,3.5,5.6);
  // Two rising curves of individual wedge-like stones meet at the pointed crown.
  for (const side of [-1,1]) {
    for(let i=0;i<8;i++) {
      const a=(i+.5)*Math.PI/24;
      put('block',i%3?trim:slate,side*(10.9*Math.cos(a)-5.45),6+10.9*Math.sin(a),-17.55,
        .94,1.48,1.75,side*a);
    }
    for(let i=0;i<5;i++) put('block',trim,side*5.46,.6+i*1.2,-17.55,1,1.15,1.75);
  }
  const door=(form,color,x,y,z,w,h,d,rz=0)=>put(form,color,x,y,z,w,h,d,rz,0,stone,gate);
  door('block','#30272a',0,5.5,-18.85,11,11,1);
  for(let i=0;i<14;i++) {
    const x=(i-6.5)*.78;
    door('block',i%3?wood:'#49332d',x,5.5,-18.29,.75,11,.16);
    for(const y of [1.8,5.2,9]) door('shard','#948473',x,y,-18.01,.14,.14,.12);
  }
  for(const y of [1.8,5.2,9]) door('block',iron,0,y,-18.13,10.9,.37,.16);
  for(const side of [-1,1]) {
    door('shield','#692f34',side*1.3,6,-17.99,1.5,2,.12);
    door('lancet','#aa9574',side*1.3,6.45,-17.85,.42,1.15,.08);
    for(let i=0;i<9;i++) door('ring',iron,side*(1.4+.38*i),3.8+i*.30,-17.94,.64,.72,.45);
    put('drum',slate,side*6.9,1.15,-16.6,2.1,2.3,2.1);
    put('shield',trim,side*6.9,2.3,-16.15,1.1,1.8,.45);
    put('lancet',slate,side*6.9,2.25,-16.65,1.6,2.9,.6);
    put('drum',iron,side*5.9,2.8,-16.65,1.5,.54,1.5);
    put('shard','#75ba9d',side*5.9,3.35,-16.65,.62,1.25,.65,.12,0,glow);
  }
  // The threshold shows a recessed, unlit vault as the gate rises.
  put('block','#171920',0,5.6,-26,11.4,11.4,.6);
  const thresholdLight=new THREE.PointLight('#62cfa7',0,15);
  thresholdLight.position.set(0,2,-18);
  scene.add(thresholdLight);

  let seed=1847;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let row=0;row<46;row++) {
    for(let col=-2;col<=2;col++) {
      if(random()<.19) continue;
      const x=col*1.7+Math.sin(row*.16)*.65+random()*.45;
      put('drum',random()<.55?'#746e67':'#5b5a57',x,-.035,-15+row*1.08,
        1.6+random()*.6,.14,1+random()*.6,0,random()*.5);
    }
    if(row%5===0) put('drum','#454e50',5*(row%2?1:-1),-.03,-15+row,1.9,.07,3,0,.4,wet);
  }
  for(const side of [-1,1]) {
    for(const [cx,cz,count] of [[12,24,6],[22,30,5],[31,17,7],[34,4,5],[21,-10,4]]) {
      for(let i=0;i<count;i++) {
        const x=side*(cx+(i%3)*1.9+random()), z=cz+Math.floor(i/3)*2.8+random();
        const h=.7+random()*.95, lean=(random()-.5)*.4, c=random()<.5?trim:'#686c67';
        put('shard',moss,x,.03,z+.6,1.8,.43,2.8,0,random()*.2);
        put('drum',slate,x,.12,z,1.45,.25,1);
        if(i%3===0) {
          put('block',c,x,h*.5,z,.29,h,.32,lean);
          put('block',c,x-Math.sin(lean)*h*.2,h*.71,z,1.03,.27,.32,lean);
        } else {
          put('lancet',c,x,.12,z,.85+random()*.3,h,.3,lean);
          for(let j=0;j<2;j++) put('block',slate,x-Math.sin(lean)*h*.45,h*.45+j*.14,z+.32,.43-j*.13,.045,.03,lean);
        }
        for(let j=0;j<4;j++) put('shard','#776b51',x+random()-.5,.16,z+.8+random(),.1,.45,.12,random()-.5);
        if(i%4===0) {
          put('drum','#beae8f',x+.6,.25,z+.42,.2,.48,.2);
          put('shard','#ffc780',x+.6,.53,z+.42,.09,.16,.09,0,0,glow);
        }
      }
    }
    const x=side*32,z=-11;
    wall(x,1.35,z,4.4,2.7,3.4);
    put('lancet',slate,x,2.55,z-2,4.9,2.15,4.1);
    put('lancet','#28272c',x,.08,z+1.72,1.8,2.45,.12);
    for(let i=0;i<10;i++) {
      const fx=x+(i-4)*.68;
      put('branch',iron,fx,.62,z+3,.12,1.24,.12);
      put('spire',iron,fx,1.33,z+3,.22,.32,.22);
    }
    put('block',iron,x+.3,.83,z+3,6.35,.1,.1);
    const camp=side*15;
    put('block',wood,camp,.55,-11.6,2,1.1,1.4);
    for(const dx of [-.7,.7]) put('block',iron,camp+dx,.56,-11.6,.14,1.14,1.44);
    put('drum',wood,camp+side*1.8,.74,-12.5,1.2,1.48,1.2);
    for(const y of [.33,1.1]) put('drum',iron,camp+side*1.8,y,-12.5,1.24,.13,1.24);
    put('shield','#733c41',camp,.04,-10.81,1.02,1.26,.15,.17);
    put('branch',wood,camp-side*1.2,1.42,-12,.13,2.9,.13,.18);
    put('shard',trim,camp-side*1.2-.28,2.98,-12,.22,.66,.16,.18);
    for(const [tx,tz] of [[35,-4],[36,22],[28,-14]]) {
      let base=new THREE.Vector3(side*tx,0,tz);
      const limb=(from,to,r)=>{
        const delta=to.clone().sub(from),mid=from.clone().lerp(to,.5);
        put('branch','#443e3b',mid.x,mid.y,mid.z,r,delta.length(),r,
          -Math.atan2(Math.hypot(delta.x,delta.z),delta.y),-Math.atan2(delta.z,delta.x));
      };
      for(let i=0;i<4;i++) {
        const tip=base.clone().add(new THREE.Vector3(random()*1.5-.65,1.1+random(),random()-.5));
        limb(base,tip,.95-i*.19);
        const fork=tip.clone().add(new THREE.Vector3((i%2?1:-1)*(1+random()),.7,random()-.5));
        limb(tip,fork,.34-i*.055);
        limb(fork,fork.clone().add(new THREE.Vector3(random()-.5,.85,random()-.5)),.14);
        base=tip;
      }
    }
  }
  const instances=[];
  for(const {form,material,parent,parts} of batches.values()) {
    const mesh=new THREE.InstancedMesh(forms[form],material,parts.length);
    parts.forEach(([matrix,color],i)=>{
      mesh.setMatrixAt(i,matrix);
      mesh.setColorAt(i,new THREE.Color(color));
    });
    mesh.computeBoundingSphere();
    parent.add(mesh);
    instances.push(mesh);
  }
  return {
    update(camera,target,lift) {
      camera.updateMatrixWorld();
      targetView.value.copy(target).applyMatrix4(camera.matrixWorldInverse);
      thresholdLight.intensity=lift*1.8;
    },
    dispose() { instances.forEach(mesh=>mesh.dispose()); },
  };
}
