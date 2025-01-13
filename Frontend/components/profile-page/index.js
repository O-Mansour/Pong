import updateLanguageContent from "../../js/lagages.js";
import {alertMessage, requireAuth} from "../../js/utils.js";

export class Profile extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback()
  {
    requireAuth();
    const template = document.getElementById("profile");
    const content = template.content.cloneNode(true);
    this.appendChild(content);
    updateLanguageContent();
    this.fetchProfileData();
    this.fetchFriendsList();
    this.fetchMatchHistory();
  }

  async fetchProfileData() {
    try {
      const response = await fetch('http://localhost:8000/api/profiles/me/', {
        headers: {
          'Authorization': `JWT ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      // console.log("Profile data received:", data);
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
      const onlineElement = document.querySelector('.online-status_1');

      if (usernameElement && fullnameElement && joinedElement && tour_playedElement &&
          tour_wonElement && matches_played && matches_won && friendsElement &&
          xpElement && imgElement && onlineElement) 
        {
            usernameElement.textContent = data.username;
            fullnameElement.textContent = `${data.firstname} ${data.lastname}`;

            joinedElement.textContent = " " + data.date_joined;

            tour_playedElement.textContent = data.tour_played;
            tour_wonElement.textContent = data.tour_won;
            friendsElement.textContent = data.current_friends;

            matches_played.textContent = data.wins + data.losses;
            matches_won.textContent = data.wins;

            xpElement.textContent = data.xps;
            levelElement.textContent = data.level;

        imgElement.src = `http://localhost:8000${data.profileimg}`;
        if (data.is_online == false)
          onlineElement.classList.remove('online-status_1');
      }

      if (data.rank == null){
        rankElement.style.fontSize = "18px";
        rankElement.textContent = "Not ranked yet";
        rankElement.setAttribute('data-i18n', 'notRankedYet');
      }
      else
        rankElement.textContent = '#' + data.rank;

      let progressPercentage = 0;
      const maxXp = 100;
      if (data.xps > 0)
        progressPercentage = (data.xps / maxXp) * 100;

      document.querySelector('.progress_2').style = `--xp:${progressPercentage}%`;

      // Calculate win and loss percentages
      let winPercentage = 100;
      if (data.wins + data.losses > 0)
        winPercentage = Math.ceil((data.wins / (data.wins + data.losses)) * 100);
      const lossPercentage = 100 - winPercentage;

      document.querySelector('.charts').style = `--per:${winPercentage}%`;
      document.querySelector('.percentagee_loss').textContent = lossPercentage + '%';
      document.querySelector('.percentagee_winn').textContent = winPercentage + '%';

      updateLanguageContent();
    } catch (error) {
      alertMessage('Error fetching profile data : ' + error.message);

    }
  }

  async fetchFriendsList() {
    try {
      const response = await fetch('http://localhost:8000/api/friendships/friends', {
        headers: {
            'Authorization': `JWT ${localStorage.getItem('access_token')}`
        }
      });

      const friendsData = await response.json();
      const friendsList = document.querySelector('.Friend_list');

      friendsData.forEach(friend => {
        const friendDiv = document.createElement('div');
        friendDiv.classList.add('leader_1');

        friendDiv.innerHTML = `

                <div class="status_img">
                  <img src="http://localhost:8000${friend.profileimg}" class="img_leader1">
                   <span class="active" style="--color: ${friend.is_online ? '#37C25E' : '#941b1b'}"/>
                </div>
                <span class="leader-name_1">${friend.firstname} ${friend.lastname}</span>
                <div class="leader-username_1">@${friend.username}</div>
                <button class="message-btn_1" data-i18n="changefriend" onclick='go_to_page("/select")'>Challenge</button>`;

        friendsList.appendChild(friendDiv);
        updateLanguageContent();
      });
    } catch (error) {
      alertMessage('Error fetching friend list : ' + error.message);
    }
  }

  // match history

  async fetchMatchHistory() {
    try {
      const response = await fetch('http://localhost:8000/api/matches', {
        headers: {
            'Authorization': `JWT ${localStorage.getItem('access_token')}`
        }
      });
      const historyData = await response.json();

      const historyList = document.querySelector('.list_hostory');

      // console.log("History data received:", historyData);
      historyData.forEach(match => {
        const matchDiv = document.createElement('div');
        matchDiv.classList.add('history_1');

        matchDiv.innerHTML = `
                  <span class="vs">VS</span>
                  <img src="${match.opponent_profile.profileimg}" class="img_vs1">
                  <span class="opp_user">${match.opponent_profile.username}</span>
                  <div>
                      <img src="${match.won ? './images/accueil(1).png' : './images/Close.png'}" class="img_valide">
                      <span class="opp_win" data-i18n="${match.won ? 'win_2' : 'loss_1'}"></span>
                  </div>
                  <span class="date">${match.date_played}</span>`;

        historyList.appendChild(matchDiv);

        const barDiv = document.createElement('div');
        barDiv.classList.add('progress_3');
        barDiv.innerHTML = `<div class="bar3" style="width: 100%;"></div>`;

        historyList.appendChild(barDiv);
        updateLanguageContent();
      });
    } catch (error) {
      alertMessage('Error fetching match history : ' + error.message);
    }
  }
}

customElements.define("profile-page", Profile);

/* <span class="opp_win">${match.won ? 'Win' : 'Loss'}</span> */
