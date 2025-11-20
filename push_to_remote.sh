#!/bin/bash

# Script to force push the completed project to remote repository
# WARNING: This will overwrite remote history - use with caution

echo "?? FORCE PUSH WARNING ??"
echo "This script will force push and overwrite remote repository history"
echo "Make sure you have backed up any important remote branches"
echo ""

# Check if we are in the right directory
if [ ! -d ".git" ]; then
    echo "??Not a git repository"
    exit 1
fi

# Check if remote is configured
REMOTE_URL=$(git config --get remote.origin.url)
if [ -z "$REMOTE_URL" ]; then
    echo "??No remote origin configured"
    exit 1
fi

echo "?? Remote repository: $REMOTE_URL"
echo "?? Local commits: $(git rev-list --count HEAD)"
echo ""

# Confirm action
read -p "???  Are you sure you want to force push? This will overwrite remote history (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "??Force push cancelled"
    exit 0
fi

echo "?? Force pushing to remote..."

# Force push to main branch
if git push --force origin master; then
    echo "??Force push successful!"
    echo "?? Repository URL: $REMOTE_URL"
    echo "?? Pushed $(git rev-list --count HEAD) commits"
else
    echo "??Force push failed!"
    echo "?? Check your credentials and network connection"
    exit 1
fi

echo ""
echo "?? Repository successfully updated!"
echo "?? Access your repository at: $REMOTE_URL"
