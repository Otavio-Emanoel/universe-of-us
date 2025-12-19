"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Home() {
  const threeRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [startHiding, setStartHiding] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [bubbleTargetText, setBubbleTargetText] = useState("Oiiiii como é o seu nome?");
  const [bubbleText, setBubbleText] = useState("Oiiiii como é o seu nome?");
  const [nameLocked, setNameLocked] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [bubbleStage, setBubbleStage] = useState<
    "name" | "proceed" | "story" | "choices" | "enterRocket" | "otavioSorry" | "otavioRestart"
  >("name");
  const [choice, setChoice] = useState<null | "go" | "stay">(null);
  const [isTypingBubble, setIsTypingBubble] = useState(false);
  const [bubbleFollowDoll, setBubbleFollowDoll] = useState(false);
  const initRef = useRef(false);
  const speechBubbleWrapRef = useRef<HTMLDivElement>(null);
  const bubbleFollowDollRef = useRef(false);

  const bubbleStageRef = useRef<
    "name" | "proceed" | "story" | "choices" | "enterRocket" | "otavioSorry" | "otavioRestart"
  >("name");
  const choiceRef = useRef<null | "go" | "stay">(null);

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

  const bubbleTypingTimerRef = useRef<number | null>(null);
  const bubbleTypingDoneRef = useRef<null | (() => void)>(null);
  const proceedTimerRef = useRef<number | null>(null);
  const otavioSorryTimerRef = useRef<number | null>(null);
  const rocketPromptTimerRef = useRef<number | null>(null);
  const quakeSeqRef = useRef({
    active: false,
    restore: false,
    startedAt: 0,
    inited: false,
    smokeAcc: 0,
    baseGroundX: 0,
    baseGroundZ: 0,
    baseHeadRotY: 0,
  });
  const panicRef = useRef({
    active: false,
    pendingStart: false,
    inited: false,
    startedAt: 0,
    baseX: 0,
    baseY: 0,
    baseZ: 0,
    smokeAcc: 0,
  });

  const goReturnRef = useRef({
    active: false,
    inited: false,
    startedAt: 0,
    fromX: 0,
    fromY: 0,
    fromZ: 0,
    toX: 0,
    toY: 0,
    toZ: 0,
    wowPlayed: false,
    danceUntil: 0,
    done: false,
    rocketQueued: false,
  });

  const rocketSeqRef = useRef({
    pending: false,
    pendingAt: 0,
    active: false,
    inited: false,
    startedAt: 0,
    landed: false,
    messageShown: false,
  });

  const rocketEnterRef = useRef({
    active: false,
    stage: "walk" as "walk" | "press" | "open" | "prompt" | "run",
    startedAt: 0,
    inited: false,
    fromX: 0,
    fromY: 0,
    fromZ: 0,
    toX: 0,
    toY: 0,
    toZ: 0,
  });

  const rocketCamRef = useRef({
    active: false,
    startedAt: 0,
    dur: 1.25,
    inited: false,
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
    fromLook: new THREE.Vector3(),
    toLook: new THREE.Vector3(),
    switched: false,
  });

  const worldModeRef = useRef<"outside" | "inside">("outside");

  const otavioPartyRef = useRef({
    active: false,
    stage: "flip" as "flip" | "dance",
    startedAt: 0,
    inited: false,
    baseX: 0,
    baseY: 0,
    baseZ: 0,
    baseRotX: 0,
    baseRotY: 0,
    baseRotZ: 0,
  });

  const setBubbleTyped = (text: string, onDone?: () => void) => {
    bubbleTypingDoneRef.current = onDone ?? null;
    setBubbleTargetText(text);
  };

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
      setBubbleStage("name");
      setBubbleTyped("Oxi???? o que voce ta fazendo aqui Otavio? Vai voltar a programar hahahaha");
      weirdUntilRef.current = timeRef.current + 3.8;
      agataSeqRef.current.active = false;
      sayAlert();

      if (otavioSorryTimerRef.current) {
        window.clearTimeout(otavioSorryTimerRef.current);
        otavioSorryTimerRef.current = null;
      }
      otavioSorryTimerRef.current = window.setTimeout(() => {
        setBubbleStage("otavioSorry");
      }, 3800);
    } else if (norm === "agata") {
      setBubbleStage("proceed");
      setBubbleTyped("Que bom ter voce aqui agata, eu estava te esperando!");
      weirdUntilRef.current = 0;
      agataSeqRef.current.active = true;
      agataSeqRef.current.startedAt = timeRef.current;
      agataSeqRef.current.inited = false;
      agataSeqRef.current.wowPlayed = false;
      agataSeqRef.current.musicSwitched = false;
      agataSeqRef.current.starBurstDone = false;
    }
  };

  const handleProceed = () => {
    setBubbleStage("story");
    setChoice(null);
    agataSeqRef.current.active = false;

    quakeSeqRef.current.active = true;
    quakeSeqRef.current.restore = false;
    quakeSeqRef.current.startedAt = timeRef.current;
    quakeSeqRef.current.inited = false;
    quakeSeqRef.current.smokeAcc = 0;

    panicRef.current.active = false;
    panicRef.current.pendingStart = false;
    panicRef.current.inited = false;

    if (proceedTimerRef.current) {
      window.clearTimeout(proceedTimerRef.current);
      proceedTimerRef.current = null;
    }

    // Depois da sequência de olhar pros lados, ela fala (texto digitando)
    proceedTimerRef.current = window.setTimeout(() => {
      setBubbleTyped(
        "Ops, algo de errado não está certo, alguma coisa está prestes a acontecer, eu vou sair daqui, voce vai vir junto comigo?",
        () => {
          setBubbleStage("choices");
          panicRef.current.pendingStart = true;
        },
      );
    }, 3800);
  };

  const handleOtavioSorry = () => {
    setShowSpeechBubble(false);
    setBubbleStage("otavioRestart");

    // Desliga outras sequências que podem interferir
    weirdUntilRef.current = 0;
    agataSeqRef.current.active = false;
    quakeSeqRef.current.active = false;
    quakeSeqRef.current.restore = false;
    panicRef.current.active = false;
    panicRef.current.pendingStart = false;
    goReturnRef.current.active = false;

    // Mortal + dança
    otavioPartyRef.current.active = true;
    otavioPartyRef.current.stage = "flip";
    otavioPartyRef.current.startedAt = timeRef.current;
    otavioPartyRef.current.inited = false;

    // Música: troca para chicken-song
    stopWebMusic();
    startChickenSong();
  };

  const handleRestart = () => {
    window.location.reload();
  };

  const handleEnterRocket = () => {
    setShowSpeechBubble(false);
    setBubbleStage("story");
    setBubbleFollowDoll(false);

    rocketEnterRef.current.active = true;
    rocketEnterRef.current.stage = "walk";
    rocketEnterRef.current.startedAt = timeRef.current;
    rocketEnterRef.current.inited = false;
  };

  const handleChoice = (c: "go" | "stay") => {
    setChoice(c);
    setBubbleStage("story");

    panicRef.current.active = false;
    panicRef.current.pendingStart = false;
    panicRef.current.inited = false;

    if (c === "go") {
      // Mantém o terremoto rolando
      quakeSeqRef.current.active = true;
      quakeSeqRef.current.restore = false;

      rocketSeqRef.current.pending = false;
      rocketSeqRef.current.active = false;
      rocketSeqRef.current.inited = false;
      rocketSeqRef.current.landed = false;
      rocketSeqRef.current.messageShown = false;

      // Ela vai sair lá do fundo e voltar correndo pra frente.
      // A fala só aparece quando ela chegar.
      setShowSpeechBubble(false);
      goReturnRef.current.active = true;
      goReturnRef.current.inited = false;
      goReturnRef.current.startedAt = timeRef.current;
      goReturnRef.current.wowPlayed = false;
      goReturnRef.current.danceUntil = 0;
      goReturnRef.current.done = false;
      goReturnRef.current.rocketQueued = false;
    } else {
      quakeSeqRef.current.active = false;
      quakeSeqRef.current.restore = true;
      setBubbleTyped("Ta bom... cuidado, por favor!");
    }
  };

  useEffect(() => {
    if (!showSpeechBubble) return;
    if (!bubbleTargetText) return;

    if (bubbleTypingTimerRef.current) {
      window.clearInterval(bubbleTypingTimerRef.current);
      bubbleTypingTimerRef.current = null;
    }

    const words = bubbleTargetText.split(/\s+/).filter(Boolean);
    let i = 0;
    setIsTypingBubble(true);
    setBubbleText("");

    bubbleTypingTimerRef.current = window.setInterval(() => {
      i += 1;
      setBubbleText(words.slice(0, i).join(" "));
      if (i >= words.length) {
        if (bubbleTypingTimerRef.current) {
          window.clearInterval(bubbleTypingTimerRef.current);
          bubbleTypingTimerRef.current = null;
        }
        setIsTypingBubble(false);
        const done = bubbleTypingDoneRef.current;
        bubbleTypingDoneRef.current = null;
        if (done) done();
      }
    }, 95);

    return () => {
      if (bubbleTypingTimerRef.current) {
        window.clearInterval(bubbleTypingTimerRef.current);
        bubbleTypingTimerRef.current = null;
      }
    };
  }, [bubbleTargetText, showSpeechBubble]);

  useEffect(() => {
    bubbleStageRef.current = bubbleStage;
  }, [bubbleStage]);

  useEffect(() => {
    bubbleFollowDollRef.current = bubbleFollowDoll;
  }, [bubbleFollowDoll]);

  useEffect(() => {
    choiceRef.current = choice;
  }, [choice]);

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
  const alertSfxRef = useRef<HTMLAudioElement | null>(null);
  const chickenSfxRef = useRef<HTMLAudioElement | null>(null);
  const bubbleShownRef = useRef(false);
  const musicMutedRef = useRef(false);
  const musicModeRef = useRef<"calm" | "upbeat">("calm");

  const MUSIC_VOL = 0.1;
  const SFX_VOL = 0.9;

  const applyMusicMute = (muted: boolean) => {
    musicMutedRef.current = muted;
    setMusicMuted(muted);

    const sfxVol = muted ? 0 : SFX_VOL;
    if (helloSfxRef.current) helloSfxRef.current.volume = sfxVol;
    if (wowSfxRef.current) wowSfxRef.current.volume = sfxVol;
    if (alertSfxRef.current) alertSfxRef.current.volume = sfxVol;
    if (chickenSfxRef.current) chickenSfxRef.current.volume = sfxVol;

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

  const stopWebMusic = () => {
    if (musicTimerRef.current) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    masterGainRef.current = null;
    if (ctx) {
      ctx.close().catch(() => {});
    }
  };

  const startChickenSong = () => {
    let a = chickenSfxRef.current;
    if (!a) {
      a = new Audio("/chicken-song.mp3");
      a.loop = true;
      a.preload = "auto";
      a.volume = musicMutedRef.current ? 0 : SFX_VOL;
      chickenSfxRef.current = a;
    }
    try {
      a.currentTime = 0;
    } catch {
      // ignore
    }
    a.play().catch(() => {});
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
      a.volume = musicMutedRef.current ? 0 : SFX_VOL;
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
      a.volume = musicMutedRef.current ? 0 : SFX_VOL;
      a.currentTime = 0;
      void a.play();
    } catch {
      // ignore
    }
  };

  const sayAlert = () => {
    try {
      const a = alertSfxRef.current ?? new Audio("/alert.mp3");
      alertSfxRef.current = a;
      a.volume = musicMutedRef.current ? 0 : SFX_VOL;
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
      if (worldModeRef.current === "inside") {
        const t = THREE.MathUtils.clamp((768 - w) / 768, 0, 1);
        const z = 6.8 + t * 8.5; // ainda mais longe no celular
        const y = 1.2 + t * 0.38;
        camera.position.set(0, y, z);
        // Mira levemente para o console (z negativo)
        camera.lookAt(0, 0.28, -0.35);
        return;
      }
      // Em telas menores, afasta mais a câmera para não ficar “gigante” no celular.
      const t = THREE.MathUtils.clamp((768 - w) / 768, 0, 1);
      const z = 6 + t * 6; // 6 (desktop) -> ~12 (mobile)
      const y = 1 + t * 0.4;
      camera.position.set(0, y, z);
      camera.lookAt(0, 0.6, 0);
    };

    // Câmera parada, olhando para o centro
    setCameraForViewport(width, height);
    let baseCameraPos = camera.position.clone();

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
      baseCameraPos = camera.position.clone();
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

    // --- Foguete (pousa no fundo após o "Woooow!") ---
    const rocketGroup = new THREE.Group();
    rocketGroup.visible = false;
    // Mais perto da câmera pra ficar bem visível
    const rocketX = 4.8;
    const rocketZ = -18.5;
    const rocketLandY = ground.position.y;
    scene.add(rocketGroup);

    const rocketBodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0.05 });
    const rocketAccentMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.7, metalness: 0.05 });
    const rocketWindowMat = new THREE.MeshStandardMaterial({ color: 0x6ecbff, roughness: 0.35, metalness: 0.05 });

    const rocketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 2.8, 18), rocketBodyMat);
    rocketBody.position.y = 1.4;
    rocketGroup.add(rocketBody);

    const rocketNose = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.9, 18), rocketAccentMat);
    rocketNose.position.y = 2.8 + 0.45;
    rocketGroup.add(rocketNose);

    const rocketBase = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.18, 18), rocketAccentMat);
    rocketBase.position.y = 0.09;
    rocketGroup.add(rocketBase);

    const rocketWindow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), rocketWindowMat);
    rocketWindow.position.set(0, 1.65, 0.48);
    rocketWindow.scale.set(1, 1, 0.6);
    rocketGroup.add(rocketWindow);

    // Detalhes: listras e anéis
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffb4b4, roughness: 0.7, metalness: 0.05 });
    const ringGeo = new THREE.TorusGeometry(0.48, 0.035, 12, 24);
    const ring1 = new THREE.Mesh(ringGeo, stripeMat);
    ring1.position.y = 0.65;
    ring1.rotation.x = Math.PI / 2;
    const ring2 = ring1.clone();
    ring2.position.y = 1.35;
    const ring3 = ring1.clone();
    ring3.position.y = 2.05;
    rocketGroup.add(ring1, ring2, ring3);

    // Nozzle / motor
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 18), new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.9, metalness: 0.05 }));
    nozzle.position.y = -0.2;
    nozzle.rotation.x = Math.PI;
    rocketGroup.add(nozzle);

    // Boosters laterais
    const boosterMat = new THREE.MeshStandardMaterial({ color: 0xf9fafb, roughness: 0.8, metalness: 0.05 });
    const boosterGeo = new THREE.CylinderGeometry(0.14, 0.16, 1.35, 14);
    const booster1 = new THREE.Mesh(boosterGeo, boosterMat);
    booster1.position.set(0.52, 0.95, -0.1);
    const booster2 = booster1.clone();
    booster2.position.set(-0.52, 0.95, -0.1);
    rocketGroup.add(booster1, booster2);

    const boosterCapGeo = new THREE.ConeGeometry(0.16, 0.28, 14);
    const boosterCap1 = new THREE.Mesh(boosterCapGeo, rocketAccentMat);
    boosterCap1.position.set(0.52, 1.62, -0.1);
    const boosterCap2 = boosterCap1.clone();
    boosterCap2.position.set(-0.52, 1.62, -0.1);
    rocketGroup.add(boosterCap1, boosterCap2);

    // Perninhas de pouso
    const legMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 1, metalness: 0.0 });
    const legGeo = new THREE.BoxGeometry(0.08, 0.38, 0.42);
    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(0.28, 0.18, 0.42);
    leg1.rotation.x = 0.22;
    const leg2 = leg1.clone();
    leg2.position.set(-0.28, 0.18, 0.42);
    const leg3 = leg1.clone();
    leg3.position.set(0.32, 0.18, -0.35);
    leg3.rotation.x = -0.22;
    const leg4 = leg2.clone();
    leg4.position.set(-0.32, 0.18, -0.35);
    leg4.rotation.x = -0.22;
    rocketGroup.add(leg1, leg2, leg3, leg4);

    const finGeo = new THREE.BoxGeometry(0.08, 0.35, 0.55);
    const fin1 = new THREE.Mesh(finGeo, rocketAccentMat);
    fin1.position.set(0.4, 0.5, 0);
    fin1.rotation.y = 0.15;
    const fin2 = fin1.clone();
    fin2.position.set(-0.4, 0.5, 0);
    fin2.rotation.y = -0.15;
    rocketGroup.add(fin1, fin2);

    // Porta (fechada por padrão)
    const rocketDoorPivot = new THREE.Group();
    rocketDoorPivot.position.set(0.42, 1.05, 0.52); // lado direito / frente
    rocketGroup.add(rocketDoorPivot);

    const rocketDoor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.55), rocketAccentMat);
    rocketDoor.position.set(0.04, 0.48, 0); // hinge próximo do pivot
    rocketDoorPivot.add(rocketDoor);

    // Botão externo
    const rocketButton = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 14), rocketWindowMat);
    rocketButton.rotation.x = Math.PI / 2;
    rocketButton.position.set(0.55, 1.0, 0.42);
    rocketGroup.add(rocketButton);

    rocketGroup.position.set(rocketX, rocketLandY, rocketZ);
    rocketGroup.scale.setScalar(2.3);

    // --- Cenário: Dentro do foguete ---
    const rocketInterior = new THREE.Group();
    rocketInterior.visible = false;
    scene.add(rocketInterior);

    const interiorWallMat = new THREE.MeshStandardMaterial({
      color: 0xd9e0ea,
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.BackSide,
    });
    const interiorFloorMat = new THREE.MeshStandardMaterial({
      color: 0xbfc9d6,
      roughness: 0.98,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const interiorAccentMat = new THREE.MeshStandardMaterial({ color: 0x6ea8d6, roughness: 0.65, metalness: 0.06 });

    // Cabine maior para evitar ver o "fundo" escuro nas bordas no mobile
    const cabin = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 7.6, 32, 1, true), interiorWallMat);
    cabin.rotation.z = Math.PI / 2;
    cabin.position.set(0, 1.2, 0);
    rocketInterior.add(cabin);

    const cabinFloor = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 8.2), interiorFloorMat);
    cabinFloor.rotation.x = -Math.PI / 2;
    cabinFloor.position.set(0, -1.42, 0);
    rocketInterior.add(cabinFloor);

    const cabinCeil = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 8.2), new THREE.MeshStandardMaterial({ color: 0xd0d8e3, roughness: 0.95, metalness: 0.02, side: THREE.DoubleSide }));
    cabinCeil.rotation.x = Math.PI / 2;
    cabinCeil.position.set(0, 3.45, 0);
    rocketInterior.add(cabinCeil);

    const capGeo = new THREE.CircleGeometry(3.2, 28);
    const capA = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.95, metalness: 0.0 }));
    capA.rotation.y = Math.PI / 2;
    capA.position.set(-3.4, 1.2, 0);
    rocketInterior.add(capA);

    const capB = capA.clone();
    capB.rotation.y = -Math.PI / 2;
    capB.position.set(3.4, 1.2, 0);
    rocketInterior.add(capB);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.6), interiorAccentMat);
    panel.position.set(0, 0.0, -2.2);
    rocketInterior.add(panel);

    const panelLight = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.05), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    panelLight.position.set(0, 0.15, -1.9);
    rocketInterior.add(panelLight);

    // Detalhes internos: painéis e luzes pra ficar mais "cabine"
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85, metalness: 0.05 });
    const softPanelMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.98, metalness: 0.0 });
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });

    const strip1 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, 0.08), stripMat);
    strip1.position.set(0, 2.35, 1.4);
    rocketInterior.add(strip1);
    const strip2 = strip1.clone();
    strip2.position.set(0, 2.35, -1.4);
    rocketInterior.add(strip2);

    // Painéis laterais (apenas na direita, e mais altos), para não cobrir a boneca/quadro
    const wallPanelGeo = new THREE.BoxGeometry(1.05, 0.55, 0.06);
    const wpR1 = new THREE.Mesh(wallPanelGeo, softPanelMat);
    wpR1.position.set(2.35, 1.75, -1.25);
    wpR1.rotation.y = -0.85;
    const wpR2 = wpR1.clone();
    wpR2.position.set(2.35, 1.75, 1.9);
    rocketInterior.add(wpR1, wpR2);

    // Janela/painel com estrelas no fundo
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(3.25, 1.75, 0.12), frameMat);
    winFrame.position.set(0, 0.95, -3.05);
    rocketInterior.add(winFrame);

    const starsCanvas = document.createElement("canvas");
    starsCanvas.width = 512;
    starsCanvas.height = 512;
    const starsCtx = starsCanvas.getContext("2d");
    if (starsCtx) {
      const g = starsCtx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, "#0b1220");
      g.addColorStop(1, "#1f2a44");
      starsCtx.fillStyle = g;
      starsCtx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 260; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() < 0.15 ? 1.8 : 1.0;
        const a = 0.55 + Math.random() * 0.45;
        starsCtx.fillStyle = `rgba(255,255,255,${a})`;
        starsCtx.fillRect(x, y, r, r);
      }
    }
    const starsTex = new THREE.CanvasTexture(starsCanvas);
    starsTex.needsUpdate = true;
    const starsMat = new THREE.MeshStandardMaterial({ map: starsTex, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.9, metalness: 0.0 });
    const winScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.5), starsMat);
    winScreen.position.set(0, 0.95, -2.98);
    rocketInterior.add(winScreen);

    // Quadro com astronauta.png (parede direita)
    const texLoader = new THREE.TextureLoader();
    const astroMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.0 });
    texLoader.load(
      "/astronauta.png",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        astroMat.map = tex;
        astroMat.needsUpdate = true;
      },
      undefined,
      () => {
        // se falhar, mantém branco
      },
    );

    const frameOuter = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.92, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85, metalness: 0.1 }),
    );
    frameOuter.position.set(2.25, 1.08, 0.75);
    frameOuter.rotation.y = -1.05;
    rocketInterior.add(frameOuter);

    const frameInner = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.8), astroMat);
    // Leve offset pra frente para não "sumir" dentro da moldura
    frameInner.position.set(2.19, 1.08, 0.78);
    frameInner.rotation.y = -1.05;
    rocketInterior.add(frameInner);

    // Luzes internas
    const cabinLight = new THREE.PointLight(0xffffff, 0.9, 30);
    cabinLight.position.set(0, 2.2, 2.2);
    rocketInterior.add(cabinLight);
    const cabinLight2 = new THREE.PointLight(0xbfe8ff, 0.55, 30);
    cabinLight2.position.set(0, 2.0, -2.2);
    rocketInterior.add(cabinLight2);

    // Mesas + computadores
    const deskTopMat = new THREE.MeshStandardMaterial({ color: 0xe7edf6, roughness: 0.92, metalness: 0.02 });
    const deskLegMat = new THREE.MeshStandardMaterial({ color: 0x7b8796, roughness: 0.95, metalness: 0.02 });
    const monitorMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85, metalness: 0.05 });
    const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const keyboardMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 1.0, metalness: 0.0 });

    // Textura das telas
    const pcScreenMat = (screenMat as THREE.MeshBasicMaterial).clone();
    texLoader.load(
      "/pc.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.needsUpdate = true;
        pcScreenMat.map = tex;
        pcScreenMat.needsUpdate = true;
      },
      undefined,
      () => {
        // fallback: mantém cor base
      },
    );

    const makeDesk = (x: number, z: number, rotY: number) => {
      const g = new THREE.Group();
      g.position.set(x, -1.42, z);
      g.rotation.y = rotY;

      const top = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.12, 0.72), deskTopMat);
      top.position.set(0, 0.78, 0);
      g.add(top);

      const legGeo = new THREE.BoxGeometry(0.08, 0.8, 0.08);
      const leg1 = new THREE.Mesh(legGeo, deskLegMat);
      leg1.position.set(0.75, 0.38, 0.30);
      const leg2 = leg1.clone();
      leg2.position.set(-0.75, 0.38, 0.30);
      const leg3 = leg1.clone();
      leg3.position.set(0.75, 0.38, -0.30);
      const leg4 = leg1.clone();
      leg4.position.set(-0.75, 0.38, -0.30);
      g.add(leg1, leg2, leg3, leg4);

      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.06), monitorMat);
      monitor.position.set(0, 1.02, -0.15);
      g.add(monitor);
      // Tela um pouco maior
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.36), pcScreenMat);
      screen.position.set(0, 1.02, -0.12);
      g.add(screen);

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), monitorMat);
      stand.position.set(0, 0.84, -0.15);
      g.add(stand);

      const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.22), keyboardMat);
      keyboard.position.set(0, 0.83, 0.15);
      g.add(keyboard);

      rocketInterior.add(g);
    };

    // Mesas só do lado direito para deixar espaço livre pra boneca (lado esquerdo)
    makeDesk(1.85, 0.85, -0.55);
    makeDesk(1.85, -0.85, -0.55);

    // Botão LAUNCH (grande, vermelho) - mais bonito
    const launchConsole = new THREE.Group();
    launchConsole.position.set(0, -1.42, -0.25);
    rocketInterior.add(launchConsole);

    const consoleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.35, 22), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9, metalness: 0.05 }));
    consoleBase.position.y = 0.78;
    launchConsole.add(consoleBase);

    const redButtonMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.45,
      roughness: 0.5,
      metalness: 0.08,
    });
    const redButton = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.42, 0.22, 30), redButtonMat);
    redButton.position.y = 1.04;
    launchConsole.add(redButton);

    const buttonRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.47, 0.045, 14, 28),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8, metalness: 0.2 }),
    );
    buttonRim.rotation.x = Math.PI / 2;
    buttonRim.position.y = 1.12;
    launchConsole.add(buttonRim);

    const buttonCover = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.0, transparent: true, opacity: 0.12 }),
    );
    buttonCover.scale.y = 0.55;
    buttonCover.position.y = 1.24;
    launchConsole.add(buttonCover);

    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 512;
    labelCanvas.height = 256;
    const labelCtx = labelCanvas.getContext("2d");
    if (labelCtx) {
      labelCtx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
      labelCtx.fillStyle = "rgba(255,255,255,0)";
      labelCtx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);

      labelCtx.fillStyle = "rgba(0,0,0,0.55)";
      labelCtx.font = "bold 118px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      labelCtx.textAlign = "center";
      labelCtx.textBaseline = "middle";
      labelCtx.fillText("LAUNCH", 260, 134);
      labelCtx.fillStyle = "#ffffff";
      labelCtx.fillText("LAUNCH", 256, 128);
    }
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.needsUpdate = true;
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
    const launchLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.28), labelMat);
    launchLabel.rotation.x = -Math.PI / 2;
    launchLabel.position.set(0, 1.16, 0.001);
    launchConsole.add(launchLabel);

    // --- Criação da Boneca ---
    const dollGroup = new THREE.Group();

    // Geometrias
    const sphereGeoHigh = new THREE.SphereGeometry(1, 64, 64);
    const sphereGeoMid = new THREE.SphereGeometry(1, 32, 32);

    // A. Cabeça
    const headPivot = new THREE.Group();
    headPivot.position.y = 1.0;
    dollGroup.add(headPivot);

    const head = new THREE.Mesh(sphereGeoHigh, skinMat);
    head.scale.set(1.2, 1.2, 1.2);
    head.position.y = 0;
    headPivot.add(head);

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
    eyeLeft.position.set(-0.45, 0.1, 1.05);

    const highlightLeft = new THREE.Mesh(sphereGeoMid, highlightMat);
    highlightLeft.scale.set(0.05, 0.05, 0.05);
    highlightLeft.position.set(-0.5, 0.2, 1.15);

    const eyeRight = eyeLeft.clone();
    eyeRight.position.set(0.45, 0.1, 1.05);

    const highlightRight = highlightLeft.clone();
    highlightRight.position.set(0.4, 0.2, 1.15);


    // Variáveis para piscar
    let blinkTimer = 0;
    let blinkDuration = 0;
    let isBlinking = false;
    // Referências para highlights
    const highlights = [highlightLeft, highlightRight];
    // Forçar olhos fechados (usado no suspiro)
    let forceEyesClosed = false;

    headPivot.add(eyeLeft, highlightLeft, eyeRight, highlightRight);

    const mouth = new THREE.Mesh(sphereGeoMid, mouthMat);
    const mouthBaseScale = new THREE.Vector3(0.08, 0.05, 0.05);
    mouth.scale.copy(mouthBaseScale);
    mouth.position.set(0, -0.15, 1.15);
    headPivot.add(mouth);

    // 1. Boca reta (agora usando Capsule para ficar redondinha e fofa)
    const mouthLineGeo: THREE.BufferGeometry = new (THREE as any).CapsuleGeometry(0.04, 0.5, 4, 8); // Raio, Comprimento
    const mouthLine = new THREE.Mesh(mouthLineGeo, eyeMat);
    // Girar para ficar horizontal
    mouthLine.rotation.z = Math.PI / 2;
    const mouthLineBaseScale = new THREE.Vector3(1, 1, 1);
    mouthLine.scale.copy(mouthLineBaseScale);
    mouthLine.position.set(0, -0.14, 1.16);
    mouthLine.visible = false;
    headPivot.add(mouthLine);

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

    browLeft.position.set(-0.52, 0.34, 1.16);
    browRight.position.set(0.52, 0.34, 1.16);

    browLeft.visible = false;
    browRight.visible = false;
    headPivot.add(browLeft, browRight);

    const blushScale = 0.25;
    const blushLeft = new THREE.Mesh(sphereGeoMid, blushMat);
    blushLeft.scale.set(blushScale, blushScale * 0.6, blushScale * 0.2);
    blushLeft.position.set(-0.7, -0.1, 0.95);
    const blushRight = blushLeft.clone();
    blushRight.position.set(0.7, -0.1, 0.95);
    headPivot.add(blushLeft, blushRight);

    // D. Cabelo
    const hairBack = new THREE.Mesh(sphereGeoHigh, hairMat);
    hairBack.scale.set(1.4, 1.4, 1.3);
    hairBack.position.set(0, 0.1, -0.3);
    headPivot.add(hairBack);

    const hairSideGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const hairLeft = new THREE.Mesh(hairSideGeo, hairMat);
    hairLeft.scale.set(1, 2.5, 1);
    hairLeft.position.set(-1.3, -0.8, 0);
    hairLeft.rotation.z = 0.2;
    const hairRight = hairLeft.clone();
    hairRight.position.set(1.3, -0.8, 0);
    hairRight.rotation.z = -0.2;
    headPivot.add(hairLeft, hairRight);

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
    sweat.position.set(-0.35, 0.55, 1.12);
    sweat.visible = false;
    headPivot.add(sweat);

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
    puffGroup.position.set(-0.05, -0.12, 1.22);
    headPivot.add(puffGroup);

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
    const tmpCamDir = new THREE.Vector3();
    const tmpLook = new THREE.Vector3();
    const tmpDoor = new THREE.Vector3();
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
        browLeft.position.y = THREE.MathUtils.lerp(browLeft.position.y, 0.27, 0.2); // Mais baixa (base ~0.34)
        browLeft.rotation.z = THREE.MathUtils.lerp(browLeft.rotation.z, 0.1, 0.2); // Quase reta

        // --- SOBRANCELHA DIREITA (Levantada/Questionando) ---
        // Sobe bem alto e arqueia
        browRight.position.x = THREE.MathUtils.lerp(browRight.position.x, 0.52, 0.2);
        browRight.position.y = THREE.MathUtils.lerp(browRight.position.y, 0.44, 0.2); // Bem alta (base ~0.34)
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
        // Coordenadas locais do headPivot (base é ~-0.14). Se ficar alto demais, é porque mudou o pivot.
        mouthLine.position.y = THREE.MathUtils.lerp(mouthLine.position.y, -0.12, 0.2);

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
        browLeft.position.y = THREE.MathUtils.lerp(browLeft.position.y, 0.34, 0.2);
        browRight.position.y = THREE.MathUtils.lerp(browRight.position.y, 0.34, 0.2);

        // Olhos voltam ao formato base
        eyeLeft.scale.lerp(eyeBaseScale, 0.15);
        eyeRight.scale.lerp(eyeBaseScale, 0.15);

        // Boca volta ao "O" ou sorriso padrão
        mouthLine.visible = false;
        mouth.visible = true;
        mouth.scale.lerp(mouthBaseScale, 0.15);

        // Reset da posição da boca de linha
        mouthLine.position.x = 0;
        mouthLine.position.y = THREE.MathUtils.lerp(mouthLine.position.y, -0.14, 0.2);
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
          // `sweat` agora está dentro do headPivot (Y local), então ajustamos a altura
          sweat.position.y = 0.55 - a * 0.08;
          if (a >= 1) {
            phase = "wipe";
            phaseT = 0;
          }
        } else if (phase === "wipe") {
          phaseT += dt;
          const p = clamp01(phaseT / 1.1);
          const up = p < 0.5 ? smooth01(p / 0.5) : smooth01((1 - p) / 0.5);

          // Mão esquerda sobe até a testa e volta
          // `sweat` está no headPivot, então pegamos a posição no mundo e convertemos pro espaço do doll
          const sweatWorld = sweat.getWorldPosition(tmpWorld.clone());
          const sweatLocal = dollGroup.worldToLocal(sweatWorld);
          const targetX = sweatLocal.x - 0.02;
          const targetY = sweatLocal.y - 0.05;
          const targetZ = sweatLocal.z + 0.12;
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
            // `puffGroup` agora está dentro do headPivot (Y local)
            puffGroup.position.y = THREE.MathUtils.lerp(-0.12, 0.18, smooth01(Math.min(t / 1.1, 1)));
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

      // --- Terremoto (após Prosseguir) ---
      const q = quakeSeqRef.current;
      if (q.active || q.restore) {
        if (!q.inited) {
          q.inited = true;
          q.baseGroundX = ground.position.x;
          q.baseGroundZ = ground.position.z;
          q.baseHeadRotY = headPivot.rotation.y;
        }

        const e = time - q.startedAt;
        const quake1 = e >= 0 && e < 1.2;
        const lookLeft = e >= 1.2 && e < 1.8;
        const lookRight = e >= 1.8 && e < 2.6;
        const quake2 = e >= 2.6;

        const shaking = q.active && (quake1 || quake2);
        const intensity = quake1 ? 1 : quake2 ? 0.75 : 0;

        if (shaking) {
          const sx = Math.sin(time * 40) * 0.18 * intensity + (Math.random() - 0.5) * 0.04;
          const sz = Math.cos(time * 36) * 0.18 * intensity + (Math.random() - 0.5) * 0.04;
          ground.position.x = q.baseGroundX + sx;
          ground.position.z = q.baseGroundZ + sz;

          // Shake de câmera (bem sutil, mas perceptível)
          camera.position.x = baseCameraPos.x + sx * 0.08;
          camera.position.y = baseCameraPos.y + Math.abs(Math.sin(time * 34)) * 0.04 * intensity;
          camera.position.z = baseCameraPos.z + sz * 0.06;
          camera.lookAt(0, 0.6, 0);

          q.smokeAcc += dt;
          if (q.smokeAcc >= 0.08) {
            q.smokeAcc = 0;
            const pos = shoeLeft.getWorldPosition(tmpWorld.clone());
            pos.y += 0.05;
            pos.x += (Math.random() - 0.5) * 0.35;
            pos.z += (Math.random() - 0.5) * 0.35;
            spawnFromPool(
              smokePool,
              pos,
              new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                0.35 + Math.random() * 0.25,
                (Math.random() - 0.5) * 0.1,
              ),
            );

            // Se ela estiver correndo desesperada, fumaça também dos pés
            if (panicRef.current.active) {
              const left = shoeLeft.getWorldPosition(tmpWorld.clone());
              const right = shoeRight.getWorldPosition(tmpWorld.clone());
              left.y += 0.02;
              right.y += 0.02;
              spawnFromPool(
                smokePool,
                left,
                new THREE.Vector3(
                  (Math.random() - 0.5) * 0.06,
                  0.28 + Math.random() * 0.2,
                  (Math.random() - 0.5) * 0.06,
                ),
              );
              spawnFromPool(
                smokePool,
                right,
                new THREE.Vector3(
                  (Math.random() - 0.5) * 0.06,
                  0.28 + Math.random() * 0.2,
                  (Math.random() - 0.5) * 0.06,
                ),
              );
            }
          }
        } else {
          ground.position.x = THREE.MathUtils.lerp(ground.position.x, q.baseGroundX, 0.12);
          ground.position.z = THREE.MathUtils.lerp(ground.position.z, q.baseGroundZ, 0.12);
          camera.position.lerp(baseCameraPos, 0.12);
          camera.lookAt(0, 0.6, 0);
        }

        // Cabeça olhando esquerda/direita
        if (q.active && lookLeft) {
          headPivot.rotation.y = THREE.MathUtils.lerp(headPivot.rotation.y, -0.75, 0.18);
        } else if (q.active && lookRight) {
          headPivot.rotation.y = THREE.MathUtils.lerp(headPivot.rotation.y, 0.75, 0.18);
        } else {
          headPivot.rotation.y = THREE.MathUtils.lerp(headPivot.rotation.y, q.baseHeadRotY, 0.12);
        }

        if (q.restore) {
          const gxOk = Math.abs(ground.position.x - q.baseGroundX) < 0.002;
          const gzOk = Math.abs(ground.position.z - q.baseGroundZ) < 0.002;
          const hOk = Math.abs(headPivot.rotation.y - q.baseHeadRotY) < 0.01;
          if (gxOk && gzOk && hOk) {
            q.restore = false;
            q.inited = false;
          }
        }
      }

      // --- Pânico (correndo para várias direções após o texto) ---
      if (panicRef.current.pendingStart) {
        panicRef.current.pendingStart = false;
        panicRef.current.active = true;
        panicRef.current.inited = false;
        panicRef.current.startedAt = time;
      }

      const p = panicRef.current;
      if (p.active) {
        if (!p.inited) {
          p.inited = true;
          p.baseX = dollGroup.position.x;
          p.baseY = dollGroup.position.y;
          p.baseZ = dollGroup.position.z;
          p.smokeAcc = 0;
        }

        const d = time - p.startedAt;
        const stage = bubbleStageRef.current;

        if (stage === "choices") {
          // Se afasta e corre em círculos perto da floresta
          // Mais centralizado para não sumir no celular
          const centerX = 1.2;
          const centerZ = -9.2;
          const r = 1.9;
          const approach = smooth01(Math.min(d / 1.0, 1));
          const ang = d * 2.2;
          const tx = centerX + Math.cos(ang) * r;
          const tz = centerZ + Math.sin(ang) * r;
          const px = THREE.MathUtils.lerp(p.baseX, tx, approach);
          const pz = THREE.MathUtils.lerp(p.baseZ, tz, approach);
          dollGroup.position.x = px;
          dollGroup.position.z = pz;
          dollGroup.position.y = p.baseY + Math.abs(Math.sin(d * 14)) * 0.12;
          const dirX = -Math.sin(ang);
          const dirZ = Math.cos(ang);
          dollGroup.rotation.y = THREE.MathUtils.lerp(dollGroup.rotation.y, Math.atan2(dirX, -dirZ), 0.22);
          dollGroup.rotation.z = Math.sin(d * 12) * 0.08;
        } else {
          // Caótico no lugar (antes da pergunta terminar)
          const dx = Math.sin(d * 3.8) + 0.6 * Math.sin(d * 7.1 + 1.2);
          const dz = Math.cos(d * 4.1) + 0.6 * Math.sin(d * 6.3 + 0.4);

          dollGroup.position.x = p.baseX + dx * 0.85;
          dollGroup.position.z = p.baseZ + dz * 0.5;
          dollGroup.position.y = p.baseY + Math.abs(Math.sin(d * 14)) * 0.12;
          dollGroup.rotation.y = THREE.MathUtils.lerp(dollGroup.rotation.y, Math.atan2(dx, -dz), 0.22);
          dollGroup.rotation.z = Math.sin(d * 12) * 0.08;
        }

        const runAnim = animSpeed * 2.2;
        shoeLeft.position.z = Math.sin(time * runAnim) * 0.55;
        shoeRight.position.z = Math.sin(time * runAnim + Math.PI) * 0.55;
        shoeLeft.position.y = shoeBaseY + Math.max(0, Math.sin(time * runAnim)) * (shoeStepLift * 1.35);
        shoeRight.position.y = shoeBaseY + Math.max(0, Math.sin(time * runAnim + Math.PI)) * (shoeStepLift * 1.35);

        handLeft.position.z = Math.sin(time * runAnim + Math.PI) * 0.35 + 0.25;
        handRight.position.z = Math.sin(time * runAnim) * 0.35 + 0.25;
        handLeft.position.x = THREE.MathUtils.lerp(handLeft.position.x, handWalkXLeft, 0.25);
        handRight.position.x = THREE.MathUtils.lerp(handRight.position.x, handWalkXRight, 0.25);
        handLeft.position.y = THREE.MathUtils.lerp(handLeft.position.y, handIdleY, 0.25);
        handRight.position.y = THREE.MathUtils.lerp(handRight.position.y, handIdleY, 0.25);

        // Fumaçinhas saindo do pé porque ela está correndo
        p.smokeAcc += dt;
        if (p.smokeAcc >= 0.075) {
          p.smokeAcc = 0;
          const left = shoeLeft.getWorldPosition(tmpWorld.clone());
          const right = shoeRight.getWorldPosition(tmpWorld.clone());
          left.y += 0.02;
          right.y += 0.02;

          spawnFromPool(
            smokePool,
            left,
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.06,
              0.22 + Math.random() * 0.18,
              (Math.random() - 0.5) * 0.06,
            ),
          );
          spawnFromPool(
            smokePool,
            right,
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.06,
              0.22 + Math.random() * 0.18,
              (Math.random() - 0.5) * 0.06,
            ),
          );
        }
      }

      // --- Retorno ao escolher "Ir" (volta correndo pra frente, fala só ao chegar) ---
      const gr = goReturnRef.current;
      if (gr.active) {
        if (!gr.inited) {
          gr.inited = true;
          gr.startedAt = time;
          gr.fromX = dollGroup.position.x;
          gr.fromY = dollGroup.position.y;
          gr.fromZ = dollGroup.position.z;
          gr.toX = 0;
          gr.toY = -0.5;
          gr.toZ = 0.8;
        }

        const dur = 2.2;
        const t = smooth01(Math.min((time - gr.startedAt) / dur, 1));

        dollGroup.position.x = THREE.MathUtils.lerp(gr.fromX, gr.toX, t);
        dollGroup.position.y = THREE.MathUtils.lerp(gr.fromY, gr.toY, t) + Math.abs(Math.sin(time * animSpeed * 2.1)) * 0.16;
        dollGroup.position.z = THREE.MathUtils.lerp(gr.fromZ, gr.toZ, t);

        // Sempre olhando "pra frente" (em direção da câmera)
        dollGroup.rotation.y = THREE.MathUtils.lerp(dollGroup.rotation.y, 0, 0.25);
        dollGroup.rotation.z = Math.sin(time * animSpeed) * 0.06;

        // Animação de corrida
        const runAnim = animSpeed * 2.15;
        shoeLeft.position.z = Math.sin(time * runAnim) * 0.55;
        shoeRight.position.z = Math.sin(time * runAnim + Math.PI) * 0.55;
        shoeLeft.position.y = shoeBaseY + Math.max(0, Math.sin(time * runAnim)) * (shoeStepLift * 1.35);
        shoeRight.position.y = shoeBaseY + Math.max(0, Math.sin(time * runAnim + Math.PI)) * (shoeStepLift * 1.35);

        handLeft.position.z = Math.sin(time * runAnim + Math.PI) * 0.35 + 0.25;
        handRight.position.z = Math.sin(time * runAnim) * 0.35 + 0.25;
        handLeft.position.x = THREE.MathUtils.lerp(handLeft.position.x, handWalkXLeft, 0.25);
        handRight.position.x = THREE.MathUtils.lerp(handRight.position.x, handWalkXRight, 0.25);
        handLeft.position.y = THREE.MathUtils.lerp(handLeft.position.y, handIdleY, 0.25);
        handRight.position.y = THREE.MathUtils.lerp(handRight.position.y, handIdleY, 0.25);

        // Fumaça dos pés durante o retorno
        gr.danceUntil = gr.danceUntil; // noop (mantém tipo)
        if (Math.sin(time * runAnim) > 0.6) {
          const left = shoeLeft.getWorldPosition(tmpWorld.clone());
          const right = shoeRight.getWorldPosition(tmpWorld.clone());
          left.y += 0.02;
          right.y += 0.02;
          spawnFromPool(smokePool, left, new THREE.Vector3((Math.random() - 0.5) * 0.06, 0.24 + Math.random() * 0.16, (Math.random() - 0.5) * 0.06));
          spawnFromPool(smokePool, right, new THREE.Vector3((Math.random() - 0.5) * 0.06, 0.24 + Math.random() * 0.16, (Math.random() - 0.5) * 0.06));
        }

        if (t >= 1 && !gr.done) {
          gr.done = true;
          gr.danceUntil = time + 2.0;
          // Agora sim aparece a fala
          setShowSpeechBubble(true);
          setBubbleStage("story");
          setBubbleTyped("Woooow!", () => {});
        }

        // Dança por 2 segundos e toca wow uma vez ao começar
        if (gr.done && time <= gr.danceUntil) {
          if (!gr.wowPlayed) {
            gr.wowPlayed = true;
            sayWow();
          }
          const d = time - (gr.danceUntil - 2.0);
          dollGroup.position.y = -0.5 + Math.sin(d * 10) * 0.06;
          dollGroup.rotation.z = Math.sin(d * 6) * 0.18;
          dollGroup.rotation.y = Math.sin(d * 3.2) * 0.08;

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
        }

        if (gr.done && time > gr.danceUntil) {
          if (!gr.rocketQueued) {
            gr.rocketQueued = true;
            // Queremos: 1s depois que ela para de dançar, o foguete "já pousou".
            // Então iniciamos a descida um pouco antes para terminar exatamente em +1.0s.
            rocketSeqRef.current.pending = true;
            rocketSeqRef.current.pendingAt = gr.danceUntil + 0.65;
            rocketSeqRef.current.active = false;
            rocketSeqRef.current.inited = false;
            rocketSeqRef.current.landed = false;
            rocketSeqRef.current.messageShown = false;
          }
          gr.active = false;
        }
      }

      // --- Foguete (pouso no fundo) ---
      const rk = rocketSeqRef.current;
      if (rk.pending && time >= rk.pendingAt) {
        rk.pending = false;
        rk.active = true;
        rk.inited = false;
        rk.startedAt = time;
      }

      if (rk.active) {
        if (!rk.inited) {
          rk.inited = true;
          rocketGroup.visible = true;
          rocketGroup.position.set(rocketX, rocketLandY + 6.0, rocketZ);
          rocketGroup.rotation.set(0, 0, 0);
          rocketDoorPivot.rotation.y = 0;
        }

        const dur = 0.35;
        const u = smooth01(Math.min((time - rk.startedAt) / dur, 1));
        rocketGroup.position.y = THREE.MathUtils.lerp(rocketLandY + 6.0, rocketLandY, u);
        rocketGroup.rotation.z = Math.sin(u * Math.PI) * 0.06;

        if (u >= 1) {
          rk.active = false;
          rk.landed = true;
          rocketGroup.position.y = rocketLandY;
          rocketGroup.rotation.z = 0;
        }
      }

      if (rk.landed && !rk.messageShown) {
        rk.messageShown = true;
        setShowSpeechBubble(true);
        setBubbleStage("story");
        setBubbleTyped("Que conveniente, um foguete apareceu, vamos entrar nele", () => {
          setBubbleStage("enterRocket");
        });
      }

      // --- Balão seguindo a boneca (screen-space) ---
      const bubbleEl = speechBubbleWrapRef.current;
      if (bubbleEl && bubbleFollowDollRef.current) {
        const p = head.getWorldPosition(tmpWorld.clone());
        p.y += 0.85;
        p.project(camera);
        const w = renderer.domElement.clientWidth || window.innerWidth;
        const h = renderer.domElement.clientHeight || window.innerHeight;
        const x = (p.x * 0.5 + 0.5) * w;
        const y = (-p.y * 0.5 + 0.5) * h;
        bubbleEl.style.left = `${x}px`;
        bubbleEl.style.top = `${y}px`;
        bubbleEl.style.transform = "translate(-50%, -110%)";
      } else if (bubbleEl) {
        bubbleEl.style.left = "";
        bubbleEl.style.top = "";
        bubbleEl.style.transform = "";
      }

      // --- Entrar no foguete (após clicar no botão) ---
      const re = rocketEnterRef.current;
      if (re.active && rocketSeqRef.current.landed) {
        if (!re.inited) {
          re.inited = true;
          re.fromX = dollGroup.position.x;
          re.fromY = dollGroup.position.y;
          re.fromZ = dollGroup.position.z;
          // Ponto de parada em frente ao foguete
          re.toX = rocketX - 2.1;
          re.toY = -0.5;
          re.toZ = rocketZ + 3.1;
          rocketDoorPivot.rotation.y = 0;
        }

        const elapsed = time - re.startedAt;

        if (re.stage === "walk") {
          const dur = 2.8;
          const u = smooth01(Math.min(elapsed / dur, 1));
          dollGroup.position.x = THREE.MathUtils.lerp(re.fromX, re.toX, u);
          dollGroup.position.y = re.toY + Math.abs(Math.sin(time * animSpeed)) * 0.08;
          dollGroup.position.z = THREE.MathUtils.lerp(re.fromZ, re.toZ, u);

          // Olhando na direção do foguete
          const dx = rocketX - dollGroup.position.x;
          const dz = rocketZ - dollGroup.position.z;
          dollGroup.rotation.y = THREE.MathUtils.lerp(dollGroup.rotation.y, Math.atan2(dx, dz), 0.18);

          // Caminhada
          const walkAnim = animSpeed * 1.25;
          shoeLeft.position.z = Math.sin(time * walkAnim) * 0.22;
          shoeRight.position.z = Math.sin(time * walkAnim + Math.PI) * 0.22;
          shoeLeft.position.y = shoeBaseY + Math.max(0, Math.sin(time * walkAnim)) * (shoeStepLift * 0.85);
          shoeRight.position.y = shoeBaseY + Math.max(0, Math.sin(time * walkAnim + Math.PI)) * (shoeStepLift * 0.85);
          handLeft.position.z = Math.sin(time * walkAnim + Math.PI) * 0.18 + 0.35;
          handRight.position.z = Math.sin(time * walkAnim) * 0.18 + 0.35;
          handLeft.position.x = THREE.MathUtils.lerp(handLeft.position.x, handWalkXLeft, 0.22);
          handRight.position.x = THREE.MathUtils.lerp(handRight.position.x, handWalkXRight, 0.22);
          handLeft.position.y = THREE.MathUtils.lerp(handLeft.position.y, handIdleY, 0.22);
          handRight.position.y = THREE.MathUtils.lerp(handRight.position.y, handIdleY, 0.22);

          if (u >= 1) {
            re.stage = "press";
            re.startedAt = time;
          }
        } else if (re.stage === "press") {
          // Porta fechada; ela aperta o botão
          const dur = 0.75;
          const u = smooth01(Math.min(elapsed / dur, 1));
          rocketDoorPivot.rotation.y = 0;

          // Mão direita vai pra frente (simula apertar)
          handRight.position.x = THREE.MathUtils.lerp(handRight.position.x, handIdleXRight + 0.25, 0.25);
          handRight.position.y = THREE.MathUtils.lerp(handRight.position.y, 0.05, 0.25);
          handRight.position.z = THREE.MathUtils.lerp(handRight.position.z, 1.15, 0.25);

          // Pernas paradas
          shoeLeft.position.z = 0;
          shoeRight.position.z = 0;

          if (u >= 1) {
            re.stage = "open";
            re.startedAt = time;
          }
        } else if (re.stage === "open") {
          const dur = 0.7;
          const u = smooth01(Math.min(elapsed / dur, 1));
          rocketDoorPivot.rotation.y = THREE.MathUtils.lerp(0, -1.25, u);

          // Mão volta pro idle
          handRight.position.x = THREE.MathUtils.lerp(handRight.position.x, handIdleXRight, 0.18);
          handRight.position.y = THREE.MathUtils.lerp(handRight.position.y, handIdleY, 0.18);
          handRight.position.z = THREE.MathUtils.lerp(handRight.position.z, handIdleZ, 0.18);

          if (u >= 1) {
            re.stage = "prompt";
            re.startedAt = time;
            setShowSpeechBubble(true);
            setBubbleFollowDoll(true);
            setBubbleStage("story");
            setBubbleTyped("Entra logo", () => {
              if (rocketPromptTimerRef.current) {
                window.clearTimeout(rocketPromptTimerRef.current);
                rocketPromptTimerRef.current = null;
              }
              rocketPromptTimerRef.current = window.setTimeout(() => {
                setShowSpeechBubble(false);
                setBubbleFollowDoll(false);
                rocketEnterRef.current.stage = "run";
                rocketEnterRef.current.startedAt = timeRef.current;
              }, 1100);
            });
          }
        } else if (re.stage === "prompt") {
          // aguardando typing terminar (callback acima)
        } else if (re.stage === "run") {
          const dur = 1.25;
          const u = smooth01(Math.min(elapsed / dur, 1));
          const toX = rocketX;
          const toZ = rocketZ + 1.2;
          dollGroup.position.x = THREE.MathUtils.lerp(re.toX, toX, u);
          dollGroup.position.z = THREE.MathUtils.lerp(re.toZ, toZ, u);
          dollGroup.position.y = -0.5 + Math.abs(Math.sin(time * animSpeed * 2.1)) * 0.14;

          // Corrida
          const runAnim = animSpeed * 2.1;
          shoeLeft.position.z = Math.sin(time * runAnim) * 0.5;
          shoeRight.position.z = Math.sin(time * runAnim + Math.PI) * 0.5;
          shoeLeft.position.y = shoeBaseY + Math.max(0, Math.sin(time * runAnim)) * (shoeStepLift * 1.25);
          shoeRight.position.y = shoeBaseY + Math.max(0, Math.sin(time * runAnim + Math.PI)) * (shoeStepLift * 1.25);
          handLeft.position.z = Math.sin(time * runAnim + Math.PI) * 0.32 + 0.25;
          handRight.position.z = Math.sin(time * runAnim) * 0.32 + 0.25;

          // Olhando na direção do foguete enquanto corre
          const dx = rocketX - dollGroup.position.x;
          const dz = rocketZ - dollGroup.position.z;
          dollGroup.rotation.y = THREE.MathUtils.lerp(dollGroup.rotation.y, Math.atan2(dx, dz), 0.25);

          if (u >= 1) {
            re.active = false;
            // some pra dar sensação de que entrou
            dollGroup.visible = false;

            rocketCamRef.current.active = true;
            rocketCamRef.current.inited = false;
            rocketCamRef.current.startedAt = time;
            rocketCamRef.current.switched = false;
          }
        }
      }

        // --- Otavio: mortal pra trás + dança (após clicar "Desculpa") ---
        const op = otavioPartyRef.current;
        if (op.active) {
          if (!op.inited) {
            op.inited = true;
            op.baseX = dollGroup.position.x;
            op.baseY = dollGroup.position.y;
            op.baseZ = dollGroup.position.z;
            op.baseRotX = dollGroup.rotation.x;
            op.baseRotY = dollGroup.rotation.y;
            op.baseRotZ = dollGroup.rotation.z;
          }

          const elapsed = time - op.startedAt;

          if (op.stage === "flip") {
            const dur = 1.05;
            const u = smooth01(Math.min(elapsed / dur, 1));

            dollGroup.position.x = op.baseX;
            dollGroup.position.z = THREE.MathUtils.lerp(op.baseZ, op.baseZ - 1.6, u);
            dollGroup.position.y = op.baseY + Math.sin(u * Math.PI) * 1.05;

            // Mortal para trás: rotação em X negativa (2π)
            dollGroup.rotation.x = op.baseRotX - u * Math.PI * 2;
            dollGroup.rotation.y = op.baseRotY;
            dollGroup.rotation.z = op.baseRotZ;

            // Membros "recolhem" um pouco durante o mortal
            handLeft.position.set(handIdleXLeft * 0.8, -0.05, 0.2);
            handRight.position.set(handIdleXRight * 0.8, -0.05, 0.2);
            shoeLeft.position.z = 0.25;
            shoeRight.position.z = 0.25;
            shoeLeft.position.y = shoeBaseY + 0.2;
            shoeRight.position.y = shoeBaseY + 0.2;

            if (elapsed >= dur) {
              // "Aterrissa" já um pouco atrás e começa a dançar
              op.stage = "dance";
              op.startedAt = time;
              op.baseZ = op.baseZ - 1.6;
              dollGroup.rotation.x = op.baseRotX;
            }
          } else {
            const d = elapsed;
            dollGroup.position.x = op.baseX;
            dollGroup.position.z = op.baseZ;
            dollGroup.position.y = op.baseY + Math.sin(d * 10) * 0.06;
            dollGroup.rotation.x = THREE.MathUtils.lerp(dollGroup.rotation.x, op.baseRotX, 0.25);
            dollGroup.rotation.z = op.baseRotZ + Math.sin(d * 6) * 0.18;
            dollGroup.rotation.y = op.baseRotY + Math.sin(d * 3.2) * 0.08;

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
          }
        }

      // --- Câmera entrando no foguete -> troca para interior ---
      const rc = rocketCamRef.current;
      if (rc.active) {
        if (!rc.inited) {
          rc.inited = true;
          rc.from.copy(camera.position);
          camera.getWorldDirection(tmpCamDir);
          rc.fromLook.copy(camera.position).add(tmpCamDir.multiplyScalar(10));

          rocketDoorPivot.getWorldPosition(tmpDoor);
          rc.to.copy(tmpDoor).add(new THREE.Vector3(-2.0, 0.85, 3.2));
          rc.toLook.copy(tmpDoor).add(new THREE.Vector3(0.0, 0.25, 0.0));
        }

        const u = smooth01(Math.min((time - rc.startedAt) / rc.dur, 1));
        camera.position.lerpVectors(rc.from, rc.to, u);
        tmpLook.lerpVectors(rc.fromLook, rc.toLook, u);
        camera.lookAt(tmpLook);

        if (u >= 1) {
          rc.active = false;
          worldModeRef.current = "inside";

          quakeSeqRef.current.active = false;
          quakeSeqRef.current.restore = false;
          panicRef.current.active = false;
          panicRef.current.pendingStart = false;

          sky.visible = false;
          ground.visible = false;
          forest.visible = false;
          rocketGroup.visible = false;
          rocketInterior.visible = true;

          scene.background = new THREE.Color(0xc7d0dc);

          // Coloca a boneca dentro com a gente
          dollGroup.visible = true;
          dollGroup.scale.setScalar(0.82);
          // Joga ela para o lado/fundo para não esconder o botão
          dollGroup.position.set(-2.15, -0.5, 0.55);
          dollGroup.rotation.set(0, 0.75, 0);
          phase = "idle";

          // Para garantir que nenhuma sequência externa mexa nela
          agataSeqRef.current.active = false;
          goReturnRef.current.active = false;
          rocketSeqRef.current.active = false;
          rocketSeqRef.current.pending = false;
          rocketEnterRef.current.active = false;

          setCameraForViewport(window.innerWidth, window.innerHeight);
          baseCameraPos = camera.position.clone();

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
          const material = object.material as THREE.Material | THREE.Material[];
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose());
          } else {
            material.dispose();
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
      if (proceedTimerRef.current) {
        window.clearTimeout(proceedTimerRef.current);
        proceedTimerRef.current = null;
      }
      if (otavioSorryTimerRef.current) {
        window.clearTimeout(otavioSorryTimerRef.current);
        otavioSorryTimerRef.current = null;
      }
      if (rocketPromptTimerRef.current) {
        window.clearTimeout(rocketPromptTimerRef.current);
        rocketPromptTimerRef.current = null;
      }
      if (bubbleTypingTimerRef.current) {
        window.clearInterval(bubbleTypingTimerRef.current);
        bubbleTypingTimerRef.current = null;
      }
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

      const alert = alertSfxRef.current;
      if (alert) {
        try {
          alert.pause();
          alert.currentTime = 0;
        } catch {
          // ignore
        }
        alertSfxRef.current = null;
      }

      const chicken = chickenSfxRef.current;
      if (chicken) {
        try {
          chicken.pause();
          chicken.currentTime = 0;
        } catch {
          // ignore
        }
        chickenSfxRef.current = null;
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
        a.volume = musicMutedRef.current ? 0 : SFX_VOL;
        helloSfxRef.current = a;
        a.load();
      }
      if (!wowSfxRef.current) {
        const w = new Audio("/wow.mp3");
        w.preload = "auto";
        w.volume = musicMutedRef.current ? 0 : SFX_VOL;
        wowSfxRef.current = w;
        w.load();
      }
      if (!alertSfxRef.current) {
        const al = new Audio("/alert.mp3");
        al.preload = "auto";
        al.volume = musicMutedRef.current ? 0 : SFX_VOL;
        alertSfxRef.current = al;
        al.load();
      }
    } catch {
      // ignore
    }

    // Reseta UI/flags caso reinicie
    setShowSpeechBubble(false);
    setBubbleStage("name");
    setChoice(null);
    setBubbleTargetText("Oiiiii como é o seu nome?");
    setBubbleText("Oiiiii como é o seu nome?");
    setNameLocked(false);
    setPlayerName("");
    bubbleShownRef.current = false;
    helloPlayedRef.current = false;
    weirdUntilRef.current = 0;

    agataSeqRef.current.active = false;
    agataSeqRef.current.inited = false;
    agataSeqRef.current.wowPlayed = false;
    agataSeqRef.current.musicSwitched = false;
    agataSeqRef.current.starBurstDone = false;

    if (proceedTimerRef.current) {
      window.clearTimeout(proceedTimerRef.current);
      proceedTimerRef.current = null;
    }
    quakeSeqRef.current.active = false;
    quakeSeqRef.current.restore = false;
    quakeSeqRef.current.inited = false;
    panicRef.current.active = false;
    panicRef.current.pendingStart = false;
    panicRef.current.inited = false;

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
      {bubbleStage !== "otavioRestart" ? (
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
      ) : null}

      {started && showSpeechBubble ? (
        <div
          ref={speechBubbleWrapRef}
          className="pointer-events-auto absolute left-1/2 top-8 z-20 w-[min(92vw,420px)] -translate-x-1/2"
        >
          <div className="relative rounded-2xl border border-zinc-200 bg-white/90 px-5 py-4 text-zinc-900 shadow-sm">
            <div className="text-base font-semibold">{bubbleText}</div>
            {bubbleStage === "name" ? (
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
            ) : null}

            {bubbleStage === "proceed" ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={isTypingBubble}
                  className="w-full rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prosseguir
                </button>
              </div>
            ) : null}

            {bubbleStage === "choices" ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChoice("go")}
                  disabled={isTypingBubble || choice !== null}
                  className="rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ir
                </button>
                <button
                  type="button"
                  onClick={() => handleChoice("stay")}
                  disabled={isTypingBubble || choice !== null}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ficar
                </button>
              </div>
            ) : null}

            {bubbleStage === "otavioSorry" ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleOtavioSorry}
                  disabled={isTypingBubble}
                  className="w-full rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Desculpa
                </button>
              </div>
            ) : null}

            {bubbleStage === "enterRocket" ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleEnterRocket}
                  disabled={isTypingBubble}
                  className="w-full rounded-xl bg-black px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Entrar no foguete
                </button>
              </div>
            ) : null}
            <div className="absolute left-10 top-full h-4 w-4 -translate-y-2 rotate-45 border-b border-r border-zinc-200 bg-white/90" />
          </div>
        </div>
      ) : null}

      {started && bubbleStage === "otavioRestart" ? (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-start justify-center m-10">
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-full bg-black px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Voltar pro início
          </button>
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