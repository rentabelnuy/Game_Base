# Install Git on Windows - Quick Guide

## Option 1: Download Git Installer (Recommended)

1. **Download Git for Windows**:
   - Go to: https://git-scm.com/download/win
   - The download should start automatically
   - Or click the direct download link

2. **Run the Installer**:
   - Double-click the downloaded `.exe` file
   - **Important**: During installation:
     - Keep default settings
     - **Select "Git from the command line and also from 3rd-party software"** (important!)
     - Keep other defaults
     - Click "Install"

3. **Verify Installation**:
   - **Close and reopen** your PowerShell/terminal
   - Run: `git --version`
   - You should see: `git version 2.x.x`

## Option 2: Install via Winget (Windows Package Manager)

If you have Windows 10/11 with winget:

```powershell
winget install --id Git.Git -e --source winget
```

Then restart PowerShell.

## Option 3: Install via Chocolatey

If you have Chocolatey installed:

```powershell
choco install git
```

Then restart PowerShell.

---

## After Installation

1. **Restart PowerShell/Terminal** (important!)

2. **Configure Git** (first time only):
   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **Verify it works**:
   ```powershell
   git --version
   ```

4. **Now you can clone/push to GitHub!**

---

## Troubleshooting

### Git still not recognized after install

1. **Restart PowerShell/terminal** - This is usually needed
2. **Check PATH**: 
   - Git should be in: `C:\Program Files\Git\cmd\`
   - If not in PATH, add it manually (usually done automatically)
3. **Restart computer** if still not working

### Need to verify Git is installed

```powershell
# Check if Git is in PATH
where.exe git

# Should show: C:\Program Files\Git\cmd\git.exe
```

---

**Once Git is installed, come back and we'll set up your repository!**

