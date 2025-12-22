# Next Steps After Installing Git

## ⚠️ Important: Restart PowerShell

Git was just installed, but PowerShell needs to be **closed and reopened** to recognize the Git command.

### Steps:

1. **Close this PowerShell window completely**
2. **Open a NEW PowerShell window**
3. **Navigate back to your project**:
   ```powershell
   cd C:\battle-arena
   ```

4. **Verify Git works**:
   ```powershell
   git --version
   ```
   You should see: `git version 2.52.0` (or similar)

---

## Once Git is Working, Run These Commands:

### Step 1: Configure Git (First Time Only)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Replace with your actual name and email.

### Step 2: Initialize Git Repository

```powershell
cd C:\battle-arena
git init
```

### Step 3: Check What Files Will Be Added

```powershell
git status
```

You should see a list of files that will be added.

### Step 4: Add All Files

```powershell
git add .
```

This adds all files to staging (except those in .gitignore like .env files).

### Step 5: Create First Commit

```powershell
git commit -m "Initial commit: Battle Arena game"
```

### Step 6: Add GitHub Remote

```powershell
git remote add origin https://github.com/rentabelnuy/battle-arena.git
```

### Step 7: Set Main Branch

```powershell
git branch -M main
```

### Step 8: Push to GitHub

```powershell
git push -u origin main
```

You'll be prompted for GitHub credentials. Use:
- **Username**: Your GitHub username
- **Password**: A Personal Access Token (not your GitHub password)

---

## 🔑 Creating a GitHub Personal Access Token

If you need to create a token:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "Battle Arena"
4. Select scopes: Check `repo` (all repo permissions)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

---

## ⚠️ Troubleshooting

### If Git Still Not Recognized After Restarting PowerShell:

1. **Close ALL PowerShell windows**
2. **Open a brand new PowerShell window**
3. Try `git --version` again

If still not working:
- Restart your computer
- Or manually add Git to PATH: `C:\Program Files\Git\cmd\`

### If Push Fails with Authentication Error:

- Make sure you're using a Personal Access Token, not your GitHub password
- GitHub no longer accepts passwords for Git operations

### If Repository Already Has Files:

If the GitHub repository already has files (like a README), you'll need to pull first:

```powershell
git pull origin main --allow-unrelated-histories
```

Then commit and push again.

---

**After restarting PowerShell, run `git --version` to verify, then proceed with the steps above!**

