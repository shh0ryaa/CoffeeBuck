const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Simple in-memory rate limiter (per IP)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20; // max requests per IP per window
const rateMap = new Map(); // ip -> [timestamps]

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
if(!OPENROUTER_KEY){
  console.warn('Warning: OPENROUTER_API_KEY is not set. Add it to .env or set the environment variable.');
}

// API proxy route
app.post('/api/chat', async (req, res) => {
  try{
    const body = req.body || {};
    // Rate limiting per IP
    const ip = (req.ip || req.connection.remoteAddress || 'unknown');
    const now = Date.now();
    var arr = rateMap.get(ip) || [];
    // remove old timestamps
    arr = arr.filter(function(ts){ return (now - ts) <= RATE_LIMIT_WINDOW_MS; });
    if(arr.length >= MAX_REQUESTS_PER_WINDOW){
      return res.status(429).json({ error: 'Too many requests — please slow down.' });
    }
    arr.push(now);
    rateMap.set(ip, arr);

    // Basic payload size checks
    var raw = JSON.stringify(body || {});
    if(raw.length > 10000){
      return res.status(413).json({ error: 'Payload too large' });
    }

    const { messages, model } = body;
    if(!messages || !Array.isArray(messages) || messages.length === 0){
      return res.status(400).json({ error: 'messages (array) required' });
    }

    // Limit message count and size per message to avoid abusive inputs
    if(messages.length > 25){
      return res.status(413).json({ error: 'Too many messages in request' });
    }
    for(var i=0;i<messages.length;i++){
      var m = messages[i];
      if(m && m.content && String(m.content).length > 2000){
        return res.status(413).json({ error: 'Message too long' });
      }
    }

    const payload = {
      model: model || 'deepseek/deepseek-r1-0528-qwen3-8b:free',
      messages: messages
    };

    if(!OPENROUTER_KEY){
      return res.status(500).json({ error: 'Server missing OpenRouter API key (OPENROUTER_API_KEY).' });
    }

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OPENROUTER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    try{ const json = JSON.parse(text); return res.status(resp.status).json(json); }catch(e){ return res.status(resp.status).send(text); }

  }catch(err){
    console.error('Proxy error', err);
    return res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

// Serve static site files from project root (so /index.html etc are available)
app.use(express.static(path.join(__dirname, '/')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('CoffeBuck proxy + static server listening on http://localhost:' + PORT);
});
