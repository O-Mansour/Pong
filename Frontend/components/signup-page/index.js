import updateLanguageContent from "../../js/lagages.js";

export class LoginSignup extends  HTMLElement
{
    constructor()
    {
        super();

    }
    
     // when the component is attached to the dom 

    connectedCallback()
    {

        const template = document.getElementById("login-signup");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        updateLanguageContent();

    }
}

customElements.define("signup-page", LoginSignup);