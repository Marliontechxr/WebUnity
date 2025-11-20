# DigitalOcean Deployment Script for webaiunity (PowerShell)
# This script helps deploy your Next.js app to DigitalOcean App Platform

$ErrorActionPreference = "Stop"

Write-Host "DigitalOcean Deployment Script" -ForegroundColor Green
Write-Host "================================"
Write-Host ""

# Check if doctl is installed
try {
    $null = Get-Command doctl -ErrorAction Stop
} catch {
    Write-Host "doctl (DigitalOcean CLI) is not installed." -ForegroundColor Yellow
    Write-Host "Please install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    Write-Host ""
    Write-Host "Or use the manual deployment guide in deploy_digital_ocean.md"
    exit 1
}

# Check if API key is provided via environment variable
if (-not $env:DO_API_KEY) {
    Write-Host "DO_API_KEY environment variable is not set." -ForegroundColor Yellow
    Write-Host "Please set it using: `$env:DO_API_KEY = 'your-api-key'" -ForegroundColor Yellow
    Write-Host "Or provide it when prompted:" -ForegroundColor Yellow
    $apiKey = Read-Host "Enter your DigitalOcean API key" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
    $env:DO_API_KEY = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Authenticate with DigitalOcean
Write-Host "Authenticating with DigitalOcean..." -ForegroundColor Green
doctl auth init --access-token $env:DO_API_KEY

# Check if Convex URL is set
if (-not $env:NEXT_PUBLIC_CONVEX_URL) {
    Write-Host "NEXT_PUBLIC_CONVEX_URL is not set." -ForegroundColor Yellow
    $convexUrl = Read-Host "Please provide your Convex production URL"
    $env:NEXT_PUBLIC_CONVEX_URL = $convexUrl
}

Write-Host ""
Write-Host "Deployment Options:" -ForegroundColor Green
Write-Host "1. Deploy to App Platform (Recommended)"
Write-Host "2. Create App Platform app spec file (for manual review)"
Write-Host ""
$option = Read-Host "Choose option (1 or 2)"

if ($option -eq "1") {
    Write-Host ""
    Write-Host "Note: App Platform deployment via CLI requires:" -ForegroundColor Yellow
    Write-Host "1. Your code pushed to GitHub"
    Write-Host "2. GitHub repository URL"
    Write-Host ""
    $githubRepo = Read-Host "GitHub repository URL (e.g., https://github.com/username/repo)"
    
    $repoName = [System.IO.Path]::GetFileNameWithoutExtension($githubRepo)
    
    # Create app spec
    $appSpec = @"
name: webaiunity
region: nyc
services:
- name: web
  github:
    repo: $repoName
    branch: main
    deploy_on_push: true
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  routes:
  - path: /
  envs:
  - key: NEXT_PUBLIC_CONVEX_URL
    value: "$($env:NEXT_PUBLIC_CONVEX_URL)"
  - key: NODE_ENV
    value: production
"@
    
    $appSpec | Out-File -FilePath "app.yaml" -Encoding utf8
    
    Write-Host ""
    Write-Host "Creating app on DigitalOcean App Platform..." -ForegroundColor Green
    doctl apps create --spec app.yaml
    
    Write-Host ""
    Write-Host "Deployment initiated!" -ForegroundColor Green
    Write-Host "Check your DigitalOcean dashboard for deployment status."
    Write-Host "Your app will be available at: https://your-app-name.ondigitalocean.app"
    
} elseif ($option -eq "2") {
    # Create app spec file
    $appSpec = @"
name: webaiunity
region: nyc
services:
- name: web
  github:
    repo: YOUR_GITHUB_REPO_NAME
    branch: main
    deploy_on_push: true
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  routes:
  - path: /
  envs:
  - key: NEXT_PUBLIC_CONVEX_URL
    value: "$($env:NEXT_PUBLIC_CONVEX_URL)"
  - key: NODE_ENV
    value: production
"@
    
    $appSpec | Out-File -FilePath "app.yaml" -Encoding utf8
    
    Write-Host ""
    Write-Host "App spec file created: app.yaml" -ForegroundColor Green
    Write-Host "Please edit app.yaml with your GitHub repository details, then run:"
    Write-Host "  doctl apps create --spec app.yaml"
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

