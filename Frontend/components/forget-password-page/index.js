export class LoginForgetpassword extends  HTMLElement
{
    constructor()
    {
        super();

    }

     // when the component is attached to the dom 

    connectedCallback()
    {
        const template = document.getElementById("login-forgetpassword");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
    }
}

customElements.define("forget-password-page", LoginForgetpassword);



