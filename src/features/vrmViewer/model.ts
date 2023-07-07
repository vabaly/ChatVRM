import * as THREE from "three";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMAnimation } from "../../lib/VRMAnimation/VRMAnimation";
import { VRMLookAtSmootherLoaderPlugin } from "@/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin";
import { LipSync } from "../lipSync/lipSync";
import { EmoteController } from "../emoteController/emoteController";
import { Screenplay } from "../messages/messages";

/**
 * 3Dキャラクターを管理するクラス
 * 管理3D角色的类
 */
export class Model {
  public vrm?: VRM | null;
  public mixer?: THREE.AnimationMixer;
  public emoteController?: EmoteController;

  private _lookAtTargetParent: THREE.Object3D;
  private _lipSync?: LipSync;

  // 1. 初始化类
  constructor(lookAtTargetParent: THREE.Object3D) {
    // 1.1 设置角色看向摄像机
    this._lookAtTargetParent = lookAtTargetParent;
    // 1.2 设置角色的嘴形同步，AudioContext 是 Web API
    // AudioContext接口表示由链接在一起的音频模块构建的音频处理图，每个模块由一个AudioNode表示。音频上下文控制它包含的节点的创建和音频处理或解码的执行。在做任何其他操作之前，您需要创建一个AudioContext对象，因为所有事情都是在上下文中发生的。建议创建一个AudioContext对象并复用它，而不是每次初始化一个新的AudioContext对象，并且可以对多个不同的音频源和管道同时使用一个AudioContext对象。
    this._lipSync = new LipSync(new AudioContext());
  }

  // 2. 加载 VRM 模型
  public async loadVRM(url: string): Promise<void> {
    // 2.1 glTF（gl传输格式）是一种开放格式的规范 （open format specification）， 用于更高效地传输、加载3D内容。该类文件以JSON（.gltf）格式或二进制（.glb）格式提供， 外部文件存储贴图（.jpg、.png）和额外的二进制数据（.bin）。一个glTF组件可传输一个或多个场景， 包括网格、材质、贴图、蒙皮、骨架、变形目标、动画、灯光以及摄像机。
    const loader = new GLTFLoader();
    // 2.2 注册插件来处理模型的加载
    loader.register(
      (parser) =>
        new VRMLoaderPlugin(parser, {
          lookAtPlugin: new VRMLookAtSmootherLoaderPlugin(parser),
        })
    );

    // 2.3 异步加载
    const gltf = await loader.loadAsync(url);

    // 2.4 将 vrm 数据保存起来
    const vrm = (this.vrm = gltf.userData.vrm);
    // 2.5 设置 vrm 场景名称？
    vrm.scene.name = "VRMRoot";

    // 2.6 将 vrm 模型旋转 180 度
    VRMUtils.rotateVRM0(vrm);
    // 2.7 为 vrm 创建动画混合器，独立播放 vrm 的动画
    this.mixer = new THREE.AnimationMixer(vrm.scene);

    // 2.8 创建操控 Expression 和 Motion 的类
    this.emoteController = new EmoteController(vrm, this._lookAtTargetParent);
  }

  public unLoadVrm() {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
      this.vrm = null;
    }
  }

  /**
   * VRMアニメーションを読み込む
   * 导入VRM动画
   *
   * https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm_animation-1.0/README.ja.md
   */
  public async loadAnimation(vrmAnimation: VRMAnimation): Promise<void> {
    const { vrm, mixer } = this;
    if (vrm == null || mixer == null) {
      throw new Error("You have to load VRM first");
    }

    // 3.1 根据 vrmAnimation 创建 three.js 的动画剪辑
    const clip = vrmAnimation.createAnimationClip(vrm);
    // 3.2 创建动画调度器
    const action = mixer.clipAction(clip);
    // 3.3 播放动画
    action.play();
  }

  /**
   * 音声を再生し、リップシンクを行う
   * 模型说话，播放音频和口型同步
   */
  public async speak(buffer: ArrayBuffer, screenplay: Screenplay) {
    this.emoteController?.playEmotion(screenplay.expression);
    await new Promise((resolve) => {
      // 与表情几乎同时，播放音频，并口型同步
      this._lipSync?.playFromArrayBuffer(buffer, () => {
        resolve(true);
      });
    });
  }

  // 每一帧都会执行，delta 是游戏过去的时间
  public update(delta: number): void {
    if (this._lipSync) {
      const { volume } = this._lipSync.update();
      this.emoteController?.lipSync("aa", volume);
    }

    this.emoteController?.update(delta);
    // 动画也要更新？
    this.mixer?.update(delta);
    // 模型也要更新？
    this.vrm?.update(delta);
  }
}
