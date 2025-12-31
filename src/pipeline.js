/**
 * Threader AI - Main Data Pipeline
 * Orchestrates scraping, classification, and storage
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

/**
 * Run the full pipeline for a company
 * @param {string} companyName - Company to search for
 * @param {string} tenantId - Tenant ID for multi-tenancy
 * @param {Object} options - Pipeline options
 */
export async function runPipeline(companyName, tenantId, options = {}) {
  const {
    maxItemsPerSubreddit = 100,
    skipClassification = false,
    skipStorage = false,
  } = options;

  console.log('='.repeat(60));
  console.log(`Threader AI Pipeline - ${companyName}`);
  console.log('='.repeat(60));
  console.log(`Tenant: ${tenantId}`);
  console.log('='.repeat(60));

  const pipelineResults = {
    companyName,
    tenantId,
    scrapeResults: null,
    classificationResults: null,
    executiveSummary: null,
    strategicSynthesis: null,
    errors: [],
  };

  // Get or create company record
  let company = null;
  if (!skipStorage && supabaseAdmin) {
    try {
      company = await getOrCreateCompany(tenantId, companyName);
      console.log(`\n[Pipeline] Company ID: ${company.id}`);
    } catch (error) {
      console.warn('[Pipeline] Could not create company record:', error.message);
    }
  }

  // Step 1: Smart Scrape (discovers subreddits + scrapes)
  console.log('\n' + '='.repeat(60));
  console.log('[Step 1] Smart Scraping with LLM-powered subreddit discovery');
  console.log('='.repeat(60));

  let job = null;
  try {
    if (company && supabaseAdmin) {
      job = await createScrapeJob(tenantId, company.id, 'reddit');
    }

    const scrapeResults = await smartScrape(companyName, {
      maxItemsPerSubreddit,
    });

    pipelineResults.scrapeResults = scrapeResults;

    if (job) {
      await updateScrapeJob(job.id, {
        items_found: scrapeResults.mentions.length,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
    }

    console.log(`\n[Pipeline] Scraped ${scrapeResults.mentions.length} relevant posts`);
  } catch (error) {
    console.error('[Pipeline] Scraping error:', error.message);
    pipelineResults.errors.push({ step: 'scraping', error: error.message });

    if (job) {
      await updateScrapeJob(job.id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      });
    }
  }

  // Step 2: Classify feedback with Senior Product Strategist
  if (!skipClassification && pipelineResults.scrapeResults?.mentions?.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('[Step 2] Analyzing feedback as Senior Product Strategist');
    console.log('='.repeat(60));

    try {
      const classificationResults = await classifyFeedbackBatch(
        pipelineResults.scrapeResults.mentions,
        {
          batchSize: 5,
          onProgress: ({ processed, total }) => {
            // Progress callback if needed
          },
        }
      );

      pipelineResults.classificationResults = classificationResults;

      // Generate executive summary
      pipelineResults.executiveSummary = generateExecutiveSummary(
        classificationResults,
        companyName
      );

      console.log(`\n[Pipeline] Analysis complete!`);
      console.log(`  - Constructive: ${classificationResults.stats.constructive}`);
      console.log(`  - Praise: ${classificationResults.stats.praise}`);
      console.log(`  - Neutral: ${classificationResults.stats.neutral}`);
    } catch (error) {
      console.error('[Pipeline] Classification error:', error.message);
      pipelineResults.errors.push({ step: 'classification', error: error.message });
    }
  } else if (skipClassification) {
    console.log('\n[Step 2] Skipping classification (skipClassification=true)');
  } else {
    console.log('\n[Step 2] Skipping classification (no items to classify)');
  }

  // Step 3: Strategic Synthesis
  if (pipelineResults.classificationResults?.items?.length >= 5) {
    console.log('\n' + '='.repeat(60));
    console.log('[Step 3] Strategic Synthesis - Deep Analysis');
    console.log('='.repeat(60));

    try {
      const synthesis = await synthesizeFeedback(
        pipelineResults.classificationResults.items,
        companyName
      );

      pipelineResults.strategicSynthesis = synthesis;
      console.log('\n[Pipeline] Strategic synthesis complete!');
    } catch (error) {
      console.error('[Pipeline] Synthesis error:', error.message);
      pipelineResults.errors.push({ step: 'synthesis', error: error.message });
    }
  } else {
    console.log('\n[Step 3] Skipping synthesis (need at least 5 classified items)');
  }

  // Step 4: Store in database
  if (!skipStorage && company && supabaseAdmin && pipelineResults.classificationResults) {
    console.log('\n' + '='.repeat(60));
    console.log('[Step 4] Storing feedback in database');
    console.log('='.repeat(60));

    try {
      // Transform classified items for storage
      const itemsToStore = pipelineResults.classificationResults.items.map(item => ({
        ...pipelineResults.scrapeResults.mentions.find(m => m.sourceId === item.sourceId),
        classification: item,
      }));

      await insertFeedbackItems(tenantId, company.id, itemsToStore);
      console.log(`[Pipeline] Stored ${itemsToStore.length} items`);
    } catch (error) {
      console.error('[Pipeline] Storage error:', error.message);
      pipelineResults.errors.push({ step: 'storage', error: error.message });
    }
  } else if (skipStorage) {
    console.log('\n[Step 3] Skipping storage (skipStorage=true)');
  } else if (!supabaseAdmin) {
    console.log('\n[Step 3] Skipping storage (Supabase not configured)');
  }

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('PIPELINE COMPLETE');
  console.log('='.repeat(60));

  if (pipelineResults.executiveSummary) {
    console.log('\n📊 EXECUTIVE SUMMARY');
    console.log('-'.repeat(40));

    const summary = pipelineResults.executiveSummary;

    console.log(`\nOverview:`);
    console.log(`  Total Feedback: ${summary.overview.totalFeedback}`);
    console.log(`  Constructive: ${summary.overview.constructive} (${summary.overview.constructiveRate}%)`);
    console.log(`  Praise: ${summary.overview.praise} (${summary.overview.praiseRate}%)`);

    if (summary.topIssues.length > 0) {
      console.log(`\n🔥 Top Issues (by priority):`);
      summary.topIssues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.category}] ${issue.title}`);
        console.log(`     Impact: ${issue.impactScore}/10 | Urgency: ${issue.urgencyScore}/10`);
        console.log(`     → ${issue.actionableInsight}`);
      });
    }

    if (summary.topTestimonials.length > 0) {
      console.log(`\n⭐ Top Testimonials:`);
      summary.topTestimonials.forEach((testimonial, i) => {
        console.log(`  ${i + 1}. "${testimonial.quote}"`);
        console.log(`     Shareability: ${testimonial.shareability}/10`);
      });
    }

    if (summary.featureAreaBreakdown.length > 0) {
      console.log(`\n📍 Feature Areas with Most Issues:`);
      summary.featureAreaBreakdown.slice(0, 5).forEach(area => {
        console.log(`  - ${area.area}: ${area.issueCount} issues (avg impact: ${area.avgImpact})`);
      });
    }
  }

  if (pipelineResults.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    pipelineResults.errors.forEach(e => console.log(`  - ${e.step}: ${e.error}`));
  }

  // Print strategic synthesis report
  if (pipelineResults.strategicSynthesis) {
    console.log('\n');
    console.log(formatSynthesisReport(pipelineResults.strategicSynthesis, companyName));
  }

  return pipelineResults;
}

// CLI execution
async function main() {
  const companyName = process.argv[2] || 'Notion';
  const tenantId = process.argv[3] || 'test-tenant-id';

  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.log('='.repeat(60));
    console.log('Threader AI Pipeline - Configuration Check');
    console.log('='.repeat(60));
    console.log('\n❌ Missing OPENAI_API_KEY');
    console.log('\nTo run the full pipeline:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Add your OpenAI API key');
    console.log('3. Run: npm run pipeline <company_name> <tenant_id>');
    process.exit(1);
  }

  try {
    const results = await runPipeline(companyName, tenantId, {
      maxItemsPerSubreddit: 50,
      skipStorage: !process.env.SUPABASE_URL,
    });

    // Output full JSON results
    console.log('\n' + '='.repeat(60));
    console.log('STRATEGIC SYNTHESIS (JSON)');
    console.log('='.repeat(60));
    console.log(JSON.stringify(results.strategicSynthesis || results.executiveSummary, null, 2));
  } catch (error) {
    console.error('Pipeline failed:', error);
    process.exit(1);
  }
}

main();
