# Deploying SplitTON to Netlify

## Option 1: Manual Upload (Quick)

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site (splitton.netlify.app)
3. Go to the "Deploys" tab
4. Drag and drop the `dist` folder from your local machine onto the deployment area
5. Wait for the upload and deployment to complete

## Option 2: Git-based Deployment (Recommended)

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Updated TON Connect manifest and app URLs"
   git push origin master
   ```

2. Make sure your Netlify site is configured to:
   - Build command: `npm run build`
   - Publish directory: `dist`

3. Netlify will automatically detect the changes and deploy the updated site

## Configuring Your Telegram Bot

Now that your app is deployed, configure your Telegram bot:

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Use the `/mybots` command
3. Select your `@splitton_bot`
4. Go to "Bot Settings" > "Menu Button"
5. Set the text to "Split Expenses"
6. Set the web app URL to `https://splitton.netlify.app`

## Testing Your Bot

1. Open Telegram and search for `@splitton_bot`
2. Start a chat with the bot
3. You should see a "Split Expenses" button at the bottom
4. Tap the button to open your SplitTON app
5. Test the expense splitting and TON wallet connection features

## Troubleshooting

If the app doesn't work as expected:

1. Check the browser console for errors
2. Verify that the TON Connect manifest is accessible at `https://splitton.netlify.app/tonconnect-manifest.json`
3. Make sure the bot is properly configured in BotFather

Remember to test the app on the TON Testnet first before moving to the mainnet. 