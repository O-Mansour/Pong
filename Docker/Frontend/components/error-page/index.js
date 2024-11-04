export class NotFound extends  HTMLElement
{
    constructor()
    {
        super();
    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        const template = document.getElementById("error-page-id");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
    }
}

customElements.define("error-page", NotFound);
