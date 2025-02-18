const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const WARNING_FILE_PATH = path.join(__dirname, 'warning.json');

let warnings = {};

// Load warnings from file
async function loadWarnings() {
    try {
        const data = await fs.readFile(WARNING_FILE_PATH, 'utf8');
        warnings = JSON.parse(data);
        console.log("Warnings loaded successfully.");
    } catch (error) {
        console.error("Error loading warnings:", error);
        warnings = {}; // Reset if file is corrupted or empty
    }
}

// Save warnings to file
async function saveWarnings() {
    try {
        await fs.writeFile(WARNING_FILE_PATH, JSON.stringify(warnings, null, 4));
        console.log("Warnings saved successfully.");
    } catch (error) {
        console.error("Error saving warnings:", error);
    }
}

// Initialize warnings
loadWarnings();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user, check their warnings, or remove a warning.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Warn a user.')
                .addUserOption(option =>
                    option.setName("target")
                        .setDescription("The user to warn")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("Reason for the warning")
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription("Check a user's warnings.")
                .addUserOption(option =>
                    option.setName("target")
                        .setDescription("The user to check")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription("Remove a user's warnings.")
                .addUserOption(option =>
                    option.setName("target")
                        .setDescription("The user to remove warnings from")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('listAll')
                .setDescription("List all warnings for the guild."))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser("target");
        const userName = target ? target.tag : null;
        const guildId = interaction.guild.id;

        // Ensure the guild exists
        if (!warnings[guildId]) warnings[guildId] = {};
        // Ensure the user exists in the guild
        if (!warnings[guildId][target.id]) warnings[guildId][target.id] = [];

        if (subcommand === 'add') {
            const reason = interaction.options.getString("reason") || "No reason provided";

            warnings[guildId][target.id].push({
                username: userName,
                reason: reason,
                date: new Date().toISOString(),
            });

            await saveWarnings();

            return interaction.reply({ content: `⚠️ **${target.tag}** has been warned for: "${reason}"`, ephemeral: false });

        } else if (subcommand === 'check') {
            if (warnings[guildId][target.id].length === 0) {
                return interaction.reply({ content: `✅ **${target.tag}** has no warnings.`, ephemeral: false });
            }

            const userWarnings = warnings[guildId][target.id]
                .map((warn, index) => `**${index + 1}.** ${warn.reason} *(Date: ${warn.date})*`)
                .join("\n");

            return interaction.reply({ content: `📌 Warnings for **${target.tag}**:\n${userWarnings}`, ephemeral: false });

        } else if (subcommand === 'remove') {
            if (!warnings[guildId][target.id] || warnings[guildId][target.id].length === 0) {
                return interaction.reply({ content: `🚫 **${target.tag}** has no warnings to remove.`, ephemeral: false });
            }

            delete warnings[guildId][target.id];

            await saveWarnings();
            return interaction.reply({ content: `✅ Cleared all warnings for **${target.tag}**.`, ephemeral: false });
        
        } else if (subcommand === 'list') {
            const guildWarnings = warnings[guildId];
            if (Object.keys(guildWarnings).length === 0) {
                return interaction.reply({ content: `✅ No warnings in this guild.`, ephemeral: false });
            }

            let allWarnings = [];
            for (const userId in guildWarnings) {
                const userWarnings = guildWarnings[userId]
                    .map((warn, index) => `**${index + 1}.** ${warn.reason} *(Date: ${warn.date}, User: ${warn.username})*`)
                    .join("\n");
                allWarnings.push(`📌 Warnings for <@${userId}>:\n${userWarnings}`);
            }

            return interaction.reply({ content: allWarnings.join("\n\n"), ephemeral: false });
        }
    }
};