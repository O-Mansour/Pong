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
    if (!token)
    {
        const url = '/';
        history.pushState({url}, null, url);
        document.dispatchEvent(event);
    }
}

// Redirect to home page if authenticated
export function alreadyAuth() {
    const token = localStorage.getItem('access_token');
    if (token)
    {
        const url = '/home';
        history.pushState({url}, null, url);
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
        console.error('Error changing online status:', error);
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
        console.error('Error changing online status:', error);
    }
}

export function go_to_page(url) {
    const go_event = new Event("mylink");
    history.pushState({url}, null, url);
    document.dispatchEvent(go_event);
}
