<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

  let container;

  onMount(() => {
    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Create a GLTFLoader instance
    const loader = new GLTFLoader();

    // Optional: Set up DracoLoader to handle compressed meshes
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/examples/jsm/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    // Load the GLTF model
    loader.load(
      'models/shelves.gltf',  // Replace with your model's URL
      (gltf) => {
        scene.add(gltf.scene);
        camera.position.z = 5; // Adjust camera position as needed
      },
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error('Error loading GLTF model:', error);
      }
    );

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    // Handle window resizing
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  });
</script>

<style>
  div {
    width: 100%;
    height: 100vh;
    margin: 0;
    padding: 0;
  }

  canvas {
    display: block;
  }
</style>

<div bind:this={container}></div>
