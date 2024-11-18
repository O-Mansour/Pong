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
        // this.fetchPlayNow();

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
     const Element_totalPlayers = document.getElementById("fetched_total_players");

      if (fullnameElement && xpElement &&  levelElement && matches_played && matches_won && Element_totalgame
        && Element_gametoday && Element_playin_now && Element_yourrank  && Element_totalPlayers
        )
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
      // Update total players
      if (data.total_players != null) {
        Element_totalPlayers.textContent = data.total_players;
      } else {
        Element_totalPlayers.textContent = '0';
      }

       // Update your rank
       if (data.rank == null){
        Element_yourrank.style.fontSize = "18px";
        Element_yourrank.textContent = "Not ranked yet";
      }
      else
        Element_yourrank.textContent = '#' + data.rank;
    }

      // const leade_bord = document.querySelector('.leadebord');
      // data.forEach((addleader, index) => {
      //   const addfriend=document.createElement('div');
      //   addfriend.classList.add('leader');
      //   addfriend.innerHTML = `
      //  <h1>#${index + 1}</h1>
      //   <img img src="http://localhost:8000${addleader.profileimg}" class="img_leader">
      //   <span class="leader-name"${addleader.firstname} ${addleader.lastname}></span>
      //   <div class="leader-username">${addleader.username}</div>
      //  `;
      //   leade_bord.appendChild(addfriend);
        
      // });

    } catch (error) {
      console.error('Error fetching dashboard :', error);
    }
  }

  async fetchNotfication() {
    try {
    
      const response = await fetch('http://localhost:8000/api/friendships/requests');
      const NotifData = await response.json();
      const badge = document.querySelector('.badge');
      const formContainer = document.querySelector("#formContainer");

      if (NotifData.length)
        badge.textContent = NotifData.length;
      else
        badge.textContent = 0;

      
      NotifData.forEach(sender => {
        // Create a new notification row
        const notificationRow = document.createElement("div");
        notificationRow.classList.add("d-flex");

 
        notificationRow.innerHTML = `
            <div class="name_notf">
                <img src="http://localhost:8000${sender.profileimg}" class="img_led">
                <p class="name_invit">${sender.firstname} ${sender.lastname}</p>
            </div>
            <button id="confirmBtn" class="btn btn-success me-2" >Confirm</button>
            <button id="deleteBtn" class="btn btn-danger">Delete</button>
        `;
        // Append the row to the form container
        formContainer.appendChild(notificationRow);
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }
  
}

customElements.define("home-dashboard-page", HomeDashboard);