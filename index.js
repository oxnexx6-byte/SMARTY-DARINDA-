const { spawn } = require("child_process");
const axios = require("axios");
const logger = require("./utils/log");

///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Serve the index.html file
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Start the server and add error handling
app.listen(port, () => {
    logger(`Server is running on port ${port}...`, "[ Starting ]");
}).on('error', (err) => {
    if (err.code === 'EACCES') {
        logger(`Permission denied. Cannot bind to port ${port}.`, "[ Error ]");
    } else {
        logger(`Server error: ${err.message}`, "[ Error ]");
    }
});

/////////////////////////////////////////////////////////
//========= Create start bot and make it loop =========//
/////////////////////////////////////////////////////////

// Initialize global restart counter
global.countRestart = global.countRestart || 0;

function startBot(message) {
    if (message) logger(message, "[ Starting ]");

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Priyansh.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        if (codeExit !== 0 && global.countRestart < 5) {
            global.countRestart += 1;
            logger(`Bot exited with code ${codeExit}. Restarting... (${global.countRestart}/5)`, "[ Restarting ]");
            startBot();
        } else {
            logger(`Bot stopped after ${global.countRestart} restarts.`, "[ Stopped ]");
        }
    });

    child.on("error", (error) => {
        logger(`An error occurred: ${JSON.stringify(error)}`, "[ Error ]");
    });
};

////////////////////////////////////////////////
//========= Check update from Github =========//
////////////////////////////////////////////////

axios.get("https://raw.githubusercontent.com/priyanshu192/bot/main/package.json")
    .then((res) => {
        logger(res.data.name, "[ NAME ]");
        logger(`Version: ${res.data.version}`, "[ VERSION ]");
        logger(res.data.description, "[ DESCRIPTION ]");
    })
    .catch((err) => {
        logger(`Failed to fetch update info: ${err.message}`, "[ Update Error ]");
    });

// Start the bot
startBot();
// ----- Existing code ऊपर रहेगा -----

let botActive = false;
let activeTimer;

// Start bot function
function startBot(name, durationSec) {
    if(botActive) {
        console.log("Bot पहले से चल रहा है!");
        return;
    }

    botActive = true;
    console.log(`Bot ${name} के नाम से चालू हुआ! Duration: ${durationSec} सेकंड`);

    activeTimer = setTimeout(() => {
        stopBot();
    }, durationSec * 1000); // Duration सेकंड में

    // अगर bot को हर interval पर कुछ करना है
    // let interval = setInterval(() => { /* कोई recurring task */ }, 5000);
}

// Stop bot function
function stopBot() {
    if(!botActive) return;
    botActive = false;
    clearTimeout(activeTimer);
    console.log("Bot बंद हो गया!");
}

// ----- Existing message listener / commands में add करें -----
client.on('message', async (message) => {
    if(message.author.bot) return;

    let msg = message.content.toLowerCase();

    // Start command
    if(msg.startsWith('!start')) {
        // Example: !start Dawood 30
        let args = msg.split(' ');
        let botName = args[1] || "Bot";
        let duration = parseInt(args[2]) || 60; // default 60 sec
        startBot(botName, duration);
        message.reply(`Bot ${botName} चालू हो गया, Duration: ${duration} सेकंड`);
    }

    // Stop command
    if(msg.startsWith('!stop')) {
        stopBot();
        message.reply("Bot बंद हो गया!");
    }

    // ----- Existing commands नीचे add रहेंगे -----
});
