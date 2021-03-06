//0.01 
const Discord = require("discord.js"); //npm install discord.js
var fs = require('fs');
const webhook = require("webhook-discord") //npm install webhook-discord
var chokidar = require('chokidar'); //npm install chokidar
var Rcon = require('rcon');  //npm install rcon

var auth = require('./bot_auth.json');
var config = require('./config.json');
//var auth = require('C:\\Users\\Kevin Lucas\\Desktop\\Discord bots\\Factorio Chatbot\\TommyConfig\\bot_auth.json');
//var config = require('C:\\Users\\Kevin Lucas\\Desktop\\Discord bots\\Factorio Chatbot\\TommyConfig\\config.json');


const bot = new Discord.Client();
const Hook = new webhook.Webhook(config.webHook);


fs.writeFile(config.chatLog, '', function(){console.log('clear chat log')});
fs.writeFile(config.playerLog, '', function(){console.log('clear player log')});

bot.login(auth.token);

var conn
//connect to Rcon
function RconConnect()
{
	conn = new Rcon(config.RconIP, config.RconPort, config.RconPassword);
		conn.on('auth', function() {
		  console.log("Authed!");
		}).on('response', function(str) {
		  console.log("Got response: " + str);
		}).on('end', function() {
		  console.log("Socket closed!");
		  //failed to connect try again
		  RconConnect();
		}).on('error', function() {
		  console.log("error");
		  //failed to connect try again
		  RconConnect();
		});
		console.log("connecting");
		conn.connect();
}
	
 
//on bot start
bot.on("ready", () => {
	//connect to rcon
	RconConnect();
    console.log('Connected');
    console.log('Logged in as: ');
    console.log(bot.username + ' - (' + bot.id + ')');

	//watch the chat log file for update
	chokidar.watch(config.chatLog, {ignored: /(^|[\/\\])\../}).on('all', (event, path) => {
		readLastLine(config.chatLog);
	});
	
	//watch the player log file for update
	chokidar.watch(config.playerLog, {ignored: /(^|[\/\\])\../}).on('all', (event, path) => {
		readLastLine(config.playerLog);
	});
});

//when we get a message
bot.on("message", (message) => {
	//longetr then 0, not a bot, and in channel = channelListen
	if(message.content.length > 0 && !message.author.bot && message.channel.id === config.channelListen)
	{
		console.log(message.content);
		conn.send('/silent-command game.print("[Discord] ' + message.author.username + ': ' + message.content + '")');
	}
});


//-----------------------------------------------
//user functions 

function parseMessage(msg)
{
	var index = msg.indexOf(']');
	if (undefined !== msg && msg.length && index > 1)
	{
		//send via webhook, parse name abd message via "[" & "]" characters
		sendMessage(msg.slice(1,index), msg.slice(index+1));
	}
	
}

function readLastLine(path)
{
	fs.readFile(path, 'utf-8', function(err, data) 
	{
		//get last line of file. 
		if (err) throw err;
		var lines = data.trim().split('\n');
		lastLine = lines.slice(-1)[0];
		console.log(lastLine);
		if(path == config.chatLog && lastLine.length > 0)  //chatlog
		{
			//pasrs name and message
			parseMessage(lastLine);
		}
		if(path == config.playerLog  && lastLine.length > 0)  //player join/leave/kill
		{
			//use bot to send leave/join message
			bot.channels.get(config.channelListen).send("**" + lastLine + "**")
		}		
	});
		
	
}

//discord webhook
function sendMessage(name, msg)
{
	console.log(msg);
	const send = new webhook.MessageBuilder()
                .setName(name)
                .setText(msg)
	Hook.send(send);
}











