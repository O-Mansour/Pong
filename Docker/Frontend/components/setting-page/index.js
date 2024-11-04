export class Setting extends  HTMLElement
{
    constructor()
    {
        super();

    //     this.root= this.attachShadow({mode:'open'});
    //     const styles = document.createElement("style");
    //     this.root.appendChild(styles);

    //    async  function loadcss(){

    //         const request = await fetch("/css/style.css");
    //         const css = await request.text();
    //         styles.textContent=css;
    //     }
        // loadcss();

        // document.write("dekhl");
        
    }

     // when the component is attached to the dom

    connectedCallback()
    {
        
        const template = document.getElementById("setting");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
    }
}

customElements.define("setting-page",Setting);