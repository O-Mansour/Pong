const rout = ['', '/', '/home', '/user', '/settings', '/404', '/sign-up' ,'/game', '/congrats' ,'/tournament','/already','/tournamentwinner']

const routes = new Map([

    ["/",{
        Title: "login",
        Element: "login-page"
    }],
    ["",{
        Title: "login",
        Element: "login-page"
    }],
    ["/sign-up",{
        Title: "signup",
        Element: "signup-page"
    }],
    ["/game",{
        Title: "Game",
        Element: "game-page"
    }],
    ["/home",{
        Title: "Home",
        Element: "home-dashboard-page"
    }],
    ["/user",{
        Title: "Profile",
        Element: "profile-page"
    }],
    ["/setting", {
        Title: "setting",
        Element: "setting-page"
    }],
    ["/select", {
        Title: "game",
        Element: "ponggame-game"
    }],
    ["/congrats", {
        Title: "congrats",
        Element: "pagegame-winner"
    }],
    ["/already", {
        Title: "AnotherPage",
        Element: "another-game-page"
    }],
    ["/tournament", {
        Title: "game",
        Element: "vers4-game"
    }],
    ["/tournamentwinner", {
        Title: "game",
        Element: "vers4-game-winner"
    }],
    ["/404",{
        Title: "not found",
        Element: "error-page"
    }]
]);
const Router = {

    init:() => {

        document.addEventListener("mylink", event => {
            Router.go();
        });

       window.addEventListener("popstate",event=>{
           Router.go();
       });
       Router.go();

   },
   go:() => {
        let route = window.location.pathname;

        const cache = document.querySelector("main");
        if (routes.get(route))
        {
            document.title = routes.get(route).Title;
            const pageElement = document.createElement(routes.get(route).Element);
            cache.innerHTML = "";
            cache.appendChild(pageElement);
        }
        else
        {

            document.title = routes.get("/404").Title;
            const pageElement = document.createElement(routes.get("/404").Element);
            cache.innerHTML = "";
            cache.appendChild(pageElement);
        }
    }
}

Router.init();
