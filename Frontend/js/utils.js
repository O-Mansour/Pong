import { event } from "../components/link/index.js";

// import jwtDecode from 'jwt-decode';

// export function isTokenExpired(token) {
//     try {
//         const decoded = jwtDecode(token);
//         const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
//         return decoded.exp < currentTime; // Token is expired if exp < current time
//     } catch (e) {
//         return true; // If decoding fails, treat as expired
//     }
// }

// Redirect to login page if not authenticated
export function requireAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        const url = '/';
        history.pushState({ url }, null, url);
        document.dispatchEvent(event);
    }
}

// Redirect to home page if authenticated
export function alreadyAuth() {
    const token = localStorage.getItem('access_token');
    if (token) {
        const url = '/home';
        history.pushState({ url }, null, url);
        document.dispatchEvent(event);
    }
}

export async function set_online() {
    try {
        const response = await fetch('http://localhost:8000/api/profiles/me/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `JWT ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                is_online: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to change online status');
        }
    } catch (error) {
        // console.log('Error changing online status:', error);
        alertMessage(error.message);
    }
}

export async function set_offline() {
    try {
        const response = await fetch('http://localhost:8000/api/profiles/me/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `JWT ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                is_online: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to change online status');
        }
    } catch (error) {
        // console.log('Error changing online status:', error);
        alertMessage(error.message);
    }
}

export function go_to_page(url) {
    const go_event = new Event("mylink");
    history.pushState({ url }, null, url);
    document.dispatchEvent(go_event);
}

// export function go_to_select(url) {
//     const go_event = new Event("mylink");
//     history.pushState({ url }, null, url);
//     document.dispatchEvent(go_event);
//     // const gameContainer = document.getElementById('body_game');
//     // if (gameContainer) {
//     //     gameContainer.style.display = 'none';
//     // }
//     const canvas = document.querySelector('canvas[data-engine="three.js r171"]');
//     if (canvas) {
//         canvas.style.display = 'none'; // Hide the canvas element
//     }
// }

// classname: An optional parameter specifying the CSS class for the alert type (e.g., alert-danger, alert-success).
//div.role = "alert"; =>setattrbuit
export function alertMessage(message, classname = "alert-danger") {
    const a = document.getElementById('alert');
    
    if (!a)
        return;

    const div = document.createElement('div');

    div.className = `alert ${classname} d-flex p-2 gap-2`;
    div.role = "alert";
    //div.setAttribute("role", "alert");
    div.innerHTML = message + `
        <button type="button" class="btn-close m-0" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    a.append(div);

    setTimeout(() => {
        if (a.contains(div))
            a.removeChild(div);
    }, 5000);
}


// alertMessage("hello test", "alert-success");
// alertMessage("hello test");
// alertMessage("hello test");
// alertMessage("hello test");
// alertMessage("hello test");
// alertMessage("hello test");