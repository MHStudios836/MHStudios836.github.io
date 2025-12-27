/* MH STUDIOS™ - IRONCLAD 3D ENGINE (V1.0)
   Role: Character Customization & WebGL Rendering
*/

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls, soldierGroup;
let materialUniform, materialVest, materialHelmet;

export function initIronclad(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. SCENE SETUP
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.1);

    // 2. CAMERA
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.6, 4);

    // 3. RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);

    // 5. LIGHTING
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const rimLight = new THREE.PointLight(0xffae00, 2); // Orange Tactical Rim
    rimLight.position.set(2, 3, 2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x00e5ff, 0.5); // Cyan HUD Fill
    fillLight.position.set(-2, 2, 2);
    scene.add(fillLight);

    // 6. BUILD PROTOTYPE MESH (The Droid)
    buildDroid();

    // 7. ANIMATION LOOP
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // 8. RESIZE
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function buildDroid() {
    soldierGroup = new THREE.Group();

    // Shared Materials
    materialUniform = new THREE.MeshStandardMaterial({ color: 0x2e3522 }); // Olive
    materialVest = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.3 });
    materialHelmet = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2 });

    // Dummy Shapes for Body Parts
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.8, 0.3);
    const body = new THREE.Mesh(bodyGeo, materialUniform);
    body.position.y = 1.1;
    soldierGroup.add(body);

    const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({color: 0x333333}));
    head.position.y = 1.7;
    soldierGroup.add(head);

    const vestGeo = new THREE.BoxGeometry(0.65, 0.5, 0.35);
    const vest = new THREE.Mesh(vestGeo, materialVest);
    vest.position.y = 1.15;
    vest.name = "VEST";
    soldierGroup.add(vest);

    const helmetGeo = new THREE.BoxGeometry(0.35, 0.15, 0.4);
    const helmet = new THREE.Mesh(helmetGeo, materialHelmet);
    helmet.position.y = 1.85;
    helmet.name = "HELMET";
    soldierGroup.add(helmet);

    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 32), new THREE.MeshStandardMaterial({color: 0x050505}));
    soldierGroup.add(plate);

    scene.add(soldierGroup);
}

// 9. EXPORT GEAR SWAP LOGIC
export function updateGear(type, variant) {
    if (type === 'uniform') {
        if (variant === 'm81') materialUniform.color.setHex(0x2e3522);
        if (variant === 'desert') materialUniform.color.setHex(0xd2b48c);
        if (variant === 'black') materialUniform.color.setHex(0x050505);
    }
    if (type === 'vest') {
        const v = soldierGroup.getObjectByName("VEST");
        if (variant === 'plate') { v.scale.set(1, 1, 1); materialVest.color.setHex(0x111111); }
        if (variant === 'recon') { v.scale.set(0.9, 0.7, 0.9); materialVest.color.setHex(0x333333); }
    }
    if (type === 'helmet') {
        const h = soldierGroup.getObjectByName("HELMET");
        if (variant === 'fast') h.visible = true;
        if (variant === 'cap') { h.visible = true; h.scale.set(1, 0.4, 1.1); }
    }
}