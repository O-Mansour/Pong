export class LoginSignup extends  HTMLElement
{
    constructor() {
        super();
    }

    connectedCallback()
    {
        const template = document.getElementById("login-signup");
        const content = template.content.cloneNode(true);
        this.appendChild(content);

    }
}

customElements.define("signup-page", LoginSignup);