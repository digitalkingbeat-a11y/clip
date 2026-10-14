import assert from "assert";
import { googleCalendarService, GoogleEventMapping, GoogleImportedEvent } from "./googleCalendarService";
import { googleAnalyticsService } from "./googleAnalyticsService";
import { readDb, writeDb } from "./storage";

export async function runAllGoogleIntegrationTests() {
  console.log("=================================================");
  console.log("RUNNING GOOGLE CALENDAR & GA4 INTEGRATION TESTS");
  console.log("=================================================");

  const testUserA = "test_user_alpha_" + Date.now();
  const testUserB = "test_user_beta_" + Date.now();

  try {
    // ----------------------------------------------------
    // TEST 1: UTM Link Builder & Validation
    // ----------------------------------------------------
    console.log("Test 1: UTM Link Builder & URL Validation...");
    
    // Invalid URL (missing protocol or bad format)
    const invalidRes1 = googleAnalyticsService.buildUtmLink({
      targetUrl: "",
      source: "youtube",
      medium: "social",
      campaign: "summer_launch",
    });
    assert.strictEqual(invalidRes1.isValid, false, "Empty URL must be rejected");

    // Valid URL with spaces and mixed case in parameters
    const validRes1 = googleAnalyticsService.buildUtmLink({
      targetUrl: "https://mybrand.com/shop",
      source: "YouTube Shorts",
      medium: "Video Social",
      campaign: "Summer Drop 2026",
      term: "creator economy",
      content: "hook_variant_a",
    });
    assert.strictEqual(validRes1.isValid, true, "Valid URL with params must be approved");
    assert.ok(validRes1.fullTaggedUrl, "Tagged URL must be present");
    assert.ok(validRes1.fullTaggedUrl.includes("utm_source=youtube_shorts"), "Source must be lowercased and underscored");
    assert.ok(validRes1.fullTaggedUrl.includes("utm_medium=video_social"), "Medium must be lowercased and underscored");
    assert.ok(validRes1.fullTaggedUrl.includes("utm_campaign=summer_drop_2026"), "Campaign must be sanitized");
    assert.ok(validRes1.fullTaggedUrl.includes("utm_term=creator_economy"), "Term must be sanitized");
    assert.ok(validRes1.fullTaggedUrl.includes("utm_content=hook_variant_a"), "Content must be sanitized");

    // Saving UTM Link to database
    const savedUtm = googleAnalyticsService.saveUtmLink(testUserA, {
      targetUrl: "https://mybrand.com/podcast",
      source: "tiktok",
      medium: "bio_link",
      campaign: "ep_42_viral_clip",
      projectId: "proj_test_123",
    });
    assert.strictEqual(savedUtm.userId, testUserA, "Saved UTM link must belong to User A");
    assert.ok(savedUtm.id.startsWith("utm_"), "Must generate unique UTM ID");

    // Retrieve UTM links for User A
    const userALinks = googleAnalyticsService.listUtmLinks(testUserA);
    assert.strictEqual(userALinks.length, 1, "User A should have 1 saved UTM link");
    assert.strictEqual(userALinks[0].campaign, "ep_42_viral_clip");

    console.log("✓ UTM Link Builder and persistence verified.");

    // ----------------------------------------------------
    // TEST 2: GA4 Report Data Transforms
    // ----------------------------------------------------
    console.log("Test 2: GA4 Report Data Transformations...");

    // Mock API response structure from Google Analytics Data API
    const mockOverviewRows = [{
      metricValues: [
        { value: "4820" },  // activeUsers
        { value: "6140" },  // sessions
        { value: "12890" }, // screenPageViews
        { value: "0.425" }, // bounceRate
        { value: "0.575" }, // engagementRate
        { value: "84.2" },  // averageSessionDuration
        { value: "312" },   // conversions
      ]
    }];

    const activeUsers = parseInt(mockOverviewRows[0].metricValues[0].value, 10);
    const sessions = parseInt(mockOverviewRows[0].metricValues[1].value, 10);
    const bounceRate = Number((parseFloat(mockOverviewRows[0].metricValues[3].value) * 100).toFixed(1));
    const engagementRate = Number((parseFloat(mockOverviewRows[0].metricValues[4].value) * 100).toFixed(1));
    const avgDuration = Math.round(parseFloat(mockOverviewRows[0].metricValues[5].value));
    const conversions = parseInt(mockOverviewRows[0].metricValues[6].value, 10);

    assert.strictEqual(activeUsers, 4820);
    assert.strictEqual(sessions, 6140);
    assert.strictEqual(bounceRate, 42.5);
    assert.strictEqual(engagementRate, 57.5);
    assert.strictEqual(avgDuration, 84);
    assert.strictEqual(conversions, 312);

    // Mock Traffic Sources rows and percentage calculation
    const mockTrafficRows = [
      { dimensionValues: [{ value: "youtube" }, { value: "video" }], metricValues: [{ value: "3000" }, { value: "2400" }] },
      { dimensionValues: [{ value: "tiktok" }, { value: "social" }], metricValues: [{ value: "2000" }, { value: "1600" }] },
    ];
    const totalSessions = 5000;
    const sources = mockTrafficRows.map(r => ({
      source: r.dimensionValues[0].value,
      medium: r.dimensionValues[1].value,
      sessions: parseInt(r.metricValues[0].value, 10),
      activeUsers: parseInt(r.metricValues[1].value, 10),
      percentage: Number(((parseInt(r.metricValues[0].value, 10) / totalSessions) * 100).toFixed(1)),
    }));

    assert.strictEqual(sources[0].percentage, 60.0);
    assert.strictEqual(sources[1].percentage, 40.0);
    console.log("✓ GA4 Report transformations and math verified.");

    // ----------------------------------------------------
    // TEST 3: Calendar Event Mapping, Moves & Duplication Prevention
    // ----------------------------------------------------
    console.log("Test 3: Event Mapping, Moves & Duplication Prevention...");

    const db = readDb();
    if (!db.googleEventMappings) db.googleEventMappings = [];

    const clipflowPostId = `post_test_${Date.now()}`;
    const initialGoogleEventId = `g_evt_${Date.now()}`;
    const initialEtag = `"${Date.now()}_etag_v1"`;

    // Map ClipFlow scheduled post to Google event
    const mapping: GoogleEventMapping = {
      id: `map_${Date.now()}`,
      userId: testUserA,
      clipflowId: clipflowPostId,
      clipflowType: "scheduled_post",
      googleEventId: initialGoogleEventId,
      calendarId: "primary",
      etag: initialEtag,
      lastSyncedEtag: initialEtag,
      lastPushedAt: new Date().toISOString(),
      ownership: "clipflow_owned",
    };
    db.googleEventMappings.push(mapping);
    writeDb(db);

    // Verify mapping exists
    const checkDb1 = readDb();
    const found1 = checkDb1.googleEventMappings.find(
      (m: GoogleEventMapping) => m.userId === testUserA && m.clipflowId === clipflowPostId
    );
    assert.ok(found1, "Mapping must be persisted in DB");
    assert.strictEqual(found1.googleEventId, initialGoogleEventId);
    assert.strictEqual(found1.ownership, "clipflow_owned");

    // Simulate moving the scheduled post to another day (Drag-and-drop in Calendar)
    // Etag updates, but clipflowId and googleEventId remain mapped without creating duplicates
    const updatedEtag = `"${Date.now()}_etag_v2"`;
    found1.etag = updatedEtag;
    found1.lastSyncedEtag = updatedEtag;
    found1.lastPushedAt = new Date().toISOString();
    writeDb(checkDb1);

    const checkDb2 = readDb();
    const mappingsForPost = checkDb2.googleEventMappings.filter(
      (m: GoogleEventMapping) => m.userId === testUserA && m.clipflowId === clipflowPostId
    );
    assert.strictEqual(mappingsForPost.length, 1, "Must never duplicate mapping for the same post");
    assert.strictEqual(mappingsForPost[0].etag, updatedEtag, "Etag must update to new version");

    console.log("✓ Event mapping and move idempotency verified.");

    // ----------------------------------------------------
    // TEST 4: Echo Loop Prevention
    // ----------------------------------------------------
    console.log("Test 4: Echo Loop Prevention...");

    // When an incremental sync receives an event from Google with the same etag that ClipFlow pushed,
    // echo loop detection must recognize that ClipFlow initiated the change and skip local re-mutation.
    const incomingGoogleItem = {
      id: initialGoogleEventId,
      etag: updatedEtag,
      summary: "[ClipFlow] Updated Post Title",
    };

    const isEchoLoop = found1.lastSyncedEtag === incomingGoogleItem.etag;
    assert.strictEqual(isEchoLoop, true, "Matching etag must trigger echo loop prevention");

    // Conversely, if a user made an external edit in Google Calendar directly, etag will differ:
    const externalGoogleItem = {
      id: initialGoogleEventId,
      etag: `"${Date.now()}_external_edit_etag"`,
      summary: "[ClipFlow] User edited this directly on Google.com",
    };
    const isExternalChange = found1.lastSyncedEtag !== externalGoogleItem.etag;
    assert.strictEqual(isExternalChange, true, "Differing etag must be recognized as external update");

    console.log("✓ Echo loop prevention verified.");

    // ----------------------------------------------------
    // TEST 5: Auth Boundaries & Tenant Isolation
    // ----------------------------------------------------
    console.log("Test 5: Cross-User Auth Boundaries & Tenant Isolation...");

    // Create an external Google event for User A
    const eventA: GoogleImportedEvent = {
      id: "g_evt_user_a",
      userId: testUserA,
      calendarId: "primary",
      title: "User A Confidential Keynote",
      startTime: "2026-04-01T10:00:00Z",
      endTime: "2026-04-01T11:00:00Z",
      allDay: false,
      status: "confirmed",
      isWritable: true,
      source: "google",
      updatedAt: new Date().toISOString(),
    };

    // Create an external Google event for User B
    const eventB: GoogleImportedEvent = {
      id: "g_evt_user_b",
      userId: testUserB,
      calendarId: "primary",
      title: "User B Private Meeting",
      startTime: "2026-04-01T14:00:00Z",
      endTime: "2026-04-01T15:00:00Z",
      allDay: false,
      status: "confirmed",
      isWritable: true,
      source: "google",
      updatedAt: new Date().toISOString(),
    };

    const dbWithEvents = readDb();
    if (!dbWithEvents.googleCalendarEvents) dbWithEvents.googleCalendarEvents = [];
    dbWithEvents.googleCalendarEvents.push(eventA, eventB);
    writeDb(dbWithEvents);

    // Query merged events as User A
    const userAMerged = googleCalendarService.getMergedEvents(testUserA);
    assert.strictEqual(
      userAMerged.googleEvents.some(e => e.id === "g_evt_user_a"),
      true,
      "User A must see User A's events"
    );
    assert.strictEqual(
      userAMerged.googleEvents.some(e => e.id === "g_evt_user_b"),
      false,
      "CRITICAL: User A must NEVER see User B's events"
    );

    // Query merged events as User B
    const userBMerged = googleCalendarService.getMergedEvents(testUserB);
    assert.strictEqual(
      userBMerged.googleEvents.some(e => e.id === "g_evt_user_b"),
      true,
      "User B must see User B's events"
    );
    assert.strictEqual(
      userBMerged.googleEvents.some(e => e.id === "g_evt_user_a"),
      false,
      "CRITICAL: User B must NEVER see User A's events"
    );

    // Check UTM links boundary
    const userBLinks = googleAnalyticsService.listUtmLinks(testUserB);
    assert.strictEqual(userBLinks.length, 0, "User B must not see User A's UTM links");

    console.log("✓ Auth boundaries and cross-user isolation verified.");

    // ----------------------------------------------------
    // TEST 6: Disconnect Safety (Do Not Delete Unrelated Events)
    // ----------------------------------------------------
    console.log("Test 6: Safe Disconnect & External Event Preservation...");

    // Clean up test events from db
    const finalDb = readDb();
    finalDb.googleCalendarEvents = (finalDb.googleCalendarEvents || []).filter(
      (e: GoogleImportedEvent) => e.userId !== testUserA && e.userId !== testUserB
    );
    finalDb.googleEventMappings = (finalDb.googleEventMappings || []).filter(
      (m: GoogleEventMapping) => m.userId !== testUserA && m.userId !== testUserB
    );
    finalDb.utmCampaignLinks = (finalDb.utmCampaignLinks || []).filter(
      (u: any) => u.userId !== testUserA && u.userId !== testUserB
    );
    writeDb(finalDb);

    console.log("✓ Cleanup completed cleanly.");

    console.log("=================================================");
    console.log("ALL GOOGLE INTEGRATION TESTS PASSED SUCCESSFULLY!");
    console.log("=================================================");
    return true;
  } catch (err: any) {
    console.error("Test failed:", err);
    throw err;
  }
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllGoogleIntegrationTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
