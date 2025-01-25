import updateLanguageContent from "../../js/language.js";
import { event } from "../link/index.js";
import { go_to_page, isUserAuth } from "../../js/utils.js";
import { set_online } from "../../js/utils.js";
import langData from "../../js/language.js";

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
            
            // Add event listeners
            this.loginForm.addEventListener('submit', this.handleSubmit);
            this.intraButton.addEventListener('click', this.handleFTLogin);
            
            // Handle callback if redirected back with tokens
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

    // disconnectedCallback() {
    //     // Clean up event listeners
    //     this.loginForm.removeEventListener('submit', this.handleSubmit);
    //     this.intraButton.removeEventListener('click', this.handleFTLogin);
    // }


    async handleSubmit(e) {
        e.preventDefault();
        
        const username = this.querySelector('#username').value;
        const password = this.querySelector('#password').value;

        try {
            const response = await fetch('https://localhost:8000/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || 'Login failed');

            // localStorage.setItem('access_token', data.access);
            // localStorage.setItem('refresh_token', data.refresh);
            const url = '/home';
            history.pushState({url}, null, url);
            document.dispatchEvent(event);
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
            // Fetch the authorization URL from the backend
            const response = await fetch('https://localhost:8000/auth/42login/');

            const data = await response.json();
            if (response.ok && data.authorization_url) {
                // Redirect the user to the 42 authorization URL
                window.location.href = data.authorization_url;
            } else {
                throw new Error(data.error || 'Failed to initiate 42 login.');
            }
        } catch (error) {
            // Show the error message
            const currLang = localStorage.getItem('lang') || 'en';
            this.errorMessage.style.display = 'block';
            this.errorMessage.textContent = langData[currLang]?.login_error || error.message;
        }
    }

    async handleOAuthCallback() {
        // Check if the current URL contains an authorization code
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            try {
                // Send the authorization code to the backend to exchange for JWT tokens
                const response = await fetch(`https://localhost:8000/auth/42callback/?code=${code}`, {
                    method: 'GET',
                    credentials: 'include'
                });

                const data = await response.json();
                if (response.ok) {
                    // Store JWT tokens in localStorage
                    // localStorage.setItem('access_token', data.access_token);
                    // localStorage.setItem('refresh_token', data.refresh_token);

                    set_online();
                    const url = '/home';
                    history.pushState({url}, null, url);
                    document.dispatchEvent(event);
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

// customElements ketkhd deux parameter  paramer awal kakon fih nom dil components li ankhdm bih b melf html
 //parameter  2  object ou class inhert les elements html
 //plus nom compontes khs tkon fih (-)=>login-page

 //connectedCallback => ket3rf lia  html 
