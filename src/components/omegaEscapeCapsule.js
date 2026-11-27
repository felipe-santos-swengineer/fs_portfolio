import * as T from 'three';
import { escapePod } from './nexusBattle';
import { createOmegaSuit } from './omegaSuit';

export function buildOmegaEscapeCapsule(parent, { box }) {
  const pod = new T.Group();
  pod.position.z = escapePod.z;
  parent.add(pod);

  const alloy = new T.MeshStandardMaterial({ color:'#a7bac9', metalness:.58, roughness:.42 });
  const dark = new T.MeshStandardMaterial({ color:'#24384d', metalness:.48, roughness:.5 });
  const glass = new T.MeshPhysicalMaterial({
    color:'#78bded', roughness:.12, metalness:.12, transparent:true,
    opacity:.2, depthWrite:false,
  });
  const signal = new T.MeshBasicMaterial({ color:'#8cf1ff' });
  function mesh(geometry, material, x, y, z) {
    const part = new T.Mesh(geometry,material);
    part.position.set(x,y,z);
    pod.add(part);
    return part;
  }

  const hull=mesh(new T.SphereGeometry(escapePod.radius,40,24),alloy,0,1.03,0);
  hull.scale.set(1,.52,escapePod.lengthScale);
  const canopy=mesh(new T.SphereGeometry(1.23,40,18,0,Math.PI*2,0,Math.PI/2),glass,0,1.96,.56);
  canopy.scale.set(1,1.03,1.47);
  canopy.renderOrder=2;
  const canopyFrame=mesh(new T.TorusGeometry(1.22,.052,8,48),dark,0,1.97,.56);
  canopyFrame.rotation.x=Math.PI/2;
  canopyFrame.scale.y=1.47;
  box(pod,.7,.13,.59,'#233548',0,1.99,.55);
  box(pod,.7,.67,.16,'#26364b',0,2.27,.22);
  const dash=box(pod,.97,.21,.44,'#25384e',0,2.21,1.38);
  dash.rotation.x=.2;
  mesh(new T.BoxGeometry(.66,.029,.23),signal,0,2.33,1.38).rotation.x=.2;
  for(const side of [-1,1])box(pod,.11,.15,.12,'#426179',side*.32,2.32,1.13);

  const engineBody=new T.CylinderGeometry(.46,.61,1.34,20);
  const nozzle=new T.TorusGeometry(.44,.075,8,24);
  const throat=new T.CircleGeometry(.39,24);
  const exhaustGeometry=new T.ConeGeometry(.43,2.65,20,1,true)
    .rotateX(-Math.PI/2).translate(0,0,-1.325);
  const exhaustGlow=new T.MeshBasicMaterial({
    color:'#36b9ff',transparent:true,opacity:.55,depthWrite:false,
    side:T.DoubleSide,blending:T.AdditiveBlending,
  });
  const exhaustCore=new T.MeshBasicMaterial({
    color:'#deffff',transparent:true,opacity:.78,depthWrite:false,
    side:T.DoubleSide,blending:T.AdditiveBlending,
  });
  const jets=[-1,1].map(side=>{
    const x=side*1.12, y=.94, rear=-2.77;
    mesh(engineBody,dark,x,y,-2.03).rotation.x=Math.PI/2;
    mesh(nozzle,alloy,x,y,rear);
    mesh(throat,dark,x,y,rear-.005).rotation.y=Math.PI;
    const ignition=mesh(throat,signal,x,y,rear-.014);
    ignition.rotation.y=Math.PI;
    const glow=mesh(exhaustGeometry,exhaustGlow,x,y,rear-.025);
    const core=mesh(exhaustGeometry,exhaustCore,x,y,rear-.035);
    ignition.visible=glow.visible=core.visible=false;
    return { ignition, glow, core };
  });

  let pilot;
  function update(flight,reduced) {
    if(flight===null)return;
    if(!pilot){
      pilot=createOmegaSuit();
      pilot.root.position.set(0,1.27,.58);
      pilot.root.scale.setScalar(.84);
      pod.add(pilot.root);
      pilot.limbs.forEach((limb,i)=>{limb.rotation.x=i%2===0?-1.22:-1.1;});
      jets.forEach(({ignition,glow,core})=>{ignition.visible=glow.visible=core.visible=true;});
    }
    const time=reduced?0:flight;
    const ignition=T.MathUtils.lerp(.6,1,T.MathUtils.smoothstep(flight,0,.45));
    jets.forEach(({glow,core},i)=>{
      const pulse=reduced?0:.12*Math.sin(time*29+i*1.7)+.045*Math.sin(time*53+i);
      glow.scale.set(1+pulse*.23,1+pulse*.23,ignition*(1+pulse));
      core.scale.set(.58,.58,ignition*(.71+pulse*.6));
    });
    pilot.limbs[1].rotation.x=-1.1+Math.sin(time*3)*.035;
    pilot.limbs[3].rotation.x=-1.1-Math.sin(time*3)*.035;
  }

  return { pod, update };
}
