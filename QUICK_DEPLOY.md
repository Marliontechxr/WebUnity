# Quick Deployment Guide - DigitalOcean

This guide will help you deploy your app to DigitalOcean in minutes.

## Prerequisites Checklist

- [ ] Convex backend deployed (`npx convex deploy`)
- [ ] Convex production URL noted
- [ ] Code pushed to GitHub
- [ ] DigitalOcean account created

## Step 1: Deploy Convex Backend

```bash
npx convex deploy
```

Copy the production URL (e.g., `https://your-app.convex.cloud`)

## Step 2: Choose Deployment Method

### Method A: Automated CLI Deployment (Fastest)

**For Windows:**
```powershell
# Install doctl if not installed
# Download from: https://github.com/digitalocean/doctl/releases
# Or: choco install doctl

# Run deployment script
.\deploy-do.ps1
```

**For Linux/Mac:**
```bash
# Install doctl if not installed
# brew install doctl  # Mac
# Or download from: https://github.com/digitalocean/doctl/releases

# Make script executable
chmod +x deploy-do.sh

# Run deployment script
./deploy-do.sh
```

The script will:
1. Authenticate with your API key (already configured)
2. Ask for your Convex URL
3. Ask for your GitHub repo URL
4. Deploy your app automatically

### Method B: Manual Web UI Deployment (Easiest)

1. Go to https://cloud.digitalocean.com
2. Click **Create** → **Apps**
3. Connect your GitHub repository
4. DigitalOcean will auto-detect Next.js
5. Add environment variable:
   - Key: `NEXT_PUBLIC_CONVEX_URL`
   - Value: Your Convex production URL
6. Click **Create Resources**

## Step 3: Verify Deployment

1. Wait 5-10 minutes for the build to complete
2. Check the App Platform dashboard for status
3. Your app will be available at: `https://your-app-name.ondigitalocean.app`

## Step 4: Update Unity Client

Update the `baseUrl` in your Unity `InterviewManager.cs` to point to your Convex production URL.

## Troubleshooting

### Build Fails
- Check that `package.json` has correct build scripts
- Verify Node.js version (should be 18+)
- Check build logs in DigitalOcean dashboard

### App Won't Start
- Verify `NEXT_PUBLIC_CONVEX_URL` is set correctly
- Check runtime logs in DigitalOcean dashboard
- Ensure Convex backend is deployed and accessible

### Environment Variables Not Working
- Make sure variables are set in App Platform settings
- Restart the app after adding variables
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser

## Cost Estimate

- **Basic Plan**: ~$5/month (1 instance, basic-xxs)
- **Professional Plan**: ~$12/month (1 instance, basic-xs)

## Next Steps

- Set up custom domain (optional)
- Configure auto-scaling (if needed)
- Set up monitoring and alerts
- Configure CI/CD for automatic deployments

## Support

For issues:
1. Check DigitalOcean App Platform logs
2. Verify Convex deployment status
3. Review deployment guide: `deploy_digital_ocean.md`

