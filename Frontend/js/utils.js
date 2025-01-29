export function get_access_token() {
    const cookies = document.cookie.split('; ');
    let access_token = null;

    for (let cookie of cookies) {
        if (cookie.startsWith('access_token=')) {
            access_token = cookie.split('=')[1];
            break;
        }
    }
    return access_token;
}

export async function isUserAuth() {
    try {
        let response = await fetch('/api/profiles/me/', {
            method: 'GET',
            credentials: 'include',
        });

        if (response.status === 401) {
            const refreshResponse = await fetch('/auth/refresh_token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!refreshResponse.ok) {
                return false;
            }

            response = await fetch('/api/profiles/me/', {
                method: 'GET',
                credentials: 'include',
            });
        }

        return response.ok;
    } catch (error) {
        return false;
    }
}

export async function set_online() {
    try {
        const response = await fetchProtectedUrl('/api/profiles/me/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
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
        alertMessage(error.message);
    }
}

export async function set_offline() {
    try {
        const response = await fetchProtectedUrl('/api/profiles/me/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
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
        alertMessage(error.message);
    }
}

export function go_to_page(url) {
    const go_event = new Event("mylink");
    history.pushState({ url }, null, url);
    document.dispatchEvent(go_event);
}

export function alertMessage(message, classname = "alert-danger") {
    const a = document.getElementById('alert');
    
    if (!a)
        return;

    const div = document.createElement('div');

    div.className = `alert ${classname} d-flex p-2 gap-2`;
    div.role = "alert";
    div.innerHTML = message + `
        <button type="button" class="btn-close m-0" data-bs-dismiss="alert" aria-label="Close"></button>`;
    
    a.append(div);

    setTimeout(() => {
        if (a.contains(div))
            a.removeChild(div);
    }, 5000);
}


export async function fetchProtectedUrl(url, options = {}) {
    try {
        let response = await fetch(url, {
            ...options,
            credentials: 'include',
        });

        if (response.status === 401) {
            const refreshResponse = await fetch('/auth/refresh_token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!refreshResponse.ok) {
                alertMessage('Session expired, log in again');
                return refreshResponse;
            }

            response = await fetch(url, {
                ...options,
                credentials: 'include',
            });
        }

        return response;
    }
    catch (error) {
        alertMessage('Error while fetching data : ' + error.message);
    }
}
