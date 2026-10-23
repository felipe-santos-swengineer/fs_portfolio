import * as THREE from 'three';
import { createVillage } from './VillageScene';

jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({ OrbitControls: jest.fn() }));

test('a cena contém quatro edifícios selecionáveis e um personagem articulado com geometria válida', () => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, strokeRect() {}, fillText() {} });
  const scene = new THREE.Scene();
  try {
    const village = createVillage(scene);
    expect(village.buildings.map(b => b.userData.site)).toEqual([0, 1, 2, 3]);
    expect(village.limbs).toHaveLength(4);
    expect(village.player.position.z).toBe(5);
    expect(village.npcs).toHaveLength(4);
    expect(village.npcs.map(n => n.group.userData.npc)).toEqual([0, 1, 2, 3]);
    village.npcs.forEach(n => expect(n.limbs).toHaveLength(4));
    let meshes = 0;
    scene.traverse(object => {
      if (object.isMesh) {
        meshes++;
        object.geometry.computeBoundingBox();
        const bounds = object.geometry.boundingBox;
        expect([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)).toBe(true);
      }
    });
    expect(meshes).toBeGreaterThan(450);
    expect(scene.children.some(o => o.isPointLight)).toBe(true);
  } finally {
    HTMLCanvasElement.prototype.getContext = original;
    scene.traverse(object => { object.geometry?.dispose(); });
  }
});
