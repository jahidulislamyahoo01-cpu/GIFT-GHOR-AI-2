const axios = require('axios');
async function test() {
  try {
    const loginRes = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'giftghor2026'
    });
    console.log("Token:", loginRes.data.token);
    const res = await axios.post('http://localhost:3000/api/admin/ai-assistant', {
      history: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    }, {
      headers: { Authorization: `Bearer ${loginRes.data.token}` }
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response ? err.response.data : err.message);
  }
}
test();
