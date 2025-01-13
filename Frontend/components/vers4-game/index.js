export class Gamevers4 extends  HTMLElement
{
    constructor()
    {
        super();
    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        const template = document.getElementById("page-game4vers");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        document.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission
            
            const nicknames = {
                player1: document.querySelector("#tournamentplayer1").value,
                player2: document.querySelector("#tournamentplayer2").value,
                player3: document.querySelector("#tournamentplayer3").value,
                player4: document.querySelector("#tournamentplayer4").value
            };
            
            // Store the nicknames in localStorage
            localStorage.setItem('tournamentPlayers', JSON.stringify(nicknames));
            
            // Then navigate
            go_to_page('/game?mode=tournament');
        });
        // const canvas = document.getElementById('game-canva')
    }
}

customElements.define("vers4-game", Gamevers4);