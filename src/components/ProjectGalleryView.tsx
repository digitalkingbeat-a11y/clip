import React, { useState, useMemo } from "react";
import {
  LayoutTemplate,
  Search,
  Sparkles,
  Play,
  Film,
  Scissors,
  Check,
  Layers,
  ArrowRight,
  Clock,
  Tv,
  Smartphone,
  Square,
  Music,
  FolderOpen,
  Info,
  X,
  Maximize2,
  Sliders,
  Share2,
} from "lucide-react";
import {
  PROJECT_TEMPLATES,
  ProjectTemplate,
  TemplateBeat,
} from "../data/projectTemplates";
import { AspectRatio } from "../types";

interface ProjectGalleryViewProps {
  onSelectTemplate: (template: ProjectTemplate) => void;
  onStartBlank?: () => void;
}

export const ProjectGalleryView: React.FC<ProjectGalleryViewProps> = ({
  onSelectTemplate,
  onStartBlank,
}) => {
  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRatio, setSelectedRatio] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Detailed Template Inspection Modal
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return PROJECT_TEMPLATES.filter((tpl) => {
      const matchCat = selectedCategory === "all" || tpl.category === selectedCategory;
      const matchRatio = selectedRatio === "all" || tpl.aspectRatio === selectedRatio;
      const matchQuery =
        !searchQuery.trim() ||
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchRatio && matchQuery;
    });
  }, [selectedCategory, selectedRatio, searchQuery]);

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "education", label: "Tutorial & Tech" },
    { id: "documentary", label: "Documentary" },
    { id: "advertising", label: "Short Ad (9:16)" },
    { id: "podcast", label: "Studio Podcast" },
    { id: "lifestyle", label: "Fitness & Sport" },
    { id: "real_estate", label: "Real Estate" },
  ];

  return (
    <div
      id="project-gallery-view"
      className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+110px)] md:pb-28 bg-[#080A0F] text-gray-200 select-none"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header & Context */}
        <div className="border-b border-[#272D3A] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-[#16D9F5]" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                Project Gallery & Industry Blueprints
              </h1>
            </div>
            <p className="text-xs text-[#9CA5B5] mt-1 leading-relaxed">
              Select pre-configured multi-track timeline templates crafted for specific industries. Each blueprint loads authentic narrative pacing, track structures, and placeholder media assets into the editor.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onStartBlank && (
              <button
                id="btn-gallery-start-blank"
                onClick={onStartBlank}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#11151E] hover:bg-[#1A202C] text-slate-300 hover:text-white border border-[#272D3A] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Create an empty timeline project"
              >
                <span>Start with Blank Timeline</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#11151E] border border-[#272D3A] rounded-xl p-3.5 space-y-3 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-gallery-search"
                type="text"
                placeholder="Search templates (e.g. tutorial, documentary, short ad)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#272D3A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#16D9F5] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Aspect Ratio Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-lg border border-[#272D3A] text-xs font-medium self-start md:self-auto">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider px-2 font-mono">Ratio:</span>
              <button
                onClick={() => setSelectedRatio("all")}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedRatio === "all" ? "bg-[#1E2433] text-white font-bold" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedRatio("16:9")}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedRatio === "16:9" ? "bg-[#1E2433] text-white font-bold" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Tv className="w-3 h-3 text-cyan-400" />
                <span>16:9</span>
              </button>
              <button
                onClick={() => setSelectedRatio("9:16")}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedRatio === "9:16" ? "bg-[#1E2433] text-white font-bold" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Smartphone className="w-3 h-3 text-rose-400" />
                <span>9:16</span>
              </button>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap text-xs border ${
                    isActive
                      ? "bg-[#168CFF]/20 border-[#16D9F5]/50 text-[#16D9F5] shadow-sm font-semibold"
                      : "bg-[#0B0E14] border-[#272D3A] text-gray-400 hover:text-gray-200 hover:border-gray-600"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-[#11151E] border border-[#272D3A] rounded-xl p-12 text-center space-y-3">
            <LayoutTemplate className="w-8 h-8 text-gray-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No matching templates found</h3>
            <p className="text-xs text-[#9CA5B5] max-w-sm mx-auto">
              Try adjusting your search terms or switching the category filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedRatio("all");
                setSearchQuery("");
              }}
              className="text-xs text-[#16D9F5] hover:underline font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((template) => {
              return (
                <div
                  key={template.id}
                  id={`template-card-${template.id}`}
                  className="bg-[#11151E] border border-[#272D3A] hover:border-[#168CFF]/60 rounded-xl overflow-hidden flex flex-col justify-between transition-all group shadow-sm hover:shadow-lg hover:shadow-cyan-950/20"
                >
                  {/* Card Visual Hero Banner */}
                  <div className={`relative h-44 bg-gradient-to-br ${template.color.gradient} overflow-hidden border-b border-[#272D3A] p-4 flex flex-col justify-between`}>
                    {/* Top Row: Ratio Badge & Category Label */}
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[11px] font-semibold text-white/90 drop-shadow-sm">
                        {template.industry}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-white border border-white/10 flex items-center gap-1">
                          {template.aspectRatio === "9:16" ? (
                            <Smartphone className="w-3 h-3 text-rose-400" />
                          ) : (
                            <Tv className="w-3 h-3 text-cyan-400" />
                          )}
                          <span>{template.aspectRatio}</span>
                        </span>
                        <span className="text-[10px] font-mono bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-gray-200 border border-white/10">
                          {template.durationFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Center Miniature Multi-Track Timeline Diagram */}
                    <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-2.5 space-y-1.5 my-auto z-10">
                      <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 pb-1 border-b border-white/10">
                        <span>Timeline Architecture</span>
                        <span className="text-cyan-300 font-bold">{template.tracks.length} Tracks</span>
                      </div>
                      {/* Mini Track Lanes */}
                      <div className="space-y-1">
                        {template.tracks.slice(0, 3).map((tr) => (
                          <div key={tr.id} className="flex items-center gap-1.5 text-[9px] font-mono">
                            <span className="w-10 text-gray-400 truncate">{tr.name.split(" ")[0]}</span>
                            <div className="flex-1 h-2 bg-black/60 rounded-sm overflow-hidden flex gap-0.5 p-0.5">
                              <div
                                style={{ backgroundColor: tr.color, width: "65%" }}
                                className="h-full rounded-[1px] opacity-90"
                              />
                              <div
                                style={{ backgroundColor: tr.color, width: "30%" }}
                                className="h-full rounded-[1px] opacity-75"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Metadata & Hover Inspector Trigger */}
                    <div className="flex items-center justify-between z-10 pt-1">
                      <div className="text-[10px] text-gray-300 flex items-center gap-2">
                        <span>{template.timelineItems.length} clips structured</span>
                        <span aria-hidden="true">·</span>
                        <span>{template.placeholderMedia.length} assets ready</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template);
                        }}
                        className="text-[10px] text-[#16D9F5] hover:text-white flex items-center gap-1 font-semibold cursor-pointer bg-black/40 px-2 py-0.5 rounded border border-white/10 hover:border-cyan-400"
                        title="Inspect full timeline structure & narrative beats"
                      >
                        <Maximize2 className="w-2.5 h-2.5" />
                        <span>Inspect</span>
                      </button>
                    </div>

                    {/* Decorative subtle grid background lines */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />
                  </div>

                  {/* Card Content & Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#16D9F5] transition-colors">
                        {template.title}
                      </h3>
                      <p className="text-xs text-[#9CA5B5] mt-1.5 line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>

                      {/* Narrative Beats Quick Overview */}
                      <div className="mt-3 bg-[#0B0E14] border border-[#272D3A] rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                          <span className="font-semibold text-gray-300">Narrative Beats</span>
                          <span className="text-[9px] text-[#16D9F5]">Structured Flow</span>
                        </div>
                        <div className="space-y-1">
                          {template.narrativeBeats.slice(0, 3).map((beat, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[10px] text-gray-300">
                              <span className="truncate max-w-[170px] text-gray-200">
                                {idx + 1}. {beat.name}
                              </span>
                              <span className="font-mono text-[9px] text-gray-400 shrink-0">
                                {beat.timeRange}
                              </span>
                            </div>
                          ))}
                          {template.narrativeBeats.length > 3 && (
                            <div className="text-[9px] text-gray-400 font-mono text-right">
                              + {template.narrativeBeats.length - 3} more beats
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Target Platforms */}
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-mono">Optimized for:</span>
                        {template.targetPlatforms.map((plat) => (
                          <span
                            key={plat}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[#161B26] text-gray-300 border border-[#272D3A] font-medium"
                          >
                            {plat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Primary Action Button */}
                    <div className="pt-3 border-t border-[#272D3A] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTemplate(template)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1C222E] border border-transparent hover:border-[#272D3A] transition-colors cursor-pointer"
                      >
                        Preview Beats
                      </button>

                      <button
                        type="button"
                        id={`btn-use-template-${template.id}`}
                        onClick={() => onSelectTemplate(template)}
                        className="btn-clipflow-primary px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <span>Load Template</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Template Inspector Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#272D3A] bg-[#0D1017] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#16D9F5]/10 text-[#16D9F5] border border-[#16D9F5]/20 font-bold">
                    {previewTemplate.industry}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {previewTemplate.aspectRatio} · {previewTemplate.durationFormatted}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                  {previewTemplate.title}
                </h2>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#1E2433] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs text-gray-200">
              <p className="text-xs text-[#9CA5B5] leading-relaxed">
                {previewTemplate.description}
              </p>

              {/* Narrative Beats Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Narrative Beat Breakdown ({previewTemplate.narrativeBeats.length} Chapters)
                  </h3>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Total: {previewTemplate.durationFormatted}
                  </span>
                </div>
                <div className="bg-[#0B0E14] border border-[#272D3A] rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#272D3A] bg-[#11151E] text-[10px] font-mono text-gray-400 uppercase">
                        <th className="py-2 px-3">Beat</th>
                        <th className="py-2 px-3">Time Range</th>
                        <th className="py-2 px-3">Duration</th>
                        <th className="py-2 px-3">Production Focus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#272D3A]/60 text-[11px]">
                      {previewTemplate.narrativeBeats.map((beat, i) => (
                        <tr key={i} className="hover:bg-[#161B26] transition-colors">
                          <td className="py-2 px-3 font-semibold text-white">
                            {i + 1}. {beat.name}
                          </td>
                          <td className="py-2 px-3 font-mono text-cyan-400">
                            {beat.timeRange}
                          </td>
                          <td className="py-2 px-3 font-mono text-gray-400">
                            {beat.durationSec}s
                          </td>
                          <td className="py-2 px-3 text-gray-300">
                            {beat.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Multi-Track Timeline Architecture */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Timeline Track Layout ({previewTemplate.tracks.length} Active Tracks)
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Pre-assigned heights & audio routing
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {previewTemplate.tracks.map((tr) => (
                    <div
                      key={tr.id}
                      className="bg-[#0B0E14] border border-[#272D3A] rounded-lg p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: tr.color }}
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        />
                        <div>
                          <p className="font-semibold text-white">{tr.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-mono">
                            Type: {tr.type}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {previewTemplate.timelineItems.filter((i) => i.trackId === tr.id).length} items
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pre-packaged Media Assets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Placeholder Media Assets ({previewTemplate.placeholderMedia.length} Included)
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Injected into Media Vault
                  </span>
                </div>
                <div className="space-y-1.5">
                  {previewTemplate.placeholderMedia.map((m) => (
                    <div
                      key={m.id}
                      className="bg-[#0B0E14] border border-[#272D3A] rounded-lg px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        {m.type === "video" ? (
                          <Film className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : m.type === "audio" ? (
                          <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span className="font-semibold text-white text-xs">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                        <span className="uppercase">{m.format || m.type}</span>
                        <span>·</span>
                        <span>{m.duration}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#272D3A] bg-[#0D1017] flex items-center justify-between gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E2433] transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  const tpl = previewTemplate;
                  setPreviewTemplate(null);
                  onSelectTemplate(tpl);
                }}
                className="btn-clipflow-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Load Template into Timeline</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
