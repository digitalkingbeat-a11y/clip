import type { AdStudioWorkflowId } from "../../types";

/**
 * Ad Studio tools that still need real ad-platform connections (Meta/TikTok/Google OAuth)
 * or AI generation behind them. Until those exist they show a "coming soon" screen instead
 * of simulated campaigns, metrics or canned "AI" results.
 */
export const COMING_SOON_AD_WORKFLOWS = new Set<AdStudioWorkflowId>([
  "campaign_pipeline",
  "url_to_ad",
  "ai_ugc",
  "workflow_builder",
  "variations_lab",
  "ad_test_builder",
  "quick_ad",
  "campaign_builder",
  "multi_platform",
  "ai_analyst",
]);
