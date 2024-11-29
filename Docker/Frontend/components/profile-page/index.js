export class Profile extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback()
  {
    const template = document.getElementById("profile");
    const content = template.content.cloneNode(true);
    this.appendChild(content);
    this.fetchProfileData();
    this.fetchFriendsList();
    this.fetchMatchHistory();
  }

  async fetchProfileData() {
    try {
      const response = await fetch('http://localhost:8000/api/profiles/me/');
      const data = await response.json();
      console.log("Profile data received:", data);
      const usernameElement = document.getElementById('fetched_username');
      const fullnameElement = document.getElementById('fetched_fullname');
      const joinedElement = document.getElementById('fetched_joined');

      const tour_playedElement = document.getElementById('fetched_tour_played');
      const tour_wonElement = document.getElementById('fetched_tour_won');
        // loss and winn
      const matches_played = document.getElementById('fetched_matches_played');
      const matches_won = document.getElementById('fetched_matches_won');

      const rankElement = document.getElementById('fetched_rank');
      const friendsElement = document.getElementById('fetched_friends');

      // xps and leval
      const xpElement = document.getElementById('fetched_xp');
      const levelElement = document.getElementById('fetched_level');

      const imgElement = document.querySelector('.prof_1');
      const onlineElement = document.querySelector('.online-status_1');

      if (usernameElement && fullnameElement && joinedElement && tour_playedElement &&
        tour_wonElement && matches_played && matches_won && friendsElement &&
        xpElement && imgElement && onlineElement) 
        {
        usernameElement.textContent = data.username;
        fullnameElement.textContent = `${data.firstname} ${data.lastname}`;
        //join date 
        joinedElement.textContent = " " + data.date_joined;

        // joinedElement.textContent = `   ${data.date_joined}`;

    
        tour_playedElement.textContent = data.tour_played;
        tour_wonElement.textContent = data.tour_won;
        friendsElement.textContent = data.current_friends;

        // loss and winn
        matches_played.textContent = data.wins + data.losses;
        matches_won.textContent = data.wins;

        // matches_played.textContent = data.wins + data.losses;
        // matches_won.textContent = data.wins;

        xpElement.textContent = data.xps;
        levelElement.textContent = data.level;

    
        imgElement.src = `http://localhost:8000${data.profileimg}`;
        if (data.is_online == false)
          onlineElement.classList.remove('online-status_1');
      }

      if (data.rank == null){
        rankElement.style.fontSize = "18px";
        rankElement.textContent = "Not ranked yet";
      }
      else
        rankElement.textContent = '#' + data.rank;

      // xps and leval
      let progressPercentage = 0;
      const maxXp = 100;
      if (data.xps > 0)
        progressPercentage = (data.xps / maxXp) * 100;
      // if (progressPercentage == 1){
      //   data.xps = 0;
      //   data.level++;
      // }

      // Update the progress bar width
      document.querySelector('.progress_2').style = `--xp:${progressPercentage}%`;

      // Calculate win and loss percentages
      let winPercentage = 100;
      if (data.wins + data.losses > 0)
        winPercentage = Math.ceil((data.wins / (data.wins + data.losses)) * 100);
      const lossPercentage = 100 - winPercentage;

      document.querySelector('.charts').style = `--per:${winPercentage}%`;
      document.querySelector('.percentagee_loss').textContent = lossPercentage + '%';
      document.querySelector('.percentagee_winn').textContent = winPercentage + '%';

    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async fetchFriendsList() {
    try {
      const response = await fetch('http://localhost:8000/api/friendships/friends');
      const friendsData = await response.json();
      const friendsList = document.querySelector('.Friend_list');

      friendsData.forEach(friend => {
        const friendDiv = document.createElement('div');
        friendDiv.classList.add('leader_1');

        friendDiv.innerHTML = `
                <img src="http://localhost:8000${friend.profileimg}" class="img_leader1">
                <span class="leader-name_1">${friend.firstname} ${friend.lastname}</span>
                <div class="leader-username_1">@${friend.username}</div>
                <button class="message-btn_1">Challenge</button>`;

        friendsList.appendChild(friendDiv);
      });
    } catch (error) {
      console.error('Error fetching friend list:', error);
    }
  }

  // match history

  async fetchMatchHistory() {
    try {
      const response = await fetch('http://localhost:8000/api/matches');
      const historyData = await response.json();

      const historyList = document.querySelector('.list_hostory');

      console.log("History data received:", historyData);
      historyData.forEach(match => {
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('history_1');

        matchDiv.innerHTML = `
                  <span class="vs">VS</span>
                  <img src="${match.opponent_profile.profileimg}" class="img_vs1">
                  <span class="opp_user">${match.opponent_profile.username}</span>
                  <div>
                      <img src="${match.won ? './images/accueil(1).png' : './images/Close.png'}" class="img_valide">
                      <span class="opp_win">${match.won ? 'Win' : 'Loss'}</span>
                  </div>
                  <span class="date">${match.date_played}</span>`;

        historyList.appendChild(matchDiv);

        const barDiv = document.createElement('div');
        barDiv.classList.add('progress_3');
        barDiv.innerHTML = `<div class="bar3" style="width: 100%;"></div>`;

        historyList.appendChild(barDiv);
      });
    } catch (error) {
      console.error('Error fetching match history:', error);
    }
  }
}

customElements.define("profile-page", Profile);
