const API = {

    url:"/data/menu.json",  // endpoint backend  =>This defines the endpoint or path to the menu.json file on your backend or server from which you're fetching data
    fetchMenu: async() =>{
        
        // check for faild or errors 
        // check if data exist , check for status code
        // fetch('https://api.example.com/data')
        // .then(response => {
        //     // Check for the status code
        //     if (response.status === 200) {
        //         // Parse the response if the status is OK (200)
        //         return response.json();
        //     } else if (response.status === 404) {
        //         // Handle 404 Not Found
        //         throw new Error('Resource not found');
        //     } else if (response.status >= 500) {
        //         // Handle server errors
        //         throw new Error('Server error');
        //     } else {
        //         // Handle other status codes
        //         throw new Error('Unexpected response');
        //     }
        // })
        // .then(data => {
        //     // Check if data exists (non-null or has required properties)
        //     if (data && Object.keys(data).length > 0) {
        //         console.log('Data exists:', data);
        //         // Handle data as needed
        //     } else {
        //         console.log('No data available');
        //     }
        // })
        // .catch(error => {
        //     // Handle errors (status code-based or network errors)
        //     console.error('Error:', error.message);
        // }); 

        const result = await fetch (API.url);
        await result.json();
    }
}

export default API;