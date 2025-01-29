import updateLanguageContent from "../../js/language.js";
import {go_to_page, isUserAuth} from "../../js/utils.js";

export class Goback extends  HTMLElement
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
        
            const template = document.getElementById("goback");
            const content = template.content.cloneNode(true);
            this.appendChild(content);
            updateLanguageContent();
        })();
    }
}

customElements.define("goback-page", Goback);