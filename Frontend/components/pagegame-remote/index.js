import updateLanguageContent from "../../js/lagages.js";
import {requireAuth} from "../../js/utils.js";

export class Gameremote extends  HTMLElement
{
    constructor()
    {
        super();
    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        requireAuth();
        const template = document.getElementById("page-remote");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        updateLanguageContent();
    }
}

customElements.define("pagegame-remote", Gameremote);