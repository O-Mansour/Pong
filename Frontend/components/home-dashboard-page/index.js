import updateLanguageContent from "../../js/language.js";
import langData from "../../js/language.js";
import {isUserAuth, alertMessage, fetchProtectedUrl, go_to_page} from "../../js/utils.js";

export class HomeDashboard extends  HTMLElement
{
    constructor()
    {
        super();
    }
    
    connectedCallback()
    {
      (async () => {
        const isAuthenticated = await isUserAuth();
        if (!isAuthenticated) {
            go_to_page('/');
            return;
        }

        const template = document.getElementById("home-dashboard");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        updateLanguageContent();
        this.fetchDashbordData();
        this.fetchNotfication();
        this.fetchTotalPlayers();
      })();
    }

  async fetchDashbordData() {
    try {
      const response = await fetchProtectedUrl('/api/profiles/me/');
      
      const data = await response.json();

      const fullnameElement = document.getElementById('fetched_fullname');
      const xpElement = document.getElementById('fetched_xp');
      const levelElement = document.getElementById('fetched_level');
      const imgElement = document.querySelector('.prof');
      const matches_played = document.getElementById('fetched_matches_played');
      const matches_won = document.getElementById('fetched_matches_won');
      const Element_totalgame = document.getElementById("fetched_total_game");
      const Element_gametoday =document.getElementById("fetched_game_tody");
      const Element_playin_now = document.getElementById("fetched_playin_now");
      const Element_yourrank = document.getElementById("fetched_yourrank");


      if (fullnameElement && xpElement &&  levelElement && matches_played && matches_won && Element_totalgame
        && Element_gametoday && Element_playin_now && Element_yourrank)
      {
          fullnameElement.textContent = `${data.firstname} ${data.lastname}`;

            xpElement.textContent = data.xps;
            levelElement.textContent = data.level;
              let progressPercentage = 0;
              const maxXp = 100;
              if (data.xps > 0)
                progressPercentage = (data.xps / maxXp) * 100;
            document.querySelector('.ft_progress').style = `--xp:${progressPercentage}%`;

          imgElement.src = `${data.profileimg_url}`;


          matches_played.textContent = data.wins + data.losses;
          matches_won.textContent = data.wins;

          let winPercentage = 100;
          if (data.wins + data.losses > 0)
            winPercentage = Math.ceil((data.wins / (data.wins + data.losses)) * 100);
          const lossPercentage = 100 - winPercentage;
    
          document.querySelector('.chart').style = `--per:${winPercentage}%`;
          document.querySelector('.percentage_loss').textContent = lossPercentage + '%';
          document.querySelector('.percentage_win').textContent = winPercentage + '%';


          if (data.rank == null) {
            Element_yourrank.style.fontSize = "18px";
            Element_yourrank.textContent = "Not ranked yet";
            Element_yourrank.setAttribute('data-i18n', 'notRankedYet');
          }
          else {
            Element_yourrank.textContent = '#' + data.rank;
          }

          const total_matches_response = await fetchProtectedUrl('/api/matches/total_matches/');
          const total_matches_data = await total_matches_response.json();
          Element_totalgame.textContent = total_matches_data.total_matches;

          const matches_today_response = await fetchProtectedUrl('/api/matches/total_today_matches/');
          const matches_today_data = await matches_today_response.json();
          Element_gametoday.textContent = matches_today_data.total_today_matches;

          const online_users_response = await fetchProtectedUrl('/api/profiles/online_users/');
          const online_users_data = await online_users_response.json();
          Element_playin_now.textContent = online_users_data.online_users;
          
          updateLanguageContent();
      }
    } catch (error) {
        alertMessage('Error fetching data : ' + error.message);
    }
  }

  async fetchNotfication() {
    try {
      const response = await fetchProtectedUrl('/api/friendships/requests_received');
      const NotifData = await response.json();
      const badge = document.querySelector('.badge');
      const formContainer = document.querySelector("#formContainer");

      if (NotifData.length)
        badge.textContent = NotifData.length;
      else
        badge.style.display = 'none';
      
      NotifData.forEach((sender, index) => {
        const notificationRow = document.createElement("div");
        notificationRow.classList.add("d-flex");

        const acceptButtonId = `accept_request_${index}`;
        const rejectButtonId = `reject_request_${index}`;

        notificationRow.innerHTML = `
            <div class="name_notf">
                <img src="${sender.sender_profile.profileimg_url}" class="img_led">
                <p class="name_invit">${sender.sender_profile.firstname} ${sender.sender_profile.lastname}</p>
            </div>
          
            <div class="reject_accept">
                   <p class="acp_reject"  data-i18n="friendsTitle"> Wants to be your friend </p>
                <div class="controle_B">
                  <button id="${acceptButtonId}" class="btn btn-success me-2" data-i18n="Acpbutton">Accept</button>
                  <button id="${rejectButtonId}" class="btn btn-danger" data-i18n="rejectbutton">Reject</button>
                </div>
            </div>
        `;
        
        formContainer.appendChild(notificationRow);

        const acceptButton = document.getElementById(acceptButtonId);
        const rejectButton = document.getElementById(rejectButtonId);

        acceptButton.addEventListener('click', async (event) => {
          try {
            await fetchProtectedUrl(`/api/friendships/${sender.id}/accept/`);
            acceptButton.disabled = true;
            rejectButton.disabled = true;
          } catch(err) {
              alertMessage("Failed to accept" + err.message);
          }
        });

        rejectButton.addEventListener('click', async (event) => {
          try {
            await fetchProtectedUrl(`/api/friendships/${sender.id}/reject/`);
            acceptButton.disabled = true;
            rejectButton.disabled = true;
          }catch(err) {
            alertMessage("failed to reject" + err.message);
          }
        });

        updateLanguageContent();
      });
    } catch (err) {
      alertMessage("Error fetching data : " + err.message);
    }
  }


  async fetchTotalPlayers() {
    try {
      const response = await fetchProtectedUrl('/api/profiles/me/');
      const data = await response.json();

      const profilesResponse = await fetchProtectedUrl('/api/profiles/');
      const profilesData = await profilesResponse.json();

      const friendsResponse = await fetchProtectedUrl('/api/friendships/friends/');
      const friendsData = await friendsResponse.json();
      let friendsIds = [];
      if (Array.isArray(friendsData)){
        friendsIds = friendsData.map(friend => friend.user_id);
      }

      const SentResponse = await fetchProtectedUrl('/api/friendships/requests_sent');
      const sentData = await SentResponse.json();
      const sentIds = sentData.map(pending => pending.receiver_profile.user_id);

      const receivedResponse = await fetchProtectedUrl('/api/friendships/requests_received');
      const receivedData = await receivedResponse.json();
      const receivedIds = receivedData.map(pending => pending.sender_profile.user_id);

      const currLang = localStorage.getItem('lang') || 'en';

      const total = document.querySelector('#fetched_total_players');
      total.textContent = profilesData.length;
      const leaderboard = document.querySelector('.leadebord');

      leaderboard.innerHTML = '';
      
      profilesData.forEach((leader, index) => {
        const leaderDiv = document.createElement('div');
        leaderDiv.classList.add('leader');
        leaderDiv.innerHTML = `
          <h1>#${index + 1}</h1>
          <img src="${leader.profileimg_url}" class="img_leader">
          <span class="leader-name">${leader.firstname} ${leader.lastname}</span>
          <div class="leader-username">${leader.username}</div>
          `;

        if (leader.id === data.id) {
          const profileBtn = document.createElement('button');
          profileBtn.classList.add('message-btn');
          profileBtn.setAttribute('data-i18n-button', 'myProfile'); 
          profileBtn.textContent = langData[currLang]?.myProfile || 'My Profile';
          profileBtn.setAttribute('onclick', 'go_to_page("/user")');
          leaderDiv.appendChild(profileBtn);
        } else if (friendsIds.includes(leader.user_id)) {
          const playBtn = document.createElement('button');
          playBtn.classList.add('message-btn');
          playBtn.setAttribute('data-i18n-button', 'challenge'); 
          playBtn.textContent = langData[currLang]?.challenge || 'Challenge';
          playBtn.setAttribute('onclick', 'go_to_page("/select")');
          leaderDiv.appendChild(playBtn);
        } else if (sentIds.includes(leader.user_id)) {
          const sentBtn = document.createElement('button');
          sentBtn.classList.add('message-btn');
          sentBtn.setAttribute('data-i18n-button', 'pending');
          sentBtn.textContent = langData[currLang]?.pending || 'Pending..';
          leaderDiv.appendChild(sentBtn);
        } else if (receivedIds.includes(leader.user_id)) {
          const acceptBtn = document.createElement('button');
          acceptBtn.classList.add('add-friend-btn');
          acceptBtn.setAttribute('data-bs-toggle', 'modal');
          acceptBtn.setAttribute('data-bs-target', '#exampleModal');
          acceptBtn.setAttribute('data-i18n-button', 'accept'); 
          acceptBtn.textContent = langData[currLang]?.accept || 'Accept';
          leaderDiv.appendChild(acceptBtn);
        } else {
          const addFriendBtn = document.createElement('button');
          addFriendBtn.classList.add('add-friend-btn');
          addFriendBtn.setAttribute('data-i18n-button', 'addFriend');
          addFriendBtn.textContent = langData[currLang]?.addFriend || 'Add Friend';
          leaderDiv.appendChild(addFriendBtn);
  
          addFriendBtn.addEventListener('click', async () => {
            try {
              const response = await fetchProtectedUrl('/api/friendships/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ receiver: leader.user_id }),
              });
              if (response.ok) {
                addFriendBtn.disabled = true;
                addFriendBtn.classList.remove('add-friend-btn');
                addFriendBtn.classList.add('message-btn');
                addFriendBtn.setAttribute('data-i18n-button', 'pending');
                addFriendBtn.textContent = langData[currLang]?.pending || 'Pending..';
              } else {
                  alertMessage('Failed to send friend request');
                }
              } catch (error) {
                alertMessage("Error adding friend : " + error.message);
              }
            });
          }
          leaderboard.appendChild(leaderDiv);
          updateLanguageContent();
      });
    } catch (error) {
      alertMessage('Error fetching data : ' + error.message);
    }
  }
}

customElements.define("home-dashboard-page", HomeDashboard);
