#!/bin/bash

# DigitalOcean Deployment Script for webaiunity
# This script helps deploy your Next.js app to DigitalOcean App Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}DigitalOcean Deployment Script${NC}"
echo "================================"
echo ""

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${YELLOW}doctl (DigitalOcean CLI) is not installed.${NC}"
    echo "Please install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    echo ""
    echo "Or use the manual deployment guide in deploy_digital_ocean.md"
    exit 1
fi

# Check if API key is provided
if [ -z "$DO_API_KEY" ]; then
    echo -e "${YELLOW}DO_API_KEY environment variable is not set.${NC}"
    echo "Please set it using: export DO_API_KEY='your-api-key'"
    echo "Or enter it now (it will not be displayed):"
    read -sp "DigitalOcean API key: " DO_API_KEY
    echo ""
    export DO_API_KEY
fi

# Authenticate with DigitalOcean
echo -e "${GREEN}Authenticating with DigitalOcean...${NC}"
doctl auth init --access-token "$DO_API_KEY"

# Check if Convex URL is set
if [ -z "$NEXT_PUBLIC_CONVEX_URL" ]; then
    echo -e "${YELLOW}NEXT_PUBLIC_CONVEX_URL is not set.${NC}"
    echo "Please provide your Convex production URL:"
    read -p "Convex URL: " CONVEX_URL
    export NEXT_PUBLIC_CONVEX_URL="$CONVEX_URL"
fi

echo ""
echo -e "${GREEN}Deployment Options:${NC}"
echo "1. Deploy to App Platform (Recommended)"
echo "2. Create App Platform app spec file (for manual review)"
echo ""
read -p "Choose option (1 or 2): " OPTION

if [ "$OPTION" == "1" ]; then
    echo ""
    echo -e "${YELLOW}Note: App Platform deployment via CLI requires:${NC}"
    echo "1. Your code pushed to GitHub"
    echo "2. GitHub repository URL"
    echo ""
    read -p "GitHub repository URL (e.g., https://github.com/username/repo): " GITHUB_REPO
    
    # Create app spec
    cat > app.yaml <<EOF
name: webaiunity
region: nyc
services:
- name: web
  github:
    repo: $(basename "$GITHUB_REPO" .git)
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
    value: "$NEXT_PUBLIC_CONVEX_URL"
  - key: NODE_ENV
    value: production
EOF

    echo ""
    echo -e "${GREEN}Creating app on DigitalOcean App Platform...${NC}"
    doctl apps create --spec app.yaml
    
    echo ""
    echo -e "${GREEN}Deployment initiated!${NC}"
    echo "Check your DigitalOcean dashboard for deployment status."
    echo "Your app will be available at: https://your-app-name.ondigitalocean.app"
    
elif [ "$OPTION" == "2" ]; then
    # Create app spec file
    cat > app.yaml <<EOF
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
    value: "$NEXT_PUBLIC_CONVEX_URL"
  - key: NODE_ENV
    value: production
EOF

    echo ""
    echo -e "${GREEN}App spec file created: app.yaml${NC}"
    echo "Please edit app.yaml with your GitHub repository details, then run:"
    echo "  doctl apps create --spec app.yaml"
fi

echo ""
echo -e "${GREEN}Done!${NC}"

