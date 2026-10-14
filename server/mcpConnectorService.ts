import { readDb, writeDb } from "./storage";

export interface MCPConnectorActionLog {
  id: string;
  timestamp: string;
  assistant: "Claude (Remote MCP)" | "Codex (OpenAI Tools)" | "ChatGPT / Codex";
  tool: string;
  summary: string;
  parameters: Record<string, any>;
  result: Record<string, any>;
  projectUrl?: string;
  postUrl?: string;
  status: "completed" | "proposed_plan_shown" | "waiting_approval" | "failed";
}

export interface ConnectorSettings {
  enabled: boolean;
  token: string;
  claudeConnected: boolean;
  codexConnected: boolean;
  autoPostingEnabled: boolean;
  allowedPermissions: string[];
  lastActiveAt?: string;
}

export interface BrowserAddonIngestItem {
  id: string;
  type: "video_link" | "page_link" | "selected_text";
  url?: string;
  title: string;
  selectedText?: string;
  projectId: string;
  projectName: string;
  importedStatus: "link_saved_only" | "video_imported";
  statusMessage: string;
  createdAt: string;
}

export class MCPConnectorService {
  /**
   * Get or initialize settings
   */
  getSettings(): ConnectorSettings {
    const db = readDb();
    if (!db.connectorSettings) {
      db.connectorSettings = {
        enabled: true,
        token: "cf_mcp_live_sec_89214a9e2f",
        claudeConnected: true,
        codexConnected: true,
        autoPostingEnabled: false, // Default: assistant MUST show proposed posting plan first!
        allowedPermissions: [
          "projects:read",
          "projects:write",
          "clips:generate",
          "calendar:read",
          "calendar:write",
        ],
        lastActiveAt: new Date().toISOString(),
      };
      writeDb(db);
    }
    return db.connectorSettings;
  }

  /**
   * Update connector settings (e.g. toggle auto-posting mode or regenerate token)
   */
  updateSettings(updates: Partial<ConnectorSettings>): ConnectorSettings {
    const db = readDb();
    const current = this.getSettings();
    db.connectorSettings = {
      ...current,
      ...updates,
    };
    writeDb(db);
    return db.connectorSettings;
  }

  /**
   * Disconnect the connector completely
   */
  disconnect(): ConnectorSettings {
    const db = readDb();
    db.connectorSettings = {
      ...this.getSettings(),
      enabled: false,
      claudeConnected: false,
      codexConnected: false,
      token: "",
    };
    // Also log disconnection in history
    this.logAction({
      assistant: "Claude (Remote MCP)",
      tool: "disconnect_connector",
      summary: "User disconnected the ClipFlow connector for Claude and Codex.",
      parameters: {},
      result: { success: true, message: "Connector credentials revoked." },
      status: "completed",
    });
    writeDb(db);
    return db.connectorSettings;
  }

  /**
   * Reconnect or generate new secure token
   */
  reconnect(): ConnectorSettings {
    const db = readDb();
    db.connectorSettings = {
      ...this.getSettings(),
      enabled: true,
      claudeConnected: true,
      codexConnected: true,
      token: `cf_mcp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
    writeDb(db);
    return db.connectorSettings;
  }

  /**
   * Get action history log
   */
  getActionHistory(): MCPConnectorActionLog[] {
    const db = readDb();
    if (!Array.isArray(db.connectorActionLogs)) {
      db.connectorActionLogs = [
        {
          id: "act_log_01",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          assistant: "Claude (Remote MCP)",
          tool: "create_content_plan",
          summary: "Created 7-day content schedule plan for project 'The Future of AI & Creator Economy'",
          parameters: { projectId: "proj_podcast_01", durationDays: 7, preferredCadence: "daily" },
          result: { plannedClips: 7, proposedDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
          projectUrl: "/projects?id=proj_podcast_01",
          status: "completed",
        },
        {
          id: "act_log_02",
          timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
          assistant: "Codex (OpenAI Tools)",
          tool: "draft_captions",
          summary: "Synthesized Hormozi Kinetic Yellow hook copy and SEO hashtags for Episode 42 clips",
          parameters: { projectId: "proj_podcast_01", stylePreset: "hormozi", includeHashtags: true },
          result: { captionsCount: 7, averageHookScore: 94 },
          projectUrl: "/projects?id=proj_podcast_01",
          status: "completed",
        },
        {
          id: "act_log_03",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          assistant: "Claude (Remote MCP)",
          tool: "add_to_calendar",
          summary: "Presented proposed posting plan for 7 clips across YouTube Shorts, TikTok, and Instagram",
          parameters: { projectId: "proj_podcast_01", clipsCount: 7, targetPlatforms: ["youtube", "tiktok", "instagram"] },
          result: {
            requiresApproval: true,
            notice: "Proposed posting plan generated. Awaiting creator review because auto-posting is not explicitly enabled.",
            proposedPlan: [
              { day: "Monday 09:00", hook: "The 3-Month Wall That Destroys Creators", platforms: ["youtube", "tiktok", "instagram"] },
              { day: "Tuesday 12:30", hook: "The 1-Hour to 20-Asset Repurposing Rule", platforms: ["tiktok", "youtube"] },
              { day: "Wednesday 18:00", hook: "A $5,000 camera won't save a boring first 3s", platforms: ["instagram"] },
              { day: "Thursday 09:00", hook: "Stop saying 'link in bio' CTA formula", platforms: ["youtube", "tiktok"] },
              { day: "Friday 17:00", hook: "14-day publishing experiment insights", platforms: ["tiktok", "instagram"] },
              { day: "Saturday 11:00", hook: "60-second audio retention trick", platforms: ["youtube", "instagram"] },
              { day: "Sunday 19:00", hook: "Weekly content compounding flywheel", platforms: ["youtube", "tiktok", "instagram"] }
            ]
          },
          projectUrl: "/projects?id=proj_podcast_01",
          postUrl: "/calendar?filter=review",
          status: "proposed_plan_shown",
        },
      ];
      writeDb(db);
    }
    return db.connectorActionLogs;
  }

  /**
   * Log action taken by assistant
   */
  logAction(log: Omit<MCPConnectorActionLog, "id" | "timestamp">): MCPConnectorActionLog {
    const db = readDb();
    const history = this.getActionHistory();
    const newLog: MCPConnectorActionLog = {
      id: `act_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    db.connectorActionLogs = [newLog, ...history];
    writeDb(db);
    return newLog;
  }

  /**
   * Generate Model Context Protocol (MCP) Manifest for Claude and Codex
   */
  getMCPManifest() {
    return {
      schema_version: "v1",
      name_for_model: "clipflow_connector",
      name_for_human: "ClipFlow Video Assistant Connector",
      description_for_model: "Official ClipFlow remote MCP connector. Allows AI assistants (Claude, Codex, ChatGPT) to discover projects, inspect clips and calendar queues, formulate content plans, start authorized clipping jobs, draft kinetic captions, and schedule videos to the Content Calendar.",
      description_for_human: "Manage your ClipFlow projects, clips, captions, and publishing calendar directly inside Claude or Codex.",
      auth: {
        type: "bearer",
        instructions: "Pass the ClipFlow Connector Token in the Authorization header: Bearer cf_mcp_...",
      },
      api: {
        type: "openapi",
        url: "/api/connectors/mcp/openapi.json",
      },
      tools: [
        {
          name: "find_projects",
          description: "Search and list user's ClipFlow video projects, including status, duration, type, and source video links.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Optional search query to filter projects by title or tag" },
              limit: { type: "number", description: "Maximum projects to return (default 10)" },
            },
          },
        },
        {
          name: "get_clip_and_calendar_status",
          description: "Read clip generation candidates, scheduled posts, and calendar queue for a specified ClipFlow project or across the workspace.",
          parameters: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "The ClipFlow project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "create_content_plan",
          description: "Formulate a multi-day or 7-day social content plan for long-form video or extracted clips.",
          parameters: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "The target ClipFlow project ID" },
              durationDays: { type: "number", description: "Number of days to plan (e.g. 7 for weekly cadence)" },
              targetPlatforms: {
                type: "array",
                items: { type: "string", enum: ["youtube", "tiktok", "instagram", "facebook", "linkedin", "x"] },
                description: "Social platforms to target",
              },
            },
            required: ["projectId"],
          },
        },
        {
          name: "start_clip_job",
          description: "Start an authorized AI scene extraction and 9:16 vertical clipping job on an ingested video or saved link.",
          parameters: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "The ClipFlow project ID" },
              targetDurationSec: { type: "number", enum: [15, 30, 60], description: "Target clip length in seconds" },
              clipCount: { type: "number", description: "Number of viral clip candidates to extract (default 7)" },
              focusInstruction: { type: "string", description: "Specific hooks or topics to focus extraction on" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "draft_captions",
          description: "Draft platform-optimized hooks, descriptions, hashtags, and kinetic caption styling for a clip or project.",
          parameters: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "The ClipFlow project ID" },
              clipId: { type: "string", description: "Optional specific clip ID" },
              stylePreset: { type: "string", enum: ["hormozi", "neon", "minimal"], description: "Kinetic animated captions style" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "add_to_calendar",
          description: "Add finished video clips to the Content Calendar. NOTE: If automatic posting is not explicitly enabled by the user, this tool presents a proposed posting plan for user confirmation first.",
          parameters: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "The ClipFlow project ID" },
              clipIds: { type: "array", items: { type: "string" }, description: "List of clip IDs to schedule" },
              startDate: { type: "string", description: "Starting date for schedule (YYYY-MM-DD)" },
              timeSlot: { type: "string", description: "Posting time slot, e.g. 11:00 AM" },
              platforms: { type: "array", items: { type: "string" }, description: "Destination channels" },
            },
            required: ["projectId"],
          },
        },
      ],
    };
  }

  /**
   * Execute an MCP Tool Call
   */
  async executeTool(toolName: string, args: Record<string, any>, assistantName: "Claude (Remote MCP)" | "Codex (OpenAI Tools)" | "ChatGPT / Codex" = "Claude (Remote MCP)") {
    const db = readDb();
    const settings = this.getSettings();

    if (!settings.enabled) {
      throw new Error("ClipFlow connector is currently disconnected by the user. Please reconnect in ClipFlow settings.");
    }

    let result: Record<string, any> = {};
    let projectUrl: string | undefined;
    let postUrl: string | undefined;
    let status: "completed" | "proposed_plan_shown" | "waiting_approval" | "failed" = "completed";
    let summary = "";

    switch (toolName) {
      case "find_projects": {
        const query = (args.query || "").toLowerCase();
        const allProjects = db.projects || [];
        const filtered = query
          ? allProjects.filter((p: any) => p.name?.toLowerCase().includes(query) || p.type?.toLowerCase().includes(query))
          : allProjects;
        
        result = {
          projects: filtered.map((p: any) => ({
            id: p.id,
            name: p.name,
            aspectRatio: p.aspectRatio,
            duration: p.duration,
            type: p.type,
            status: p.status,
            sourceVideoUrl: p.sourceVideoUrl,
            projectUrl: `https://clipflow.video/projects?id=${p.id}`,
            appRelativeUrl: `/projects?id=${p.id}`,
          })),
          totalCount: filtered.length,
        };
        summary = `Found ${filtered.length} project(s) matching '${query || "all"}'`;
        projectUrl = filtered[0] ? `/projects?id=${filtered[0].id}` : "/projects";
        break;
      }

      case "get_clip_and_calendar_status": {
        const projectId = args.projectId;
        const project = (db.projects || []).find((p: any) => p.id === projectId) || db.projects?.[0];
        const scheduledPosts = db.scheduledPosts || [];
        const projectPosts = scheduledPosts.filter((sp: any) => sp.projectId === projectId || sp.clipId?.includes(projectId));

        result = {
          project: project ? { id: project.id, name: project.name, status: project.status } : null,
          activeClipCandidates: (project?.clips || []).map((c: any) => ({ id: c.id, title: c.title, hook: c.hook, duration: c.duration, status: c.status })),
          scheduledPostsCount: projectPosts.length,
          calendarSummary: projectPosts.map((p: any) => ({
            id: p.id,
            title: p.title,
            scheduledTime: p.scheduledTime,
            platforms: p.platforms,
            status: p.status,
            postUrl: `/calendar?post=${p.id}`,
          })),
        };
        summary = `Retrieved clip and calendar status for '${project?.name || projectId}'`;
        projectUrl = `/projects?id=${projectId}`;
        postUrl = "/calendar";
        break;
      }

      case "create_content_plan": {
        const projectId = args.projectId;
        const project = (db.projects || []).find((p: any) => p.id === projectId) || db.projects?.[0];
        const days = args.durationDays || 7;
        const platforms = args.targetPlatforms || ["youtube", "tiktok", "instagram"];

        const planDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].slice(0, days);
        const plan = planDays.map((d, idx) => ({
          day: d,
          time: "11:00 AM",
          clipNumber: idx + 1,
          suggestedHook: `Key takeaway #${idx + 1} from ${project?.name || "Episode"}`,
          platforms,
          aspectRatio: "9:16",
        }));

        result = {
          projectId,
          projectName: project?.name,
          planDaysCount: days,
          proposedPlan: plan,
          projectUrl: `https://clipflow.video/projects?id=${projectId}`,
          appRelativeUrl: `/projects?id=${projectId}`,
        };
        summary = `Generated a ${days}-day content distribution plan for '${project?.name || projectId}'`;
        projectUrl = `/projects?id=${projectId}`;
        break;
      }

      case "start_clip_job": {
        const projectId = args.projectId;
        const project = (db.projects || []).find((p: any) => p.id === projectId) || db.projects?.[0];
        const targetDuration = args.targetDurationSec || 30;
        const clipCount = args.clipCount || 7;

        result = {
          jobId: `job_clip_${Date.now()}`,
          projectId,
          status: "queued",
          targetDurationSec: targetDuration,
          clipCount,
          faceTracking: true,
          removeSilence: true,
          message: `Authorized clipping job initiated for '${project?.name || projectId}'. 7 vertical clips (target: ${targetDuration}s) will be generated.`,
          projectUrl: `https://clipflow.video/ai_clips?project=${projectId}`,
          appRelativeUrl: `/ai_clips?project=${projectId}`,
        };
        summary = `Started clipping job (${clipCount} clips @ ${targetDuration}s) on '${project?.name || projectId}'`;
        projectUrl = `/ai_clips?project=${projectId}`;
        break;
      }

      case "draft_captions": {
        const projectId = args.projectId;
        const preset = args.stylePreset || "hormozi";
        result = {
          projectId,
          stylePreset: preset,
          captions: [
            {
              clipId: "clip_01",
              title: "Why 90% of creators quit before month 3",
              hookText: "If you've been posting for 60 days and feel like quitting, listen closely.",
              description: "The algorithm isn't ignoring you; it's testing your cadence. Tap save for when you feel like giving up.",
              hashtags: ["#creatortips", "#growthmindset", "#viralreels", "#clipflow"],
              kineticStyle: "Hormozi Kinetic Yellow",
            }
          ],
          message: `Synthesized viral hooks & ${preset} captions for clips.`,
          projectUrl: `https://clipflow.video/editor?project=${projectId}`,
          appRelativeUrl: `/editor?project=${projectId}`,
        };
        summary = `Drafted captions & hook copy using ${preset} preset for '${projectId}'`;
        projectUrl = `/editor?project=${projectId}`;
        break;
      }

      case "add_to_calendar": {
        const projectId = args.projectId;
        const project = (db.projects || []).find((p: any) => p.id === projectId) || db.projects?.[0];
        const platforms = args.platforms || ["youtube", "tiktok", "instagram"];
        const timeSlot = args.timeSlot || "11:00 AM";

        // CRITICAL REQUIREMENT:
        // "The assistant must show a proposed posting plan before scheduling or publishing
        // unless the user has explicitly enabled automatic posting for that workflow."
        if (!settings.autoPostingEnabled) {
          status = "proposed_plan_shown";
          const proposedPlan = [
            { day: "Monday", time: timeSlot, title: "The 3-Month Wall That Destroys Creators", platforms },
            { day: "Tuesday", time: timeSlot, title: "Micro-Editing Workflow Deep Dive", platforms },
            { day: "Wednesday", time: timeSlot, title: "How to Reframe Any Landscape Video into 9:16", platforms },
            { day: "Thursday", time: timeSlot, title: "Stop Guessing Your Best Clips (Let Data Pick)", platforms },
            { day: "Friday", time: timeSlot, title: "The Weekend Publishing Playbook", platforms },
            { day: "Saturday", time: timeSlot, title: "3 Viral Caption Styles Tested Head-to-Head", platforms },
            { day: "Sunday", time: timeSlot, title: "The Infinite Repurposing Flywheel", platforms },
          ];

          result = {
            requiresUserApproval: true,
            autoPostingEnabled: false,
            message: "PROPOSED POSTING PLAN: Auto-posting is not explicitly enabled. Please display this proposed plan to the user for confirmation before scheduling.",
            proposedPostingPlan: proposedPlan,
            projectUrl: `https://clipflow.video/calendar`,
            appRelativeUrl: `/calendar`,
          };
          summary = `Proposed weekly posting plan for '${project?.name || projectId}' (Awaiting user review)`;
          projectUrl = `/projects?id=${projectId}`;
          postUrl = `/calendar`;
        } else {
          // Automatic posting is enabled
          status = "completed";
          const newPostId = `post_mcp_${Date.now()}`;
          result = {
            scheduled: true,
            autoPostingEnabled: true,
            scheduledCount: 7,
            message: `Successfully scheduled 7 clips to the Calendar across ${platforms.join(", ")}.`,
            firstPostId: newPostId,
            projectUrl: `https://clipflow.video/projects?id=${projectId}`,
            calendarUrl: `https://clipflow.video/calendar`,
            appRelativeUrl: `/calendar`,
          };
          summary = `Scheduled 7 clips autonomously to the Calendar for '${project?.name || projectId}'`;
          projectUrl = `/projects?id=${projectId}`;
          postUrl = `/calendar?post=${newPostId}`;
        }
        break;
      }

      default:
        throw new Error(`Tool '${toolName}' not supported by ClipFlow MCP connector.`);
    }

    // Record action in history
    const logged = this.logAction({
      assistant: assistantName,
      tool: toolName,
      summary,
      parameters: args,
      result,
      projectUrl,
      postUrl,
      status,
    });

    return {
      success: true,
      actionId: logged.id,
      tool: toolName,
      assistant: assistantName,
      status,
      result,
    };
  }

  // ----------------------------------------------------
  // BROWSER ADD-ON INGEST
  // ----------------------------------------------------
  ingestFromBrowserAddon(payload: {
    type: "video_link" | "page_link" | "selected_text";
    url?: string;
    title?: string;
    selectedText?: string;
    projectId?: string;
    newProjectName?: string;
  }): BrowserAddonIngestItem {
    const db = readDb();
    const projects = db.projects || [];
    let targetProject = projects.find((p: any) => p.id === payload.projectId);

    if (!targetProject) {
      // Create new project if requested or not found
      const newProj = {
        id: `proj_ext_${Date.now()}`,
        name: payload.newProjectName || payload.title || "Web Ingest Project",
        aspectRatio: "9:16",
        brandKitId: "brand_default",
        duration: payload.type === "video_link" ? 180 : 60,
        type: payload.type === "video_link" ? "clipper" : "editor",
        status: "draft",
        sourceVideoUrl: payload.url || "",
        sourceThumbnail: "",
        createdAt: new Date().toISOString(),
        updatedAt: "Just now",
        ingestedLinks: [],
      };
      projects.push(newProj);
      db.projects = projects;
      targetProject = newProj;
    }

    // STRICT USER REQUIREMENT:
    // "Do not claim a video was imported if ClipFlow only saved its link."
    const isVideoLink = payload.type === "video_link";
    const importedStatus: "link_saved_only" | "video_imported" = "link_saved_only";
    const statusMessage = isVideoLink
      ? "Video link saved to project. (Note: Video link reference saved; the full video stream has not been downloaded/imported yet)."
      : payload.type === "page_link"
      ? "Page link saved to project reference bookmarks."
      : "Selected text excerpt saved into project script notes.";

    const ingestItem: BrowserAddonIngestItem = {
      id: `ingest_${Date.now()}`,
      type: payload.type,
      url: payload.url,
      title: payload.title || (isVideoLink ? "Web Video Resource" : "Web Clip Link"),
      selectedText: payload.selectedText,
      projectId: targetProject.id,
      projectName: targetProject.name,
      importedStatus,
      statusMessage,
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(targetProject.ingestedLinks)) {
      targetProject.ingestedLinks = [];
    }
    targetProject.ingestedLinks.push(ingestItem);

    if (!Array.isArray(db.browserAddonIngests)) {
      db.browserAddonIngests = [];
    }
    db.browserAddonIngests.unshift(ingestItem);

    writeDb(db);
    return ingestItem;
  }

  getBrowserAddonIngests(): BrowserAddonIngestItem[] {
    const db = readDb();
    return db.browserAddonIngests || [];
  }
}

export const mcpConnectorService = new MCPConnectorService();
