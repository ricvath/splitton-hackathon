# SplitTON Telegram Bot Setup Guide

This guide will help you set up your SplitTON Telegram bot for testing the app.

## Bot Information

- **Bot Name**: SplitTON
- **Bot Username**: @splitton_bot
- **Bot Token**: 7727706756:AAGaPHmDxIp8w3cXJ24surRJdkAw7_bZKWE

## Setting Up the Bot

1. **Deploy your app**:
   - The app is already built in the `dist` folder
   - Deploy it to Netlify or another hosting service
   - For testing, you can use a local server: `npx serve dist`

2. **Configure the Bot's Web App URL**:
   - Send a message to @BotFather on Telegram
   - Use the `/mybots` command
   - Select your `@splitton_bot`
   - Select "Bot Settings" > "Menu Button" > "Configure Menu Button"
   - Set the text to "Split Expenses"
   - Set the web app URL to your deployed app URL (e.g., `https://splitton-hackathon.netlify.app`)
   - For local testing, you can use ngrok: `ngrok http 3000`

3. **Test the Bot**:
   - Open Telegram and search for `@splitton_bot`
   - Start a chat with the bot
   - You should see the "Split Expenses" button that opens your web app

## Using the TON Testnet

For testing payments, use the TON Testnet:

1. **Get a Testnet Wallet**:
   - Download Tonkeeper or Tonhub
   - Create a wallet and switch to Testnet mode
   - Get test TON coins from a faucet: https://t.me/testgiver_ton_bot

2. **Update TON Connect Manifest**:
   - Make sure your `tonconnect-manifest.json` is properly configured
   - For testnet, wallets will automatically connect to the testnet

## Troubleshooting

- **Bot doesn't respond**: Make sure the bot is active and the token is correct
- **Web app doesn't load**: Check your hosting and the URL configuration in BotFather
- **Wallet connection issues**: Verify that your TON Connect manifest is accessible

## Next Steps

After the hackathon, you can implement Telegram Cloud Storage to store expense data:

```javascript
// Example of using Telegram Cloud Storage (future implementation)
const telegramWebApp = window.Telegram.WebApp;

// Save data
telegramWebApp.CloudStorage.setItem('expenses', JSON.stringify(expenses))
  .then(() => console.log('Data saved to Telegram Cloud Storage'))
  .catch(error => console.error('Error saving data:', error));

// Load data
telegramWebApp.CloudStorage.getItem('expenses')
  .then(data => {
    if (data) {
      const expenses = JSON.parse(data);
      console.log('Loaded expenses:', expenses);
    }
  })
  .catch(error => console.error('Error loading data:', error));
```

This will allow you to store up to 1MB of data per user in Telegram's cloud. 