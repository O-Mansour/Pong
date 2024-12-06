import updateLanguageContent from "../../js/lagages.js";
import { event } from "../link/index.js";
import { alreadyAuth } from "../../js/utils.js";

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

        document.querySelectorAll('.click_eye')[0].addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            if (passwordInput.type == 'password') {
                passwordInput.type = 'text';
                document.querySelector('.eye1').src = "./images/open_eye.png";
            } else {
                passwordInput.type = 'password';
                document.querySelector('.eye1').src = "./images/closed_eye.png";
            }
        });

        document.querySelectorAll('.click_eye')[1].addEventListener('click', () => {
            const passwordInput = document.getElementById('confirm_password');
            if (passwordInput.type == 'password') {
                passwordInput.type = 'text';
                document.querySelector('.eye2').src = "./images/open_eye.png";
            } else {
                passwordInput.type = 'password';
                document.querySelector('.eye2').src = "./images/closed_eye.png";
            }
        });
    }

    // Cleans up the submit event listener to prevent memory leaks
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
            alert('Passwords do not match!');
            return;
        }

        try {
            // Send data to the backend
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
                alert("No valid response");
                return ;
            }
            alert("All is good");
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            const url = '/home';
            history.pushState({url}, null, url);
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again later.');
        }
    }
}

customElements.define("signup-page", LoginSignup);
