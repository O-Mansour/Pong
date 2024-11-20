export class Setting extends  HTMLElement
{
    constructor()
    {
        super();
        
    }


    connectedCallback()
    {
        const template = document.getElementById("setting");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        this.fetchSettingesData();
    }

    
}

customElements.define("setting-page",Setting);