import { go_to_page, alertMessage } from "../../js/utils.js";


export class WebSocketManager {
    constructor(game) {
        this.game = game;
        this.gameMode = window.location.search.slice(6);
        this.socket = null;
        this.playerSide = null;
    }

    connect() {
        const token = localStorage.getItem('access_token');
        const wsUrl = this.getWebSocketUrl(this.gameMode) + `?token=${encodeURIComponent(token)}`;
        this.socket = new WebSocket(wsUrl);
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        const connectionStatus = document.getElementById('connection-status');
        const playerSideElement = document.getElementById('player-side');
        let sideAssigned = false;

        this.socket.onopen = () => this.handleOpen(connectionStatus);
        this.socket.onclose = () => this.handleClose(connectionStatus);
        this.socket.onmessage = (event) => this.handleMessage(event, connectionStatus, playerSideElement, sideAssigned);
    }

    async handleOpen(connectionStatus) {
        if (connectionStatus) {
            connectionStatus.textContent = 'Connected';
            connectionStatus.style.color = 'green';
        }
        // const response = await fetch('http://localhost:8000/api/profiles/me/', {
        //     headers: {
        //       'Authorization': `JWT ${localStorage.getItem('access_token')}`
        //     }
        //   });
        // const data = await response.json();
        // this.socket.send(JSON.stringify({ type: 'user', user_data: data}));
    }

    handleClose(connectionStatus) {
        if (connectionStatus) {
            connectionStatus.textContent = 'Disconnected';
            connectionStatus.style.color = 'red';
        }
    }

    handleMessage(event, connectionStatus, playerSideElement, sideAssigned) {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'players_ready':
                this.handlePlayersReady(data, connectionStatus, playerSideElement, sideAssigned);
                break;
            case 'game_state':
                this.handleGameState(data);
                break;
            case 'already':
                // alert("already in a room")
                go_to_page("/goback");
                this.socket?.close()
                break;
            case 'match_finished':
                //route to winner page
                // alert("match is finished")
                this.socket?.close()
                go_to_page("/congrats")
                break;
            case 'match_canceled':
                //route to winner page
                // alert("match is finished")
                alertMessage("Match is canceled")
                this.socket?.close()
                go_to_page("/select")
                break;
            case 'tournament_update':
                this.handleTournamentUpdate(data);
                break;
            case 'error':
                console.error(data.message);
                break;
        }
    }

    handlePlayersReady(data, connectionStatus, playerSideElement) {
        // Store the assigned player side
        this.playerSide = data.player_side;
        
        // Update UI to show which side the player is on
        if (playerSideElement && data.player_side) {
            playerSideElement.textContent = `You are on the ${data.player_side} side`;
        }
        const player1 = document.querySelector('.pp-left');
        const player2 = document.querySelector('.pp-right');

        // Adjust camera based on game mode and player side
        if (this.gameMode === '1vs1-local') {
            // For local mode, always set camera to center
            // player1.textContent = data.username1;
            // player1.style.color = 'blue';
            // player2.textContent = data.username2;
            // player2.style.color = 'green';
            this.game.camera.position.set(0, 6, 6);
        } else if (data.player_side === "left") {
            this.game.camera.position.set(-6, 6, 0);
        }

        if (this.playerSide === 'player1') {
            this.playerSide === 'left'
            player1.textContent = data.username;
            this.game.camera.position.set(-6, 6, 0);
        } else if (this.playerSide === 'player2') {
            this.playerSide === 'right'
            player2.textContent = data.username;
            this.game.camera.position.set(6, 6, 0);
        }

        // Additional UI updates for number of players
        if (connectionStatus && data.players_count === 2) {
            connectionStatus.textContent = 'Ready to Play';
            connectionStatus.style.color = 'green';
        }
    }

    handleGameState(data) {
        if (this.game && data.game_state) {
            this.game.updateGameStates(data.game_state);
        }
    }

    handleTournamentUpdate(data) {
        // Add any tournament-specific UI updates here
    }

    getWebSocketUrl(gameMode) {
        const baseUrl = 'ws://127.0.0.1:8000/ws/pong/';
        const modes = {
            '1vs1-remote': '1vs1-remote/',
            '1vs1-local': '1vs1-local/',
            'tournament': 'tournament/'
        };
        return baseUrl + (modes[gameMode] || '1vs1-local/') ;
    }

    sendPaddleMove(side, direction) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'paddle_move',
                player: side,
                direction: direction > 0 ? 'down' : 'up',
            }));
        }
    }


    sendStartGame() {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'start_game' }));
        }
    }
}