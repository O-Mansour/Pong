import { go_to_page, alertMessage } from "../../js/utils.js";

export class WebSocketManager {
    constructor(game) {
        this.game = game;
        this.gameMode = window.location.search.slice(6);
        const validModes = ['1vs1-remote', '1vs1-local', 'tournament'];
        if (!validModes.includes(this.gameMode)) {
            go_to_page("/error");
            return;
        }
        this.socket = null;
        this.playerSide = null;
        this.scoreLeft = document.querySelector('#playerleftscore');
        this.scoreRight = document.querySelector('#playerrightscore');
        this.playerLeftImage = document.querySelector('#playerleftimage');
        this.playerLeftName = document.querySelector('#playerleftname');
        this.playerRightImage = document.querySelector('#playerrightimage');
        this.playerRightName = document.querySelector('#playerrightname');
        this.tPlayers = null;
    }

    connect() {
        const token = localStorage.getItem('access_token');
        const wsUrl = this.getWebSocketUrl(this.gameMode) + `?token=${encodeURIComponent(token)}`;
        this.socket = new WebSocket(wsUrl);
        // this.socket.onerror = () => {
        //     go_to_page("/error");
        // };
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

        this.socket.onopen = () => this.handleOpen(connectionStatus);
        this.socket.onclose = () => this.handleClose(connectionStatus);
        this.socket.onmessage = (event) => this.handleMessage(event, connectionStatus, playerSideElement);
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

    handleMessage(event, connectionStatus, playerSideElement) {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'players_ready':
                console.log('players ready:', data);
                this.currentRoomId = data.room_id; // Store the room_id
                if (this.gameMode === "tournament") {
                    this.tPlayers = JSON.parse(localStorage.getItem('tournamentPlayers'));
                    switch(data.tournament_status.state) {
                        case 'semifinals_1':
                            this.playerLeftName.textContent = this.tPlayers.player1;
                            this.playerRightName.textContent = this.tPlayers.player2;
                            break;
                        case 'semifinals_2':
                            this.playerLeftName.textContent = this.tPlayers.player3;
                            this.playerRightName.textContent = this.tPlayers.player4;
                            break;
                        case 'finals':
                            const semifinal1Winner = JSON.parse(localStorage.getItem('playersemione'));
                            const semifinal2Winner = JSON.parse(localStorage.getItem('playersemitwo'));
                            this.playerLeftName.textContent = semifinal1Winner;
                            this.playerRightName.textContent = semifinal2Winner;
                            break;
                    }
                }
                this.handlePlayersReady(data, connectionStatus, playerSideElement);
                break;
            case 'game_state':
                if (data.room_id === this.currentRoomId) {
                    this.handleGameState(data);
                }
                break;
            case 'score_update':
                console.log(data)
            // if (data.room_id === this.currentRoomId) {
                this.handleScoreUpdate(data.scores);
            // }
                break;
            case 'already':
                // alert("already in a room")
                go_to_page("/already");
                this.socket?.close()
                break;
            case 'match_finished':
                if (this.gameMode === "tournament")
                    this.handleMatchFinished(data);
                if (this.gameMode === "1vs1-local"){
                    // alertMessage(`Match Winner: ${data.winner}!`);
                    this.socket?.close();
                    setTimeout(() => {
                        go_to_page("/congrats")
                    }, 1500);
                }
                if (this.gameMode === "1vs1-remote"){
                    // alertMessage(`Match Winner: ${data.winner}!`);
                    localStorage.setItem('remotewinner', JSON.stringify(data.winner));
                    this.socket?.close();
                    setTimeout(() => {
                        go_to_page("/congrats")
                    }, 1500);
                }
                // else if (this.gameMode === "1vs1-remote")
                //     this.socket?.close();
                //     go_to_page("/select")
                break
            case 'match_canceled':
                // console.log("here")
                    // break;
                //route to winner page
                // alert("match is finished")
                alertMessage("Match is canceled")
                this.socket?.close()
                go_to_page("/select")
                break;
            case 'error':
                console.error(data.message);
                break;
        }
    }

    handleScoreUpdate(scores) {
        // Update score display elements if they exist
        if (this.scoreLeft) {
            this.scoreLeft.textContent = scores.left;
        }
        if (this.scoreRight) {
            this.scoreRight.textContent = scores.right;
        }
        localStorage.setItem('gameScores', JSON.stringify({
            leftScore: scores.left,
            rightScore: scores.right
        }));
        // Optionally play a sound effect when score changes
        // this.playScoreSound();

        // // You could also add visual effects here
        // this.showScoreAnimation();
    }

    handleMatchFinished(data) {
        const state = data.tournament_status.state;
        console.log(state);
        if (state === 'completed') {
            localStorage.setItem('finalwinner', JSON.stringify(data.winner));
            localStorage.setItem('finalwinnerscore', JSON.stringify(data.winnerscore));
            localStorage.setItem('finalloserscore', JSON.stringify(data.loserscore));
            alertMessage(`Tournament Winner: ${data.winner}! 🏆`,"alert-success");
            this.socket?.close();
            setTimeout(() => {
                go_to_page("/tournamentwinner");
            }, 1500);
        } else {
            alertMessage(`Match Winner: ${data.winner}! Next match starting soon...`,"alert-success");
            if (state === "semifinals_2") {
                localStorage.setItem('playersemione', JSON.stringify(data.winner));
                localStorage.setItem('winner1score', JSON.stringify(data.winnerscore));
                localStorage.setItem('loser1score', JSON.stringify(data.loserscore));
            }
            if (state === "finals") {
                localStorage.setItem('playersemitwo', JSON.stringify(data.winner));
                localStorage.setItem('winner2score', JSON.stringify(data.winnerscore));
                localStorage.setItem('loser2score', JSON.stringify(data.loserscore));
            }
            this.socket?.close();
            go_to_page("/game?mode=tournament");
        }
    }


    handlePlayersReady(data, connectionStatus) {
        if (!this.playerSide) {
            this.playerSide = data.player_side;
        }
        if (connectionStatus) {
            if (data.players_count === 1) {
                connectionStatus.textContent = '⏳ Waiting for opponent...';
                connectionStatus.style.color = 'orange';
            } else if (data.players_count === 2) {
                connectionStatus.textContent = '🎮 Both players ready!';
                connectionStatus.style.color = 'green';
            }
        }
        if (data.players) {
            if (data.players.left) {
                this.playerLeftName.textContent = data.players.left;
                this.playerLeftImage.src = `http://localhost:8000/media/profile_images/${data.players.left}_profile.jpg`;
                this.playerLeftImage.onerror = () => {
                    this.playerLeftImage.src = `http://localhost:8000/media/default_pfp.jpg`;
                };
            }
            
            if (data.players.right) {
                this.playerRightName.textContent = data.players.right;
                this.playerRightImage.src = `http://localhost:8000/media/profile_images/${data.players.right}_profile.jpg`;
                this.playerRightImage.onerror = () => {
                    this.playerRightImage.src = `http://localhost:8000/media/default_pfp.jpg`;
                };
            }
        }

        const playerSideElement = document.getElementById('player-side');
        if (this.gameMode === "1vs1-remote") {
            const side = this.playerSide 
            if (side === 'left')
                playerSideElement.textContent = `You can play with W/S or A/D`;
            if (side === 'right')
                playerSideElement.textContent = `You can play with Arrow Keys`;
        }
        else
            playerSideElement.style.display = 'none';
        if (this.gameMode === '1vs1-local' || this.gameMode === 'tournament') {
            this.game.camera.position.set(0, 6, 6);
        } else if (data.player_side === "left") {
            this.game.camera.position.set(-6, 6, 0);
        }
        localStorage.setItem('Players', JSON.stringify({
            players: data.players,
        }));
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
        return baseUrl + modes[gameMode] ;
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