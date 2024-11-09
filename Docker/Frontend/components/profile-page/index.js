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
        this.fetchAndRenderFriends();
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
        const rankElement = document.getElementById('fetched_rank');
        const friendsElement = document.getElementById('fetched_friends');
        
        const xpElement = document.getElementById('fetched_xp');
        const levelElement = document.getElementById('fetched_level');

        const imgElement = document.querySelector('.prof_1');

        if (usernameElement && fullnameElement && joinedElement && tour_playedElement && 
            tour_wonElement  && matches_played && matches_won && friendsElement &&
            xpElement && imgElement )
        {
            usernameElement.textContent = data.username;
            fullnameElement.textContent = `${data.firstname} ${data.lastname}`;
            joinedElement.textContent = data.date_joined;
            
            tour_playedElement.textContent = data.tour_played;
            tour_wonElement.textContent = data.tour_won;
            friendsElement.textContent = data.current_friends;

            matches_played.textContent = data.wins + data.losses;
            matches_won.textContent = data.wins;

            xpElement.textContent = data.xps;
            levelElement.textContent = data.level;

            imgElement.src = `http://localhost:8000${data.profileimg}`;
        }

        if (data.rank == null)
          rankElement.textContent = "Not ranked yet";
        else
          rankElement.textContent = data.rank;
        
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
  }

  async fetchAndRenderFriends() {
    try {
        const response = await fetch('http://localhost:8000/friendships/friends');
        const friendsData = await response.json();
        const friendsList = document.querySelector('.Friend_list');

        friendsData.forEach(friend => {
            const friendDiv = document.createElement('div');
            friendDiv.classList.add('leader_1');

            friendDiv.innerHTML = `
                <img src="http://localhost:8000${friend.profileimg}" class="img_leader1">
                <span class="leader-name_1">${friend.firstname} ${friend.lastname}</span>
                <div class="leader-username_1">@${friend.username}</div>
                <button class="message-btn_1">Message</button>`;

            friendsList.appendChild(friendDiv);
        });
    } catch (error) {
        console.error('Error fetching friend list:', error);
    }
  }
}

customElements.define("profile-page", Profile);
