import { VRMExpressionManager } from "@pixiv/three-vrm";
import { BLINK_CLOSE_MAX, BLINK_OPEN_MAX } from "./emoteConstants";

/**
 * 自動瞬きを制御するクラス
 * 
 * 控制自动眨眼的类
 */
export class AutoBlink {
  private _expressionManager: VRMExpressionManager;
  private _remainingTime: number;
  private _isOpen: boolean;
  private _isAutoBlink: boolean;

  constructor(expressionManager: VRMExpressionManager) {
    this._expressionManager = expressionManager;
    this._remainingTime = 0;
    this._isAutoBlink = true;
    // 默认眼睛是睁着的
    this._isOpen = true;
  }

  /**
   * 自動瞬きをON/OFFする。
   *
   * 目を閉じている(blinkが1の)時に感情表現を入れてしまうと不自然になるので、
   * 目が開くまでの秒を返し、その時間待ってから感情表現を適用する。
   * @param isAuto
   * @returns 目が開くまでの秒
   */
  /**
   * 打开/关闭自动眨眼。
   *
   * 如果闭着眼睛（眨眼为1）时表达情感会不自然，所以
   * 返回眼睛睁开之前的秒数，并在应用表情之前等待该时间。
   * @param isAuto
   * @returns 直到眼睛睁开的秒数
   */
  public setEnable(isAuto: boolean) {
    this._isAutoBlink = isAuto;

    // 目が閉じている場合、目が開くまでの時間を返す
    // 如果眼睛闭着，返回眼睛睁开的时间
    if (!this._isOpen) {
      return this._remainingTime;
    }

    // 眼睛睁开，则无需等待
    return 0;
  }

  // 每一帧都拿等待的时间减去这一帧过去的时间
  public update(delta: number) {
    if (this._remainingTime > 0) {
      this._remainingTime -= delta;
      return;
    }

    if (this._isOpen && this._isAutoBlink) {
      this.close();
      return;
    }

    this.open();
  }

  // 闭眼
  private close(): void {
    this._isOpen = false;
    // 预留时间重置
    this._remainingTime = BLINK_CLOSE_MAX;
    // Blink 的表情，权重是 1，这时候不做其他表情
    this._expressionManager.setValue("blink", 1);
  }

  // 睁眼
  private open() {
    this._isOpen = true;
    this._remainingTime = BLINK_OPEN_MAX;
    // Blink 的表情，权重是 0，这时候可以执行其他表情
    this._expressionManager.setValue("blink", 0);
  }
}
