export class Setting extends  HTMLElement
{
    constructor() {
        super();
    }

    connectedCallback()
    {
        const template = document.getElementById("setting");
        const content = template.content.cloneNode(true);
        this.appendChild(content);

        this.querySelector('.logee').addEventListener('click', logout);
    }
}

function logout() {
    const refresh_token = localStorage.getItem('refresh_token');
    
    // Call backend to blacklist token
    fetch('http://localhost:8000/auth/logout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token })
    }).finally(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
    });
}

customElements.define("setting-page",Setting);
