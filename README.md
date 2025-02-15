# MudBot

MudBot is a Discord QuizBot that uses OpenTriviaDB to fetch questions. It is built with `discord.js` and offers fun quiz questions for your Discord server.

## Available Commands

### `!quiz`
Starts a quiz and sends a question to the channel. Users can answer the question by clicking the "Answer" button and entering their answer in a modal.

### `!leaderboard`
Displays the current leaderboard with the top players and their scores.

## Installation

Follow these steps to install and run MudBot:

1. Clone this repository:
    ```bash
    git clone https://github.com/Mudden88/MudBot.git
    ```

2. Navigate to the project directory:
    ```bash
    cd MudBot/mudbot
    ```

3. Install the necessary dependencies:
    ```bash
    npm install
    ```

4. Create a [.env](http://_vscodecontentref_/1) file in the root directory and add  Discordyour Bot Token:
    ```
    TOKEN=your-discord-bot-token
    ```

5. Start the bot:
    ```bash
    node index.js
    ```

## Contributing

If you would like to contribute to MudBot, please follow these steps:

1. Fork this repository.
2. Create a new branch for your feature (`git checkout -b feature/new-feature`).
3. Make your changes and commit them (`git commit -m 'Add new feature'`).
4. Push your changes to the branch (`git push origin feature/new-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
