import updateLanguageContent from "../../js/language.js";
import { go_to_page, alertMessage, isUserAuth } from "../../js/utils.js";

export class Gamermote extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        (async () => {
            const isAuthenticated = await isUserAuth();
            if (!isAuthenticated) {
                go_to_page('/');
                return;
            }
            const template = document.getElementById("page-game");
            const content = template.content.cloneNode(true);
            this.appendChild(content);
            updateLanguageContent();
            
            const gameStartButton = this.querySelector('#tourbutton');
            if (gameStartButton) {
                gameStartButton.addEventListener('click', () => this.handleGameStart());
            }

            localStorage.removeItem('gameScores');
            localStorage.removeItem('Players');
            localStorage.removeItem('remotewinner');
        })();
    }

    handleGameStart() {
        const state = localStorage.getItem('currentTournamentState');
        if (state && state !== 'completed' && state !== 'not_started') {
            alertMessage("You have an unfinished tournament");
            go_to_page('/game?mode=tournament');
            localStorage.removeItem('currentTournamentState');
        }
        else
            go_to_page('/tournament');
    }
}

customElements.define("ponggame-game", Gamermote);