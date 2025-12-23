import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

interface SceneProps {
  isTreeMode: boolean;
  onSceneClick: () => void;
}

// Particle Class to manage individual element animations
class Particle {
  mesh: THREE.Mesh;
  posTree: THREE.Vector3;
  posScatter: THREE.Vector3;
  initialScale: number;
  rotationSpeed: THREE.Vector3;
  phase: number;
  type: 'leaf' | 'ornament' | 'light' | 'star' | 'snow' | 'trunk';
  baseColor: THREE.Color;

  constructor(
    mesh: THREE.Mesh, 
    treePos: THREE.Vector3, 
    scatterPos: THREE.Vector3, 
    type: 'leaf' | 'ornament' | 'light' | 'star' | 'snow' | 'trunk'
  ) {
    this.mesh = mesh;
    this.posTree = treePos;
    this.posScatter = scatterPos;
    this.initialScale = mesh.scale.x;
    this.type = type;
    this.rotationSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    );
    this.phase = Math.random() * Math.PI * 2;
    // Store original material color
    const material = mesh.material as THREE.MeshStandardMaterial;
    this.baseColor = material.color ? material.color.clone() : new THREE.Color(1,1,1);
  }

  update(dt: number, isTreeMode: boolean, time: number) {
    // 1. Position Interpolation
    const target = isTreeMode ? this.posTree : this.posScatter;
    
    // Different speeds for different elements to create depth during transition
    let speed = 2.0;
    if (this.type === 'ornament') speed = 1.8;
    if (this.type === 'leaf') speed = 2.2;
    if (!isTreeMode) speed = 1.5; // Slower explosion

    this.mesh.position.lerp(target, dt * speed);

    // 2. Rotation
    this.mesh.rotation.x += this.rotationSpeed.x;
    this.mesh.rotation.y += this.rotationSpeed.y;
    this.mesh.rotation.z += this.rotationSpeed.z;

    // 3. Special Effects based on Type
    
    // Lights blinking
    if (this.type === 'light') {
      const material = this.mesh.material as THREE.MeshStandardMaterial;
      const blink = Math.sin(time * 3 + this.phase) * 0.5 + 0.5;
      material.emissiveIntensity = 0.5 + blink * 1.5; 
      // Scale pulse
      const scale = this.initialScale * (0.8 + blink * 0.4);
      this.mesh.scale.setScalar(scale);
    } 
    // Star pulsing
    else if (this.type === 'star') {
      const material = this.mesh.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(time * 2) * 0.2 + 1.0;
      this.mesh.scale.setScalar(this.initialScale * pulse);
      material.emissiveIntensity = 1.0 + Math.sin(time * 4) * 0.5;
    }
    // Snow falling logic (only active in tree mode usually, or always falling?)
    // Let's make snow always fall but respect "Scatter" position if we want them to explode too.
    // For now, let snow be part of the explosion.
    else if (this.type === 'snow') {
        // Snow twinkles slightly
        this.mesh.rotation.y += 0.01;
        this.mesh.rotation.z += 0.005;
    }
  }
}

const Scene: React.FC<SceneProps> = ({ isTreeMode, onSceneClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const modeRef = useRef(isTreeMode);
  const composerRef = useRef<EffectComposer | null>(null);

  // Sync prop to ref for animation loop
  useEffect(() => {
    modeRef.current = isTreeMode;
  }, [isTreeMode]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- 1. SETUP ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020202); // Deep black
    scene.fog = new THREE.FogExp2(0x020202, 0.02);

    // Camera setup - Centered
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Move camera back to see the whole tree centered
    camera.position.set(0, 5, 50); // Moved camera slightly up to look down at the tree
    camera.lookAt(0, -5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // ACESFilmic for nice contrast handling
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3; 
    containerRef.current.appendChild(renderer.domElement);

    // --- 2. POST PROCESSING ---
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, 0.4, 0.85
    );
    bloomPass.threshold = 0.3; // Higher threshold so only bright lights glow
    bloomPass.strength = 1.2; 
    bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composerRef.current = composer;
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // --- 3. LIGHTING ---
    // General ambient - brighten up the shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
    scene.add(ambientLight);

    // Main Warm light from front
    const frontLight = new THREE.PointLight(0xffaa55, 3, 70);
    frontLight.position.set(0, 15, 30);
    scene.add(frontLight);

    // Stronger Green Fill Light to emphasize foliage
    const fillLight = new THREE.PointLight(0x66ff88, 3.0, 60);
    fillLight.position.set(20, 10, 20);
    scene.add(fillLight);
    
    // Secondary Fill from other side
    const fillLight2 = new THREE.PointLight(0xffeeaa, 2.0, 60);
    fillLight2.position.set(-20, 10, 10);
    scene.add(fillLight2);

    // Blue rim light for contrast and depth
    const rimLight = new THREE.SpotLight(0x8899ff, 50);
    rimLight.position.set(0, 40, -30);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    // --- 4. OBJECT GENERATION ---
    const mainGroup = new THREE.Group();
    groupRef.current = mainGroup;
    scene.add(mainGroup);

    const particles: Particle[] = [];

    // Shared Geometries & Materials
    // Smaller geometries for more detail
    const geoLeaf = new THREE.TetrahedronGeometry(1, 0); 
    const geoSphere = new THREE.SphereGeometry(1, 16, 16);
    const geoBox = new THREE.BoxGeometry(1, 1, 1);
    const geoStar = new THREE.OctahedronGeometry(1, 0);

    // MATERIALS - VARIED GREENS
    const matLeafDark = new THREE.MeshStandardMaterial({ 
        color: 0x1a472a, roughness: 0.8, metalness: 0.1 
    });
    const matLeafMid = new THREE.MeshStandardMaterial({ 
        color: 0x2e7d32, roughness: 0.7, metalness: 0.1 
    });
    const matLeafBright = new THREE.MeshStandardMaterial({ 
        color: 0x4caf50, roughness: 0.6, metalness: 0.1, emissive: 0x1b5e20, emissiveIntensity: 0.2
    });
    const leafMaterials = [matLeafDark, matLeafMid, matLeafMid, matLeafBright];
    
    const matTrunk = new THREE.MeshStandardMaterial({ 
        color: 0x4e342e, roughness: 1.0, metalness: 0.0 
    });
    
    // Ornament Materials
    const matGold = new THREE.MeshStandardMaterial({ 
        color: 0xffd700, roughness: 0.1, metalness: 0.9, emissive: 0x443300, emissiveIntensity: 0.4 
    });
    const matRed = new THREE.MeshStandardMaterial({ 
        color: 0xd32f2f, roughness: 0.1, metalness: 0.5, emissive: 0x440000, emissiveIntensity: 0.3 
    });
    const matSilver = new THREE.MeshStandardMaterial({ 
        color: 0xe0e0e0, roughness: 0.1, metalness: 0.9, emissive: 0x222222, emissiveIntensity: 0.3 
    });
    const ornamentMaterials = [matGold, matRed, matRed, matSilver];
    
    const matLightWarm = new THREE.MeshStandardMaterial({ 
        color: 0xffffee, emissive: 0xffaa00, emissiveIntensity: 2.0, toneMapped: false 
    });
    const matLightColor = new THREE.MeshStandardMaterial({ 
        color: 0xffcccc, emissive: 0xff0000, emissiveIntensity: 2.0, toneMapped: false 
    });
    
    const matSnow = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, transparent: true, opacity: 0.9 
    });
    
    const matStar = new THREE.MeshBasicMaterial({
        color: 0xffffee 
    });

    // Helper to add particle
    const addParticle = (mesh: THREE.Mesh, pos: THREE.Vector3, type: Particle['type'], customScatterPos?: THREE.Vector3) => {
        mesh.position.copy(pos);
        
        let scatterPos: THREE.Vector3;
        
        if (customScatterPos) {
            scatterPos = customScatterPos;
        } else {
            // Random Scatter Position (Spherical Explosion)
            const r = 35 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            scatterPos = new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }
        
        mainGroup.add(mesh);
        particles.push(new Particle(mesh, pos, scatterPos, type));
    };

    // --- GENERATION PARAMETERS ---
    const TREE_HEIGHT = 30;
    const TREE_WIDTH_BASE = 14;
    const TRUNK_HEIGHT = 4;
    
    // LOWER OFFSET to move tree down away from title
    const Y_OFFSET = -18; 

    // A. TRUNK
    for (let i = 0; i < 250; i++) {
        const h = Math.random() * TRUNK_HEIGHT; 
        const theta = Math.random() * Math.PI * 2;
        const r = Math.random() * 1.8; 
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        
        const mesh = new THREE.Mesh(geoBox, matTrunk);
        mesh.scale.set(0.3, 0.3, 0.3); // Smaller bricks for trunk
        
        const pos = new THREE.Vector3(x, Y_OFFSET + h - TRUNK_HEIGHT + 1, z);
        addParticle(mesh, pos, 'trunk');
    }

    // B. FOLIAGE (The Tree Body) - MUCH HIGHER DENSITY, SMALLER PARTICLES
    const FOLIAGE_COUNT = 8000; // significantly increased count for "fluffier" look
    for (let i = 0; i < FOLIAGE_COUNT; i++) {
        // Normalized height 0 to 1
        const t = i / FOLIAGE_COUNT; 
        const h = t * TREE_HEIGHT; // 0 to 30
        
        // Cone radius at this height
        const maxR = TREE_WIDTH_BASE * (1 - t);
        
        // Distribution: 
        // We want a solid core but fuzzy edges.
        // Using power function to bias towards center but allow spread
        let rNorm = Math.pow(Math.random(), 0.8); 
        
        // Add "branching" noise layers
        // Every few units of height, push particles out further to simulate branches
        const branchNoise = Math.sin(h * 2.5) * 0.2; // Wavy profile
        
        const r = maxR * rNorm * (1 + branchNoise * (rNorm > 0.6 ? 1 : 0));
        
        const theta = Math.random() * Math.PI * 2; 
        
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = Y_OFFSET + h;

        // Random material from our green palette
        const mat = leafMaterials[Math.floor(Math.random() * leafMaterials.length)];
        const mesh = new THREE.Mesh(geoLeaf, mat);
        
        // Much smaller scale for delicate pine needle look
        // Scale decreases slightly towards top
        const s = (0.2 + Math.random() * 0.3) * (1.2 - t * 0.4); 

        mesh.scale.setScalar(s); 
        mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

        addParticle(mesh, new THREE.Vector3(x, y, z), 'leaf');
    }

    // C. ORNAMENTS - MORE LUXURIOUS
    const ORNAMENT_COUNT = 350; 
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
        const t = Math.random();
        if (t > 0.98) continue; // Skip very top tip
        
        const h = t * TREE_HEIGHT; 
        const maxR = TREE_WIDTH_BASE * (1 - t);
        
        // Place on surface, slightly embedded or sticking out
        const r = maxR * (0.8 + Math.random() * 0.3); 
        const theta = Math.random() * Math.PI * 2;
        
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = Y_OFFSET + h;

        const mat = ornamentMaterials[Math.floor(Math.random() * ornamentMaterials.length)];
        const mesh = new THREE.Mesh(geoSphere, mat);
        
        // Varied sizes: some large distinct ones, some small filler ones
        const isLarge = Math.random() > 0.7;
        const s = isLarge ? (0.6 + Math.random() * 0.3) : (0.3 + Math.random() * 0.2);
        
        mesh.scale.setScalar(s);

        addParticle(mesh, new THREE.Vector3(x, y, z), 'ornament');
    }

    // D. LIGHTS (Spiral + Random Sparkles)
    const LIGHT_COUNT = 400;
    const TURNS = 10;
    for (let i = 0; i < LIGHT_COUNT; i++) {
        const t = i / LIGHT_COUNT;
        const h = t * TREE_HEIGHT;
        const maxR = TREE_WIDTH_BASE * (1 - t);
        
        // Spiral logic
        const angle = t * Math.PI * 2 * TURNS;
        // Add some noise to spiral radius so it looks draped
        const r = (maxR + 0.5) * (0.95 + Math.random() * 0.1); 
        
        const x = r * Math.cos(angle);
        const z = r * Math.sin(angle);
        const y = Y_OFFSET + h;

        // Alternate warm and colored lights
        const mesh = new THREE.Mesh(geoSphere, Math.random() > 0.8 ? matLightColor : matLightWarm);
        mesh.scale.setScalar(0.25);

        addParticle(mesh, new THREE.Vector3(x, y, z), 'light');
    }

    // E. STAR (Top) - MORE GRAND
    const starMesh = new THREE.Mesh(geoStar, matStar);
    starMesh.scale.setScalar(2.5);
    // Add glow halo
    const haloGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    starMesh.add(halo);
    // Second halo
    const halo2 = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending }));
    starMesh.add(halo2);
    
    addParticle(starMesh, new THREE.Vector3(0, Y_OFFSET + TREE_HEIGHT + 1.5, 0), 'star');


    // F. SNOW (Background environment)
    const SNOW_COUNT = 700;
    for(let i=0; i<SNOW_COUNT; i++) {
        const mesh = new THREE.Mesh(geoLeaf, matSnow);
        mesh.scale.setScalar(0.12);
        
        // Widen the snow field
        const range = 70;
        const x = (Math.random() - 0.5) * range;
        const y = (Math.random() - 0.5) * range + 10;
        const z = (Math.random() - 0.5) * range;

        // Snow scatters even further
        const scatterR = 80 + Math.random() * 20;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const sx = scatterR * Math.sin(theta) * Math.cos(phi);
        const sy = scatterR * Math.sin(theta) * Math.sin(phi);
        const sz = scatterR * Math.cos(theta);

        addParticle(mesh, new THREE.Vector3(x,y,z), 'snow', new THREE.Vector3(sx,sy,sz));
    }

    particlesRef.current = particles;

    // --- 5. ANIMATION LOOP ---
    const clock = new THREE.Clock();
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();
      const isTree = modeRef.current;

      // Rotate entire group slowly
      if (mainGroup) {
        mainGroup.rotation.y = time * 0.1; // Slower, majestic rotation
        
        // Gentle sway for tree mode
        if (isTree) {
            mainGroup.rotation.z = Math.sin(time * 0.5) * 0.015;
        } else {
             mainGroup.rotation.z = Math.sin(time * 0.2) * 0.1; 
        }
      }

      // Update all particles
      particlesRef.current.forEach(p => p.update(dt, isTree, time));

      composer.render();
    };
    
    animate();

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full cursor-pointer touch-none select-none block"
      onClick={onSceneClick}
    />
  );
};

export default Scene;