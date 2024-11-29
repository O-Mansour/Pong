const rout = ['', '/', '/home', '/user', '/settings', '/404', '/forgetpassword', '/sign-up' ,'/game','/twoplyer','/tournament']

const routes = new Map([

    ["/",{
        Title: "login",
        Element: "login-page"
    }],
    ["",{
        Title: "login",
        Element: "login-page"
    }],
    ["/forgetpassword",{
        Title: "forgetpassword",
        Element: "forget-password-page"
    }],
    ["/sign-up",{
        Title: "signup",
        Element: "signup-page"
    }],
    // ["/",{
    //     Title: "Home",
    //     Element: "home-dashboard-page"
    // }],
    ["/home",{
        Title: "Home",
        Element: "home-dashboard-page"
    }],
    ["/user",{
        Title: "Profile",
        Element: "profile-page"
        // onLoad: async () => {
        //     // The component will handle the data fetching itself
        //     console.log("Profile page loaded");
        // }
    }],
    ["/setting", {
        Title: "setting",
        Element: "setting-page"
    }],
    ["/game", {
        Title: "game",
        Element: "ponggame-game"
    }],
    ["/twoplyer", {
        Title: "game",
        Element: "vers1-game"
    }],
    ["/tournament", {
        Title: "game",
        Element: "vers4-game"
    }],
    
    ["/404",{
        Title: "not found",
        Element: "error-page"
    }]
]);
const Router = {

    init:() => {

        // let location = window.location.hash.split('#').pop();
        // console.log(location)
        // console.log("my location " ,rout.includes(location))

        // if (rout.includes(location))
        // Initialization code for setting up event listeners on navigation links (init)
        // console.log("here")

        document.addEventListener("mylink", event => {
            Router.go();    //  go=> to load the correct content based on the URL
        });

       window.addEventListener("popstate",event=>{
           Router.go();   // which is triggered by the user clicking the back or forward buttons. This ensures the app displays the correct page without reloading.
       });
       Router.go();

   },
   go:() => {
    
        // const route = location.pathname;  // Gets the current path from the browser’s location (e.g., "/home", "/user")
        let route = window.location.pathname;
       
        // Handles navigation to different routes and page content loading
        console.log(`Going to ${route}`, route.length); //next step well we need to call router go  so he can to the route
         
        const cache = document.querySelector("main");
        if (routes.get(route)) // Checks if the current path matches a defined route in the routes map
        {
            document.title = routes.get(route).Title;
            const pageElement = document.createElement(routes.get(route).Element);  //Creates a new instance of the component specified by Element (e.g., <home-dashboard-page>).
            cache.innerHTML = "";  //Replaces any existing content in <main> with this new component
            cache.appendChild(pageElement);

            // if (routes.get(route).onLoad)
            //     routes.get(route).onLoad();
        }
        else
        {

            console.log(`Not founded  oooo`); //next step well we need to call router go  so he can to the route
            document.title = routes.get("/404").Title;
            const pageElement = document.createElement(routes.get("/404").Element);
            cache.innerHTML = "";
            cache.appendChild(pageElement);
        }
    }
}

// export default Router;
Router.init();

//it updates the page’s title and content based on routes in the routes map and 
//listens for both custom navigation events ("mylink") and popstate 
//events to handle back/forward navigation.
