import * as T from 'three';

export function buildOmegaStationExterior(parent, { box }) {
  const station = new T.Group();
  station.position.y = 1.6;
  station.visible = false;
  parent.add(station);

  const hull = new T.MeshStandardMaterial({ color: '#66768d', metalness: .52, roughness: .47 });
  const plating = new T.MeshStandardMaterial({ color: '#344661', metalness: .4, roughness: .54 });
  const cyan = new T.MeshBasicMaterial({ color: '#8deaff' });
  const amber = new T.MeshBasicMaterial({ color: '#ffd187' });
  function mesh(geometry, material, x, y, z) {
    const part = new T.Mesh(geometry, material);
    part.position.set(x, y, z);
    station.add(part);
    return part;
  }

  // The hull tapers into the escape sleeve at its forward end.
  const profile = [
    [0,-19],[2.6,-19],[3.5,-17],[3.5,-13],[4.5,-11],[4.5,4],
    [4,6],[4,10],[3.2,12],[2.75,13],[2.75,18.6],[0,18.6],
  ].map(([r,z]) => new T.Vector2(r,z));
  mesh(new T.LatheGeometry(profile, 48),hull,0,0,0).rotation.x=Math.PI/2;
  const bandGeometry = new T.TorusGeometry(4.53,.14,8,48);
  for (const z of [-10,-7.5,2.5]) mesh(bandGeometry,plating,0,0,z);
  mesh(new T.TorusGeometry(2.74,.17,8,36),plating,0,0,18.65);
  mesh(new T.TorusGeometry(2.53,.035,6,40),cyan,0,0,18.78);
  mesh(new T.CircleGeometry(2.51,40),new T.MeshBasicMaterial({color:'#111b2d'}),0,0,18.72);

  const habitat = new T.TorusGeometry(7.45,.62,12,56);
  mesh(habitat,plating,0,0,-3.5);
  mesh(new T.TorusGeometry(7.48,.13,8,56),hull,0,0,-2.94);
  const beacon = new T.SphereGeometry(.13,8,6);
  for (let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    mesh(beacon,i%3===0?amber:cyan,7.67*Math.cos(a),7.67*Math.sin(a),-2.87);
  }
  for (let i=0;i<4;i++) {
    const a=i*Math.PI/2+Math.PI/4;
    const spoke=box(station,3.65,.57,.98,'#475875',5.65*Math.cos(a),5.65*Math.sin(a),-3.5);
    spoke.rotation.z=a;
  }

  for (const side of [-1,1]) {
    box(station,9.4,.42,.75,'#52617b',side*7.6,.6,-10);
    for (const z of [-14.1,-10,-5.9]) {
      const wing=box(station,5.55,.18,3.65,'#39496e',side*10.8,.66,z);
      wing.rotation.z=side*.11;
      const cells=box(station,5.24,.08,3.35,'#42659b',side*10.8,.77,z);
      cells.rotation.z=wing.rotation.z;
      for(const offset of [-1.6,-.53,.53,1.6]){
        box(station,.036,.025,3.24,'#1b3053',side*10.8+offset,.83+Math.sin(wing.rotation.z)*offset,z);
      }
    }
    for (const z of [2,5.5,8]) {
      const module=box(station,3.35,2.3,2.45,'#53627c',side*4.9,1.3,z);
      module.rotation.z=side*.24;
      for (const offset of [-.42,.42]) {
        const window=mesh(new T.BoxGeometry(.6,.21,.035),cyan,side*5.05+offset,1.68,z+1.24);
        window.rotation.z=module.rotation.z;
      }
    }
  }
  box(station,.42,4.15,.45,'#52617b',0,5.7,1);
  mesh(beacon,amber,0,7.84,1);

  return station;
}
