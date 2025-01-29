export const event = new Event("mylink");

export class link extends HTMLElement
{
    constructor()
    {
        super();    
    }

    connectedCallback()
    {
        const a = document.createElement('a');
        a.setAttribute("href", this.getAttribute("href"));
        a.innerHTML = (this.innerHTML);
        a.onclick = (e) => {
            e.preventDefault();
            const url = this.getAttribute("href");
            history.pushState({url}, null, url);
            document.dispatchEvent(event);
        };
        this.innerHTML = "";
        this.appendChild(a);
    }
}

customElements.define("my-link", link);  
