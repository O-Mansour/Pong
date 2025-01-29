import updateLanguageContent from "../../js/language.js";
import { go_to_page, isUserAuth, set_online, alertMessage } from "../../js/utils.js";

export class LoginSignup extends HTMLElement {

    constructor() 
    {
        super();
        this.handleSignup = this.handleSignup.bind(this);
    }

    connectedCallback() {
        (async () => {
            const isAuthenticated = await isUserAuth();
            if (isAuthenticated) {
                go_to_page('/home');
                return;
            }
            
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
        })();
    }

    disconnectedCallback() {
        this.querySelector('.signup-box').removeEventListener('submit', this.handleSignup);
    }

    async handleSignup(e) {
        e.preventDefault();

        const username = this.querySelector('#username').value.trim();
        const email = this.querySelector('#email').value.trim();
        const password = this.querySelector('#password').value;
        const confirmPassword = this.querySelector('#confirm_password').value;

        if (!username || !email || !password || !confirmPassword)
        {
            alertMessage('All required fields must be filled out!');
            return;
        }
        
        if (password !== confirmPassword) {
            alertMessage('Passwords do not match!');
            return;
        }

        try {
            const response = await fetch('/auth/register/', {
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
            set_online();
            go_to_page('/home');
        } catch (error) {
            alertMessage('An error occurred. Try again');
        }
    }
}

customElements.define("signup-page", LoginSignup);
