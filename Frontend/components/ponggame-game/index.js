import updateLanguageContent from "../../js/lagages.js";
import {requireAuth} from "../../js/utils.js";

export class Gamermote extends  HTMLElement
{
    constructor()
    {
        super();
    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        requireAuth();
        const template = document.getElementById("page-game");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        updateLanguageContent();
        localStorage.removeItem('gameScores');
        localStorage.removeItem('Players');
        localStorage.removeItem('remotewinner');
    }
}

customElements.define("ponggame-game", Gamermote);