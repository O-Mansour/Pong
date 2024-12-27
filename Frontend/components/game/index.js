import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


export class Game extends HTMLElement
{
    constructor()
    {
        super();
    }

     // when the component is attached to the dom 

    connectedCallback()
    {

        const container = document.createElement('div');
        container.innerHTML = `<div id="score-container">
      <div id="player1-score">Player 1: <span id="scoreLeft">0</span></div>
      <div id="player2-score">Player 2: <span id="scoreRight">0</span></div>
    </div>
    <div id="connection-status">Connecting...</div>
    <div id="player-side"></div>
    <!-- <div id="tournament-stage">Tournament Stage: Not Started</div> -->
    <div id="tournament-status">Waiting for players...</div>`.trim();
    
    this.appendChild(container);


                const parent = this;
                class PongGame {
                    constructor() {
                        this.initRenderer();
                        this.initScene();
                        this.initCamera();
                        this.initLighting();
                        this.initControls();
                        this.createBackground();
                        this.createGameObjects();
                        this.setupWebSocket();
                        this.setupEventListeners();
                    }
                
                    initRenderer() {
                        this.renderer = new THREE.WebGLRenderer({
                            antialias: true,
                        });
                        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                        this.renderer.shadowMap.enabled = true;
                        this.renderer.setPixelRatio(window.devicePixelRatio);
                        this.renderer.setSize(window.innerWidth, window.innerHeight);
                        parent.appendChild(this.renderer.domElement);
                    }
                
                    initScene() {
                        this.scene = new THREE.Scene();
                        // this.scene.background = new THREE.Color(0x87CEEB);  // Fallback sky blue background
                    }
                
                    initCamera() {
                        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
                        this.camera.position.set(6, 6, 0);
                    }
                
                    initLighting() {
                        // Ambient light to soften shadows
                        // const ambientLight = new THREE.AmbientLight(0x404040);
                        // this.scene.add(ambientLight);
                
                        const light = new THREE.DirectionalLight(0xffffff, 1);
                        light.position.set(0, 10, 10);
                        this.scene.add(light);
                
                        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                        this.directionalLight.position.set(0, 10, 10);
                        this.directionalLight.castShadow = true;
                        this.directionalLight.shadow.camera.near = 1;
                        this.directionalLight.shadow.camera.far = 50;
                        this.scene.add(this.directionalLight);
                    }
                
                    initControls() {
                        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
                        this.controls.enableDamping = true;
                        this.controls.dampingFactor = 0.05;
                        this.controls.minDistance = 0.3;
                        this.controls.maxDistance = 10;
                        this.controls.minPolarAngle = 0.3;
                        this.controls.maxPolarAngle = 2 * Math.PI / 5;
                    }
                
                    createBackground() {
                        const cubeTextureLoader = new THREE.CubeTextureLoader();
                        cubeTextureLoader.load([
                            '/gamed/1vs1-local/src/cube_right1.png',   // positive x
                            '/gamed/1vs1-local/src/cube_left1.png',    // negative x
                            '/gamed/1vs1-local/src/cube_up1.png',     // positive y
                            '/gamed/1vs1-local/src/cube_down1.png',  // negative y
                            '/gamed/1vs1-local/src/cube_back1.png',   // positive z
                            '/gamed/1vs1-local/src/cube_front1.png'     // negative z
                        ], (cubeTexture) => {
                            this.scene.background = cubeTexture;
                            this.scene.environment = cubeTexture;
                            
                            // Optional: Tone mapping settings
                            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
                            this.renderer.toneMappingExposure = 1.0;
                            this.renderer.outputEncoding = THREE.sRGBEncoding;
                        });
                    }
                    
                    createGameObjects() {
                        this.createPlane();
                        this.createPaddles();
                        this.createBall();
                    }
                    
                
                    createPlane() {
                        this.textureLoader = new THREE.TextureLoader();
                        const planeGeometry = new THREE.PlaneGeometry(10, 6);
                        
                        const paddleTexture = this.textureLoader.load('/gamed/1vs1-local/src/plane.png', (texture) => {
                            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                            texture.minFilter = THREE.LinearMipmapLinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                        });
                
                        const planeMaterial = new THREE.MeshStandardMaterial({
                            color: 0xBFB9B2,
                            side: THREE.DoubleSide,
                            map: paddleTexture
                        });
                        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
                        this.plane.rotation.x = Math.PI / 2;
                        this.plane.position.y = 0;
                        this.plane.receiveShadow = true;
                        this.scene.add(this.plane);
                    }
                
                    createPaddles() {
                        const paddleGeometry = new THREE.CapsuleGeometry(0.1, 1, 4, 8);
                        const paddleTexture = this.textureLoader.load('/gamed/1vs1-local/src/ping-pong.jpg', (texture) => {
                            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                            texture.minFilter = THREE.LinearMipmapLinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                        });
                        
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
                        
                        this.leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterials.left);
                        this.leftPaddle.position.set(-4.9, 0.1, 0);
                        this.leftPaddle.rotation.x = Math.PI / 2;
                        this.leftPaddle.castShadow = true;
                        this.scene.add(this.leftPaddle);
                
                        this.rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterials.right);
                        this.rightPaddle.position.set(4.9, 0.1, 0); 
                        this.rightPaddle.rotation.x = Math.PI / 2;
                        this.rightPaddle.castShadow = true;
                        this.scene.add(this.rightPaddle);
                    }
                
                    createBall() {
                        const ballGeometry = new THREE.SphereGeometry(0.1);
                        
                        // Use mipmapping for ball texture
                        const ballTexture = this.textureLoader.load('/gamed/1vs1-local/src/ball2.jpg', (texture) => {
                            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                            texture.minFilter = THREE.LinearMipmapLinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                        });
                
                        const ballMaterial = new THREE.MeshStandardMaterial({
                            color: 0xffff00,
                            map: ballTexture
                        });
                        this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
                        this.ball.position.set(0, 0.1, 0);
                        this.ball.castShadow = true;
                        this.scene.add(this.ball);
                    }
                
                    setupWebSocket() {
                        // Add a game mode selection mechanism
                        const gameMode = window.location.search.slice(6); // New method to determine game mode
                        console.log({ gameMode })
                        const wsUrl = this.getWebSocketUrl(gameMode);
                        this.socket = new WebSocket(wsUrl);
                
                        const connectionStatus = document.getElementById('connection-status');
                        const playerSideElement = document.getElementById('player-side');
                        
                        let sideAssigned = false;
                        
                        this.socket.onopen = () => {
                            connectionStatus.textContent = 'Connected';
                            connectionStatus.style.color = 'green';
                        };
                        
                        this.socket.onclose = () => {
                            connectionStatus.textContent = 'Disconnected';
                            connectionStatus.style.color = 'red';
                        };
                        
                        this.socket.onmessage = (event) => {
                            const data = JSON.parse(event.data);
                            
                            switch(data.type) {
                                case 'players_ready':
                                    // Store the assigned player side
                                    this.playerSide = data.player_side;
                                    
                                    // Update UI to show which side the player is on
                                    if (!sideAssigned && data.player_side) {
                                        playerSideElement.textContent = `You are on the ${data.player_side} side`;
                                        sideAssigned = true;
                                    }
                    
                                    // Adjust camera based on game mode and player side
                                    if (gameMode === '1vs1-local') {
                                        // For local mode, always set camera to center
                                        this.camera.position.set(0, 6, 6);
                                    } else if (data.player_side === "left") {
                                        this.camera.position.set(-6, 6, 0);
                                    }
                                    if (this.playerSide === 'player1') {
                                        this.camera.position.set(-6, 6, 0);
                                    } else if (this.playerSide === 'player2') {
                                        this.camera.position.set(6, 6, 0);
                                    }
                    
                                    // Additional UI updates for number of players
                                    if (data.players_count === 2) {
                                        connectionStatus.textContent = 'Ready to Play';
                                        connectionStatus.style.color = 'green';
                                    }
                                    break;
                                
                                case 'game_state':
                                    this.updateGameStates(data.game_state);
                                    break;
                                case 'tournament_update':
                                    console.log(data.winners);
                                        // Update UI to show tournament bracket
                                        // Show current match assignments
                                        // Display tournament progress
                                    break;
                                
                                case 'error':
                                    console.error(data.message);
                                    break;
                            }
                        };
                    }
                    
                    // New method to get game mode
                    // New method to get WebSocket URL based on game mode
                    getWebSocketUrl(gameMode) {
                        switch(gameMode) {
                            case '1vs1-remote':
                                return 'ws://127.0.0.1:8000/ws/pong/1vs1-remote/';
                            case '1vs1-local':
                                return 'ws://127.0.0.1:8000/ws/pong/1vs1-local/';
                            default:
                                return 'ws://127.0.0.1:8000/ws/pong/tournament/';
                        }
                    }
                    
                    startGame() {
                        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                            const gameMode = this.getGameMode();
                            
                            if (gameMode === '1vs1-local') {
                                // For local mode, only start if both players are connected
                                // You might want to add additional checks or UI feedback
                                this.socket.send(JSON.stringify({ type: 'start_game' }));
                            } else {
                                // For remote mode, start can be more flexible
                                this.socket.send(JSON.stringify({ type: 'start_game' }));
                            }
                        }
                    }
                    
                
                    setupEventListeners() {
                        window.addEventListener('keydown', (event) => this.handleKeyDown(event));
                        window.addEventListener('keyup', (event) => this.handleKeyUp(event));
                        window.addEventListener('resize', () => this.handleResize());
                        this.startMovementLoop();
                    }
                
                    handleKeyDown(event) {
                        if (event.key in this.keyStates) {
                            this.keyStates[event.key] = true;
                        }
                
                        if (event.key === ' ') {
                            this.startGame();
                        }
                    }
                
                    handleKeyUp(event) {
                        if (event.key in this.keyStates) {
                            this.keyStates[event.key] = false;
                        }
                    }
                
                    // startMovementLoop() {
                    //     this.keyStates = {
                    //         'w': false,
                    //         's': false,
                    //         'ArrowUp': false,
                    //         'ArrowDown': false
                    //     };
                    
                    //     const movementLoop = () => {
                    //         // Use player-specific controls based on assigned side
                    //         if (this.playerSide === 'left') {
                    //             if (this.keyStates['w']) {
                    //                 this.movePaddle('left', -1);
                    //             }
                    //             if (this.keyStates['s']) {
                    //                 this.movePaddle('left', 1);
                    //             }
                    //         } else if (this.playerSide === 'right') {
                    //             if (this.keyStates['ArrowUp']) {
                    //                 this.movePaddle('right', -1);
                    //             }
                    //             if (this.keyStates['ArrowDown']) {
                    //                 this.movePaddle('right', 1);
                    //             }
                    //         }
                    
                    //         requestAnimationFrame(movementLoop);
                    //     };
                    
                    //     movementLoop();
                    // }
                    startMovementLoop() {
                        this.keyStates = {
                            'w': false,
                            's': false,
                            'd':false,
                            'a':false,
                            'ArrowUp': false,
                            'ArrowDown': false,
                            'ArrowRight': false,
                            'ArrowLeft': false
                        };
                        const movementLoop = () => {
                            // Left paddle movement
                            if (this.keyStates['w'] || this.keyStates['a']) {
                                this.movePaddle('left', -1);
                            }
                            if (this.keyStates['s'] || this.keyStates['d']) {
                                // console.log("hereeee")
                                this.movePaddle('left', 1);
                            }
                    
                            // Right paddle movement
                            if (this.keyStates['ArrowUp'] || this.keyStates['ArrowRight']) {
                                this.movePaddle('right', -1);
                            }
                            if (this.keyStates['ArrowDown'] || this.keyStates['ArrowLeft']) {
                                this.movePaddle('right', 1);
                            }
                            requestAnimationFrame(movementLoop);
                        };
                    
                        movementLoop();
                    }
                    
                
                    handleResize() {
                        this.camera.aspect = window.innerWidth / window.innerHeight;
                        this.camera.updateProjectionMatrix();
                        this.renderer.setSize(window.innerWidth, window.innerHeight);
                    }
                
                    movePaddle(side, direction) {
                        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                            if (this.gameMode === 'tournament')
                                side = this.mapPlayerSide(side);
                            this.socket.send(
                                JSON.stringify({
                                    type: 'paddle_move',
                                    player: side,
                                    direction: direction > 0 ? 'down' : 'up',
                                })
                            );
                        }
                    }
                    // movePaddle(side, direction) {
                    //     if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    //         // Map 'left' and 'right' to actual player sides
                    //         const playerSide = this.mapPlayerSide(side);
                            
                    //         this.socket.send(
                    //             JSON.stringify({
                    //                 type: 'paddle_move',
                    //                 player: playerSide,
                    //                 direction: direction > 0 ? 'down' : 'up',
                    //             })
                    //         );
                    //     }
                    // }
                    
                    // New method to map sides
                    mapPlayerSide(side) {
                        const gameMode = 'tournament'; // or however you determine the game mode
                        
                        if (gameMode === 'tournament') {
                            // For tournament mode, use first match players
                            return side === 'left' ? 'player1' : 'player2';
                        }
                        
                        // Add other game mode mappings if needed
                        return side;
                    }
                    startGame() {
                        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                            this.socket.send(JSON.stringify({ type: 'start_game' }));
                        }
                    }
                
                    updateGameStates(gameState) {
                        // const deltaTime = (performance.now() - this.previousTime) / 1000;
                        // this.previousTime = performance.now();
                
                        if (gameState.ball && gameState.ball.position) {
                            // Always keep ball at y=0.1
                            this.ball.position.set(
                                gameState.ball.position[0],
                                0.1, 
                                gameState.ball.position[2]
                            );
                            // console.log(gameState.ball);
                        }
                
                        if (gameState.paddles) {
                            // Constrain paddle movement to the plane
                                
                            this.leftPaddle.position.z = Math.max(-2.4, Math.min(2.4, gameState.paddles.left.position));
                            this.rightPaddle.position.z = Math.max(-2.4, Math.min(2.4, gameState.paddles.right.position));
                        }
                
                        if (gameState.scores) {
                            document.getElementById('scoreLeft').textContent = gameState.scores.left;
                            document.getElementById('scoreRight').textContent = gameState.scores.right;
                        }
                    }
                
                    animate() {
                        requestAnimationFrame(() => this.animate());
                
                        this.ball.rotation.y += 0.02;
                        this.ball.rotation.x += 0.02;
                
                        this.controls.update();
                        this.renderer.render(this.scene, this.camera);
                    }
                
                    start() {
                        this.animate();
                    }
                }
                
                // Initialize and start the game
                const pongGame = new PongGame();
                pongGame.start();
    }
}

customElements.define("game-page", Game);
