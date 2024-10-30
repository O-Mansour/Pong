const Router = {

    init:() =>{

        // Initialization code for setting up event listeners on navigation links (init)
        // console.log("here")
       document.querySelectorAll("a").forEach(a => {
           a.addEventListener("click", event => {
               event.preventDefault();
               const url = event.target.getAttribute("href");
               Router.go(url);
           });
       })
       window.addEventListener("popstate",event=>{
           Router.go(event.state.route,false); 
       });
       Router.go(location.pathname);
   },
   go:(route,addToHistory = true) =>{
         // Handles navigation to different routes and page content loading
         console.log(`Going to ${route}`); //next step well we need to call router go  so he can to the route
         if (addToHistory)
         {
             history.pushState({ route }, '', route); // kan9dr nbdl url 
         }   
         let pageElement = null;
   }

   switch (route) {
    case "/":
        document.title = "";
        pageElement = document.createElement("");
        break;
    case "/order":
        document.title = "your order";
        pageElement = document.createElement("order-Page");
        break;
    default:
        if (route.startsWith("/product-"))
        {
            pageElement = document.createElement("details-Page");
            const paramID = route.substring(route.lastIndexOf("-")+1);
            pageElement.id = paramID;
        }
    if (pageElement) {
        const cache = document.querySelector("main");
        cache.innerHTML = "";
        cache.appendChild(pageElement);
    }
  }
}

export default Router;


