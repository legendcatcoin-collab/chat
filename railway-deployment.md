# 🚀 Railway Deployment Guide

This app is fully optimized for continuous deployment on Railway. It uses standard Next.js building pipelines automatically supported by Railway's Node.js buildpacks.

### Prerequisites
Make sure your project is pushed to a GitHub repository.

### Step-by-Step Deployment

1. **Login to Railway**
   - Go to [Railway.app](https://railway.app) and sign in.
   - Click **New Project** from your dashboard.

2. **Select Source**
   - Choose **Deploy from GitHub repo**.
   - Select the repository containing your AI Chat App codebase.

3. **Configure Environment Variables**
   - Once the project starts building, go to your project in Railway.
   - Click on the newly created service tile, then go to the **Variables** tab.
   - Add the following environment variable (Optional but recommended so the app works without the user pasting a key):
     - `OPENROUTER_API_KEY`: Your OpenRouter API Key.

4. **Wait for Build**
   - Railway will automatically detect Next.js and run the standard scripts defined in `package.json`:
     - `npm install`
     - `npm run build`
     - `npm start`
   - Wait until the build and deploy steps complete successfully.

5. **Generate a Public Domain**
   - Head over to the **Settings** tab of your service.
   - Scroll down to **Networking** and click **Generate Domain**.
   - Your Mobile AI Chat App is now live!

### Why this structure works flawlessly on Railway:
- **Zero Config required**: Using the standard Next.js edge runtime and API routing.
- **Port Handling**: Railway exports a `$PORT` variable which `next start` dynamically hooks into.
- **Start Command Settings**: `next start` avoids the heavy dev server and spins up the optimized production build.
