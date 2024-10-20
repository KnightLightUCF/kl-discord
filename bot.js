const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();
const fs = require('fs');
const scheduleCommand = require('./commands/schedule');
const joinCommand = require('./commands/join');
const { setupCronJobs } = require('./utils/cronJob');
const { loadMeetings } = require('./utils/meetingUtils');

// Initialize bot client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const token = process.env.BOT_TOKEN;
let meetings = loadMeetings();  // Load meetings from file

// Register slash commands
const commands = [
    scheduleCommand.data,
    joinCommand.data,
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

client.once('ready', async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
            { body: commands },
        );
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }

    console.log('Bot is online!');
    setupCronJobs(client, meetings);  // Start cron jobs
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'schedule') {
            await scheduleCommand.execute(interaction, meetings);
        } else if (interaction.commandName === 'join') {
            await joinCommand.execute(interaction, meetings);
        }
    } else {
        // Handle select menu interaction for joining meetings
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'join_meeting') {
                await joinCommand.handleSelect(interaction, meetings);
            }
        }
    }
});


client.login(token);

module.exports = client;
