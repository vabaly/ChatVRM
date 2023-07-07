import * as THREE from "three";
import { VRM, VRMExpressionPresetName } from "@pixiv/three-vrm";
import { ExpressionController } from "./expressionController";

/**
 * 感情表現としてExpressionとMotionを操作する為のクラス
 * デモにはExpressionのみが含まれています
 * 
  * 用于将 Expression 和 Motion 作为情感表达进行操作的类
  * 演示仅包含 Expression
 */
export class EmoteController {
  private _expressionController: ExpressionController;

  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._expressionController = new ExpressionController(vrm, camera);
  }

  // 播放模型的预置表情，这里还是要改一下 Prompt，以符合正确的表情
  public playEmotion(preset: VRMExpressionPresetName) {
    this._expressionController.playEmotion(preset);
  }

  // preset 是 'aa'
  public lipSync(preset: VRMExpressionPresetName, value: number) {
    this._expressionController.lipSync(preset, value);
  }

  // 每一帧都会执行
  public update(delta: number) {
    this._expressionController.update(delta);
  }
}
