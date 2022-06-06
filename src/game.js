import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Cannon from "cannon";
import * as dat from "dat.gui";

// debug
const gui = new dat.GUI();

// 场景
const scene = new THREE.Scene();

// 基础参数
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let force = null;
// Canvas
const canvas = document.querySelector("canvas.webgl");

// 纹理加载器
const textureLoader = new THREE.TextureLoader();
const birdTexture = textureLoader.load("/textures/bird.png");

const envTextureLoader = new THREE.CubeTextureLoader();
const envmap = envTextureLoader.load([
  "/textures/bird.png",
  "/textures/bird.png",
  "/textures/bird.png",
  "/textures/bird.png",
  "/textures/bird.png",
  "/textures/bird.png",
]);

// grass
const grassAmbientTexture = textureLoader.load(
  "/textures/grass/ambientOcclusion.jpg"
);
const grassColorTexture = textureLoader.load("/textures/grass/color.jpg");
const grassNormalTexture = textureLoader.load("/textures/grass/normal.jpg");
const grassRoughnessTexture = textureLoader.load(
  "/textures/grass/roughness.jpg"
);

grassColorTexture.repeat.set(8, 8);
grassAmbientTexture.repeat.set(8, 8);
grassNormalTexture.repeat.set(8, 8);
grassRoughnessTexture.repeat.set(8, 8);
grassColorTexture.wrapS = THREE.RepeatWrapping;
grassColorTexture.wrapT = THREE.RepeatWrapping;
grassAmbientTexture.wrapS = THREE.RepeatWrapping;
grassAmbientTexture.wrapT = THREE.RepeatWrapping;
grassNormalTexture.wrapS = THREE.RepeatWrapping;
grassNormalTexture.wrapT = THREE.RepeatWrapping;
grassRoughnessTexture.wrapS = THREE.RepeatWrapping;
grassRoughnessTexture.wrapT = THREE.RepeatWrapping;

scene.background = envmap;

// 材质对象
const floorMaterial = new THREE.MeshStandardMaterial({
  map: grassColorTexture,
  aoMap: grassAmbientTexture,
  normalMap: grassNormalTexture,
  roughnessMap: grassRoughnessTexture,
});
floorMaterial.side = THREE.DoubleSide;
const birdMaterial = new THREE.MeshBasicMaterial({
  map: birdTexture,
});
// 几何部分
// 地面
const floor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(50, 10),
  floorMaterial
);
// 向上进行翻转
floor.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI * 0.5);
// 调整位置
floor.position.y = -0.5001;
floor.position.x = 20;
scene.add(floor);
// 小鸟
const birds = [];
const birdGeometry = new THREE.SphereBufferGeometry(0.5, 32, 32);
const redBird = new THREE.Mesh(birdGeometry, birdMaterial);
redBird.position.set(0.0, 1.0, 0.0);
scene.add(redBird);
birds.push(redBird);

// 胜利文字
// 字体加载器
const fontLoader = new THREE.FontLoader();
// 加载字体
fontLoader.load("/fonts/helvetiker_regular.typeface.json", (font) => {
  // 新建文本
  const textGeometry = new THREE.TextBufferGeometry("YOU WIN!", {
    font,
    size: 1,
    height: 0.2,
    curveSegments: 2,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 1,
  });
  textGeometry.center();
  // 设置文本对象居中
  textGeometry.computeBoundingBox();
  //   textGeometry.translate(
  //     - (textGeometry.boundingBox.max.x - 0.02) * 0.5,
  //     - (textGeometry.boundingBox.max.y - 0.02) * 0.5,
  //     - (textGeometry.boundingBox.max.z - 0.03) * 0.5
  //   );

  // 新建几何体对象并添加到屏幕中
  const text = new THREE.Mesh(textGeometry, new THREE.MeshNormalMaterial());
  text.rotation.y = - Math.PI * 0.5;
  text.position.x = 40;
  scene.add(text);
});

// 摄像机
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-7.3, 4.8, 0);
scene.add(camera);

gui.add(camera.position, "x").max(10).min(-10).step(0.1).name("摄像机位置x");
gui.add(camera.position, "y").max(10).min(-10).step(0.1).name("摄像机位置y");
gui.add(camera.position, "z").max(10).min(-10).step(0.1).name("摄像机位置z");

// 控制器
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// 自适应尺寸
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // 更新相机参数
  camera.aspect = sizes.width / sizes.height;
  camera.lookAt(redBird);
  camera.updateProjectionMatrix();

  // 渲染器更新
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 添加环境光
const light = new THREE.AmbientLight("#fff", 1);

scene.add(light);

/**
 * 物理世界
 */
const world = new Cannon.World();
world.gravity = new Cannon.Vec3(0, -9.8, 0);
// 指定默认材质，摩擦系数和反弹系数
const defaultMaterial = new Cannon.Material("default");
const contactMaterial = new Cannon.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.8,
    restitution: 0.3,
  }
);
world.addContactMaterial(contactMaterial);
// 同步创建小鸟和地面 模型
const floorShape = new Cannon.Plane();
const floorBody = new Cannon.Body({
  mass: 0,
  shape: floorShape,
  position: new Cannon.Vec3(0, -0.50001, 0),
  material: defaultMaterial,
});
// 旋转地面
floorBody.quaternion.setFromAxisAngle(new Cannon.Vec3(-1, 0, 0), Math.PI * 0.5);
world.addBody(floorBody);

const shape = new Cannon.Sphere(0.5);
// 创建body，指定形状，质量，位置
const body = new Cannon.Body({
  mass: 0.8,
  shape,
  position: new Cannon.Vec3(0.0, 1.0, 0.0),
  material: defaultMaterial,
});
body.addEventListener("collide", (collision) => {
  console.log("发生碰撞");
});
world.addBody(body);

// 加入射线，模拟鼠标事件
const raycaster = new THREE.Raycaster();
// 记录当前鼠标指针的位置
const mouse = new THREE.Vector2();
window.addEventListener("mousemove", (event) => {
  const x = (event.clientX / sizes.width - 0.5) * 2;
  const y = -(event.clientY / sizes.height - 0.5) * 2;
  mouse.set(x, y);
});

let currentIntersect = null;
// 模拟几何体的点击事件
window.addEventListener("click", () => {
  if (currentIntersect) {
    console.log("currentIntersect: ", currentIntersect);
    switch (currentIntersect.object) {
      case redBird:
        const forcePosition = {
          x: -camera.position.x * 50,
          y: -camera.position.y * 50 + 800,
          z: -camera.position.z * 50,
        };

        body.applyForce(forcePosition, body.position);
        break;
    }
  } else {
    console.log("empty");
  }
});

// 键盘控制小球的移动
// 可能有组合键的情况，例如 ↑ + →, 暂时只考虑两种组件键的情况
let forcePosition = {
  // 按下后，状态更新为true，按键抬起进行重置
  x: 0.0,
  y: 0.0,
  z: 0.0,
};
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "w":
    case "W":
    case "ArrowUp":
      forcePosition.x = 1;
      break;
    case "s":
    case "S":
    case "ArrowDown":
      forcePosition.x = -1;
      break;
    case "a":
    case "A":
    case "ArrowLeft":
      forcePosition.z = -1;
      break;
    case "d":
    case "D":
    case "ArrowRight":
      forcePosition.z = 1;
      break;
    default:
      console.log(e.key);
  }
  body.applyForce(forcePosition, new Cannon.Vec3(0.0, 0.0, 0.0));
});

window.addEventListener("keyup", (e) => {
  body.sleep();
  body.wakeUp();
  switch (e.key) {
    case "w":
    case "W":
    case "ArrowUp":
      forcePosition.x = 0.0;
      break;
    case "s":
    case "S":
    case "ArrowDown":
      forcePosition.x = 0.0;
      break;
    case "a":
    case "A":
    case "ArrowLeft":
      forcePosition.z = 0.0;
      break;
    case "d":
    case "D":
    case "ArrowRight":
      forcePosition.z = 0.0;
  }
});

// 渲染器
const renderer = new THREE.WebGLRenderer({
  canvas,
});

renderer.setSize(sizes.width, sizes.height);

const clock = new THREE.Clock();

// 每帧重新渲染
let oldElapsedtime = 0;
function tick() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedtime;
  oldElapsedtime = elapsedTime;

  world.step(1 / 60, deltaTime, 3);

  // 每帧进行渲染器和控制器的重新渲染
  controls.update();
  const cameraPosition = {
    x: redBird.position.x - 2,
    y: redBird.position.y + 2,
    z: redBird.position.z,
  };
  camera.position.copy(cameraPosition);
  camera.lookAt(redBird.position);
  renderer.render(scene, camera);
  // 调整射线的方向
  raycaster.setFromCamera(mouse, camera);

  // 计算得到当前鼠标停止位置的小鸟
  const intersectObjects = raycaster.intersectObjects(birds);
  if (intersectObjects.length) {
    currentIntersect = intersectObjects[0];
  } else {
    currentIntersect = null;
  }

  // 同步小鸟的位置
  redBird.position.copy(body.position);
  redBird.quaternion.copy(body.quaternion);
  redBird.position.copy(body.position);

  window.requestAnimationFrame(tick);
}

tick();
