import React, { useEffect } from 'react';
import * as THREE from 'three';

const ThreeJSBackground = () => {
  useEffect(() => {
    // Create scene
    const scene = new THREE.Scene();

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3; // Adjusted for better positioning

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true }); // Use alpha for transparent background
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Set clear color to transparent
    document.body.appendChild(renderer.domElement);

    // Create cube with texture or material
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4caf50, // Light green color for the cube
      wireframe: true, // Wireframe style
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Create ambient light for the scene
    const light = new THREE.AmbientLight(0x404040, 2); // Soft light to illuminate the cube
    scene.add(light);

    // Resize handler for responsive design
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = function () {
      requestAnimationFrame(animate);

      // Rotate cube
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      // Render scene
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize); // Cleanup on component unmount
    };
  }, []);

  return null; // The component itself doesn't render anything directly
};

export default ThreeJSBackground;
