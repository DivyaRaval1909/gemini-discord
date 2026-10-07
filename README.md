# 🤖 Discord Gemini Bot (Node.js)

A Discord Bot built with **Node.js (discord.js v14)** and **Google Gemini AI (`@google/generative-ai`)**, featuring a `/ask` slash command. It includes automatic message chunking for Discord's 2000-character limit, immediate response deferral (preventing timeouts), and production-ready configurations for **AWS Deployment**.

---

## 📁 Project Structure

```text
├── src/
│   ├── index.js             # Main bot initialization & slash command listeners
│   ├── gemini.js            # Gemini AI service handler
│   └── deploy-commands.js   # Script to register slash commands (/ask, /ping)
├── Dockerfile               # Lightweight Alpine container for production
├── docker-compose.yml       # 1-command container deployment with auto-restart
├── package.json             # ES Module configuration & dependencies
├── .env.example             # Template for required environment variables
└── README.md                # Complete setup and deployment guide
```

---

## 🚀 1. Prerequisites & API Keys

### A. Get Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in and click **"Get API key"**.
3. Create a new API key and copy it.

### B. Create Discord Bot & Get Tokens
1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **"New Application"**, give it a name (e.g. `Gemini Bot`), and create it.
3. Under **General Information**, copy the **Application ID** (this is your `CLIENT_ID`).
4. Navigate to the **Bot** tab on the left:
   - Click **"Reset Token"** (or Add Bot) to copy your **Bot Token** (this is your `DISCORD_TOKEN`).
   - Under **Privileged Gateway Intents**, ensure permissions you need are enabled (for basic slash commands, standard defaults are sufficient).
5. Navigate to **OAuth2 ➔ URL Generator**:
   - In **Scopes**, check: `bot` and `applications.commands`.
   - In **Bot Permissions**, check: `Send Messages`, `Read Messages/View Channels`, `Use Slash Commands`, `Embed Links`.
   - Copy the generated URL at the bottom, paste it into your browser, and select your Discord server to invite your bot!

---

## 💻 2. Local Setup & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Edit `.env` and fill in your keys:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
GEMINI_API_KEY=your_gemini_api_key_here

# (Optional) Add your server ID for instant command registration during testing:
GUILD_ID=your_discord_server_id_here
AUTO_DEPLOY_COMMANDS=true
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Deploy Slash Commands (Optional if AUTO_DEPLOY_COMMANDS is true)
```bash
npm run deploy-commands
```

### 4. Start the Bot
```bash
# Normal start
npm start

# Or with live reload
npm run dev
```
Open Discord and test `/ask question: What is quantum computing?` or `/ping`!

---

## ☁️ 3. Deploying to AWS

Discord bots establish a persistent WebSocket connection (Gateway) with Discord, which means they need to run continuously.

Here are the two best ways to host your bot on AWS:

---

### 🌟 Method 1: AWS EC2 / Lightsail with Docker (Recommended & Easiest)

> **Cost:** Eligible for AWS Free Tier (`t2.micro` or `t3.micro` for 12 months) or Amazon Lightsail for ~$3.50/month.

#### Step 1: Launch an EC2 Instance
1. In the AWS Console, open **EC2** and click **Launch Instance**.
2. Select **Ubuntu 24.04 LTS (x86_64)**.
3. Choose **`t2.micro`** (or `t3.micro`).
4. Select or create an SSH Key Pair (`.pem` file) so you can connect.
5. In Network settings, default SSH (port 22) is all you need. Click **Launch Instance**.

#### Step 2: Connect to your Server
```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

#### Step 3: Install Docker & Docker Compose
Run the following on your server:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
newgrp docker
```

#### Step 4: Clone / Copy Your Bot Code
Clone your repository or copy the project files to the server:
```bash
git clone https://github.com/your-username/your-discord-bot.git
cd your-discord-bot
```

Create your `.env` file on the server:
```bash
nano .env
```
*(Paste your `DISCORD_TOKEN`, `CLIENT_ID`, and `GEMINI_API_KEY`, then press `Ctrl+O`, `Enter`, `Ctrl+X`)*.

#### Step 5: Start the Bot in the Background
```bash
docker compose up -d --build
```

#### Step 6: Monitor & Manage Logs
```bash
# View live logs
docker compose logs -f

# Stop the bot
docker compose down

# Restart the bot
docker compose restart
```
*Because of `restart: unless-stopped` in `docker-compose.yml`, your bot will automatically reboot whenever the server restarts or if it crashes!*

---

### 📦 Method 2: AWS EC2 with Node.js + PM2 (Alternative without Docker)

If you prefer running directly with Node:

```bash
# On your Ubuntu EC2 instance:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# In your project folder:
npm ci --omit=dev
pm2 start src/index.js --name "discord-gemini-bot"

# Save PM2 process so it restarts on system reboot:
pm2 save
pm2 startup
```

---

### 🛡️ Method 3: AWS ECS Fargate (Fully Managed Serverless Container)

If you want automated scaling and zero server maintenance:
1. **Push image to AWS ECR (Elastic Container Registry):**
   ```bash
   aws ecr create-repository --repository-name discord-gemini-bot
   docker build -t discord-gemini-bot .
   docker tag discord-gemini-bot:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/discord-gemini-bot:latest
   docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/discord-gemini-bot:latest
   ```
2. **Create an ECS Cluster (Fargate)** in the ECS Console.
3. **Create a Task Definition** using the ECR image URI and set your `DISCORD_TOKEN`, `CLIENT_ID`, and `GEMINI_API_KEY` in the environment configuration.
4. **Create a Service** with desired count = 1.

---

## ⚡ Useful Slash Commands

- `/ask <question>`: Queries Google Gemini AI and streams/formats the answer with Discord Markdown.
- `/ping`: Responds with the bot's WebSocket latency.
