import updateLanguageContent from "../../js/language.js";
import { alertMessage, isUserAuth, go_to_page, set_offline, fetchProtectedUrl } from "../../js/utils.js";

export class Setting extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        (async () => {
            const isAuthenticated = await isUserAuth();
            if (!isAuthenticated) {
                go_to_page('/');
                return;
            }
            const template = document.getElementById("setting");
            const content = template.content.cloneNode(true);
            this.appendChild(content);
            this.fetchsettingsData();
            updateLanguageContent();

            this.querySelector('.logee')?.addEventListener('click', logout);
            document.getElementById("ch")?.addEventListener("change", setLanguage);
        })();
    }
    
    async fetchsettingsData() {
        try {
            const response = await fetchProtectedUrl('/api/profiles/me/');
            const data = await response.json();

            const imgElement = document.querySelector('.img_change');
            const Elementfirstname = document.querySelector('#firstNameInput');
            const Elementlastname = document.querySelector('#lastNameInput');
            const Elementusername = document.querySelector('#usernameInput');
            const Elementemail = document.querySelector('#emailInput');

            if (imgElement && Elementfirstname && Elementlastname && Elementusername && Elementemail) {
                imgElement.src = `${data.profileimg_url}`;
                Elementfirstname.value = data.firstname;
                Elementlastname.value = data.lastname;
                Elementusername.value = data.username;
                Elementemail.value = data.email;
            }

            const updateButton = document.querySelector('.update-btn');

            updateButton.addEventListener('click', async (event) => {
                event.preventDefault();

                try {

                    if (!Elementfirstname.value.trim() ||
                        !Elementlastname.value.trim() ||
                        !Elementusername.value.trim() ||
                        !Elementemail.value.trim()) {
                            throw new Error('Failed to update user information, empty field.');
                    }

                    const response = await fetchProtectedUrl('/api/profiles/me/', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            firstname: Elementfirstname.value.trim(),
                            lastname: Elementlastname.value.trim(),
                            username: Elementusername.value.trim(),
                            email: Elementemail.value.trim()
                        })
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to update user information');
                    }
                    alertMessage('User information updated successfully.',"alert-success");
                } catch (error) {
                    alertMessage(error.message);
                }

            });

            const changePasswordButton = document.querySelector('.btn_ch');
            changePasswordButton.addEventListener('click', async (event) => {
                event.preventDefault();

                const oldPassword = document.querySelector('#oldPassword');
                const newPassword = document.querySelector('#newPassword');

                if (!newPassword || !newPassword.value.trim())
                {
                    alertMessage('New password field cannot be blank.');
                    return;
                }

                try {
                    const response = await fetchProtectedUrl('/api/profiles/change_password/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            old_password: oldPassword.value,
                            new_password: newPassword.value
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to change password');
                    }
                    alertMessage('Password changed successfully.', "alert-success");
                    oldPassword.value = '';
                    newPassword.value = '';
                } catch (error) {
                   alertMessage(error.message);
                }
            });

            const changePictureButton = document.querySelector('.chg1');
            const fileInput = document.querySelector('#fileInput');
            const pictureElement = document.querySelector('.img_change');

            changePictureButton.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) {
                    alertMessage('No file selected!');
                    return;
                }
                if (file.type !== 'image/jpeg') {
                    alertMessage('Only JPG files are supported.');
                    return;
                }
                const picData = new FormData();
                picData.append('profileimg', file);

                try {
                    const response = await fetchProtectedUrl('/api/profiles/me/', {
                        method: 'PUT',
                        body: picData
                    });

                    if (!response.ok) {
                        const errorData = await response.json();

                        const profileImgError = Array.isArray(errorData.profileimg) ? errorData.profileimg.join(', ') : 'Unknown error';
                        throw new Error('Failed to update profile picture' + profileImgError);
                    }
                    const result = await response.json();
                    pictureElement.src = `${result.profileimg_url}`;
                } catch (error) {
                    alertMessage(error.message);
                }
            });
        } catch (error) {
            alertMessage('Error fetching settings data : ' + error.message);
        }
    }
}


async function logout() {
    try {
        set_offline();
        const response = await fetchProtectedUrl('/auth/logout/', {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error('Failed to logout');
        }
        go_to_page('/');
    } catch (error) {
        alertMessage(error.message);
    }
}

async function setLanguage(event) {
    try {
        const selectedLang = event.target.value;
        const response = await fetchProtectedUrl('/api/profiles/me/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: selectedLang
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to change language');
        }
        localStorage.setItem('lang', selectedLang);
        updateLanguageContent();
    } catch (error) {
        alertMessage('Error changing language : ' + error.message);
    }
}

customElements.define("setting-page", Setting);
