import * as THREE from 'three';
import { InputState, useAssetStore } from '@tgdf';

import { COLORS } from 'renderer/constants';
import { FMOD_EVENTS } from 'renderer/FMOD';
import { PlayerActionType } from 'renderer/3D/types';
import { pixelateTexture } from 'renderer/3D/utils/pixelateTexture';

import { State } from '..';
import { Player } from '../../gameObjects/players/Player';
import { GameScene } from '../../scenes/GameScene/GameScene';
import { AIMING_ARROW_TEXTURE, MATERIALS } from '../../../constants';
import { ProjectileOptions, Projectile } from '../../gameObjects/Projectile';

export type AimingProjectileConstructor = new (
  scene: GameScene,
  options: Omit<ProjectileOptions, 'model'>
) => Projectile;

export type AimingOptions = {
  triggerInput: PlayerActionType;
  projectile: { ctor: AimingProjectileConstructor } & Omit<ProjectileOptions, 'model' | 'sender'>;
};

const INDICATOR_GROUND_OFFSET = -0.5;
const INDICATOR_WIDTH = 1.2;
const INDICATOR_LENGTH = 4.8;

export class AimingState extends State {
  private _indicator: THREE.Mesh | null = null;
  private _throwAnimationFinished = false;
  private _isProjectileFired = false;

  constructor(
    public entity: Player,
    private _options: AimingOptions
  ) {
    super(entity);
  }

  public get isReadyToLeave(): boolean {
    return this._throwAnimationFinished;
  }

  public override onEnter(): void {
    this.entity.animationController.playAnimation('aim', {
      clampWhenFinished: true,
    });
    this._spawnIndicator();
  }

  public override onExit(): void {
    if (this._indicator) {
      this.entity.remove(this._indicator);
      this._indicator = null;
    }
  }

  public override onInput(_inputState: InputState): void {}

  public override onUpdate(_deltaTime: number): void {
    const controlsStates = this.entity.inputSource.getControls();

    const isTriggerHeld = controlsStates.some(
      (controlState) => controlState.type === this._options.triggerInput
    );

    if (!isTriggerHeld && !this._isProjectileFired) {
      this._isProjectileFired = true;
      this._fireProjectile();

      if (this._indicator) {
        this.entity.remove(this._indicator);
        this._indicator = null;
      }

      this.entity.fmodSoundController.playSound(FMOD_EVENTS.GENERIC_SWOOSH);
      this.entity.animationController.playAnimation('throw', {
        clampWhenFinished: true,
        playbackRate: 2,
        onComplete: () => {
          this._throwAnimationFinished = true;
        },
      });
    }

    if (!this._isProjectileFired) {
      const movementState = controlsStates.find((controlState) => 'direction' in controlState);
      if (movementState) {
        this._rotateTowardsInput(movementState.direction);
      }
    }
  }

  private _rotateTowardsInput(direction: THREE.Vector3): void {
    const moveVector = direction.clone().normalize();

    const cameraForward = new THREE.Vector3();
    this.entity.scene.camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();

    const cameraRight = new THREE.Vector3().crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));

    const rotatedDirection = new THREE.Vector3();
    rotatedDirection.addScaledVector(cameraRight, moveVector.x);
    rotatedDirection.addScaledVector(cameraForward, -moveVector.z);

    this.entity.movementController.rotate(rotatedDirection);
  }

  private _spawnIndicator(): void {
    const texture = useAssetStore.getState().textureCache.get(AIMING_ARROW_TEXTURE);
    if (!texture) {
      throw new Error('Aiming arrow texture not found in asset store');
    }

    pixelateTexture(texture);

    const material = MATERIALS.STANDARD_EMISSIVE_WITH_MAP({
      map: texture,
      depthWrite: false,
      color: COLORS.RED,
      emissive: COLORS.RED,
    });

    const geometry = new THREE.PlaneGeometry(INDICATOR_WIDTH, INDICATOR_LENGTH);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI);
    mesh.position.set(0, INDICATOR_GROUND_OFFSET, INDICATOR_LENGTH / 2 + 1);

    this._indicator = mesh;
    this.entity.add(mesh);
  }

  private _fireProjectile(): void {
    const direction = new THREE.Vector3();
    this.entity.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const { ctor, ...projectileOptions } = this._options.projectile;
    const projectile = new ctor(this.entity.scene, { ...projectileOptions, sender: this.entity });
    projectile.position.copy(this.entity.position);

    this.entity.scene.add(projectile);
    projectile.sendTowards(direction);
  }
}
