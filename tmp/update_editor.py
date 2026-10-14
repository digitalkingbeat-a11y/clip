import re

with open("/src/components/TimelineEditor.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace legacy top header with EditorTopBar
top_bar_jsx = """      {!isMonitorMode ? (
        <EditorTopBar
          projectName={activeProject?.name || projectNameInput || "ClipFlow Project"}
          onRenameProject={(name) => {
            setProjectNameInput(name);
            if (onUpdateProject && activeProject) {
              onUpdateProject({ ...activeProject, name });
            }
          }}
          aspectRatio={aspectRatio}
          projectResolution={projectResolution}
          projectFps={projectFps}
          playheadTime={playheadTime}
          totalDuration={totalDuration}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          workspaceLayout={workspaceLayout}
          onSelectLayout={handleSelectWorkspaceLayout}
          onResetWorkspace={() => handleApplyLayoutPreset("standard")}
          onSaveWorkspace={() => setIsVisualLayoutPickerOpen(true)}
          previewZoomMode={previewZoomMode}
          onSetPreviewZoomMode={setPreviewZoomMode}
          isAssetsOpen={layout.isAssetsOpen}
          onToggleAssets={() => setLayout((prev) => ({ ...prev, isAssetsOpen: !prev.isAssetsOpen }))}
          isInspectorOpen={layout.isInspectorOpen}
          onToggleInspector={() => setLayout((prev) => ({ ...prev, isInspectorOpen: !prev.isInspectorOpen }))}
          showSafeZones={showSafeZones}
          onToggleSafeZones={() => setShowSafeZones((prev) => !prev)}
          onTriggerImport={(type) => {
            if (type === "file") {
              fileInputRef.current?.click();
            } else if (type === "camera") {
              showToast("Camera recording ready");
              fileInputRef.current?.click();
            } else if (type === "screen") {
              showToast("Screen capture ready");
              fileInputRef.current?.click();
            } else if (type === "stock" || type === "cloud") {
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              setMediaPanelTab("media");
              showToast("Opened Media Library");
            } else if (type === "audio") {
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              setMediaPanelTab("audio");
              showToast("Opened Audio Library");
            } else if (type === "image") {
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              setMediaPanelTab("media");
              showToast("Opened Images & Media");
            }
          }}
          onTriggerAI={(feature) => {
            if (feature === "captions" || feature === "transcribe") {
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              setMediaPanelTab("captions");
              handleGenerateTranscript();
            } else if (feature === "remove_bg") {
              if (selectedItem) {
                updateSelectedItemProp("removeBg", true);
                showToast(`Background removed for "${selectedItem.name}"`);
              } else {
                showToast("Select a clip on timeline to remove background");
              }
            } else if (feature === "stem_sep") {
              setIsDAWBridgeModalOpen(true);
            } else if (feature === "enhance_voice") {
              setBusRackInitialTab("mastering_rack");
              setIsBusFXRackOpen(true);
            } else if (feature === "b_roll") {
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              setMediaPanelTab("media");
              showToast("AI B-Roll library opened");
            } else if (feature === "reframe") {
              const nextRatio = aspectRatio === "16:9" ? "9:16" : "16:9";
              onSetAspectRatio(nextRatio as AspectRatio);
              showToast(`AI Reframed project canvas to ${nextRatio}`);
            }
          }}
          onOpenExportModal={handleExportProject}
          onOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onNavigateToAstraPost={() => {
            if (onNavigateToAstraPost) {
              onNavigateToAstraPost();
            } else {
              setIsAstraPostModalOpen(true);
            }
          }}
          onOpenTikTokAds={() => setIsTikTokAdsModalOpen(true)}
          onOpenDAWBridge={() => setIsDAWBridgeModalOpen(true)}
          onOpenMixer={() => {
            setBusRackInitialTab("master");
            setIsBusFXRackOpen(true);
          }}
          onCycleTrackHeight={() => {
            setGlobalTrackHeight((prev) =>
              prev === "compact" ? "normal" : prev === "normal" ? "tall" : "compact"
            );
            showToast("Toggled track heights");
          }}
          onOpenCustomLayoutPicker={() => setIsVisualLayoutPickerOpen(true)}
          onToggleMonitorMode={() => {
            if (isMonitorMode) {
              handleExitMonitorMode();
            } else {
              handleEnterMonitorMode();
            }
          }}
          onToggleFullscreen={handleToggleFullscreen}
          showToast={showToast}
        />"""

# Search for the old header starting with `{!isMonitorMode ? (` and `<header className="h-11 bg-[#12151D]`
# up to `</header>`
start_marker = "{!isMonitorMode ? (\n        <header className=\"h-11 bg-[#12151D]"
end_marker = "</header>"

start_idx = content.find(start_marker)
if start_idx == -1:
    # try looser matching
    pattern = re.compile(r"\{\!isMonitorMode \?\s*\(\s*<header className=\"h-11 bg-\[#12151D\][\s\S]*?<\/header>", re.MULTILINE)
    m = pattern.search(content)
    if m:
        content = content[:m.start()] + top_bar_jsx + content[m.end():]
        print("Replaced top header using regex!")
    else:
        print("Could not find top header!")
else:
    end_idx = content.find(end_marker, start_idx) + len(end_marker)
    content = content[:start_idx] + top_bar_jsx + content[end_idx:]
    print("Replaced top header using index!")

with open("/src/components/TimelineEditor.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated TimelineEditor.tsx successfully")
