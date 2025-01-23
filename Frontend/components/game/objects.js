import * as THREE from 'three';

export class GameObjects {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.textureLoader = new THREE.TextureLoader();
    }
    
    createBackground() {
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        cubeTextureLoader.load([
            '/src/cube_right1.png',
            '/src/cube_left1.png',
            '/src/cube_up1.png',
            '/src/cube_down1.png',
            '/src/cube_back1.png',
            '/src/cube_front1.png'
        ], (cubeTexture) => {
            this.scene.background = cubeTexture;
            this.scene.environment = cubeTexture;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
        });
    }

    createPlane() {
        const planeGeometry = new THREE.PlaneGeometry(10, 6);
        const paddleTexture = this.loadTexture('/src/plane.png');
        const planeMaterial = new THREE.MeshStandardMaterial({
            color: 0xBFB9B2,
            side: THREE.DoubleSide,
            map: paddleTexture
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = Math.PI / 2;
        plane.position.y = 0;
        plane.receiveShadow = true;
        this.scene.add(plane);
        return plane;
    }

    createPaddles() {
        const paddleGeometry = new THREE.CapsuleGeometry(0.1, 1, 4, 8);
        const paddleTexture = this.loadTexture('/src/ping-pong.jpg');
        
        const paddleMaterials = {
            left: new THREE.MeshStandardMaterial({ 
                color: 0x00ff00, 
                roughness: 0.2, 
                metalness: 0.6,
                map: paddleTexture 
            }),
            right: new THREE.MeshStandardMaterial({ 
                color: 0x0000ff, 
                roughness: 0.2, 
                metalness: 0.6,
                map: paddleTexture 
            })
        };

        const leftPaddle = this.createPaddle(paddleGeometry, paddleMaterials.left, -4.9);
        const rightPaddle = this.createPaddle(paddleGeometry, paddleMaterials.right, 4.9);
        
        return { leftPaddle, rightPaddle };
    }

    createBall() {
        const ballGeometry = new THREE.SphereGeometry(0.1);
        const ballTexture = this.loadTexture('/src/ball2.jpg');
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            map: ballTexture
        });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.set(0, 0.1, 0);
        ball.castShadow = true;
        this.scene.add(ball);
        return ball;
    }

    loadTexture(path) {
        return this.textureLoader.load(path, (texture) => {
            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
        });
    }

    createPaddle(geometry, material, xPosition) {
        const paddle = new THREE.Mesh(geometry, material);
        paddle.position.set(xPosition, 0.1, 0);
        paddle.rotation.x = Math.PI / 2;
        paddle.castShadow = true;
        this.scene.add(paddle);
        return paddle;
    }
}