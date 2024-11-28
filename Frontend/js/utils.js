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

export function isAuthenticated() {
    const token = localStorage.getItem('access_token');
	return !!token;
    // return token && !isTokenExpired(token); // Token exists and is valid
}

// Redirect to login if not authenticated
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/';
    }
}
