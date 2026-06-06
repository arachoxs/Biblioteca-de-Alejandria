"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ─── Props ─────────────────────────────────────────────────────────

interface BookARViewerProps {
  dimensiones: { ancho: number; alto: number; profundidad: number };
  texturas: {
    portada: string | null;
    contraportada: string | null;
    lomo: string | null;
  };
  sinopsis: string;
  titulo: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

interface BookMeshResult {
  bookGroup: THREE.Group;
  coverGroup: THREE.Group;
  pagePlane: THREE.Mesh;
}

function isTouchEndEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  return event.type === "touchend";
}

function createBookMesh(
  w: number,
  h: number,
  d: number,
  texturas: BookARViewerProps["texturas"],
  sinopsis: string,
  titulo: string,
): BookMeshResult {
  const whiteTex = createWhiteTexture();
  const pagesTex = createPagesTexture();
  const textureLoader = new THREE.TextureLoader();

  const loadTex = (url: string | null): THREE.Texture => {
    if (!url) return whiteTex;
    const t = textureLoader.load(url, undefined, undefined, () => whiteTex);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  const bookGroup = new THREE.Group();

  // Back cover + pages
  const backGeo = new THREE.BoxGeometry(w, h, d / 2);
  const backMats = [
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: loadTex(texturas.contraportada) }),
  ];
  const backMesh = new THREE.Mesh(backGeo, backMats);
  backMesh.position.z = -d / 4;
  bookGroup.add(backMesh);

  // Front cover (hinged)
  const coverGroup = new THREE.Group();
  coverGroup.position.set(-w / 2, 0, d / 4);

  const coverGeo = new THREE.BoxGeometry(w, h, d / 2);
  const coverMats = [
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: loadTex(texturas.portada) }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
  ];
  const coverMesh = new THREE.Mesh(coverGeo, coverMats);
  coverMesh.position.x = w / 2;
  coverGroup.add(coverMesh);
  bookGroup.add(coverGroup);

  // Spine
  const spineGeo = new THREE.BoxGeometry(0.005, h, d);
  const spineMats = [
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: loadTex(texturas.lomo) }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
    new THREE.MeshStandardMaterial({ map: pagesTex }),
  ];
  const spineMesh = new THREE.Mesh(spineGeo, spineMats);
  spineMesh.position.set(-w / 2, 0, 0);
  bookGroup.add(spineMesh);

  // Page with sinopsis
  const pageGeo = new THREE.PlaneGeometry(w * 0.9, h * 0.9);
  const pageTex = createSinopsisTexture(sinopsis, titulo);
  const pageMat = new THREE.MeshStandardMaterial({
    map: pageTex,
    side: THREE.DoubleSide,
  });
  const pagePlane = new THREE.Mesh(pageGeo, pageMat);
  pagePlane.position.set(0, 0, d / 4 + 0.01);
  pagePlane.visible = false;
  bookGroup.add(pagePlane);

  return { bookGroup, coverGroup, pagePlane };
}

function createWhiteTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 4;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 4, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function createPagesTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 4) {
    ctx.strokeStyle = i % 8 === 0 ? "#e0d8c8" : "#ebe5d8";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 128);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function createSinopsisTexture(text: string, bookTitle: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#faf6ee";
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "#3d2b1f";
  ctx.font = "bold 24px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(bookTitle, 256, 50);

  ctx.strokeStyle = "#c4a882";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 70);
  ctx.lineTo(432, 70);
  ctx.stroke();

  ctx.fillStyle = "#4a3728";
  ctx.font = "16px Georgia, serif";
  ctx.textAlign = "left";

  const words = text.split(" ");
  let line = "";
  let y = 100;
  const maxWidth = 432;
  const lineHeight = 24;

  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), 40, y);
      line = word + " ";
      y += lineHeight;
      if (y > 480) {
        ctx.fillText("...", 40, y);
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (y <= 480) ctx.fillText(line.trim(), 40, y);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ─── Hook: useBookScene ────────────────────────────────────────────

interface BookSceneRefs {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isOpenRef: React.MutableRefObject<boolean>;
}

function useBookScene(
  dimensiones: BookARViewerProps["dimensiones"],
  texturas: BookARViewerProps["texturas"],
  sinopsis: string,
  titulo: string,
  handleClick: (event: MouseEvent | TouchEvent) => void,
): BookSceneRefs {
  const containerRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const bookGroupRef = useRef<THREE.Group | null>(null);
  const coverGroupRef = useRef<THREE.Group | null>(null);
  const pagePlaneRef = useRef<THREE.Mesh | null>(null);
  const animatingRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const animateOpen = useCallback((open: boolean) => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    const cover = coverGroupRef.current;
    const page = pagePlaneRef.current;
    if (!cover || !page) { animatingRef.current = false; return; }

    const targetAngle = open ? -Math.PI * 0.85 : 0;
    const startAngle = cover.rotation.y;
    const duration = 800;
    const startTime = performance.now();

    if (open) page.visible = true;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      cover.rotation.y = startAngle + (targetAngle - startAngle) * ease;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        animatingRef.current = false;
        isOpenRef.current = open;
        if (!open) page.visible = false;
      }
    };
    requestAnimationFrame(step);
  }, []);

  const wrappedHandleClick = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const container = containerRef.current;
      const camera = cameraRef.current;
      const bookGroup = bookGroupRef.current;
      if (!container || !camera || !bookGroup) return;

      const rect = container.getBoundingClientRect();
      let clientX: number, clientY: number;

      if (isTouchEndEvent(event)) {
        const touch = event.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      const mouse = new THREE.Vector2();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bookGroup.children, true);

      if (intersects.length > 0) {
        animateOpen(!isOpenRef.current);
      }
    },
    [animateOpen],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    if (width === 0 || height === 0) return;

    setIsMobile(window.innerWidth < 768);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const bgTex = new THREE.TextureLoader().load("/textures/fondo-biblioteca.jpg");
    bgTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgTex;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 4);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    const scale = 0.03;
    const w = dimensiones.ancho * scale;
    const h = dimensiones.alto * scale;
    const d = Math.max(dimensiones.profundidad * scale, 0.02);

    const { bookGroup, coverGroup, pagePlane } = createBookMesh(w, h, d, texturas, sinopsis, titulo);

    scene.add(bookGroup);
    bookGroupRef.current = bookGroup;
    coverGroupRef.current = coverGroup;
    pagePlaneRef.current = pagePlane;

    container.addEventListener("click", wrappedHandleClick);
    container.addEventListener("touchend", wrappedHandleClick, { passive: true });

    const handleResize = () => {
      const c = containerRef.current;
      if (!c) return;
      const rw = c.clientWidth;
      const rh = c.clientHeight;
      if (rw === 0 || rh === 0) return;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    };
    window.addEventListener("resize", handleResize);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        await video.play();
        videoRef.current = video;

        const videoTex = new THREE.VideoTexture(video);
        videoTex.colorSpace = THREE.SRGBColorSpace;
        scene.background = videoTex;
      } catch (err) {
        console.error("No se pudo acceder a la cámara:", err);
      }
    };

    if (isMobile) {
      startCamera();
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("click", wrappedHandleClick);
      container.removeEventListener("touchend", wrappedHandleClick);
      const stream = videoRef.current?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((t) => t.stop());
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [dimensiones, texturas, sinopsis, titulo, wrappedHandleClick, isMobile]);

  return { containerRef, isOpenRef };
}

// ─── Componente ────────────────────────────────────────────────────

export default function BookARViewer({
  dimensiones,
  texturas,
  sinopsis,
  titulo,
}: BookARViewerProps) {
  const { containerRef } = useBookScene(dimensiones, texturas, sinopsis, titulo, () => {});

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none z-10">
        Toca el libro para abrirlo · Arrastra para rotar
      </div>
    </div>
  );
}
