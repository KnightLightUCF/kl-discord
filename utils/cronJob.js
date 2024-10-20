const cron = require('node-cron');
const fs = require('fs');
const { notifyAttendees, createVoiceChannel } = require('./meetingUtils');

// Add this function to read meetings from the JSON file
function loadMeetings() {
    if (fs.existsSync('meetings.json')) {
        return JSON.parse(fs.readFileSync('meetings.json', 'utf8'));
    }
    return [];
}

// Setup cron jobs
function setupCronJobs(client) {
    // Check meetings every minute
    cron.schedule('* * * * *', async () => {
        console.log('Checking meetings...', new Date());
        const meetings = loadMeetings();
        console.log('Number of meetings:', meetings.length);
        const now = new Date();
        for (const meeting of meetings) {
            const meetingTime = new Date(meeting.time);
            const timeDiff = (meetingTime - now) / (1000 * 60); // Time difference in minutes
            if (timeDiff <= 15 && timeDiff > 14) {
                await notifyAttendees(client, meeting, "15 minutes");
            } else if (timeDiff <= 5 && timeDiff > 4) {
                await notifyAttendees(client, meeting, "5 minutes");
            } else if (timeDiff <= 0 && timeDiff > -1) {
                await notifyAttendees(client, meeting, "now");
                await createVoiceChannel(client, meeting, meetings);
            }
        }
    });

    // Daily cleanup at midnight (server time)
    cron.schedule('0 0 * * *', async () => {
        console.log("Running midnight cleanup...");
        const meetings = loadMeetings();
        const guild = await client.guilds.fetch(process.env.GUILD_ID);

        // Delete voice channels related to meetings
        for (const meeting of meetings) {
            if (meeting.voiceChannelId) {
                const voiceChannel = guild.channels.cache.get(meeting.voiceChannelId);
                if (voiceChannel) {
                    try {
                        await voiceChannel.delete();
                        console.log(`Deleted voice channel: ${voiceChannel.name}`);
                    } catch (error) {
                        console.error(`Failed to delete voice channel: ${error}`);
                    }
                }
            }
        }

        // Clear meetings and save empty file
        fs.writeFileSync('meetings.json', JSON.stringify([], null, 2));
        console.log("All meetings have been cleared.");
    });
}

module.exports = { setupCronJobs };
