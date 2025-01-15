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
  let depthPerRow = $page.url.searchParams.get("depthPerRow") || "100,70,40,30"
  let heightsPerRow = $page.url.searchParams.get("heightsPerRow") || "60,50,40,30,20"
  let doubleSided =  $page.url.searchParams.get("doubleSided") || false
  let isCurved =  $page.url.searchParams.get("isCurved") || true
  let frontPanelHeight=$page.url.searchParams.get("frontPanelHeight") || "10"
  let hasFront =  $page.url.searchParams.get("hasFront") || true
  let curveParam =  $page.url.searchParams.get("curveParam") || "5"

  let glassThickness =  $page.url.searchParams.get("glassThickness") || 0.25
  let gap =  $page.url.searchParams.get("gap") || 0.5

  let options = [
    { label: "Fundo Branco", value: "" },
    { label: "Fundo #1", value: "environment5.hdr" },
    { label: "Fundo #2", value: "environment.hdr" }
  ];

  let selectedOption = options[0].value; // Default selected value

  let dividers = [];
  let circles = [];
  let markerIndex = 1;
  let showCircles = true;
  // let isCurved = true;


  const xsharedMaterial = new THREE.MeshPhysicalMaterial({
        metalness: 0.1,
        roughness: 0.75,
        envMapIntensity: 0.1,
        clearcoat: 0.5,
        transparent: true,
        transmission: 0,
        opacity: 0.5,
        reflectivity: 1,
  });

  /*
  const sharedMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xeeffee, // Green base color
    roughness: 0,    // Smooth surface for a glass-like appearance
    metalness: 0,    // Non-metallic material
    transmission: 0.9, // Fully transparent
    opacity: 0.8,      // Ensures full transparency when combined with transmission
    ior: 1.5,        // Index of refraction (glass-like)
    thickness: 1,    // Simulates the thickness of the glass
    clearcoat: 0.5,    // Adds a reflective layer on top
    clearcoatRoughness: 0.5, // Smooth clearcoat layer
  });
  */

  const sharedMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88c0d0,
      metalness: 0.2,
      roughness: 0.1,
      opacity: 0.3,
      ior: 1.5,
      transmission: 0.9,
      transparent: true,
      reflectivity: 0.9
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


async function init(isInitial) {
  await setupScene(isInitial)
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

 function setupScene(isInitial) {
    // Create the scene
    scene = new THREE.Scene();

    // // Load the HDRI environment texture
    if ((selectedOption!=="")) {
      const hdriLoader = new RGBELoader();
      hdriLoader.load(`${selectedOption}`, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = texture;
      });
    } else {
      const cubeTextureLoader = new THREE.CubeTextureLoader();
      const environmentMap = cubeTextureLoader.load([
        'https://threejs.org/examples/textures/cube/skybox/px.jpg', // Positive X
        'https://threejs.org/examples/textures/cube/skybox/nx.jpg', // Negative X
        'https://threejs.org/examples/textures/cube/skybox/py.jpg', // Positive Y
        'https://threejs.org/examples/textures/cube/skybox/ny.jpg', // Negative Y
        'https://threejs.org/examples/textures/cube/skybox/pz.jpg', // Positive Z
        'https://threejs.org/examples/textures/cube/skybox/nz.jpg', // Negative Z
      ]);
      scene.environment = environmentMap;
      scene.background = new THREE.Color(0xffffff);
    } 
    // else {
    //   const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    //   const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White material
    //   const backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    //   backgroundPlane.position.z = 500; // Position it behind the glass object
    //   // scene.add(backgroundPlane);
    //   scene.background = new THREE.Color(0xffffff);
    // }
    // Set up the camera
    if (isInitial) {
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(-50, 2, 520);
      // camera.lookAt(200, 180, 0);
    }

    // Set up the renderer
    // renderer = new THREE.WebGLRenderer({ antialias: true });
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10).normalize();
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    controls.target.set(0, 0, 0); // Set the target the camera will orbit around
    controls.update(); // Apply the changes

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
  console.log(`curveParam ${curveParam}`)
  if (isCurved) {
      shape.bezierCurveTo(
      widthTop, (height - frontHeight) / curveParam, // Control point 1 (upward from the bottom-right corner)
      widthTop, height - (height - frontHeight) / curveParam,        // Control point 2 (downward from the top-right corner)
      widthTop, height                                      // End point (top-right corner)
    );
  } else {
    shape.lineTo(widthTop, height); // Top-left corner
  }
  
  shape.lineTo(0, height); // Top-left corner
  shape.lineTo(0, 0); // Close the shape

  // Create a geometry from the shape
  const geometry = new THREE.ShapeGeometry(shape);

  // Create a mesh
  
  // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
  
  const mesh = new THREE.Mesh(geometry, sharedMaterial);

  const extrudeSettings = { depth: glassThickness, bevelEnabled: false };
  const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const extrudeMesh = new THREE.Mesh(extrudeGeometry, sharedMaterial);
  // Rotate the shape along the Y-axis
  extrudeMesh.rotation.y = -Math.PI / 2; // 90 degrees in radians
  // scene.add(extrudeMesh);
  return extrudeMesh
  // return mesh
}

const rectangle = (x, y, z) => {
  // Create a shape
  const shape = new THREE.Shape();
  // const widthBottom = 10; // Bottom edge length
  // const widthTop = top; // Top edge length
  // const frontHeight = 3; // front panel height
  // const height = 10; // Height of the trapezoid
  // const arcRadius = 1.5; // Radius of the curved edge

  // Define the vertices and use an arc for the angled edge
  shape.moveTo(0, 0); // Bottom-left corner
  shape.lineTo(x, 0); // Bottom-right corner
  shape.lineTo(x, y); // face panel top
  shape.lineTo(0, y); // Top-left corner
  shape.lineTo(0, 0); // Close the shape

  // Create a geometry from the shape
  const geometry = new THREE.ShapeGeometry(shape);

  // Create a mesh
  // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, sharedMaterial);

  const extrudeSettings = { depth: z, bevelEnabled: false };
  const extrudeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const extrudeMesh = new THREE.Mesh(extrudeGeometry, sharedMaterial);
  // Rotate the shape along the Y-axis
  // extrudeMesh.rotation.y = -Math.PI / 2; // 90 degrees in radians
  // scene.add(extrudeMesh);
  return extrudeMesh
  // return mesh
}

const getColor = () => {
  return (Math.random() * 0x770000)
}

function boxGroup2(columnWidth, dividerHeight, rowDepth, rowTopDepth, frontPanelHeight, backPanel, topPanel, closingSeparator) {
  const group = new THREE.Group();
  // const fact=1;
  const useColors = false

  console.log(`columnWidth: ${columnWidth} `)
  console.log(`dividerHeight: ${dividerHeight} `)
  console.log(`rowDepth: ${rowDepth} `)

  const basep=rectangle(1,1,glassThickness)
  // let basep=base_panel.clone()
  basep.scale.set(columnWidth, rowDepth, 1)
  basep.rotation.x = -Math.PI / 2;

  if (useColors) basep.material.color.set(getColor());
  group.add(basep);

  if (hasFront) {
    let frontp=rectangle(1,1,glassThickness)
  
    frontp.scale.set(columnWidth, frontPanelHeight, 1)
    frontp.position.set(0, 0, -rowDepth);
    if (useColors) frontp.material.color.set(getColor());
    // frontp.rotation.x = -Math.PI / 2;
    // frontp.scale.set(columnWidth, dividerHeight, rowDepth)
    group.add(frontp);
  }


  if (backPanel) {
    let backp=rectangle(1,1,glassThickness)
    backp.scale.set(columnWidth, dividerHeight, 1)
    if (useColors) backp.material.color.set(getColor());
    group.add(backp);
  }

  if (topPanel) {
    let topp=rectangle(1,1,glassThickness)
    topp.scale.set(columnWidth, rowTopDepth, 1)
    topp.position.set(0, dividerHeight, 0);
    if (useColors) topp.material.color.set(getColor());
    topp.rotation.x = -Math.PI / 2;
    group.add(topp);
  }
  

  const arcSeparator=arc(-rowDepth,-rowTopDepth,dividerHeight,frontPanelHeight)
  if (useColors) arcSeparator.material.color.set(getColor());
  group.add(arcSeparator);
  if (closingSeparator) {
    const endSeparator=arcSeparator.clone()
    endSeparator.position.set(columnWidth, 0, 0);
    if (useColors) endSeparator.material.color.set(getColor());
    group.add(endSeparator);
  }
  return group
}

function generateShelfStructure(vBars, hBars, dBars, heights, depths, frontPanelHeight, doubleSided) {
      clearStructure();
      markerIndex = 1;

      const shelfWidth = totalWidth;  // Use the total width here
      const tolerance = 0.001;
      const verticalCenterOffset = 0 //heights.reduce((a, b) => a + b, 0) / 2;

      // Calculate column width
      const columnWidth = (shelfWidth - (glassThickness * (vBars + 1))) / vBars;

      // Create vertical dividers
      let rowTopDepth
      const groupOpposite = new THREE.Group();
      for (let i = 0; i < vBars; i++) {
          // console.log(`column ${i}`)
          let currentHeightOffset = 0;
          
          for (let row = 0; row < hBars; row++) {
              const dividerHeight = heights[row];
              // console.log(`row ${row}`)
              //Factors
              const rowFactor=1;
              const rowDepth = (depths[row] || depths[depths.length - 1]) * rowFactor;
              rowTopDepth=(depths[row+1] || (depths[row]))
              // console.log(`rowDepth ${rowDepth} / rowTopDepth ${rowTopDepth}`)
              const geometry = new THREE.BoxGeometry(
                  glassThickness,
                  dividerHeight,
                  rowDepth
              );
              geometry.receiveShadow = true;
              geometry.castShadow = true;
              const verticalDivider = new THREE.Mesh(geometry, sharedMaterial);

              verticalDivider.position.set(
                  i * (columnWidth) - (shelfWidth / 2),
                  currentHeightOffset - verticalCenterOffset + dividerHeight / 2,
                  -rowDepth / 2
              );

              // scene.add(verticalDivider);
              const isFirstColumn = (i == (vBars-1))
              const isTopShelf = (row == (hBars-1))
              // let box=boxGroup(true, isFirstColumn).clone()

              // console.log(`isFirstColumn: ${isFirstColumn}`)
              let box=boxGroup2(columnWidth, dividerHeight, rowDepth, (rowTopDepth || (rowDepth/2)), frontPanelHeight, true, isTopShelf, isFirstColumn).clone()

              //let bp=base_panel.clone();
              // const boxX=i * (columnWidth + glassThickness) - (shelfWidth / 1)
              // console.log(columnWidth)
              // console.log(shelfWidth)
              const boxX=(i * (columnWidth) - (shelfWidth / 2)) //+ (i*gap)
              const boxY=currentHeightOffset + (i*gap)
              // console.log(`currentHeightOffset=${currentHeightOffset}`)
              // console.log(`dividerHeight=${dividerHeight}`)
              // const factor = 1/10
              box.position.set(
                  boxX,
                  currentHeightOffset / 1,
                  0
              );
              // base_panel.scale.set(columnWidth*factor, dividerHeight*factor, -rowDepth*factor);
              // back_panel.scale.set(columnWidth*factor, dividerHeight*factor, -rowDepth*factor);
              // front_panel.scale.set(columnWidth*factor, dividerHeight*factor, -rowDepth*factor);
              

              // box.scale.set(columnWidth*factor, dividerHeight*factor, -rowDepth*factor);
          
              
              if (doubleSided) {
                let boxOpposite=boxGroup2(columnWidth, dividerHeight, rowDepth, (rowTopDepth || (rowDepth/2)), frontPanelHeight, false, isTopShelf, isFirstColumn).clone()
                boxOpposite.position.set(
                    boxX,
                    currentHeightOffset / 1,
                    0
                );
                // boxOpposite.rotation.y = -Math.PI / 4;
                // boxOpposite.scale.set(columnWidth*factor, dividerHeight*factor, rowDepth*factor);
                groupOpposite.add(boxOpposite)
                
              }
              currentHeightOffset += dividerHeight + gap;
              scene.add(box);
          }
          if (doubleSided) {
            groupOpposite.rotation.y = -Math.PI;
            groupOpposite.position.set(
                    0,
                    0,
                    gap
                );
            scene.add(groupOpposite)
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
  if (!scene) return

  for (let i = scene.children.length - 1; i >= 0; i--) {
      const child = scene.children[i];

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        } else {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
      
      // Dispose of meshes and their resources
      // if (child.isMesh) {
      //     if (child.geometry) child.geometry.dispose();
      //     if (child.material) {
      //         if (Array.isArray(child.material)) {
      //             child.material.forEach(mat => mat.dispose());
      //         } else {
      //             child.material.dispose();
      //         }
      //     }
      // }


      
      // Remove the object from the scene
      scene.remove(child);
  }
    
}

async function onGenerateStructure() {
  try {
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      console.log("clear container")
      canvasContainer.innerHTML = ''; // Removes all child elements
    }
    const initial=false
    await init(initial);
    animate();
   
  } catch (err) {
    const error = err.message;
  }

  const vBars = parseInt(document.getElementById('verticalBars').value);
  const hBars = parseInt(document.getElementById('horizontalBars').value);
  const dBars = parseInt(document.getElementById('depthBars').value);
  const heights = document.getElementById('heightsPerRow').value.split(',').map(Number);
  const depths = document.getElementById('depthPerRow').value.split(',').map(Number);
  showCircles = document.getElementById('showCircles').checked;
  const doubleSided = document.getElementById('doubleSided').checked; // Get the value of the double sided checkbox
  totalWidth = parseFloat(document.getElementById('totalWidth').value);  // Get the total width value

  generateShelfStructure(vBars, hBars, dBars, heights, depths, frontPanelHeight, doubleSided);
}


onMount(async () => {
  try {
    const initial=true
    await init(initial);
    animate();
  } catch (err) {
    const error = err.message;
  }


  // for (_model of separators){
  //   updateShapeKey(_model,"Width")
  //   print("updating")
  // }
});

</script>

<div id="canvas-container"></div>

<div class="parametric-menu" >
</div>

<div class="parametric-settings" >



  <h3 style="height: 48px; width: 100%;text-align:start;display:flex; justify-content:start;align-items:center">Estante de Vidro : </h3>
  
  <div style="margin-bottom: 10px" >
    <select bind:value={selectedOption}>
      {#each options as { label, value }}
        <option value={value}>{label}</option>
      {/each}
    </select>
  </div>

  <div class="option" >
    <label for="totalWidth">Largura Total (cm)</label>
    <input class="text-input-sm" type="number" id="totalWidth" bind:value={totalWidth} step="10">
  </div>
  
  <div class="option">
    <label for="horizontalBars">Linhas</label>
    <input class="text-input-sm"  type="number" id="horizontalBars" bind:value={horizontalBars} min="1">
  </div>
  <div class="option">
    <label for="verticalBars">Colunas</label>
    <input class="text-input-sm"  type="number" id="verticalBars" bind:value={verticalBars} min="1">
  </div>
  <div class="option" style="display:none;">
    <label for="depthBars">Profundidade</label>
    <input class="text-input"  type="number" id="depthBars" value=1 min="1">
  </div>
    <div class="option">
      <label  for="depthPerRow">Profundidade por Linha (cm)</label>
      <input class="text-input"  type="text" id="depthPerRow" bind:value={depthPerRow}>
    </div>
    <div class="option">
      <label for="heightsPerRow">Alturas por Linha (cm)</label>
      <input class="text-input"  type="text" id="heightsPerRow" bind:value={heightsPerRow}>
    </div>
    <div class="option">
      <label for="frontPanelHeight">Aparador frontal ? (cm)</label>
      <input class="form-check-input" type="checkbox" id="hasFront"  bind:checked={hasFront}>
      <input class="text-input-sm"  type="text" id="frontPanelHeight" bind:value={frontPanelHeight}>
    </div>

    <div class="option">
      <label class="form-check-label" for="doubleSided">Curvatura</label>
  
      <input class="form-check-input" type="checkbox" id="isCurved"  bind:checked={isCurved}>
      <input class="text-input-sm"  type="number" id="curveParam" bind:value={curveParam}>
    </div>

  <div class="option">
    <label class="form-check-label" for="gap">Gap</label>

    <input class="text-input-sm"  type="number" id="gap" bind:value={gap}>
  </div>

  <div class="option">
    <label class="form-check-label" for="glassThickness">Espessura Vidro</label>

    <input class="text-input-sm"  type="number" id="glassThickness" bind:value={glassThickness}>
  </div>
 
  <div class="option">
    <label class="form-check-label" for="showCircles">Mostrar Círculos</label>
 
    <input class="form-check-input" disabled="true" type="checkbox" id="showCircles" checked>
  </div>
  
  <div class="option">
    <label class="form-check-label" for="doubleSided">Estrutura Dupla</label>

    <input class="form-check-input input-div" type="checkbox" id="doubleSided"  bind:checked={doubleSided}>
  </div>
  
  
  
  <button class="btn btn-primary" on:click={onGenerateStructure}>Gerar Estrutura</button>
<!-- Add this in your HTML -->
</div>

<style>
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
  body{
    margin: 0;
    padding: 0;
  }
  *{
    font-family: "Helvetica";
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  canvas-container {
    display: block;
    
    background-color: aqua;
  }
  .option{
    display: flex;
    flex-direction: row;
    width: 100%;
    /* background-color: red; */
  }
  label{
    width: 100%;
  }
  input{
    width: 100%;
    height: 24px;
  }
  a{
    visibility:hidden
  }
  .text-input-md {
    width: 70px;
    /* height: 100vh; */
  }

  .text-input-sm {
    width: 50px;
    /* height: 100vh; */
  }


</style>





