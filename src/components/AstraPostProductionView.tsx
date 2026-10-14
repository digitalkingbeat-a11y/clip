import React from "react";
import { AstraPostProductionModal } from "./AstraPostProductionModal";
import { Project, AspectRatio, AstraFinishingSettings } from "../types";

interface AstraPostProductionViewProps {
  activeProject?: Project | null;
  videoSrc?: string;
  aspectRatio?: AspectRatio;
  onApplySettings?: (settings: AstraFinishingSettings) => void;
  onOpenExportModal?: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToEditor?: () => void;
}

export const AstraPostProductionView: React.FC<AstraPostProductionViewProps> = ({
  activeProject,
  videoSrc,
  aspectRatio,
  onApplySettings,
  onOpenExportModal,
  onNavigateToCalendar,
  onNavigateToEditor,
}) => {
  return (
    <AstraPostProductionModal
      isOpen={true}
      onClose={() => {
        onNavigateToEditor?.();
      }}
      activeProject={activeProject}
      videoSrc={videoSrc}
      aspectRatio={aspectRatio}
      onApplySettings={onApplySettings}
      onOpenExportModal={onOpenExportModal}
      onNavigateToCalendar={onNavigateToCalendar}
      onNavigateToEditor={onNavigateToEditor}
      isFullView={true}
    />
  );
};
