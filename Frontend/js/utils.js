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
