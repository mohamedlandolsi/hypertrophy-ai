#!/usr/bin/env tsx

/**
 * Pre-Deployment Validation Checklist
 * 
 * Comprehensive validation script to ensure the application is ready for deployment.
 * Run this script before every deployment to catch issues early.
 * 
 * Usage:
 *   npx tsx scripts/pre-deployment.ts
 *   OR
 *   npm run validate:deployment
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

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

interface CheckResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message?: string;
  error?: string;
}

const results: CheckResult[] = [];
let criticalFailures = 0;
let warnings = 0;

// Helper functions
function printHeader(title: string) {
  console.log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
}

function printSection(title: string) {
  console.log(`\n${colors.bold}${colors.blue}▶ ${title}${colors.reset}`);
}

function printCheck(name: string, status: 'pass' | 'fail' | 'warn' | 'skip', message?: string) {
  const symbols = {
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    skip: `${colors.cyan}○${colors.reset}`,
  };
  
  console.log(`  ${symbols[status]} ${name}${message ? `: ${message}` : ''}`);
}

function addResult(category: string, name: string, status: 'pass' | 'fail' | 'warn' | 'skip', message?: string, error?: string) {
  results.push({ category, name, status, message, error });
  printCheck(name, status, message);
  
  if (status === 'fail') criticalFailures++;
  if (status === 'warn') warnings++;
}

// ============================================================================
// 1. DATABASE CHECKS
// ============================================================================

async function checkDatabase() {
  printSection('1. Database Validation');
  
  try {
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      addResult('Database', 'Database connection', 'pass', 'Successfully connected to PostgreSQL');
    } catch (error: any) {
      addResult('Database', 'Database connection', 'fail', 'Cannot connect to database', error.message);
      return; // Skip remaining checks if connection fails
    }
    
    // Check if migrations are applied
    try {
      const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5
      `;
      
      if (migrations.length > 0) {
        addResult('Database', 'Migrations applied', 'pass', `Latest: ${migrations[0].migration_name.substring(0, 40)}...`);
      } else {
        addResult('Database', 'Migrations applied', 'warn', 'No migrations found');
      }
    } catch (error: any) {
      addResult('Database', 'Migrations applied', 'warn', 'Cannot check migrations', error.message);
    }
    
    // Check for pgvector extension
    try {
      const extensions = await prisma.$queryRaw<Array<{ extname: string }>>`
        SELECT extname FROM pg_extension WHERE extname = 'vector'
      `;
      
      if (extensions.length > 0) {
        addResult('Database', 'pgvector extension', 'pass', 'Installed and enabled');
      } else {
        addResult('Database', 'pgvector extension', 'fail', 'Not installed - required for RAG system');
      }
    } catch (error: any) {
      addResult('Database', 'pgvector extension', 'fail', 'Cannot check extension', error.message);
    }
    
    // Check critical indexes
    try {
      const indexes = await prisma.$queryRaw<Array<{ tablename: string; indexname: string }>>`
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND (
          indexname LIKE '%userId%' OR 
          indexname LIKE '%knowledgeItemId%' OR
          indexname LIKE '%programId%'
        )
        LIMIT 20
      `;
      
      if (indexes.length >= 5) {
        addResult('Database', 'Performance indexes', 'pass', `${indexes.length} key indexes found`);
      } else {
        addResult('Database', 'Performance indexes', 'warn', `Only ${indexes.length} indexes found - may need optimization`);
      }
    } catch (error: any) {
      addResult('Database', 'Performance indexes', 'warn', 'Cannot check indexes', error.message);
    }
    
    // Check for orphaned records
    try {
      const orphanedChunks = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM "KnowledgeChunk" 
        WHERE "knowledgeItemId" NOT IN (SELECT id FROM "KnowledgeItem")
      `;
      
      const count = Number(orphanedChunks[0].count);
      if (count === 0) {
        addResult('Database', 'Orphaned records', 'pass', 'No orphaned knowledge chunks');
      } else {
        addResult('Database', 'Orphaned records', 'warn', `${count} orphaned knowledge chunks found - run cleanup`);
      }
    } catch (error: any) {
      addResult('Database', 'Orphaned records', 'warn', 'Cannot check orphaned records', error.message);
    }
    
    // Check AI Configuration singleton
    try {
      const aiConfig = await prisma.aIConfiguration.findUnique({
        where: { id: 'singleton' }
      });
      
      if (aiConfig) {
        const hasSystemPrompt = aiConfig.systemPrompt && aiConfig.systemPrompt.length > 100;
        if (hasSystemPrompt) {
          addResult('Database', 'AI Configuration', 'pass', 'Singleton exists with valid system prompt');
        } else {
          addResult('Database', 'AI Configuration', 'fail', 'System prompt is missing or too short');
        }
      } else {
        addResult('Database', 'AI Configuration', 'fail', 'Singleton missing - run node scripts/check-ai-config.js');
      }
    } catch (error: any) {
      addResult('Database', 'AI Configuration', 'fail', 'Cannot check AI config', error.message);
    }
    
    // Check sample data
    try {
      const userCount = await prisma.user.count();
      const knowledgeCount = await prisma.knowledgeItem.count();
      const exerciseCount = await prisma.exercise.count();
      
      if (userCount > 0 && knowledgeCount > 0 && exerciseCount > 0) {
        addResult('Database', 'Sample data', 'pass', `Users: ${userCount}, Knowledge: ${knowledgeCount}, Exercises: ${exerciseCount}`);
      } else {
        addResult('Database', 'Sample data', 'warn', `Low data counts - consider seeding: Users: ${userCount}, Knowledge: ${knowledgeCount}, Exercises: ${exerciseCount}`);
      }
    } catch (error: any) {
      addResult('Database', 'Sample data', 'warn', 'Cannot check sample data', error.message);
    }
    
  } catch (error: any) {
    addResult('Database', 'Database checks', 'fail', 'Unexpected error during database validation', error.message);
  }
}

// ============================================================================
// 2. CODE QUALITY CHECKS
// ============================================================================

async function checkCodeQuality() {
  printSection('2. Code Quality Validation');
  
  // TypeScript compilation
  try {
    console.log(`  ${colors.cyan}○${colors.reset} Running TypeScript compilation (this may take a minute)...`);
    const { stdout, stderr } = await execAsync('npm run build', { cwd: process.cwd() });
    
    if (stderr && stderr.includes('error')) {
      addResult('Code Quality', 'TypeScript compilation', 'fail', 'Build failed - check errors above');
    } else {
      addResult('Code Quality', 'TypeScript compilation', 'pass', 'Build successful');
    }
  } catch (error: any) {
    addResult('Code Quality', 'TypeScript compilation', 'fail', 'Build failed', error.message);
  }
  
  // ESLint
  try {
    console.log(`  ${colors.cyan}○${colors.reset} Running ESLint...`);
    const { stdout } = await execAsync('npm run lint', { cwd: process.cwd() });
    
    if (stdout.includes('0 errors')) {
      addResult('Code Quality', 'ESLint', 'pass', 'No linting errors');
    } else {
      addResult('Code Quality', 'ESLint', 'warn', 'Linting issues found - review output');
    }
  } catch (error: any) {
    if (error.message.includes('0 errors')) {
      addResult('Code Quality', 'ESLint', 'pass', 'No linting errors');
    } else {
      addResult('Code Quality', 'ESLint', 'warn', 'Linting issues found', error.message);
    }
  }
  
  // Check for console.log in production code (excluding scripts/ and tests/)
  try {
    const srcPath = path.join(process.cwd(), 'src');
    const consoleLogPattern = /console\.log\(/g;
    let consoleLogCount = 0;
    let guardedLogCount = 0;
    let unguardedLogCount = 0;
    
    async function scanDirectory(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n');
          
          lines.forEach(line => {
            if (line.includes('console.log(')) {
              consoleLogCount++;
              
              // Check if the console.log is guarded by development check
              if (line.includes('process.env.NODE_ENV') && line.includes('development')) {
                guardedLogCount++;
              } else {
                unguardedLogCount++;
              }
            }
          });
        }
      }
    }
    
    await scanDirectory(srcPath);
    
    if (unguardedLogCount === 0) {
      if (guardedLogCount > 0) {
        addResult('Code Quality', 'Production console.logs', 'pass', `All ${consoleLogCount} console.logs are guarded (dev-only)`);
      } else {
        addResult('Code Quality', 'Production console.logs', 'pass', 'No console.log statements found');
      }
    } else if (unguardedLogCount < 10) {
      addResult('Code Quality', 'Production console.logs', 'warn', `${unguardedLogCount} unguarded console.logs (${guardedLogCount} guarded)`);
    } else {
      addResult('Code Quality', 'Production console.logs', 'fail', `${unguardedLogCount} unguarded console.logs (${guardedLogCount} guarded) - must guard or remove`);
    }
  } catch (error: any) {
    addResult('Code Quality', 'Production console.logs', 'warn', 'Cannot scan for console.logs', error.message);
  }
  
  // Check for TODO/FIXME comments
  try {
    const srcPath = path.join(process.cwd(), 'src');
    const todoPattern = /\b(TODO|FIXME|XXX|HACK)\b/gi;
    let todoCount = 0;
    
    async function scanForTodos(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await scanForTodos(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const content = await fs.readFile(fullPath, 'utf-8');
          const matches = content.match(todoPattern);
          if (matches) {
            todoCount += matches.length;
          }
        }
      }
    }
    
    await scanForTodos(srcPath);
    
    if (todoCount === 0) {
      addResult('Code Quality', 'TODO/FIXME comments', 'pass', 'No pending TODOs found');
    } else {
      addResult('Code Quality', 'TODO/FIXME comments', 'warn', `${todoCount} TODO/FIXME comments found - review before deployment`);
    }
  } catch (error: any) {
    addResult('Code Quality', 'TODO/FIXME comments', 'skip', 'Cannot scan for TODOs', error.message);
  }
}

// ============================================================================
// 3. ENVIRONMENT CHECKS
// ============================================================================

async function checkEnvironment() {
  printSection('3. Environment Configuration');
  
  // Check .env.local exists
  try {
    await fs.access(path.join(process.cwd(), '.env.local'));
    addResult('Environment', '.env.local file', 'pass', 'Environment file exists');
  } catch {
    addResult('Environment', '.env.local file', 'fail', 'Missing .env.local file - copy from .env.example');
  }
  
  // Check required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
  ];
  
  let missingVars: string[] = [];
  let invalidVars: string[] = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else if (value.includes('your-') || value.includes('example') || value.length < 10) {
      invalidVars.push(varName);
    }
  }
  
  if (missingVars.length === 0 && invalidVars.length === 0) {
    addResult('Environment', 'Environment variables', 'pass', 'All required variables set');
  } else {
    if (missingVars.length > 0) {
      addResult('Environment', 'Missing env variables', 'fail', `Missing: ${missingVars.join(', ')}`);
    }
    if (invalidVars.length > 0) {
      addResult('Environment', 'Invalid env variables', 'fail', `Invalid/placeholder: ${invalidVars.join(', ')}`);
    }
  }
  
  // Test Supabase connection (basic URL validation only)
  // Note: We skip table queries due to RLS policies - database connectivity is verified via Prisma
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-') && !supabaseKey.includes('your-')) {
      // Just verify the URL is accessible (health check)
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
          },
        });
        
        // Any response (even 404) means Supabase is reachable
        if (response.status < 500) {
          addResult('Environment', 'Supabase connection', 'pass', 'Supabase endpoint accessible');
        } else {
          addResult('Environment', 'Supabase connection', 'warn', `Unexpected status: ${response.status}`);
        }
      } catch (fetchError: any) {
        addResult('Environment', 'Supabase connection', 'fail', 'Cannot reach Supabase endpoint', fetchError.message);
      }
    } else {
      addResult('Environment', 'Supabase connection', 'skip', 'Invalid Supabase credentials');
    }
  } catch (error: any) {
    addResult('Environment', 'Supabase connection', 'warn', 'Cannot verify Supabase connection', error.message);
  }
  
  // Test Gemini API
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (geminiKey && !geminiKey.includes('your-') && geminiKey.length > 20) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`);
      
      if (response.ok) {
        addResult('Environment', 'Gemini API', 'pass', 'API key valid');
      } else {
        addResult('Environment', 'Gemini API', 'fail', `Invalid API key (status: ${response.status})`);
      }
    } else {
      addResult('Environment', 'Gemini API', 'skip', 'Invalid or missing Gemini API key');
    }
  } catch (error: any) {
    addResult('Environment', 'Gemini API', 'warn', 'Cannot verify Gemini API', error.message);
  }
  
  // Test LemonSqueezy API
  try {
    const lemonSqueezyKey = process.env.LEMONSQUEEZY_API_KEY;
    
    if (lemonSqueezyKey && !lemonSqueezyKey.includes('your-') && lemonSqueezyKey.length > 20) {
      const response = await fetch('https://api.lemonsqueezy.com/v1/stores', {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${lemonSqueezyKey}`,
        },
      });
      
      if (response.ok) {
        addResult('Environment', 'LemonSqueezy API', 'pass', 'API key valid');
      } else {
        addResult('Environment', 'LemonSqueezy API', 'fail', `Invalid API key (status: ${response.status})`);
      }
    } else {
      addResult('Environment', 'LemonSqueezy API', 'skip', 'Invalid or missing LemonSqueezy API key');
    }
  } catch (error: any) {
    addResult('Environment', 'LemonSqueezy API', 'warn', 'Cannot verify LemonSqueezy API', error.message);
  }
}

// ============================================================================
// 4. FEATURE CHECKS
// ============================================================================

async function checkFeatures() {
  printSection('4. Feature Configuration');
  
  // Check subscription tiers configuration
  try {
    const subscriptionFile = await fs.readFile(
      path.join(process.cwd(), 'src', 'lib', 'subscription.ts'),
      'utf-8'
    );
    
    if (subscriptionFile.includes('SUBSCRIPTION_TIER_LIMITS') && 
        subscriptionFile.includes('FREE') && 
        subscriptionFile.includes('PRO_MONTHLY') &&
        subscriptionFile.includes('PRO_YEARLY')) {
      addResult('Features', 'Subscription tiers', 'pass', 'All tiers defined (FREE, PRO_MONTHLY, PRO_YEARLY)');
    } else {
      addResult('Features', 'Subscription tiers', 'fail', 'Subscription tiers not properly defined');
    }
  } catch (error: any) {
    addResult('Features', 'Subscription tiers', 'fail', 'Cannot read subscription configuration', error.message);
  }
  
  // Check tier enforcement
  try {
    const subscriptionFile = await fs.readFile(
      path.join(process.cwd(), 'src', 'lib', 'subscription.ts'),
      'utf-8'
    );
    
    if (subscriptionFile.includes('canUserSendMessage') && 
        subscriptionFile.includes('incrementUserMessageCount')) {
      addResult('Features', 'Tier enforcement', 'pass', 'Enforcement functions present');
    } else {
      addResult('Features', 'Tier enforcement', 'warn', 'Tier enforcement functions may be missing');
    }
  } catch (error: any) {
    addResult('Features', 'Tier enforcement', 'warn', 'Cannot verify tier enforcement', error.message);
  }
  
  // Check webhook endpoints exist
  try {
    const webhookPath = path.join(process.cwd(), 'src', 'app', 'api', 'webhooks', 'lemon-squeezy', 'route.ts');
    await fs.access(webhookPath);
    addResult('Features', 'Webhook endpoints', 'pass', 'LemonSqueezy webhook route exists');
  } catch {
    addResult('Features', 'Webhook endpoints', 'fail', 'Missing webhook route - payments will not sync');
  }
  
  // Check free trial configuration
  try {
    const users = await prisma.user.findMany({
      select: { freeMessagesRemaining: true },
      take: 1,
    });
    
    if (users.length > 0 && users[0].freeMessagesRemaining !== null) {
      addResult('Features', 'Free trial', 'pass', 'Free messages tracking configured');
    } else {
      addResult('Features', 'Free trial', 'warn', 'Free trial tracking may not be configured');
    }
  } catch (error: any) {
    addResult('Features', 'Free trial', 'warn', 'Cannot check free trial configuration', error.message);
  }
  
  // Check RAG system
  try {
    const chunks = await prisma.knowledgeChunk.count({
      where: {
        embeddingData: {
          not: null,
        },
      },
    });
    
    if (chunks > 100) {
      addResult('Features', 'RAG system', 'pass', `${chunks} chunks with embeddings`);
    } else if (chunks > 0) {
      addResult('Features', 'RAG system', 'warn', `Only ${chunks} chunks with embeddings - may need more knowledge`);
    } else {
      addResult('Features', 'RAG system', 'fail', 'No embeddings found - RAG system will not work');
    }
  } catch (error: any) {
    addResult('Features', 'RAG system', 'fail', 'Cannot check RAG system', error.message);
  }
  
  // Check exercise library
  try {
    const exerciseCount = await prisma.exercise.count();
    const categorizedExercises = await prisma.exercise.count({
      where: {
        primaryMuscle: {
          not: null,
        },
      },
    });
    
    if (exerciseCount > 50 && categorizedExercises > 40) {
      addResult('Features', 'Exercise library', 'pass', `${exerciseCount} exercises (${categorizedExercises} categorized)`);
    } else {
      addResult('Features', 'Exercise library', 'warn', `Low exercise count: ${exerciseCount} total, ${categorizedExercises} categorized`);
    }
  } catch (error: any) {
    addResult('Features', 'Exercise library', 'warn', 'Cannot check exercise library', error.message);
  }
}

// ============================================================================
// 5. UI/UX CHECKS
// ============================================================================

async function checkUIUX() {
  printSection('5. UI/UX Validation');
  
  // Check critical pages exist
  const criticalPages = [
    'src/app/[locale]/page.tsx', // Home
    'src/app/[locale]/chat/page.tsx', // Chat
    'src/app/[locale]/programs/page.tsx', // Programs
    'src/app/[locale]/pricing/page.tsx', // Pricing
  ];
  
  let missingPages: string[] = [];
  
  for (const page of criticalPages) {
    try {
      await fs.access(path.join(process.cwd(), page));
    } catch {
      missingPages.push(page);
    }
  }
  
  if (missingPages.length === 0) {
    addResult('UI/UX', 'Critical pages', 'pass', 'All critical pages exist');
  } else {
    addResult('UI/UX', 'Critical pages', 'fail', `Missing: ${missingPages.join(', ')}`);
  }
  
  // Check Tailwind configuration
  try {
    await fs.access(path.join(process.cwd(), 'tailwind.config.ts'));
    addResult('UI/UX', 'Tailwind config', 'pass', 'Configuration file exists');
  } catch {
    addResult('UI/UX', 'Tailwind config', 'fail', 'Missing tailwind.config.ts');
  }
  
  // Check for responsive utilities
  try {
    const layoutPath = path.join(process.cwd(), 'src', 'app', '[locale]', 'layout.tsx');
    const layout = await fs.readFile(layoutPath, 'utf-8');
    
    if (layout.includes('viewport') || layout.includes('responsive')) {
      addResult('UI/UX', 'Mobile responsive', 'pass', 'Viewport meta tag configured');
    } else {
      addResult('UI/UX', 'Mobile responsive', 'warn', 'Verify mobile responsiveness');
    }
  } catch (error: any) {
    addResult('UI/UX', 'Mobile responsive', 'warn', 'Cannot verify responsive configuration', error.message);
  }
  
  // Check internationalization
  try {
    const messagesDir = path.join(process.cwd(), 'messages');
    const languages = await fs.readdir(messagesDir);
    const jsonFiles = languages.filter(f => f.endsWith('.json'));
    
    if (jsonFiles.length >= 2) {
      addResult('UI/UX', 'Internationalization', 'pass', `${jsonFiles.length} languages configured`);
    } else {
      addResult('UI/UX', 'Internationalization', 'warn', 'Limited language support');
    }
  } catch (error: any) {
    addResult('UI/UX', 'Internationalization', 'warn', 'Cannot check i18n configuration', error.message);
  }
  
  // Check API routes exist
  const criticalApiRoutes = [
    'src/app/api/chat/route.ts',
    'src/app/api/programs/route.ts',
    'src/app/api/subscription/route.ts',
  ];
  
  let missingApiRoutes: string[] = [];
  
  for (const route of criticalApiRoutes) {
    try {
      await fs.access(path.join(process.cwd(), route));
    } catch {
      missingApiRoutes.push(route);
    }
  }
  
  if (missingApiRoutes.length === 0) {
    addResult('UI/UX', 'API routes', 'pass', 'All critical API routes exist');
  } else {
    addResult('UI/UX', 'API routes', 'fail', `Missing: ${missingApiRoutes.join(', ')}`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function generateReport() {
  printHeader('PRE-DEPLOYMENT VALIDATION REPORT');
  
  const totalChecks = results.length;
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  
  console.log(`\n${colors.bold}Summary:${colors.reset}`);
  console.log(`  Total Checks:     ${totalChecks}`);
  console.log(`  ${colors.green}✓ Passed:${colors.reset}        ${passed}`);
  console.log(`  ${colors.red}✗ Failed:${colors.reset}        ${failed}`);
  console.log(`  ${colors.yellow}⚠ Warnings:${colors.reset}      ${warned}`);
  console.log(`  ${colors.cyan}○ Skipped:${colors.reset}       ${skipped}`);
  
  // Critical failures summary
  if (criticalFailures > 0) {
    console.log(`\n${colors.bold}${colors.red}❌ CRITICAL FAILURES (${criticalFailures}):${colors.reset}`);
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`  ${colors.red}✗${colors.reset} [${r.category}] ${r.name}`);
        if (r.message) console.log(`    └─ ${r.message}`);
        if (r.error) console.log(`    └─ Error: ${r.error.substring(0, 100)}`);
      });
  }
  
  // Warnings summary
  if (warnings > 0) {
    console.log(`\n${colors.bold}${colors.yellow}⚠ WARNINGS (${warnings}):${colors.reset}`);
    results
      .filter(r => r.status === 'warn')
      .forEach(r => {
        console.log(`  ${colors.yellow}⚠${colors.reset} [${r.category}] ${r.name}`);
        if (r.message) console.log(`    └─ ${r.message}`);
      });
  }
  
  // Final verdict
  console.log('\n' + '═'.repeat(63));
  
  if (criticalFailures === 0 && warnings === 0) {
    console.log(`${colors.bold}${colors.green}✅ DEPLOYMENT READY!${colors.reset}`);
    console.log(`All checks passed. The application is ready for deployment.`);
  } else if (criticalFailures === 0 && warnings <= 5) {
    console.log(`${colors.bold}${colors.yellow}⚠ DEPLOYMENT POSSIBLE WITH CAUTION${colors.reset}`);
    console.log(`No critical failures, but ${warnings} warning(s) need attention.`);
    console.log(`Review warnings before deploying.`);
  } else if (criticalFailures > 0) {
    console.log(`${colors.bold}${colors.red}❌ NOT READY FOR DEPLOYMENT${colors.reset}`);
    console.log(`${criticalFailures} critical failure(s) must be fixed before deployment.`);
    console.log(`\nRecommended actions:`);
    
    const failedChecks = results.filter(r => r.status === 'fail');
    if (failedChecks.some(r => r.category === 'Database')) {
      console.log(`  1. Run: ${colors.cyan}npx prisma migrate deploy${colors.reset}`);
      console.log(`  2. Run: ${colors.cyan}node scripts/check-ai-config.js${colors.reset}`);
    }
    if (failedChecks.some(r => r.category === 'Code Quality')) {
      console.log(`  3. Fix TypeScript/ESLint errors: ${colors.cyan}npm run build && npm run lint${colors.reset}`);
    }
    if (failedChecks.some(r => r.category === 'Environment')) {
      console.log(`  4. Configure environment variables in ${colors.cyan}.env.local${colors.reset}`);
    }
  }
  
  console.log('═'.repeat(63) + '\n');
  
  // Exit with appropriate code
  if (criticalFailures > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

async function main() {
  printHeader('HYPERTROQ PRE-DEPLOYMENT VALIDATION');
  console.log(`${colors.cyan}Starting comprehensive validation...${colors.reset}`);
  console.log(`${colors.cyan}This may take 2-3 minutes to complete.${colors.reset}\n`);
  
  try {
    await checkDatabase();
    await checkCodeQuality();
    await checkEnvironment();
    await checkFeatures();
    await checkUIUX();
    
    await generateReport();
  } catch (error: any) {
    console.error(`\n${colors.red}${colors.bold}Fatal Error:${colors.reset} ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation
main();
