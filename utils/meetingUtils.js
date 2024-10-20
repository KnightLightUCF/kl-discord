const fs = require('fs');
const { PermissionsBitField } = require('discord.js');

// Load meetings from file
function loadMeetings() {
    if (fs.existsSync('meetings.json')) {
        return JSON.parse(fs.readFileSync('meetings.json'));
    }
    return [];
}

// Notify attendees
async function notifyAttendees(client, meeting, time) {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channel = guild.channels.cache.get(process.env.MEETING_CHANNEL_ID);
    const attendees = meeting.attendees.join(", ");
    
    // Send DM to each user
    await Promise.all(
        meeting.attendees.map(async (attendee) => {
            try {
                const user = await client.users.fetch(attendee);
                await user.send(`Reminder: Meeting "${meeting.name}" starts in ${time}.`);
            } catch (error) {
                console.error(`Failed to send DM to ${attendee}: ${error}`);
            }
        })
    );
}

// Create a voice channel for the meeting
async function createVoiceChannel(client, meeting, meetings) {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channel = await guild.channels.create({
        name: meeting.name,
        type: 2, // 2 is for voice channels
        permissionOverwrites: [
            {
                id: guild.id,
                allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak]
            }
        ]
    });

    // Store the voice channel ID in the meeting
    meeting.voiceChannelId = channel.id;

    // Save updated meetings back to file
    fs.writeFileSync('meetings.json', JSON.stringify(meetings, null, 2));
}

module.exports = { loadMeetings, notifyAttendees, createVoiceChannel };
