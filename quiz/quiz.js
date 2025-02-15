const axios = require("axios");
const he = require("he"); 

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

module.exports = { fetchQuestion };