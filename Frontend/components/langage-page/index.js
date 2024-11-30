// export class langage extends  HTMLElement
// {
//     constructor()
//     {
//         super();
//     }

//      // when the component is attached to the dom 

//     connectedCallback()
//     {
//         const template = document.getElementById("langage-id");
//         const content = template.content.cloneNode(true);
//         this.appendChild(content);
//     }

    // i18next.init(
    //     {
    //       lng: "en", // Default language
    //       debug: true, // Enable debugging
    //       resources: {
    //         en: {
    //           translation: {
    //             selectLanguage: "Select language",
    //             firstName: "First name",
    //             lastName: "Last name",
    //             ChangeAccountInformations:"Change Account<br /> Informations",
    //           },
    //         },
    //         fr: {
    //           translation: {
    //             selectLanguage: "Sélectionnez la langue",
    //             firstName: "Prénom",
    //             lastName: "Nom de famille",
    //             ChangeAccountInformations:"Change Account",
    //           },
    //         },
    //       },
    //     },
    //     function (err, t) {
    //       if (err) {
    //         console.error("Error initializing i18next:", err);
    //         return;
    //       }
    //       updateContent(); // Set initial content
    //     }
    //   );
      

    //   // Function to update text content dynamically
      
    //   function updateContent() {
    //     document.getElementById("select_1").textContent = i18next.t("selectLanguage");
    //     document.getElementById("chang_accont").textContent = i18next.t("ChangeAccountInformations");
    //     document.getElementById("lastNameLabel").textContent = i18next.t("lastName");
    //   }
      
    //   // Function to change language
    //   function changeLanguage(language) {
    //     console.long("test");
    //     i18next.changeLanguage(language, function (err, t) {
    //       if (err) {

    //         console.error("Error changing language:", err);
    //         return;
    //       }
    //       updateContent();
    //     });
    //   }

    // i18next.init(
    //     {
    //         lng: "en",
    //         debug: true,
    //         resources: {
    //             en: {
    //                 translation: {
    //                     changePicture: "Change Picture",
    //                     logout: "Logout",
    //                     changeAccount: "Change Account<br />Informations",
    //                     update: "Update",
    //                     changePassword: "Change Password",
    //                     gameSettings: "Game Settings",
    //                     firstName: "First Name",
    //                     lastName: "Last Name",
    //                     username: "Username",
    //                     email: "Email",
    //                     oldPassword: "Old Password",
    //                     newPassword: "New Password",
    //                 },
    //             },
    //             fr: {
    //                 translation: {
    //                     changePicture: "Changer l'image",
    //                     logout: "Se déconnecter",
    //                     changeAccount: "Modifier le compte<br />Informations",
    //                     update: "Mettre à jour",
    //                     changePassword: "Changer le mot de passe",
    //                     gameSettings: "Paramètres de jeu",
    //                     firstName: "Prénom",
    //                     lastName: "Nom",
    //                     username: "Nom d'utilisateur",
    //                     email: "Email",
    //                     oldPassword: "Ancien mot de passe",
    //                     newPassword: "Nouveau mot de passe",
    //                 },
    //             },
    //             es: {
    //                 translation: {
    //                     changePicture: "Cambiar imagen",
    //                     logout: "Cerrar sesión",
    //                     changeAccount: "Cambiar cuenta<br />Información",
    //                     update: "Actualizar",
    //                     changePassword: "Cambiar contraseña",
    //                     gameSettings: "Configuración del juego",
    //                     firstName: "Nombre",
    //                     lastName: "Apellido",
    //                     username: "Nombre de usuario",
    //                     email: "Correo electrónico",
    //                     oldPassword: "Contraseña antigua",
    //                     newPassword: "Nueva contraseña",
    //                 },
    //             },
    //         },
    //     },
    //     (err, t) => {
    //         if (err) console.error(err);
    //     }
    // );
    















// }

// customElements.define("langage-page", langage);