import * as T from 'three';
import { stations, targetAt, tickBattle } from './nexusBattle';

const TAU=Math.PI*2;
export function buildNexusArena(root,{box,cylinder,sphere},battle){
  const steel='#374456',trim='#93a4b4',dark='#172032',gold='#e9ae57';
  const cyan='#5deaff',violet='#b269ff';
  function glow(color,opacity=1){
    return new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1});
  }
  function mesh(geo,material,x=0,y=0,z=0,parent=root){
    const o=new T.Mesh(geo,material);o.position.set(x,y,z);parent.add(o);return o;
  }
  function bar(parent,a,b,width,color){
    const v=new T.Vector3(...a),w=new T.Vector3(...b),delta=w.clone().sub(v);
    const o=box(parent,width,delta.length(),width,color,0,0,0);
    o.position.copy(v).lerp(w,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;
  }
  function band(radius,tube,mat,y,parent=root){
    const o=mesh(new T.TorusGeometry(radius,tube,8,64),mat,0,y,0,parent);
    o.rotation.x=Math.PI/2;return o;
  }
  cylinder(root,17,.45,steel,0,-.23,0,64);
  for(const r of [4.4,8,13.6,16.7])band(r,.045,glow('#74a0ac'),.025);
  const core=new T.Group();root.add(core);core.position.y=5.2;
  const heart=mesh(new T.IcosahedronGeometry(1.75,2),glow(cyan,.82),0,0,0,core);
  const lattice=glow('#ccf8ff',.62);lattice.wireframe=true;
  mesh(new T.IcosahedronGeometry(2.12,1),lattice,0,0,0,core);
  const rings=[0,1,2].map(i=>band(2.5+i*.45,.08,glow(i===1?gold:cyan),0,core));
  cylinder(root,3.6,.75,dark,0,.37,0,48);
  cylinder(root,2.9,.9,steel,0,1,0,32);
  band(2.95,.1,glow(violet),1.48);
  const satellites=new T.InstancedMesh(new T.OctahedronGeometry(.16),glow('#eed5ff'),56);
  satellites.frustumCulled=false;
  core.add(satellites);
  const dummy=new T.Object3D();
  const servers=[],turrets=[],arms=[],doors=[],covers=[],bridges=[],drones=[],screens=[],shutters=[],modules=[];
  const walls=[];
  for(let i=0;i<16;i++){
    const a=i*TAU/16,unitX=Math.sin(a),unitZ=Math.cos(a);
    const rack=new T.Group();root.add(rack);rack.position.set(unitX*16.6,0,unitZ*16.6);rack.rotation.y=a;
    walls.push(rack);
    if(i!==0){
      box(rack,1.45,7.8,1.2,dark,0,3.9,0);
      for(let j=0;j<5;j++)box(rack,1.22,.42,.17,steel,0,1+j*1.18,-.69);
      servers.push(mesh(new T.BoxGeometry(.12,5,.1),glow(cyan),-.49,3.7,-.8,rack));
      box(rack,5.9,.25,.55,trim,2.5,7.6,0).rotation.y=.18;
      bar(rack,[0,7.4,0],[0,10,-6],.18,steel);
      bar(rack,[0,10,-6],[0,9,-13.4],.08,'#74819c');
      const glass=mesh(new T.PlaneGeometry(4.9,4.6),glow('#456193',.11),2.8,4.5,0,rack);
      glass.material.side=T.DoubleSide;
      for(let vent=0;vent<4;vent++)box(rack,2,.08,.25,trim,2.3,1+vent*.2,0);
    }
    if(i%4===2){
      const arm=new T.Group();rack.add(arm);arm.position.set(0,3.6,-1);
      bar(arm,[0,0,0],[0,1,-1.9],.36,gold);sphere(arm,.42,steel,0,1,-1.9);
      bar(arm,[0,1,-1.9],[0,-.5,-3.4],.27,trim);arms.push(arm);
    }
  }
  const stars=new T.BufferGeometry(),coords=[];
  for(let i=0;i<450;i++){
    const a=i*2.39996,y=(i*139%233)/233*42-8;
    coords.push(45*Math.cos(a),y,45*Math.sin(a));
  }
  stars.setAttribute('position',new T.Float32BufferAttribute(coords,3));
  root.add(new T.Points(stars,new T.PointsMaterial({color:'#c9dbff',size:.09})));
  for(const [i,[x,z]] of [...stations,[0,11]].entries()){
    const p=new T.Group();root.add(p);p.position.set(x,0,z);p.rotation.y=Math.atan2(-x,-z);
    cylinder(p,1.25,.2,trim,0,.1,0,8);box(p,1.35,1,.88,dark,0,.66,0);
    const screen=mesh(new T.BoxGeometry(1.55,.8,.15),glow(cyan),0,1.55,0,p);screen.rotation.x=-.25;screens.push(screen);
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;
    const c=canvas.getContext('2d');c.fillStyle='#102036';c.fillRect(0,0,128,64);c.fillStyle='#e2f9ff';c.font='bold 48px monospace';c.textAlign='center';c.fillText(['I','II','III','Ω'][i],64,49);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const sign=new T.Sprite(new T.SpriteMaterial({map:texture}));p.add(sign);sign.position.y=2.7;sign.scale.set(1.7,.85,1);
    if(i<3){
      const turret=new T.Group();root.add(turret);turret.position.set(x*1.34,.4,z*1.34);
      cylinder(root,.85,.28,dark,turret.position.x,.15,turret.position.z);
      sphere(turret,.54,steel,0,0,0);box(turret,.34,.32,1.25,dark,0,0,.76);turrets.push(turret);
      band(1.45,.07,glow('#9297dd'),.14,p);
      const lead=bar(root,[x,.06,z],[x*.3,.06,z*.3],.13,'#5fd3d3');
      lead.material=glow('#68ccd0');
      const cover=box(root,2.6,1.7,1,steel,x*.68,.85,z*.68);covers.push(cover);
      const bridge=box(root,2.2,.27,3,'#5b7285',x*.97,.08,z*.97+2.8);bridges.push(bridge);
      const drone=new T.Group();root.add(drone);sphere(drone,.48,dark,0,0,0);
      box(drone,1.6,.13,.35,trim,0,.05,0);sphere(drone,.16,gold,0,0,.42);drones.push(drone);
      const bay=new T.Group();root.add(bay);bay.position.set(x*1.38,0,z*1.38+2.4);
      walls.push(bay);
      box(bay,2.6,.25,1.8,steel,0,2.6,0);
      for(const side of [-1,1])box(bay,.22,2.7,1.8,dark,side*1.23,1.3,0);
      shutters.push(box(bay,2.3,1.75,.15,trim,0,1.28,.93));
      const module=new T.Group();root.add(module);module.position.set(x*.92,0,z-2.4);
      box(module,.9,.64,.74,steel,0,.33,0);
      box(module,.16,.7,.8,gold,0,.33,0);modules.push(module);
    }
  }
  box(root,5,.34,11,dark,0,-.16,20.5);
  for(const side of [-1,1]){
    const wall=new T.Group();root.add(wall);walls.push(wall);
    box(wall,.32,3,10,steel,side*2.65,1.3,20.8);
    for(let j=0;j<5;j++)box(wall,.18,.17,.8,cyan,side*2.45,.75,17.4+j*1.7);
    doors.push(box(root,2.65,4,.4,steel,side*1.33,2,16.5));
  }
  const pod=new T.Group();root.add(pod);pod.position.z=24;
  const hull=sphere(pod,2.1,trim,0,1.6,0);hull.scale.set(1,.85,1.55);
  const window=sphere(pod,1.4,'#295370',0,2.1,.1);window.scale.z=1.55;
  const ghosts=[-1,1].map(s=>mesh(heart.geometry,glow(violet,.23),s*7,3,-5));
  const warnMaterial=glow(gold,.64);
  const disc=mesh(new T.CircleGeometry(1,40),warnMaterial),strip=mesh(new T.PlaneGeometry(2.3,16),warnMaterial);
  disc.rotation.x=strip.rotation.x=-Math.PI/2;
  const wave=mesh(new T.RingGeometry(.01,1,80),warnMaterial,0,.16,0);
  wave.rotation.x=-Math.PI/2;
  let lastWave=null;
  const barrier=box(root,.34,1.7,4,'#ab65cd',6,.85,-6);
  const exhaust=new T.InstancedMesh(new T.OctahedronGeometry(.19),glow('#d6f2ff',.57),24);
  exhaust.frustumCulled=false;
  root.add(exhaust);
  const conduit=mesh(new T.CylinderGeometry(.09,.09,1,8),glow('#ff684e'));
  const up=new T.Vector3(0,1,0),tip=new T.Vector3(),origin=new T.Vector3(),axis=new T.Vector3();
  const localGates=stations.map(([x,z])=>box(root,2.7,2.3,.34,dark,x*.8,1.15,z+4.1));
  const opening=new T.Vector2();
  function gateClosed(i){
    const g=localGates[i];
    const doorwayOccupied=g.position.y>2.65&&Math.abs(opening.x-g.position.x)<1.7&&Math.abs(opening.y-g.position.z)<.6;
    return !doorwayOccupied&&battle.mode==='fight'&&[2,3].includes(battle.phase)&&Math.floor(battle.time/8)%3===i;
  }
  function barriersUp(){return battle.mode==='fight' && [0,2,4].includes(battle.phase);}
  function coverUp(i){return battle.mode==='fight' && battle.phase!==1 && !battle.done.includes(i);}
  function canWalk(x,z){
    if(Math.abs(x)<2.16 && z>15.4 && z<24.1)return battle.mode==='escape';
    if(Math.hypot(x,z)>16||Math.hypot(x,z)<3.95)return false;
    if(barriersUp()&&Math.abs(x-6)<.55&&Math.abs(z+6)<2.4)return false;
    if(localGates.some((p,i)=>gateClosed(i)&&Math.abs(x-p.position.x)<1.65&&Math.abs(z-p.position.z)<.52))return false;
    if(battle.phase===2&&battle.mode==='fight'&&bridges.some((p,i)=>p.position.y<-.3&&Math.abs(x-p.position.x)<1.3&&Math.abs(z-p.position.z)<1.7))return false;
    if(stations.some(([sx,sz],i)=>coverUp(i)&&Math.abs(x-sx*.68)<1.62&&Math.abs(z-sz*.68)<.86))return false;
    return ![...stations,[0,11]].some(([sx,sz])=>Math.hypot(sx-x,sz-z)<1.04);
  }
  const architecture=[...walls,...doors,...localGates,...covers];
  const hidden=new Set(), sight=new T.Ray(), subject=new T.Vector3(), hit=new T.Vector3(), bounds=new T.Box3();
  function cutaway(eye){
    const flight=battle.mode==='flight'||battle.mode==='completed';
    const cinematic=flight||['liberation','autonomy','betrayal','defeated'].includes(battle.mode);
    for(const object of hidden)object.visible=true;
    hidden.clear();
    if(!cinematic)return;
    if(flight){pod.getWorldPosition(subject);subject.y+=1.6;}
    else core.getWorldPosition(subject);
    sight.origin.copy(eye);
    sight.direction.subVectors(subject,eye).normalize();
    const distance=eye.distanceToSquared(subject);
    for(const object of architecture){
      // Keep the silhouette clear even when a structure only clips the edge of the shot.
      bounds.setFromObject(object).expandByScalar(flight?1.7:2.4);
      if(bounds.containsPoint(eye)||(sight.intersectBox(bounds,hit)&&eye.distanceToSquared(hit)<distance)){
        object.visible=false;hidden.add(object);
      }
    }
  }
  return {floor:()=>0,canWalk,target:(x,z)=>targetAt(battle,x,z),cutaway,
    update(dt,reduced,m,pos,distance){
      tickBattle(battle,dt,pos,distance);
      opening.set(pos.x,pos.z);
      const b=battle,t=b.elapsed,fighting=b.mode==='fight',escape=['escape','flight','completed'].includes(b.mode);
      const hostile=fighting||b.mode==='betrayal',offline=escape&&b.ending!=='restore';
      const color=offline?'#344052':b.ending==='restore'?'#55f39d':b.ending==='liberate'?violet:cyan;
      heart.material.color.set(color);
      const decay=b.mode==='defeated'&&b.ending==='liberate'?1-(b.lineIndex+1)/14:1;
      heart.scale.setScalar(decay*(reduced?1:1+.035*Math.sin(t*(b.line?5:1.6))));
      rings.forEach((r,i)=>{if(!reduced&&!offline){r.rotation.z+=dt*(i+1)*(hostile?.48:.14)*decay;r.rotation.y+=dt*(i%2?-.22:.27)*decay;}r.material.color.set(i===1?gold:color);});
      for(let i=0;i<satellites.count;i++){
        const a=i*2.4+(reduced?0:t*.19),r=2.5+(i%5)*.27+(b.phase===4?.55:0);
        dummy.position.set(r*Math.cos(a),1.4*Math.sin(i*1.1+(reduced?0:t*.4)),r*Math.sin(a));dummy.updateMatrix();satellites.setMatrixAt(i,dummy.matrix);
      }
      satellites.instanceMatrix.needsUpdate=true;satellites.visible=!offline;
      servers.forEach((s,i)=>{s.material.color.set(offline||(b.mode==='defeated'&&i/servers.length>decay)?'#243240':hostile?(b.phase===3?'#ed675f':'#c086ef'):cyan);});
      doors.forEach((d,i)=>{const desired=(i?1:-1)*(escape?4:hostile||b.mode==='defeated'?1.33:2.8);d.position.x=T.MathUtils.damp(d.position.x,desired,4,dt);});
      covers.forEach((p,i)=>{p.position.y=T.MathUtils.damp(p.position.y,coverUp(i)?.85:-1,5,dt);});
      bridges.forEach((p,i)=>{const occupied=Math.abs(pos.x-p.position.x)<1.4&&Math.abs(pos.z-p.position.z)<1.8;p.position.y=T.MathUtils.damp(p.position.y,fighting&&!occupied&&b.phase===2&&Math.floor(b.time/6)%3===i?-.65:.08,4,dt);});
      shutters.forEach(s=>{s.position.y=T.MathUtils.damp(s.position.y,hostile?2.8:1.28,2,dt);});
      modules.forEach((p,i)=>{const lift=fighting&&b.phase===1?b.gravity*.88:0;p.position.y=T.MathUtils.damp(p.position.y,lift,2,dt);p.rotation.z=reduced||!lift?0:.22*Math.sin(t+i);});
      localGates.forEach((g,i)=>{g.position.y=T.MathUtils.damp(g.position.y,gateClosed(i)?1.15:4.6,3,dt);});
      turrets.forEach((o,i)=>{const armed=hostile&&(b.phase===4||(b.phase===0&&!b.done.includes(i)));o.position.y=T.MathUtils.damp(o.position.y,armed?1.7:-.9,4,dt);if(armed)o.lookAt(pos.x,1,pos.z);});
      arms.forEach((o,i)=>{o.rotation.x=!reduced&&b.attack?.kind==='arm'?.32*Math.sin(t*3+i):0;});
      drones.forEach((d,i)=>{d.visible=fighting && (b.phase===4||b.phase===2||(b.phase===0&&!b.done.includes(i)));const a=i*2.1+(reduced?0:t*.48);d.position.set(Math.cos(a)*9,2+b.gravity*.6,Math.sin(a)*9);if(i===0&&b.attack?.kind==='drone')d.position.set(b.attack.x,Math.max(.7,4-b.attack.age),b.attack.z);});
      barrier.visible=barriersUp();ghosts.forEach(g=>{g.visible=fighting&&b.phase===4;});
      screens.forEach((s,i)=>s.material.color.set(b.done.includes(i)?'#5bffac':hostile?gold:cyan));
      disc.visible=strip.visible=wave.visible=conduit.visible=exhaust.visible=false;
      const a=b.attack;
      if(a){
        const o=a.kind==='wave'?wave:a.strip?strip:disc;o.visible=true;
        warnMaterial.color.set(a.age<a.warn?'#ffce58':'#ff684e');
        warnMaterial.opacity=a.age<a.warn?.42:.78;
        if(o===wave && lastWave!==a){
          const positions=wave.geometry.attributes.position;
          for(let i=0;i<=80;i++){
            const angle=TAU*i/80;
            for(let edge=0;edge<=1;edge++){
              const radius=Math.max(.01,a.radius+(edge?1.45:-1.45));
              positions.setXYZ(i+edge*81,Math.cos(angle)*radius,Math.sin(angle)*radius,0);
            }
          }
          positions.needsUpdate=true;wave.geometry.computeBoundingSphere();lastWave=a;
        }
        if(o!==wave){o.position.set(a.x,.32,a.z);if(o===disc)disc.scale.setScalar(a.radius);else {strip.rotation.set(-Math.PI/2,0,a.angle);strip.scale.y=a.length/16;}}
        if(a.age>=a.warn){
          if(a.kind==='laser'||a.kind==='arm'){
            const sx=Math.sin(a.angle),sz=Math.cos(a.angle);
            origin.set(a.x-sx*a.length/2,a.kind==='arm'?4:1.6,a.z-sz*a.length/2);
            tip.set(a.x+(a.strip?sx*a.length/2:0),.5,a.z+(a.strip?sz*a.length/2:0));
            axis.subVectors(tip,origin);conduit.scale.set(a.kind==='arm'?4:1,axis.length(),a.kind==='arm'?4:1);
            conduit.position.copy(origin).lerp(tip,.5);conduit.quaternion.setFromUnitVectors(up,axis.normalize());conduit.visible=true;
          }else{
            exhaust.visible=true;exhaust.material.color.set(a.kind==='arc'?cyan:'#d6f2ff');
            for(let i=0;i<exhaust.count;i++){
              const u=(i/24+(reduced?0:a.age*.6))%1,angle=i*2.4;
              const r=a.kind==='wave'?a.radius:u*a.radius;
              dummy.position.set((a.kind==='wave'?0:a.x)+Math.sin(angle)*r,.45+u*1.4,(a.kind==='wave'?0:a.z)+Math.cos(angle)*r);
              dummy.updateMatrix();exhaust.setMatrixAt(i,dummy.matrix);
            }
            exhaust.instanceMatrix.needsUpdate=true;
          }
        }
      }
      if(b.mode==='flight'||b.mode==='completed'){pod.position.z=24+b.flight*2;pod.position.y=b.flight*.5;}
    },pod};
}

