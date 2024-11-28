import { requireAuth } from '../../js/utils.js';
export class HomeDashboard extends  HTMLElement
{
    constructor() {
        super();
    }

    connectedCallback()
    {
        requireAuth();
        const template = document.getElementById("home-dashboard");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        
    }
}

customElements.define("home-dashboard-page", HomeDashboard);