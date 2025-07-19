const { fetchQuestion } = require("../quiz/quiz.js");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
} = require("discord.js");

let currentQuestion = null;
let answered = false;
let leaderboard = {};
let questionTimeout = null;

function getFunctions(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === "!leaderboard") {
      if (Object.keys(leaderboard).length === 0) {
        message.channel.send(
          "🏆 **Leaderboard:** No points yet! Start playing with `!quiz`."
        );
        return;
      }

      const sortedScores = Object.values(leaderboard).sort(
        (a, b) => b.score - a.score
      );
      const topScores = sortedScores.slice(0, 10);
      const leaderboardText = topScores
        .map(
          (user, index) =>
            `**${index + 1}. ${user.username} - ${user.score} p**`
        )
        .join("\n");

      message.channel.send(
        `🏆 # **Quiz Top 10 Leaderbaord:**\n${leaderboardText}`
      );
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
      // Clear any previous timeout
      if (questionTimeout) {
        clearTimeout(questionTimeout);
        questionTimeout = null;
      }

      let answerOptions = currentQuestion.answers
        .map((answer, index) => `${index + 1}. ${answer}`)
        .join("\n");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("answer")
          .setLabel("Answer")
          .setStyle(ButtonStyle.Primary)
      );

      message.channel.send({
        content: `🎯 **Question:**\n${currentQuestion.question}\n\n${answerOptions}`,
        components: [row],
      });

      // Set a 5-minute timeout to reveal the answer if not answered
      questionTimeout = setTimeout(() => {
        if (currentQuestion && !answered) {
          message.channel.send(
            `⏰ Time's up! The correct answer was: **${currentQuestion.correctAnswer}**`
          );
          currentQuestion = null;
          answered = true;
        }
      }, 300000);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (
      !interaction.isButton() &&
      interaction.type !== InteractionType.ModalSubmit
    )
      return;

    if (interaction.customId === "answer") {
      const modal = new ModalBuilder()
        .setCustomId("answerModal")
        .setTitle("Answer the Question");

      const answerInput = new TextInputBuilder()
        .setCustomId("answerInput")
        .setLabel("Your Answer")
        .setStyle(TextInputStyle.Short);

      const actionRow = new ActionRowBuilder().addComponents(answerInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    }
    // Handle the answer modal
    if (
      interaction.type === InteractionType.ModalSubmit &&
      interaction.customId === "answerModal"
    ) {
      const userAnswer = interaction.fields
        .getTextInputValue("answerInput")
        .trim();
      // Check if there is an active question
      if (!currentQuestion) {
        await interaction.reply(
          "❌ No active question. Start a new quiz with `!quiz`."
        );
        return;
      }
      // Answer the question
      if (
        userAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
      ) {
        await interaction.reply(
          `✅ **${interaction.user.username} Correct Answer!! [ ${currentQuestion.correctAnswer} ] You got 1 point!**`
        );
        if (!leaderboard[interaction.user.id]) {
          leaderboard[interaction.user.id] = {
            username: interaction.user.username,
            score: 0,
          };
        }
        leaderboard[interaction.user.id].score += 1;
        currentQuestion = null;
        answered = true;

        // Clear the timeout if answered correctly
        if (questionTimeout) {
          clearTimeout(questionTimeout);
          questionTimeout = null;
        }

        // Disable the answer button
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("answer")
            .setLabel("Answer")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

        await interaction.message.edit({ components: [disabledRow] });
      } else {
        await interaction.reply(
          `❌ **${interaction.user.username} Wrong Answer! Try again!**`
        );
      }
    }
  });
}

module.exports = getFunctions;
