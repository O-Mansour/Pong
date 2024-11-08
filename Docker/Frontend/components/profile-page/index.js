export class Profile extends  HTMLElement
{
    constructor()
    {
        super();
    }

    connectedCallback()
    {
        const template = document.getElementById("profile");
        const content = template.content.cloneNode(true);
        this.appendChild(content);

        this.fetchProfileData();
    }

    async fetchProfileData() {
      try {
        const response = await fetch('http://localhost:8000/profiles/me/');
        const data = await response.json();
        console.log("Profile data received:", data);
        const usernameElement = document.getElementById('fetched_username');
        const fullnameElement = document.getElementById('fetched_fullname');
        const joinedElement = document.getElementById('fetched_joined');

        const tour_playedElement = document.getElementById('fetched_tour_played');
        const tour_wonElement = document.getElementById('fetched_tour_won');

        const matches_played = document.getElementById('fetched_matches_played');
        const matches_won = document.getElementById('fetched_matches_won');

        // const rankElement = document.getElementById('fetched_rank');
        // const friendsElement = document.getElementById('fetched_friends');

        if (usernameElement && fullnameElement && joinedElement && tour_playedElement && 
            tour_wonElement  && matches_played && matches_won)
        {
            usernameElement.textContent = data.username;
            fullnameElement.textContent = `${data.firstname} ${data.lastname}`;
            joinedElement.textContent = data.date_joined;

            tour_playedElement.textContent = data.tour_played;
            tour_wonElement.textContent = data.tour_won;

            matches_played.textContent = data.wins + data.losses;
            matches_won.textContent = data.wins;

            
        }


      } catch (error) {
        console.error('Error fetching profile:', error);
      }
  }
}

customElements.define("profile-page", Profile);
