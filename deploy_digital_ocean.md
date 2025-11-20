# Deploying to Digital Ocean

You have three main options for deploying your Next.js + Convex app to Digital Ocean:

1.  **App Platform via CLI** (Automated, Fastest)
2.  **App Platform via Web UI** (Recommended, Easiest)
3.  **Droplet** (Virtual Machine, requires Docker)

## Prerequisites

1.  **Convex Deployment**: Ensure your Convex backend is deployed to production.
    *   Run: `npx convex deploy`
    *   Note your Production URL (e.g., `https://quirky-malamute-677.convex.cloud`).

2.  **GitHub Repository**: Push your code to a GitHub repository.

3.  **DigitalOcean API Key**: Your API key is already configured in the deployment scripts.

---

## Option 1: Digital Ocean App Platform via CLI (Automated)

This is the fastest way using the provided deployment scripts.

### For Windows (PowerShell):
```powershell
.\deploy-do.ps1
```

### For Linux/Mac (Bash):
```bash
chmod +x deploy-do.sh
./deploy-do.sh
```

The script will:
1. Authenticate with DigitalOcean using your API key
2. Prompt for your Convex production URL
3. Create an app spec file or deploy directly
4. Set up your app on App Platform

**Note**: You'll need to install `doctl` CLI first:
- Download from: https://docs.digitalocean.com/reference/doctl/how-to/install/
- Or use: `choco install doctl` (Windows) / `brew install doctl` (Mac)

---

## Option 2: Digital Ocean App Platform via Web UI (Recommended)

This is the easiest way. Digital Ocean will build your app from GitHub automatically.

1.  **Push to GitHub**: Ensure your latest code is on GitHub.
2.  **Go to Digital Ocean**: Log in at https://cloud.digitalocean.com and click **Create** -> **Apps**.
3.  **Choose Source**: Select **GitHub** and choose your repository.
4.  **Configure App**:
    *   Digital Ocean should detect it as a **Next.js** app (or Dockerfile).
    *   If it detects Dockerfile, that's fine too.
5.  **Environment Variables**:
    *   Click **Edit** on the Environment Variables section.
    *   Add:
        *   `NEXT_PUBLIC_CONVEX_URL`: Your Convex Production URL (e.g., `https://quirky-malamute-677.convex.cloud`)
        *   `NODE_ENV`: `production`
6.  **Build Command**: If not using Docker, ensure build command is `npm run build`.
7.  **Run Command**: If not using Docker, ensure run command is `npm start`.
8.  **Deploy**: Click **Next** and **Create Resources**.

Your app will be live in a few minutes!

---

## Option 2: Droplet (using Docker)

If you prefer a raw Linux server (Droplet).

1.  **Create Droplet**: Create a new Droplet (Ubuntu 22.04) with Docker installed (Marketplace -> Docker).
2.  **SSH into Droplet**: `ssh root@your_droplet_ip`
3.  **Clone Repo**: `git clone https://github.com/your-username/your-repo.git`
4.  **Build Image**:
    ```bash
    cd your-repo
    docker build -t webaiunity .
    ```
5.  **Run Container**:
    ```bash
    docker run -d -p 80:3000 \
      -e NEXT_PUBLIC_CONVEX_URL="https://quirky-malamute-677.convex.cloud" \
      webaiunity
    ```
6.  **Access**: Open `http://your_droplet_ip` in your browser.

---

## Important: Convex Environment Variables

Since Convex is a separate backend service, you **DO NOT** need to host Convex on Digital Ocean. You only host the Next.js frontend.

The **ONLY** thing connecting them is the `NEXT_PUBLIC_CONVEX_URL`. Ensure this is set correctly in your Digital Ocean environment variables.
