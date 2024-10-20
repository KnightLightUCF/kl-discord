const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const fs = require('fs');

// Add this function to read meetings from the JSON file
function loadMeetings() {
    if (fs.existsSync('meetings.json')) {
        return JSON.parse(fs.readFileSync('meetings.json', 'utf8'));
    }
    return [];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join an active meeting.'),

    async execute(interaction) {
        // Load meetings here
        const meetings = loadMeetings();

        if (meetings.length === 0) {
            await interaction.reply({ content: 'No active meetings to join.', ephemeral: true });
            return;
        }

        const meetingOptions = meetings.map(meeting => ({
            label: meeting.name,
            value: meeting.id
        }));

        const meetingSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('join_meeting')
            .setPlaceholder('Select a meeting to join')
            .addOptions(meetingOptions);

        const actionRow = new ActionRowBuilder().addComponents(meetingSelectMenu);

        await interaction.reply({ content: 'Select a meeting to join:', components: [actionRow], ephemeral: true });
    },

    async handleSelect(interaction) {
        // Load meetings here as well
        const meetings = loadMeetings();

        if (interaction.isSelectMenu() && interaction.customId === 'join_meeting') {
            const selectedMeetingId = interaction.values[0];
            const meeting = meetings.find(m => m.id === selectedMeetingId);

            if (!meeting) {
                await interaction.reply({ content: 'Meeting not found.', ephemeral: true });
                return;
            }

            if (!meeting.attendees.includes(interaction.user.id)) {
                meeting.attendees.push(interaction.user.id);
                fs.writeFileSync('meetings.json', JSON.stringify(meetings, null, 2));
            }

            await interaction.update({ content: `You have joined the meeting "${meeting.name}" scheduled on ${meeting.time}.`, components: [] });
        }
    }
};
