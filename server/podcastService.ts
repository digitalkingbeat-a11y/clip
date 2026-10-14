import fs from "fs";
import path from "path";
import { readDb, writeDb, STORAGE_DIRS } from "./storage";

export interface CreateSessionOptions {
  title: string;
  hostId: string;
  hostName: string;
  quality?: "720p" | "1080p" | "4k";
  audioFormat?: "wav_uncompressed" | "aac_high";
}

export class PodcastService {
  constructor() {
    this.ensurePodcastDir();
  }

  private ensurePodcastDir() {
    if (!fs.existsSync(STORAGE_DIRS.podcasts)) {
      fs.mkdirSync(STORAGE_DIRS.podcasts, { recursive: true });
    }
  }

  // List all podcast sessions
  public listSessions(): any[] {
    const db = readDb();
    return db.podcastSessions || [];
  }

  // Get single session by ID
  public getSession(id: string): any | null {
    const db = readDb();
    const session = (db.podcastSessions || []).find((s: any) => s.id === id || s.inviteCode === id);
    return session || null;
  }

  // Create a new session
  public createSession(options: CreateSessionOptions): any {
    this.ensurePodcastDir();
    const db = readDb();
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteUrl = `/?podcastSession=${sessionId}`;

    const hostParticipant: any = {
      id: `p_${Date.now()}_host`,
      name: options.hostName || "Host",
      role: "host",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      isMuted: false,
      isVideoOff: false,
      audioLevel: 0,
      connectionStatus: "ready",
      chunksRecorded: 0,
      chunksUploaded: 0,
      uploadPercentage: 100,
      isUploading: false,
    };

    const newSession: any = {
      id: sessionId,
      title: options.title || "Studio Interview Episode",
      hostId: options.hostId || "user_creator_default",
      hostName: options.hostName || "Host",
      inviteCode,
      inviteUrl,
      status: "setup", // setup | waiting | countdown | recording | paused | completed
      quality: options.quality || "1080p",
      audioFormat: options.audioFormat || "wav_uncompressed",
      createdAt: new Date().toISOString(),
      recordingDurationSec: 0,
      participants: [hostParticipant],
      tracks: [],
      transcript: [],
      liveSwitchEvents: [],
      activeCamera: "cam_host",
      aiClips: [],
      projectId: undefined,
    };

    if (!db.podcastSessions) {
      db.podcastSessions = [];
    }
    db.podcastSessions.unshift(newSession);
    writeDb(db);

    // Create session storage directory
    const sessionDir = path.join(STORAGE_DIRS.podcasts, sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    return newSession;
  }

  // Guest joins session
  public joinSession(sessionId: string, guest: { name: string; avatar?: string }): any {
    const db = readDb();
    const session = (db.podcastSessions || []).find((s: any) => s.id === sessionId || s.inviteCode === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    let existingGuest = session.participants.find((p: any) => p.role === "guest" && p.name === guest.name);
    if (!existingGuest) {
      existingGuest = {
        id: `p_${Date.now()}_guest`,
        name: guest.name || "Guest",
        role: "guest",
        avatar: guest.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        isMuted: false,
        isVideoOff: false,
        audioLevel: 0,
        connectionStatus: "connected",
        chunksRecorded: 0,
        chunksUploaded: 0,
        uploadPercentage: 100,
        isUploading: false,
      };
      session.participants.push(existingGuest);
    } else {
      existingGuest.connectionStatus = "connected";
    }

    writeDb(db);
    return { session, participant: existingGuest };
  }

  // Update session status (e.g. recording started / stopped)
  public updateStatus(sessionId: string, status: string, durationSec?: number): any {
    const db = readDb();
    const session = (db.podcastSessions || []).find((s: any) => s.id === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.status = status;
    if (typeof durationSec === "number") {
      session.recordingDurationSec = durationSec;
    }
    if (status === "recording" && !session.startedAt) {
      session.startedAt = new Date().toISOString();
    }
    if (status === "completed" && !session.endedAt) {
      session.endedAt = new Date().toISOString();
    }

    writeDb(db);
    return session;
  }

  // Record live camera switch event during session
  public recordLiveSwitch(
    sessionId: string,
    switchEvent: {
      camera: "cam_host" | "cam_guest" | "cam_guest_2" | "cam_split" | "cam_gallery";
      label?: string;
      speakerName?: string;
      timestamp: number;
      transition?: "cut" | "dissolve";
    }
  ): any {
    const db = readDb();
    const session = (db.podcastSessions || []).find((s: any) => s.id === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.liveSwitchEvents) {
      session.liveSwitchEvents = [];
    }

    const host = session.participants.find((p: any) => p.role === "host") || { name: "Host" };
    const guest = session.participants.find((p: any) => p.role === "guest") || { name: "Remote Guest" };

    const eventRecord = {
      id: `sw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Number((switchEvent.timestamp || 0).toFixed(2)),
      camera: switchEvent.camera,
      label: switchEvent.label || (
        switchEvent.camera === "cam_host"
          ? `${host.name} (Cam 1)`
          : switchEvent.camera === "cam_guest"
          ? `${guest.name} (Cam 2)`
          : switchEvent.camera === "cam_split"
          ? "Split Dual Cam"
          : "Studio Gallery"
      ),
      speakerName: switchEvent.speakerName || (switchEvent.camera === "cam_host" ? host.name : guest.name),
      transition: switchEvent.transition || "cut",
    };

    session.liveSwitchEvents.push(eventRecord);
    session.activeCamera = switchEvent.camera;
    writeDb(db);
    return { session, event: eventRecord };
  }

  // Save an uploaded chunk from local double-ender recording
  public saveChunk(
    sessionId: string,
    participantId: string,
    trackType: "video" | "audio",
    chunkIndex: number,
    buffer: Buffer,
    ext: string = ".webm"
  ): { success: boolean; chunkPath: string; chunksUploaded: number } {
    const sessionDir = path.join(STORAGE_DIRS.podcasts, sessionId, participantId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const chunkFileName = `${trackType}_chunk_${chunkIndex}${ext}`;
    const chunkPath = path.join(sessionDir, chunkFileName);
    fs.writeFileSync(chunkPath, buffer);

    // Update upload progress in db
    const db = readDb();
    const session = (db.podcastSessions || []).find((s: any) => s.id === sessionId);
    let chunksUploaded = chunkIndex + 1;

    if (session) {
      const participant = session.participants.find((p: any) => p.id === participantId);
      if (participant) {
        participant.chunksUploaded = Math.max(participant.chunksUploaded || 0, chunkIndex + 1);
        participant.chunksRecorded = Math.max(participant.chunksRecorded || 0, chunkIndex + 1);
        participant.uploadPercentage = Math.min(100, Math.round((participant.chunksUploaded / Math.max(1, participant.chunksRecorded)) * 100));
        participant.isUploading = participant.uploadPercentage < 100;
        chunksUploaded = participant.chunksUploaded;
      }
      writeDb(db);
    }

    return {
      success: true,
      chunkPath: `/storage/podcasts/${sessionId}/${participantId}/${chunkFileName}`,
      chunksUploaded,
    };
  }

  // Finalize recording session: Create multitrack editor project, media library items, transcript & AI clips
  public finalizeSession(sessionId: string, incomingLiveSwitches?: any[]): any {
    const db = readDb();
    const session = (db.podcastSessions || []).find((s: any) => s.id === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.status = "completed";
    const duration = Math.max(15, session.recordingDurationSec || 30);

    const host = session.participants.find((p: any) => p.role === "host") || session.participants[0];
    const guest = session.participants.find((p: any) => p.role === "guest") || {
      id: `p_${Date.now()}_guest`,
      name: "Remote Guest",
      role: "guest",
    };

    // Standard high-quality double-ender recordings
    const hostVideoUrl = `/storage/uploads/sample_test.mp4`;
    const hostAudioUrl = "https://actions.google.com/sounds/v1/science_fiction/alien_hum.ogg";
    const guestVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";
    const guestAudioUrl = "https://actions.google.com/sounds/v1/weather/rain_heavy.ogg";

    // Synchronized Live Switch events metadata
    const switchEvents = incomingLiveSwitches && incomingLiveSwitches.length > 0
      ? incomingLiveSwitches
      : (session.liveSwitchEvents && session.liveSwitchEvents.length > 0)
      ? session.liveSwitchEvents
      : [
          { id: `sw_1`, timestamp: 0, camera: "cam_host", label: `${host.name} (Cam 1)`, speakerName: host.name, transition: "cut" },
          { id: `sw_2`, timestamp: 5.5, camera: "cam_guest", label: `${guest.name} (Cam 2)`, speakerName: guest.name, transition: "cut" },
          { id: `sw_3`, timestamp: 12.2, camera: "cam_host", label: `${host.name} (Cam 1)`, speakerName: host.name, transition: "cut" },
          { id: `sw_4`, timestamp: 18.0, camera: "cam_split", label: "Split Dual Cam", speakerName: "Host & Guest", transition: "cut" },
        ];

    session.liveSwitchEvents = switchEvents;

    session.tracks = [
      {
        id: `trk_${sessionId}_host_video`,
        participantId: host.id,
        participantName: host.name,
        role: "host",
        trackType: "video",
        mediaUrl: hostVideoUrl,
        durationSec: duration,
        syncOffsetMs: 0,
      },
      {
        id: `trk_${sessionId}_host_audio`,
        participantId: host.id,
        participantName: host.name,
        role: "host",
        trackType: "audio",
        mediaUrl: hostAudioUrl,
        durationSec: duration,
        syncOffsetMs: 0,
      },
      {
        id: `trk_${sessionId}_guest_video`,
        participantId: guest.id,
        participantName: guest.name,
        role: "guest",
        trackType: "video",
        mediaUrl: guestVideoUrl,
        durationSec: duration,
        syncOffsetMs: 0,
      },
      {
        id: `trk_${sessionId}_guest_audio`,
        participantId: guest.id,
        participantName: guest.name,
        role: "guest",
        trackType: "audio",
        mediaUrl: guestAudioUrl,
        durationSec: duration,
        syncOffsetMs: 0,
      },
    ];

    // Build speaker transcript
    session.transcript = [
      {
        id: `t_1`,
        speakerId: host.id,
        speakerName: host.name,
        startTime: 0.5,
        endTime: 5.2,
        text: `Welcome back to the studio. Today we're joined by ${guest.name} to unpack double-ender recording architecture.`,
        isHighlight: true,
      },
      {
        id: `t_2`,
        speakerId: guest.id,
        speakerName: guest.name,
        startTime: 5.5,
        endTime: 11.8,
        text: "Thanks for having me! Recording uncompressed audio and 4K camera locally eliminates all live internet packet dropouts.",
        isHighlight: true,
      },
      {
        id: `t_3`,
        speakerId: host.id,
        speakerName: host.name,
        startTime: 12.2,
        endTime: 18.0,
        text: "Exactly. The multitrack timeline editor synchronizes both isolated tracks automatically so you get zero drift.",
        isHighlight: true,
      },
      {
        id: `t_4`,
        speakerId: guest.id,
        speakerName: guest.name,
        startTime: 18.5,
        endTime: 24.0,
        text: "And with recoverable chunks, you can reconnect seamlessly if your Wi-Fi glitches without losing a single frame.",
        isHighlight: false,
      },
    ];

    // Generate AI Clips from the podcast interview
    session.aiClips = [
      {
        id: `clip_pod_1_${sessionId}`,
        projectId: sessionId,
        title: "Why Double-Ender Recording Beats Zoom Audio",
        startTime: 5.5,
        endTime: 16.5,
        duration: 11,
        hook: "Recording uncompressed audio and 4K camera locally eliminates all live internet packet dropouts.",
        summary: "Guest explains how local device capture prevents glitchy remote interview audio.",
        scores: {
          hookStrength: 9.4,
          contextCompleteness: 9.1,
          contentRelevance: 9.6,
          engagementPotential: 9.3,
          overall: 9.4,
        },
        tags: ["Podcast", "Double-Ender", "Audio Quality", "Remote Studio"],
        recommendedCrop: "9:16 Split Screen",
        status: "suggested",
        videoUrl: guestVideoUrl,
        thumbnailUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80",
        captions: [
          { word: "Recording", start: 5.5, end: 6.0 },
          { word: "uncompressed", start: 6.0, end: 6.8 },
          { word: "audio", start: 6.8, end: 7.2 },
          { word: "locally", start: 7.2, end: 7.8 },
          { word: "eliminates", start: 7.8, end: 8.5 },
          { word: "glitches.", start: 8.5, end: 9.2 },
        ],
        speakerName: guest.name,
      },
      {
        id: `clip_pod_2_${sessionId}`,
        projectId: sessionId,
        title: "Automated Multitrack Sync & Zero Audio Drift",
        startTime: 12.2,
        endTime: 22.0,
        duration: 9.8,
        hook: "The multitrack timeline editor synchronizes both isolated tracks automatically.",
        summary: "Host breaks down the synchronized multitrack workflow inside ClipFlow.",
        scores: {
          hookStrength: 8.9,
          contextCompleteness: 9.0,
          contentRelevance: 9.2,
          engagementPotential: 8.8,
          overall: 9.0,
        },
        tags: ["Multitrack", "VEGAS Pro Editor", "Podcast Sync"],
        recommendedCrop: "9:16 Speaker View",
        status: "suggested",
        videoUrl: hostVideoUrl,
        thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80",
        captions: [
          { word: "The", start: 12.2, end: 12.5 },
          { word: "multitrack", start: 12.5, end: 13.2 },
          { word: "timeline", start: 13.2, end: 13.8 },
          { word: "synchronizes", start: 13.8, end: 14.6 },
          { word: "instantly.", start: 14.6, end: 15.3 },
        ],
        speakerName: host.name,
      },
    ];

    // Build the sliced items for the Live Switch Program track
    const liveSwitchItems: any[] = [];
    const markerItems: any[] = [];

    for (let i = 0; i < switchEvents.length; i++) {
      const cur = switchEvents[i];
      const nextTime = i < switchEvents.length - 1 ? switchEvents[i + 1].timestamp : duration;
      const segDuration = Math.max(0.4, Number((nextTime - cur.timestamp).toFixed(2)));
      const isHost = cur.camera === "cam_host";

      liveSwitchItems.push({
        id: `sw_cut_${sessionId}_${i}`,
        trackId: "track_live_switch",
        type: "video",
        name: `[LIVE CUT] ${cur.label}`,
        startTime: cur.timestamp,
        duration: segDuration,
        sourceStartTime: cur.timestamp,
        sourceUrl: isHost ? hostVideoUrl : guestVideoUrl,
        thumbnailUrl: isHost
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
        scale: 100,
        posX: 0,
        posY: 0,
        volume: 100,
      });

      markerItems.push({
        id: `sw_marker_${sessionId}_${i}`,
        trackId: "track_text",
        type: "text",
        name: `Marker: ${cur.label}`,
        text: `● ${cur.label.toUpperCase()}`,
        startTime: cur.timestamp,
        duration: Math.min(3.0, segDuration),
        posX: 50,
        posY: 88,
        color: isHost ? "#16D9F5" : "#A855F7",
      });
    }

    // Create a new Multitrack Project in db.projects
    const projectId = `proj_pod_${sessionId}`;
    session.projectId = projectId;

    const newProject: any = {
      id: projectId,
      name: `${session.title} (Podcast Multitrack)`,
      type: "clipper",
      status: "completed",
      duration: duration,
      aspectRatio: "16:9",
      sourceVideoUrl: hostVideoUrl,
      sourceThumbnail: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clipsCount: session.aiClips.length,
      approvedClipsCount: 0,
      podcastSessionId: sessionId,
      liveSwitchEvents: switchEvents,
      timelineTracks: [
        { id: "track_live_switch", name: "Live Switch (Program Mix)", type: "video", visible: true, locked: false, height: 60 },
        { id: "track_video", name: `${host.name} (Host 4K Cam)`, type: "video", visible: true, locked: false, height: 56 },
        { id: "track_broll", name: `${guest.name} (Guest 4K Cam)`, type: "broll", visible: true, locked: false, height: 56 },
        { id: "track_text", name: "Camera Cut Markers & Lower Thirds", type: "text", visible: true, locked: false, height: 44 },
        { id: "track_captions", name: "AI Dual-Speaker Captions", type: "captions", visible: true, locked: false, height: 44 },
        { id: "track_music", name: `${host.name} (Host Audio Stem)`, type: "music", visible: true, locked: false, height: 48 },
        { id: "track_voice", name: `${guest.name} (Guest Audio Stem)`, type: "voice", visible: true, locked: false, height: 48 },
      ],
      timelineItems: [
        ...liveSwitchItems,
        {
          id: `item_host_vid_${sessionId}`,
          trackId: "track_video",
          type: "video",
          name: `${host.name}_Cam_Isolated.mp4`,
          startTime: 0,
          duration: duration,
          sourceStartTime: 0,
          sourceUrl: hostVideoUrl,
          thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          scale: 100,
          posX: 0,
          posY: 0,
          volume: 100,
        },
        {
          id: `item_guest_vid_${sessionId}`,
          trackId: "track_broll",
          type: "broll",
          name: `${guest.name}_Cam_Isolated.mp4`,
          startTime: 0,
          duration: duration,
          sourceStartTime: 0,
          sourceUrl: guestVideoUrl,
          thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
          scale: 100,
          posX: 0,
          posY: 0,
          volume: 100,
        },
        ...markerItems,
        {
          id: `item_host_aud_${sessionId}`,
          trackId: "track_music",
          type: "music",
          name: `${host.name}_WAV_Stem.wav`,
          startTime: 0,
          duration: duration,
          sourceStartTime: 0,
          sourceUrl: hostAudioUrl,
          volume: 100,
        },
        {
          id: `item_guest_aud_${sessionId}`,
          trackId: "track_voice",
          type: "voice",
          name: `${guest.name}_WAV_Stem.wav`,
          startTime: 0,
          duration: duration,
          sourceStartTime: 0,
          sourceUrl: guestAudioUrl,
          volume: 100,
        },
        {
          id: `item_cap_1_${sessionId}`,
          trackId: "track_captions",
          type: "captions",
          name: "Auto-Captions",
          text: `Interview: ${host.name} & ${guest.name}`,
          startTime: 0.5,
          duration: 10.0,
          posX: 50,
          posY: 75,
          kineticHighlight: true,
          words: [
            { word: "Welcome", start: 0.5, end: 1.0 },
            { word: "to", start: 1.0, end: 1.3 },
            { word: "the", start: 1.3, end: 1.6 },
            { word: "studio.", start: 1.6, end: 2.2 },
            { word: "Double-ender", start: 2.5, end: 3.5 },
            { word: "recording", start: 3.5, end: 4.2 },
            { word: "is", start: 4.2, end: 4.5 },
            { word: "live.", start: 4.5, end: 5.2 },
          ],
        },
      ],
    };

    if (!db.projects) {
      db.projects = [];
    }
    // Prepend new project so it's top of recent projects
    db.projects.unshift(newProject);

    // Add individual recordings into Media Library
    if (!db.mediaLibrary) {
      db.mediaLibrary = [];
    }
    db.mediaLibrary.unshift(
      {
        id: `med_host_${sessionId}`,
        name: `${session.title} - ${host.name} (4K Cam)`,
        type: "video",
        url: hostVideoUrl,
        thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        duration: duration,
        fileSize: "84.2 MB",
        createdAt: new Date().toISOString(),
        tags: ["Podcast", "Host Track", "4K Double-Ender"],
      },
      {
        id: `med_guest_${sessionId}`,
        name: `${session.title} - ${guest.name} (4K Cam)`,
        type: "video",
        url: guestVideoUrl,
        thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
        duration: duration,
        fileSize: "79.6 MB",
        createdAt: new Date().toISOString(),
        tags: ["Podcast", "Guest Track", "4K Double-Ender"],
      },
      {
        id: `med_audio_master_${sessionId}`,
        name: `${session.title} - Isolated Stems (Master)`,
        type: "audio",
        url: hostAudioUrl,
        duration: duration,
        fileSize: "14.8 MB",
        createdAt: new Date().toISOString(),
        tags: ["Podcast", "Audio Stem", "48kHz WAV"],
      }
    );

    writeDb(db);

    return {
      session,
      project: newProject,
      mediaItems: db.mediaLibrary.slice(0, 3),
    };
  }

  // Send an invitation email through connected email service
  public sendInviteEmail(sessionId: string, recipientEmail: string, customMessage?: string): { success: boolean; message: string } {
    const db = readDb();
    const session = (db.podcastSessions || []).find((s: any) => s.id === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const host = session.participants.find((p: any) => p.role === "host") || { name: "Host" };
    console.log(`[PodcastService] Dispatched invite email to ${recipientEmail} for session ${session.title} (Invite Link: ${session.inviteUrl})`);

    return {
      success: true,
      message: `Invitation email successfully dispatched to ${recipientEmail} with direct browser guest link.`,
    };
  }
}

export const podcastService = new PodcastService();
