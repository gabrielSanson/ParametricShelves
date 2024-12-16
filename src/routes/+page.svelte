<script>
    import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';  // Import RGBELoader
  

  



  let totalWidth = $page.url.searchParams.get("totalWidth") || "250"

  let horizontalBars = $page.url.searchParams.get("horizontalBars") || "250"
  let verticalBars = $page.url.searchParams.get("verticalBars") || "5"
  // let depthBars = $page.url.searchParams.get("depthBars") || "5"
  let depthPerRow = $page.url.searchParams.get("depthPerRow") || "60,50,40,30,20"
  let heightsPerRow = $page.url.searchParams.get("heightsPerRow") || "60,50,40,30,20"
  let doubleSided =  $page.url.searchParams.get("doubleSided") || "false"
  // horizontalBars
  // verticalBars
  // depthBars
  // depthForRow
  // heightsPerRow



  let scene, camera, renderer;
  let dividers = [];
  let circles = [];
  let markerIndex = 1;
  let showCircles = true;

  const glassThickness = 0.25;  // Glass thickness
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

  // Function to initialize the scener
  function init() {
      // Scene
      scene = new THREE.Scene();

      // Load the HDRI texture
      const hdriLoader = new RGBELoader();
      hdriLoader.load("/environment5.hdr", function (texture) {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = texture;  // Set the environment map
          // scene.background = texture
          scene.background = new THREE.Color(0xffffff);
      });

      // Camera
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.fov = 90;
      camera.updateProjectionMatrix();
      camera.position.set(-50, 10, 120);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 0.2;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      renderer.setSize(window.innerWidth, window.innerHeight);
      document.getElementById('canvas-container').appendChild(renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(10, 10, 10).normalize();
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // Orbit controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.update();
  }

  // Function to generate the shelf structure
  function generateShelfStructure(vBars, hBars, dBars, heights, depths, doubleSided) {
      clearStructure();
      markerIndex = 1;

      const shelfWidth = totalWidth;  // Use the total width here
      const tolerance = 0.001;
      const verticalCenterOffset = heights.reduce((a, b) => a + b, 0) / 2;

      // Calculate column width
      const columnWidth = (shelfWidth - (glassThickness * (vBars + 1))) / vBars;

      // Create vertical dividers
      for (let i = 0; i <= vBars; i++) {
          let currentHeightOffset = 0;

          for (let row = 0; row < hBars; row++) {
              const dividerHeight = heights[row];
              const rowDepth = depths[row] || depths[depths.length - 1];

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

              scene.add(verticalDivider);
              dividers.push(verticalDivider);

              if (doubleSided) {
                  const mirroredDivider = verticalDivider.clone();
                  mirroredDivider.position.z = rowDepth / 2;  // Mirror on the Z axis
                  scene.add(mirroredDivider);
                  dividers.push(mirroredDivider);
              }

              currentHeightOffset += dividerHeight + glassThickness;
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

              scene.add(horizontalShelf);
              dividers.push(horizontalShelf);

              if (doubleSided) {
                  const mirroredShelf = horizontalShelf.clone();
                  mirroredShelf.position.z = j * (depthForRow + glassThickness + tolerance) + depthForRow / 2; // Mirror on the Z axis
                  scene.add(mirroredShelf);
                  dividers.push(mirroredShelf);
              }
          }
      }

      // Draw circles with numbers if needed
      if (showCircles) {
          for (let i = 0; i <= hBars; i++) {
              for (let j = 0; j <= vBars; j++) {
                  drawCircleWithNumber(j, i, hBars, vBars, heights, glassThickness, shelfWidth);
              }
          }
      }
  }

  // Function to draw circles with numbers
  function drawCircleWithNumber(xIndex, yIndex, hBars, vBars, heights, glassThickness, shelfWidth) {
      const radius = 0.75;
      const circleGeometry = new THREE.CircleGeometry(radius, 32);
      const circleMaterial = new THREE.MeshBasicMaterial({ color: getRandomColor() });
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
      for (let i = 0; i < dividers.length; i++) {
          scene.remove(dividers[i]);
      }
      for (let i = 0; i < circles.length; i++) {
          scene.remove(circles[i]);
      }
      dividers = [];
      circles = [];
  }

  // Set up animation loop
  function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
  }

  // Function to handle button click event
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

  onMount(() => {
      init();
      animate();
  });
</script>


  
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
  </style>
  


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

<div id="canvas-container"></div>

