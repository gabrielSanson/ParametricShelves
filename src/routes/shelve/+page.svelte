<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
    import { base } from '$app/paths';



  let total_width = 1.0
  let vertical_separators = 4.0
  let height_per_row = [10,20,30]
  let depth_per_row= [30,20,10]
  let rows = 3
  let columns = 2

  

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
  await setupScene();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const boxGroup = await generateBox(y, x); // Pass row and column to generateBox
    }
  }
}


async function generateBox(row,column) {
  // Create the group at the beginning
  const boxGroup = new THREE.Group();
  console.log("column")
  // Load models
  const base_panel = await loadModel('base.gltf', "base_panel01");
  const back_panel = await loadModel('back_panel.gltf', "back_panel01");
  const front_panel = await loadModel('front_panel.gltf', "front_panel01");
  // if (column == 0){
  let start_separator 

  const end_separator = await loadModel('separator.gltf', "end_separator");
  if (column == 0){
    start_separator = await loadModel('separator.gltf', "start_separator");
  }
  // Adjust positions and scales
  const totalWidthScaled = total_width * 100 - 0.4;
  end_separator.position.x += total_width*100/vertical_separators - 0.0;

  base_panel.scale.x *= total_width*100/vertical_separators - 0.2;
  back_panel.scale.x *= total_width*100/vertical_separators - 0.2;
  back_panel.scale.y = height_per_row[row]*10
  ///Depth
  if (start_separator){
    start_separator.scale.z =  depth_per_row[row]*10
    start_separator.scale.y = height_per_row[row]*10
  }
  end_separator.scale.z =  depth_per_row[row]*10
  end_separator.scale.y = height_per_row[row]*10

  base_panel.scale.z = depth_per_row[row]*10
  //// WHYYYYY ? >,< !!!
  front_panel.position.z = depth_per_row[row]
  front_panel.scale.y = height_per_row[row]*10
  front_panel.scale.x *= total_width*100/vertical_separators - 0.2;
  //front_panel.position.z += 10;

  boxGroup.add(base_panel, back_panel, front_panel, start_separator, end_separator);

  console.log(column)
  let column_width = total_width*100/vertical_separators
  let row_height = 10.0*100
  
  boxGroup.position.x = column_width*column
  boxGroup.position.y = 10*row
  scene.add(boxGroup);



  console.log('Box group created:', boxGroup);
  return boxGroup;
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

            // if (child.morphTargetDictionary) {
            //   Object.keys(child.morphTargetDictionary).forEach((key) => {
            //     // Do something with the shape keys if needed
            //   });
            // }
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
      // scene.background = texture;
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

// const updateShapeKey = (model, name) => {
//   if (model) {
//     model.traverse((child) => {
//       if (child.isMesh && child.morphTargetDictionary && child.morphTargetDictionary[name] !== undefined) {
//         const index = child.morphTargetDictionary[name];
//         let morphValue;

//         // Log to confirm morph target exists
//         console.log(`Morph target "${name}" found at index ${index}`);
        
//         // Handle shape key updates based on the name
//         switch (name) {
//           case "Width":
//             console.log("Updating Width shape key");
//             morphValue = mapRange(total_width / vertical_separators, 0.1, 2, 0, 1);
//             child.morphTargetInfluences[index] = morphValue;
//             break;

//           case "Depth":
//             console.log("Updating Depth shape key");
//             morphValue = mapRange(total_width / vertical_separators, 0.1, 2, 0, 1);
//             child.morphTargetInfluences[index] = morphValue;
//             break;

//           case "Height":
//             console.log("Updating Height shape key");
//             // Placeholder for "Height" logic, modify as needed
//             break;

//           default:
//             console.warn(`Unsupported shape key: ${name}`);
//         }
//       }
//     });
//   } else {
//     console.warn("Model not found or doesn't have morph targets.");
//   }
// };


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

<div class="parametric_menu" >

  <div class="setting">
    <label> Width ( m ) </label>
    <input type="number" >
  </div>


  <div class="setting">
    <label> Depth/row</label>
    <input type="text" >
  </div>
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
  .parametric_menu {
    background-color: white;
    width: 512px;
    height: 512px;
    position: absolute;
    bottom: 0;
    left: 0;
  }
  .option{
    display: flex;
    flex-direction: row;
  }
</style>