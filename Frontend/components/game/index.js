import { Initializer } from './initializer.js';
import { GameObjects } from './objects.js';
import { WebSocketManager } from './socketManager.js';
import { InputHandler } from './handler.js';

export class Game extends HTMLElement
{
    constructor()
    {
        super();
    }

    connectedCallback()
    {
        const container = document.createElement('div');
        container.innerHTML = `<div id="score-container">
        <div id="player1-score">Player 1: <span id="scoreLeft">0</span></div>
        <div id="player2-score">Player 2: <span id="scoreRight">0</span></div>
        </div>
        <div id="connection-status">Connecting...</div>
        <div id="player-side"></div>
        <!-- <div id="tournament-stage">Tournament Stage: Not Started</div> -->`.trim();
    ``
    this.appendChild(container);
            // const parent = this;
            class PongGame {
                constructor() {
                    // Initialize core Three.js components
                    this.renderer = Initializer.initRenderer(document.body);
                    this.scene = Initializer.initScene();
                    this.camera = Initializer.initCamera();
                    this.directionalLight = Initializer.initLighting(this.scene);
                    this.controls = Initializer.initControls(this.camera, this.renderer);
            
                    // Initialize game components
                    this.gameObjects = new GameObjects(this.scene, this.renderer);
                    this.gameObjects.createBackground();
                    
                    // Create game objects
                    this.plane = this.gameObjects.createPlane();
                    const paddles = this.gameObjects.createPaddles();
                    this.leftPaddle = paddles.leftPaddle;
                    this.rightPaddle = paddles.rightPaddle;
                    this.ball = this.gameObjects.createBall();
            
                    // Initialize networking and input handling
                    this.webSocketManager = new WebSocketManager(this);
                    this.webSocketManager.connect();
                    
                    this.inputHandler = new InputHandler(this);
                    this.inputHandler.setupEventListeners();
                }
            
                movePaddle(side, direction) {
                    this.webSocketManager.sendPaddleMove(side, direction);
                }
            
                startGame() {
                    if (this.webSocketManager.socket?.readyState === WebSocket.OPEN) {
                        this.webSocketManager.socket.send(JSON.stringify({ type: 'start_game' }));
                    }
                }
            
                updateGameStates(gameState) {
                    if (gameState.ball?.position) {
                        this.ball.position.set(
                            gameState.ball.position[0],
                            0.1,
                            gameState.ball.position[2]
                        );
                    }
            
                    if (gameState.paddles) {
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
            const pongGame = new PongGame();
            pongGame.start();
    }
}

customElements.define("game-page", Game);
