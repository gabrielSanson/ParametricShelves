<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

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

    // Load the GLTF model
    const loader = new GLTFLoader();
    loader.load('/shelves.gltf', (gltf) => {
      model = gltf.scene;
      model.name = "section"
      model.position.set(0, 0, 0);
      model.scale.set(100, 100, 100);
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

//// maps shape key "blend amount" to real width corresponding values
/// 10cm when input = 0 , 2m when input = 1
  // var real_width = mapRange(width_value_from_input,0.1,2,0.0,1)
        /// Width input is is "total_width"
        /// Vsepparator input is "v_sepparators"

  /// 10cm when input = 0 , 1m when input = 1
  // var real_height = mapRange(height_value_from_input,0.1,1,0,1)
  // var real_depth = mapRange(depth_value_from_input,0.1,1,0,1)




// Main function to generate the structure
function generateStructure() {
  if (!model) {
    console.error("Model not loaded yet.");
    return;
  }

  // Fetch input values
  const totalWidthInput = parseFloat(document.getElementById("total_width").value);
  const vSeparatorsInput = parseInt(document.getElementById("v_sepparators").value, 10);
  const heightInput = parseFloat(document.getElementById("height").value);
  const depthInput = parseFloat(document.getElementById("depth").value);

  // Map inputs ( real value )  to shape key blend_amount ( 0.0 to 1.0 )
  const realWidth = mapRange(totalWidthInput,0.1, 2, 0, 1); // 10cm to 2m
  const realHeight = mapRange(heightInput, 0.1, 1, 0, 1); // 10cm to 1m
  const realDepth = mapRange(depthInput, 0.1, 1, 0, 1); // 10cm to 1m

  // Calculate instance width
  const instanceWidth = realWidth / vSeparatorsInput;

  // Clear existing generated instances from the scene
  scene.children.forEach((child) => {
    if (child.name === "section_instance") {
      scene.remove(child);
    }
  });

  const basePosition = new THREE.Vector3(0, 0, 0);

  // Generate instances
  for (let i = 0; i < vSeparatorsInput; i++) {
    // Clone the base model
    const instance = model.clone();
    instance.name = "section_instance"; // Tag for cleanup

    // Set position with offset
    instance.position.set(basePosition.x + i * instanceWidth, basePosition.y, basePosition.z);

    // Apply shape key values
    instance.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        const widthInfluence = mapRange(i, 0, vSeparatorsInput - 1, 0, 1); // Adjust based on position
        // const widthInfluence = mapRange(i, 0, vSeparatorsInput - 1, 0, 1); // Adjust based on position
        const depthInfluence = realDepth; // Mapped depth value
        const heightInfluence = realHeight; // Mapped height value

        child.morphTargetInfluences[child.morphTargetDictionary["Width"]] = widthInfluence;
        child.morphTargetInfluences[child.morphTargetDictionary["Depth"]] = depthInfluence;
        child.morphTargetInfluences[child.morphTargetDictionary["Height"]] = heightInfluence;
      }
    });

    // Add the instance to the scene
    scene.add(instance);
  }
}





  // Update the shape key influences based on user input
  const updateShapeKey = (name, value) => {
    if (model) {
      model.traverse((child) => {
        if (child.isMesh && child.morphTargetDictionary[name] !== undefined) {
          const index = child.morphTargetDictionary[name];
          child.morphTargetInfluences[index] = value;
        }
      });
    }
  };

  onMount(() => {

  // Attach event listeners to update the structure dynamically
  // document.getElementById("total_width").addEventListener("input", generateStructure);
  // document.getElementById("v_sepparators").addEventListener("input", generateStructure);
  // document.getElementById("height").addEventListener("input", generateStructure);
  // document.getElementById("depth").addEventListener("input", generateStructure);



    init();
    animate();
  });
</script>



<div id="canvas-container"></div>

<!-- Controls for adjusting shape key influences -->
<div class="parametric-menu" >
  Total Width
  <input id="total_width" type="number" min="0.1"max="2" step="0.01" on:input={(e) => updateShapeKey('Width', e.target.value)}  >
  Vertical Sepparators
  <input id="v_sepparators" type="number" min="0"max="100" value="4" on:input={(e) => updateShapeKey('Width', e.target.value)}  >

  Height
  <input id="height" type="number" min="0.1"max="2" step="0.01" on:input={(e) => updateShapeKey('Height', e.target.value)}  >
  Depth
  <input id="depth" type="number" min="0.1"max="2" step="0.01" on:input={(e) => updateShapeKey('Depth', e.target.value)}  >

  <button on:click={generateStructure} > Generate Structure </button>

  
</div>



<div class="controls">
  <label for="depthSlider">Depth:</label>
  <input
    id="depthSlider"
    type="range"
    min="0"
    max="1"
    step="0.01"
    on:input={(e) => updateShapeKey('Depth', e.target.value)}
  />

  <label for="widthSlider">Width:</label>
  <input
    id="widthSlider"
    type="range"
    min="0.0"
    max="2"
    step="0.01"
    on:input={(e) => updateShapeKey('Width', e.target.value)}
  />

  <label for="edgeSlider">Edge:</label>
  <input
    id="edgeSlider"
    type="range"
    min="0"
    max="1"
    step="0.01"
    on:input={(e) => updateShapeKey('Edge', e.target.value)}
  />
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