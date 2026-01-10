
const axios = require('axios');

async function ping() {
    try {
        console.log("Pinging server...");
        await axios.get('http://localhost:5000/api/dashboard/stats', {
            headers: { Authorization: 'Bearer testtoken' }
        });
    } catch (e) {
        console.log("Ping finished (error expected as token is fake):", e.response ? e.response.status : e.message);
    }
}
ping();
