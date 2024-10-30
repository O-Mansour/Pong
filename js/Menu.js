import API from "./API.js";  // access to all properties and methods within the API

export   async function loadData()
{
    app.store.menu = await API.fetchMenu();
    
}
