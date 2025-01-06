<script>
  import { page } from '$app/stores';
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

  let totalWidth = $page.url.searchParams.get("totalWidth") || "250"

  let horizontalBars = $page.url.searchParams.get("horizontalBars") || "3"
  let verticalBars = $page.url.searchParams.get("verticalBars") || "2"
  // let depthBars = $page.url.searchParams.get("depthBars") || "5"
  let depthPerRow = $page.url.searchParams.get("depthPerRow") || "60,50,40,30,20"
  let heightsPerRow = $page.url.searchParams.get("heightsPerRow") || "60,50,40,30,20"
  let doubleSided =  $page.url.searchParams.get("doubleSided") || false


  let dividers = [];
  let circles = [];
  let markerIndex = 1;
  let showCircles = true;

  const glassThickness = 0.25;  // Glass thickness
  const gap = 4;  // Space between sctructures
  const sharedMaterial = new THREE.MeshPhysicalMaterial({
        metalness: 0.1,
        roughness: 0.75,
        envMapIntensity: 0.1,
        clearcoat: 0.5,
        transparent: true,
        transmission: 0,
        opacity: 0.5,
        reflectivity: 1,
  });

  let base_panel 
  let back_panel 
  let front_panel
  let start_separator 
  let end_separator
  let separators = []
  let scene, camera, renderer, model;
  let isScaled = false


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
  
  const myArc=arc(10,4,10,2)
  base_panel = await loadModel('base.gltf',"base_panel01");
  back_panel = await loadModel('back_panel.gltf',"back_panel01")
  front_panel = await loadModel('front_panel.gltf',"front_panel01")
  start_separator = myArc.clone()
  end_separator = myArc.clone()
  end_separator.position.x+=10
  base_panel.scale.x*=20
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

const arc = (widthBottom, widthTop, height, frontHeight) => {
  // Create a shape
  const shape = new THREE.Shape();
  // const widthBottom = 10; // Bottom edge length
  // const widthTop = top; // Top edge length
  // const frontHeight = 3; // front panel height
  // const height = 10; // Height of the trapezoid
  // const arcRadius = 1.5; // Radius of the curved edge

  // Define the vertices and use an arc for the angled edge
  shape.moveTo(0, 0); // Bottom-left corner
  shape.lineTo(widthBottom, 0); // Bottom-right corner
  shape.lineTo(widthBottom, frontHeight); // face panel top
  // TODO replace next line with a bezier curve 
  // shape.lineTo(widthTop, height); // Top-left corner
  shape.bezierCurveTo(
    widthBottom-5, frontHeight + (height - frontHeight) / 10, // Control point 1 (upward from the bottom-right corner)
    widthTop, height - (height - frontHeight) / 3,        // Control point 2 (downward from the top-right corner)
    widthTop, height                                      // End point (top-right corner)
  );
  shape.lineTo(0, height); // Top-left corner
  shape.lineTo(0, 0); // Close the shape

  // Create a geometry from the shape
  const geometry = new THREE.ShapeGeometry(shape);

  // Create a mesh
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);

  const extrudeSettings = { depth: glassThickness, bevelEnabled: false };
  const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const extrudeMesh = new THREE.Mesh(extrudeGeometry, material);
  // Rotate the shape along the Y-axis
  extrudeMesh.rotation.y = -Math.PI / 2; // 90 degrees in radians
  // scene.add(extrudeMesh);
  return extrudeMesh
  // return mesh
}


function initGeometries(base,back,front,frontHeight,sep) {
  // end_separator.position.x+=9.8
  if (isScaled) return
  isScaled = true
  base_panel.scale.x*=base
  back_panel.scale.x*=back
  front_panel.scale.x*=front
  front_panel.scale.y*=frontHeight
  front_panel.position.z=10
  start_separator.scale.y*=sep
}

function boxGroup(backPanel, closingSeparator) {
  const group = new THREE.Group();
  
  group.add(base_panel);
  group.add(front_panel);
  if (backPanel) {
    group.add(back_panel);
  }
  group.add(start_separator);
  if (closingSeparator) {
    group.add(end_separator);
  }
  return group
}

// function boxGroup2(columnWidth, dividerHeight, rowDepth, backPanel, closingSeparator) {
//   const group = new THREE.Group();
  
//   let basep=base_panel.clone()
//   basep.scale.set(columnWidth, dividerHeight, rowDepth)
//   group.add(basep);

//   let frontp=front_panel.clone()
//   frontp.scale.set(columnWidth, dividerHeight, rowDepth)
//   group.add(frontp);

//   if (backPanel) {
//     const backp=back_panel.clone()
//     backp.scale.set(columnWidth, dividerHeight, rowDepth)
//     group.add(backp);
//   }
//   // group.add(start_separator);
//   // if (closingSeparator) {
//   //   group.add(end_separator);
//   // }
//   return group
// }

function generateShelfStructure(vBars, hBars, dBars, heights, depths, doubleSided) {
      clearStructure();
      initGeometries(0.5,10,10,0.4,1)
      markerIndex = 1;

      const shelfWidth = totalWidth;  // Use the total width here
      const tolerance = 0.001;
      const verticalCenterOffset = 0 //heights.reduce((a, b) => a + b, 0) / 2;

      // Calculate column width
      const columnWidth = (shelfWidth - (glassThickness * (vBars + 1))) / vBars;

      // Create vertical dividers
      for (let i = 0; i < vBars; i++) {
          let currentHeightOffset = 0;

          for (let row = 0; row < hBars; row++) {
              const dividerHeight = heights[row];

              //Factors
              const rowFactor=2;
              const rowDepth = (depths[row] || depths[depths.length - 1]) * rowFactor;

              const geometry = new THREE.BoxGeometry(
                  glassThickness,
                  dividerHeight,
                  rowDepth
              );
              geometry.receiveShadow = true;
              geometry.castShadow = true;
              const verticalDivider = new THREE.Mesh(geometry, sharedMaterial);

              verticalDivider.position.set(
                  i * (columnWidth + glassThickness) - (shelfWidth / 2),
                  currentHeightOffset - verticalCenterOffset + dividerHeight / 2,
                  -rowDepth / 2
              );

              // scene.add(verticalDivider);
              const isFirstColumn = (i == (0))
              let box=boxGroup(true, isFirstColumn).clone()

              // let box=boxGroup2(columnWidth, dividerHeight, rowDepth, true, isFirstColumn).clone()

              
             
              //let bp=base_panel.clone();
              // const boxX=i * (columnWidth + glassThickness) - (shelfWidth / 1)
              console.log(columnWidth)
              console.log(shelfWidth)
              const boxX=i * (columnWidth-shelfWidth) //+ (i*gap)
              const boxY=currentHeightOffset + (i*gap)
              console.log(`currentHeightOffset=${currentHeightOffset}`)
              console.log(`dividerHeight=${dividerHeight}`)
              const factor = 1/10
              box.position.set(
                  boxX,
                  currentHeightOffset / 1,
                  0
              );
              // base_panel.scale.set(columnWidth*factor, dividerHeight*factor, -rowDepth*factor);
              // back_panel.scale.set(columnWidth*factor, dividerHeight*factor, -rowDepth*factor);
              // front_panel.scale.set(columnWidth*factor, dividerHeight*factor, -rowDepth*factor);
              

              box.scale.set(columnWidth*factor, dividerHeight*factor, -rowDepth*factor);
          
              
              if (doubleSided) {
                let boxOpposite=boxGroup(false, isFirstColumn).clone()
                boxOpposite.position.set(
                    boxX,
                    currentHeightOffset / 1,
                    gap
                );
                boxOpposite.scale.set(columnWidth*factor, dividerHeight*factor, rowDepth*factor);
                scene.add(boxOpposite)
                
              }
              currentHeightOffset += dividerHeight + glassThickness + gap;
              scene.add(box);
          }
      }

      // Create horizontal shelves
      let currentHeight = 0;
      for (let i = 0; i <= hBars; i++) {
          currentHeight += i > 0 ? heights[i - 1] + glassThickness : 0;
          const depthForRow = depths[i] || depths[depths.length - 1];

          for (let j = 0; j < dBars; j++) {
              const geometry = new THREE.BoxGeometry(shelfWidth, glassThickness, depthForRow);
              geometry.receiveShadow = true;  
              geometry.castShadow = true;
              const horizontalShelf = new THREE.Mesh(geometry, sharedMaterial);

              horizontalShelf.position.set(
                  0,
                  currentHeight - verticalCenterOffset,
                  -j * (depthForRow + glassThickness + tolerance) - depthForRow / 2
              );

              // scene.add(horizontalShelf);
              // dividers.push(horizontalShelf);

              if (doubleSided) {
                  const mirroredShelf = horizontalShelf.clone();
                  mirroredShelf.position.z = j * (depthForRow + glassThickness + tolerance) + depthForRow / 2; // Mirror on the Z axis
                  // scene.add(mirroredShelf);
                  // dividers.push(mirroredShelf);
              }
          }
      }

      // Draw circles with numbers if needed
      if (showCircles) {
          for (let i = 0; i <= hBars; i++) {
              for (let j = 0; j <= vBars; j++) {
                  // drawCircleWithNumber(j, i, hBars, vBars, heights, glassThickness, shelfWidth);
              }
          }
      }
  }

// Function to draw circles with numbers
function drawCircleWithNumber(xIndex, yIndex, hBars, vBars, heights, glassThickness, shelfWidth) {
    const radius = 0.75;
    const circleGeometry = new THREE.CircleGeometry(radius, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    const yPosition = heights.slice(0, yIndex).reduce((a, b) => a + b + glassThickness, 0) - (heights.reduce((a, b) => a + b, 0) / 2);
    circle.position.set(
        xIndex * (heights[0] + glassThickness),
        yPosition,
        shelfWidth / 2 + 3.5
    );
    scene.add(circle);

    const textGeometry = new THREE.TextGeometry(markerIndex.toString(), {
        font: new THREE.FontLoader().parse(fontJson), // Assuming fontJson is available
        size: 1,
        height: 0.2
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const text = new THREE.Mesh(textGeometry, textMaterial);
    text.position.set(
        circle.position.x - 0.5,
        circle.position.y - 0.25,
        0
    );
    scene.add(text);
    markerIndex++;
}

// Function to clear previous structure
function clearStructure() {
    for (let i = scene.children.length - 1; i >= 0; i--) {
        const child = scene.children[i];
        
        // Dispose of meshes and their resources
        if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        
        // Remove the object from the scene
        scene.remove(child);
    }
}

function onGenerateStructure() {
    const vBars = parseInt(document.getElementById('verticalBars').value);
    const hBars = parseInt(document.getElementById('horizontalBars').value);
    const dBars = parseInt(document.getElementById('depthBars').value);
    const heights = document.getElementById('heightsPerRow').value.split(',').map(Number);
    const depths = document.getElementById('depthPerRow').value.split(',').map(Number);
    showCircles = document.getElementById('showCircles').checked;
    const doubleSided = document.getElementById('doubleSided').checked; // Get the value of the double sided checkbox
    totalWidth = parseFloat(document.getElementById('totalWidth').value);  // Get the total width value

    generateShelfStructure(vBars, hBars, dBars, heights, depths, doubleSided);
}


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

<div class="parametric-settings" >

  <h3 style="height: 48px; width: 100%;text-align:start;display:flex; justify-content:start;align-items:center">Estante de Vidro : </h3>
  <div class="option" >
    <label for="totalWidth">Largura Total (cm)</label>
    <input type="number" id="totalWidth" bind:value={totalWidth} step="10">
  </div>
  
  <div class="option">
    <label for="horizontalBars">Linhas</label>
    <input type="number" id="horizontalBars" bind:value={horizontalBars} min="1">
  </div>
  <div class="option">
    <label for="verticalBars">Colunas</label>
    <input type="number" id="verticalBars" bind:value={verticalBars} min="1">
  </div>
  <div class="option" style="display:none;">
    <label for="depthBars">Profundidade</label>
    <input type="number" id="depthBars" value=1 min="1">
  </div>
    <div class="option">
      <label  for="depthPerRow">Profundidade por Linha (cm)</label>
      <input type="text" id="depthPerRow" bind:value={depthPerRow}>
    </div>
    <div class="option">
      <label for="heightsPerRow">Alturas por Linha (cm)</label>
      <input type="text" id="heightsPerRow" bind:value={heightsPerRow}>
    </div>
 
  <div class="option">
    <label class="form-check-label" for="showCircles">Mostrar Círculos</label>
 
    <input class="form-check-input" disabled="true" type="checkbox" id="showCircles" checked>
  </div>
  
  <div class="option">
    <label class="form-check-label" for="doubleSided">Estrutura Dupla</label>

    <input class="form-check-input" type="checkbox" id="doubleSided"  bind:checked={doubleSided}>
  </div>
  
  
  
  <button class="btn btn-primary" on:click={onGenerateStructure}>Gerar Estrutura</button>
<!-- Add this in your HTML -->
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

  .parametric-settings{
      position: fixed;
      border-color: black;
      background-color: rgb(230,230,230);
      display: flex;
      flex-direction: column;
      bottom: 16px;
      left: 16px;
      padding: 32px;
      width: 300px;
      padding: 0px 16px 16px 16px;
      gap: 6px
    }
</style>