import { event } from "../link/index.js";

export class Setting extends  HTMLElement
{
    constructor()
    {
        super();
        
    }

    connectedCallback()
    {
        const template = document.getElementById("setting");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        this.fetchsettingsData();
        // this.setupUpdateInfo();
        // this.setPasswordChange();


        // // Initialize content
        // this.initTranslations();
        // this.setupLanguageSwitcher();
    }
    async fetchsettingsData() {
        try {
            const response = await fetch('http://localhost:8000/api/profiles/me/'); 
            const data = await response.json(); 

            console.log("Settings data received:", data);

            const imgElement= document.querySelector('.img_change');
            const Elementfirstname =document.querySelector('input[placeholder="Firstname"]');
            const Elementlastname= document.querySelector('input[placeholder="Lastname"]');
            const Elementusername = document.querySelector('input[placeholder="Username"]');
            const Elementemail = document.querySelector('input[placeholder="Email"]');

            if(imgElement && Elementfirstname && Elementlastname && Elementusername && Elementemail)
            {
                imgElement.src = `http://localhost:8000${data.profileimg}`;
                Elementfirstname.value= data.firstname;
                Elementlastname.value= data.lastname;
                Elementusername.value= data.username;
                Elementemail.value= data.email;
            }

            const logoutButton = document.querySelector(".logee");
            logoutButton.addEventListener("click", () => {
                const url = '/';
                history.pushState({url}, null, url);  //history.pushState to change the browser’s URL without reloading the page
                document.dispatchEvent(event);
            });

            const updateButton = document.querySelector('.update-btn');
            
            updateButton.addEventListener('click', async (event) => {
            event.preventDefault(); 

            try {
                const response = await fetch('http://localhost:8000/api/profiles/me/', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
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

                if (!oldPassword.value || !newPassword.value)
                    return;

                try {
                    const response = await fetch('http://localhost:8000/api/profiles/me/', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            password: newPassword.value
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to change password');
                    }
                    const result = await response.json();
                    alert('Password changed successfully');

                    // Clear the input fields
                    oldPassword.value = '';
                    newPassword.value = '';
                } catch (error) {
                    console.error('Error changing password:', error);
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

// setupLanguageSwitcher() {
//     // Listen for changes in language selection
//     const languageSelect = this.querySelector("#languageSelect");
//     if (languageSelect) {
//         languageSelect.addEventListener("change", (event) => {
//             const selectedLanguage = event.target.value;
//             i18next.changeLanguage(selectedLanguage, (err) => {
//                 if (err) console.error(err);
//                 this.updateContent(); // Update UI with the new language
//             });
//         });
//     }
// }

// updateContent() {
//     // Dynamically update text content
//     this.querySelector("#changePictureLabel").textContent = i18next.t("changePicture");
//     this.querySelector("#logoutLabel").textContent = i18next.t("logout");
//     this.querySelector("#changeAccountLabel").innerHTML = i18next.t("changeAccount");
//     this.querySelector("#updateBtnLabel").textContent = i18next.t("update");
//     this.querySelector("#changePasswordLabel").textContent = i18next.t("changePassword");
//     this.querySelector("#gameSettingsLabel").textContent = i18next.t("gameSettings");

//     // Update placeholders
//     this.querySelector("#firstNameInput").placeholder = i18next.t("firstName");
//     this.querySelector("#lastNameInput").placeholder = i18next.t("lastName");
//     this.querySelector("#usernameInput").placeholder = i18next.t("username");
//     this.querySelector("#emailInput").placeholder = i18next.t("email");
//     this.querySelector("#oldPasswordInput").placeholder = i18next.t("oldPassword");
//     this.querySelector("#newPasswordInput").placeholder = i18next.t("newPassword");
// }

}

customElements.define("setting-page",Setting);