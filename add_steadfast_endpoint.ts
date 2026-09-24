import fs from 'fs';
let file = fs.readFileSync('server.ts', 'utf-8');

const endpointCode = `
// Send Order to Steadfast Courier
app.post('/api/admin/steadfast/send-order', adminAuthMiddleware, async (req, res) => {
  const { sessionId, codAmount } = req.body;
  if (!DB.sessions[sessionId] || !DB.sessions[sessionId].orderExtracted) {
    return res.status(404).json({ error: 'Session or order not found' });
  }

  const session = DB.sessions[sessionId];
  const order = session.orderExtracted;

  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return res.status(400).json({ error: 'Steadfast API keys are not configured in environment (.env)' });
  }

  try {
    const payload = {
      invoice: 'GG-' + Math.floor(Math.random() * 100000),
      recipient_name: order.customerName || 'Customer',
      recipient_phone: order.customerPhone,
      recipient_address: order.customerAddress || 'Address not provided',
      cod_amount: Number(codAmount) || 0,
      note: 'Ordered via Gift Ghor AI Chatbot'
    };

    const sfRes = await fetch('https://portal.steadfast.com.bd/api/v1/create_order', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Secret-Key': secretKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const sfData = await sfRes.json();

    if (sfRes.ok && sfData.status === 200) {
      session.orderExtracted.steadfastStatus = 'Sent';
      session.orderExtracted.trackingCode = sfData.consignment?.tracking_code || sfData.consignment_id || 'Success';
      saveDB(DB);
      return res.json({ success: true, session });
    } else {
      return res.status(400).json({ error: 'Steadfast API Error: ' + JSON.stringify(sfData) });
    }
  } catch (err: any) {
    console.error('Steadfast error:', err);
    return res.status(500).json({ error: 'Internal Server Error while connecting to Steadfast' });
  }
});
`;

if (!file.includes('/api/admin/steadfast/send-order')) {
  file = file.replace(`app.post('/api/admin/chats/:sessionId/mode'`, endpointCode + `\napp.post('/api/admin/chats/:sessionId/mode'`);
  fs.writeFileSync('server.ts', file);
  console.log('Steadfast endpoint added');
} else {
  console.log('Steadfast endpoint already exists');
}
