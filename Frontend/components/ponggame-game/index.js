import updateLanguageContent from "../../js/lagages.js";

export class Game extends  HTMLElement
{
    constructor()
    {
        super();
    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        const template = document.getElementById("page-game");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        updateLanguageContent();
    }
}

customElements.define("ponggame-game", Game);