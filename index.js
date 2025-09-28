const { spawn } = require("child_process");
const axios = require("axios");
const logger = require("./utils/log");

const express = require('express');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js'); // Discord client

const app = express();
const port = process.env.PORT || 8080;

// Serve the index.html file
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Start the server
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
//========= Spawn Bot (restart loop) =========//
/////////////////////////////////////////////////////////

global.countRestart = global.countRestart || 0;

function spawnBot(message) {
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
            spawnBot();
        } else {
            logger(`Bot stopped after ${global.countRestart} restarts.`, "[ Stopped ]");
        }
    });

    child.on("error", (error) => {
        logger(`An error occurred: ${JSON.stringify(error)}`, "[ Error ]");
    });
}

////////////////////////////////////////////////
//========= GitHub Update Check =========//
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

////////////////////////////////////////////////
//========= Timed Bot Functions =========//
////////////////////////////////////////////////

let botActive = false;
let activeTimer;

function startTimedBot(name, durationSec) {
    if(botActive) {
        console.log("Bot पहले से चल रहा है!");
        return;
    }

    botActive = true;
    console.log(`Bot ${name} के नाम से चालू हुआ! Duration: ${durationSec} सेकंड`);

    activeTimer = setTimeout(() => {
        stopTimedBot();
    }, durationSec * 1000);
}

function stopTimedBot() {
    if(!botActive) return;
    botActive = false;
    clearTimeout(activeTimer);
    console.log("Bot बंद हो गया!");
}

////////////////////////////////////////////////
//========= Discord Client & Commands =========//
////////////////////////////////////////////////

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Replace YOUR_BOT_TOKEN with your actual bot token
client.login("YOUR_BOT_TOKEN");

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;

    let msg = message.content.toLowerCase();

    // Start timed bot
    if(msg.startsWith('!start')) {
        let args = msg.split(' ');
        let botName = args[1] || "Bot";
        let duration = parseInt(args[2]) || 60;
        startTimedBot(botName, duration);
        message.reply(`Bot ${botName} चालू हो गया, Duration: ${duration} सेकंड`);
    }

    // Stop timed bot
    if(msg.startsWith('!stop')) {
        stopTimedBot();
        message.reply("Bot बंद हो गया!");
    }

    // Spawn bot manually
    if(msg.startsWith('!spawn')) {
        spawnBot("Discord command से bot spawn किया गया");
        message.reply("Bot spawn हो गया!");
    }
});
