"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Home() {
  const threeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threeRef.current) return;

    // --- 1. Configuração da Cena (Cleaner) ---
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scene = new THREE.Scene();
    // Fundo pastel suave em vez de cinza
    scene.background = new THREE.Color(0x000000); // Lavender Blush

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio); // Para telas retina ficarem nítidas
    // renderer.shadowMap.enabled = true; // Sombras desativadas para um look mais "clean" e flat
    threeRef.current.appendChild(renderer.domElement);
    
    camera.position.set(0, 0.5, 5);

    // --- 2. Iluminação Suave (Soft Lighting) ---
    // Luz ambiente forte para evitar áreas escuras
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
    scene.add(ambientLight);

    // Luz direcional suave frontal-superior
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.5);
    frontLight.position.set(2, 5, 5);
    scene.add(frontLight);


    // --- 3. Materiais "Fofos" (Alta rugosidade = parece massinha/feltro) ---
    const matSettings = { roughness: 0.8, metalness: 0.0 }; // Sem brilho metálico

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, ...matSettings }); // Pele mais clara
    const dressMat = new THREE.MeshStandardMaterial({ color: 0xFFB6C1, ...matSettings }); // Rosa pastel
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x222222, ...matSettings }); // Preto suave
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 }); // Olhos quase pretos
    const shoesMat = new THREE.MeshStandardMaterial({ color: 0xFFF0FB, ...matSettings }); // Rosa suave
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0xFF6347, ...matSettings }); // Boca vermelha suave
    const blushMat = new THREE.MeshStandardMaterial({ color: 0xFF69B4, transparent: true, opacity: 0.4 }); // Blush translúcido
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Brilho dos olhos (sem sombra)

    // --- Criação da Boneca (Estilo Chibi) ---
    const dollGroup = new THREE.Group();

    // Geometrias reutilizáveis de alta qualidade
    const sphereGeoHigh = new THREE.SphereGeometry(1, 64, 64); // Muito suave
    const sphereGeoMid = new THREE.SphereGeometry(1, 32, 32);

    // A. Cabeça (Proporcionalmente grande)
    const head = new THREE.Mesh(sphereGeoHigh, skinMat);
    head.scale.set(1.2, 1.2, 1.2); // Cabeça grande
    head.position.y = 1.0;
    dollGroup.add(head);

    // B. Corpo/Vestido (Cone suave)
    const bodyGeo = new THREE.ConeGeometry(1.1, 1.6, 64);
    const body = new THREE.Mesh(bodyGeo, dressMat);
    body.position.y = 0;
    dollGroup.add(body);

    // C. Rosto Fofo
    // Olhos (Maior e mais separado)
    const eyeScale = 0.18;
    const eyeLeft = new THREE.Mesh(sphereGeoMid, eyeMat);
    eyeLeft.scale.set(eyeScale, eyeScale * 1.2, eyeScale * 0.5); // Oval e achatado
    eyeLeft.position.set(-0.45, 1.1, 1.05);
    
    // Brilho no olho (Catchlight - crucial para fofura)
    const highlightLeft = new THREE.Mesh(sphereGeoMid, highlightMat);
    highlightLeft.scale.set(0.05, 0.05, 0.05);
    highlightLeft.position.set(-0.5, 1.2, 1.15);
    
    const eyeRight = eyeLeft.clone();
    eyeRight.position.set(0.45, 1.1, 1.05);
    
    const highlightRight = highlightLeft.clone();
    highlightRight.position.set(0.4, 1.2, 1.15);

    dollGroup.add(eyeLeft, highlightLeft, eyeRight, highlightRight);

    // Boca (Pequena)
    const mouth = new THREE.Mesh(sphereGeoMid, mouthMat);
    mouth.scale.set(0.08, 0.05, 0.05);
    mouth.position.set(0, 0.85, 1.15);
    dollGroup.add(mouth);

    // Blush (Bochechas rosadas)
    const blushScale = 0.25;
    const blushLeft = new THREE.Mesh(sphereGeoMid, blushMat);
    blushLeft.scale.set(blushScale, blushScale * 0.6, blushScale * 0.2);
    blushLeft.position.set(-0.7, 0.9, 0.95);

    const blushRight = blushLeft.clone();
    blushRight.position.set(0.7, 0.9, 0.95);
    dollGroup.add(blushLeft, blushRight);


    // D. Cabelo (Formas arredondadas e simples)
    // Parte de trás (Grande esfera achatada)
    const hairBack = new THREE.Mesh(sphereGeoHigh, hairMat);
    hairBack.scale.set(1.4, 1.4, 1.3);
    hairBack.position.set(0, 1.1, -0.3);
    dollGroup.add(hairBack);

    // Laterais (Esferas alongadas para parecer maria-chiquinha solta)
    const hairSideGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const hairLeft = new THREE.Mesh(hairSideGeo, hairMat);
    hairLeft.scale.set(1, 2.5, 1);
    hairLeft.position.set(-1.3, 0.2, 0);
    hairLeft.rotation.z = 0.2;

    const hairRight = hairLeft.clone();
    hairRight.position.set(1.3, 0.2, 0);
    hairRight.rotation.z = -0.2;
    dollGroup.add(hairLeft, hairRight);

    // E. Mãos (Esferas simples próximas ao corpo)
    const handScale = 0.25;
    const handLeft = new THREE.Mesh(sphereGeoMid, skinMat);
    handLeft.scale.set(handScale, handScale, handScale);
    handLeft.position.set(-0.9, -0.1, 0.5);

    const handRight = handLeft.clone();
    handRight.position.set(0.9, -0.1, 0.5);
    dollGroup.add(handLeft, handRight);

    // F. Sapatos (Esferas achatadas na base)
    const shoeScale = 0.35;
    const shoeLeft = new THREE.Mesh(sphereGeoMid, shoesMat);
    shoeLeft.scale.set(shoeScale, shoeScale * 0.6, shoeScale * 1.2);
    shoeLeft.position.set(-0.4, -1.2, 0);

    const shoeRight = shoeLeft.clone();
    shoeRight.position.set(0.4, -1.2, 0);
    dollGroup.add(shoeLeft, shoeRight);

    // Centralizar o grupo
    dollGroup.position.y = -0.5;
    scene.add(dollGroup);

    // --- Animação Suave ---
    let frameId: number;
    let time = 0;
    function animate() {
      frameId = requestAnimationFrame(animate);
      time += 0.015;
      
      // Rotação lenta
      dollGroup.rotation.y = Math.sin(time * 0.5) * 0.1;
      
      // "Bounce" (pulo) suave
      dollGroup.position.y = -0.5 + Math.abs(Math.sin(time * 2)) * 0.1;
      // Inclinação leve da cabeça ao pular
      head.rotation.z = Math.sin(time * 2) * 0.05;

      renderer.render(scene, camera);
    }
    animate();

    // --- Resize Handler (para manter a proporção) ---
    const handleResize = () => {
        if (!threeRef.current) return;
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      // Limpar geometrias e materiais para evitar vazamento de memória
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

  // Adicionado um gradiente sutil no fundo via CSS para ficar mais clean
  return <div ref={threeRef} style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "linear-gradient(to bottom, #FFF0F5, #FFE4E1)" }} />;
}