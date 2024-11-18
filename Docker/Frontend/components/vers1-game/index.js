export class Gameves extends  HTMLElement
{
    constructor()
    {
        super();
    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        const template = document.getElementById("page-gamevers");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        // const canvas = document.getElementById('game-canva')
    }
}

customElements.define("vers1-game", Gameves);