<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
    import { base } from '$app/paths';



  let total_width = 1
  let vertical_separators = 1
  let height_per_row = 1.0
  let depth_per_row= 1.0


  

  let base_panel 
  let back_panel 
  let front_panel
  let start_separator 
  let end_separator
  let separators = []
  let scene, camera, renderer, model;
  function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);  
}

  let row = {
    "base" : base_panel,
    "back" : back_panel,
    "front" : front_panel,
    "start_separator" : start_separator,
    "end_separator" : end_separator,
  }


async function init() {
  await setupScene()
  base_panel = await loadModel('base_panel.gltf',"base_panel01");
  back_panel = await loadModel('back_panel.gltf',"back_panel01")
  front_panel = await loadModel('front_panel.gltf',"front_panel01")
  start_separator = await loadModel('sepparator.gltf',"start_separator")
  end_separator = await loadModel('sepparator.gltf',"end_separator")
  end_separator.position.x+=9.8
  base_panel.scale.x*=5
  row = {
    "base" : base_panel,
    "back" : back_panel,
    "front" : front_panel,
    "start_separator" : start_separator,
    "end_separator" : end_separator,
  }


}


async function loadModel(path, name) {
  const loader = new GLTFLoader();

  // Wrap the loader in a Promise
  const model = await new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.name = name;
        model.position.set(0, 0, 0);
        model.scale.set(100, 100, 100);

        model.traverse((child) => {
          if (child.isMesh) {
            child.material.side = THREE.DoubleSide;
            child.material.color.set(0x00ff00);

            if (child.morphTargetDictionary) {
              Object.keys(child.morphTargetDictionary).forEach((key) => {
                // Do something with the shape keys if needed
              });
            }
          }
        });

        // Add the model to the scene
        scene.add(model);

        console.log("Model loaded and added to the scene");
        resolve(model); // Resolve the Promise with the loaded model
      },
      undefined, // onProgress (optional)
      (error) => {
        console.error("An error occurred while loading the model:", error);
        reject(error); // Reject the Promise with the error
      }
    );
  });

  console.log("Model is:", model);
  return model;
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

const updateShapeKey = (model, name) => {
  if (model) {
    model.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetDictionary[name] !== undefined) {
        const index = child.morphTargetDictionary[name];
        let morphValue;

        // Log to confirm morph target exists
        console.log(`Morph target "${name}" found at index ${index}`);
        
        // Handle shape key updates based on the name
        switch (name) {
          case "Width":
            console.log("Updating Width shape key");
            morphValue = mapRange(total_width / vertical_separators, 0.1, 2, 0, 1);
            child.morphTargetInfluences[index] = morphValue;
            break;

          case "Depth":
            console.log("Updating Depth shape key");
            morphValue = mapRange(total_width / vertical_separators, 0.1, 2, 0, 1);
            child.morphTargetInfluences[index] = morphValue;
            break;

          case "Height":
            console.log("Updating Height shape key");
            // Placeholder for "Height" logic, modify as needed
            break;

          default:
            console.warn(`Unsupported shape key: ${name}`);
        }
      }
    });
  } else {
    console.warn("Model not found or doesn't have morph targets.");
  }
};


onMount(async () => {
  try {
    await init();
    animate();
  } catch (err) {
    const error = err.message;
  }


  for (_model of separators){
    updateShapeKey(_model,"Width")
    print("updating")
  }
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