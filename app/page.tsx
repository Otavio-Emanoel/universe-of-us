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

    // --- Animação ---
    let frameId: number;
    let time = 0;
    
    // Configurações da caminhada
    const stopZ = 1; // Onde ela para
    const walkSpeed = 0.06; // Velocidade de movimento
    const animSpeed = 8; // Velocidade do movimento das pernas

    function animate() {
      frameId = requestAnimationFrame(animate);
      time += 0.015;


      // --- ANIMAÇÃO DE PISCAR ---
      if (!isBlinking) {
        blinkTimer -= 0.015;
        if (blinkTimer <= 0) {
          isBlinking = true;
          blinkDuration = 0.08 + Math.random() * 0.08; // duração do piscar
        }
        // Highlights visíveis
        highlights.forEach(h => h.visible = true);
      } else {
        blinkDuration -= 0.015;
        // Olhos fecham
        eyeLeft.scale.y = THREE.MathUtils.lerp(eyeLeft.scale.y, 0.05, 0.5);
        eyeRight.scale.y = THREE.MathUtils.lerp(eyeRight.scale.y, 0.05, 0.5);
        // Highlights somem
        highlights.forEach(h => h.visible = false);
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

      // Estado 1: Andando
      if (dollGroup.position.z < stopZ) {
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

        // Cabelo balançando (reativo)
        hairLeft.rotation.z = 0.2 + Math.sin(time * animSpeed) * 0.1;
        hairRight.rotation.z = -0.2 + Math.sin(time * animSpeed) * 0.1;

      } 
      // Estado 2: Chegou e Parou (Idle)
      else {
        // Reset suave para posição de "respiro"
        const idleTime = time * 2;
        
        // Pulo suave (respiração)
        dollGroup.position.y = THREE.MathUtils.lerp(dollGroup.position.y, -0.5 + Math.sin(idleTime) * 0.05, 0.1);
        
        // Reset rotação corpo
        dollGroup.rotation.z = THREE.MathUtils.lerp(dollGroup.rotation.z, 0, 0.1);
        dollGroup.rotation.y = THREE.MathUtils.lerp(dollGroup.rotation.y, 0, 0.1);

        // Pés voltam pro chão
        shoeLeft.position.z = THREE.MathUtils.lerp(shoeLeft.position.z, 0, 0.1);
        shoeRight.position.z = THREE.MathUtils.lerp(shoeRight.position.z, 0, 0.1);
        shoeLeft.position.y = THREE.MathUtils.lerp(shoeLeft.position.y, -0.8, 0.1);
        shoeRight.position.y = THREE.MathUtils.lerp(shoeRight.position.y, -0.8, 0.1);

        // Mãos vão para uma posição mais afastada e mais para frente
        handLeft.position.z = THREE.MathUtils.lerp(handLeft.position.z, 0.55, 0.1); // mais para frente
        handRight.position.z = THREE.MathUtils.lerp(handRight.position.z, 0.55, 0.1); // mais para frente
        handLeft.position.x = THREE.MathUtils.lerp(handLeft.position.x, -1.15, 0.1); // mais afastada
        handRight.position.x = THREE.MathUtils.lerp(handRight.position.x, 1.15, 0.1); // mais afastada
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