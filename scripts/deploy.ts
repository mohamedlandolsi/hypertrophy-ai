#!/usr/bin/env tsx

/**
 * Comprehensive Deployment Script for HypertroQ
 * 
 * This script handles the complete deployment workflow:
 * 1. Pre-deployment validation
 * 2. Build and migration
 * 3. Deployment to hosting platform
 * 4. Post-deployment verification
 * 5. Rollback on failure
 * 
 * Usage:
 *   npx tsx scripts/deploy.ts
 *   OR
 *   npm run deploy
 * 
 * Options:
 *   --skip-validation    Skip pre-deployment checks (not recommended)
 *   --skip-seed          Skip database seeding
 *   --dry-run           Simulate deployment without actually deploying
 *   --rollback          Rollback to previous deployment
 */

import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  skipValidation: args.includes('--skip-validation'),
  skipSeed: args.includes('--skip-seed'),
  dryRun: args.includes('--dry-run'),
  rollback: args.includes('--rollback'),
};

// Deployment configuration
interface DeploymentConfig {
  platform: 'vercel' | 'custom' | 'manual';
  backupBeforeDeploy: boolean;
  notificationWebhook?: string;
  rollbackOnFailure: boolean;
}

const config: DeploymentConfig = {
  platform: process.env.DEPLOYMENT_PLATFORM as any || 'vercel',
  backupBeforeDeploy: true,
  notificationWebhook: process.env.DEPLOYMENT_WEBHOOK,
  rollbackOnFailure: true,
};

// Deployment state
interface DeploymentState {
  startTime: Date;
  phase: string;
  previousCommit?: string;
  backupFile?: string;
  deploymentUrl?: string;
  errors: Array<{ phase: string; error: string; timestamp: Date }>;
}

const state: DeploymentState = {
  startTime: new Date(),
  phase: 'initialization',
  errors: [],
};

// Logging utilities
function log(message: string, color: keyof typeof colors = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logError(message: string, error?: any) {
  log(`✗ ${message}`, 'red');
  if (error) {
    console.error(`${colors.red}  Error details: ${error.message}${colors.reset}`);
  }
  state.errors.push({
    phase: state.phase,
    error: error?.message || message,
    timestamp: new Date(),
  });
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'blue');
}

// Save deployment log to file
async function saveDeploymentLog() {
  const logDir = path.join(process.cwd(), 'logs');
  await fs.mkdir(logDir, { recursive: true });
  
  const logFile = path.join(logDir, `deployment-${state.startTime.toISOString().replace(/:/g, '-')}.json`);
  
  const logData = {
    ...state,
    endTime: new Date(),
    duration: Date.now() - state.startTime.getTime(),
    success: state.errors.length === 0,
    options,
    config,
  };
  
  await fs.writeFile(logFile, JSON.stringify(logData, null, 2), 'utf-8');
  logInfo(`Deployment log saved to: ${logFile}`);
  
  return logFile;
}

// ============================================================================
// PHASE 1: PRE-DEPLOYMENT VALIDATION
// ============================================================================

async function runPreDeploymentChecks(): Promise<boolean> {
  logSection('Phase 1: Pre-Deployment Validation');
  state.phase = 'pre-deployment-validation';
  
  if (options.skipValidation) {
    logWarning('Skipping pre-deployment validation (--skip-validation flag)');
    logWarning('This is NOT recommended for production deployments!');
    return true;
  }
  
  try {
    logInfo('Running comprehensive pre-deployment validation...');
    
    const { stdout, stderr } = await execAsync('npx tsx scripts/pre-deployment.ts');
    
    // Check exit code and output
    if (stderr && stderr.includes('NOT READY FOR DEPLOYMENT')) {
      logError('Pre-deployment validation failed - see details above');
      return false;
    }
    
    if (stdout.includes('DEPLOYMENT READY') || stdout.includes('DEPLOYMENT POSSIBLE WITH CAUTION')) {
      logSuccess('Pre-deployment validation passed');
      return true;
    }
    
    logError('Pre-deployment validation completed with issues');
    return false;
  } catch (error: any) {
    // Exit code 1 means validation failed
    if (error.code === 1) {
      logError('Pre-deployment validation failed', error);
      return false;
    }
    
    logError('Error running pre-deployment validation', error);
    return false;
  }
}

// ============================================================================
// PHASE 2: BACKUP CURRENT STATE
// ============================================================================

async function createBackup(): Promise<boolean> {
  logSection('Phase 2: Creating Backup');
  state.phase = 'backup';
  
  if (!config.backupBeforeDeploy) {
    logInfo('Backup disabled in configuration');
    return true;
  }
  
  try {
    // Save current git commit
    const { stdout: commit } = await execAsync('git rev-parse HEAD');
    state.previousCommit = commit.trim();
    logInfo(`Current commit: ${state.previousCommit.substring(0, 8)}`);
    
    // Create database backup
    logInfo('Creating database backup...');
    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFile = path.join(backupDir, `pre-deployment-${timestamp}.json`);
    
    // Export critical data
    const backup = {
      timestamp: new Date(),
      commit: state.previousCommit,
      users: await prisma.user.count(),
      knowledgeItems: await prisma.knowledgeItem.count(),
      exercises: await prisma.exercise.count(),
      subscriptions: await prisma.subscription.count(),
    };
    
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2), 'utf-8');
    state.backupFile = backupFile;
    
    logSuccess(`Backup created: ${backupFile}`);
    logInfo(`Backed up metadata for ${backup.users} users, ${backup.knowledgeItems} knowledge items`);
    
    return true;
  } catch (error: any) {
    logError('Failed to create backup', error);
    return false;
  }
}

// ============================================================================
// PHASE 3: BUILD APPLICATION
// ============================================================================

async function buildApplication(): Promise<boolean> {
  logSection('Phase 3: Building Application');
  state.phase = 'build';
  
  try {
    logInfo('Running production build...');
    
    if (options.dryRun) {
      logInfo('[DRY RUN] Would run: npm run build');
      return true;
    }
    
    // Run build with output streaming
    const buildProcess = exec('npm run build');
    
    buildProcess.stdout?.on('data', (data) => {
      process.stdout.write(data);
    });
    
    buildProcess.stderr?.on('data', (data) => {
      process.stderr.write(data);
    });
    
    await new Promise<void>((resolve, reject) => {
      buildProcess.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed with exit code ${code}`));
        }
      });
    });
    
    logSuccess('Application built successfully');
    return true;
  } catch (error: any) {
    logError('Build failed', error);
    return false;
  }
}

// ============================================================================
// PHASE 4: DATABASE MIGRATIONS
// ============================================================================

async function runDatabaseMigrations(): Promise<boolean> {
  logSection('Phase 4: Database Migrations');
  state.phase = 'migrations';
  
  try {
    logInfo('Checking for pending migrations...');
    
    if (options.dryRun) {
      logInfo('[DRY RUN] Would run: npx prisma migrate deploy');
      return true;
    }
    
    const { stdout } = await execAsync('npx prisma migrate deploy');
    console.log(stdout);
    
    logSuccess('Database migrations applied successfully');
    return true;
  } catch (error: any) {
    logError('Database migration failed', error);
    logError('This is critical - database may be in an inconsistent state');
    return false;
  }
}

// ============================================================================
// PHASE 5: DATABASE SEEDING (OPTIONAL)
// ============================================================================

async function seedDatabase(): Promise<boolean> {
  logSection('Phase 5: Database Seeding (Optional)');
  state.phase = 'seeding';
  
  if (options.skipSeed) {
    logInfo('Skipping database seeding (--skip-seed flag)');
    return true;
  }
  
  try {
    // Check if database needs seeding
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
    });
    
    if (aiConfig) {
      logInfo('Database already seeded (AI Configuration exists)');
      return true;
    }
    
    logInfo('Running database seed...');
    
    if (options.dryRun) {
      logInfo('[DRY RUN] Would run: npm run seed');
      return true;
    }
    
    const { stdout } = await execAsync('npm run seed');
    console.log(stdout);
    
    logSuccess('Database seeded successfully');
    return true;
  } catch (error: any) {
    logWarning(`Database seeding failed (non-critical): ${error.message}`);
    logInfo('Continuing with deployment...');
    return true; // Non-critical, continue
  }
}

// ============================================================================
// PHASE 6: DEPLOY TO HOSTING PLATFORM
// ============================================================================

async function deployToHosting(): Promise<boolean> {
  logSection('Phase 6: Deploying to Hosting Platform');
  state.phase = 'deployment';
  
  try {
    if (options.dryRun) {
      logInfo(`[DRY RUN] Would deploy to ${config.platform}`);
      return true;
    }
    
    switch (config.platform) {
      case 'vercel':
        return await deployToVercel();
      
      case 'custom':
        logWarning('Custom deployment not implemented - requires manual deployment');
        logInfo('Build is ready in .next directory');
        return true;
      
      case 'manual':
        logInfo('Manual deployment mode - skipping automatic deployment');
        logInfo('Build is ready in .next directory');
        logInfo('Run your deployment command manually');
        return true;
      
      default:
        logError(`Unknown deployment platform: ${config.platform}`);
        return false;
    }
  } catch (error: any) {
    logError('Deployment failed', error);
    return false;
  }
}

async function deployToVercel(): Promise<boolean> {
  logInfo('Deploying to Vercel...');
  
  try {
    // Check if Vercel CLI is installed
    try {
      await execAsync('vercel --version');
    } catch {
      logError('Vercel CLI not installed. Install with: npm install -g vercel');
      return false;
    }
    
    // Deploy to production
    logInfo('Running: vercel --prod');
    const { stdout } = await execAsync('vercel --prod');
    console.log(stdout);
    
    // Extract deployment URL from output
    const urlMatch = stdout.match(/https:\/\/[^\s]+/);
    if (urlMatch) {
      state.deploymentUrl = urlMatch[0];
      logSuccess(`Deployed to: ${state.deploymentUrl}`);
    }
    
    logSuccess('Vercel deployment completed');
    return true;
  } catch (error: any) {
    logError('Vercel deployment failed', error);
    return false;
  }
}

// ============================================================================
// PHASE 7: POST-DEPLOYMENT VERIFICATION
// ============================================================================

async function runPostDeploymentVerification(): Promise<boolean> {
  logSection('Phase 7: Post-Deployment Verification');
  state.phase = 'post-deployment-verification';
  
  if (options.dryRun) {
    logInfo('[DRY RUN] Would verify deployment');
    return true;
  }
  
  try {
    // Wait a bit for deployment to stabilize
    logInfo('Waiting 5 seconds for deployment to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify database connection
    logInfo('Verifying database connection...');
    await prisma.$queryRaw`SELECT 1`;
    logSuccess('Database connection verified');
    
    // Verify AI Configuration
    logInfo('Verifying AI Configuration...');
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { id: 'singleton' },
    });
    
    if (aiConfig) {
      logSuccess('AI Configuration verified');
    } else {
      logWarning('AI Configuration not found - may need manual setup');
    }
    
    // Check critical tables
    logInfo('Checking data integrity...');
    const counts = {
      users: await prisma.user.count(),
      knowledgeItems: await prisma.knowledgeItem.count(),
      exercises: await prisma.exercise.count(),
    };
    
    logInfo(`Data counts: ${counts.users} users, ${counts.knowledgeItems} knowledge items, ${counts.exercises} exercises`);
    
    // Test deployment URL if available
    if (state.deploymentUrl) {
      logInfo(`Testing deployment URL: ${state.deploymentUrl}`);
      
      try {
        const response = await fetch(state.deploymentUrl);
        if (response.ok) {
          logSuccess('Deployment URL is accessible');
        } else {
          logWarning(`Deployment URL returned status: ${response.status}`);
        }
      } catch (error: any) {
        logWarning(`Could not access deployment URL: ${error.message}`);
      }
    }
    
    logSuccess('Post-deployment verification completed');
    return true;
  } catch (error: any) {
    logError('Post-deployment verification failed', error);
    return false;
  }
}

// ============================================================================
// PHASE 8: SEND NOTIFICATIONS
// ============================================================================

async function sendDeploymentNotification(success: boolean): Promise<void> {
  logSection('Phase 8: Sending Notifications');
  state.phase = 'notifications';
  
  if (!config.notificationWebhook) {
    logInfo('No notification webhook configured');
    return;
  }
  
  try {
    const notification = {
      success,
      timestamp: new Date().toISOString(),
      commit: state.previousCommit,
      deploymentUrl: state.deploymentUrl,
      errors: state.errors,
      duration: Date.now() - state.startTime.getTime(),
    };
    
    await fetch(config.notificationWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
    
    logSuccess('Deployment notification sent');
  } catch (error: any) {
    logWarning(`Failed to send notification: ${error.message}`);
  }
}

// ============================================================================
// ROLLBACK FUNCTIONALITY
// ============================================================================

async function performRollback(): Promise<void> {
  logSection('ROLLBACK: Reverting to Previous Deployment');
  state.phase = 'rollback';
  
  try {
    if (!state.previousCommit) {
      logError('No previous commit recorded - cannot rollback');
      return;
    }
    
    logWarning('Rolling back to previous deployment...');
    logInfo(`Previous commit: ${state.previousCommit.substring(0, 8)}`);
    
    if (options.dryRun) {
      logInfo('[DRY RUN] Would rollback to previous commit');
      return;
    }
    
    // Create a rollback branch
    const rollbackBranch = `rollback-${Date.now()}`;
    await execAsync(`git checkout -b ${rollbackBranch}`);
    await execAsync(`git reset --hard ${state.previousCommit}`);
    
    logSuccess(`Rolled back to commit: ${state.previousCommit.substring(0, 8)}`);
    logInfo(`Created rollback branch: ${rollbackBranch}`);
    logInfo('Review the rollback and merge if satisfied');
    
    // Attempt to rollback deployment
    if (config.platform === 'vercel') {
      logInfo('To rollback Vercel deployment, run: vercel rollback');
      logInfo('Or use the Vercel dashboard to select a previous deployment');
    }
    
    logWarning('Database migrations cannot be automatically rolled back');
    logWarning('Review migration files and create manual rollback migrations if needed');
    
    if (state.backupFile) {
      logInfo(`Backup available at: ${state.backupFile}`);
    }
    
  } catch (error: any) {
    logError('Rollback failed', error);
    logError('Manual intervention required');
  }
}

// ============================================================================
// MAIN DEPLOYMENT FLOW
// ============================================================================

async function deploy() {
  try {
    console.clear();
    logSection('HypertroQ Deployment Script');
    
    logInfo(`Deployment started at: ${state.startTime.toISOString()}`);
    logInfo(`Platform: ${config.platform}`);
    logInfo(`Options: ${JSON.stringify(options)}`);
    
    if (options.dryRun) {
      logWarning('DRY RUN MODE - No actual deployment will occur');
    }
    
    // Handle rollback request
    if (options.rollback) {
      await performRollback();
      await saveDeploymentLog();
      process.exit(0);
    }
    
    // Execute deployment phases
    const phases = [
      { name: 'Pre-Deployment Validation', fn: runPreDeploymentChecks },
      { name: 'Backup', fn: createBackup },
      { name: 'Build', fn: buildApplication },
      { name: 'Database Migrations', fn: runDatabaseMigrations },
      { name: 'Database Seeding', fn: seedDatabase },
      { name: 'Deployment', fn: deployToHosting },
      { name: 'Post-Deployment Verification', fn: runPostDeploymentVerification },
    ];
    
    for (const phase of phases) {
      const success = await phase.fn();
      
      if (!success) {
        logError(`Deployment failed at phase: ${phase.name}`);
        
        if (config.rollbackOnFailure && !options.dryRun) {
          const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout,
          });
          
          const answer = await new Promise<string>(resolve => {
            readline.question(
              `\n${colors.yellow}Do you want to rollback? (yes/no): ${colors.reset}`,
              resolve
            );
          });
          
          readline.close();
          
          if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
            await performRollback();
          }
        }
        
        await sendDeploymentNotification(false);
        await saveDeploymentLog();
        process.exit(1);
      }
    }
    
    // Deployment successful
    logSection('Deployment Complete! 🎉');
    
    logSuccess('All phases completed successfully');
    logInfo(`Total time: ${Math.round((Date.now() - state.startTime.getTime()) / 1000)}s`);
    
    if (state.deploymentUrl) {
      logInfo(`Deployment URL: ${state.deploymentUrl}`);
    }
    
    await sendDeploymentNotification(true);
    const logFile = await saveDeploymentLog();
    
    logInfo(`\nDeployment log: ${logFile}`);
    
    console.log(`\n${colors.green}${colors.bold}✓ DEPLOYMENT SUCCESSFUL${colors.reset}\n`);
    
  } catch (error: any) {
    logError('Unexpected deployment error', error);
    await sendDeploymentNotification(false);
    await saveDeploymentLog();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  logError('Uncaught exception', error);
  await saveDeploymentLog();
  process.exit(1);
});

process.on('unhandledRejection', async (error) => {
  logError('Unhandled promise rejection', error);
  await saveDeploymentLog();
  process.exit(1);
});

// Run deployment
deploy();
