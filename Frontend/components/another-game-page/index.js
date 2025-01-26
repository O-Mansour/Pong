import updateLanguageContent from "../../js/language.js";
// import {requireAuth} from "../../js/utils.js";

export class GameAnotherpage extends  HTMLElement
{
    constructor()
    {
        super();
    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        // requireAuth();
        const template = document.getElementById("page-AnotherGame");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        updateLanguageContent();
    }
}

customElements.define("another-game-page", GameAnotherpage);