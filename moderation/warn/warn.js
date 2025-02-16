const {SlashCommandBuilder, PermissionFlagsBits} = require('@discordjs/builders');
const fs = require('fs');

const warningFile = require('../../warning.json')

let warnings = {}

if (fs.existsSync(warningFile)) {
    warnings = JSON.parse(fs.readFileSync(warningFile, 'utf8'))
}

module.exports = {
    data: new SlashCommandBuilder()
                .setName('warn')
                .setDescription('Warn a user, check their warnings, or remove a warning.')
                    .addSubcommand(subcommand => subcommand.setName('add')
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
                    .addSubcommand(subcommand => subcommand.setName('check')
                        .setDescription('Check a user\'s warnings')
                        .addUserOption(option =>
                            option.setName("target")
                                .setDescription("The user to check")
                                .setRequired(true)))
                    .addSubcommand(subcommand => subcommand.setName('remove')
                .setDescription('Remove a user\'s warning')
                .addUserOption(option => 
                    option.setName("target")
                        .setDescription("The user to remove a warning from")
                        .setRequired(true))),
                   
    };