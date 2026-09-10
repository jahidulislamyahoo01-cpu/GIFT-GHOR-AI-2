const express = require('express');
const app = express();
app.get('*', (req, res) => {
  res.sendFile('/non/existent/path/index.html');
});
app.listen(3002, () => console.log('started'));
