const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://127.0.0.1:3000/api/admin/ai-assistant', {
      history: [{ role: 'user', parts: [{ text: 'What is our most viewed page from analytics?' }] }]
    }, {
      headers: { Authorization: 'Bearer giftghor2026' }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
test();
