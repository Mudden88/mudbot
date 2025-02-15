//Fixa spam, fixa så att den kan stänga av frågar som redan är besvarade... 

require("dotenv").config();
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require("discord.js");
const axios = require("axios");
const he = require("he"); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

let currentQuestion = null;
let answered = false;
let leaderboard = {};

async function fetchQuestion() {
    try {
        const response = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
        const data = response.data.results[0];

        const question = he.decode(data.question);
        const correctAnswer = he.decode(data.correct_answer);
        let answers = data.incorrect_answers.map(a => he.decode(a));
        answers.push(correctAnswer);
        answers = answers.sort(() => Math.random() - 0.5);

        return { question, correctAnswer, answers };
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

client.once("ready", () => {
    console.log(`✅ Bot Activated as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === "!leaderboard") {
        if (Object.keys(leaderboard).length === 0) {
            message.channel.send("🏆 **Leaderboard:** Inga poäng ännu! Börja spela med `!quiz`.");
            return;
        }

        const sortedScores = Object.values(leaderboard).sort((a, b) => b.score - a.score);
        const topScores = sortedScores.slice(0, 10);
        const leaderboardText = topScores.map((user, index) => `**${index + 1}. ${user.username} - ${user.score} p**`).join("\n");

        message.channel.send(`🏆 # **Quiz Top 10 Leaderbaord:**\n${leaderboardText}`);
    }

    if (message.content.toLowerCase() === "!quiz") {
        if (currentQuestion && !answered) {
            message.channel.send("❌ Answer the active question first!");
            return;
        }

        const newQuestion = await fetchQuestion();
        if (!newQuestion) {
            message.channel.send("❌ Could not get a new question, try again.");
            return;
        }

        currentQuestion = newQuestion;
        answered = false;

        let answerOptions = currentQuestion.answers.map((answer, index) => `${index + 1}. ${answer}`).join("\n");

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('answer')
                    .setLabel('Answer')
                    .setStyle(ButtonStyle.Primary)
            );

        message.channel.send({ content: `🎯 **Question:**\n${currentQuestion.question}\n\n${answerOptions}`, components: [row] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() && interaction.type !== InteractionType.ModalSubmit) return;

    if (interaction.customId === 'answer') {
        const modal = new ModalBuilder()
            .setCustomId('answerModal')
            .setTitle('Answer the Question');

        const answerInput = new TextInputBuilder()
            .setCustomId('answerInput')
            .setLabel('Your Answer')
            .setStyle(TextInputStyle.Short);

        const actionRow = new ActionRowBuilder().addComponents(answerInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    } 

    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'answerModal') {
        const userAnswer = interaction.fields.getTextInputValue('answerInput').trim();

        if (!currentQuestion) {
            await interaction.reply("❌ No active question. Start a new quiz with `!quiz`.");
            return;
        }

        if (userAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()) {
            await interaction.reply(`✅ **${interaction.user.username} Correct Answer!! [ ${currentQuestion.correctAnswer} ] You got 1 point!**`);
            if (!leaderboard[interaction.user.id]) {
                leaderboard[interaction.user.id] = { username: interaction.user.username, score: 0 };
            }
            leaderboard[interaction.user.id].score += 1;
            currentQuestion = null;
            answered = true;
        } else {
            await interaction.reply(`❌ **${interaction.user.username} Wrong Answer! Try again!**`);
        }
    }
});

client.login(process.env.TOKEN);
