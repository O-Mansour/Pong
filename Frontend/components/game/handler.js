import { WebSocketManager } from './socketManager.js';

export class InputHandler {
    constructor(game) {
        this.game = game;
        // this.webSocketManager = webSocketManager;
        this.keyStates = {
            'w': false, 's': false, 'd': false, 'a': false,
            'ArrowUp': false, 'ArrowDown': false, 'ArrowRight': false, 'ArrowLeft': false
        };
    }

    setupEventListeners() {
        window.addEventListener('keydown', (event) => this.handleKeyDown(event));
        window.addEventListener('popstate', () => this.handleBackKey());
        window.addEventListener('keyup', (event) => this.handleKeyUp(event));
        window.addEventListener('resize', () => this.handleResize());
        this.startMovementLoop();
    }

    handleKeyDown(event) {
        if (event.key in this.keyStates) {
            this.keyStates[event.key] = true;
        }
        if (event.key === ' ') {
            this.game.startGame();
        }

    }
    handleBackKey() {
        if (this.game.webSocketManager.socket?.readyState === WebSocket.OPEN) {
            this.game.webSocketManager.socket.send(JSON.stringify({ type: 'go_back' }));
        }
    }
    

    handleKeyUp(event) {
        if (event.key in this.keyStates) {
            this.keyStates[event.key] = false;
        }
    }

    startMovementLoop() {
        const movementLoop = () => {
            this.handlePaddleMovement();
            requestAnimationFrame(movementLoop);
        };
        movementLoop();
    }

    handlePaddleMovement() {
        if (this.keyStates['w'] || this.keyStates['a']) {
            this.game.movePaddle('left', -1);
        }
        if (this.keyStates['s'] || this.keyStates['d']) {
            this.game.movePaddle('left', 1);
        }
        if (this.keyStates['ArrowUp'] || this.keyStates['ArrowRight']) {
            this.game.movePaddle('right', -1);
        }
        if (this.keyStates['ArrowDown'] || this.keyStates['ArrowLeft']) {
            this.game.movePaddle('right', 1);
        }
    }

    handleResize() {
        this.game.camera.aspect = window.innerWidth / window.innerHeight;
        this.game.camera.updateProjectionMatrix();
        this.game.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}