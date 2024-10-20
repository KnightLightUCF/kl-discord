const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, SlashCommandBuilder } = require('discord.js'); 
const fs = require('fs');

// Helper function to load and save meetings
function loadMeetings() {
    if (fs.existsSync('meetings.json')) {
        return JSON.parse(fs.readFileSync('meetings.json'));
    }
    return [];
}

function saveMeetings(meetings) {
    fs.writeFileSync('meetings.json', JSON.stringify(meetings, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Schedule a meeting with a modal input.'),

    async execute(interaction) {
        console.log('scheduleCommand executed'); // Log when the command is executed

        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('schedule_modal')
            .setTitle('Schedule a Meeting');

        // Date and Time input field
        const dateTimeInput = new TextInputBuilder()
            .setCustomId('meeting_time')
            .setLabel('Meeting Date and Time (YYYY-MM-DD HH:mm)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('2024-10-01 15:00')
            .setRequired(true);

        // Meeting name input field
        const meetingNameInput = new TextInputBuilder()
            .setCustomId('meeting_name')
            .setLabel('Meeting Name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Project Discussion')
            .setRequired(true);

        // Add input fields to the modal
        const firstActionRow = new ActionRowBuilder().addComponents(dateTimeInput);
        const secondActionRow = new ActionRowBuilder().addComponents(meetingNameInput);

        modal.addComponents(firstActionRow, secondActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);

        try {
            // Wait for modal submission
            const submittedInteraction = await interaction.awaitModalSubmit({
                filter: (i) => i.customId === 'schedule_modal' && i.user.id === interaction.user.id,
                time: 60000, // Wait up to 60 seconds for the user to respond
            });

            // Get the input values from the modal
            const dateTime = submittedInteraction.fields.getTextInputValue('meeting_time');
            const meetingName = submittedInteraction.fields.getTextInputValue('meeting_name');

            // Load existing meetings
            let meetings = loadMeetings();

            // Create a meeting object
            const meeting = {
                id: `meeting_${meetings.length + 1}`, // Unique ID for each meeting
                creator: interaction.user.id,
                name: meetingName,
                time: dateTime,
                attendees: [interaction.user.id] // Include the creator in the attendees array
            };

            // Add the meeting to the array and save it to the file
            meetings.push(meeting);
            saveMeetings(meetings); // Save meetings

            // Respond to the interaction with the confirmation
            await submittedInteraction.reply({
                content: `Meeting "${meetingName}" scheduled by <@${interaction.user.id}> on ${dateTime}.`,
                ephemeral: true // Only visible to the user who scheduled the meeting
            });

        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: 'You did not respond in time or an error occurred.', ephemeral: true });
        }
    }
};
