import * as THREE from 'three';

export class Wave {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510); // Deep dark blue/black
    this.scene.fog = new THREE.FogExp2(0x050510, 0.02); // Add fog for depth

    // Camera setup for a dynamic angle
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 20, 35);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    window.addEventListener('resize', this.onResize.bind(this));

    this.initGrid();
    this.addLights();
  }

  initGrid() {
    this.gridSize = 25; // Create a 51x51 grid (2601 cubes)
    this.spread = 1.2; 
    this.cubes = [];
    
    // Geometry
    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9); // Slightly smaller than spread
    
    // Material - Using Physical for better light interaction
    this.material = new THREE.MeshPhysicalMaterial({
        color: 0x22aaff,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
    });

    // Use InstancedMesh for performance if we scaled up, but keeping individual meshes for
    // simple per-object color manipulating if we wanted to get fancy later. 
    // Actually, for 2500 meshes, let's just stick to individual to keep code simple 
    // and readable for the user, as InstancedMesh matrix updates can be tricky to read.
    // However, I will optimize by reusing the geometry and material.

    const group = new THREE.Group();
    this.scene.add(group);
    this.group = group;

    for (let x = -this.gridSize; x <= this.gridSize; x++) {
      for (let z = -this.gridSize; z <= this.gridSize; z++) {
        const mesh = new THREE.Mesh(geometry, this.material);
        mesh.position.set(x * this.spread, 0, z * this.spread);
        
        mesh.userData = {
          x: x * this.spread,
          z: z * this.spread,
          distance: Math.sqrt((x * this.spread) ** 2 + (z * this.spread) ** 2),
          offset: Math.random() * Math.PI // Random offset for some glimmer
        };
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        group.add(mesh);
        this.cubes.push(mesh);
      }
    }
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
    this.scene.add(ambientLight);

    // Main Directional Light (Sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Point lights for color splashes
    this.pointLight1 = new THREE.PointLight(0xff0088, 5, 50);
    this.pointLight1.position.set(-10, 10, -10);
    this.scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(0x0088ff, 5, 50);
    this.pointLight2.position.set(10, 10, 10);
    this.scene.add(this.pointLight2);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(time, amplitude = 1, frequency = 0.5, colorShift = 0) {
    // Move lights for dynamic shadows
    this.pointLight1.position.x = Math.sin(time * 0.5) * 20;
    this.pointLight1.position.z = Math.cos(time * 0.5) * 20;
    
    // Update material color based on shift
    // Slowly cycle the base hue
    const hue = (time * 0.02 + colorShift) % 1; 
    this.material.color.setHSL(hue, 0.6, 0.5);

    this.cubes.forEach(cube => {
      const { distance, x, z } = cube.userData;
      
      // Calculate wave height
      // Combining two sine waves for more interesting motion
      const y = amplitude * Math.sin(distance * frequency - time * 2) 
              + (amplitude * 0.5) * Math.sin(x * 0.2 + time);
      
      cube.position.y = y;
      
      // Dynamic rotation
      cube.rotation.x = y * 0.2;
      cube.rotation.z = y * 0.1;
      
      // Scaling effect on beat
      const scale = 1 + Math.max(0, y * 0.3);
      cube.scale.setScalar(scale);
    });

    // Slowly rotate the entire group
    this.group.rotation.y = time * 0.05;

    this.renderer.render(this.scene, this.camera);
  }
}
