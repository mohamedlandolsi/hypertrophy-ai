# 📋 Windows Task Scheduler Setup Guide
## Step-by-Step Instructions for Automated Security Monitoring

This guide will help you set up automated subscription security monitoring that runs every hour to ensure your payment system stays secure.

## 🎯 What This Does
- Automatically checks for expired subscriptions every hour
- Downgrades expired PRO users to FREE plan
- Logs all security events for monitoring
- Ensures no payment exploits or subscription errors

## 📝 Step-by-Step Instructions

### Step 1: Open Windows Task Scheduler
1. **Press `Windows Key + R`** to open the Run dialog
2. **Type**: `taskschd.msc`
3. **Press Enter** or click OK

*Alternative method: Search "Task Scheduler" in the Windows Start menu*

### Step 2: Create a New Task
1. In Task Scheduler, look at the **right panel** (Actions panel)
2. **Click**: "Create Basic Task..."
3. The "Create Basic Task Wizard" window will open

### Step 3: Name Your Task
1. **Task Name**: `HypertroQ Subscription Security`
2. **Description**: `Automated subscription security validation and cleanup`
3. **Click**: "Next"

### Step 4: Choose When to Run
1. **Select**: "Daily"
2. **Click**: "Next"

### Step 5: Set Daily Settings
1. **Start date**: Today's date (should be pre-filled)
2. **Start time**: Choose any time (e.g., 9:00 AM)
3. **Recur every**: `1` days
4. **Click**: "Next"

### Step 6: Choose Action
1. **Select**: "Start a program"
2. **Click**: "Next"

### Step 7: Program Settings (IMPORTANT)
1. **Program/script**: Copy and paste this exact path:
   ```
   D:\MyProject\hypertrophy-ai\hypertrophy-ai-nextjs\run-subscription-security.bat
   ```

2. **Start in (optional)**: Copy and paste this exact path:
   ```
   D:\MyProject\hypertrophy-ai\hypertrophy-ai-nextjs
   ```

3. **Leave "Add arguments" empty**
4. **Click**: "Next"

### Step 8: Review and Finish
1. **Review all settings** - they should look like this:
   - Name: HypertroQ Subscription Security
   - Trigger: Daily at [your chosen time]
   - Action: Start D:\MyProject\hypertrophy-ai\hypertrophy-ai-nextjs\run-subscription-security.bat

2. **Check the box**: "Open the Properties dialog for this task when I click Finish"
3. **Click**: "Finish"

### Step 9: Configure Repeat Settings (CRITICAL)
The Properties dialog should open automatically. If not, find your task in the list and double-click it.

1. **Click the "Triggers" tab**
2. **Double-click** your daily trigger to edit it
3. In the "Advanced settings" section:
   - **Check**: "Repeat task every"
   - **Set to**: `1 hours`
   - **For a duration of**: `Indefinitely`
4. **Click**: "OK"
5. **Click**: "OK" again to close Properties

### Step 10: Test the Task
1. **Find your task** in the Task Scheduler Library
2. **Right-click** on "HypertroQ Subscription Security"
3. **Click**: "Run"
4. **Check** if it runs without errors

## 🔍 Verification Steps

### Check if it's working:
1. **Open File Explorer**
2. **Navigate to**: `D:\MyProject\hypertrophy-ai\hypertrophy-ai-nextjs`
3. **Look for**: `subscription-security.log` file
4. **Open the log file** - you should see security check results

### What the log should contain:
```
🔒 STARTING SUBSCRIPTION SECURITY CHECK
==========================================
Timestamp: 2025-08-05T...
📊 Checking subscription security...
Found 0 expired active subscriptions
Found 0 PRO users without valid subscriptions
✅ No security issues found - all subscriptions are valid
✅ Subscription security check completed successfully
```

## 🚨 Troubleshooting

### If the task fails to run:
1. **Check the paths** - make sure they exactly match your project location
2. **Verify Node.js** is installed and accessible from command line
3. **Check permissions** - the task should run as your user account

### If no log file appears:
1. **Manually test** by opening Command Prompt
2. **Navigate to**: `D:\MyProject\hypertrophy-ai\hypertrophy-ai-nextjs`
3. **Run**: `node subscription-security-job.js`
4. **If this works**, the issue is with Task Scheduler paths

### If you see errors in the log:
1. **Check environment variables** in your `.env` file
2. **Verify database connection**
3. **Run**: `node validate-security-setup.js` to diagnose issues

## ⏰ Schedule Summary

After setup, your system will:
- **Run every hour** automatically
- **Check for expired subscriptions**
- **Downgrade expired PRO users** to FREE
- **Log all actions** for your review
- **Maintain payment system security** 24/7

## 📞 Quick Help Commands

If you need to test manually at any time:

```bash
# Test the security job
node subscription-security-job.js

# Monitor webhook activity
node webhook-monitor.js

# Validate entire setup
node validate-security-setup.js
```

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Task appears in Task Scheduler and shows "Ready" status
2. ✅ Log file gets updated every hour with timestamps
3. ✅ No security anomalies reported in logs
4. ✅ PRO users with expired subscriptions get auto-downgraded

---

## 🎯 That's It!

Your payment system is now **fully automated and secure**. The system will:
- ⚡ Automatically enforce subscription periods
- 🛡️ Prevent any payment exploits
- 📊 Monitor and log all security events
- 🔄 Run maintenance every hour without your intervention

**Your LemonSqueezy payment system is now bulletproof!** 🚀
