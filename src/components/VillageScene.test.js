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
    expect(village.player.position.x).toBe(0);
    expect(village.player.position.z).toBe(19);
    expect(village.npcs).toHaveLength(4);
    expect(village.castleGuards).toHaveLength(2);
    expect(village.castleArchers).toHaveLength(2);
    expect(village.castleTowers).toHaveLength(8);
    expect(village.performers.map(actor => actor.kind)).toEqual(['watch', 'watch', 'drink', 'read', 'forge', 'salute']);
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
    const stoneBatches = scene.children.filter(object => object.isInstancedMesh);
    expect(stoneBatches.reduce((total, batch) => total + batch.count, 0)).toBeGreaterThan(200);
    expect(scene.children.some(o => o.isPointLight)).toBe(true);
    expect(scene.getObjectByName('Panorama de montanhas').material.map).toBeTruthy();
    expect(scene.getObjectByName('Mar da doca').geometry.parameters.width).toBeLessThan(85);
    expect(scene.getObjectByName('Fundo da agua').material).toBe(scene.getObjectByName('Mar da doca').material);
  } finally {
    HTMLCanvasElement.prototype.getContext = original;
    scene.traverse(object => { object.geometry?.dispose(); });
  }
});
