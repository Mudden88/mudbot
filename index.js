require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const he = require("he"); // För att decoda HTML-entiteter från OpenTDB

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

let currentQuestion = null;
let answered = false;
let leaderboard = {};

async function fetchQuestion() {
    try {
        const response = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
        const data = response.data.results[0];

        // Fråga och svar
        const question = he.decode(data.question);
        const correctAnswer = he.decode(data.correct_answer);
        let answers = data.incorrect_answers.map(a => he.decode(a));
        answers.push(correctAnswer); // Lägg till rätt svar
        answers = answers.sort(() => Math.random() - 0.5); // Blanda svaren

        return { question, correctAnswer, answers };
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

// När boten är redo
client.once("ready", () => {
    console.log(`✅ Bot Activated as ${client.user.tag}`);
});

// När någon skriver ett meddelande
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === "!leaderboard") {

        if (Object.keys(leaderboard).length === 0) {
            message.channel.send("🏆 **Leaderboard:** Inga poäng ännu! Börja spela med `!quiz`.");
            return;
        }

        const sortedScores = Object.values(leaderboard).sort((a, b) => b.score - a.score);
        const leaderboardEmbedd = sortedScores.map((user, index) => `${index + 1}. ${user.username} - ${user.score} p`).join("\n");

        message.channel.send(`🏆 **Leaderboard:**\n${leaderboardEmbedd}`);

    }

    if (message.content.toLowerCase() === "!quiz") {
        if (currentQuestion) {
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

        message.channel.send(`🎯 **Question:**\n${currentQuestion.question}\n\n${answerOptions}`);
    } else if (currentQuestion && !answered) {
        const userAnswer = message.content.trim();
        const correctIndex = currentQuestion.answers.indexOf(currentQuestion.correctAnswer) + 1;

        if (userAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase() || userAnswer === correctIndex.toString()) {
            message.channel.send(`✅ **${message.author.username} Correct Answer!**`);
            if (!leaderboard[message.author.id]) {
                leaderboard[message.author.id] = { username: message.author.username, score: 0 };
            }
            leaderboard[message.author.id].score += 1;
            currentQuestion = null; // Återställ frågan
            answered = true;
        } else {
            message.channel.send(`❌ **${message.author.username} Wrong Answer! Try again!**`);
        }
    }
});

// Starta boten
client.login(process.env.TOKEN);
