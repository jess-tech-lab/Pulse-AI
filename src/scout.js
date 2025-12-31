#!/usr/bin/env node
/**
 * Pulse AI - Terminal Scout
 *
 * Dynamic CLI tool for analyzing company feedback from Reddit
 * Usage: npm run scout "CompanyName" [--tenant tenantId]
 *
 * Flow: Scrape subreddits → Analyze with LLM → Run Strategic Synthesizer → Save to Supabase
 */

import { smartScrape } from './scrapers/redditScraper.js';
import { classifyFeedbackBatch, generateExecutiveSummary } from './analysis/classifier.js';
import { synthesizeFeedback, formatSynthesisReport } from './analysis/synthesizer.js';
import {
  supabaseAdmin,
  insertFeedbackItems,
  getOrCreateCompany,
  createScrapeJob,
  updateScrapeJob,
} from './db/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

// Default tenant ID for terminal runs
const DEFAULT_TENANT_ID = 'system_admin';

/**
 * Parse CLI arguments
 * Supports: npm run scout "CompanyName" --tenant "tenantId"
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    companyName: null,
    tenantId: DEFAULT_TENANT_ID,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--tenant' || arg === '-t') {
      result.tenantId = args[++i];
    } else if (!arg.startsWith('-')) {
      result.companyName = arg;
    }
  }

  return result;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    Pulse AI - Terminal Scout                   ║
╠═══════════════════════════════════════════════════════════════╣
║  Analyze company feedback from Reddit using AI                 ║
╚═══════════════════════════════════════════════════════════════╝

Usage:
  npm run scout <company_name> [options]

Arguments:
  company_name     Name of the company to analyze (required)

Options:
  --tenant, -t     Tenant ID for multi-tenancy (default: system_admin)
  --help, -h       Show this help message

Examples:
  npm run scout "Notion"
  npm run scout "Linear" --tenant "my-org-123"
  npm run scout "Figma" -t "design-team"

Environment Variables:
  OPENAI_API_KEY           Required for LLM analysis
  SUPABASE_URL             Required for database storage
  SUPABASE_SERVICE_ROLE_KEY  Required for bypassing RLS

Pipeline Steps:
  1. Smart Scrape    - Discover relevant subreddits and fetch posts
  2. Classification  - Analyze feedback with Senior PM perspective
  3. Synthesis       - Generate strategic insights and OKRs
  4. Storage         - Save snapshot to Supabase
`);
}

/**
 * Save synthesis snapshot to Supabase
 * @param {string} tenantId - Tenant ID
 * @param {string} companyId - Company ID
 * @param {Object} synthesis - The strategic synthesis object
 * @param {Object} metadata - Additional metadata
 */
async function saveSnapshot(tenantId, companyId, synthesis, metadata = {}) {
  if (!supabaseAdmin) {
    console.warn('[Scout] Supabase not configured - skipping snapshot save');
    return null;
  }

  const snapshot = {
    tenant_id: tenantId,
    company_id: companyId,
    synthesis_data: synthesis,
    metadata: {
      ...metadata,
      created_by: 'terminal_scout',
      version: '2.0',
    },
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('snapshots')
    .insert(snapshot)
    .select()
    .single();

  if (error) {
    // If table doesn't exist, try to create it
    if (error.code === '42P01') {
      console.warn('[Scout] snapshots table does not exist - creating it...');
      await createSnapshotsTable();
      return saveSnapshot(tenantId, companyId, synthesis, metadata);
    }
    throw error;
  }

  console.log(`[Scout] Snapshot saved with ID: ${data.id}`);
  return data;
}

/**
 * Create snapshots table if it doesn't exist
 * This is a fallback - ideally the table should be created via migrations
 */
async function createSnapshotsTable() {
  if (!supabaseAdmin) return;

  // Using raw SQL via RPC (requires a function in Supabase)
  // For now, just log instructions
  console.log(`
[Scout] To create the snapshots table, run this SQL in Supabase:

CREATE TABLE IF NOT EXISTS public.snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  company_id UUID REFERENCES monitored_companies(id),
  synthesis_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own tenant's snapshots
CREATE POLICY "tenant_isolation" ON public.snapshots
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true));

-- Index for fast lookups
CREATE INDEX idx_snapshots_tenant_company ON public.snapshots(tenant_id, company_id);
CREATE INDEX idx_snapshots_created_at ON public.snapshots(created_at DESC);
`);
}

/**
 * Main scout function
 */
async function scout(companyName, tenantId) {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    Pulse AI - Terminal Scout                   ║
╠═══════════════════════════════════════════════════════════════╣
║  Company: ${companyName.padEnd(50)}║
║  Tenant:  ${tenantId.padEnd(50)}║
╚═══════════════════════════════════════════════════════════════╝
`);

  const startTime = Date.now();
  const results = {
    companyName,
    tenantId,
    scrapeResults: null,
    classificationResults: null,
    executiveSummary: null,
    strategicSynthesis: null,
    snapshot: null,
    errors: [],
  };

  // Get or create company record
  let company = null;
  if (supabaseAdmin) {
    try {
      company = await getOrCreateCompany(tenantId, companyName);
      console.log(`[Scout] Company ID: ${company.id}`);
    } catch (error) {
      console.warn('[Scout] Could not create company record:', error.message);
    }
  }

  // Step 1: Smart Scrape
  console.log('\n┌─ Step 1: Smart Scraping ─────────────────────────────────┐');
  let job = null;
  try {
    if (company && supabaseAdmin) {
      job = await createScrapeJob(tenantId, company.id, 'reddit');
    }

    const scrapeResults = await smartScrape(companyName, {
      maxItemsPerSubreddit: 50,
    });

    results.scrapeResults = scrapeResults;

    if (job) {
      await updateScrapeJob(job.id, {
        items_found: scrapeResults.mentions.length,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
    }

    console.log(`└─ Scraped ${scrapeResults.mentions.length} posts from ${scrapeResults.subredditsSearched?.length || 0} subreddits`);
  } catch (error) {
    console.error('└─ Scraping error:', error.message);
    results.errors.push({ step: 'scraping', error: error.message });

    if (job) {
      await updateScrapeJob(job.id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      });
    }
  }

  // Step 2: Classification
  if (results.scrapeResults?.mentions?.length > 0) {
    console.log('\n┌─ Step 2: AI Classification ──────────────────────────────┐');
    try {
      const classificationResults = await classifyFeedbackBatch(
        results.scrapeResults.mentions,
        { batchSize: 5 }
      );

      results.classificationResults = classificationResults;
      results.executiveSummary = generateExecutiveSummary(classificationResults, companyName);

      console.log(`│  Constructive: ${classificationResults.stats.constructive}`);
      console.log(`│  Praise:       ${classificationResults.stats.praise}`);
      console.log(`│  Neutral:      ${classificationResults.stats.neutral}`);
      console.log(`└─ Classification complete`);
    } catch (error) {
      console.error('└─ Classification error:', error.message);
      results.errors.push({ step: 'classification', error: error.message });
    }
  } else {
    console.log('\n┌─ Step 2: AI Classification ──────────────────────────────┐');
    console.log('└─ Skipped (no items to classify)');
  }

  // Step 3: Strategic Synthesis
  if (results.classificationResults?.items?.length >= 5) {
    console.log('\n┌─ Step 3: Strategic Synthesis ────────────────────────────┐');
    try {
      const synthesis = await synthesizeFeedback(
        results.classificationResults.items,
        companyName
      );

      results.strategicSynthesis = synthesis;
      console.log('└─ Strategic synthesis complete');
    } catch (error) {
      console.error('└─ Synthesis error:', error.message);
      results.errors.push({ step: 'synthesis', error: error.message });
    }
  } else {
    console.log('\n┌─ Step 3: Strategic Synthesis ────────────────────────────┐');
    console.log('└─ Skipped (need at least 5 classified items)');
  }

  // Step 4: Store feedback items
  if (company && supabaseAdmin && results.classificationResults) {
    console.log('\n┌─ Step 4: Database Storage ───────────────────────────────┐');
    try {
      const itemsToStore = results.classificationResults.items.map(item => ({
        ...results.scrapeResults.mentions.find(m => m.sourceId === item.sourceId),
        classification: item,
      }));

      await insertFeedbackItems(tenantId, company.id, itemsToStore);
      console.log(`│  Stored ${itemsToStore.length} feedback items`);

      // Save snapshot
      if (results.strategicSynthesis) {
        const snapshot = await saveSnapshot(tenantId, company.id, results.strategicSynthesis, {
          totalAnalyzed: results.classificationResults.items.length,
          dataSources: ['reddit'],
          subredditsSearched: results.scrapeResults.subredditsSearched,
        });
        results.snapshot = snapshot;
      }

      console.log('└─ Storage complete');
    } catch (error) {
      console.error('└─ Storage error:', error.message);
      results.errors.push({ step: 'storage', error: error.message });
    }
  } else if (!supabaseAdmin) {
    console.log('\n┌─ Step 4: Database Storage ───────────────────────────────┐');
    console.log('└─ Skipped (Supabase not configured)');
  }

  // Final Report
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                      Scout Complete                            ║
╠═══════════════════════════════════════════════════════════════╣
║  Duration: ${(elapsed + 's').padEnd(49)}║
║  Items Analyzed: ${(results.classificationResults?.items?.length || 0).toString().padEnd(43)}║
║  Errors: ${results.errors.length.toString().padEnd(51)}║
╚═══════════════════════════════════════════════════════════════╝
`);

  // Print strategic synthesis
  if (results.strategicSynthesis) {
    console.log(formatSynthesisReport(results.strategicSynthesis, companyName));
  }

  // Print JSON output
  console.log('\n┌─ JSON Output ────────────────────────────────────────────┐');
  console.log(JSON.stringify({
    metadata: {
      companyName,
      tenantId,
      snapshotId: results.snapshot?.id || null,
      analyzedAt: new Date().toISOString(),
      totalItems: results.classificationResults?.items?.length || 0,
    },
    synthesis: results.strategicSynthesis,
    errors: results.errors,
  }, null, 2));

  return results;
}

// Main execution
async function main() {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.companyName) {
    console.error('Error: Company name is required\n');
    printHelp();
    process.exit(1);
  }

  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error(`
╔═══════════════════════════════════════════════════════════════╗
║                    Configuration Error                         ║
╠═══════════════════════════════════════════════════════════════╣
║  Missing OPENAI_API_KEY environment variable                   ║
║                                                                 ║
║  To run the scout:                                              ║
║  1. Copy .env.example to .env                                   ║
║  2. Add your OpenAI API key                                     ║
║  3. Run: npm run scout "CompanyName"                            ║
╚═══════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }

  try {
    await scout(args.companyName, args.tenantId);
  } catch (error) {
    console.error('Scout failed:', error);
    process.exit(1);
  }
}

main();
