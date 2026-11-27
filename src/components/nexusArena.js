import * as T from 'three';
import { escapePod, stations, targetAt, terminalActivationRadius, terminalActivationTime, tickBattle } from './nexusBattle';

import { buildNexusProjection, nexusProjectionHeight } from './nexusProjection';
import { addCommandTerminal, commandTerminalSize } from './omegaCommandCenter';
import { buildOmegaStationExterior } from './omegaStationExterior';
import { buildOmegaEscapeCapsule } from './omegaEscapeCapsule';

const TAU=Math.PI*2;
const liftSector=6;
const liftAngle=liftSector*TAU/16;
const liftX=Math.sin(liftAngle),liftZ=Math.cos(liftAngle);
export const nexusArrival={
  x:14*liftX,z:14*liftZ,heading:liftAngle+Math.PI,offset:[10*liftX,6,10*liftZ],
};

export function buildNexusArena(parent,{box,cylinder,sphere},battle){
  const root=new T.Group();
  parent.add(root);
  const exterior=buildOmegaStationExterior(parent,{box});
  const steel='#374456',trim='#93a4b4',dark='#172032',gold='#e9ae57';
  const cyan='#5deaff',violet='#b269ff';
  function glow(color,opacity=1){
    return new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1});
  }
  function mesh(geo,material,x=0,y=0,z=0,parent=root){
    const o=new T.Mesh(geo,material);o.position.set(x,y,z);parent.add(o);return o;
  }
  function band(radius,tube,mat,y,parent=root){
    const o=mesh(new T.TorusGeometry(radius,tube,8,64),mat,0,y,0,parent);
    o.rotation.x=Math.PI/2;return o;
  }
  cylinder(root,17,.45,steel,0,-.23,0,64);
  for(const r of [4.4,8,13.6,16.7])band(r,.045,glow('#74a0ac'),.025);
  const core=new T.Group();root.add(core);core.position.y=3.7;
  const coreRings=[0,1,2].map(i=>band(2.18+i*.38,.065,glow(i===1?gold:cyan),0,core));
  const projection=buildNexusProjection(core);
  cylinder(root,3.6,.75,dark,0,.37,0,48);
  cylinder(root,2.9,.9,steel,0,1,0,32);
  band(2.95,.1,glow(violet),1.48);
  const dummy=new T.Object3D();
  const orbitalBands=[band(2.4,.035,glow(violet,.8),-1.9,core),band(2.95,.045,glow(cyan,.7),.65,core)];
  const projectionDust=new T.InstancedMesh(new T.TetrahedronGeometry(.038),glow('#b8faff',.8),1200);
  projectionDust.frustumCulled=false;core.add(projectionDust);
  const tethers=[-1,1].map(side=>{
    const curve=new T.CatmullRomCurve3([new T.Vector3(side*.45,-2.23,0),new T.Vector3(side*.85,-1.9,.25),new T.Vector3(side*.47,-1.05,0)]);
    return mesh(new T.TubeGeometry(curve,16,.035,5,false),glow(violet,.58),0,0,0,core);
  });
  const releaseWave=band(1,.028,glow(violet,.54),.14);
  releaseWave.visible=false;
  const windMaterial=glow('#b1edff',.78);
  const pullWind=new T.InstancedMesh(
    new T.CapsuleGeometry(.035,.75,2,6).rotateX(Math.PI/2),windMaterial,18);
  pullWind.visible=false;
  pullWind.frustumCulled=false;
  root.add(pullWind);
  const windStreak=new T.Object3D();
  function updatePullWind(pull,pos,reduced){
    pullWind.visible=Boolean(pull);
    if(!pull)return;
    pullWind.position.copy(pos);
    pullWind.rotation.y=Math.atan2(-pos.x,-pos.z);
    const time=reduced?0:pull.elapsed;
    for(let i=0;i<pullWind.count;i++){
      const progress=(i/pullWind.count+time*1.65)%1;
      const angle=i*2.39996+time*3.2;
      const radius=1.17-.61*progress;
      windStreak.position.set(radius*Math.cos(angle),.99+radius*.72*Math.sin(angle),-2.25+4.45*progress);
      windStreak.rotation.set(-.14*Math.sin(angle),.14*Math.cos(angle),0);
      const length=.36+1.28*Math.sin(Math.PI*progress);
      windStreak.scale.set(.8,.8,length);
      windStreak.updateMatrix();
      pullWind.setMatrixAt(i,windStreak.matrix);
    }
    pullWind.instanceMatrix.needsUpdate=true;
  }
  const servers=[],turrets=[],doors=[],covers=[],bridges=[],drones=[];
  const terminals=[];
  const terminalRings=[];
  const ringSegments=120;
  const terminalRing=()=>new T.RingGeometry(terminalActivationRadius-.13,terminalActivationRadius,ringSegments,1,-Math.PI/2);
  const pendingRingGeometry=terminalRing();
  const pendingRing=glow('#ff414d');
  const activeRing=glow('#56f398');
  const walls=[];
  const panelGeometry=new T.PlaneGeometry();
  const pane=new T.ShaderMaterial({
    transparent:true,depthWrite:false,side:T.DoubleSide,
    vertexShader:`
      varying vec2 panelUv;
      void main(){
        panelUv=uv;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }`,
    fragmentShader:`
      varying vec2 panelUv;
      void main(){
        vec2 margin=min(panelUv,1.-panelUv);
        float rim=1.-smoothstep(0.,.065,min(margin.x,margin.y));
        float diagonal=panelUv.x-.33*panelUv.y;
        float reflection=1.-smoothstep(.015,.07,abs(diagonal-.38));
        vec3 tint=mix(vec3(.015,.10,.21),vec3(.07,.46,.64),max(rim*.6,reflection));
        gl_FragColor=vec4(tint,.065+.15*rim+.12*reflection);
        #include <colorspace_fragment>
      }`,
  });
  const frame=glow('#345976');
  const edge=glow('#8aefff');
  const profileGeometry=new T.BoxGeometry();
  function profile(parent,w,h,d,material,x,y,z){
    const piece=mesh(profileGeometry,material,x,y,z,parent);
    piece.scale.set(w,h,d);
    return piece;
  }
  function glassWall(parent,x,z,angle,width,height,bottom){
    const wall=new T.Group();
    parent.add(wall);
    wall.position.set(x,bottom,z);
    wall.rotation.y=angle;
    walls.push(wall);
    const half=width/2;
    mesh(panelGeometry,pane,0,height/2,0,wall).scale.set(width-.1,height-.1,1);
    for(const side of [-1,1]){
      profile(wall,.16,height,.24,frame,side*half,height/2,0);
      profile(wall,.037,height-.27,.038,edge,side*(half-.13),height/2,-.12);
    }
    for(const y of [.04,height-.04]){
      profile(wall,width,.18,.26,frame,0,y,0);
      profile(wall,width-.24,.035,.035,edge,0,y,-.135);
    }
    const signal=glow(cyan,.66);
    servers.push(profile(wall,width-.34,.035,.045,signal,0,height*.37,-.08));
  }
  for(let i=0;i<16;i++){
    if(i===0||i===liftSector)continue; // Leave the escape corridor and arrival lift open.
    const a=i*TAU/16;
    glassWall(root,Math.sin(a)*16.6,Math.cos(a)*16.6,a,6.57,6.2,.05);
  }
  for(const [i,[x,z]] of stations.entries()){
    const p=new T.Group();root.add(p);p.position.set(x,0,z);p.rotation.y=Math.atan2(-x,-z);
    addCommandTerminal(p,box,{id:['I','II','III'][i],color:[cyan,gold,violet][i]});
    terminals.push(p);
    mesh(pendingRingGeometry,pendingRing,0,.038,0,p).rotation.x=-Math.PI/2;
    const progress=mesh(terminalRing(),activeRing,0,.048,0,p);
    progress.rotation.x=-Math.PI/2;
    progress.geometry.setDrawRange(0,0);
    terminalRings.push(progress);
    const turret=new T.Group();root.add(turret);turret.position.set(x*1.34,.4,z*1.34);
    band(.82,.035,glow('#345976'),.028).position.set(turret.position.x,.028,turret.position.z);
    sphere(turret,.54,steel,0,0,0);box(turret,.34,.32,1.25,dark,0,0,.76);turrets.push(turret);
    const cover=box(root,2.6,1.7,1,steel,x*.68,-1,z*.68);covers.push(cover);
    const bridge=box(root,2.2,.27,3,'#5b7285',x*.97,.08,z*.97+2.8);bridges.push(bridge);
    bridge.visible=false;
    const drone=new T.Group();root.add(drone);sphere(drone,.48,dark,0,0,0);
    box(drone,1.6,.13,.35,trim,0,.05,0);sphere(drone,.16,gold,0,0,.42);drones.push(drone);
  }
  box(root,5,.34,11,dark,0,-.16,20.5);
  const shipDoorWidth=2.65;
  const shipDoorClosedX=shipDoorWidth/2;
  for(const side of [-1,1]){
    for(let i=0;i<3;i++)glassWall(root,side*2.65,17.5+i*3.3,side*Math.PI/2,3.3,3,.05);
    doors.push(box(root,shipDoorWidth,4,.4,steel,side*shipDoorClosedX,2,16.5));
  }
  // Arrival lift between terminals II and III.
  const liftDoor=new T.Group();
  root.add(liftDoor);
  liftDoor.rotation.y=liftAngle-Math.PI/2;
  box(liftDoor,.42,4,6.2,dark,16.72,2,0);
  box(liftDoor,.16,4.4,6.6,trim,16.43,2.2,0);
  for(const side of [-1,1])box(liftDoor,.18,3.7,2.85,steel,16.34,1.95,side*1.48);
  profile(liftDoor,.08,3.15,.08,edge,16.22,2,0);
  for(const z of [-2.05,2.05])profile(liftDoor,.12,3.85,.12,edge,16.18,2,z);
  const capsule=buildOmegaEscapeCapsule(parent,{box});
  const { pod }=capsule;
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
  const localGates=stations.map(([x,z])=>{
    const gate=box(root,2.7,2.3,.34,dark,x*.8,4.6,z+4.1);
    gate.visible=false;
    return gate;
  });
  const opening=new T.Vector2();
  function gateClosed(i){
    const g=localGates[i];
    const doorwayOccupied=g.position.y>2.65&&Math.abs(opening.x-g.position.x)<1.7&&Math.abs(opening.y-g.position.z)<.6;
    return !doorwayOccupied&&battle.mode==='fight'&&[2,3].includes(battle.phase)&&Math.floor(battle.time/8)%3===i;
  }
  function barriersUp(){return battle.mode==='fight' && [0,2,4].includes(battle.phase);}
  function coverUp(i){return battle.mode==='fight' && battle.phase!==1 && !battle.done.includes(i);}
  function canWalk(x,z){
    const liftDepth=x*liftX+z*liftZ;
    const liftSide=z*liftX-x*liftZ;
    if(liftDepth>13.65&&liftDepth<16.15&&Math.abs(liftSide)<2.5)return true;
    if(Math.abs(x)<escapePod.passageHalfWidth&&z>15.4&&z<escapePod.z+.1){
      const across=x/(escapePod.radius+.24);
      const along=(z-pod.position.z)/(escapePod.radius*escapePod.lengthScale+.24);
      return battle.mode==='escape'&&Math.hypot(across,along)>=1;
    }
    if(Math.hypot(x,z)>16||Math.hypot(x,z)<3.95)return false;
    if(barriersUp()&&Math.abs(x-6)<.55&&Math.abs(z+6)<2.4)return false;
    if(localGates.some((p,i)=>gateClosed(i)&&Math.abs(x-p.position.x)<1.65&&Math.abs(z-p.position.z)<.52))return false;
    if(battle.phase===2&&battle.mode==='fight'&&bridges.some((p,i)=>p.position.y<-.3&&Math.abs(x-p.position.x)<1.3&&Math.abs(z-p.position.z)<1.7))return false;
    if(stations.some(([sx,sz],i)=>coverUp(i)&&Math.abs(x-sx*.68)<1.62&&Math.abs(z-sz*.68)<.86))return false;
    return !terminals.some(terminal=>{
      const dx=x-terminal.position.x,dz=z-terminal.position.z;
      const sin=Math.sin(terminal.rotation.y),cos=Math.cos(terminal.rotation.y);
      return Math.abs(dx*cos-dz*sin)<commandTerminalSize.width/2+.22 &&
        Math.abs(dx*sin+dz*cos)<commandTerminalSize.depth/2+.22;
    });
  }
  const cutawayWalls=[...walls,...doors,liftDoor];
  const architecture=[...cutawayWalls,...covers];
  const gameplayWalls=cutawayWalls.map(object=>{
    const meshes=[];
    object.traverse(mesh=>{
      if(!mesh.isMesh)return;
      if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
      meshes.push(mesh);
    });
    return {object,meshes};
  });
  const hidden=new Set(), sight=new T.Ray(), subject=new T.Vector3(), hit=new T.Vector3(), bounds=new T.Box3();
  const localSight=new T.Ray(), inverseWorld=new T.Matrix4();
  function cutaway(eye,target){
    for(const object of hidden)object.visible=true;
    hidden.clear();
    if(!root.visible)return;
    const cinematic=['liberation','autonomy','betrayal','defeated'].includes(battle.mode);
    subject.copy(target);
    sight.origin.copy(eye);
    sight.direction.subVectors(subject,eye).normalize();
    const distance=eye.distanceToSquared(subject);
    if(!cinematic){
      for(const {object,meshes} of gameplayWalls){
        object.updateWorldMatrix(true,true);
        const blocksView=meshes.some(mesh=>{
          localSight.copy(sight).applyMatrix4(inverseWorld.copy(mesh.matrixWorld).invert());
          const box=mesh.geometry.boundingBox;
          if(box.containsPoint(localSight.origin))return true;
          return localSight.intersectBox(box,hit)&&hit.applyMatrix4(mesh.matrixWorld).distanceToSquared(eye)<distance;
        });
        if(blocksView){object.visible=false;hidden.add(object);}
      }
      return;
    }
    for(const object of architecture){
      // Keep the silhouette clear even when a structure only clips the edge of the shot.
      bounds.setFromObject(object).expandByScalar(2.4);
      if(bounds.containsPoint(eye)||(sight.intersectBox(bounds,hit)&&eye.distanceToSquared(hit)<distance)){
        object.visible=false;hidden.add(object);
      }
    }
  }
  return {floor:()=>0,canWalk,target:(x,z)=>targetAt(battle,x,z),cutaway,cinematicFocus:projection.focus,
    update(dt,reduced,m,pos,distance,player){
      tickBattle(battle,dt,pos,distance);
      opening.set(pos.x,pos.z);
      const b=battle,t=b.elapsed,fighting=b.mode==='fight';
      const flying=b.mode==='flight'||b.mode==='completed';
      root.visible=!flying;
      exterior.visible=flying;
      if(flying){
        pod.position.set(0,b.flight*.5,escapePod.z+b.flight*2);
        capsule.update(b.flight,reduced);
        return;
      }
      const escape=b.mode==='escape';
      updatePullWind(b.pull,pos,reduced);
      terminalRings.forEach((ring,i)=>{
        const activated=b.done.includes(i);
        const progress=activated?1:b.hold===i?T.MathUtils.clamp(b.holding/terminalActivationTime,0,1):0;
        ring.geometry.setDrawRange(0,6*Math.floor(progress*ringSegments));
      });
      const hostile=fighting||b.mode==='betrayal',offline=escape;
      const liberation=b.choice!==null;
      const overload=fighting&&b.phase===4&&(b.hit>0||b.done.length>=2);
      const color=offline?'#344052':overload?'#fff1ff':hostile?'#b768e8':liberation?violet:cyan;
      const reveal=b.mode==='liberation'?T.MathUtils.clamp(b.materialization/5,0,1):1;
      const dissolving=b.mode==='defeated';
      const decay=dissolving?1-T.MathUtils.clamp((b.lineIndex+b.lineTime*.15)/10,0,1):1;
      projection.update(b,dt,player,reduced,{color,hostile,overload,reveal,integrity:decay,offline,liberation});
      const animationTime=reduced?0:t;
      const materializing=b.mode==='liberation';
      const power=materializing?2.5:hostile?1.6:1;
      orbitalBands.forEach((ring,i)=>{
        ring.visible=!offline&&decay>.04;
        ring.material.color.set(color);
        if(!reduced){ring.rotation.y+=dt*power*(i?-.24:.32);ring.rotation.x=Math.PI/2+(i?.16:-.12);}
      });
      coreRings.forEach((ring,i)=>{
        if(!reduced&&!offline){ring.rotation.z+=dt*power*(i+1)*.28;ring.rotation.y+=dt*(i%2?-.22:.27);}
        ring.material.color.set(i===1?gold:color);
      });
      tethers.forEach((line,i)=>{
        line.visible=!offline&&decay>.04;
        line.material.color.set(hostile?'#ff6675':color);
        line.material.opacity=(.46+.18*Math.sin(animationTime*3+i))*decay;
      });
      const waveProgress=(b.materialization-4.9)/1.3;
      releaseWave.visible=!reduced&&materializing&&waveProgress>=0&&waveProgress<1;
      if(releaseWave.visible){
        releaseWave.scale.setScalar(.9+waveProgress*16);
        releaseWave.material.opacity=.54*(1-waveProgress);
      }
      projectionDust.visible=!offline&&(!dissolving||decay>.01);
      projectionDust.count=dissolving&&!reduced?1200:96;
      projectionDust.material.color.set(overload?'#ff666e':color);
      if(projectionDust.visible){
        for(let i=0;i<projectionDust.count;i++){
          const u=((i*.618034+animationTime*.26)%1),angle=i*2.39996+animationTime*.5;
          const height=projection.figure.position.y+((i*37)%101)/101*nexusProjectionHeight;
          const radial=.45+((i*17)%31)/31*1.15;
          const spread=materializing?(1-reveal)*(1-u)*3:overload?u*.9:0;
          const remaining=dissolving?1-(1-decay)*u:1;
          dummy.position.set(Math.cos(angle)*(radial+spread)*remaining,height*remaining,Math.sin(angle)*(radial+spread)*remaining);
          dummy.scale.setScalar(dissolving?decay*(.45+u):.5+u*.75);
          dummy.updateMatrix();projectionDust.setMatrixAt(i,dummy.matrix);
        }
        projectionDust.instanceMatrix.needsUpdate=true;
      }
      dummy.scale.setScalar(1);
      const containment=hostile||b.mode==='lost';
      const signalOpacity=containment&&!reduced?.65+.3*Math.sin(t*2):.65;
      servers.forEach((s,i)=>{
        s.material.color.set(offline||(dissolving&&i/servers.length>decay)?'#243240':containment?'#ff5744':cyan);
        s.material.opacity=signalOpacity;
      });
      doors.forEach((door,i)=>{
        const closedX=(i?1:-1)*shipDoorClosedX;
        door.position.x=escape?T.MathUtils.damp(door.position.x,(i?1:-1)*4,4,dt):closedX;
      });
      covers.forEach((p,i)=>{p.position.y=T.MathUtils.damp(p.position.y,coverUp(i)?.85:-1,5,dt);});
      bridges.forEach((p,i)=>{
        p.visible=fighting&&b.phase===2;
        const occupied=Math.abs(pos.x-p.position.x)<1.4&&Math.abs(pos.z-p.position.z)<1.8;
        p.position.y=T.MathUtils.damp(p.position.y,p.visible&&!occupied&&Math.floor(b.time/6)%3===i?-.65:.08,4,dt);
      });
      localGates.forEach((gate,i)=>{
        const closed=gateClosed(i);
        gate.visible=closed;
        gate.position.y=closed?1.15:4.6;
      });
      turrets.forEach(turret=>{
        turret.position.y=T.MathUtils.damp(turret.position.y,hostile?1.7:-.9,4,dt);
        if(hostile)turret.lookAt(pos.x,1,pos.z);
      });
      drones.forEach((drone,i)=>{
        drone.visible=fighting;
        const angle=i*2.1+(reduced?0:t*.48);
        drone.position.set(Math.cos(angle)*9,2+b.gravity*.6,Math.sin(angle)*9);
        if(i===0&&b.attack?.kind==='drone'){
          const descent=T.MathUtils.clamp(b.attack.age/b.attack.warn,0,1);
          drone.position.set(b.attack.x,4-3.3*descent,b.attack.z);
        }
      });
      barrier.visible=barriersUp();
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
    },pod};
}

