import updateLanguageContent from "../../js/language.js";
import {isUserAuth, go_to_page} from "../../js/utils.js";


export class Gamewinner extends  HTMLElement
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

            const template = document.getElementById("page-winner");
            const content = template.content.cloneNode(true);
            this.appendChild(content);
            this.displayScores();
            updateLanguageContent();
        })();
    }
    
    displayScores() {
        const scores = JSON.parse(localStorage.getItem('gameScores')) || { leftScore: 0, rightScore: 0 };
        const players = JSON.parse(localStorage.getItem('Players'));
        const winner = JSON.parse(localStorage.getItem('remotewinner'));
        
        const righttextElement = this.querySelector('#player1text');
        const rightScoreElement = this.querySelector('#loserscore');
        const rightcolorElement = this.querySelector('.wonn1');
        const rightnameElement = this.querySelector('#rightplayername');
        const lefttextElement = this.querySelector('#player2text');
        const leftScoreElement = this.querySelector('#winnerscore');
        const leftcolorElement = this.querySelector('.Lost1');
        const leftnameElement = this.querySelector('#leftplayername');
        const playerLeftImage = document.querySelector('#leftplayerimage');
        const playerRightImage = document.querySelector('#rightplayerimage');

        if (leftScoreElement) {
            leftScoreElement.textContent = scores.leftScore;
        }
        
        if (rightScoreElement) {
            rightScoreElement.textContent = scores.rightScore;
        }
        if (scores.rightScore > scores.leftScore){
            lefttextElement.textContent = "Winner";
            lefttextElement.setAttribute("data-i18n", "winner");
            leftcolorElement.style.color="#3992A5";
            righttextElement.textContent = "Loser";
            rightcolorElement.style.color="white";
            righttextElement.setAttribute("data-i18n", "loser");
        }
        else{
            righttextElement.textContent = "Winner";
            righttextElement.setAttribute("data-i18n", "winner");
            rightcolorElement.style.color="#3992A5";
            lefttextElement.textContent = "Loser";
            leftcolorElement.style.color="white";
            lefttextElement.setAttribute("data-i18n", "loser");
        }
        if (players && players.players){
            playerLeftImage.src = `/media/${players.players.left.img}`;
            playerLeftImage.onerror = () => {
                playerLeftImage.src = `/media/default_pfp.jpg`;
            };
            playerRightImage.src = `/media/${players.players.right.img}`;
            playerRightImage.onerror = () => {
                playerRightImage.src = `/media/default_pfp.jpg`;
            };
            if (scores.rightScore > scores.leftScore && players.players.right === winner.winner){
                rightnameElement.textContent = players.players.right.username;
                leftnameElement.textContent = players.players.left.username;
            }
            else{
                rightnameElement.textContent = players.players.left.username;
                leftnameElement.textContent = players.players.right.username;
            }
        }
    }
}

customElements.define("pagegame-winner", Gamewinner);