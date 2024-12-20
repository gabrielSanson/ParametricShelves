<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';



  let total_width = 1
  let vertical_separators = 1.0
  let height_per_row = 1.0
  let depth_per_row= 1.0

  let base_panel 
  let back_panel 
  let front_panel
  let start_separator 
  let end_separator

  let scene, camera, renderer, model;
  function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}

function init() {
  setupScene()
    
  base_panel = loadModel('base_panel.gltf',"base_panel01");
  back_panel = loadModel('back_panel.gltf',"back_panel01")
  front_panel = loadModel('front_panel.gltf',"front_panel01")
  start_separator = loadModel('sepparator.gltf',"start_separator")
  end_separator = loadModel('sepparator.gltf',"end_separator")
  console.log(end_separator)
  end_separator.position.x+=1
  // separator = loadModel()
  // generateRow()
} 

function loadModel(path,name) { 
  const loader = new GLTFLoader();
  loader.load(path, (gltf) => {
    model = gltf.scene;
    model.name = name;
    model.position.set(0, 0, 0);
    model.scale.set(100, 100, 100);
    

    model.traverse((child) => {
      if (child.isMesh) {
        child.material.side = THREE.DoubleSide;
        child.material.color.set(0x00ff00);

        if (child.morphTargetDictionary) {
          Object.keys(child.morphTargetDictionary).forEach((key) => {
            console.log(`Shape Key: ${key}`);
          });
        }
      }
      updateShapeKey(model,"Width")
      scene.add(model)  
      
    });
  })
  return model
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

const updateShapeKey = (_model,name) => {
  if (_model) {
    _model.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary[name] !== undefined) {
        const index = child.morphTargetDictionary[name];
        let morphValue
        // Handle shape key updates
        switch (name) {
          case "Width":
            console.log(name)
            morphValue = mapRange(total_width/vertical_separators, 0.1, 2, 0, 1);
            child.morphTargetInfluences[index] = morphValue;
            break;

          case "Depth":
          console.log(name)
            morphValue = mapRange(total_width/vertical_separators, 0.1, 2, 0, 1);
            child.morphTargetInfluences[index] = morphValue;
            break;

          case "Height":
            console.log(name)
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

<div class="parametric-menu" >
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
</style>