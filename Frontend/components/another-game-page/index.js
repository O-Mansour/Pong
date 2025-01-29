import updateLanguageContent from "../../js/language.js";
import {isUserAuth, go_to_page} from "../../js/utils.js";

export class GameAnotherpage extends  HTMLElement
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

            const template = document.getElementById("page-AnotherGame");
            const content = template.content.cloneNode(true);
            this.appendChild(content);
            updateLanguageContent();
        })();
    }
}

customElements.define("another-game-page", GameAnotherpage);