import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { PhysicsManager } from '@tgdf/internal-3d/PhysicsManager/PhysicsManager';

import { logger } from '../internal-ui/utils/logger';
import { GameObjectComponent } from './GameObjectComponent';
import { GameObject } from '../internal-3d/GameObject/GameObject';
import { getMeshFromCollider } from './utils/getMeshFromCollider';
import { PhysicsCollisionCallback } from '../internal-3d/types/physics';
import { getRigidBodyColliderDescription } from './utils/getRigidBodyColliderDescription';
import { getRigidBodyDescriptionForObject } from './utils/getRigidBodyDescriptionForObject';

export type RigidBodyShape = 'box' | 'cylinder' | 'sphere';
export type RigidBodyType = 'dynamic' | 'static' | 'kinematic';
export type RigidBodyOptions = {
  type?: RigidBodyType;
  mass?: number;
  friction?: number;
  restitution?: number; // Bounciness (0 = no bounce, 1 = perfect bounce)
  linearDamping?: number; // Air resistance
  angularDamping?: number; // Rotation resistance
  lockRotation?: boolean;
  colliderShape?: RigidBodyShape;
  colliderSize?: THREE.Vector3; // Explicit collider size; overrides the size derived from the mesh's bounding box
  sensor?: boolean; // If true, the collider will not produce physical responses but can still trigger collision events
  enableCollisionDetection?: boolean;
};

export type RigidBodyCollisionParams = {
  thisBody: RigidBody;
  otherBody: RigidBody;
  started: boolean;
};

export type RigidBodyCollisionCallback = (params: RigidBodyCollisionParams) => void;

export class RigidBody extends GameObjectComponent<RigidBodyOptions> {
  public static BodyType = RAPIER.RigidBodyType;
  public static ActiveEvents = RAPIER.ActiveEvents;

  private _body: RAPIER.RigidBody | null = null;
  private _collider: RAPIER.Collider | null = null;
  private _colliderDebugMesh: THREE.Mesh | null = null;
  private _debugMeshVisible: boolean = false;

  private _collisionListeners = new Map<string, PhysicsCollisionCallback>();

  constructor(gameObject: GameObject, options: RigidBodyOptions = {}) {
    super(gameObject, options);

    // Add defaults
    this.options = {
      type: 'dynamic',
      mass: 1,
      friction: 0,
      restitution: 0.3,
      linearDamping: 0.5,
      angularDamping: 0.1,
      lockRotation: false,
      enableCollisionDetection: false,
      colliderShape: 'box',
      sensor: false,
      ...options,
    };

    const scene = this.gameObject.scene;

    if (!scene) throw new Error('RigidBody: GameObject is not part of a scene');
    if (!scene.physics) throw new Error('RigidBody: Physics system not initialized in scene');
  }

  public getPhysicsCollider(): RAPIER.Collider | null {
    return this._collider;
  }

  public getDebugMesh(): THREE.Mesh | null {
    return this._colliderDebugMesh;
  }

  public getRigidBody(): RAPIER.RigidBody | null {
    return this._body;
  }

  public getHandle(): RAPIER.RigidBodyHandle | null {
    return this._body ? this._body.handle : null;
  }

  public getLinearVelocity(): THREE.Vector3 {
    if (!this._body) return new THREE.Vector3();
    const vel = this._body.linvel();
    return new THREE.Vector3(vel.x, vel.y, vel.z);
  }

  public getTranslation(): THREE.Vector3 {
    if (this._body) {
      const translation = this._body.translation();
      return new THREE.Vector3(translation.x, translation.y, translation.z);
    }
    return new THREE.Vector3();
  }

  public setLinearVelocity(velocity: THREE.Vector3): void {
    const body = this._getBody();
    body.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
  }

  public setTranslation(translation: THREE.Vector3, wake = true): void {
    const body = this._getBody();
    body.setTranslation({ x: translation.x, y: translation.y, z: translation.z }, wake);
  }

  public setRotation(quaternion: THREE.Quaternion, wake = true): void {
    const body = this._getBody();
    body.setRotation({ x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w }, wake);
  }

  public setEulerRotation(euler: THREE.Euler): void {
    const body = this._getBody();
    const quat = new THREE.Quaternion().setFromEuler(euler);
    body.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);
  }

  public setEnabled(enabled: boolean): void {
    const body = this._getBody();
    body.setEnabled(enabled);
  }

  public isEnabled(): boolean {
    const body = this._getBody();
    return body.isEnabled();
  }

  public syncFromPhysics(): void {
    if (this.options.type !== 'dynamic') return;

    const body = this._body;
    if (!body) return;

    const translation = body.translation();
    const rotation = body.rotation();

    this.gameObject.position.set(translation.x, translation.y, translation.z);
    this.gameObject.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }

  public applyForce(force: THREE.Vector3): void {
    const body = this._getBody();
    body.addForce({ x: force.x, y: force.y, z: force.z }, true);
  }

  public applyImpulse(impulse: THREE.Vector3): void {
    const body = this._getBody();
    body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
  }

  public updatePhysicsCollider(): void {
    this._removePhysicsCollider();
    this._collider = this._createPhysicsCollider();
  }

  public toggleDebug(visible: boolean): void {
    this._debugMeshVisible = visible;
    if (this._colliderDebugMesh) {
      this._colliderDebugMesh.visible = visible;
    }
  }

  public addCollisionListener(id: string, callback: RigidBodyCollisionCallback) {
    const physics = this._getPhysicsManager();

    // Get this body's handle
    const thisHandle = this._body?.handle;
    if (thisHandle === undefined || thisHandle === null) {
      throw new Error('RigidBody: Cannot add collision listener before body is initialized');
    }

    // Wrap the callback to convert handles to GameObjects
    const wrappedCallback: PhysicsCollisionCallback = (handle1, handle2, started) => {
      // Check if this collision involves our body
      if (handle1 !== thisHandle && handle2 !== thisHandle) {
        return; // Not our collision
      }

      // Determine which is the other body
      const otherHandle = handle1 === thisHandle ? handle2 : handle1;

      // Get GameObjects from handles
      const thisBody = physics.getBodyFromHandle(thisHandle);
      const otherBody = physics.getBodyFromHandle(otherHandle);

      if (thisBody && otherBody) {
        callback({ thisBody, otherBody, started });
      }
    };

    this._collisionListeners.set(id, wrappedCallback);
    return physics.onCollision(wrappedCallback);
  }

  public removeCollisionListener(id: string) {
    const physics = this._getPhysicsManager();
    const callback = this._collisionListeners.get(id);
    if (callback) {
      physics.offCollision(callback);
      this._collisionListeners.delete(id);
    } else {
      logger({
        message: `RigidBody: No collision listener found with id "${id}"`,
        type: 'warn',
      });
    }
  }

  protected override onAwake(): void {
    super.onAwake();
    this._init();
  }

  protected override onUpdate(_deltaTime: number): void {
    super.onUpdate(_deltaTime);
    if (this.options.type !== 'kinematic') return;

    const body = this._body;
    if (!body) return;

    // Sync visual transform to physics immediately so colliders match this frame
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    this.gameObject.getWorldPosition(worldPos);
    this.gameObject.getWorldQuaternion(worldQuat);

    this.setTranslation(worldPos);
    this.setRotation(worldQuat);
  }

  protected override onDestroyed(): void {
    // If physics world is still available, remove body and collider from physics world
    if (this.gameObject.scene?.physics?.world) {
      this._removePhysicsCollider();
      this._removePhysicsBody();
    }

    // Remove debug mesh
    this._removeDebugMesh();

    super.onDestroyed();
  }

  private _createPhysicsBody(): RAPIER.RigidBody | null {
    const world = this._getPhysicsWorld();

    // Create rigid body description
    const bodyDesc = getRigidBodyDescriptionForObject(this.gameObject, this.options);
    const body = world.createRigidBody(bodyDesc);

    // Lock rotation if specified in options
    if (this.options.lockRotation) {
      body.lockRotations(true, false);
    }

    return body;
  }

  private _removePhysicsBody(): void {
    const world = this._getPhysicsWorld();

    if (this._body) {
      world.removeRigidBody(this._body);
      this._body = null;
    }

    const physics = this._getPhysicsManager();
    physics.removeBody(this.gameObject);
  }

  private _createPhysicsCollider(): RAPIER.Collider | null {
    const body = this._getBody();

    const colliderDesc = getRigidBodyColliderDescription(
      this.options.colliderShape || 'box',
      this.gameObject,
      this.options
    );

    const world = this._getPhysicsWorld();
    const collider = world.createCollider(colliderDesc, body);

    // Create debug mesh from collider geometry
    if (this._colliderDebugMesh) {
      this.gameObject.remove(this._colliderDebugMesh);
    }
    this._colliderDebugMesh = this._createDebugMesh(collider);

    this.gameObject.add(this._colliderDebugMesh);

    return collider;
  }

  private _removePhysicsCollider(): void {
    const world = this._getPhysicsWorld();

    if (this._collider) {
      world.removeCollider(this._collider, false);
      this._collider = null;
    }
  }

  private _createDebugMesh(collider: RAPIER.Collider): THREE.Mesh {
    const mesh = getMeshFromCollider(collider);

    this.gameObject.updateWorldMatrix(true, false);
    const parentWorldMatrixInverse = new THREE.Matrix4().copy(this.gameObject.matrixWorld).invert();

    const t = collider.translation();
    const r = collider.rotation();
    const colliderWorldMatrix = new THREE.Matrix4().compose(
      new THREE.Vector3(t.x, t.y, t.z),
      new THREE.Quaternion(r.x, r.y, r.z, r.w),
      new THREE.Vector3(1, 1, 1)
    );

    parentWorldMatrixInverse
      .multiply(colliderWorldMatrix)
      .decompose(mesh.position, mesh.quaternion, mesh.scale);

    mesh.visible = this._debugMeshVisible;
    mesh.name = `${this.gameObject.name}_ColliderDebugMesh`;
    return mesh;
  }

  private _removeDebugMesh(): void {
    if (this._colliderDebugMesh) {
      this.gameObject.remove(this._colliderDebugMesh);
      // Geometry and material will be disposed be the Scene's
      // ResourceTracker when the mesh is removed from the scene.
    } else {
      logger({
        message: 'RigidBody: No debug mesh to remove',
        type: 'warn',
      });
    }
  }

  private _init(): void {
    this._body = this._createPhysicsBody();
    // Create physics collider from mesh geometry
    this._collider = this._createPhysicsCollider();

    // Register body with physics manager
    const physics = this._getPhysicsManager();
    physics.addBody(this.gameObject, this);
  }

  private _getBody(): RAPIER.RigidBody {
    if (!this._body) {
      throw new Error('RigidBody: Physics body not initialized');
    }
    return this._body;
  }

  private _getPhysicsManager(): PhysicsManager {
    if (!this.gameObject.scene?.physics) {
      throw new Error('RigidBody: Physics manager not initialized in scene');
    }
    return this.gameObject.scene.physics;
  }

  private _getPhysicsWorld(): RAPIER.World {
    if (!this.gameObject.scene?.physics?.world) {
      throw new Error('RigidBody: Physics world not initialized');
    }
    return this.gameObject.scene.physics.world;
  }
}
