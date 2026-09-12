const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://127.0.0.1:3000/api/health');
    console.log("Health:", res.data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
