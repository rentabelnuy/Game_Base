# GitHub Setup Guide

## Step 1: Install Git

If Git is not installed on your system:

### Windows
1. Download Git from: https://git-scm.com/download/win
2. Run the installer
3. Use default settings
4. Restart your terminal/PowerShell

### Mac
```bash
# Install via Homebrew
brew install git

# Or download from: https://git-scm.com/download/mac
```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get install git

# Fedora
sudo dnf install git
```

## Step 2: Configure Git (First Time Only)

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

## Step 3: Initialize Git Repository

```bash
# Navigate to project root
cd C:\battle-arena

# Initialize git repository
git init

# Check status
git status
```

## Step 4: Create GitHub Repository

1. **Go to GitHub**: https://github.com
2. **Sign in** or create account
3. **Click "New"** (or + icon) → "New repository"
4. **Repository settings**:
   - Name: `battle-arena` (or your preferred name)
   - Description: "Battle Arena - RPS game for Farcaster & Base"
   - Visibility: Public or Private (your choice)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. **Click "Create repository"**

## Step 5: Add Files and Commit

```bash
# Add all files
git add .

# Check what will be committed
git status

# Commit files
git commit -m "Initial commit: Battle Arena game"

# Verify commit
git log
```

## Step 6: Connect to GitHub

```bash
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/battle-arena.git

# Verify remote
git remote -v
```

## Step 7: Push to GitHub

```bash
# Push to GitHub (first time)
git push -u origin main

# If you get an error about branch name, try:
git branch -M main
git push -u origin main

# Or if your default branch is master:
git push -u origin master
```

## Step 8: Verify on GitHub

1. Go to your GitHub repository page
2. Refresh the page
3. You should see all your files!

## Future Updates

After making changes:

```bash
# Check what changed
git status

# Add changed files
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push
```

## Common Issues

### Issue: "fatal: not a git repository"
**Solution**: Make sure you're in the project root directory

### Issue: Authentication required
**Solution**: 
- Use Personal Access Token instead of password
- Generate token: GitHub → Settings → Developer settings → Personal access tokens
- Use token as password when pushing

### Issue: Branch name mismatch
**Solution**: 
```bash
# Check current branch
git branch

# Rename if needed
git branch -M main
```

### Issue: Large files
**Solution**: 
- Add large files to `.gitignore`
- Use Git LFS for large files if needed

## Useful Git Commands

```bash
# View commit history
git log

# View changes
git diff

# View remote repositories
git remote -v

# Pull latest changes
git pull

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout branch-name

# View all branches
git branch -a
```

---

**Need Help?**
- Git documentation: https://git-scm.com/doc
- GitHub Help: https://docs.github.com

