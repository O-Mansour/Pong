

import updateLanguageContent from "../../js/lagages.js";
import langData from "../../js/lagages.js";
import { alertMessage } from "../../js/utils.js";

export class Gamelocal extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const template = document.getElementById("page-gamelocal");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        // const canvas = document.getElementById('game-canva')
    }
}

customElements.define("localgame-game", Gamelocal);

