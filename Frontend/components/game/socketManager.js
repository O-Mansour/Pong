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

    sendTournamentNicknames(nicknames) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'setup_tournament_nicknames',
                nicknames: {
                    player1: nicknames.player1,
                    player2: nicknames.player2,
                    player3: nicknames.player3,
                    player4: nicknames.player4
                }
            }));
        }
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
         const storedNicknames = JSON.parse(localStorage.getItem('tournamentPlayers'));
         if (storedNicknames) {
             this.sendTournamentNicknames(storedNicknames);
         }
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
                console.log('Tournament players ready:', data);
                this.currentRoomId = data.room_id; // Store the room_id
                this.handlePlayersReady(data, connectionStatus, playerSideElement, sideAssigned);
                break;
            case 'game_state':
                if (data.room_id === this.currentRoomId) {
                    this.handleGameState(data);
                }
                break;
            
            case 'already':
                // alert("already in a room")
                go_to_page("/goback");
                this.socket?.close()
                break;
            case 'match_finished':
                if (this.gameMode === "tournament")
                    this.handleMatchFinished(data);
                // else if (this.gameMode === "1vs1-remote")
                //     alertMessage(`Match Winner: ${data.winner}!`);
                //     this.socket?.close();
                //     go_to_page("/select")
            case 'match_canceled':
                console.log("here")
                //route to winner page
                // alert("match is finished")
                if (this.gameMode === "tournament")
                    break;
                alertMessage("Match is canceled")
                this.socket?.close()
                go_to_page("/select")
                break;
            case 'error':
                console.error(data.message);
                break;
        }
    }

    

    handleMatchFinished(data) {
        const state = data.tournament_status.state;
        console.log(state);
        if (state === 'completed') {
            localStorage.setItem('finalwinner', JSON.stringify(data.winner));
            localStorage.setItem('finalwinnerscore', JSON.stringify(data.winnerscore));
            localStorage.setItem('finalloserscore', JSON.stringify(data.loserscore));
            alertMessage(`Tournament Winner: ${data.winner}! 🏆`);
            this.socket?.close();
            go_to_page("/tournamentwinner");
        } else{
            alertMessage(`Match Winner: ${data.winner}! Next match starting soon...`);
            if (state === "semifinals_2")
                localStorage.setItem('playersemione', JSON.stringify(data.winner));
                localStorage.setItem('winner1score', JSON.stringify(data.winnerscore));
                localStorage.setItem('loser1score', JSON.stringify(data.loserscore));
            if (state === "finals")
                localStorage.setItem('playersemitwo', JSON.stringify(data.winner));
                localStorage.setItem('winner2score', JSON.stringify(data.winnerscore));
                localStorage.setItem('loser2score', JSON.stringify(data.loserscore));
            this.socket?.close();
            go_to_page("/game?mode=tournament")
        }
    }


    handlePlayersReady(data, connectionStatus, playerSideElement) {
        // Store the assigned player side
        this.playerSide = data.player_side;
        
        // Update UI to show which side the player is on
        if (playerSideElement && data.player_side) {
            if (data.player_side === "left")
                playerSideElement.textContent = `You are on the ${data.player_side} side, you can play with WS or AD`;
            else
                playerSideElement.textContent = `You are on the ${data.player_side} side, you can play with the arrows`;
            
        }
        const player1 = document.querySelector('.pp-left');
        const player2 = document.querySelector('.pp-right');

        // Adjust camera based on game mode and player side
        if (this.gameMode === '1vs1-local' || this.gameMode === 'tournament') {
            // For local mode, always set camera to center
            // player1.textContent = data.username1;
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
}