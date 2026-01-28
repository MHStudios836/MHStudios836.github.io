/**
 * PROJECT: ArmedSync®
 * COMPONENT: Core Simulation Engine
 * AUTHOR: MH Studios™ Defense Division
 */

import * as THREE from 'three'; 

class ArmedSyncEngine {
    constructor() {
        this.ontology = null; 
        this.currentLoadout = { totalWeight: 0, fatiguePenalty: 0, items: [] };
        
        // 1. VISUAL DOCTRINE
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05070a); 
        this.scene.fog = new THREE.FogExp2(0x05070a, 0.02);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        
        this.init();
    }

    async init() {
        console.log("[ARMED_SYNC] System Initializing...");

        // Setup DOM
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Setup Environment
        this.createOperationalFloor();
        this.createTacticalLighting();

        // >>> CRITICAL FIX: UI SETUP IS NOW FIRST <<<
        // We set up the toggle button immediately. We do NOT wait for data loading.
        this.setupUI(); 

        // Setup Data Link (This might be slow, so we do it after UI)
        await this.loadOntology();
        
        // Start Loop
        this.animate();
        console.log("[ARMED_SYNC] System Online.");
    }

    createOperationalFloor() {
        const gridHelper = new THREE.GridHelper(100, 100, 0x0080FF, 0x0d1b2a);
        this.scene.add(gridHelper);
    }

    createTacticalLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 2); 
        this.scene.add(ambientLight);
        const spotLight = new THREE.SpotLight(0xffffff, 5);
        spotLight.position.set(10, 20, 10);
        spotLight.castShadow = true;
        this.scene.add(spotLight);
    }

    async loadOntology() {
        try {
            const response = await fetch('./data/objects.json');
            if (!response.ok) throw new Error("Ontology Link Failed");
            this.ontology = await response.json();
            this.updateTelemetry();
            // Refresh Library now that data is loaded
            this.renderLibrary('primary_weapons');
        } catch (error) {
            console.warn("[WARNING] Could not load objects.json. UI running in Offline Mode.");
        }
    }

    updateTelemetry() {
        const weightDisplay = document.getElementById('hud-weight');
        const fatigueDisplay = document.getElementById('hud-fatigue');
        if (weightDisplay) weightDisplay.innerText = `${this.currentLoadout.totalWeight.toFixed(2)}`;
        if (fatigueDisplay) fatigueDisplay.innerText = `${(this.currentLoadout.fatiguePenalty * 100).toFixed(1)}%`;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    setupUI() {
        console.log("[UI] Wiring Controls...");

        // 1. Wire the Tabs
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');

                const categoryMap = {
                    'Primary Weapon': 'primary_weapons',
                    'Uniforms': 'uniforms',
                    'Vests/Armor': 'vests',
                    'Headgear': 'headgear',
                    'Backpacks': 'backpacks',
                    'Face ID': 'identities'
                };
                
                const key = categoryMap[e.currentTarget.getAttribute('title')];
                if (key) this.renderLibrary(key);
            });
        });

        // 2. DRAWER TOGGLE LOGIC
        const panel = document.getElementById('titan-library');
        const toggleBtn = document.getElementById('library-toggle-btn');
        
        if (toggleBtn && panel) {
            // Direct Click Binding (Safest Method)
            toggleBtn.onclick = function() {
                console.log("Toggle Clicked");
                panel.classList.toggle('open');
                
                const icon = toggleBtn.querySelector('i');
                if (panel.classList.contains('open')) {
                    if(icon) { icon.classList.remove('fa-chevron-right'); icon.classList.add('fa-chevron-left'); }
                } else {
                    if(icon) { icon.classList.remove('fa-chevron-left'); icon.classList.add('fa-chevron-right'); }
                }
            };
        }
    }

    renderLibrary(categoryKey) {
        const grid = document.getElementById('asset-grid');
        const header = document.querySelector('.category-header');
        
        // If data isn't loaded yet, stop.
        if (!grid || !this.ontology || !this.ontology.registry[categoryKey]) return;

        grid.innerHTML = '';
        header.innerText = categoryKey.replace('_', ' ').toUpperCase();

        this.ontology.registry[categoryKey].forEach(item => {
            const isEquipped = this.currentLoadout.items.includes(item.id);
            const card = document.createElement('div');
            card.className = `asset-card ${isEquipped ? 'equipped' : ''}`;
            card.onclick = () => this.equipItem(item.id, categoryKey);

            card.innerHTML = `
                <div class="asset-equipper"></div>
                <div class="asset-img">${item.id}</div> 
                <div class="asset-name">${item.name}</div>
                <div class="asset-stat">MASS: ${item.physics.mass_kg} KG</div>
            `;
            grid.appendChild(card);
        });
    }

    equipItem(itemId, categoryKey) {
        const item = this.ontology.registry[categoryKey].find(i => i.id === itemId);
        if (!item) return;

        this.currentLoadout.totalWeight += item.physics.mass_kg;
        this.currentLoadout.fatiguePenalty += item.fatigue_modifier;
        this.currentLoadout.items.push(itemId);

        this.updateTelemetry();
        this.renderLibrary(categoryKey); 
        console.log(`[ARMED_SYNC] Equipped: ${item.name}`);
    }

} 

// Ignite System
window.ArmedSync = new ArmedSyncEngine();