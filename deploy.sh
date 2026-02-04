#!/bin/bash

# ============================================
# BTCL SMS Portal Deployment Script
# Build locally, deploy to LXC container via jump host
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
JUMP_HOST="114.130.145.75"
JUMP_PORT="40001"
JUMP_USER="telcobright"
CONTAINER_NAME="SoftSwitch"
DEPLOY_PATH="/var/www/btcl-sms-portal"
APP_NAME="btcl-sms-portal"
PM2_APP_NAME="btcl-portal"

# Load credentials from .env.deploy
if [ -f ".env.deploy" ]; then
    source .env.deploy
else
    echo -e "${RED}Error: .env.deploy not found${NC}"
    echo "Create .env.deploy with: JUMP_PASS='your_password'"
    exit 1
fi

if [ -z "$JUMP_PASS" ]; then
    echo -e "${RED}Error: SSH password not set${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  BTCL SMS Portal Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Build the application locally
echo -e "\n${YELLOW}Step 1: Building application locally...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Step 2: Create deployment package
echo -e "\n${YELLOW}Step 2: Creating deployment package...${NC}"
DEPLOY_ARCHIVE="deploy.tar.gz"

# Create archive with build files
tar --exclude='.next/cache' -czf $DEPLOY_ARCHIVE \
    .next \
    public \
    package.json \
    package-lock.json \
    next.config.js

echo -e "${GREEN}Package created: $DEPLOY_ARCHIVE${NC}"

# Step 3: Upload to jump host
echo -e "\n${YELLOW}Step 3: Uploading to jump host...${NC}"
sshpass -p "$JUMP_PASS" scp -P $JUMP_PORT -o StrictHostKeyChecking=no \
    $DEPLOY_ARCHIVE $JUMP_USER@$JUMP_HOST:/tmp/

echo -e "${GREEN}Upload complete!${NC}"

# Step 4: Deploy to LXC container and start with PM2
echo -e "\n${YELLOW}Step 4: Deploying to LXC container...${NC}"

sshpass -p "$JUMP_PASS" ssh -p $JUMP_PORT -o StrictHostKeyChecking=no \
    $JUMP_USER@$JUMP_HOST << 'ENDSSH'

    echo "Connected to jump host"

    # Copy archive to container
    lxc file push /tmp/deploy.tar.gz SoftSwitch/tmp/

    # Execute deployment inside container
    lxc exec SoftSwitch -- bash -c '
        set -e

        DEPLOY_PATH="/var/www/btcl-sms-portal"
        PM2_APP_NAME="btcl-portal"

        echo "Inside container: SoftSwitch"

        # Create deploy directory if not exists
        mkdir -p $DEPLOY_PATH

        # Install PM2 globally if not found
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            npm install -g pm2
        fi

        # Stop PM2 app if running
        pm2 stop $PM2_APP_NAME 2>/dev/null || true

        # Extract new deployment
        echo "Extracting new deployment..."
        cd $DEPLOY_PATH
        tar -xzf /tmp/deploy.tar.gz

        # Install production dependencies
        echo "Installing dependencies..."
        npm install --production --legacy-peer-deps

        # Start with PM2
        echo "Starting application with PM2..."
        pm2 delete $PM2_APP_NAME 2>/dev/null || true
        pm2 start npm --name "$PM2_APP_NAME" -- start
        pm2 save

        # Setup PM2 to start on boot
        pm2 startup 2>/dev/null || true

        # Cleanup
        rm /tmp/deploy.tar.gz

        echo "Application started with PM2!"
        pm2 status
    '

    # Cleanup on jump host
    rm /tmp/deploy.tar.gz

    echo "Deployment complete!"
ENDSSH

# Step 5: Cleanup local archive
echo -e "\n${YELLOW}Step 5: Cleaning up local files...${NC}"
rm $DEPLOY_ARCHIVE

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Application running with PM2: ${PM2_APP_NAME}"
echo -e "Container: ${CONTAINER_NAME}"
