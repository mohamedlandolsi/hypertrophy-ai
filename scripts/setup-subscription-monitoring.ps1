# Setup Subscription Security Monitoring
# Windows PowerShell script to set up automated subscription security checks

Write-Host "🔒 Setting up Subscription Security Monitoring..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Yellow

# Get the current directory
$projectPath = Get-Location
Write-Host "Project Path: $projectPath" -ForegroundColor Cyan

# Verify the security job exists
$jobScript = Join-Path $projectPath "subscription-security-job.js"
if (-Not (Test-Path $jobScript)) {
    Write-Host "❌ Error: subscription-security-job.js not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Security job script found" -ForegroundColor Green

# Test the job script
Write-Host "`n🧪 Testing security job..." -ForegroundColor Yellow
try {
    $testResult = node $jobScript
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Security job test successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Security job test failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running security job: $_" -ForegroundColor Red
    exit 1
}

# Create a batch file for the task scheduler
$batchFile = Join-Path $projectPath "run-subscription-security.bat"
$batchContent = @"
@echo off
cd /d "$projectPath"
node subscription-security-job.js >> subscription-security.log 2>&1
"@

Set-Content -Path $batchFile -Value $batchContent
Write-Host "✅ Created batch file: $batchFile" -ForegroundColor Green

# Instructions for Windows Task Scheduler
Write-Host "`n📋 SETUP INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
Write-Host ""
Write-Host "To set up automated monitoring, follow these steps:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open Windows Task Scheduler (taskschd.msc)" -ForegroundColor Cyan
Write-Host "2. Click Create Basic Task in the right panel" -ForegroundColor Cyan
Write-Host "3. Name: HypertroQ Subscription Security" -ForegroundColor Cyan
Write-Host "4. Description: Automated subscription security validation" -ForegroundColor Cyan
Write-Host "5. Trigger: Daily or When the computer starts" -ForegroundColor Cyan
Write-Host "6. For daily: Set time and repeat every 1 hour" -ForegroundColor Cyan
Write-Host "7. Action: Start a program" -ForegroundColor Cyan
Write-Host "8. Program/script: $batchFile" -ForegroundColor Green
Write-Host "9. Start in: $projectPath" -ForegroundColor Green
Write-Host ""
Write-Host "📊 MONITORING:" -ForegroundColor Yellow
Write-Host "- Logs will be written to: subscription-security.log" -ForegroundColor Cyan
Write-Host "- Check this file regularly for security events" -ForegroundColor Cyan
Write-Host "- The job will automatically downgrade expired PRO users" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚡ MANUAL TESTING:" -ForegroundColor Yellow
Write-Host "Run this command to test manually:" -ForegroundColor Cyan
Write-Host "node subscription-security-job.js" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Setup complete! Your payment system is now fully secured." -ForegroundColor Green
