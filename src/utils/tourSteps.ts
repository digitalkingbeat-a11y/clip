import { ViewMode } from "../types";

export interface TourStep {
  id: string;
  targetSelector: string;
  fallbackSelector?: string;
  title: string;
  description: string;
  page?: ViewMode;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  category?: string;
}

export interface TourConfig {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
}

// 1. Full Studio Onboarding Tour
export const STUDIO_FULL_TOUR: TourConfig = {
  id: "studio_full",
  name: "Complete Studio Tour",
  description: "Walk through Command Center, media upload, AI Clips, AI Video, the 60/40 editor, and scheduling.",
  steps: [
    {
      id: "step_home",
      targetSelector: "#main-sidebar, #home-command-center",
      fallbackSelector: "#main-sidebar",
      page: "home",
      placement: "right",
      title: "Command Center & Dashboard",
      description: "Welcome to ClipFlow Studio! Track project pipelines, processing metrics, and recent video cuts from this unified command center.",
      category: "Overview",
    },
    {
      id: "step_create_upload",
      targetSelector: "#nav-btn-create, #btn-quick-upload-hero",
      fallbackSelector: "#nav-btn-create",
      page: "create",
      placement: "right",
      title: "Import Footage & Raw Media",
      description: "Import videos, stream recordings, camera B-roll, and audio files. ClipFlow auto-detects aspect ratios and analyzes audio waveforms.",
      category: "Import",
    },
    {
      id: "step_ai_clips",
      targetSelector: "#nav-btn-ai_clips",
      fallbackSelector: "#main-sidebar",
      page: "ai_clips",
      placement: "right",
      title: "AI Viral Clips Engine",
      description: "Transform long YouTube videos and podcasts into viral TikTok/Reels clips. Features hook scoring, face tracking, and auto-b-roll insertion.",
      category: "AI Tools",
    },
    {
      id: "step_ai_video",
      targetSelector: "#nav-btn-ai_video",
      fallbackSelector: "#main-sidebar",
      page: "ai_video",
      placement: "right",
      title: "AI Prompt-to-Video Generator",
      description: "Generate full video compositions from scripts with realistic narration, synchronized visuals, and atmospheric audio.",
      category: "AI Tools",
    },
    {
      id: "step_editor_preview",
      targetSelector: "#preview-monitor-stage",
      fallbackSelector: "#timeline-editor",
      page: "editor",
      placement: "bottom",
      title: "Pro Video Workspace (60/40 Layout)",
      description: "The video preview gives 60% of the editor height to the monitor so vertical 9:16 videos stay large and readable without clipping.",
      category: "Editor",
    },
    {
      id: "step_monitor_mode",
      targetSelector: "#btn-monitor-mode, #btn-maximize-preview",
      fallbackSelector: "#preview-monitor-stage",
      page: "editor",
      placement: "bottom",
      title: "Monitor Mode & Layout Controls",
      description: "Click 'Monitor Mode' to expand the preview across the entire workspace, or click 'Maximize' to collapse sidebars. Press Escape to exit.",
      category: "Editor",
    },
    {
      id: "step_panels",
      targetSelector: "#btn-toggle-assets-panel, #panel-assets-media",
      fallbackSelector: "#btn-toggle-assets-panel",
      page: "editor",
      placement: "bottom",
      title: "Collapsible Assets & Inspector",
      description: "Toggle and drag to resize your Assets panel on the left and Pro Inspector on the right. Panel dimensions are remembered automatically.",
      category: "Editor",
    },
    {
      id: "step_timeline_divider",
      targetSelector: "#timeline-drag-divider",
      fallbackSelector: "#timeline-editor",
      page: "editor",
      placement: "top",
      title: "Draggable 60/40 Divider",
      description: "Drag this divider up or down to adjust the balance between the video preview and the timeline tracks at any time.",
      category: "Editor",
    },
    {
      id: "step_timeline_split",
      targetSelector: "#btn-timeline-split, #btn-timeline-mode",
      fallbackSelector: "#btn-timeline-split",
      page: "editor",
      placement: "top",
      title: "Precision Cut & Split Controls",
      description: "Press 'S' to split clips at the playhead. Choose Magnetic auto-ripple or Traditional multitrack layers from the mode dropdown.",
      category: "Editor",
    },
    {
      id: "step_captions",
      targetSelector: "#tab-captions-btn, #captions-subtab",
      fallbackSelector: "#panel-assets-media",
      page: "editor",
      placement: "right",
      title: "Dynamic Captions & Kinetic Highlights",
      description: "Add auto-subtitles with karaoke highlight words, custom Google Fonts, CTA pills, and animated captions.",
      category: "Editor",
    },
    {
      id: "step_audio_fl",
      targetSelector: "#btn-project-settings, #btn-editor-top-daw",
      fallbackSelector: "#btn-project-settings",
      page: "editor",
      placement: "bottom",
      title: "Audio Mastering & FL Studio Bridge",
      description: "Handoff isolated audio stems (voice, music, SFX) to FL Studio with BPM metadata, and import master mixes with one click.",
      category: "Audio",
    },
    {
      id: "step_export",
      targetSelector: "#btn-editor-top-export",
      fallbackSelector: "#timeline-editor",
      page: "editor",
      placement: "bottom",
      title: "Export & Direct TikTok Ads API",
      description: "Render high-definition MP4/WebM videos or push creatives directly into TikTok Ads Manager with campaign integration.",
      category: "Export",
    },
    {
      id: "step_calendar",
      targetSelector: "#nav-btn-calendar",
      fallbackSelector: "#main-sidebar",
      page: "calendar",
      placement: "right",
      title: "Multi-Platform Calendar Scheduler",
      description: "Queue, schedule, and auto-publish your finished shorts across TikTok, YouTube Shorts, and Instagram Reels from one calendar.",
      category: "Publishing",
    },
  ],
};

// 2. Editor Deep-Dive Tour
export const EDITOR_TOUR: TourConfig = {
  id: "editor",
  name: "Video Editor Tour",
  description: "Master the 60/40 layout, Monitor Mode, draggable divider, multitrack timeline, trimming, and captions.",
  steps: [
    {
      id: "ed_preview",
      targetSelector: "#preview-monitor-stage",
      fallbackSelector: "#timeline-editor",
      page: "editor",
      placement: "bottom",
      title: "Video Preview Monitor (60% Height)",
      description: "The video preview dynamically fills the available monitor height while strictly preserving the composition aspect ratio (9:16, 16:9, etc.).",
    },
    {
      id: "ed_monitor_mode",
      targetSelector: "#btn-monitor-mode",
      fallbackSelector: "#preview-monitor-stage",
      page: "editor",
      placement: "bottom",
      title: "Monitor Mode (Full Workspace)",
      description: "Click here to collapse the sidebar, panels, and timeline for an immersive full-screen composition preview. Press Escape to exit.",
    },
    {
      id: "ed_maximize",
      targetSelector: "#btn-maximize-preview, #btn-fit-preview",
      fallbackSelector: "#preview-monitor-stage",
      page: "editor",
      placement: "bottom",
      title: "Maximize & Fit Controls",
      description: "Toggle Maximize to hide sidebars and minimize the timeline. Use the Fit control to recalculate exact dimensions when panels change.",
    },
    {
      id: "ed_divider",
      targetSelector: "#timeline-drag-divider",
      fallbackSelector: "#timeline-editor",
      page: "editor",
      placement: "top",
      title: "Draggable Timeline Divider",
      description: "Drag this bar up or down to adjust preview vs timeline height. By default, 60% is allocated to the preview and 40% to the timeline.",
    },
    {
      id: "ed_assets",
      targetSelector: "#btn-toggle-assets-panel",
      fallbackSelector: "#timeline-editor",
      page: "editor",
      placement: "bottom",
      title: "Collapsible Assets Panel",
      description: "Open or close the Assets panel to reclaim screen space. Contains your media files, captions, audio, and stickers.",
    },
    {
      id: "ed_inspector",
      targetSelector: "#btn-toggle-inspector-panel",
      fallbackSelector: "#timeline-editor",
      page: "editor",
      placement: "bottom",
      title: "Collapsible Pro Inspector",
      description: "Adjust color wheels, exposure, scale, rotation, audio volume, and speed for any selected timeline clip.",
    },
    {
      id: "ed_split",
      targetSelector: "#btn-timeline-split",
      fallbackSelector: "#timeline-editor",
      page: "editor",
      placement: "top",
      title: "Split at Playhead (Shortcut: S)",
      description: "Position the playhead and press 'S' to slice a clip into two independent editable segments.",
    },
    {
      id: "ed_tracks",
      targetSelector: "#timeline-tracks-header",
      fallbackSelector: "#timeline-editor",
      page: "editor",
      placement: "top",
      title: "Multitrack Organization & Height Steppers",
      description: "Organize video, voice, music, and caption tracks. Use the '+' and '-' steppers on each track to customize track heights.",
    },
    {
      id: "ed_captions",
      targetSelector: "#tab-captions-btn",
      fallbackSelector: "#panel-assets-media",
      page: "editor",
      placement: "right",
      title: "Auto Captions & Subtitles",
      description: "Generate synchronized speech captions with word-level timing, customizable font styling, and kinetic highlight presets.",
    },
    {
      id: "ed_export",
      targetSelector: "#btn-editor-top-export",
      fallbackSelector: "#timeline-editor",
      page: "editor",
      placement: "bottom",
      title: "Export & TikTok Ads Integration",
      description: "Render your video in 1080p, 4K, or 60fps, or send the finished video creative directly to TikTok Ads Manager.",
    },
  ],
};

// 3. AI Clips Tour
export const AI_CLIPS_TOUR: TourConfig = {
  id: "ai_clips",
  name: "AI Clips Tour",
  description: "Learn how to generate viral short clips with hook detection and auto-reframing.",
  steps: [
    {
      id: "clips_source",
      targetSelector: "#nav-btn-ai_clips",
      fallbackSelector: "#main-sidebar",
      page: "ai_clips",
      placement: "right",
      title: "Source Video Selection",
      description: "Select any uploaded stream recording or YouTube video to analyze for viral moments.",
    },
    {
      id: "clips_hooks",
      targetSelector: "#ai-clips-container, #main-sidebar",
      fallbackSelector: "#main-sidebar",
      page: "ai_clips",
      placement: "center",
      title: "Viral Hook Detection & Scoring",
      description: "ClipFlow evaluates speaker energy, emotional cadence, and audience retention hooks to score segments out of 10.",
    },
    {
      id: "clips_reframing",
      targetSelector: "#main-sidebar",
      page: "ai_clips",
      placement: "center",
      title: "Smart Reframing & Face Tracking",
      description: "Automatically crops 16:9 widescreen video into 9:16 vertical shorts, keeping the active speaker perfectly centered.",
    },
  ],
};

// 4. AI Video Tour
export const AI_VIDEO_TOUR: TourConfig = {
  id: "ai_video",
  name: "AI Video Generation Tour",
  description: "Learn how to generate full narrative videos from text prompts.",
  steps: [
    {
      id: "gen_prompt",
      targetSelector: "#nav-btn-ai_video",
      fallbackSelector: "#main-sidebar",
      page: "ai_video",
      placement: "right",
      title: "Prompt & Script Engine",
      description: "Type a topic or paste a script. The AI structures your video into scenes with hooks, pacing, and calls-to-action.",
    },
    {
      id: "gen_voice",
      targetSelector: "#main-sidebar",
      page: "ai_video",
      placement: "center",
      title: "Realistic Voice Narration",
      description: "Select voice personalities, languages, and accents that match your brand identity.",
    },
  ],
};

// 5. Calendar Tour
export const CALENDAR_TOUR: TourConfig = {
  id: "calendar",
  name: "Calendar & Scheduling Tour",
  description: "Master publishing automation and multi-platform posting schedules.",
  steps: [
    {
      id: "cal_grid",
      targetSelector: "#nav-btn-calendar",
      fallbackSelector: "#main-sidebar",
      page: "calendar",
      placement: "right",
      title: "Multi-Platform Calendar Grid",
      description: "View scheduled releases across TikTok, YouTube Shorts, and Instagram Reels in monthly and weekly views.",
    },
    {
      id: "cal_queue",
      targetSelector: "#main-sidebar",
      page: "calendar",
      placement: "center",
      title: "Automated Publishing Queues",
      description: "Assign optimal posting times based on audience analytics and let ClipFlow auto-publish your content.",
    },
  ],
};

// 6. Podcast Studio Tour
export const PODCAST_STUDIO_TOUR: TourConfig = {
  id: "podcast_studio",
  name: "Podcast Studio Tour",
  description: "Learn how to record remote interviews with double-ender uncompressed audio and video, then push to the multitrack editor.",
  steps: [
    {
      id: "pod_setup",
      targetSelector: "#podcast-setup-panel, #podcast-studio-root",
      fallbackSelector: "#main-sidebar",
      page: "podcast_studio",
      placement: "right",
      title: "Audio & Video Setup Green Room",
      description: "Test microphone levels, camera framing, and headphones before going live. Double-ender recording captures full uncompressed quality locally.",
    },
    {
      id: "pod_invite",
      targetSelector: "#btn-copy-podcast-invite, #podcast-invite-box",
      fallbackSelector: "#podcast-studio-root",
      page: "podcast_studio",
      placement: "bottom",
      title: "Instant Guest Invitation",
      description: "Send a direct link to your guest or email them. Guests join directly through Chrome or Safari without needing a ClipFlow account.",
    },
    {
      id: "pod_recording",
      targetSelector: "#btn-start-podcast-record, #podcast-recording-bar",
      fallbackSelector: "#podcast-studio-root",
      page: "podcast_studio",
      placement: "bottom",
      title: "Double-Ender Local Recording",
      description: "When recording starts, each participant records locally in high quality while syncing timecodes. Chunks are saved continuously to survive disconnections.",
    },
    {
      id: "pod_live_switch",
      targetSelector: "#podcast-live-switcher, #podcast-video-stage",
      fallbackSelector: "#podcast-studio-root",
      page: "podcast_studio",
      placement: "top",
      title: "Real-Time Multi-Camera Switching",
      description: "Click between host and guest video feeds or press hotkeys [1]–[5] in real time while recording. Every cut is logged automatically as a 'Live Switch' metadata track for the editor.",
    },
    {
      id: "pod_export_multitrack",
      targetSelector: "#btn-podcast-to-editor, #podcast-action-buttons",
      fallbackSelector: "#podcast-studio-root",
      page: "podcast_studio",
      placement: "bottom",
      title: "1-Click Send to Multitrack Editor",
      description: "Instantly create a VEGAS Pro editor project with isolated host and guest video and audio tracks aligned with zero drift.",
    },
  ],
};

export const ALL_TOURS: TourConfig[] = [
  STUDIO_FULL_TOUR,
  EDITOR_TOUR,
  AI_CLIPS_TOUR,
  AI_VIDEO_TOUR,
  CALENDAR_TOUR,
  PODCAST_STUDIO_TOUR,
];
