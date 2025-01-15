import updateLanguageContent from "../../js/lagages.js";
import {requireAuth} from "../../js/utils.js";

export class Gamewinner extends  HTMLElement
{
    constructor()
    {
        super();
    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        requireAuth();
        const template = document.getElementById("page-winner");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        updateLanguageContent();
        this.displayScores();
    }
    displayScores() {
        const scores = JSON.parse(localStorage.getItem('gameScores')) || { leftScore: 0, rightScore: 0 };
        const players = JSON.parse(localStorage.getItem('Players'));
        const winner = JSON.parse(localStorage.getItem('remotewinner'));
        
        // Assuming you have elements with these IDs in your winner template
        const righttextElement = this.querySelector('#player1text');
        const rightScoreElement = this.querySelector('#loserscore');
        const rightcolorElement = this.querySelector('.wonn1');
        const rightnameElement = this.querySelector('#rightplayername');
        const lefttextElement = this.querySelector('#player2text');
        const leftScoreElement = this.querySelector('#winnerscore');
        const leftcolorElement = this.querySelector('.Lost1');
        const leftnameElement = this.querySelector('#leftplayername');

        if (leftScoreElement) {
            leftScoreElement.textContent = scores.leftScore;
        }
        
        if (rightScoreElement) {
            rightScoreElement.textContent = scores.rightScore;
        }
        if (scores.rightScore > scores.leftScore){
            lefttextElement.textContent = "You Won";
            leftcolorElement.style.color="#3992A5";
            righttextElement.textContent = "You Lost";
            rightcolorElement.style.color="white";
        }
        else{
            lefttextElement.textContent = "You Lost";
            leftcolorElement.style.color="white";
            righttextElement.textContent = "You Won";
            rightcolorElement.style.color="#3992A5";
        }
        if (players && players.players){
            if (scores.rightScore > scores.leftScore && players.players.right === winner.winner){
                rightnameElement.textContent = players.players.right;
                leftnameElement.textContent = players.players.left;
            }
            else{
                rightnameElement.textContent = players.players.left;
                leftnameElement.textContent = players.players.right;
            }
        }
    }
}

customElements.define("pagegame-winner", Gamewinner);