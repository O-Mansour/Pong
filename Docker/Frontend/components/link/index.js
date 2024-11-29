export const event = new Event("mylink");

export class link extends  HTMLElement
{
    constructor()
    {
        super();
        // this.root = this.attachShadow({mode:'open'});
    }

    // when the component is attached to the dom 

    connectedCallback()
    {
        const a = document.createElement('a');
        a.setAttribute("href", this.getAttribute("href"));
        a.innerHTML = (this.innerHTML);
        a.onclick = (e) => {
            e.preventDefault();
            const url = this.getAttribute("href");
            history.pushState({url}, null, url);  //history.pushState to change the browser’s URL without reloading the page
            document.dispatchEvent(event);  //  can be listened for elsewhere in the code
        };
        this.innerHTML = "";
        this.appendChild(a);
    }
}

customElements.define("my-link", link);  


//The <my-link> component creates a link element that changes the browser’s URL when 
//clicked without refreshing the page and dispatches a "mylink" event. This is often 
//used in single-page applications (SPAs) where the navigation and state updates happen 
// without full page reloads
