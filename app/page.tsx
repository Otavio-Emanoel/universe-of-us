"use client"
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Home() {
  const threeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threeRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    threeRef.current.appendChild(renderer.domElement);
    camera.position.z = 5;

    // Exemplo: adicionar um cubo
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    function animate() {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      renderer.dispose();
      if (threeRef.current) {
        threeRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={threeRef} style={{ width: "100vw", height: "100vh" }} />;
}