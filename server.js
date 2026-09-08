const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CONFIG_PATH = path.join(__dirname, 'config.json');

function getConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig = {
      c3cCookie: [],
      humanDelayMinSec: 2,
      humanDelayMaxSec: 4,
      autoReplies: ["ops", "opse", "ZzZzZ"]
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

app.get('/api/config', (req, res) => {
  res.json(getConfig());
});

app.post('/api/config', (req, res) => {
  const currentConfig = getConfig();
  const updatedConfig = { ...currentConfig, ...req.body };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
  res.json({ status: "success", message: "Updated!" });
});

// 24/7 Keep-Alive Route para sa Render
app.get('/ping', (req, res) => {
  res.status(200).send('Sanzu Bot Active 24/7');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Dashboard] Server listening on port ${PORT}`);
});
