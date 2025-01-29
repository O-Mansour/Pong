import { Initializer } from './initializer.js';
import { GameObjects } from './objects.js';
import { WebSocketManager } from './socketManager.js';
import { InputHandler } from './handler.js';
import * as dat from 'dat.gui';
import {isUserAuth, go_to_page} from "../../js/utils.js";


export class Game extends HTMLElement
{
    constructor()
    {
        super();
    }
    connectedCallback()
    {
        (async () => {
            const isAuthenticated = await isUserAuth();
            if (!isAuthenticated) {
                go_to_page('/');
                return;
            }

            const container = document.createElement('div');
            container.setAttribute("id", "body_game");
            container.innerHTML = `
                <div id="score-container">
                        <div class="card1">
                            <div class="pp pp-left">
                                <img id="playerleftimage" src="/images/profile.jpg" alt="P1">
                                <p id="playerleftname">Player 1</p>
                                <span id="playerleftscore" class="scor">0</span>
                            </div>
                        </div>
                        <div class="card2">
                            <div class="pp pp-right">
                                <img id="playerrightimage" src="/images/profile.jpg" alt="P2">
                                <p id="playerrightname">Player 2</p>
                                <span id="playerrightscore" class="scor">0</span>
                            </div>
                        </div>
                </div>
                <div id="connection-status">Connecting...</div>
                <div id="player-side"></div>
                <div id="game-controls"></div>
            `.trim();
            this.appendChild(container);
                class PongGame {
                    constructor() {                    
                        const body = document.getElementById("body_game");
                        this.renderer = Initializer.initRenderer(body);
                        this.scene = Initializer.initScene();
                        this.camera = Initializer.initCamera();
                        this.directionalLight = Initializer.initLighting(this.scene);
                        this.controls = Initializer.initControls(this.camera, this.renderer);
                        this.gameObjects = new GameObjects(this.scene, this.renderer);
                        this.gameObjects.createBackground();
                        this.plane = this.gameObjects.createPlane();
                        const paddles = this.gameObjects.createPaddles();
                        this.leftPaddle = paddles.leftPaddle;
                        this.rightPaddle = paddles.rightPaddle;
                        this.ball = this.gameObjects.createBall();
                        this.webSocketManager = new WebSocketManager(this);
                        this.webSocketManager.connect();
                        this.inputHandler = new InputHandler(this);
                        this.inputHandler.setupEventListeners();
                        this.setupColorControls();
                    }
                    setupColorControls() {
                        this.gui = new dat.GUI({
                            autoPlace: false,
                            width: 200 
                        });
                        this.colorSettings = {
                            ballColor: '#' + this.ball.material.color.getHexString(),
                            leftPaddleColor: '#' + this.leftPaddle.material.color.getHexString(),
                            rightPaddleColor: '#' + this.rightPaddle.material.color.getHexString()
                        };
                        this.gui.addColor(this.colorSettings, 'ballColor')
                            .name('Ball Color')
                            .onChange((value) => {
                                this.ball.material.color.set(value);
                            });
                        this.gui.addColor(this.colorSettings, 'leftPaddleColor')
                            .name('Left Paddle')
                            .onChange((value) => {
                                this.leftPaddle.material.color.set(value);
                            });
                        this.gui.addColor(this.colorSettings, 'rightPaddleColor')
                            .name('Right Paddle')
                            .onChange((value) => {
                                this.rightPaddle.material.color.set(value);
                            });
                        const controlsContainer = document.getElementById('game-controls');
                        controlsContainer.appendChild(this.gui.domElement);
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
        })();
    }
}
customElements.define("game-page", Game);
