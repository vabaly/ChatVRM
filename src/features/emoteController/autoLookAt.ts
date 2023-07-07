import * as THREE from "three";
import { VRM } from "@pixiv/three-vrm";
/**
 * 目線を制御するクラス
 *
 * サッケードはVRMLookAtSmootherの中でやっているので、
 * より目線を大きく動かしたい場合はここに実装する。
 * 
 * 
 * 控制视线的类
 *
 * 由于眼跳是在 VRMLookAtSmoother 中完成的，
 * 如果你想移动视线更多，就在这里实现。
 */
export class AutoLookAt {
  private _lookAtTarget: THREE.Object3D;
  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._lookAtTarget = new THREE.Object3D();
    camera.add(this._lookAtTarget);

    // 让模型看向新增的这个物体，估计这个位置已经算好了
    if (vrm.lookAt) vrm.lookAt.target = this._lookAtTarget;
  }
}
