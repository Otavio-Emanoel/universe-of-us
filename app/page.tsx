"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Home() {
  const threeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threeRef.current) return;

    // --- 1. Configuração da Cena ---
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFF0F5); // Lavender Blush

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    threeRef.current.appendChild(renderer.domElement);
    
    // Câmera parada, olhando para o centro
    camera.position.set(0, 0.5, 6); 

    // --- 2. Iluminação ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
    scene.add(ambientLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.5);
    frontLight.position.set(2, 5, 5);
    scene.add(frontLight);

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
    const eyeLeft = new THREE.Mesh(sphereGeoMid, eyeMat);
    eyeLeft.scale.set(eyeScale, eyeScale * 1.2, eyeScale * 0.5);
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
    mouth.scale.set(0.08, 0.05, 0.05);
    mouth.position.set(0, 0.85, 1.15);
    dollGroup.add(mouth);

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
    shoeLeft.position.set(-0.4, -0.8, 0); // Posição base

    const shoeRight = shoeLeft.clone();
    shoeRight.position.set(0.4, -0.8, 0); // Posição base
    dollGroup.add(shoeLeft, shoeRight);

    // POSIÇÃO INICIAL (Longe no fundo)
    dollGroup.position.y = -0.5;
    dollGroup.position.z = -15; 
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

    // --- Animação ---
    let frameId: number;
    let time = 0;
    
    // Configurações da caminhada
    const stopZ = 1; // Onde ela para
    const walkSpeed = 0.06; // Velocidade de movimento
    const animSpeed = 8; // Velocidade do movimento das pernas

    type Phase = "walk" | "sweat" | "wipe" | "postWipeWait" | "wave" | "idle";
    let phase: Phase = "walk";
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

      // Estado 1: Andando
      if (phase === "walk" && dollGroup.position.z < stopZ) {
        // Mover para frente
        dollGroup.position.z += walkSpeed;

        // Pulo do caminhar (Bobbing)
        dollGroup.position.y = -0.5 + Math.abs(Math.sin(time * animSpeed)) * 0.15;

        // Balanço lateral (Wobble) - deixa fofo
        dollGroup.rotation.z = Math.sin(time * (animSpeed / 2)) * 0.05;
        dollGroup.rotation.y = Math.sin(time * (animSpeed / 4)) * 0.02; // Leve rotação Y

        // Animação Pés (Alternados)
        shoeLeft.position.z = Math.sin(time * animSpeed) * 0.4;
        shoeRight.position.z = Math.sin(time * animSpeed + Math.PI) * 0.4;
        // Levantar levemente o pé que vai para frente
        shoeLeft.position.y = -0.8 + Math.max(0, Math.sin(time * animSpeed)) * 0.2;
        shoeRight.position.y = -0.8 + Math.max(0, Math.sin(time * animSpeed + Math.PI)) * 0.2;

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
        shoeLeft.position.z = THREE.MathUtils.lerp(shoeLeft.position.z, 0, 0.1);
        shoeRight.position.z = THREE.MathUtils.lerp(shoeRight.position.z, 0, 0.1);
        shoeLeft.position.y = THREE.MathUtils.lerp(shoeLeft.position.y, -0.8, 0.1);
        shoeRight.position.y = THREE.MathUtils.lerp(shoeRight.position.y, -0.8, 0.1);

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
        renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
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
  }, []);

  return <div ref={threeRef} style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "linear-gradient(to bottom, #FFF0F5, #FFE4E1)" }} />;
}