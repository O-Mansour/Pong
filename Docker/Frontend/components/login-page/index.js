export class LoginPage extends  HTMLElement
{
    constructor()
    {
        super();
        
    //     this.root= this.attachShadow({mode:'open'});
    //     const styles = document.createElement("style");
    //     this.root.appendChild(styles);

    //    async function loadcss(){
    //         const request = await fetch("/css/style.css");
    //         const css = await request.text();
    //         styles.textContent=css;
    //     }
    // loadcss();

    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        const template = document.getElementById("login-page");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
    }
}

customElements.define("login-page", LoginPage);

// customElements ketkhd deux parameter  paramer awal kakon fih nom dil components li ankhdm bih b melf html
 //parameter  2  object ou class inhert les elements html
 //plus nom compontes khs tkon fih (-)=>login-page

 //connectedCallback => ket3rf lia  html 