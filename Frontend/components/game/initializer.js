import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Initializer {
    static initRenderer(parent) {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.enabled = true;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        parent.appendChild(renderer.domElement);
        return renderer;
    }

    static initScene() {
        return new THREE.Scene();
    }

    static initCamera() {
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(6, 6, 0);
        return camera;
    }

    static initLighting(scene) {
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 10, 10);
        scene.add(light);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 10, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 50;
        scene.add(directionalLight);
        return directionalLight;
    }

    static initControls(camera, renderer) {
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 0.3;
        controls.maxDistance = 10;
        controls.minPolarAngle = 0.3;
        controls.maxPolarAngle = 2 * Math.PI / 5;
        return controls;
    }
}