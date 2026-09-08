const fs = require('fs');
const login = require('fca-project-orion');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');

function getRandomDelay(minSec, maxSec) {
  return Math.floor(Math.random() * (maxSec - minSec + 1) + minSec) * 1000;
}

function startBot() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return setTimeout(startBot, 4000);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (e) {
    return setTimeout(startBot, 4000);
  }

  if (!config.c3cCookie || config.c3cCookie.length === 0) {
    console.log("[Bot Engine] Awaiting C3C Cookie from dashboard...");
    return setTimeout(startBot, 5000);
  }

  login({ appState: config.c3cCookie }, (err, api) => {
    if (err) {
      console.error("[Bot Engine] Session/Login error. Retrying in 10s...", err);
      return setTimeout(startBot, 10000);
    }

    api.setOptions({
      listenEvents: true,
      selfListen: false,
      autoMarkDelivery: false,
      updatePresence: true
    });

    console.log("[Bot Engine] 24/7 Auto-Reply Active! Responding only with: ops, opse, ZzZzZ");

    const stopListening = api.listenMqtt((listenErr, event) => {
      // Auto-reconnect kapag naputol ang MQTT connection
      if (listenErr) {
        console.error("[Bot Engine] Connection lost. Reconnecting...", listenErr);
        if (typeof stopListening === 'function') stopListening();
        return setTimeout(startBot, 5000);
      }

      if (event.type !== "message" || !event.body) return;

      let liveConfig;
      try {
        liveConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      } catch (e) {
        liveConfig = config;
      }

      const { threadID } = event;
      
      const replyList = liveConfig.autoReplies && liveConfig.autoReplies.length > 0 
        ? liveConfig.autoReplies 
        : ["ops", "opse", "ZzZzZ"];

      const selectedReply = replyList[Math.floor(Math.random() * replyList.length)];
      const delay = getRandomDelay(liveConfig.humanDelayMinSec || 2, liveConfig.humanDelayMaxSec || 4);

      // Typing simulation
      api.sendTypingIndicator(threadID, () => {});

      setTimeout(() => {
        api.sendTypingIndicator(threadID, () => {});
        api.sendMessage(selectedReply, threadID);
      }, delay);
    });
  });
}

module.exports = { startBot };
