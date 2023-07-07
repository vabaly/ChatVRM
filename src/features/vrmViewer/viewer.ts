import * as THREE from "three";
import { Model } from "./model";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { buildUrl } from "@/utils/buildUrl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * three.jsを使った3Dビューワー
 *
 * setup()でcanvasを渡してから使う

 * 使用 Three.js 的 3D 查看器
 *
 * 在setup()中传递canvas后使用
 */
export class Viewer {
  public isReady: boolean;
  public model?: Model;

  private _renderer?: THREE.WebGLRenderer;
  private _clock: THREE.Clock;
  private _scene: THREE.Scene;
  private _camera?: THREE.PerspectiveCamera;
  private _cameraControls?: OrbitControls;

  // 1. 初始化场景
  constructor() {
    this.isReady = false;

    // scene
    // 1.1 创建一个场景
    const scene = new THREE.Scene();
    this._scene = scene;

    // light
    // 1.2. 创建一束平行光，颜色是白色，强度是 0.6
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(directionalLight);

    // 1.3. 创建一束环境光，颜色是白色，强度是 0.4，环境光会均匀照亮每一个物体，不会有阴影
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // animate
    // 1.4. 创建一个时钟，并且启动它，猜测和游戏时间是一样的
    this._clock = new THREE.Clock();
    this._clock.start();
  }

  // 4. 加载 VRM 文件
  public loadVrm(url: string) {
    // 4.1 每次都新的加载都得卸载之前的 VRM 模型
    if (this.model?.vrm) {
      this.unloadVRM();
    }

    // gltf and vrm
    // 4.2 生成一个模型管理对象
    this.model = new Model(this._camera || new THREE.Object3D());
    // 4.3 加载 VRM 模型
    this.model.loadVRM(url).then(async () => {
      if (!this.model?.vrm) return;

      // Disable frustum culling
      // 遍历 vrm 中的所有物体
      this.model.vrm.scene.traverse((obj) => {
        // 4.4 当这个设置了的时候，每一帧渲染前都会检测这个物体是不是在相机的视椎体范围内。 如果设置为false 物体不管是不是在相机的视椎体范围内都会渲染。默认为true。
        obj.frustumCulled = false;
      });

      // 4.5 将整个 vrm 加入到场景中
      this._scene.add(this.model.vrm.scene);

      // 4.6 Important：原来控制动画还有一种文件是 .vrma 文件
      // 加载动画
      const vrma = await loadVRMAnimation(buildUrl("/idle_loop.vrma"));
      if (vrma) this.model.loadAnimation(vrma);

      // HACK: アニメーションの原点がずれているので再生後にカメラ位置を調整する
      // HACK：播放后调整相机位置，因为动画原点未对齐
      requestAnimationFrame(() => {
        this.resetCamera();
      });
    });
  }

  public unloadVRM(): void {
    if (this.model?.vrm) {
      this._scene.remove(this.model.vrm.scene);
      this.model?.unLoadVrm();
    }
  }

  /**
   * Reactで管理しているCanvasを後から設定する
   * 稍后设置React管理的Canvas
   */
  public setup(canvas: HTMLCanvasElement) {
    // 2.1 获取 Canvas 的宽高
    const parentElement = canvas.parentElement;
    const width = parentElement?.clientWidth || canvas.width;
    const height = parentElement?.clientHeight || canvas.height;
    // renderer
    // 2.2 创建一个 WebGL 渲染器，渲染器渲染的内容会输出到指定的 Canvas 上面
    this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });
    // 2.3 使用 sRGB 色彩编码
    this._renderer.outputEncoding = THREE.sRGBEncoding;
    // 2.4 给渲染器设置成 Canvas 的宽高
    this._renderer.setSize(width, height);
    // 2.5 设置设备的像素比，避免模糊
    this._renderer.setPixelRatio(window.devicePixelRatio);

    // camera
    // 2.6 创建一个透视摄像机，视野符合 Canvas 的宽高比
    this._camera = new THREE.PerspectiveCamera(20.0, width / height, 0.1, 20.0);
    // 2.7 设置摄像机的局部位置
    this._camera.position.set(0, 1.3, 1.5);
    // 2.8 目标位置
    this._cameraControls?.target.set(0, 1.3, 0);
    this._cameraControls?.update();
    // camera controls
    // 2.9 相机控制
    this._cameraControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    );
    // 2.10 设置摄像机平移的方式，将在空间内平移
    this._cameraControls.screenSpacePanning = true;
    // 2.11 更新控制器，相机改变时调用
    this._cameraControls.update();

    // 2.12 窗口 resize 的事件
    window.addEventListener("resize", () => {
      this.resize();
    });
    // 2.13 渲染器和相机都准备好了
    this.isReady = true;
    // 2.14 调用 update 方法，将会在理论上每帧后都执行 update
    this.update();
  }

  /**
   * canvasの親要素を参照してサイズを変更する
   */
  public resize() {
    if (!this._renderer) return;

    const parentElement = this._renderer.domElement.parentElement;
    if (!parentElement) return;

    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(
      parentElement.clientWidth,
      parentElement.clientHeight
    );

    if (!this._camera) return;
    this._camera.aspect =
      parentElement.clientWidth / parentElement.clientHeight;
    this._camera.updateProjectionMatrix();
  }

  /**
   * VRMのheadノードを参照してカメラ位置を調整する
   */
  public resetCamera() {
    const headNode = this.model?.vrm?.humanoid.getNormalizedBoneNode("head");

    if (headNode) {
      const headWPos = headNode.getWorldPosition(new THREE.Vector3());
      this._camera?.position.set(
        this._camera.position.x,
        headWPos.y,
        this._camera.position.z
      );
      this._cameraControls?.target.set(headWPos.x, headWPos.y, headWPos.z);
      this._cameraControls?.update();
    }
  }

  public update = () => {
    requestAnimationFrame(this.update);
    const delta = this._clock.getDelta();
    // update vrm components
    // 3.1 首次开始的时候，还没有 model
    if (this.model) {
      this.model.update(delta);
    }

    // 3.2 将场景和相机渲染到渲染器上面
    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  };
}
