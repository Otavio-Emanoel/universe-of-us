"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Home() {
  const threeRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [startHiding, setStartHiding] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [bubbleText, setBubbleText] = useState("Oiiiii como é o seu nome?");
  const [nameLocked, setNameLocked] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const initRef = useRef(false);

  // Refs para sincronizar UI (React) -> animação (Three.js)
  const timeRef = useRef(0);
  const weirdUntilRef = useRef(0);
  const agataSeqRef = useRef({
    active: false,
    startedAt: 0,
    inited: false,
    wowPlayed: false,
    musicSwitched: false,
    starBurstDone: false,
    baseY: 0,
    baseRotX: 0,
    baseRotY: 0,
    baseRotZ: 0,
  });

  const normalizeName = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const handleSubmitName = () => {
    const norm = normalizeName(playerName);
    if (!norm) return;

    setNameLocked(true);

    if (norm === "otavio") {
      setBubbleText("Oxi???? o que voce ta fazendo aqui Otavio? Vai voltar a programar hahahaha");
      weirdUntilRef.current = timeRef.current + 3.8;
      agataSeqRef.current.active = false;
    } else if (norm === "agata") {
      setBubbleText("Que bom ter voce aqui Agata, eu estava te esperando!");
      weirdUntilRef.current = 0;
      agataSeqRef.current.active = true;
      agataSeqRef.current.startedAt = timeRef.current;
      agataSeqRef.current.inited = false;
      agataSeqRef.current.wowPlayed = false;
      agataSeqRef.current.musicSwitched = false;
      agataSeqRef.current.starBurstDone = false;
    }
  };

  // Em mobile, o 100vh + barra do navegador pode permitir um pequeno scroll.
  // Travamos overflow/overscroll no html/body enquanto esta tela estiver ativa.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlHeight: html.style.height,
      bodyHeight: body.style.height,
      htmlOverscroll: (html.style as any).overscrollBehavior,
      bodyOverscroll: (body.style as any).overscrollBehavior,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";
    (html.style as any).overscrollBehavior = "none";
    (body.style as any).overscrollBehavior = "none";

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      html.style.height = prev.htmlHeight;
      body.style.height = prev.bodyHeight;
      (html.style as any).overscrollBehavior = prev.htmlOverscroll;
      (body.style as any).overscrollBehavior = prev.bodyOverscroll;
    };
  }, []);

  // --- Áudio (Web Audio + SFX) ---
  // Browsers bloqueiam autoplay: iniciamos no clique do botão Start.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const audioUnlockedRef = useRef(false);
  const helloPlayedRef = useRef(false);
  const helloSfxRef = useRef<HTMLAudioElement | null>(null);
  const wowSfxRef = useRef<HTMLAudioElement | null>(null);
  const bubbleShownRef = useRef(false);
  const musicMutedRef = useRef(false);
  const musicModeRef = useRef<"calm" | "upbeat">("calm");

  const MUSIC_VOL = 0.1;

  const applyMusicMute = (muted: boolean) => {
    musicMutedRef.current = muted;
    setMusicMuted(muted);

    const ctx = audioCtxRef.current;
    const gain = masterGainRef.current;
    if (!ctx || !gain) return;
    const t = ctx.currentTime;
    try {
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(muted ? 0 : MUSIC_VOL, t + 0.03);
    } catch {
      gain.gain.value = muted ? 0 : MUSIC_VOL;
    }
  };

  // --- Música fofinha estilo joguinho ---
  const startBackgroundMusic = () => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;

    musicModeRef.current = "calm";

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = audioCtx;

    const masterGain = audioCtx.createGain();
    masterGain.gain.value = musicMutedRef.current ? 0 : MUSIC_VOL;
    masterGain.connect(audioCtx.destination);
    masterGainRef.current = masterGain;

    // 🎵 Melodia principal (music box)
    const melody = [
      659.25, // E5
      783.99, // G5
      880.0,  // A5
      783.99,
      659.25,
      587.33, // D5
      523.25, // C5
      587.33,
    ];

    // 🎶 Baixo fofinho
    const bass = [
      261.63, // C4
      329.63, // E4
      392.0,  // G4
      329.63,
    ];

    let m = 0;
    let b = 0;

    const playNote = (
      freq: number,
      when: number,
      duration = 0.3,
      type: OscillatorType = "triangle",
      vol = 0.5
    ) => {
      if (!audioCtx || !masterGain) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, when);

      // envelope fofinho ✨
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(vol, when + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

      // deixa a música macia
      filter.type = "lowpass";
      filter.frequency.value = 2000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(when);
      osc.stop(when + duration + 0.05);
    };

    const schedule = () => {
      if (!audioCtx) return;

      const now = audioCtx.currentTime + 0.05;

      // melodia
      playNote(melody[m], now, 0.28, "triangle", 0.5);
      m = (m + 1) % melody.length;

      // baixo (mais lento)
      if (m % 2 === 0) {
        playNote(bass[b], now, 0.6, "sine", 0.25);
        b = (b + 1) % bass.length;
      }
    };

    // começa suave
    schedule();
    musicTimerRef.current = window.setInterval(schedule, 350);
  };

  const switchToUpbeatMusic = () => {
    const audioCtx = audioCtxRef.current;
    const masterGain = masterGainRef.current;
    if (!audioCtx || !masterGain) return;
    if (musicModeRef.current === "upbeat") return;

    musicModeRef.current = "upbeat";

    if (musicTimerRef.current) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }

    const melody = [659.25, 783.99, 987.77, 880.0, 783.99, 880.0, 987.77, 1174.66];
    const bass = [196.0, 220.0, 246.94, 261.63];
    let m = 0;
    let b = 0;

    const playNote = (
      freq: number,
      when: number,
      duration = 0.18,
      type: OscillatorType = "square",
      vol = 0.42,
    ) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, when);

      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(vol, when + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

      filter.type = "lowpass";
      filter.frequency.value = 3200;
      filter.Q.value = 0.7;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(when);
      osc.stop(when + duration + 0.05);
    };

    const schedule = () => {
      const now = audioCtx.currentTime + 0.05;
      playNote(melody[m], now, 0.16, "square", 0.38);
      m = (m + 1) % melody.length;
      if (m % 2 === 0) {
        playNote(bass[b], now, 0.22, "sine", 0.26);
        b = (b + 1) % bass.length;
      }
    };

    schedule();
    musicTimerRef.current = window.setInterval(schedule, 220);
  };

  const sayHello = () => {
    if (helloPlayedRef.current) return;
    helloPlayedRef.current = true;

    try {
      const a = helloSfxRef.current ?? new Audio("/hello-sfx.mp3");
      helloSfxRef.current = a;
      a.volume = 0.9;
      a.currentTime = 0;
      void a.play();
    } catch {
      // ignore
    }
  };

  const sayWow = () => {
    try {
      const a = wowSfxRef.current ?? new Audio("/wow.mp3");
      wowSfxRef.current = a;
      a.volume = 0.95;
      a.currentTime = 0;
      void a.play();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!started) return;
    if (!threeRef.current) return;
    if (initRef.current) return;
    initRef.current = true;

    // --- 1. Configuração da Cena ---
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scene = new THREE.Scene();
    // Céu suave (o fundo em si será um skydome com gradiente)
    scene.background = new THREE.Color(0xbfe8ff);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    threeRef.current.appendChild(renderer.domElement);

    const setCameraForViewport = (w: number, h: number) => {
      // Em telas menores, afasta mais a câmera para não ficar “gigante” no celular.
      const t = THREE.MathUtils.clamp((768 - w) / 768, 0, 1);
      const z = 6 + t * 6; // 6 (desktop) -> ~12 (mobile)
      const y = 1 + t * 0.4;
      camera.position.set(0, y, z);
      camera.lookAt(0, 0.6, 0);
    };

    // Câmera parada, olhando para o centro
    setCameraForViewport(width, height);

    // --- 2. Iluminação ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
    scene.add(ambientLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.5);
    frontLight.position.set(2, 5, 5);
    scene.add(frontLight);

    // Luz do “sol” por trás para dar profundidade
    const backLight = new THREE.DirectionalLight(0xffffff, 0.35);
    backLight.position.set(-6, 4, -8);
    scene.add(backLight);

    // Névoa leve para dar sensação de distância na floresta
    scene.fog = new THREE.Fog(0xbfe8ff, 10, 55);

    // --- Cenário: Céu (gradiente), chão e floresta ---
    const skyGeo = new THREE.SphereGeometry(120, 48, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x9fdcff) },
        bottomColor: { value: new THREE.Color(0xeaf8ff) },
        offset: { value: 18.0 },
        exponent: { value: 0.8 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          float t = pow(max(h, 0.0), exponent);
          gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // Chão
    const groundGeo = new THREE.PlaneGeometry(220, 220, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x8ee07f,
      roughness: 1,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.42;
    ground.position.z = -5;
    scene.add(ground);

    // Floresta estilizada (árvores simples)
    const forest = new THREE.Group();
    scene.add(forest);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a3c, roughness: 1, metalness: 0 });
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x5fd07a, roughness: 1, metalness: 0 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x4cbc67, roughness: 1, metalness: 0 });

    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.4, 10);
    const leafGeo = new THREE.SphereGeometry(0.7, 18, 18);
    const leafSmallGeo = new THREE.SphereGeometry(0.55, 18, 18);

    const createTree = (x: number, z: number, s: number, variant: 1 | 2) => {
      const g = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.7;
      g.add(trunk);

      const leafMat = variant === 1 ? leafMat1 : leafMat2;

      const crown1 = new THREE.Mesh(leafGeo, leafMat);
      crown1.position.set(0, 1.55, 0);
      const crown2 = new THREE.Mesh(leafSmallGeo, leafMat);
      crown2.position.set(-0.35, 1.35, 0.1);
      const crown3 = new THREE.Mesh(leafSmallGeo, leafMat);
      crown3.position.set(0.38, 1.32, -0.05);
      g.add(crown1, crown2, crown3);

      g.position.set(x, -1.42, z);
      g.scale.setScalar(s);
      return g;
    };

    // Camada distante
    for (let i = 0; i < 18; i++) {
      const x = -28 + i * 3.2 + (Math.random() - 0.5) * 1.2;
      const z = -42 + (Math.random() - 0.5) * 5;
      const s = 1.25 + Math.random() * 0.7;
      forest.add(createTree(x, z, s, i % 2 === 0 ? 1 : 2));
    }

    // Camada média
    for (let i = 0; i < 14; i++) {
      const x = -18 + i * 2.8 + (Math.random() - 0.5) * 1.6;
      const z = -22 + (Math.random() - 0.5) * 5;
      const s = 1.05 + Math.random() * 0.55;
      forest.add(createTree(x, z, s, i % 2 === 0 ? 2 : 1));
    }

    // Alguns arbustos (bolinhas) perto do chão
    const bushGeo = new THREE.SphereGeometry(0.55, 18, 18);
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x62d88a, roughness: 1, metalness: 0 });
    for (let i = 0; i < 10; i++) {
      const b = new THREE.Mesh(bushGeo, bushMat);
      b.position.set(-6 + i * 1.2 + (Math.random() - 0.5) * 0.8, -0.95, -10 - Math.random() * 4);
      b.scale.setScalar(0.7 + Math.random() * 0.55);
      forest.add(b);
    }

    // --- 3. Materiais ---
    const matSettings = { roughness: 0.8, metalness: 0.0 };
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, ...matSettings });
    const dressMat = new THREE.MeshStandardMaterial({ color: 0xFFB6C1, ...matSettings });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x222222, ...matSettings });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const shoesMat = new THREE.MeshStandardMaterial({ color: 0xFFF0FB, ...matSettings });
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0xFF6347, ...matSettings });
    const blushMat = new THREE.MeshStandardMaterial({ color: 0xFF69B4, transparent: true, opacity: 0.4 });
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // --- Criação da Boneca ---
    const dollGroup = new THREE.Group();

    // Geometrias
    const sphereGeoHigh = new THREE.SphereGeometry(1, 64, 64);
    const sphereGeoMid = new THREE.SphereGeometry(1, 32, 32);

    // A. Cabeça
    const head = new THREE.Mesh(sphereGeoHigh, skinMat);
    head.scale.set(1.2, 1.2, 1.2);
    head.position.y = 1.0;
    dollGroup.add(head);

    // B. Corpo
    const bodyGeo = new THREE.ConeGeometry(1.1, 1.6, 64);
    const body = new THREE.Mesh(bodyGeo, dressMat);
    body.position.y = 0;
    dollGroup.add(body);

    // C. Rosto
    const eyeScale = 0.18;
    const eyeBaseScale = new THREE.Vector3(eyeScale, eyeScale * 1.2, eyeScale * 0.5);
    const eyeLeft = new THREE.Mesh(sphereGeoMid, eyeMat);
    eyeLeft.scale.copy(eyeBaseScale);
    eyeLeft.position.set(-0.45, 1.1, 1.05);

    const highlightLeft = new THREE.Mesh(sphereGeoMid, highlightMat);
    highlightLeft.scale.set(0.05, 0.05, 0.05);
    highlightLeft.position.set(-0.5, 1.2, 1.15);

    const eyeRight = eyeLeft.clone();
    eyeRight.position.set(0.45, 1.1, 1.05);

    const highlightRight = highlightLeft.clone();
    highlightRight.position.set(0.4, 1.2, 1.15);


    // Variáveis para piscar
    let blinkTimer = 0;
    let blinkDuration = 0;
    let isBlinking = false;
    // Referências para highlights
    const highlights = [highlightLeft, highlightRight];
    // Forçar olhos fechados (usado no suspiro)
    let forceEyesClosed = false;

    dollGroup.add(eyeLeft, highlightLeft, eyeRight, highlightRight);

    const mouth = new THREE.Mesh(sphereGeoMid, mouthMat);
    const mouthBaseScale = new THREE.Vector3(0.08, 0.05, 0.05);
    mouth.scale.copy(mouthBaseScale);
    mouth.position.set(0, 0.85, 1.15);
    dollGroup.add(mouth);

    // 1. Boca reta (agora usando Capsule para ficar redondinha e fofa)
    const mouthLineGeo: THREE.BufferGeometry = new (THREE as any).CapsuleGeometry(0.04, 0.5, 4, 8); // Raio, Comprimento
    const mouthLine = new THREE.Mesh(mouthLineGeo, eyeMat);
    // Girar para ficar horizontal
    mouthLine.rotation.z = Math.PI / 2;
    const mouthLineBaseScale = new THREE.Vector3(1, 1, 1);
    mouthLine.scale.copy(mouthLineBaseScale);
    mouthLine.position.set(0, 0.86, 1.16);
    mouthLine.visible = false;
    dollGroup.add(mouthLine);

    // 2. Sobrancelhas (ajuste de escala e posição inicial)
    const browGeo = new THREE.TorusGeometry(0.22, 0.045, 10, 22, Math.PI);
    const browLeft = new THREE.Mesh(browGeo, hairMat);
    const browRight = new THREE.Mesh(browGeo, hairMat);

    // Escala base visível (quando aparecerem)
    const browBaseScale = new THREE.Vector3(1, 1, 1);
    const browHiddenScale = new THREE.Vector3(0.001, 0.001, 0.001);

    // Começam invisíveis (escala 0)
    browLeft.scale.setScalar(0.001);
    browRight.scale.setScalar(0.001);

    browLeft.position.set(-0.52, 1.34, 1.16);
    browRight.position.set(0.52, 1.34, 1.16);

    browLeft.visible = false;
    browRight.visible = false;
    dollGroup.add(browLeft, browRight);

    const blushScale = 0.25;
    const blushLeft = new THREE.Mesh(sphereGeoMid, blushMat);
    blushLeft.scale.set(blushScale, blushScale * 0.6, blushScale * 0.2);
    blushLeft.position.set(-0.7, 0.9, 0.95);
    const blushRight = blushLeft.clone();
    blushRight.position.set(0.7, 0.9, 0.95);
    dollGroup.add(blushLeft, blushRight);

    // D. Cabelo
    const hairBack = new THREE.Mesh(sphereGeoHigh, hairMat);
    hairBack.scale.set(1.4, 1.4, 1.3);
    hairBack.position.set(0, 1.1, -0.3);
    dollGroup.add(hairBack);

    const hairSideGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const hairLeft = new THREE.Mesh(hairSideGeo, hairMat);
    hairLeft.scale.set(1, 2.5, 1);
    hairLeft.position.set(-1.3, 0.2, 0);
    hairLeft.rotation.z = 0.2;
    const hairRight = hairLeft.clone();
    hairRight.position.set(1.3, 0.2, 0);
    hairRight.rotation.z = -0.2;
    dollGroup.add(hairLeft, hairRight);

    // E. Mãos (Variáveis externas para animar)
    const handScale = 0.25;
    const handLeft = new THREE.Mesh(sphereGeoMid, skinMat);
    handLeft.scale.set(handScale, handScale, handScale);
    handLeft.position.set(-0.9, -0.3, 0.3); // Posição base

    const handRight = handLeft.clone();
    handRight.position.set(0.9, -0.3, 0.3); // Posição base
    dollGroup.add(handLeft, handRight);

    // Posições alvo/idle para facilitar animações
    const handIdleY = -0.3;
    const handIdleZ = 0.55;
    const handIdleXLeft = -1.15;
    const handIdleXRight = 1.15;
    const handWalkXLeft = -0.9;
    const handWalkXRight = 0.9;

    // F. Sapatos (Variáveis externas para animar)
    const shoeScale = 0.35;
    const shoeLeft = new THREE.Mesh(sphereGeoMid, shoesMat);
    shoeLeft.scale.set(shoeScale, shoeScale * 0.6, shoeScale * 1.2);
    const shoeBaseY = -1.05;
    const shoeStepLift = 0.16;
    shoeLeft.position.set(-0.4, shoeBaseY, 0); // Posição base

    const shoeRight = shoeLeft.clone();
    shoeRight.position.set(0.4, shoeBaseY, 0); // Posição base
    dollGroup.add(shoeLeft, shoeRight);

    // POSIÇÃO INICIAL (entra pela esquerda)
    dollGroup.position.x = -10;
    dollGroup.position.y = -0.5;
    dollGroup.position.z = -15;
    // Começa virada para a direita (correndo para o centro)
    dollGroup.rotation.y = Math.PI / 2;
    scene.add(dollGroup);

    // --- Gota de suor (aparece após a caminhada) ---
    const sweatGeo = new THREE.SphereGeometry(0.12, 32, 32);
    const sweatMat = new THREE.MeshStandardMaterial({
      color: 0x6ecbff,
      roughness: 0.35,
      metalness: 0.0,
      transparent: true,
      opacity: 0,
    });
    const sweat = new THREE.Mesh(sweatGeo, sweatMat);
    sweat.scale.set(0.8, 1.25, 0.6);
    // Lado esquerdo da testa
    sweat.position.set(-0.35, 1.55, 1.12);
    sweat.visible = false;
    dollGroup.add(sweat);

    // --- Nuvemzinha do suspiro (anime puff) ---
    const puffGeo = new THREE.SphereGeometry(0.14, 24, 24);
    const puffMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0,
      transparent: true,
      opacity: 0,
    });
    const puffGroup = new THREE.Group();
    const puff1 = new THREE.Mesh(puffGeo, puffMat);
    const puff2 = new THREE.Mesh(puffGeo, puffMat);
    const puff3 = new THREE.Mesh(puffGeo, puffMat);
    const puff4 = new THREE.Mesh(puffGeo, puffMat);
    puff1.position.set(0, 0, 0);
    puff2.position.set(0.16, 0.03, 0.02);
    puff2.scale.set(0.9, 0.9, 0.9);
    puff3.position.set(-0.14, 0.06, 0.01);
    puff3.scale.set(0.85, 0.85, 0.85);
    puff4.position.set(0.04, 0.14, 0.01);
    puff4.scale.set(0.75, 0.75, 0.75);
    puffGroup.add(puff1, puff2, puff3, puff4);
    puffGroup.visible = false;
    // Posição base: perto da boca
    puffGroup.position.set(-0.05, 0.88, 1.22);
    dollGroup.add(puffGroup);

    // --- Poeira/Fumacinha da corrida (partículas simples) ---
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    const dustGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const smokeGeo = new THREE.SphereGeometry(0.1, 16, 16);

    const makeMat = (color: number, opacity: number) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 1,
        metalness: 0,
        transparent: true,
        opacity,
      });

    type Particle = {
      mesh: THREE.Mesh;
      life: number;
      maxLife: number;
      baseOpacity: number;
    };

    const dustPool: Particle[] = [];
    const smokePool: Particle[] = [];
    const starPool: Particle[] = [];

    const createPool = (
      pool: Particle[],
      count: number,
      geo: THREE.BufferGeometry,
      mat: THREE.MeshStandardMaterial,
      baseOpacity: number,
      maxLife: number,
    ) => {
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(geo, mat.clone());
        m.visible = false;
        m.userData.vel = new THREE.Vector3();
        m.userData.spin = new THREE.Vector3();
        particleGroup.add(m);
        pool.push({ mesh: m, life: 0, maxLife, baseOpacity });
      }
    };

    createPool(dustPool, 14, dustGeo, makeMat(0xd8c8b2, 0.55), 0.55, 0.55);
    createPool(smokePool, 10, smokeGeo, makeMat(0xffffff, 0.35), 0.35, 0.75);

    const starGeo = new THREE.IcosahedronGeometry(0.08, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfff2a8,
      emissive: 0xffe38a,
      emissiveIntensity: 0.9,
      roughness: 0.55,
      metalness: 0,
      transparent: true,
      opacity: 0.95,
    });
    createPool(starPool, 26, starGeo, starMat, 0.95, 0.9);

    const tmpWorld = new THREE.Vector3();
    const spawnFromPool = (pool: Particle[], pos: THREE.Vector3, vel: THREE.Vector3) => {
      const p = pool.find((x) => x.life <= 0);
      if (!p) return;
      p.life = p.maxLife;
      p.mesh.visible = true;
      p.mesh.position.copy(pos);
      p.mesh.scale.setScalar(0.6 + Math.random() * 0.45);
      (p.mesh.material as THREE.MeshStandardMaterial).opacity = p.baseOpacity;
      (p.mesh.userData.vel as THREE.Vector3).copy(vel);
      (p.mesh.userData.spin as THREE.Vector3).set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      );
    };

    const updatePool = (pool: Particle[], dt: number) => {
      for (const p of pool) {
        if (p.life <= 0) continue;
        p.life -= dt;
        const t = THREE.MathUtils.clamp(p.life / p.maxLife, 0, 1);
        const ease = t * t;
        const mat = p.mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = p.baseOpacity * ease;
        p.mesh.position.addScaledVector(p.mesh.userData.vel as THREE.Vector3, dt);
        const s = p.mesh.scale.x + dt * 0.55;
        p.mesh.scale.setScalar(s);
        p.mesh.rotation.x += (p.mesh.userData.spin as THREE.Vector3).x * dt * 0.6;
        p.mesh.rotation.y += (p.mesh.userData.spin as THREE.Vector3).y * dt * 0.6;
        p.mesh.rotation.z += (p.mesh.userData.spin as THREE.Vector3).z * dt * 0.6;
        if (p.life <= 0) {
          p.mesh.visible = false;
        }
      }
    };

    let dustSpawnAcc = 0;
    let smokeSpawnAcc = 0;

    // --- Animação ---
    let frameId: number;
    let time = 0;
    
    // Configurações da caminhada
    const stopZ = 1; // Onde ela para
    const walkSpeed = 0.06; // Velocidade de movimento
    const animSpeed = 8; // Velocidade do movimento das pernas

    type Phase =
      | "enterRun"
      | "turnFront"
      | "walk"
      | "sweat"
      | "wipe"
      | "postWipeWait"
      | "wave"
      | "idle";
    let phase: Phase = "enterRun";
    let phaseT = 0;

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const smooth01 = (v: number) => {
      const t = clamp01(v);
      return t * t * (3 - 2 * t);
    };

    function animate() {
      frameId = requestAnimationFrame(animate);
      const dt = 0.015;
      time += dt;
      timeRef.current = time;

      // Atualiza partículas sempre (as ativas vão sumir naturalmente)
      updatePool(dustPool, dt);
      updatePool(smokePool, dt);
      updatePool(starPool, dt);


      // --- ANIMAÇÃO DE PISCAR (com override do suspiro) ---
      if (forceEyesClosed) {
        eyeLeft.scale.y = THREE.MathUtils.lerp(eyeLeft.scale.y, 0.05, 0.35);
        eyeRight.scale.y = THREE.MathUtils.lerp(eyeRight.scale.y, 0.05, 0.35);
        highlights.forEach((h) => (h.visible = false));
      } else {
        if (!isBlinking) {
          blinkTimer -= dt;
          if (blinkTimer <= 0) {
            isBlinking = true;
            blinkDuration = 0.08 + Math.random() * 0.08; // duração do piscar
          }
          // Highlights visíveis
          highlights.forEach((h) => (h.visible = true));
        } else {
          blinkDuration -= dt;
          // Olhos fecham
          eyeLeft.scale.y = THREE.MathUtils.lerp(eyeLeft.scale.y, 0.05, 0.5);
          eyeRight.scale.y = THREE.MathUtils.lerp(eyeRight.scale.y, 0.05, 0.5);
          // Highlights somem
          highlights.forEach((h) => (h.visible = false));
          if (blinkDuration <= 0) {
            isBlinking = false;
            blinkTimer = 1.5 + Math.random() * 2.5; // tempo até o próximo piscar
          }
        }
        if (!isBlinking) {
          // Olhos abertos
          eyeLeft.scale.y = THREE.MathUtils.lerp(eyeLeft.scale.y, eyeScale * 1.2, 0.2);
          eyeRight.scale.y = THREE.MathUtils.lerp(eyeRight.scale.y, eyeScale * 1.2, 0.2);
        }
      }

      // --- Expressão de estranhamento "Otavio" (Emoji 🤨) ---
      const weirdActive = weirdUntilRef.current > time;

      if (weirdActive && !forceEyesClosed) {
        // Sobrancelhas aparecem
        browLeft.visible = true;
        browRight.visible = true;
        browLeft.scale.lerp(browBaseScale, 0.2);
        browRight.scale.lerp(browBaseScale, 0.2);

        // --- SOBRANCELHA ESQUERDA (Baixa/Desconfiada) ---
        // Desce um pouco e fica mais "reta"
        browLeft.position.x = THREE.MathUtils.lerp(browLeft.position.x, -0.52, 0.2);
        browLeft.position.y = THREE.MathUtils.lerp(browLeft.position.y, 1.25, 0.2); // Mais baixa
        browLeft.rotation.z = THREE.MathUtils.lerp(browLeft.rotation.z, 0.1, 0.2); // Quase reta

        // --- SOBRANCELHA DIREITA (Levantada/Questionando) ---
        // Sobe bem alto e arqueia
        browRight.position.x = THREE.MathUtils.lerp(browRight.position.x, 0.52, 0.2);
        browRight.position.y = THREE.MathUtils.lerp(browRight.position.y, 1.55, 0.2); // Bem alta
        browRight.rotation.z = THREE.MathUtils.lerp(browRight.rotation.z, 0.4, 0.2); // Arqueada

        // --- OLHOS (Sem deformar demais) ---
        // Olho esquerdo: levemente "achatado" (ceticismo), mas mantendo largura
        eyeLeft.scale.x = THREE.MathUtils.lerp(eyeLeft.scale.x, eyeScale, 0.2);
        eyeLeft.scale.y = THREE.MathUtils.lerp(eyeLeft.scale.y, eyeScale * 0.9, 0.2);
        eyeLeft.scale.z = THREE.MathUtils.lerp(eyeLeft.scale.z, eyeScale * 0.5, 0.2);

        // Olho direito: bem aberto (acompanha a sobrancelha alta)
        eyeRight.scale.x = THREE.MathUtils.lerp(eyeRight.scale.x, eyeScale, 0.2);
        eyeRight.scale.y = THREE.MathUtils.lerp(eyeRight.scale.y, eyeScale * 1.4, 0.2); // Alongado verticalmente
        eyeRight.scale.z = THREE.MathUtils.lerp(eyeRight.scale.z, eyeScale * 0.5, 0.2);

        // --- BOCA ---
        mouth.visible = false;
        mouthLine.visible = true;

        // Boca fica reta, mas move levemente para o lado da sobrancelha levantada (charme)
        mouthLine.position.x = THREE.MathUtils.lerp(mouthLine.position.x, 0.05, 0.1);
        mouthLine.position.y = 0.86;

        // Leve escala na boca falando
        const talk = 0.5 + 0.5 * Math.sin(time * 20); // Fala rápida
        // A boca muda de largura levemente ao falar, mas mantém a forma de linha
        mouthLine.scale.set(
          1 + talk * 0.1, // Comprimento
          1 + talk * 0.2, // Espessura
          1,
        );
      } else {
        // --- VOLTA AO NORMAL (Transição suave) ---

        // Recolhe sobrancelhas
        browLeft.scale.lerp(browHiddenScale, 0.25);
        browRight.scale.lerp(browHiddenScale, 0.25);
        if (browLeft.scale.x <= 0.01) {
          browLeft.visible = false;
          browRight.visible = false;
        }

        // Reseta posição das sobrancelhas para a próxima vez
        browLeft.position.y = THREE.MathUtils.lerp(browLeft.position.y, 1.34, 0.2);
        browRight.position.y = THREE.MathUtils.lerp(browRight.position.y, 1.34, 0.2);

        // Olhos voltam ao formato base
        eyeLeft.scale.lerp(eyeBaseScale, 0.15);
        eyeRight.scale.lerp(eyeBaseScale, 0.15);

        // Boca volta ao "O" ou sorriso padrão
        mouthLine.visible = false;
        mouth.visible = true;
        mouth.scale.lerp(mouthBaseScale, 0.15);

        // Reset da posição da boca de linha
        mouthLine.position.x = 0;
        mouthLine.scale.set(1, 1, 1);
      }

      // Parte 0: Entra correndo pela esquerda até o meio
      if (phase === "enterRun") {
        const runAnimSpeed = animSpeed * 1.7;
        const runSpeedX = 0.22;

        dollGroup.position.x += runSpeedX;
        dollGroup.position.y = -0.5 + Math.abs(Math.sin(time * runAnimSpeed)) * 0.18;

        // Leve inclinação e wobble enquanto corre
        dollGroup.rotation.z = Math.sin(time * (runAnimSpeed / 2)) * 0.07;
        dollGroup.rotation.y = Math.PI / 2;

        // Pés mais rápidos
        shoeLeft.position.z = Math.sin(time * runAnimSpeed) * 0.55;
        shoeRight.position.z = Math.sin(time * runAnimSpeed + Math.PI) * 0.55;
        shoeLeft.position.y = shoeBaseY + Math.max(0, Math.sin(time * runAnimSpeed)) * (shoeStepLift * 1.35);
        shoeRight.position.y = shoeBaseY + Math.max(0, Math.sin(time * runAnimSpeed + Math.PI)) * (shoeStepLift * 1.35);

        // Mãos mais rápidas
        handLeft.position.z = Math.sin(time * runAnimSpeed + Math.PI) * 0.35 + 0.25;
        handRight.position.z = Math.sin(time * runAnimSpeed) * 0.35 + 0.25;
        handLeft.position.x = THREE.MathUtils.lerp(handLeft.position.x, handWalkXLeft, 0.25);
        handRight.position.x = THREE.MathUtils.lerp(handRight.position.x, handWalkXRight, 0.25);
        handLeft.position.y = THREE.MathUtils.lerp(handLeft.position.y, handIdleY, 0.25);
        handRight.position.y = THREE.MathUtils.lerp(handRight.position.y, handIdleY, 0.25);

        // Chegou no centro
        if (dollGroup.position.x >= 0) {
          dollGroup.position.x = 0;
          phase = "turnFront";
          phaseT = 0;
        }

        // Poeirinhas e fumacinha enquanto corre (saindo perto dos pés)
        dustSpawnAcc += dt;
        smokeSpawnAcc += dt;

        if (dustSpawnAcc >= 0.05) {
          dustSpawnAcc = 0;
          const left = shoeLeft.getWorldPosition(tmpWorld.clone());
          const right = shoeRight.getWorldPosition(tmpWorld.clone());

          // Trail atrás (corrida no +X)
          left.x -= 0.28 + Math.random() * 0.12;
          right.x -= 0.28 + Math.random() * 0.12;
          left.y += 0.02;
          right.y += 0.02;

          spawnFromPool(
            dustPool,
            left,
            new THREE.Vector3(
              -(0.35 + Math.random() * 0.2),
              0.18 + Math.random() * 0.12,
              (Math.random() - 0.5) * 0.25,
            ),
          );
          spawnFromPool(
            dustPool,
            right,
            new THREE.Vector3(
              -(0.35 + Math.random() * 0.2),
              0.18 + Math.random() * 0.12,
              (Math.random() - 0.5) * 0.25,
            ),
          );
        }

        if (smokeSpawnAcc >= 0.11) {
          smokeSpawnAcc = 0;
          const pos = shoeLeft.getWorldPosition(tmpWorld.clone());
          pos.x -= 0.35 + Math.random() * 0.15;
          pos.y += 0.12;
          pos.z += (Math.random() - 0.5) * 0.15;
          spawnFromPool(
            smokePool,
            pos,
            new THREE.Vector3(
              -(0.18 + Math.random() * 0.1),
              0.28 + Math.random() * 0.18,
              (Math.random() - 0.5) * 0.18,
            ),
          );
        }
      }
      // Parte 0.5: Vira para frente
      else if (phase === "turnFront") {
        phaseT += dt;
        const t = smooth01(phaseT / 0.45);
        dollGroup.rotation.y = THREE.MathUtils.lerp(Math.PI / 2, 0, t);
        dollGroup.rotation.z = Math.sin(time * 6) * 0.03 * (1 - t);
        dollGroup.position.y = THREE.MathUtils.lerp(dollGroup.position.y, -0.5 + Math.sin(time * 2) * 0.03, 0.1);

        // Volta pés/mãos para um estado neutro antes da caminhada Z
        shoeLeft.position.z = THREE.MathUtils.lerp(shoeLeft.position.z, 0, 0.15);
        shoeRight.position.z = THREE.MathUtils.lerp(shoeRight.position.z, 0, 0.15);
        shoeLeft.position.y = THREE.MathUtils.lerp(shoeLeft.position.y, shoeBaseY, 0.15);
        shoeRight.position.y = THREE.MathUtils.lerp(shoeRight.position.y, shoeBaseY, 0.15);

        handLeft.position.z = THREE.MathUtils.lerp(handLeft.position.z, 0.2, 0.2);
        handRight.position.z = THREE.MathUtils.lerp(handRight.position.z, 0.2, 0.2);

        if (t >= 1) {
          dollGroup.rotation.y = 0;
          phase = "walk";
          phaseT = 0;
        }
      }
      // Estado 1: Andando (como antes)
      else if (phase === "walk" && dollGroup.position.z < stopZ) {
        // Mover para frente
        dollGroup.position.z += walkSpeed;

        // Pulo do caminhar (Bobbing)
        dollGroup.position.y = -0.5 + Math.abs(Math.sin(time * animSpeed)) * 0.15;

        // Balanço lateral (Wobble) - deixa fofo
        dollGroup.rotation.z = Math.sin(time * (animSpeed / 2)) * 0.05;
        dollGroup.rotation.y = Math.sin(time * (animSpeed / 4)) * 0.02;

        // Animação Pés (Alternados)
        shoeLeft.position.z = Math.sin(time * animSpeed) * 0.4;
        shoeRight.position.z = Math.sin(time * animSpeed + Math.PI) * 0.4;
        // Levantar levemente o pé que vai para frente (sem atravessar o vestido)
        shoeLeft.position.y = shoeBaseY + Math.max(0, Math.sin(time * animSpeed)) * shoeStepLift;
        shoeRight.position.y = shoeBaseY + Math.max(0, Math.sin(time * animSpeed + Math.PI)) * shoeStepLift;

        // Animação Mãos (Oposto aos pés)
        handLeft.position.z = Math.sin(time * animSpeed + Math.PI) * 0.3 + 0.2;
        handRight.position.z = Math.sin(time * animSpeed) * 0.3 + 0.2;

        // Garantir mãos na lateral correta enquanto anda
        handLeft.position.x = THREE.MathUtils.lerp(handLeft.position.x, handWalkXLeft, 0.2);
        handRight.position.x = THREE.MathUtils.lerp(handRight.position.x, handWalkXRight, 0.2);
        handLeft.position.y = THREE.MathUtils.lerp(handLeft.position.y, handIdleY, 0.2);
        handRight.position.y = THREE.MathUtils.lerp(handRight.position.y, handIdleY, 0.2);
      } else {
        // Transição: acabou de chegar
        if (phase === "walk") {
          phase = "sweat";
          phaseT = 0;
          dollGroup.position.z = stopZ;
          sweat.visible = true;
          sweatMat.opacity = 0;
        }

        // Reset suave para posição de "respiro"
        const idleTime = time * 2;

        // Respiração
        dollGroup.position.y = THREE.MathUtils.lerp(
          dollGroup.position.y,
          -0.5 + Math.sin(idleTime) * 0.05,
          0.1,
        );

        // Base do corpo em idle (pode ser sobreposto na fase "wave")
        dollGroup.rotation.z = THREE.MathUtils.lerp(dollGroup.rotation.z, 0, 0.1);
        dollGroup.rotation.y = THREE.MathUtils.lerp(dollGroup.rotation.y, 0, 0.1);

        // Pés voltam pro chão
        shoeLeft.position.z = THREE.MathUtils.lerp(shoeLeft.position.z, 0, 0.5);
        shoeRight.position.z = THREE.MathUtils.lerp(shoeRight.position.z, 0, 0.5);
        shoeLeft.position.y = THREE.MathUtils.lerp(shoeLeft.position.y, shoeBaseY, 0.1);
        shoeRight.position.y = THREE.MathUtils.lerp(shoeRight.position.y, shoeBaseY, 0.1);

        // Mãos em posição idle (pode ser sobreposto por wipe/wave)
        handLeft.position.z = THREE.MathUtils.lerp(handLeft.position.z, handIdleZ, 0.1);
        handRight.position.z = THREE.MathUtils.lerp(handRight.position.z, handIdleZ, 0.1);
        handLeft.position.x = THREE.MathUtils.lerp(handLeft.position.x, handIdleXLeft, 0.1);
        handRight.position.x = THREE.MathUtils.lerp(handRight.position.x, handIdleXRight, 0.1);
        handLeft.position.y = THREE.MathUtils.lerp(handLeft.position.y, handIdleY, 0.1);
        handRight.position.y = THREE.MathUtils.lerp(handRight.position.y, handIdleY, 0.1);

        // --- Sequência pós-caminhada ---
        if (phase === "sweat") {
          phaseT += dt;
          const a = smooth01(phaseT / 0.6);
          sweatMat.opacity = 0.9 * a;
          sweat.position.y = 1.55 - a * 0.08;
          if (a >= 1) {
            phase = "wipe";
            phaseT = 0;
          }
        } else if (phase === "wipe") {
          phaseT += dt;
          const p = clamp01(phaseT / 1.1);
          const up = p < 0.5 ? smooth01(p / 0.5) : smooth01((1 - p) / 0.5);

          // Mão esquerda sobe até a testa e volta
           // Alvo baseado na posição real da gota (pra mão "chegar" nela)
           const targetX = sweat.position.x - 0.02;
           const targetY = sweat.position.y - 0.05;
           const targetZ = sweat.position.z + 0.12;
           const wipeX = THREE.MathUtils.lerp(handIdleXLeft, targetX, up);
           const wipeY = THREE.MathUtils.lerp(handIdleY, targetY, up);
           const wipeZ = THREE.MathUtils.lerp(handIdleZ, targetZ, up);
          handLeft.position.set(wipeX, wipeY, wipeZ);

          // Suor some enquanto limpa
          const fade = 1 - smooth01(Math.max(0, (p - 0.15) / 0.55));
          sweatMat.opacity = 0.9 * fade;
          if (p >= 1) {
            sweat.visible = false;
            sweatMat.opacity = 0;
            phase = "postWipeWait";
            phaseT = 0;
          }
        } else if (phase === "postWipeWait") {
          phaseT += dt;
          // Suspiro: olhos fecham + puff aparece e sobe
          const sighDuration = 1.2;
          const isSighing = phaseT < sighDuration;
          forceEyesClosed = isSighing;
          if (isSighing) {
            const t = phaseT;
            const inT = smooth01(Math.min(t / 0.25, 1));
            const outT = smooth01(Math.min(Math.max(0, (t - 0.85) / 0.35), 1));
            const opacity = 0.7 * inT * (1 - outT);

            puffGroup.visible = true;
            (puffMat as THREE.MeshStandardMaterial).opacity = opacity;

            // Drift fofinho (sobe e vai um pouco pro lado)
            puffGroup.position.x = THREE.MathUtils.lerp(-0.05, -0.45, smooth01(Math.min(t / 1.1, 1)));
            puffGroup.position.y = THREE.MathUtils.lerp(0.88, 1.18, smooth01(Math.min(t / 1.1, 1)));
            puffGroup.position.z = THREE.MathUtils.lerp(1.22, 1.35, smooth01(Math.min(t / 1.1, 1)));

            const s = THREE.MathUtils.lerp(0.65, 1.25, smooth01(Math.min(t / 1.1, 1)));
            puffGroup.scale.set(s, s, s);
          } else {
            puffGroup.visible = false;
            (puffMat as THREE.MeshStandardMaterial).opacity = 0;
          }

          if (phaseT >= 2) {
            phase = "wave";
            phaseT = 0;
            // Fala "hello" ao começar a acenar + mostra balão de fala
            sayHello();
            if (!bubbleShownRef.current) {
              bubbleShownRef.current = true;
              setShowSpeechBubble(true);
            }
          }
        } else if (phase === "wave") {
          phaseT += dt;
          const duration = 3.0;
          const inOut = smooth01(Math.min(phaseT / 0.35, 1)) * smooth01(Math.min((duration - phaseT) / 0.35, 1));

          // Mão direita acena
          const baseX = handIdleXRight;
          const baseY = handIdleY;
          const baseZ = handIdleZ;
          const liftY = THREE.MathUtils.lerp(baseY, 0.75, inOut);
          const liftZ = THREE.MathUtils.lerp(baseZ, 1.0, inOut);
          const waveX = baseX + Math.sin(phaseT * 10) * 0.14 * inOut;
          const waveY = liftY + Math.sin(phaseT * 5) * 0.03 * inOut;
          const waveZ = liftZ + Math.cos(phaseT * 10) * 0.05 * inOut;
          handRight.position.set(waveX, waveY, waveZ);

          // Corpo mexe um pouco enquanto acena
          dollGroup.rotation.z = Math.sin(phaseT * 4) * 0.06 * inOut;
          dollGroup.rotation.y = Math.sin(phaseT * 2) * 0.03 * inOut;

          if (phaseT >= duration) {
            phase = "idle";
            phaseT = 0;
          }
        } else if (phase === "idle") {
          // nada extra além do idle base
        }
      }

      // --- Sequência especial: Ágata (feliz + pulo + estrelas + dança + música animada) ---
      const ag = agataSeqRef.current;
      if (ag.active) {
        if (!ag.inited) {
          ag.inited = true;
          if (!ag.startedAt) ag.startedAt = time;
          ag.baseY = dollGroup.position.y;
          ag.baseRotX = dollGroup.rotation.x;
          ag.baseRotY = dollGroup.rotation.y;
          ag.baseRotZ = dollGroup.rotation.z;
        }

        if (!ag.wowPlayed) {
          ag.wowPlayed = true;
          sayWow();
        }

        // Expressão feliz (sem sobrancelhas)
        browLeft.scale.lerp(browHiddenScale, 0.25);
        browRight.scale.lerp(browHiddenScale, 0.25);
        browLeft.visible = false;
        browRight.visible = false;
        mouthLine.visible = false;
        mouth.visible = true;
        mouth.scale.lerp(new THREE.Vector3(0.11, 0.085, 0.07), 0.22);
        eyeLeft.scale.x = THREE.MathUtils.lerp(eyeLeft.scale.x, eyeBaseScale.x * 1.02, 0.2);
        eyeLeft.scale.y = THREE.MathUtils.lerp(eyeLeft.scale.y, eyeBaseScale.y * 1.06, 0.2);
        eyeRight.scale.x = THREE.MathUtils.lerp(eyeRight.scale.x, eyeBaseScale.x * 1.02, 0.2);
        eyeRight.scale.y = THREE.MathUtils.lerp(eyeRight.scale.y, eyeBaseScale.y * 1.06, 0.2);

        const elapsed = time - ag.startedAt;
        const jumpDur = 0.75;

        const spawnStarBurst = (count: number, strength: number) => {
          head.getWorldPosition(tmpWorld);
          for (let i = 0; i < count; i++) {
            const vel = new THREE.Vector3(
              (Math.random() - 0.5) * 1.6,
              0.9 + Math.random() * 1.2,
              (Math.random() - 0.5) * 1.2,
            ).multiplyScalar(strength * (0.9 + Math.random() * 0.6));
            const pos = tmpWorld
              .clone()
              .add(new THREE.Vector3((Math.random() - 0.5) * 0.22, 0.08 + Math.random() * 0.12, 0));
            spawnFromPool(starPool, pos, vel);
          }
        };

        if (elapsed < jumpDur) {
          const u = clamp01(elapsed / jumpDur);
          const yOff = Math.sin(u * Math.PI) * 0.55;
          dollGroup.position.y = ag.baseY + yOff;
          dollGroup.rotation.z = ag.baseRotZ + Math.sin(u * Math.PI) * 0.12;

          if (!ag.starBurstDone && elapsed > 0.05) {
            ag.starBurstDone = true;
            spawnStarBurst(14, 1.2);
          }
          if (elapsed > 0.18 && elapsed < 0.6) {
            spawnStarBurst(3, 0.9);
          }
        } else {
          if (!ag.musicSwitched) {
            ag.musicSwitched = true;
            switchToUpbeatMusic();
          }

          const d = elapsed - jumpDur;
          dollGroup.position.y = ag.baseY + Math.sin(d * 10) * 0.06;
          dollGroup.rotation.z = ag.baseRotZ + Math.sin(d * 6) * 0.18;
          dollGroup.rotation.y = ag.baseRotY + Math.sin(d * 3.2) * 0.08;

          // Braços e passinhos de dança
          const arm = 0.5 + 0.5 * Math.sin(d * 8);
          handLeft.position.set(
            handIdleXLeft - 0.12,
            THREE.MathUtils.lerp(handIdleY, 0.55, arm),
            THREE.MathUtils.lerp(handIdleZ, 0.95, arm),
          );
          handRight.position.set(
            handIdleXRight + 0.12,
            THREE.MathUtils.lerp(handIdleY, 0.62, 1 - arm),
            THREE.MathUtils.lerp(handIdleZ, 0.95, 1 - arm),
          );

          shoeLeft.position.y = shoeBaseY + Math.max(0, Math.sin(d * 10)) * (shoeStepLift * 1.25);
          shoeRight.position.y = shoeBaseY + Math.max(0, Math.sin(d * 10 + Math.PI)) * (shoeStepLift * 1.25);
          shoeLeft.position.z = Math.sin(d * 10) * 0.18;
          shoeRight.position.z = Math.sin(d * 10 + Math.PI) * 0.18;

          if (Math.sin(d * 9) > 0.75) {
            spawnStarBurst(2, 0.75);
          }
        }
      }

      renderer.render(scene, camera);
    }
    // Inicializar blinkTimer para o primeiro piscar
    blinkTimer = 1.5 + Math.random() * 2.5;
    animate();

    const handleResize = () => {
      if (!threeRef.current) return;
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      setCameraForViewport(newWidth, newHeight);
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // ignore
      }

      initRef.current = false;

      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material.isMaterial) {
                object.material.dispose();
            }
        }
      });
      if (threeRef.current && renderer.domElement.parentNode === threeRef.current) {
        threeRef.current.removeChild(renderer.domElement);
      }
    };
  }, [started]);

  useEffect(() => {
    return () => {
      // cleanup
      if (musicTimerRef.current) {
        window.clearInterval(musicTimerRef.current);
        musicTimerRef.current = null;
      }
      const ctx = audioCtxRef.current;
      if (ctx) {
        ctx.close().catch(() => {});
        audioCtxRef.current = null;
      }
      const hello = helloSfxRef.current;
      if (hello) {
        try {
          hello.pause();
          hello.currentTime = 0;
        } catch {
          // ignore
        }
        helloSfxRef.current = null;
      }
      const wow = wowSfxRef.current;
      if (wow) {
        try {
          wow.pause();
          wow.currentTime = 0;
        } catch {
          // ignore
        }
        wowSfxRef.current = null;
      }
      audioUnlockedRef.current = false;
    };
  }, []);

  const handleStart = () => {
    // Inicia música no clique (desbloqueia autoplay)
    startBackgroundMusic();
    // Pré-carrega o SFX para tocar no aceno
    try {
      if (!helloSfxRef.current) {
        const a = new Audio("/hello-sfx.mp3");
        a.preload = "auto";
        a.volume = 0.9;
        helloSfxRef.current = a;
        a.load();
      }
      if (!wowSfxRef.current) {
        const w = new Audio("/wow.mp3");
        w.preload = "auto";
        w.volume = 0.95;
        wowSfxRef.current = w;
        w.load();
      }
    } catch {
      // ignore
    }

    // Reseta UI/flags caso reinicie
    setShowSpeechBubble(false);
    setBubbleText("Oiiiii como é o seu nome?");
    setNameLocked(false);
    setPlayerName("");
    bubbleShownRef.current = false;
    helloPlayedRef.current = false;
    weirdUntilRef.current = 0;

    setStartHiding(true);
    window.setTimeout(() => {
      setStarted(true);
    }, 320);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #FFF0F5, #FFE4E1)" }}
    >
      <button
        type="button"
        onClick={() => applyMusicMute(!musicMuted)}
        aria-label={musicMuted ? "Ativar música" : "Mutar música"}
        title={musicMuted ? "Ativar música" : "Mutar música"}
        className="pointer-events-auto absolute bottom-4 right-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white backdrop-blur transition-colors hover:bg-black focus:outline-none focus:ring-2 focus:ring-white/40"
      >
        <span className="sr-only">{musicMuted ? "Ativar música" : "Mutar música"}</span>
        {musicMuted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M23 9l-6 6" />
            <path d="M17 9l6 6" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        )}
      </button>

      {started && showSpeechBubble ? (
        <div className="pointer-events-auto absolute left-1/2 top-8 z-20 w-[min(92vw,420px)] -translate-x-1/2">
          <div className="relative rounded-2xl border border-zinc-200 bg-white/90 px-5 py-4 text-zinc-900 shadow-sm">
            <div className="text-base font-semibold">{bubbleText}</div>
            <div className="relative mt-3">
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitName();
                }}
                placeholder="Seu nome"
                disabled={nameLocked}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-12 text-base outline-none focus:border-zinc-400 disabled:opacity-70"
              />
              <button
                type="button"
                onClick={handleSubmitName}
                disabled={nameLocked || !playerName.trim()}
                aria-label="Enviar nome"
                title="Enviar"
                className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-black/80 text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
            <div className="absolute left-10 top-full h-4 w-4 -translate-y-2 rotate-45 border-b border-r border-zinc-200 bg-white/90" />
          </div>
        </div>
      ) : null}

      {started ? (
        <div ref={threeRef} className="h-full w-full" />
      ) : (
        <div
          className={
            "absolute inset-0 flex items-center justify-center transition-all duration-300 " +
            (startHiding ? "opacity-0 scale-95" : "opacity-100 scale-100")
          }
        >
          <button
            type="button"
            onClick={handleStart}
            className="rounded-full bg-black px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Start
          </button>
        </div>
      )}
    </div>
  );
}