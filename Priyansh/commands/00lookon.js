const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "locknick",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "Raj",
  description: "Lock all members' nicknames in a group",
  commandCategory: "group",
  usages: "[on/off]",
  cooldowns: 5
};

const lockNickDataPath = path.join(__dirname, "cache", "locknick.json");
let lockNickData = fs.existsSync(lockNickDataPath) ? JSON.parse(fs.readFileSync(lockNickDataPath)) : {};

function saveLockData() {
  fs.writeFileSync(lockNickDataPath, JSON.stringify(lockNickData, null, 2));
}

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;

  if (!args[0]) return api.sendMessage("⚠️ इस्तेमाल करें: locknick on/off", threadID);

  if (args[0].toLowerCase() === "on") {
    const threadInfo = await api.getThreadInfo(threadID);
    const nicknames = {};

    for (const userID in threadInfo.userInfo) {
      const user = threadInfo.userInfo.find(u => u.id == userID);
      if (user) nicknames[userID] = user.nickname || "";
    }

    lockNickData[threadID] = nicknames;
    saveLockData();

    return api.sendMessage(`🔒 सभी members के nicknames लॉक कर दिए गए।`, threadID);
  }

  if (args[0].toLowerCase() === "off") {
    if (!lockNickData[threadID]) return api.sendMessage("⚠️ Nickname पहले से unlocked हैं!", threadID);

    delete lockNickData[threadID];
    saveLockData();
    return api.sendMessage("✅ Nickname lock हटा दिया गया।", threadID);
  }

  return api.sendMessage("❌ Invalid option! Use: locknick on/off", threadID);
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, author, logMessageType, logMessageData } = event;

  if (!lockNickData[threadID]) return;

  // Check for nickname change
  if (logMessageType === "log:thread-nickname") {
    const userID = logMessageData.participant_id;
    const lockedNick = lockNickData[threadID][userID] || "";

    if (logMessageData.nickname !== lockedNick) {
      await api.changeNickname(lockedNick, threadID, userID);
      api.sendMessage(`🔄 ${logMessageData.nickname ? `"${logMessageData.nickname}"` : "Blank"} nickname detect हुआ था।\nपुराना nickname वापस set कर दिया गया।`, threadID);
    }
  }
};
