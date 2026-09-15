import * as THREE from 'three';
import { Mock, It, Times, IMock } from 'moq.ts';
import { Emitter, GameObjectEventMap } from '@tgdf';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Entity } from '../gameObjects/Entity';
import { ModelRenderer } from './ModelRenderer/ModelRenderer';
import { DamageHitboxController } from './DamageHitboxController';
import { MockGameScene } from '../scenes/GameScene/MockGameScene';
import { HealthPointsController, HealthPointsControllerEvents } from './HealthPointsController';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

class TestScene extends MockGameScene {}

const SIZE = new THREE.Vector3(1, 1, 1);
const DAMAGE = 10;
const PARENT_NAME = 'hand';
const IGNORE_NOTHING = () => false;

function makeKillableMock() {
  const killReturn = new Mock<gsap.core.Timeline>();
  return new Mock<gsap.core.Timeline>().setup((t) => t.kill()).returns(killReturn.object());
}

describe('DamageHitboxController', () => {
  let hpEvents: Emitter<HealthPointsControllerEvents>;
  let modelRendererMock: IMock<ModelRenderer>;
  let entityMock: IMock<Entity>;
  let controller: DamageHitboxController;

  beforeEach(async () => {
    const scene = new TestScene();
    await scene.initializePhysicsWorld(new THREE.Vector3(0, -9.81, 0));

    hpEvents = new Emitter<HealthPointsControllerEvents>();

    modelRendererMock = new Mock<ModelRenderer>()
      .setup((mr) => mr.addAttachment(It.IsAny()))
      .returns()
      .setup((mr) => mr.removeAttachment(It.IsAny()))
      .returns();

    const hpcMock = new Mock<HealthPointsController>().setup((h) => h.events).returns(hpEvents);

    entityMock = new Mock<Entity>()
      .setup((e) => e.isAwake)
      .returns(false)
      .setup((e) => e.events)
      .returns(new Emitter<GameObjectEventMap>())
      .setup((e) => e.scene)
      .returns(scene)
      .setup((e) => e.healthPointsController)
      .returns(hpcMock.object())
      .setup((e) => e.modelRenderer)
      .returns(modelRendererMock.object());

    controller = new DamageHitboxController(entityMock.object());
  });

  it('attachDamageHitbox adds hitbox to the model via modelRenderer', () => {
    controller.attachDamageHitbox(SIZE, DAMAGE, PARENT_NAME, IGNORE_NOTHING);

    modelRendererMock.verify((mr) => mr.addAttachment(It.IsAny()), Times.Once());
  });

  it('attachDamageHitbox is a no-op if a hitbox is already attached', () => {
    controller.attachDamageHitbox(SIZE, DAMAGE, PARENT_NAME, IGNORE_NOTHING);
    controller.attachDamageHitbox(SIZE, DAMAGE, PARENT_NAME, IGNORE_NOTHING);

    modelRendererMock.verify((mr) => mr.addAttachment(It.IsAny()), Times.Once());
  });

  it('removeDamageHitbox removes the hitbox from the model via modelRenderer', () => {
    controller.attachDamageHitbox(SIZE, DAMAGE, PARENT_NAME, IGNORE_NOTHING);
    controller.removeDamageHitbox();

    modelRendererMock.verify((mr) => mr.removeAttachment(It.IsAny()), Times.Once());
  });

  it('removeDamageHitbox is a no-op when nothing is attached', () => {
    controller.removeDamageHitbox();

    modelRendererMock.verify((mr) => mr.removeAttachment(It.IsAny()), Times.Never());
  });

  it('clearHitboxEvents removes the hitbox and kills the timeline', () => {
    const timelineMock = makeKillableMock();
    controller.attachDamageHitbox(SIZE, DAMAGE, PARENT_NAME, IGNORE_NOTHING);
    controller.hitboxTimeline = timelineMock.object();

    controller.clearHitboxEvents();

    modelRendererMock.verify((mr) => mr.removeAttachment(It.IsAny()), Times.Once());
    timelineMock.verify((t) => t.kill(), Times.Once());
    expect(controller.hitboxTimeline).toBeNull();
  });

  it('onDestroyed removes hitbox and kills the timeline', () => {
    const timelineMock = makeKillableMock();
    controller.attachDamageHitbox(SIZE, DAMAGE, PARENT_NAME, IGNORE_NOTHING);
    controller.hitboxTimeline = timelineMock.object();

    controller.destroy();

    modelRendererMock.verify((mr) => mr.removeAttachment(It.IsAny()), Times.Once());
    timelineMock.verify((t) => t.kill(), Times.Once());
  });
});
