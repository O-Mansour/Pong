import updateLanguageContent from "../../js/language.js";
import {isUserAuth, go_to_page} from "../../js/utils.js";

export class Gamevers4 extends  HTMLElement
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


            const template = document.getElementById("page-game4vers");
            const content = template.content.cloneNode(true);
            this.appendChild(content);
            updateLanguageContent();
            document.querySelector('form').addEventListener('submit', (e) => {
                e.preventDefault();
                
                const nicknames = {
                    player1: document.querySelector("#tournamentplayer1").value,
                    player2: document.querySelector("#tournamentplayer2").value,
                    player3: document.querySelector("#tournamentplayer3").value,
                    player4: document.querySelector("#tournamentplayer4").value
                };
                localStorage.setItem('tournamentPlayers', JSON.stringify(nicknames));
                
                go_to_page('/game?mode=tournament');
            });
        })();
    }
}

customElements.define("vers4-game", Gamevers4);