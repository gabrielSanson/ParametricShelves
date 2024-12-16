<script>
  import { onMount } from 'svelte';
    import { passive } from 'svelte/legacy';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';


  let total_width
  let vertical_separators


  let scene, camera, renderer, model;
  let shapeKeyInfluences = {
    Depth: 0,
    Width: 0,
    Edge: 0,
  };
  function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}

  function init() {
    setupScene()
    // Load the GLTF model
    const loader = new GLTFLoader();
    loader.load('/shelves.gltf', (gltf) => {
      model = gltf.scene;
      model.name = "section"
      model.position.set(0, 0, 0);
      model.scale.set(100, 100, 100);
      console.log(model.morphTargetInfluences)
      scene.add(model);

      // Traverse the model and apply material changes
      model.traverse((child) => {
        if (child.isMesh) {
          console.log(child.name); // Mesh name
          console.log(child.morphTargetDictionary); // Morph targets dictionary
          
          // Set the material to be double-sided and apply a color
          child.material.side = THREE.DoubleSide; // Make material double-sided
          child.material.color.set(0x00ff00); // Set the color to green (you can change this)

          if (child.morphTargetDictionary) {
            Object.keys(child.morphTargetDictionary).forEach((key) => {
              console.log(`Shape Key: ${key}`);
            });
          }
        }
      });
    });





    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

 function animate() {
   requestAnimationFrame(animate);
   renderer.render(scene, camera);
 }


 function setupScene() {
    // Create the scene
    scene = new THREE.Scene();

    // Load the HDRI environment texture
    const hdriLoader = new RGBELoader();
    hdriLoader.load('/environment5.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.background = texture;
    });
    // Set up the camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-50, 10, 120);
    // Set up the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10).normalize();
    scene.add(directionalLight);
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

 }




// Update the shape key influences based on user input
const updateShapeKey = (name) => {
  if (model) {
    model.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary[name] !== undefined) {
        const index = child.morphTargetDictionary[name];

        // Handle shape key updates
        switch (name) {
          case "Width":
            const morphValue = mapRange(total_width/vertical_separators, 0.1, 2, 0, 1);
            child.morphTargetInfluences[index] = morphValue;
            break;

          case "Depth":
            // Placeholder for "Depth" logic
            break;

          case "Height":
            // Placeholder for "Height" logic
            break;

          default:
            // Handle unsupported shape keys if needed
            console.warn(`Unsupported shape key: ${name}`);
        }
      }
    });
  }
};

  onMount(() => {
    init();
    animate();
  });
</script>



<div id="canvas-container"></div>

<!-- Controls for adjusting shape key influences -->
<div class="parametric-menu" >
  Total Width
  <input  bind:value={total_width} type="number"  min="0.1"max="2" step="0.01" on:input={(e) => updateShapeKey('Width')}  >
  Vertical Sepparators
  <input  bind:value={vertical_separators} type="number"  min="0"max="100" on:input={(e) => updateShapeKey('Width')}  >

  Height
  <input type="number" min="0.1"max="2" step="0.01" on:input={(e) => updateShapeKey('Height')}  >
  Depth
  <input type="number" min="0.1"max="2" step="0.01" on:input={(e) => updateShapeKey('Depth')}  >

  <!-- <button on:click={generateStructure} > Generate Structure </button> -->

  
</div>

<style>
  body {
    margin: 0;
    padding: 0;
  }

  #canvas-container {
    width: 100%;
    height: 100vh;
  }

  .controls {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 10px;
    border-radius: 5px;
  }

  .controls label {
    color: white;
    display: block;
    margin-bottom: 5px;
  }

  .controls input {
    width: 100%;
  }
  .parametric-menu{
    width: 100%;
    position: absolute;
    bottom: 10px;
  }
</style>