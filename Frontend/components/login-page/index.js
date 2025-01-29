import updateLanguageContent from "../../js/language.js";
import langData from "../../js/language.js";
import { go_to_page, isUserAuth, set_online } from "../../js/utils.js";

export class LoginPage extends HTMLElement
{
    constructor() {
        super();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleFTLogin = this.handleFTLogin.bind(this);
        this.handleOAuthCallback = this.handleOAuthCallback.bind(this);
    }

    connectedCallback() {
        (async () => {
            const isAuthenticated = await isUserAuth();
            if (isAuthenticated) {
                go_to_page('/home');
                return;
            }

            const template = document.getElementById("login-page");
            const content = template.content.cloneNode(true);
            this.appendChild(content);
            updateLanguageContent();
            
            this.loginForm = this.querySelector('.login-box');
            this.errorMessage = this.querySelector('#errorMessage');
            this.intraButton = this.querySelector('.intra-login');
            
            this.loginForm.addEventListener('submit', this.handleSubmit);
            this.intraButton.addEventListener('click', this.handleFTLogin);
            
            this.handleOAuthCallback();
            
            document.querySelector('.click_eye').addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                if (passwordInput.type == 'password') {
                    passwordInput.type = 'text';
                    document.querySelector('.eye').src = "./images/open_eye.png";
                } else {
                    passwordInput.type = 'password';
                    document.querySelector('.eye').src = "./images/closed_eye.png";
                }
            });

        })();
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const username = this.querySelector('#username').value;
        const password = this.querySelector('#password').value;

        try {
            const response = await fetch('/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || 'Login failed');
            go_to_page('/home');
            set_online();
        } catch (error) {
            const currLang = localStorage.getItem('lang') || 'en';
            this.errorMessage.style.display = 'block';
            this.errorMessage.textContent = langData[currLang]?.login_error || error.message;
        }
    }

    async handleFTLogin(e) {
        e.preventDefault();
        try {
            const response = await fetch('/auth/42login/');

            const data = await response.json();
            if (response.ok && data.authorization_url) {
                window.location.href = data.authorization_url;
            } else {
                throw new Error(data.error || 'Failed to initiate 42 login.');
            }
        } catch (error) {
            const currLang = localStorage.getItem('lang') || 'en';
            this.errorMessage.style.display = 'block';
            this.errorMessage.textContent = langData[currLang]?.login_error || error.message;
        }
    }

    async handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            try {
                const response = await fetch(`/auth/42callback/?code=${code}`);

                const data = await response.json();
                if (response.ok) {
                    set_online();
                    go_to_page('/home');
                } else {
                    throw new Error(data.error || 'Failed to authenticate with 42.');
                }
            } catch (error) {
                const currLang = localStorage.getItem('lang') || 'en';
                this.errorMessage.style.display = 'block';
                this.errorMessage.textContent = langData[currLang]?.login_error || error.message;
            }
        }
    }
}

customElements.define("login-page", LoginPage);
