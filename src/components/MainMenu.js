// src/components/MainMenu.js
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OceanShader } from '../shaders/OceanShader';

const MainMenu = ({ onStartGame }) => {
  const mountRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    
    // Store ref value
    const mountNode = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#001a33'); // Dark blue background
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountNode.appendChild(renderer.domElement);

    // Create ocean
    const oceanGeometry = new THREE.PlaneGeometry(15, 15, 128, 128);
    const oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uColorDeep: { value: new THREE.Color('#0051a8') },
        uColorShallow: { value: new THREE.Color('#00a1ff') }
      },
      vertexShader: OceanShader.vertexShader,
      fragmentShader: OceanShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });

    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -2;
    scene.add(ocean);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 3, 2);
    scene.add(directionalLight);

    // Add point lights for better water highlights
    const pointLight1 = new THREE.PointLight(0x00a1ff, 1, 10);
    pointLight1.position.set(2, 3, -2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0051a8, 1, 10);
    pointLight2.position.set(-2, 3, 2);
    scene.add(pointLight2);

    // Animation function
    const animate = () => {
      oceanMaterial.uniforms.time.value = performance.now() * 0.001;
      
      // Slowly rotate camera around the scene
      camera.position.x = Math.sin(performance.now() * 0.0003) * 5;
      camera.position.z = Math.cos(performance.now() * 0.0003) * 5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      scene.remove(ocean);
      oceanGeometry.dispose();
      oceanMaterial.dispose();
      renderer.dispose();
      if (mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      <div ref={mountRef} className="fixed inset-0 -z-10" />
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-gray-900 bg-opacity-80 p-8 rounded-xl shadow-2xl transform transition-all backdrop-blur-sm">
          <h1 className="text-5xl font-bold text-white mb-8 text-center">
            Tic Tac Toe 3D
          </h1>
          <div className="space-y-4">
            <button
              onClick={() => onStartGame('2player')}
              className="w-full px-6 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 shadow-lg transform hover:scale-105"
            >
              Play Multiplayer
            </button>
            <button
              onClick={() => onStartGame('cpu')}
              className="w-full px-6 py-4 text-lg font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 shadow-lg transform hover:scale-105"
            >
              Play with CPU
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainMenu;