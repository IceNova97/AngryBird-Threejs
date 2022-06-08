import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Cannon, { Vec3 } from "cannon";
import * as dat from "dat.gui";
import fragmentShader from "./shaders/fragementShader.glsl";
import vertexShader from "./shaders/vertexShader.glsl";

export const gameStart = (game) => {
  // 游戏开始
  game.status = 1;
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
  const flagTexture1 = textureLoader.load("/textures/flags/flag1.png");
  const flagTexture2 = textureLoader.load("/textures/flags/flag2.png");
  const flagTexture3 = textureLoader.load("/textures/flags/flag3.png");
  const flagTextures = [flagTexture1, flagTexture2, flagTexture3];

  const envTextureLoader = new THREE.CubeTextureLoader();
  const envmap = envTextureLoader.load([
    "/textures/bird.png",
    "/textures/bird.png",
    "/textures/bird.png",
    "/textures/bird.png",
    "/textures/bird.png",
    "/textures/bird.png",
  ]);

  // 加载自定义shader
  const shaderMaterial = new THREE.ShaderMaterial({
    fragmentShader,
    vertexShader,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: {
        value: 0,
      },
      flagTexture: {
        value: flagTextures[Math.floor(Math.random() * 3)],
      },
    },
    // wireframe: true,
  });

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

  /**
   * 几何部分
   */
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
  let text = null;
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
    //设置文本对象居中
    textGeometry.computeBoundingBox();

    // 新建几何体对象并添加到屏幕中
    text = new THREE.Mesh(textGeometry, new THREE.MeshNormalMaterial());
    text.rotation.y = -Math.PI * 0.5;
    text.position.x = 40;
    scene.add(text);
  });

  // 旗帜
  const flagGeometry = new THREE.PlaneBufferGeometry(1.5, 1.5, 32, 32);
  const flagGroup = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    // 插 4 面旗，x 保持前进， z轴正负交错，y轴保持1
    const flag = new THREE.Mesh(flagGeometry, shaderMaterial);
    flag.position.y = 1;
    flag.position.x = i * 5.0 + 1.5;
    flag.position.z = (i % 2 === 0 ? 1 : -1) * 5;
    flagGroup.add(flag);
  }
  scene.add(flagGroup);

  // 胜利之后--彩色粒子爆炸效果
  let isBoom = false;
  const originPosition = new THREE.Vector3(0.0, -1.0, 0.0);
  const particleGeometry = new THREE.BufferGeometry();
  // 可以自定义粒子位置，数量信息
  const count = 12000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < positions.length; i++) {
    if (i % 3 === 2) {
      positions[i] = (Math.random() - 0.5) * 10;
    } else {
      positions[i] = (Math.random() - 0.5) * 2;
    }
    colors[i] = Math.random();
  }
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  // 可以修改粒子的颜色，材质等
  const particleTexture = textureLoader.load("/textures/particles/fire.png");
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.1,
    sizeAttenuation: true,
    //   map: particleTexture,
    transparent: true,
    alphaMap: particleTexture,
    color: "#ff88cc",
  });
  // 修改粒子叠加的效果
  // particleMaterial.colorWrite = 0.01;
  // particleMaterial.depthTest = false;
  particleMaterial.depthWrite = false;
  particleMaterial.vertexColors = true;
  // 修改 Blending 属性
  particleMaterial.blending = THREE.AdditiveBlending;
  let particle = new THREE.Points(particleGeometry, particleMaterial);
  particle.position.x = 40;

  // 加载胜利音效
  const winSound = new Audio("/sounds/win.mp3");

  /**
   * 摄像机
   */
  const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100
  );
  camera.position.set(-7.3, 4.8, 0);
  scene.add(camera);

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
  floorBody.quaternion.setFromAxisAngle(
    new Cannon.Vec3(-1, 0, 0),
    Math.PI * 0.5
  );
  world.addBody(floorBody);

  const shape = new Cannon.Sphere(0.5);
  // 创建body，指定形状，质量，位置
  const body = new Cannon.Body({
    mass: 0.8,
    shape,
    position: new Cannon.Vec3(0.0, 1.0, 0.0),
    material: defaultMaterial,
  });
  const handlerCollide = (collision) => {
    // 发生了碰撞事件
    if (collision.body === airBody) {
      // 停用监听
      body.removeEventListener("collide", handlerCollide);
      // 显示胜利烟花，并且使它绽放
      scene.add(particle);
      isBoom = true;
      winSound.play();
      // 加1000分
      game.score += 1000;
      // 游戏获胜
      game.status = 2;
      // 进行销毁
      setTimeout(() => {
        isBoom = false;
        scene.remove(particle);
      }, 3000);
    }
  };

  body.addEventListener("collide", handlerCollide);
  world.addBody(body);

  // 添加空气墙---胜利文字
  const airBody = new Cannon.Body({
    mass: 10000,
    shape: new Cannon.Box(new Vec3(1, 10, 10)),
    position: new Cannon.Vec3(40.0, 10, 0.0),
    material: defaultMaterial,
  });
  world.addBody(airBody);

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

    // 更新shader中的时间
    shaderMaterial.uniforms.uTime.value = elapsedTime;

    world.step(1 / 60, deltaTime, 3);

    // 每帧进行渲染器和控制器的重新渲染
    controls.update();
    // 相机跟随移动
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

    // 烟花绽放
    if (isBoom) {
      for (let i = 0; i < positions.length; i += 3) {
        const local = new THREE.Vector3(
          positions[i],
          positions[i + 1],
          positions[i + 2]
        );
        // 距离中心点，向外爆开
        const newPosition = local
          .clone()
          .sub(originPosition)
          .multiplyScalar(1.0 + elapsedTime * Math.abs(Math.sin(i) * 0.02))
          .add(originPosition);
        positions[i] = newPosition.x;
        positions[i + 1] = newPosition.y;
        positions[i + 2] = newPosition.z;
      }
      particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
    }
    window.requestAnimationFrame(tick);
  }

  tick();
};
