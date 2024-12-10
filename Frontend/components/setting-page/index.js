import updateLanguageContent from "../../js/lagages.js";
import { event } from "../link/index.js";
import {requireAuth} from "../../js/utils.js";
import {go_to_page} from "../../js/utils.js";
import {set_offline} from "../../js/utils.js";

export class Setting extends  HTMLElement
{
    constructor()
    {
        super();
    }

    connectedCallback()
    {
        requireAuth();
        const template = document.getElementById("setting");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        this.fetchsettingsData();
        updateLanguageContent();

        this.querySelector('.logee').addEventListener('click', logout);
        document.getElementById("ch")?.addEventListener("change", setLanguage);
    }
    async fetchsettingsData() {
        try {
            const response = await fetch('http://localhost:8000/api/profiles/me/', {
                headers: {
                  'Authorization': `JWT ${localStorage.getItem('access_token')}`
                }
            });
            const data = await response.json(); 

            const imgElement= document.querySelector('.img_change');
            const Elementfirstname =document.querySelector('#firstNameInput');
            const Elementlastname= document.querySelector('#lastNameInput');
            const Elementusername = document.querySelector('#usernameInput');
            const Elementemail = document.querySelector('#emailInput');

            if(imgElement && Elementfirstname && Elementlastname && Elementusername && Elementemail)
            {
                imgElement.src = `http://localhost:8000${data.profileimg}`;
                Elementfirstname.value= data.firstname;
                Elementlastname.value= data.lastname;
                Elementusername.value= data.username;
                Elementemail.value= data.email;
            }

            // const logoutButton = document.querySelector(".logee");
            // logoutButton.addEventListener("click", () => {
            //     const url = '/';
            //     history.pushState({url}, null, url);  //history.pushState to change the browser’s URL without reloading the page
            //     document.dispatchEvent(event);
            // });

            const updateButton = document.querySelector('.update-btn');
            
            updateButton.addEventListener('click', async (event) => {
            event.preventDefault(); 

            try {
                const response = await fetch('http://localhost:8000/api/profiles/me/', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `JWT ${localStorage.getItem('access_token')}`
                    },
                    body: JSON.stringify({
                        firstname: Elementfirstname.value,
                        lastname: Elementlastname.value,
                        username: Elementusername.value,
                        email: Elementemail.value
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to update user information');
                }
                const result = await response.json();
                console.log('User information updated successfully:', result);
            } catch (error) {
                console.error('Error updating user information:', error);
            }
        });

        const changePasswordButton = document.querySelector('.btn_ch');
        changePasswordButton.addEventListener('click', async (event) => {
                event.preventDefault();
                const oldPassword = document.querySelector('input[placeholder="Old Password"]');
                const newPassword = document.querySelector('input[placeholder="New Password"]');

                if (!oldPassword || !newPassword.value)
                    return;

                try {
                    const response = await fetch('http://localhost:8000/api/profiles/change_password/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `JWT ${localStorage.getItem('access_token')}`
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
                    alert('Password changed successfully');

                    // Clear the input fields
                    oldPassword.value = '';
                    newPassword.value = '';
                } catch (error) {
                    console.error('Error changing password:', error);
                    alert(error);
                }
            });

            const changePictureButton = document.querySelector('.chg1');
            const fileInput = document.querySelector('#fileInput');
            const pictureElement = document.querySelector('.img_change');

            changePictureButton.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', async (event) => {
                // Check if a file is selected
                const file = event.target.files[0];
                if (!file) {
                    alert('No file selected!');
                    return;
                }

                if (file.type !== 'image/jpeg') {
                    alert('Only JPG files are supported.');
                    return;
                }

                // Prepare the picture data
                const picData = new FormData();
                picData.append('profileimg', file);
            
                try {
                    const response = await fetch('http://localhost:8000/api/profiles/me/', {
                        method: 'PUT',
                        headers: {
                            'Authorization': `JWT ${localStorage.getItem('access_token')}`
                        },
                        body: picData
                    });
            
                    if (!response.ok) {
                        const errorData = await response.json();
                        // Extract profileimg error message if available
                        const profileImgError = errorData.profileimg ? errorData.profileimg.join(', ') : 'Unknown error';
                        alert('Failed to update profile picture: ' + profileImgError);
                        throw new Error(profileImgError);
                    }
            
                    const result = await response.json();
                    pictureElement.src = `http://localhost:8000${result.profileimg}`;
                } catch (error) {
                    console.error('Error updating profile picture:', error);
                }
            });
        } catch (error) {
        console.error('Error fetching settings:', error); 
        }
    }
}

function logout() {
    const refresh_token = localStorage.getItem('refresh_token');
    
    // Call backend to blacklist token
    fetch('http://localhost:8000/auth/logout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token })
    }).finally(() => {
        set_offline();
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        go_to_page('/');
    });
}

async function setLanguage(event)
{
    try {
        const selectedLang = event.target.value;
        localStorage.setItem('lang', selectedLang);

        const response = await fetch('http://localhost:8000/api/profiles/me/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `JWT ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                language: selectedLang
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to change language');
        }

        updateLanguageContent();
    } catch (error) {
        console.error('Error changing language:', error);
    }
}

customElements.define("setting-page",Setting);
