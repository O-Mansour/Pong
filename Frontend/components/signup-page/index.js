import updateLanguageContent from "../../js/lagages.js";
import { event } from "../link/index.js";
import { alreadyAuth } from "../../js/utils.js";
import { set_online } from "../../js/utils.js";
import { alertMessage} from "../../js/utils.js";
export class LoginSignup extends HTMLElement {

    constructor() 
    {
        super();
        this.handleSignup = this.handleSignup.bind(this); // Bind the method
    }

    connectedCallback() {
        alreadyAuth();
        
        const template = document.getElementById("login-signup");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        updateLanguageContent();

        this.querySelector('.signup-box').addEventListener('submit', this.handleSignup);
        
        const clickEye1 = this.querySelector('.click_eye1');
        const clickEye2 = this.querySelector('.click_eye2');

        if (clickEye1) {
            clickEye1.addEventListener('click', () => {
                const passwordInput = this.querySelector('#password');
                const eyeIcon = this.querySelector('.eye1');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    eyeIcon.src = "./images/open_eye.png";
                } else {
                    passwordInput.type = 'password';
                    eyeIcon.src = "./images/closed_eye.png";
                }
            });
        }

        if (clickEye2) {
            clickEye2.addEventListener('click', () => {
                const confirmPasswordInput = this.querySelector('#confirm_password');
                const eyeIcon = this.querySelector('.eye2');
                if (confirmPasswordInput.type === 'password') {
                    confirmPasswordInput.type = 'text';
                    eyeIcon.src = "./images/open_eye.png";
                } else {
                    confirmPasswordInput.type = 'password';
                    eyeIcon.src = "./images/closed_eye.png";
                }
            });
        }
    }

    disconnectedCallback() {
        this.querySelector('.signup-box').removeEventListener('submit', this.handleSignup);
    }

    async handleSignup(e) {
        e.preventDefault();

        const username = this.querySelector('#username').value;
        const email = this.querySelector('#email').value;
        const password = this.querySelector('#password').value;
        const confirmPassword = this.querySelector('#confirm_password').value;

        if (password !== confirmPassword) {
            alertMessage('Passwords do not match!');
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/auth/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                alertMessage(data.message || "An error occurred. Try again");
                return ;
            }
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);

            set_online();
            const url = '/home';
            history.pushState({url}, null, url);
            document.dispatchEvent(event);
        } catch (error) {
            alertMessage('An error occurred. Try again');
        }
    }
}

customElements.define("signup-page", LoginSignup);
