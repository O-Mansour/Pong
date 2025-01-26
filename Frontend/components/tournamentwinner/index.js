export class Gamevers4winner extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const template = document.getElementById("page-tournamentwinner");
        const content = template.content.cloneNode(true);
        this.appendChild(content);

        const player1 = document.querySelector("#tournamentplayer1res");
        const player2 = document.querySelector("#tournamentplayer2res");
        const player3 = document.querySelector("#tournamentplayer3res");
        const player4 = document.querySelector("#tournamentplayer4res");
        const player1score = document.querySelector("#tournamentplayer1score");
        const player2score = document.querySelector("#tournamentplayer2score");
        const player3score = document.querySelector("#tournamentplayer3score");
        const player4score = document.querySelector("#tournamentplayer4score");
        const playersemi1 = document.querySelector("#playersemione");
        const playersemi2 = document.querySelector("#playersemitwo");
        const playersemi1score = document.querySelector("#playersemionescore");
        const playersemi2score = document.querySelector("#playersemitwoscore");
        const finalwinner = document.querySelector("#finalwinner");

        const storedNicknames = JSON.parse(localStorage.getItem('tournamentPlayers'));
        const semiWinner1 = JSON.parse(localStorage.getItem('playersemione'));
        const semiWinner2 = JSON.parse(localStorage.getItem('playersemitwo'));
        const tournamentWinner = JSON.parse(localStorage.getItem('finalwinner'));

        // Set initial player names
        if (storedNicknames) {
            player1.textContent = storedNicknames.player1;
            player2.textContent = storedNicknames.player2;
            player3.textContent = storedNicknames.player3;
            player4.textContent = storedNicknames.player4;
        }

        if (semiWinner1) playersemi1.textContent = semiWinner1;
        if (semiWinner2) playersemi2.textContent = semiWinner2;
        if (tournamentWinner) finalwinner.textContent = tournamentWinner;

        if (semiWinner1 === storedNicknames.player1) {
            player1score.textContent = JSON.parse(localStorage.getItem('winner1score'));
            player2score.textContent = JSON.parse(localStorage.getItem('loser1score'));
        } else if (semiWinner1 === storedNicknames.player2) {
            player2score.textContent = JSON.parse(localStorage.getItem('winner1score'));
            player1score.textContent = JSON.parse(localStorage.getItem('loser1score'));
        }

        if (semiWinner2 === storedNicknames.player3) {
            player3score.textContent = JSON.parse(localStorage.getItem('winner2score'));
            player4score.textContent = JSON.parse(localStorage.getItem('loser2score'));
        } else if (semiWinner2 === storedNicknames.player4) {
            player4score.textContent = JSON.parse(localStorage.getItem('winner2score'));
            player3score.textContent = JSON.parse(localStorage.getItem('loser2score'));
        }

        if (tournamentWinner === semiWinner1) {
            playersemi1score.textContent = JSON.parse(localStorage.getItem('finalwinnerscore'));
            playersemi2score.textContent = JSON.parse(localStorage.getItem('finalloserscore'));
        } else if (tournamentWinner === semiWinner2) {
            playersemi2score.textContent = JSON.parse(localStorage.getItem('finalwinnerscore'));
            playersemi1score.textContent = JSON.parse(localStorage.getItem('finalloserscore'));
        }

        // Clean up localStorage
        localStorage.removeItem("playersemione");
        localStorage.removeItem("playersemitwo");
        localStorage.removeItem("finalwinner");
        localStorage.removeItem("tournamentPlayers");
        localStorage.removeItem("winner1score");
        localStorage.removeItem("loser1score");
        localStorage.removeItem("winner2score");
        localStorage.removeItem("loser2score");
        localStorage.removeItem("finalwinnerscore");
        localStorage.removeItem("finalloserscore");
        localStorage.removeItem("gameScores");
    }
}

customElements.define("vers4-game-winner", Gamevers4winner);