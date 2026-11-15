import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  EXAM_DURATION_SECONDS,
  GameScreen,
  PLANT_CATALOG,
  PlantDefinition,
  YARD_BOUNDS,
  findOpenSpawnPosition,
  getMinimumCumulativeWeeds,
  getTargetPlantBudget,
  pickRandomPlant,
} from './rules';

export interface PlantPullEvent {
  isWeed: boolean;
  label: string;
  screenX: number;
  screenY: number;
}

export interface MeadowSceneCallbacks {
  onPlantPulled: (event: PlantPullEvent) => void;
  onTimerTick: (remainingSeconds: number) => void;
  onExamFinished: () => void;
}

interface ActivePlant {
  id: number;
  def: PlantDefinition;
  group: THREE.Group;
  billboard: THREE.Mesh;
  hitMesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
  x: number;
  z: number;
  age: number;
  swayPhase: number;
  baseScale: number;
  hovered: boolean;
  pulling: boolean;
  pullProgress: number;
  pullDir: number;
  ttl: number;
}

interface DirtHole {
  mesh: THREE.Mesh;
  age: number;
  maxAge: number;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rot: number;
  vrot: number;
  scale: number;
  age: number;
  maxAge: number;
  color: THREE.Color;
}

interface CharacterActor {
  id: 'usagi' | 'chiikawa' | 'hachiware';
  group: THREE.Group;
  billboard: THREE.Mesh;
  shadow: THREE.Mesh;
  sweatGroup: THREE.Group;
  baseX: number;
  baseZ: number;
  baseWidth: number;
  baseHeight: number;
  phase: number;
  happyTimer: number;
  panicTimer: number;
}

interface ButterflyActor {
  group: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  baseY: number;
  speed: number;
  phase: number;
}

// Reusable scratch math objects (zero GC in render loop)
const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _standQuat = new THREE.Quaternion();
const _charQuat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();

function detectSoftwareGl(): boolean {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

function createGroundTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Lush sage-green meadow base matching IMG_1421–1425
  ctx.fillStyle = '#b4d883';
  ctx.fillRect(0, 0, size, size);

  // Subtle lighter sage patches outside clearing
  const outerPatches = [
    [160, 180, 170],
    [840, 190, 190],
    [130, 760, 180],
    [870, 810, 210],
    [510, 140, 150],
  ];
  for (const [px, py, pr] of outerPatches) {
    const grad = ctx.createRadialGradient(px, py, pr * 0.2, px, py, pr);
    grad.addColorStop(0, 'rgba(206, 230, 158, 0.52)');
    grad.addColorStop(1, 'rgba(206, 230, 158, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Organic warm cream dirt clearing inside the fenced yard (matching IMG_1421–1425)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(270, 415);
  ctx.bezierCurveTo(285, 325, 445, 315, 525, 360);
  ctx.bezierCurveTo(615, 408, 595, 515, 650, 595);
  ctx.bezierCurveTo(720, 695, 760, 795, 645, 865);
  ctx.bezierCurveTo(510, 935, 315, 895, 255, 760);
  ctx.bezierCurveTo(210, 655, 258, 515, 270, 415);
  ctx.closePath();
  ctx.fillStyle = '#eee4c5';
  ctx.fill();

  // Secondary warm dirt clearing in upper-right meadow behind fence
  ctx.beginPath();
  ctx.ellipse(675, 255, 130, 64, -0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#ece2c3';
  ctx.fill();

  // Soft grass-shadow pools near the characters and edges
  const dappleShadows = [
    [430, 395, 78, 22],
    [580, 470, 85, 26],
    [640, 560, 92, 28],
    [480, 740, 95, 30],
    [690, 665, 70, 24],
  ];
  for (const [sx, sy, rx, ry] of dappleShadows) {
    ctx.beginPath();
    ctx.ellipse(sx, sy, rx, ry, 0.08, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(116, 152, 82, 0.25)';
    ctx.fill();
  }
  ctx.restore();

  // Hand-drawn crisp grass blade tufts across meadow and dirt clearing
  let seed = 4219;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 420; i++) {
    const gx = rand() * size;
    const gy = rand() * size;
    const blades = 1 + Math.floor(rand() * 3);
    ctx.strokeStyle = rand() > 0.35 ? '#48762e' : '#5e8e3b';
    ctx.lineWidth = 1.6 + rand() * 0.9;
    ctx.lineCap = 'round';
    for (let b = 0; b < blades; b++) {
      const ox = (b - 0.5) * 3.5;
      const lean = (rand() - 0.5) * 9;
      const h = 6 + rand() * 8;
      ctx.beginPath();
      ctx.moveTo(gx + ox, gy);
      ctx.quadraticCurveTo(gx + ox + lean * 0.4, gy - h * 0.6, gx + ox + lean, gy - h);
      ctx.stroke();
    }
  }

  // Tiny meadow wildflowers outside the central yard
  for (let i = 0; i < 54; i++) {
    const fx = rand() * size;
    const fy = rand() * size;
    if (fx > 240 && fx < 760 && fy > 320 && fy < 880) continue;
    ctx.fillStyle = rand() > 0.5 ? '#fde06c' : '#f7b2c4';
    ctx.beginPath();
    ctx.arc(fx, fy, 3.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#474036';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(38, 42, 26, 0.48)');
  grad.addColorStop(0.55, 'rgba(38, 42, 26, 0.22)');
  grad.addColorStop(1, 'rgba(38, 42, 26, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function createDirtHoleTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2 - 4);
  grad.addColorStop(0, 'rgba(84, 52, 30, 0.92)');
  grad.addColorStop(0.55, 'rgba(116, 76, 45, 0.72)');
  grad.addColorStop(0.85, 'rgba(146, 106, 66, 0.25)');
  grad.addColorStop(1, 'rgba(146, 106, 66, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2, size * 0.44, size * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

export class MeadowScene {
  private container: HTMLElement;
  private callbacksRef: { current: MeadowSceneCallbacks };
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private textureLoader = new THREE.TextureLoader();

  private textureCache = new Map<string, THREE.Texture>();
  private shadowTexture: THREE.CanvasTexture;
  private dirtHoleTexture: THREE.CanvasTexture;
  private shadowDiscGeo: THREE.PlaneGeometry;
  private dirtHoleGeo: THREE.PlaneGeometry;

  private plantsGroup = new THREE.Group();
  private holesGroup = new THREE.Group();
  private activePlants: ActivePlant[] = [];
  private dirtHoles: DirtHole[] = [];
  private nextPlantId = 1;

  private characters: CharacterActor[] = [];
  private butterflies: ButterflyActor[] = [];

  // Pooled particles (InstancedMesh)
  private readonly maxParticles = 140;
  private particlePool: Particle[] = [];
  private particleMesh!: THREE.InstancedMesh;

  private currentScreen: GameScreen = 'title';
  private modalPaused = false;
  private roundDuration = EXAM_DURATION_SECONDS;
  private examRemaining = EXAM_DURATION_SECONDS;
  private examElapsed = 0;
  private spawnCooldown = 0;
  private totalWeedsSpawned = 0;
  private lastReportedSecond = EXAM_DURATION_SECONDS;
  private currentAspect = 16 / 9;

  // Camera smooth targets
  private cameraPosTarget = new THREE.Vector3(0, 7.6, 11.4);
  private cameraLookTarget = new THREE.Vector3(0, 1.0, -2.5);
  private cameraLookCurrent = new THREE.Vector3(0, 1.0, -2.5);
  private cameraShake = 0;

  private frameId = 0;
  private disposed = false;
  private resizeObserver: ResizeObserver;
  private maxAnisotropy = 1;

  constructor(container: HTMLElement, callbacks: MeadowSceneCallbacks) {
    this.container = container;
    this.callbacksRef = { current: callbacks };
    this.isSoftwareGl = detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.currentAspect = width / Math.max(1, height);
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color('#dfecd4');
    this.scene.background = skyColor;
    this.scene.fog = new THREE.Fog('#dfecd4', 24, 58);

    this.camera = new THREE.PerspectiveCamera(this.computeResponsiveFov(this.currentAspect), this.currentAspect, 0.1, 120);
    this.applyCameraTargetsForScreen(this.currentScreen);
    this.camera.position.copy(this.cameraPosTarget);
    this.cameraLookCurrent.copy(this.cameraLookTarget);
    this.camera.lookAt(this.cameraLookCurrent);

    // Environment reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Raycaster only intersects layer 1 (plant hit proxies)
    this.raycaster.layers.set(1);

    this.shadowTexture = createContactShadowTexture();
    this.dirtHoleTexture = createDirtHoleTexture();
    this.shadowDiscGeo = new THREE.PlaneGeometry(1, 1);
    this.shadowDiscGeo.rotateX(-Math.PI / 2);
    this.dirtHoleGeo = new THREE.PlaneGeometry(1.1, 0.85);
    this.dirtHoleGeo.rotateX(-Math.PI / 2);

    this.setupLighting();
    this.buildSkyAndHills();
    this.buildGround();
    this.buildTreesAndBushes();
    this.buildFence();
    this.buildCharacters();
    this.buildButterflies();
    this.buildParticleSystem();

    this.scene.add(this.holesGroup);
    this.scene.add(this.plantsGroup);

    // Seed initial title screen showcase plants (matching IMG_1421)
    this.spawnTitleShowcasePlants();

    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.tick();
  }

  private setupLighting() {
    const hemi = new THREE.HemisphereLight(0xf3faea, 0x80a65b, 0.78);
    this.scene.add(hemi);

    // Warm sunlight from left-front-above so fence casts diagonal shadows inward
    const key = new THREE.DirectionalLight(0xfff4d6, 0.96);
    key.position.set(-14, 18, 5);
    key.castShadow = !this.isSoftwareGl;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 48;
    key.shadow.camera.left = -16;
    key.shadow.camera.right = 16;
    key.shadow.camera.top = 14;
    key.shadow.camera.bottom = -14;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xe4f5d9, 0.3);
    rim.position.set(10, 8, -12);
    this.scene.add(rim);
  }

  private buildSkyAndHills() {
    // Distant pastel rolling hills matching IMG_1421
    const hillMatBack = new THREE.MeshStandardMaterial({
      color: 0xb7d893,
      roughness: 0.95,
      metalness: 0.0,
    });
    const hillMatFront = new THREE.MeshStandardMaterial({
      color: 0xa7cc81,
      roughness: 0.95,
      metalness: 0.0,
    });

    const hillSpecs: Array<{ x: number; y: number; z: number; rx: number; ry: number; rz: number; back: boolean }> = [
      { x: -18, y: -1.8, z: -26, rx: 18, ry: 6.2, rz: 9, back: true },
      { x: 0, y: -2.0, z: -28, rx: 22, ry: 5.5, rz: 10, back: true },
      { x: 19, y: -1.6, z: -25, rx: 17, ry: 6.8, rz: 9, back: true },
      { x: -11, y: -2.3, z: -19, rx: 14, ry: 4.1, rz: 7, back: false },
      { x: 11, y: -2.1, z: -19, rx: 15, ry: 4.5, rz: 7, back: false },
    ];

    const sphereGeo = new THREE.SphereGeometry(1, 24, 16);
    for (const h of hillSpecs) {
      const hill = new THREE.Mesh(sphereGeo, h.back ? hillMatBack : hillMatFront);
      hill.position.set(h.x, h.y, h.z);
      hill.scale.set(h.rx, h.ry, h.rz);
      hill.receiveShadow = true;
      this.scene.add(hill);
    }
  }

  private buildGround() {
    const groundTex = createGroundTexture();
    groundTex.anisotropy = this.maxAnisotropy;
    const groundGeo = new THREE.PlaneGeometry(54, 46);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      color: 0xffffff,
      roughness: 0.96,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, 0, -1);
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private buildTreesAndBushes() {
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x8f6642,
      roughness: 0.9,
      metalness: 0.0,
    });
    const leafMatMain = new THREE.MeshStandardMaterial({
      color: 0x71ad4f,
      roughness: 0.85,
      metalness: 0.0,
    });
    const leafMatShade = new THREE.MeshStandardMaterial({
      color: 0x619942,
      roughness: 0.88,
      metalness: 0.0,
    });
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0x454035,
      side: THREE.BackSide,
    });

    const trunkGeo = new THREE.CylinderGeometry(0.32, 0.46, 2.5, 12);
    const lobeGeo = new THREE.SphereGeometry(1, 18, 14);

    // 5 stylized trees behind the fence matching IMG_1421
    const treePositions = [
      { x: -11.2, z: -9.4, scale: 1.18 },
      { x: -5.4, z: -10.8, scale: 0.96 },
      { x: 0.4, z: -11.2, scale: 1.04 },
      { x: 6.4, z: -10.4, scale: 0.98 },
      { x: 12.2, z: -9.0, scale: 1.24 },
    ];

    for (const tp of treePositions) {
      const tree = new THREE.Group();
      tree.position.set(tp.x, 0, tp.z);
      tree.scale.setScalar(tp.scale);

      // Trunk (pivoted bottom-center)
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.25;
      trunk.castShadow = !this.isSoftwareGl;
      trunk.receiveShadow = true;
      tree.add(trunk);

      // Multi-lobe organic foliage silhouette (4 parts + soft outline)
      const lobes: Array<[number, number, number, number, number, number, boolean]> = [
        [0, 3.25, 0, 1.65, 1.45, 1.45, false],
        [-0.78, 2.75, 0.25, 1.15, 1.05, 1.1, true],
        [0.8, 2.75, 0.2, 1.12, 1.05, 1.1, false],
        [0, 4.15, -0.1, 1.12, 1.12, 1.08, false],
      ];
      for (const [lx, ly, lz, sx, sy, sz, shade] of lobes) {
        const lobe = new THREE.Mesh(lobeGeo, shade ? leafMatShade : leafMatMain);
        lobe.position.set(lx, ly, lz);
        lobe.scale.set(sx, sy, sz);
        lobe.castShadow = !this.isSoftwareGl;
        lobe.receiveShadow = true;
        tree.add(lobe);

        const outline = new THREE.Mesh(lobeGeo, outlineMat);
        outline.position.set(lx, ly, lz);
        outline.scale.set(sx * 1.04, sy * 1.04, sz * 1.04);
        tree.add(outline);
      }

      // Ground contact shadow
      const shadow = new THREE.Mesh(
        this.shadowDiscGeo,
        new THREE.MeshBasicMaterial({
          map: this.shadowTexture,
          transparent: true,
          depthWrite: false,
          opacity: 0.45,
        }),
      );
      shadow.position.y = 0.015;
      shadow.scale.set(4.2, 1, 2.6);
      tree.add(shadow);

      this.scene.add(tree);
    }

    // Small rounded bushes along outer fence perimeter
    const bushPositions = [
      { x: -8.6, z: -7.5, s: 0.92 },
      { x: -3.2, z: -7.2, s: 0.68 },
      { x: 3.7, z: -6.8, s: 0.72 },
      { x: 8.6, z: -7.6, s: 0.96 },
      { x: 8.5, z: -1.6, s: 0.78 },
      { x: -8.9, z: -2.2, s: 0.75 },
    ];
    for (const bp of bushPositions) {
      const bush = new THREE.Group();
      bush.position.set(bp.x, 0, bp.z);
      bush.scale.setScalar(bp.s);

      const main = new THREE.Mesh(lobeGeo, leafMatMain);
      main.position.set(0, 0.55, 0);
      main.scale.set(1.05, 0.76, 0.92);
      main.castShadow = !this.isSoftwareGl;
      bush.add(main);

      const side = new THREE.Mesh(lobeGeo, leafMatShade);
      side.position.set(0.55, 0.42, 0.12);
      side.scale.set(0.66, 0.56, 0.65);
      bush.add(side);

      const outline = new THREE.Mesh(lobeGeo, outlineMat);
      outline.position.copy(main.position);
      outline.scale.set(1.09, 0.8, 0.96);
      bush.add(outline);

      const shadow = new THREE.Mesh(
        this.shadowDiscGeo,
        new THREE.MeshBasicMaterial({
          map: this.shadowTexture,
          transparent: true,
          depthWrite: false,
          opacity: 0.35,
        }),
      );
      shadow.position.y = 0.015;
      shadow.scale.set(2.4, 1, 1.6);
      bush.add(shadow);

      this.scene.add(bush);
    }
  }

  private buildFence() {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xcfb17b,
      roughness: 0.86,
      metalness: 0.0,
    });
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xc0a06b,
      roughness: 0.84,
      metalness: 0.0,
    });
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0x4b4033,
      side: THREE.BackSide,
    });

    const postGeo = new THREE.BoxGeometry(0.24, 1.05, 0.24);
    const capGeo = new THREE.ConeGeometry(0.18, 0.18, 4);
    capGeo.rotateY(Math.PI / 4);

    const fenceGroup = new THREE.Group();

    const addPost = (x: number, z: number) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(x, 0, z);

      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.y = 0.525;
      post.castShadow = !this.isSoftwareGl;
      post.receiveShadow = true;
      pGroup.add(post);

      const postOut = new THREE.Mesh(postGeo, outlineMat);
      postOut.position.y = 0.525;
      postOut.scale.set(1.12, 1.03, 1.12);
      pGroup.add(postOut);

      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 1.14;
      cap.castShadow = !this.isSoftwareGl;
      pGroup.add(cap);

      const capOut = new THREE.Mesh(capGeo, outlineMat);
      capOut.position.y = 1.14;
      capOut.scale.set(1.14, 1.14, 1.14);
      pGroup.add(capOut);

      fenceGroup.add(pGroup);
    };

    const addRailSegment = (x1: number, z1: number, x2: number, z2: number) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const railGeo = new THREE.BoxGeometry(0.09, 0.11, len);

      for (const ry of [0.36, 0.74]) {
        const rail = new THREE.Mesh(railGeo, woodMat);
        rail.position.set((x1 + x2) / 2, ry, (z1 + z2) / 2);
        rail.rotation.y = angle;
        rail.castShadow = !this.isSoftwareGl;
        rail.receiveShadow = true;
        fenceGroup.add(rail);

        const railOut = new THREE.Mesh(railGeo, outlineMat);
        railOut.position.copy(rail.position);
        railOut.rotation.y = angle;
        railOut.scale.set(1.22, 1.24, 1.0);
        fenceGroup.add(railOut);
      }
    };

    // Back fence placed well behind characters so character heads never clip fence posts/rails
    const backXs = [-6.8, -4.53, -2.26, 0, 2.26, 4.53, 6.8];
    for (let i = 0; i < backXs.length; i++) {
      addPost(backXs[i], -5.45);
      if (i < backXs.length - 1) {
        addRailSegment(backXs[i], -5.45, backXs[i + 1], -5.45);
      }
    }

    // Left & Right fences: z from -5.45 to +4.8
    const sideZs = [-5.45, -2.9, -0.35, 2.2, 4.8];
    for (let i = 1; i < sideZs.length; i++) {
      addPost(-6.8, sideZs[i]);
      addRailSegment(-6.8, sideZs[i - 1], -6.8, sideZs[i]);

      addPost(6.8, sideZs[i]);
      addRailSegment(6.8, sideZs[i - 1], 6.8, sideZs[i]);
    }

    this.scene.add(fenceGroup);
  }

  private getTexture(path: string): THREE.Texture {
    const cached = this.textureCache.get(path);
    if (cached) return cached;
    const tex = this.textureLoader.load(path);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.textureCache.set(path, tex);
    return tex;
  }

  private createSweatIndicator(): THREE.Group {
    const group = new THREE.Group();
    const dropCanvas = document.createElement('canvas');
    dropCanvas.width = 64;
    dropCanvas.height = 64;
    const ctx = dropCanvas.getContext('2d')!;
    // Comic blue sweat drop + exclamation mark
    ctx.fillStyle = '#7bd3ff';
    ctx.strokeStyle = '#2d2926';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(32, 8);
    ctx.quadraticCurveTo(50, 34, 46, 46);
    ctx.arc(32, 44, 14, 0, Math.PI);
    ctx.quadraticCurveTo(14, 34, 32, 8);
    ctx.fill();
    ctx.stroke();

    const tex = new THREE.CanvasTexture(dropCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
    const geo = new THREE.PlaneGeometry(0.42, 0.42);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0.65, 1.55, 0.05);
    group.add(mesh);
    group.visible = false;
    return group;
  }

  private buildCharacters() {
    // Cropped sprites from user's uploaded images, rendered as 2D billboards in the 3D scene!
    const specs: Array<{
      id: 'usagi' | 'chiikawa' | 'hachiware';
      sprite: string;
      x: number;
      z: number;
      width: number;
      height: number;
      phase: number;
    }> = [
      {
        id: 'usagi',
        sprite: '/assets/sprites/usagi_s2.png',
        x: -2.45,
        z: -3.52,
        width: 1.48,
        height: 1.98,
        phase: 0.0,
      },
      {
        id: 'chiikawa',
        sprite: '/assets/sprites/chiikawa_s2.png',
        x: 0.0,
        z: -3.38,
        width: 1.42,
        height: 1.58,
        phase: 1.8,
      },
      {
        id: 'hachiware',
        sprite: '/assets/sprites/hachiware_s2.png',
        x: 2.45,
        z: -3.52,
        width: 1.5,
        height: 1.72,
        phase: 3.4,
      },
    ];

    for (const c of specs) {
      const group = new THREE.Group();
      group.position.set(c.x, 0, c.z);

      const tex = this.getTexture(c.sprite);
      const geo = new THREE.PlaneGeometry(c.width, c.height);
      // Pivot at bottom-center so characters stand on ground without floating
      geo.translate(0, c.height / 2, 0);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.2,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const billboard = new THREE.Mesh(geo, mat);
      billboard.renderOrder = 4;
      group.add(billboard);

      const shadow = new THREE.Mesh(
        this.shadowDiscGeo,
        new THREE.MeshBasicMaterial({
          map: this.shadowTexture,
          transparent: true,
          depthWrite: false,
          opacity: 0.42,
        }),
      );
      shadow.position.y = 0.015;
      shadow.scale.set(c.width * 1.05, 1, c.width * 0.65);
      group.add(shadow);

      const sweatGroup = this.createSweatIndicator();
      group.add(sweatGroup);

      this.scene.add(group);
      this.characters.push({
        id: c.id,
        group,
        billboard,
        shadow,
        sweatGroup,
        baseX: c.x,
        baseZ: c.z,
        baseWidth: c.width,
        baseHeight: c.height,
        phase: c.phase,
        happyTimer: 0,
        panicTimer: 0,
      });
    }
  }

  private buildButterflies() {
    // Rounded organic butterfly wing silhouette
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(0.12, 0.16, 0.24, 0.15, 0.21, 0.02);
    wingShape.bezierCurveTo(0.2, -0.09, 0.09, -0.14, 0, -0.04);
    const wingGeo = new THREE.ShapeGeometry(wingShape, 8);
    wingGeo.rotateX(-Math.PI / 2);

    const configs = [
      { color: 0xffd94a, cx: -2.2, cz: 0.3, rx: 2.5, rz: 1.6, by: 1.35, speed: 0.85, phase: 0 },
      { color: 0x7fd4ff, cx: 1.8, cz: -0.6, rx: 2.4, rz: 1.9, by: 1.45, speed: 0.72, phase: 2.1 },
      { color: 0xff9ec4, cx: -0.4, cz: 1.2, rx: 3.1, rz: 1.4, by: 1.15, speed: 0.94, phase: 4.3 },
    ];

    for (const cfg of configs) {
      const group = new THREE.Group();
      const wingMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        side: THREE.DoubleSide,
      });

      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.scale.x = -1;
      const rightWing = new THREE.Mesh(wingGeo, wingMat);

      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.025, 0.12, 4, 6),
        new THREE.MeshBasicMaterial({ color: 0x3b332c }),
      );
      body.rotation.x = Math.PI / 2;

      group.add(leftWing, rightWing, body);
      this.scene.add(group);

      this.butterflies.push({
        group,
        leftWing,
        rightWing,
        centerX: cfg.cx,
        centerZ: cfg.cz,
        radiusX: cfg.rx,
        radiusZ: cfg.rz,
        baseY: cfg.by,
        speed: cfg.speed,
        phase: cfg.phase,
      });
    }
  }

  private buildParticleSystem() {
    // Hexagonal dirt/leaf/petal bursts matching IMG_1423!
    const geo = new THREE.CircleGeometry(0.09, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    this.particleMesh = new THREE.InstancedMesh(geo, mat, this.maxParticles);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.frustumCulled = false;

    const white = new THREE.Color(0xffffff);
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push({
        active: false,
        x: 0,
        y: -10,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        rot: 0,
        vrot: 0,
        scale: 0,
        age: 0,
        maxAge: 0.5,
        color: new THREE.Color(),
      });
      _mat4.makeScale(0, 0, 0);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, white);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) {
      this.particleMesh.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.particleMesh);
  }

  private emitParticles(x: number, z: number, isWeed: boolean) {
    const weedColors = [0x8b5a34, 0x674124, 0x72b947, 0x9bd663];
    const flowerColors = [0xffa3be, 0xffd1e0, 0xffffff, 0xffe26a];
    const palette = isWeed ? weedColors : flowerColors;
    const count = isWeed ? 16 : 14;
    let spawned = 0;

    for (let i = 0; i < this.maxParticles && spawned < count; i++) {
      const p = this.particlePool[i];
      if (p.active) continue;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 0.3;
      p.y = 0.16 + Math.random() * 0.25;
      p.z = z + (Math.random() - 0.5) * 0.25;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 2.4;
      p.vx = Math.cos(angle) * speed;
      p.vy = 2.8 + Math.random() * 2.6;
      p.vz = Math.sin(angle) * speed * 0.7;
      p.rot = Math.random() * Math.PI;
      p.vrot = (Math.random() - 0.5) * 10;
      p.scale = 0.75 + Math.random() * 0.85;
      p.age = 0;
      p.maxAge = 0.45 + Math.random() * 0.28;
      p.color.setHex(palette[Math.floor(Math.random() * palette.length)]);
      spawned++;
    }
  }

  private spawnTitleShowcasePlants() {
    this.clearPlants();
    // Decorative lively meadow arrangement matching IMG_1421
    const showcase: Array<{ id: string; x: number; z: number }> = [
      { id: 'weed_long_lg', x: -3.5, z: -0.8 },
      { id: 'weed_toothed_buds_lg', x: -1.45, z: -1.1 },
      { id: 'flower_cluster', x: -2.3, z: -2.2 },
      { id: 'weed_clump', x: 0.15, z: -1.25 },
      { id: 'flower_yellow', x: 1.35, z: -2.1 },
      { id: 'flower_white', x: 0.95, z: 0.5 },
      { id: 'weed_clump', x: 2.35, z: 0.1 },
      { id: 'veg_cabbage', x: 3.55, z: -0.35 },
      { id: 'veg_carrot', x: 2.7, z: -2.1 },
      { id: 'veg_clover', x: 3.9, z: -1.65 },
      { id: 'weed_long_lg', x: 4.1, z: 1.35 },
    ];
    for (const item of showcase) {
      const def = PLANT_CATALOG.find((p) => p.id === item.id) || PLANT_CATALOG[0];
      this.spawnPlant(def, item.x, item.z, 999, false);
    }
  }

  private clearPlants() {
    for (const p of this.activePlants) {
      this.plantsGroup.remove(p.group);
      (p.billboard.material as THREE.Material).dispose();
      p.billboard.geometry.dispose();
      p.hitMesh.geometry.dispose();
      (p.hitMesh.material as THREE.Material).dispose();
      (p.shadowMesh.material as THREE.Material).dispose();
    }
    this.activePlants = [];

    for (const h of this.dirtHoles) {
      this.holesGroup.remove(h.mesh);
      (h.mesh.material as THREE.Material).dispose();
    }
    this.dirtHoles = [];
  }

  private spawnPlant(def: PlantDefinition, x: number, z: number, ttl = 14, countWeed = true) {
    if (def.isWeed && countWeed) {
      this.totalWeedsSpawned++;
    }
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const tex = this.getTexture(def.sprite);
    const geo = new THREE.PlaneGeometry(def.worldWidth, def.worldHeight);
    geo.translate(0, def.worldHeight / 2, 0);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.08,
      premultipliedAlpha: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const billboard = new THREE.Mesh(geo, mat);
    billboard.renderOrder = 3;
    group.add(billboard);

    // Forgiving invisible hit proxy on layer 1
    const hitGeo = new THREE.PlaneGeometry(def.worldWidth * 1.22, def.worldHeight * 1.22);
    hitGeo.translate(0, def.worldHeight / 2, 0);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.layers.set(1);
    const id = this.nextPlantId++;
    hitMesh.userData.plantId = id;
    group.add(hitMesh);

    const shadowMesh = new THREE.Mesh(
      this.shadowDiscGeo,
      new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        depthWrite: false,
        opacity: 0.36,
      }),
    );
    shadowMesh.position.y = 0.014;
    shadowMesh.scale.set(def.worldWidth * 0.92, 1, def.worldWidth * 0.55);
    group.add(shadowMesh);

    const baseScale = 0.92 + Math.random() * 0.16;
    group.scale.set(0.01, 0.01, 0.01);
    this.plantsGroup.add(group);

    this.activePlants.push({
      id,
      def,
      group,
      billboard,
      hitMesh,
      shadowMesh,
      x,
      z,
      age: 0,
      swayPhase: Math.random() * Math.PI * 2,
      baseScale,
      hovered: false,
      pulling: false,
      pullProgress: 0,
      pullDir: Math.random() > 0.5 ? 1 : -1,
      ttl,
    });
  }

  private spawnDirtHole(x: number, z: number) {
    const mat = new THREE.MeshBasicMaterial({
      map: this.dirtHoleTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(this.dirtHoleGeo, mat);
    mesh.position.set(x, 0.016, z);
    mesh.rotation.y = (Math.random() - 0.5) * 0.5;
    this.holesGroup.add(mesh);
    this.dirtHoles.push({ mesh, age: 0, maxAge: 0.95 });
  }

  private computeResponsiveFov(aspect: number): number {
    if (aspect < 1) {
      return Math.min(62, 38 * Math.pow(1 / Math.max(0.44, aspect), 0.43));
    }
    return 38;
  }

  private applyCameraTargetsForScreen(screen: GameScreen) {
    const portraitBoost = this.currentAspect < 1 ? Math.min(3.5, (1 - this.currentAspect) * 5.6) : 0;

    if (screen === 'title') {
      this.cameraPosTarget.set(0, 6.2 + portraitBoost * 0.45, 11.4 + portraitBoost * 0.9);
      this.cameraLookTarget.set(0, 1.35, -3.5);
    } else if (screen === 'playing') {
      this.cameraPosTarget.set(0, 8.6 + portraitBoost * 0.8, 8.8 + portraitBoost * 1.15);
      this.cameraLookTarget.set(0, 0.2, -1.25);
    } else if (screen === 'gameover') {
      this.cameraPosTarget.set(0, 6.8 + portraitBoost * 0.4, 10.6 + portraitBoost * 0.8);
      this.cameraLookTarget.set(0, 1.0, -3.0);
    }
  }

  private getSpawnBounds() {
    if (this.currentAspect < 0.75) {
      return {
        minX: -2.25,
        maxX: 2.25,
        minZ: -2.2,
        maxZ: 5.55,
      };
    }
    if (this.currentAspect < 1) {
      return {
        ...YARD_BOUNDS,
        minX: -3.2,
        maxX: 3.2,
        maxZ: 4.5,
      };
    }
    return YARD_BOUNDS;
  }

  public setScreen(screen: GameScreen) {
    const previous = this.currentScreen;
    this.currentScreen = screen;

    if (screen === 'title') {
      this.applyCameraTargetsForScreen('title');
      if (previous !== 'title') {
        this.spawnTitleShowcasePlants();
      }
      this.renderer.domElement.style.cursor = 'default';
    } else if (screen === 'playing') {
      this.applyCameraTargetsForScreen('playing');
      if (previous === 'title' || previous === 'gameover') {
        this.startNewExamRound(this.roundDuration);
      }
    } else if (screen === 'paused') {
      this.renderer.domElement.style.cursor = 'default';
    } else if (screen === 'gameover') {
      this.applyCameraTargetsForScreen('gameover');
      this.renderer.domElement.style.cursor = 'default';
    }
    if (this.isSoftwareGl) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public setModalOpen(open: boolean) {
    const wasPaused = this.modalPaused;
    this.modalPaused = open;
    if (wasPaused && !open && !this.disposed) {
      this.clock.getDelta();
      this.tick();
    }
  }

  public startNewExamRound(durationSeconds = EXAM_DURATION_SECONDS) {
    this.roundDuration = durationSeconds;
    this.examRemaining = durationSeconds;
    this.examElapsed = 0;
    this.lastReportedSecond = durationSeconds;
    this.spawnCooldown = 0;
    this.totalWeedsSpawned = 0;
    this.clearPlants();

    // Seed initial 10 plants right away: exact 5 weeds + 5 protected plants (50/50)
    const bounds = this.getSpawnBounds();
    const minDist = this.currentAspect < 0.75 ? 1.55 : 1.45;
    for (let i = 0; i < 10; i++) {
      const existing = this.activePlants.map((p) => ({ x: p.x, z: p.z }));
      const pos = findOpenSpawnPosition(existing, bounds, minDist);
      if (!pos) break;
      const isInitialWeed = i % 2 === 0;
      const def = pickRandomPlant(isInitialWeed ? 1.0 : 0.0);
      this.spawnPlant(def, pos.x, pos.z, isInitialWeed ? 10.5 : 4.2 + Math.random() * 1.2, true);
    }
  }

  private bindEvents() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
  };

  private updatePointerNdc(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.currentScreen !== 'playing') return;
    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(_pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.activePlants.filter((p) => !p.pulling).map((p) => p.hitMesh),
      false,
    );
    const hitId = hits.length > 0 ? hits[0].object.userData.plantId : null;
    for (const p of this.activePlants) {
      p.hovered = p.id === hitId;
    }
    this.renderer.domElement.style.cursor = hitId ? 'pointer' : 'default';
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.currentScreen !== 'playing') return;
    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(_pointerNdc, this.camera);
    const candidates = this.activePlants.filter((p) => !p.pulling).map((p) => p.hitMesh);
    const hits = this.raycaster.intersectObjects(candidates, false);
    if (hits.length === 0) return;

    const hitId = hits[0].object.userData.plantId;
    const plant = this.activePlants.find((p) => p.id === hitId && !p.pulling);
    if (!plant) return;

    plant.pulling = true;
    plant.pullProgress = 0;

    // Project plant top position to screen coordinates for crisp floating +1/-1 feedback
    const rect = this.renderer.domElement.getBoundingClientRect();
    _vec3.set(plant.x, plant.def.worldHeight * 0.85, plant.z);
    _vec3.project(this.camera);
    const screenX = rect.left + ((_vec3.x + 1) / 2) * rect.width;
    const screenY = rect.top + (-(_vec3.y - 1) / 2) * rect.height;

    if (plant.def.isWeed) {
      this.spawnDirtHole(plant.x, plant.z);
      this.emitParticles(plant.x, plant.z, true);
      this.spawnCooldown = Math.min(this.spawnCooldown, 0.02);
      for (const ch of this.characters) {
        ch.happyTimer = 0.42;
        ch.panicTimer = 0;
      }
      this.cameraShake = Math.max(this.cameraShake, 0.14);
    } else {
      this.emitParticles(plant.x, plant.z, false);
      for (const ch of this.characters) {
        ch.panicTimer = 0.65;
        ch.happyTimer = 0;
      }
      this.cameraShake = Math.max(this.cameraShake, 0.35);
    }

    this.callbacksRef.current.onPlantPulled({
      isWeed: plant.def.isWeed,
      label: plant.def.label,
      screenX,
      screenY,
    });
  };

  private handleResize() {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    if (width <= 0 || height <= 0) return;
    this.currentAspect = width / height;
    this.camera.aspect = this.currentAspect;
    this.camera.fov = this.computeResponsiveFov(this.currentAspect);
    this.camera.updateProjectionMatrix();
    this.applyCameraTargetsForScreen(this.currentScreen);
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera);
  }

  private updateSimulation(dt: number, timerDt: number, elapsed: number) {
    // Camera smooth damping
    const dampFactor = 1 - Math.exp(-5.5 * dt);
    this.camera.position.lerp(this.cameraPosTarget, dampFactor);
    this.cameraLookCurrent.lerp(this.cameraLookTarget, dampFactor);

    if (this.cameraShake > 0.001) {
      const trauma = this.cameraShake * this.cameraShake;
      this.camera.position.x += (Math.random() - 0.5) * trauma * 0.4;
      this.camera.position.y += (Math.random() - 0.5) * trauma * 0.3;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 1.4);
    }
    this.camera.lookAt(this.cameraLookCurrent);

    // Exam countdown & spawning while playing
    if (this.currentScreen === 'playing') {
      this.examElapsed += timerDt;
      this.examRemaining = Math.max(0, this.examRemaining - timerDt);
      const sec = Math.ceil(this.examRemaining);
      if (sec !== this.lastReportedSecond) {
        this.lastReportedSecond = sec;
      }
      this.callbacksRef.current.onTimerTick(this.examRemaining);

      if (this.examRemaining <= 0) {
        this.currentScreen = 'gameover';
        this.callbacksRef.current.onExamFinished();
      } else {
        this.spawnCooldown -= dt;
        const budget = getTargetPlantBudget(this.examElapsed, this.roundDuration);
        const minCumulativeWeeds = getMinimumCumulativeWeeds(this.examElapsed, this.roundDuration);

        let aliveCount = 0;
        let activeWeeds = 0;
        let activeProtected = 0;
        for (const p of this.activePlants) {
          if (p.pulling) continue;
          aliveCount++;
          if (p.def.isWeed) activeWeeds++;
          else activeProtected++;
        }

        const behindWeedQuota = this.totalWeedsSpawned < minCumulativeWeeds && activeWeeds <= activeProtected;
        const needWeed = activeWeeds < budget.minActiveWeeds || behindWeedQuota;
        const maxFieldSlots = needWeed ? Math.max(budget.targetCount, 13) : budget.targetCount;

        if (aliveCount < maxFieldSlots && this.spawnCooldown <= 0) {
          const existing = this.activePlants.map((p) => ({ x: p.x, z: p.z }));
          const minDist = this.currentAspect < 0.75 ? 1.55 : 1.45;
          const pos = findOpenSpawnPosition(existing, this.getSpawnBounds(), minDist);
          if (pos) {
            const mustSpawnWeed = needWeed || activeProtected >= budget.maxProtectedActive;
            const mustSpawnProtected =
              !mustSpawnWeed && activeProtected < budget.minActiveWeeds && activeWeeds > activeProtected;
            const prob = mustSpawnWeed ? 1.0 : mustSpawnProtected ? 0.0 : budget.weedProbability;
            const def = pickRandomPlant(prob);
            this.spawnPlant(
              def,
              pos.x,
              pos.z,
              def.isWeed ? 10.5 : 4.0 + Math.random() * 1.1,
            );
          }
          this.spawnCooldown = needWeed ? 0.025 : 0.08;
        }
      }
    }

    // Update 2D billboarded plants
    for (let i = this.activePlants.length - 1; i >= 0; i--) {
      const p = this.activePlants[i];
      p.age += dt;
      p.billboard.quaternion.copy(this.camera.quaternion);
      p.hitMesh.quaternion.copy(this.camera.quaternion);

      if (p.pulling) {
        p.pullProgress += dt / 0.24;
        const t = Math.min(1, p.pullProgress);
        if (p.def.isWeed) {
          // Springy upward pull-out stretch & pop!
          p.group.position.y = Math.sin(t * Math.PI * 0.7) * 1.15;
          const stretchY = 1 + t * 0.42;
          const squashX = 1 - t * 0.24;
          p.group.scale.set(
            p.baseScale * squashX,
            p.baseScale * stretchY,
            p.baseScale,
          );
          p.billboard.rotation.z = p.pullDir * t * 0.28;
          (p.billboard.material as THREE.MeshBasicMaterial).opacity = 1 - t * t;
          (p.shadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.36 * (1 - t);
        } else {
          // Protected plant mistake tremor + shrink
          p.billboard.position.x = Math.sin(t * 36) * 0.16 * (1 - t);
          const s = p.baseScale * (1 - t * 0.85);
          p.group.scale.set(s, s, s);
          (p.billboard.material as THREE.MeshBasicMaterial).opacity = 1 - t;
        }

        if (t >= 1) {
          this.plantsGroup.remove(p.group);
          (p.billboard.material as THREE.Material).dispose();
          p.billboard.geometry.dispose();
          p.hitMesh.geometry.dispose();
          (p.hitMesh.material as THREE.Material).dispose();
          (p.shadowMesh.material as THREE.Material).dispose();
          this.activePlants.splice(i, 1);
          continue;
        }
      } else {
        // Expire old untouched plants smoothly during exam so fresh targets cycle in
        if (this.currentScreen === 'playing' && p.age > p.ttl) {
          const fadeOut = Math.min(1, (p.age - p.ttl) / 0.35);
          const s = p.baseScale * (1 - fadeOut);
          p.group.scale.set(s, s, s);
          if (fadeOut >= 1) {
            this.plantsGroup.remove(p.group);
            (p.billboard.material as THREE.Material).dispose();
            p.billboard.geometry.dispose();
            p.hitMesh.geometry.dispose();
            (p.hitMesh.material as THREE.Material).dispose();
            (p.shadowMesh.material as THREE.Material).dispose();
            this.activePlants.splice(i, 1);
            continue;
          }
        } else {
          // Pop-in spring + gentle wind sway + hover highlight
          const popT = Math.min(1, p.age / 0.26);
          const spring =
            popT < 1
              ? 1 - Math.pow(1 - popT, 3) + Math.sin(popT * Math.PI) * 0.16
              : 1;
          const hoverMul = p.hovered ? 1.12 : 1.0;
          const sway = Math.sin(elapsed * 2.4 + p.swayPhase) * 0.055;
          p.group.scale.setScalar(p.baseScale * spring * hoverMul);
          p.billboard.rotation.z += sway;
        }
      }
    }

    // Update dirt holes
    for (let i = this.dirtHoles.length - 1; i >= 0; i--) {
      const h = this.dirtHoles[i];
      h.age += dt;
      const t = h.age / h.maxAge;
      (h.mesh.material as THREE.MeshBasicMaterial).opacity = 0.88 * (1 - t);
      if (t >= 1) {
        this.holesGroup.remove(h.mesh);
        (h.mesh.material as THREE.Material).dispose();
        this.dirtHoles.splice(i, 1);
      }
    }

    // Update 2D billboarded characters (stand upright so heads never lean backward into fence)
    _charQuat.copy(_standQuat).slerp(this.camera.quaternion, 0.35);
    for (const ch of this.characters) {
      ch.billboard.quaternion.copy(_charQuat);

      if (ch.happyTimer > 0) {
        ch.happyTimer = Math.max(0, ch.happyTimer - dt);
        const t = 1 - ch.happyTimer / 0.42;
        const hop = Math.sin(t * Math.PI) * 0.48;
        const stretch = 1 + Math.sin(t * Math.PI) * 0.16;
        ch.group.position.set(ch.baseX, hop, ch.baseZ);
        ch.group.scale.set(2 - stretch, stretch, 1);
        ch.billboard.rotation.z += Math.sin(t * Math.PI * 2) * 0.12;
        ch.shadow.scale.setScalar(1 - hop * 0.35);
        ch.sweatGroup.visible = false;
      } else if (ch.panicTimer > 0) {
        ch.panicTimer = Math.max(0, ch.panicTimer - dt);
        const shake = Math.sin(elapsed * 42) * 0.12 * (ch.panicTimer / 0.65);
        ch.group.position.set(ch.baseX + shake, 0, ch.baseZ);
        ch.group.scale.set(1.06, 0.93, 1);
        ch.sweatGroup.visible = true;
        ch.sweatGroup.quaternion.copy(this.camera.quaternion);
        ch.sweatGroup.position.y = Math.sin(elapsed * 12) * 0.06;
      } else {
        // Cheerful idle bounce & gentle sway
        const bob = Math.abs(Math.sin(elapsed * 2.7 + ch.phase)) * 0.08;
        const breathe = 1 + Math.sin(elapsed * 5.4 + ch.phase) * 0.035;
        ch.group.position.set(ch.baseX, bob, ch.baseZ);
        ch.group.scale.set(2 - breathe, breathe, 1);
        ch.billboard.rotation.z += Math.sin(elapsed * 1.9 + ch.phase) * 0.045;
        ch.shadow.scale.setScalar(1);
        ch.sweatGroup.visible = false;
      }
    }

    // Update fluttering butterflies
    for (const bf of this.butterflies) {
      const t = elapsed * bf.speed + bf.phase;
      const nx = bf.centerX + Math.sin(t) * bf.radiusX;
      const nz = bf.centerZ + Math.sin(t * 2) * bf.radiusZ * 0.55;
      const ny = bf.baseY + Math.sin(t * 3.2) * 0.22;
      const dx = nx - bf.group.position.x;
      const dz = nz - bf.group.position.z;
      bf.group.position.set(nx, ny, nz);
      if (dx * dx + dz * dz > 0.00001) {
        bf.group.rotation.y = Math.atan2(dx, dz);
      }
      const flap = Math.sin(elapsed * 20 + bf.phase) * 0.85;
      bf.leftWing.rotation.z = -flap;
      bf.rightWing.rotation.z = flap;
    }

    // Update pooled particles
    let particlesDirty = false;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;
      particlesDirty = true;
      p.age += dt;
      if (p.age >= p.maxAge) {
        p.active = false;
        _mat4.makeScale(0, 0, 0);
        this.particleMesh.setMatrixAt(i, _mat4);
        continue;
      }
      p.vy -= 9.5 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.04) {
        p.y = 0.04;
        p.vy = -p.vy * 0.35;
      }
      p.rot += p.vrot * dt;
      const lifeRatio = 1 - p.age / p.maxAge;
      const s = p.scale * lifeRatio;
      _vec3.set(p.x, p.y, p.z);
      _euler.set(0, 0, p.rot);
      _quat.setFromEuler(_euler);
      _quat.premultiply(this.camera.quaternion);
      _scale.set(s, s, s);
      _mat4.compose(_vec3, _quat, _scale);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, p.color);
    }
    if (particlesDirty) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
      if (this.particleMesh.instanceColor) {
        this.particleMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    let polls = 0;
    const poll = () => {
      if (this.disposed || this.modalPaused) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      polls++;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED && polls < 10) {
        this.frameId = window.setTimeout(poll, 6);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 175);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed || this.modalPaused) return;
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const timerDt = Math.min(rawDt, 1.0);
    const elapsed = this.clock.elapsedTime;

    if (this.currentScreen !== 'paused') {
      this.updateSimulation(dt, timerDt, elapsed);
    } else {
      // Keep camera smoothly settled even while paused
      this.camera.lookAt(this.cameraLookCurrent);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('webglcontextlost', this.onContextLost);

    this.clearPlants();
    this.textureCache.forEach((tex) => tex.dispose());
    this.textureCache.clear();
    this.shadowTexture.dispose();
    this.dirtHoleTexture.dispose();
    this.shadowDiscGeo.dispose();
    this.dirtHoleGeo.dispose();
    this.particleMesh.geometry.dispose();
    (this.particleMesh.material as THREE.Material).dispose();

    this.renderer.dispose();
    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
