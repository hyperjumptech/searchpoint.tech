"use client";

import * as React from "react";
import { clsx } from "clsx";
import {
  ExternalLink,
  Folder,
  FileText,
  LayoutGrid,
  FileSpreadsheet,
  MonitorPlay,
  Star,
  Plus,
  Search,
  Check,
  Laptop,
  Sparkles,
  RotateCcw,
} from "lucide-react";

import { LandingContainer } from "@/components/landing/landing-ui";
import {
  DEMO_DEFAULT_QUERY,
  DEMO_SEARCH_RESULTS,
  DEMO_SOURCES,
  DEMO_TAGS,
  DEMO_TYPES,
  DEMO_TYPING_QUERIES,
  type DemoSearchResult,
} from "@/components/landing/data/desktop-demo";

const BASE_WIDTH = 1040;
const BASE_HEIGHT = 650;

export default function DesktopSearchDemo() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // Robust responsive scale observer for mobile view
  const [scale, setScale] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      const vp =
        window.innerWidth || document.documentElement.clientWidth || 1040;
      if (vp < BASE_WIDTH) {
        const factor = vp < 640 ? 0.88 : vp < 1024 ? 0.94 : 1;
        const available = Math.min(vp - 24, BASE_WIDTH);
        return Number(
          Math.max(0.24, (available / BASE_WIDTH) * factor).toFixed(3),
        );
      }
    }
    return 1;
  });

  // Filter & interaction state
  const [activeSource, setActiveSource] = React.useState<string>("on_device");
  const [activeType, setActiveType] = React.useState<string>("pdf");
  const [activeTag, setActiveTag] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState<string>("");
  const [selectedId, setSelectedId] = React.useState<string>(
    DEMO_SEARCH_RESULTS[0]?.id || "item-1",
  );
  const [typeFilterActive, setTypeFilterActive] = React.useState<boolean>(true);
  const [exactMatch, setExactMatch] = React.useState<boolean>(true);

  // Button interaction states
  const [fileActionState, setFileActionState] = React.useState<
    "idle" | "opening" | "opened"
  >("idle");
  const [folderActionState, setFolderActionState] = React.useState<
    "idle" | "opening" | "opened"
  >("idle");
  const [copiedRec, setCopiedRec] = React.useState<string | null>(null);

  // Auto-typing search state
  const [typingQueryIndex, setTypingQueryIndex] = React.useState<number>(0);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [userInteracted, setUserInteracted] = React.useState<boolean>(false);

  React.useEffect(() => {
    const updateScale = () => {
      // Measure real window / viewport width
      const vpWidth =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth ||
        1040;

      if (vpWidth < BASE_WIDTH) {
        // Apply scaled down factor so it looks compact and fits cleanly with breathing room on mobile
        const factor = vpWidth < 640 ? 0.88 : vpWidth < 1024 ? 0.94 : 1;
        const availableWidth = Math.min(vpWidth - 24, BASE_WIDTH);
        const newScale = Math.max(0.24, (availableWidth / BASE_WIDTH) * factor);
        setScale(Number(newScale.toFixed(3)));
      } else {
        setScale(1);
      }
    };

    updateScale();
    const timer = setTimeout(updateScale, 50);

    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", updateScale);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("orientationchange", updateScale);
    };
  }, []);

  // Auto-typing animation effect
  React.useEffect(() => {
    if (userInteracted) return;

    let timeoutId: NodeJS.Timeout;
    const currentTarget =
      DEMO_TYPING_QUERIES[typingQueryIndex] || DEMO_DEFAULT_QUERY;

    if (!isDeleting) {
      if (query.length < currentTarget.length) {
        timeoutId = setTimeout(() => {
          setQuery(currentTarget.slice(0, query.length + 1));
        }, 60);
      } else {
        // Paused at full typed query
        timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, 4500);
      }
    } else {
      if (query.length > 0) {
        timeoutId = setTimeout(() => {
          setQuery(currentTarget.slice(0, query.length - 1));
        }, 25);
      } else {
        // Finished deleting, transition to next query
        setIsDeleting(false);
        setTypingQueryIndex((prev) => (prev + 1) % DEMO_TYPING_QUERIES.length);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [query, isDeleting, typingQueryIndex, userInteracted]);

  // Compute displayed results based on current search query and filters
  const displayedResults = React.useMemo<DemoSearchResult[]>(() => {
    let list = DEMO_SEARCH_RESULTS;

    // Filter by active source
    if (activeSource !== "all") {
      list = list.filter((item) => {
        const itemSrc = item.source.toLowerCase().replace(/\s+/g, "_");
        return itemSrc === activeSource;
      });
    }

    // Filter by active type
    if (typeFilterActive && activeType !== "doc") {
      list = list.filter((item) => {
        if (activeType === "pdf") return item.fileType.toLowerCase() === "pdf";
        if (activeType === "word")
          return (
            item.fileType.toLowerCase() === "word" ||
            item.fileType.toLowerCase() === "docx"
          );
        if (activeType === "sheet")
          return (
            item.fileType.toLowerCase() === "spreadsheets" ||
            item.fileType.toLowerCase() === "xlsx"
          );
        if (activeType === "ppt")
          return (
            item.fileType.toLowerCase() === "ppt" ||
            item.fileType.toLowerCase() === "pptx"
          );
        return true;
      });
    }

    // Filter by active tag
    if (activeTag) {
      list = list.filter((item) =>
        item.tags?.some(
          (t) => t.label.toLowerCase() === activeTag.toLowerCase(),
        ),
      );
    }

    // Filter by search keywords outside syntax
    const trimmed = query.trim().toLowerCase();
    if (trimmed) {
      const cleanTokens = trimmed
        .split(/\s+/)
        .filter((token) => !token.includes(":"));

      if (cleanTokens.length > 0) {
        const filtered = list.filter((item) =>
          cleanTokens.some(
            (tok) =>
              item.title.toLowerCase().includes(tok) ||
              item.path.toLowerCase().includes(tok) ||
              item.meta.author.toLowerCase().includes(tok),
          ),
        );
        if (filtered.length > 0) {
          list = filtered;
        }
      }
    }

    return list.length > 0 ? list : DEMO_SEARCH_RESULTS.slice(0, 4);
  }, [query, activeSource, activeType, typeFilterActive, activeTag]);

  // Keep selected item valid
  const selectedItem = React.useMemo(() => {
    return (
      displayedResults.find((item) => item.id === selectedId) ||
      displayedResults[0] ||
      DEMO_SEARCH_RESULTS[0]
    );
  }, [displayedResults, selectedId]);

  const handleResetQuery = React.useCallback(() => {
    setUserInteracted(true);
    setQuery("");
  }, []);

  const handleSelectResult = React.useCallback((id: string) => {
    setUserInteracted(true);
    setSelectedId(id);
  }, []);

  const handleSelectSource = React.useCallback((sourceId: string) => {
    setUserInteracted(true);
    setActiveSource(sourceId);
  }, []);

  const handleSelectType = React.useCallback((typeId: string) => {
    setUserInteracted(true);
    setActiveType(typeId);
  }, []);

  const handleToggleTag = React.useCallback((tagLabel: string) => {
    setUserInteracted(true);
    setActiveTag((prev) => (prev === tagLabel ? null : tagLabel));
  }, []);

  const handleOpenFile = React.useCallback(() => {
    setFileActionState("opening");
    setTimeout(() => {
      setFileActionState("opened");
      setTimeout(() => setFileActionState("idle"), 1500);
    }, 600);
  }, []);

  const handleOpenFolder = React.useCallback(() => {
    setFolderActionState("opening");
    setTimeout(() => {
      setFolderActionState("opened");
      setTimeout(() => setFolderActionState("idle"), 1500);
    }, 600);
  }, []);

  const handleCopyRec = React.useCallback((name: string) => {
    setCopiedRec(name);
    setTimeout(() => setCopiedRec(null), 2000);
  }, []);

  const handleResumeAutoTyping = React.useCallback(() => {
    setUserInteracted(false);
    setIsDeleting(false);
    setQuery("");
    setTypingQueryIndex((prev) => (prev + 1) % DEMO_TYPING_QUERIES.length);
  }, []);

  return (
    <section
      id="desktop-search"
      className="relative scroll-mt-[80px] py-12 md:py-16">
      <LandingContainer>
        {/* Responsive Scaler Wrapper for Mobile View */}
        <div
          ref={containerRef}
          className="w-full flex flex-col items-center overflow-hidden">
          {/* Replay Auto-Typing Chip when paused by user click */}
          {userInteracted && (
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleResumeAutoTyping}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all cursor-pointer shadow-xs">
                <RotateCcw className="h-3 w-3" />
                <span>Play Auto Demo</span>
              </button>
            </div>
          )}

          <div
            style={{
              width: `${BASE_WIDTH}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              height: `${BASE_HEIGHT}px`,
              marginBottom:
                scale < 1
                  ? `-${Math.round((1 - scale) * BASE_HEIGHT)}px`
                  : undefined,
            }}
            className="shrink-0 transition-transform duration-150">
            <div
              className="sp-app"
              role="region"
              aria-label="SearchPoint desktop interface">
              {/* Window Title Bar */}
              <div className="sp-frame-bar">
                <div className="sp-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <span className="sp-title">SearchPoint</span>
                <span className="sp-count">
                  {displayedResults.length} results · Indexed locally
                </span>
              </div>

              {/* 3-Column Desktop Interface */}
              <div className="sp-ui">
                {/* Column 1: Left Navigation Sidebar */}
                <aside
                  className="sp-side"
                  aria-label="Desktop Search navigation">
                  {/* SOURCES Section */}
                  <div className="sp-sec-head">
                    <span>SOURCES</span>
                    <button
                      type="button"
                      onClick={() => handleSelectSource("all")}
                      className="inline-flex items-center text-current hover:opacity-75 cursor-pointer"
                      aria-label="Reset source filter">
                      <Plus className="h-3 w-3 stroke-[2.5]" />
                    </button>
                  </div>

                  {DEMO_SOURCES.map((source) => {
                    const isActive = activeSource === source.id;
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => handleSelectSource(source.id)}
                        className={clsx(
                          "sp-it w-full text-left cursor-pointer",
                          isActive && "on",
                        )}>
                        {source.iconType === "grid" ? (
                          <LayoutGrid
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <span
                            className="sp-dot"
                            style={{
                              background:
                                source.dotColor === "tenant"
                                  ? "var(--sp-accent)"
                                  : source.dotColor,
                            }}
                            aria-hidden="true"
                          />
                        )}
                        <span>{source.label}</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handleSelectSource("all")}
                    className="sp-add-source w-full text-left cursor-pointer"
                    aria-label="Add new local or cloud storage source">
                    + Add source
                  </button>

                  {/* TYPE Section */}
                  <div className="sp-sec-head">TYPE</div>

                  {DEMO_TYPES.map((type) => {
                    const isActive = activeType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelectType(type.id)}
                        className={clsx(
                          "sp-it w-full text-left cursor-pointer",
                          isActive && "on",
                        )}>
                        {type.iconType === "sheet" ? (
                          <FileSpreadsheet
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        ) : type.iconType === "ppt" ? (
                          <MonitorPlay
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <FileText
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}
                        <span>{type.label}</span>
                      </button>
                    );
                  })}

                  {/* CURATED Section */}
                  <div className="sp-sec-head">CURATED</div>
                  <button
                    type="button"
                    onClick={() => handleSelectSource("all")}
                    className="sp-it w-full text-left cursor-pointer"
                    aria-label="Favorites curated collection, 6 items">
                    <Star
                      className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20"
                      aria-hidden="true"
                    />
                    <span>Favorites</span>
                    <span className="sp-count">6</span>
                  </button>

                  {/* TAGS Section */}
                  <div className="sp-sec-head">TAGS</div>
                  {DEMO_TAGS.map((tag) => {
                    const isActive = activeTag === tag.label;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.label)}
                        className={clsx(
                          "sp-it w-full text-left cursor-pointer",
                          isActive && "on",
                        )}>
                        <span
                          className="sp-dot"
                          style={{ background: tag.dotColor }}
                          aria-hidden="true"
                        />
                        <span>{tag.label}</span>
                        <span className="sp-count">{tag.count}</span>
                      </button>
                    );
                  })}
                </aside>

                {/* Column 2: Search & Results */}
                <div className="sp-main">
                  {/* Searchbox Input with Auto-typing */}
                  <div className="sp-searchbox relative">
                    <Search
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="flex-1 flex items-center min-w-0">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                          setUserInteracted(true);
                          setQuery(e.target.value);
                        }}
                        onFocus={() => setUserInteracted(true)}
                        placeholder="Search files, sources, extensions..."
                        className="sp-syntax w-full cursor-text"
                        aria-label="Search syntax query"
                        spellCheck={false}
                      />
                      {!userInteracted && (
                        <span
                          aria-hidden="true"
                          className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-0.5 shrink-0"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setExactMatch((prev) => !prev)}
                      className={clsx(
                        "sp-exact cursor-pointer transition-all",
                        !exactMatch && "opacity-50 line-through",
                      )}>
                      <Check
                        className="h-3 w-3 stroke-[3]"
                        aria-hidden="true"
                      />
                      Exact match
                    </button>
                    {query.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetQuery}
                        className="sp-clear cursor-pointer"
                        aria-label="Clear search input">
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Interpretation Row */}
                  <div className="sp-interpret">
                    <span>
                      Interpreting as:{" "}
                      <b>
                        Extensions {activeType} · Source is{" "}
                        {activeSource === "all"
                          ? "All Sources"
                          : activeSource === "on_device"
                            ? "On Device"
                            : activeSource}{" "}
                        · Kind is Document
                      </b>
                    </span>
                    <span className="sp-sort">Sort: Relevance ▾</span>
                  </div>

                  {/* Filters */}
                  <div
                    className="sp-filters"
                    role="toolbar"
                    aria-label="Search filters">
                    <button
                      type="button"
                      onClick={() => {
                        setUserInteracted(true);
                        setTypeFilterActive((prev) => !prev);
                      }}
                      className={clsx(
                        "sp-filter cursor-pointer",
                        typeFilterActive && "active",
                      )}>
                      Type: {activeType} {typeFilterActive ? "✕" : ""}
                    </button>
                    <span className="sp-filter">Author: All</span>
                    <span className="sp-filter">Date: All</span>
                  </div>

                  {/* Results List */}
                  <div
                    className="sp-results"
                    role="listbox"
                    aria-label="Found files">
                    {displayedResults.map((item) => {
                      const isSelected = item.id === selectedItem.id;
                      return (
                        <div
                          key={item.id}
                          role="option"
                          aria-selected={isSelected}
                          tabIndex={0}
                          onClick={() => handleSelectResult(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelectResult(item.id);
                            }
                          }}
                          className={clsx(
                            "sp-result cursor-pointer transition-all",
                            isSelected && "selected",
                          )}>
                          <div className="sp-file-icon" aria-hidden="true">
                            {item.fileType}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="sp-result-title truncate font-medium">
                              {item.title}
                            </div>
                            <div className="sp-result-path truncate text-xs text-muted-foreground">
                              {item.path}
                            </div>
                            <div className="sp-tag-row flex items-center gap-1.5 mt-1">
                              <span className="sp-source-chip">
                                <Laptop
                                  className="h-2.5 w-2.5 shrink-0"
                                  aria-hidden="true"
                                />
                                {item.source}
                              </span>
                              {item.tags?.map((tag) => (
                                <span
                                  key={tag.label}
                                  className="sp-source-chip"
                                  style={{
                                    background:
                                      tag.bg || "rgba(239, 68, 68, 0.15)",
                                    color: tag.color || "#ef4444",
                                    border: "none",
                                  }}>
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="sp-result-meta text-right shrink-0">
                            <div>{item.size}</div>
                            <div>{item.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Detail Panel & AI Recommendations */}
                <aside
                  className="sp-detail"
                  aria-label="Document detail preview">
                  <div className="sp-detail-top">
                    <div className="sp-file-icon" aria-hidden="true">
                      {selectedItem.fileType}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="sp-detail-title truncate font-semibold"
                        title={selectedItem.title}>
                        {selectedItem.title}
                      </div>
                      <div
                        className="sp-detail-path truncate text-xs text-muted-foreground"
                        title={selectedItem.path}>
                        {selectedItem.path}
                      </div>
                    </div>
                  </div>

                  <div className="sp-actions">
                    <button
                      type="button"
                      onClick={handleOpenFile}
                      className={clsx(
                        "sp-btn-red cursor-pointer flex items-center justify-center gap-1.5 transition-all",
                        fileActionState === "opened" && "!bg-emerald-600",
                      )}
                      aria-label={`Open file ${selectedItem.title}`}>
                      <ExternalLink
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {fileActionState === "opening"
                        ? "Opening..."
                        : fileActionState === "opened"
                          ? "Opened ✓"
                          : "Open File"}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenFolder}
                      className={clsx(
                        "sp-btn-gray cursor-pointer flex items-center justify-center gap-1.5 transition-all",
                        folderActionState === "opened" && "!bg-muted/80",
                      )}
                      aria-label={`Open folder containing ${selectedItem.title}`}>
                      <Folder className="h-3.5 w-3.5" aria-hidden="true" />
                      {folderActionState === "opening"
                        ? "Opening..."
                        : folderActionState === "opened"
                          ? "Opened ✓"
                          : "Open Folder"}
                    </button>
                  </div>

                  {/* AI Rename Recommendations */}
                  <div className="sp-rename">
                    <div className="sp-rename-head">
                      <span>
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        FILENAME RECOMMENDATIONS
                      </span>
                    </div>
                    {selectedItem.recommendations.map((rec) => {
                      const isCopied = copiedRec === rec.name;
                      return (
                        <div
                          key={rec.name}
                          onClick={() => handleCopyRec(rec.name)}
                          className={clsx(
                            "sp-rename-item cursor-pointer transition-all hover:border-primary/50",
                            isCopied &&
                              "!border-emerald-500 !bg-emerald-500/10",
                          )}
                          title="Click to copy filename">
                          <span className="sp-name flex-1">{rec.name}</span>
                          <span
                            className="sp-check shrink-0"
                            aria-hidden="true">
                            {isCopied ? "Copied ✓" : "✓"}
                          </span>
                        </div>
                      );
                    })}
                    <div className="sp-rename-note">
                      {selectedItem.recommendationRule}
                      <br />
                      {selectedItem.recommendationNote}
                    </div>
                  </div>

                  {/* Metadata definition list */}
                  <dl className="sp-meta">
                    <dt>Size</dt>
                    <dd>{selectedItem.meta.size}</dd>
                    <dt>Type</dt>
                    <dd>{selectedItem.meta.type}</dd>
                    <dt>Pages</dt>
                    <dd>{selectedItem.meta.pages}</dd>
                    <dt>Author</dt>
                    <dd className="truncate" title={selectedItem.meta.author}>
                      {selectedItem.meta.author}
                    </dd>
                    <dt>Created</dt>
                    <dd>{selectedItem.meta.created}</dd>
                  </dl>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
