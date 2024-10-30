export class HomeDashboard extends  HTMLElement
{
    constructor()
    {
        super();
        this.root= this.attachShadow({mode:'open'});
        const styles = document.createElement("style");
        this.root.appendChild(styles);

    //    async  function loadcss(){

    //         const request = await fetch("/css/style.css");
    //         const css = await request.text();
    //         styles.textContent=css;
        // }
        // loadcss();
    }

     // when the component is attached to the dom 
    connectedCallback()
    {
        const template = document.getElementById("home-dashboard");
        const content = template.content.cloneNode(true);
        this.root.appendChild(content);
    }
}

customElements.define("home-dashboard-page", HomeDashboard);