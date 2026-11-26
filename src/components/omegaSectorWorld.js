import * as T from 'three';


const labConsoles=[['record0',-11,6,'001'],['record1',5,1,'002'],['record2',0,-8,'003'],['record3',11,5,'004'],['archive',0,-17,'Ω / MEM']];
const reactorConsoles=[['cooling',-10,0,'01 / H₂O'],['rings',0,-10,'02 / ◎'],['routing',10,0,'03 / ⇉'],['activate',0,10,'Ω / PWR']];
export function buildOmegaSector(root,{box,cylinder,sphere},map,initial){
  const lab=map==='omega-lab', consoles=lab?labConsoles:reactorConsoles;
  const dark=lab?'#364959':'#26313f', steel=lab?'#d4e1e7':'#67727b', accent=lab?'#61dbfa':'#ffa82f';
  const segments=[];
  const walls=[], indicators=[], rings=[], lamps=[];
  const floor=(x,z)=>lab?T.MathUtils.clamp((-z-4)*.30,0,1.2):T.MathUtils.clamp((9-Math.hypot(x,z))*.4,0,1.2);
  const make=(geo,mat,x,y,z)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);root.add(o);return o;};
  const emit=c=>new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.55,roughness:.34,metalness:.38});
  const pane=new T.MeshPhysicalMaterial({color:'#98e9ff',transparent:true,opacity:.16,roughness:.16,depthWrite:false,side:T.DoubleSide});
  const rail=(x,y,z,r,c,h=.18)=>cylinder(root,r,h,c,x,y,z,40);
  function wall(w,h,d,x,y,z){
    const mesh=box(root,w,h,d,dark,x,y,z);
    walls.push({mesh,bounds:new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)).expandByScalar(.3)});
  }
  box(root,32,.4,40,dark,0,-.2,0);
  wall(32,6,.5,0,3,-20);for(const side of [-1,1])wall(13.6,6,.5,side*9.2,3,20);
  box(root,5,.3,4,dark,0,-.15,21);wall(5,5,.3,0,2.5,23);
  for(const side of [-1,1]){
    wall(.5,7,40,side*16,3.5,0);
    for(let z=-18;z<=18;z+=6){
      box(root,.7,8,.75,steel,side*15.6,4,z);
      box(root,2.2,.28,.7,steel,side*15,7.7,z).rotation.z=side*.35;
      const lamp=box(root,.12,.12,4,accent,side*15.45,3.7,z);
      lamps.push(lamp);
      if(lab)box(root,.15,.04,3.8,accent,side*13.4,.03,z);
    }
  }
  // Entry lock faces the same way on arrival and return.
  for(const x of [-2.4,2.4])box(root,.4,4.4,1,steel,x,2.2,18.9);
  box(root,5.2,.4,1,accent,0,4.3,18.9);
  function label(text,x,y,z,parent=root){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=72;
    const c=canvas.getContext('2d');c.fillStyle='#172534';c.fillRect(0,0,256,72);c.fillStyle='#d7faff';c.font='bold 42px monospace';c.textAlign='center';c.fillText(text,128,51,246);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    const sign=new T.Mesh(new T.PlaneGeometry(2,.56),new T.MeshBasicMaterial({map,side:T.DoubleSide}));
    sign.position.set(x,y,z);parent.add(sign);
  }
  label('← Ω / 02',0,3.8,18.55);
  consoles.forEach(([id,x,z,code],i)=>{
    const terminal=new T.Group();
    terminal.position.set(x,floor(x,z),z);
    terminal.rotation.y=lab?0:Math.atan2(x,z);
    root.add(terminal);
    box(terminal,2.4,1.05,1.25,dark,0,.525,0);
    const screen=box(terminal,2.25,.84,.15,accent,0,1.44,-.32);screen.rotation.x=-.18;
    for(let j=0;j<5;j++)box(terminal,.21,.06+(i+j)%3*.09,.04,dark,-.7+j*.33,1.4,-.20);
    label(code,0,2.36,0,terminal);
    const indicator=new T.Mesh(new T.BoxGeometry(1.3,.07,.09),emit('#efab4b'));
    indicator.position.set(0,1.1,.58);terminal.add(indicator);
    indicators.push({id,mesh:indicator});
    if(!lab){
      // Follow the deck, the sloped platform and the top surface to the core base.
      const points=[9.4,9,6,3.2].map(radius=>{
        const px=x*radius/10,pz=z*radius/10;
        return new T.Vector3(px,floor(px,pz)+.08,pz);
      });
      const cableMaterial=emit('#ffda26');
      for(let j=1;j<points.length;j++){
        const start=points[j-1],end=points[j],direction=end.clone().sub(start);
        const cable=new T.Mesh(new T.CylinderGeometry(.085,.085,direction.length(),10),cableMaterial);
        cable.position.copy(start).lerp(end,.5);
        cable.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
        root.add(cable);
      }
    }
  });
  let shutter;
  const neural=new T.Group();root.add(neural);
  if(lab){
    for(let i=0;i<16;i++){const z=-4-(i+.5)*.25,h=floor(0,z);box(root,31,h,.25,steel,0,h/2,z);}
    box(root,31,1.2,12,steel,0,.6,-14);
    for(const s of [-1,1]){
      wall(13,4,.4,s*9.5,3.2,-13);
      for(let i=0;i<3;i++){
        box(root,1,3.6,1.4,dark,s*14.4,1.8,5+i*2.3);
        for(let j=0;j<6;j++)box(root,.08,.055,.8,accent,s*13.86,.5+j*.46,5+i*2.3);
      }
    }
    shutter=make(new T.BoxGeometry(6,4,.4),emit('#566d7a'),0,3.2,-13);
    for(const [x,z,r,h] of [[0,0,2.7,6],[-8,-1,1.15,3.6],[8,-2,1.15,3.6]]){
      rail(x,.26,z,r+.38,steel,.52);rail(x,h+.36,z,r+.24,dark,.38);
      make(new T.CylinderGeometry(r,r,h,32,1,true),pane,x,h/2+.45,z);
      for(let n=0;n<4;n++){const a=n*Math.PI/2;box(root,.13,h,.16,steel,x+r*Math.cos(a),h/2+.4,z+r*Math.sin(a));}
      rail(x,.62,z,r,accent,.08);
    }
    neural.position.set(0,3.7,0);const coords=[];
    for(let i=0;i<22;i++){
      const p=new T.Vector3(1.5*Math.cos(i*2.4),Math.sin(i*3.3)*1.15,1.3*Math.sin(i*2.4));
      sphere(neural,.09,'#b38cff',p.x,p.y,p.z);
      if(i)coords.push(...p.toArray(),...neural.children[i-1].position.toArray());
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(coords,3));
    neural.add(new T.LineSegments(geo,new T.LineBasicMaterial({color:'#83d1ff'})));
  }else{
    make(new T.CylinderGeometry(6,9,1.2,48),new T.MeshStandardMaterial({color:'#45525b'}),0,.6,0);
    rail(0,2,0,3.25,dark,1.6);
    make(new T.CylinderGeometry(1.65,1.95,6.8,32),emit('#dd7131'),0,6,0);
    for(let i=0;i<7;i++)segments.push(make(new T.CylinderGeometry(1.97,1.97,.18,32),emit('#ffad5b'),0,3.1+i*.93,0));
    for(let i=0;i<4;i++){
      const ring=make(new T.TorusGeometry(2.95-i*.1,.19,8,40),emit(i%2?'#708991':'#bf783d'),0,3.4+i*1.55,0);
      ring.rotation.x=Math.PI/2-.15; rings.push(ring);
    }
    for(let n=0;n<6;n++){
      const a=n*Math.PI/3,x=3.65*Math.cos(a),z=3.65*Math.sin(a);
      cylinder(root,.21,8.4,steel,x,5.4,z,10);
      rail(x,1.42,z,.54,dark,.3);
    }
  }
  const ray=new T.Ray(),hit=new T.Vector3();
  let archiveOpen=initial.records.length===4?1:0, ignition=initial.powered?1:0;
  return {
    floor,
    canWalk(x,z){
      if(Math.abs(x)>15.2||Math.abs(z)>19||Math.hypot(x,z)<(lab?3.35:4.2))return false;
      if(lab&&Math.abs(z+13)<.65&&(archiveOpen<.99||Math.abs(x)>2.5))return false;
      if(lab&&([[-8,-1],[8,-2]].some(([a,b])=>Math.hypot(x-a,z-b)<1.65)||(Math.abs(x)>13.4&&z>3&&z<11)))return false;
      return !consoles.some(([,a,b])=>{
        const sideways=!lab && a!==0;
        return Math.abs(x-a)<(sideways?1:1.6) && Math.abs(z-b)<(sideways?1.6:1);
      });
    },
    target(x,z){
      if(z>15.6&&Math.abs(x)<3)return 'return';
      return consoles.find(([,a,b])=>Math.hypot(x-a,z-b)<3.25)?.[0]||false;
    },
    update(dt,reduced,m){
      archiveOpen=Math.min(1,archiveOpen+(m.records.length===4?dt:0));
      if(shutter)shutter.position.y=3.2+4.35*archiveOpen;
      ignition=Math.min(1,ignition+(m.powered?dt*.33:0));
      if(!reduced)neural.rotation.y+=dt*(m.scientific ? .05 : .22);
      segments.forEach((mesh,i)=>{mesh.material.emissiveIntensity=.08+T.MathUtils.clamp(ignition*8-i,0,1)*1.4;});
      rings.forEach((r,i)=>{if(!reduced)r.rotation.z+=dt*(.12+ignition*.8)*(i%2?1:-1);r.material.emissiveIntensity=.2+.12*m.subsystems.length+ignition;});
      indicators.forEach(({id,mesh})=>{
        const done=id==='archive'?m.scientific:id==='activate'?m.powered:id.startsWith('record')?m.records.includes(Number(id.slice(-1))):m.subsystems.includes(id);
        mesh.material.emissive.set(done?'#39db87':'#d58d33');
      });
      lamps.forEach(lamp=>{lamp.material.emissive.set(lab?'#85dfe9':'#fdb562');lamp.material.emissiveIntensity=.08+ignition*.5;});
    },
    cutaway(eye,target){
      ray.origin.copy(eye);ray.direction.subVectors(target,eye).normalize();
      walls.forEach(({mesh,bounds})=>{mesh.visible=!(bounds.containsPoint(eye)||(ray.intersectBox(bounds,hit)&&eye.distanceToSquared(hit)<eye.distanceToSquared(target)));});
    }
  };
}
