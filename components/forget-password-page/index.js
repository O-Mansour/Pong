export class LoginForgetpassword extends  HTMLElement
{
    constructor()
    {
        super();
        this.root= this.attachShadow({mode:'open'});
        const styles = document.createElement("style");
        this.root.appendChild(styles);

       async  function loadcss(){

            const request = await fetch("/css/style.css");
            const css = await request.text();
            styles.textContent=css;
        }
        // loadcss();
    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        const template = document.getElementById("login-forgetpassword");
        const content = template.content.cloneNode(true);
        this.root.appendChild(content);
    }
}

customElements.define("forget-password-page", LoginForgetpassword);



