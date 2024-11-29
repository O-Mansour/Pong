export class HomeDashboard extends  HTMLElement
{
    constructor()
    {
        super();
    }

    // when the component is attached to the dom 
    connectedCallback()
    {
        const template = document.getElementById("home-dashboard");
        const content = template.content.cloneNode(true);
        this.appendChild(content);
        this.fetchDashbordData();
        this.fetchNotfication();
        this.fetchTotalPlayers();
    }
  
  async fetchDashbordData() {
    try {
      const response = await fetch(`http://localhost:8000/api/profiles/me/`);
      const data = await response.json();
      console.log("dashbord data received:", data);
      //fullname

      const fullnameElement = document.getElementById('fetched_fullname');
      // xps and leval

      const xpElement = document.getElementById('fetched_xp');
      const levelElement = document.getElementById('fetched_level');
      const imgElement = document.querySelector('.prof');

      // loss and winn

      const matches_played = document.getElementById('fetched_matches_played');
      const matches_won = document.getElementById('fetched_matches_won');


      //
     const Element_totalgame = document.getElementById("fetched_total_game");
     const Element_gametoday =document.getElementById("fetched_game_tody");
     const Element_playin_now = document.getElementById("fetched_playin_now");

     const Element_yourrank = document.getElementById("fetched_yourrank");

      if (fullnameElement && xpElement &&  levelElement && matches_played && matches_won && Element_totalgame
        && Element_gametoday && Element_playin_now && Element_yourrank)
      {
          fullnameElement.textContent = `${data.firstname} ${data.lastname}`;

          // xps and leval
            xpElement.textContent = data.xps;
            levelElement.textContent = data.level;
              let progressPercentage = 0;
              const maxXp = 100;
              if (data.xps > 0)
                progressPercentage = (data.xps / maxXp) * 100;
            document.querySelector('.ft_progress').style = `--xp:${progressPercentage}%`;

          //image
          imgElement.src = `http://localhost:8000${data.profileimg}`;


          matches_played.textContent = data.wins + data.losses;
          matches_won.textContent = data.wins;
          // Calculate win and loss percentages
          let winPercentage = 100;
          if (data.wins + data.losses > 0)
            winPercentage = Math.ceil((data.wins / (data.wins + data.losses)) * 100);
          const lossPercentage = 100 - winPercentage;
    
          document.querySelector('.chart').style = `--per:${winPercentage}%`;
          document.querySelector('.percentage_loss').textContent = lossPercentage + '%';
          document.querySelector('.percentage_win').textContent = winPercentage + '%';

          // need to change that later

          if (data.total_games != null) {
            Element_totalgame.textContent = data.total_games;
          } else {

            Element_totalgame.textContent = '0';
          }
          if (data.games_today != null) {
            Element_gametoday.textContent = data.games_today;
          } else {
            Element_gametoday.textContent = '0';
          }

          if (data.playing_now != null) {
            Element_playin_now.textContent = data.playing_now;
          } else {
            Element_playin_now.textContent = '0';
          }

          // Update your rank
          if (data.rank == null){
            Element_yourrank.style.fontSize = "18px";
            Element_yourrank.textContent = "Not ranked yet";
          }
          else
            Element_yourrank.textContent = '#' + data.rank;
      }
    } catch (error) {
      console.error('Error fetching dashboard :', error);
    }
  }

  async fetchNotfication() {
    try {
      const response = await fetch('http://localhost:8000/api/friendships/requests_received');
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

        // Add unique IDs to buttons
        const acceptButtonId = `accept_request_${index}`;
        const rejectButtonId = `reject_request_${index}`;

        notificationRow.innerHTML = `
            <div class="name_notf">
                <img src="http://localhost:8000${sender.sender_profile.profileimg}" class="img_led">
                <p class="name_invit">${sender.sender_profile.firstname} ${sender.sender_profile.lastname}</p>
            </div>
          
            <div class="reject_accept">
                   <p class="acp_reject"> Wants to be your friend </p>
                <div class="controle_B">
                  <button id="${acceptButtonId}" class="btn btn-success me-2" >Accept</button>
                  <button id="${rejectButtonId}" class="btn btn-danger">Reject</button>
                </div>
            </div>
        `;
        
        formContainer.appendChild(notificationRow);

        // Use the unique ID to select each button
        const acceptButton = document.getElementById(acceptButtonId);
        const rejectButton = document.getElementById(rejectButtonId);

        acceptButton.addEventListener('click', async (event) => {
          try {
            await fetch(`http://localhost:8000/api/friendships/${sender.id}/accept/`);
            acceptButton.textContent = "Accepted";
            acceptButton.disabled = true;
            rejectButton.disabled = true;
          } catch(err) {
              console.log("failed to accept", err.message);
          }
        });

        rejectButton.addEventListener('click', async (event) => {
          try {
            await fetch(`http://localhost:8000/api/friendships/${sender.id}/reject/`);
            rejectButton.textContent = "Rejected";
            acceptButton.disabled = true;
            rejectButton.disabled = true;
          }catch(err) {
            console.log("failed to reject", err.message);
          }
        });
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }


  async fetchTotalPlayers() {
    try {
      const response = await fetch('http://localhost:8000/api/profiles/me/');
      const data = await response.json();

      const profilesResponse = await fetch('http://localhost:8000/api/profiles/');
      const profilesData = await profilesResponse.json();

      const friendsResponse = await fetch('http://localhost:8000/api/friendships/friends/');
      const friendsData = await friendsResponse.json();
      const friendsIds = friendsData.map(friend => friend.user_id);

      const SentResponse = await fetch('http://localhost:8000/api/friendships/requests_sent');
      const SentData = await SentResponse.json();
      const SentIds = SentData.map(pending => pending.receiver_profile.user_id);

      const receivedResponse = await fetch('http://localhost:8000/api/friendships/requests_received');
      const receivedData = await receivedResponse.json();
      const receivedIds = receivedData.map(pending => pending.sender_profile.user_id);

      const total = document.querySelector('#fetched_total_players');
      total.textContent = profilesData.length;
      const leaderboard = document.querySelector('.leadebord');

      profilesData.forEach((leader, index) => {
        const leaderDiv = document.createElement('div');
        leaderDiv.classList.add('leader');
        leaderDiv.innerHTML = `
          <h1>#${index + 1}</h1>
          <img src="${leader.profileimg}" class="img_leader">
          <span class="leader-name">${leader.firstname} ${leader.lastname}</span>
          <div class="leader-username">${leader.username}</div>
          `;
          
          if (leader.id == data.id)
          {
            const profileBtn = document.createElement('button');
            profileBtn.classList.add('message-btn');
            profileBtn.textContent = 'My Profile';
            profileBtn.setAttribute('onclick', 'window.location.href="/user"');
            leaderDiv.appendChild(profileBtn);
          }
          else if (friendsIds.includes(leader.user_id)){
            const playBtn = document.createElement('button');
            playBtn.classList.add('message-btn');
            playBtn.textContent = 'Challenge';
            leaderDiv.appendChild(playBtn);
          }
          else if (SentIds.includes(leader.user_id)){
            const SentBtn = document.createElement('button');
            SentBtn.classList.add('message-btn');
            SentBtn.textContent = 'Pending..';
            leaderDiv.appendChild(SentBtn);
          }
          else if (receivedIds.includes(leader.user_id)){
            const AcceptBtn = document.createElement('button');
            AcceptBtn.classList.add('add-friend-btn');
            AcceptBtn.setAttribute('data-bs-toggle', 'modal');
            AcceptBtn.setAttribute('data-bs-target', '#exampleModal');
            AcceptBtn.textContent = 'Accept';
            leaderDiv.appendChild(AcceptBtn);
          }
          else {
            const addFriendBtn = document.createElement('button');
            addFriendBtn.classList.add('add-friend-btn');
            addFriendBtn.textContent = 'Add Friend';
            leaderDiv.appendChild(addFriendBtn);

            addFriendBtn.addEventListener('click', async () => {
              try {
                const response = await fetch('http://localhost:8000/api/friendships/', {
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
                  addFriendBtn.textContent = 'Pending..';
                } else {
                  alert('Failed to send friend request.');
                }
              } catch (error) {
                console.error('Error adding friend:', error);
              }
            });
          }
          leaderboard.appendChild(leaderDiv);
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }
}

customElements.define("home-dashboard-page", HomeDashboard);
