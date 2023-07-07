import * as THREE from "three";
import {
  VRM,
  VRMExpressionManager,
  VRMExpressionPresetName,
} from "@pixiv/three-vrm";
import { AutoLookAt } from "./autoLookAt";
import { AutoBlink } from "./autoBlink";

/**
 * Expressionを管理するクラス
 *
 * 主に前の表情を保持しておいて次の表情を適用する際に0に戻す作業や、
 * 前の表情が終わるまで待ってから表情適用する役割を持っている。
 * 
 * 管理表情的类
 *
 * 主要是保留前一个表情并在应用下一个表情时将其重置为0的工作，
 * 作用是等待前一个表情执行完毕，然后应用该表达式。
 */
export class ExpressionController {
  private _autoLookAt: AutoLookAt;
  private _autoBlink?: AutoBlink;
  private _expressionManager?: VRMExpressionManager;
  private _currentEmotion: VRMExpressionPresetName;
  private _currentLipSync: {
    preset: VRMExpressionPresetName;
    value: number;
  } | null;
  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._autoLookAt = new AutoLookAt(vrm, camera);
    this._currentEmotion = "neutral";
    this._currentLipSync = null;
    if (vrm.expressionManager) {
      this._expressionManager = vrm.expressionManager;
      this._autoBlink = new AutoBlink(vrm.expressionManager);
    }
  }

  // 播放表情
  public playEmotion(preset: VRMExpressionPresetName) {
    // 如果当前表情不是 neutral，就设置表情
    if (this._currentEmotion != "neutral") {
      this._expressionManager?.setValue(this._currentEmotion, 0);
    }

    // 如果传入的表情是 neutral，那就启用自动眨眼，并更新 _currentEmotion
    if (preset == "neutral") {
      this._autoBlink?.setEnable(true);
      this._currentEmotion = preset;
      return;
    }

    // 否则，自动眨眼关闭，也更新 _currentEmotion
    const t = this._autoBlink?.setEnable(false) || 0;
    this._currentEmotion = preset;
    // 等待睁开眼后，再设置表情
    setTimeout(() => {
      this._expressionManager?.setValue(preset, 1);
    }, t * 1000);
  }

  // 每帧都会运行，不知道为什么 preset 是 'aa'
  public lipSync(preset: VRMExpressionPresetName, value: number) {
    if (this._currentLipSync) {
      this._expressionManager?.setValue(this._currentLipSync.preset, 0);
    }
    this._currentLipSync = {
      preset,
      value,
    };
  }

  // 每一帧都会执行
  public update(delta: number) {
    if (this._autoBlink) {
      this._autoBlink.update(delta);
    }

    if (this._currentLipSync) {
      // 当有除正常的其他表情的时候，嘴形同步的权重要小一点，value 是根据音频算出来的一个值
      const weight =
        this._currentEmotion === "neutral"
          ? this._currentLipSync.value * 0.5
          : this._currentLipSync.value * 0.25;
      // 看来 'aa' 就是嘴形？
      this._expressionManager?.setValue(this._currentLipSync.preset, weight);
    }
  }
}
