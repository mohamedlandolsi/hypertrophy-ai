# 🎬 Quick Setup Walkthrough
## 5-Minute Video-Style Guide

Follow these exact steps - should take about 5 minutes total:

## 🚀 Quick Start (Copy & Paste Ready)

### 1. Open Task Scheduler (30 seconds)
- Press `Windows + R`
- Type: `taskschd.msc`
- Press Enter

### 2. Create Task (1 minute)
- Click "Create Basic Task..." (right panel)
- Name: `HypertroQ Subscription Security`
- Description: `Automated subscription security validation`
- Click "Next"

### 3. Set Schedule (1 minute)
- Choose: "Daily"
- Click "Next"
- Keep default date/time
- Click "Next"

### 4. Set Action (1 minute)
- Choose: "Start a program"
- Click "Next"

### 5. Program Path (2 minutes) - COPY THESE EXACTLY:

**Program/script:**
```
D:\MyProject\hypertrophy-ai\hypertrophy-ai-nextjs\run-subscription-security.bat
```

**Start in:**
```
D:\MyProject\hypertrophy-ai\hypertrophy-ai-nextjs
```

- Click "Next"
- Check "Open the Properties dialog..."
- Click "Finish"

### 6. Set Hourly Repeat (30 seconds)
Properties dialog opens automatically:
- Click "Triggers" tab
- Double-click the daily trigger
- Check "Repeat task every"
- Set to: "1 hours"
- Duration: "Indefinitely"
- Click "OK" twice

### 7. Test It! (30 seconds)
- Find your task in the list
- Right-click → "Run"
- Check if `subscription-security.log` appears in your project folder

## ✅ Done!

Your system now runs security checks every hour automatically!

---

## 🆘 Need Help?

**Can't find Task Scheduler?**
- Search "Task Scheduler" in Windows Start menu

**Task won't run?**
- Check the file paths are exactly correct
- Make sure Node.js is installed

**Want to test manually first?**
- Open Command Prompt in your project folder
- Run: `node subscription-security-job.js`

**Still stuck?**
- The log file should appear at: `D:\MyProject\hypertrophy-ai\hypertrophy-ai-nextjs\subscription-security.log`
- Check this file for any error messages
