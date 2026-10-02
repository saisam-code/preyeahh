import React, { useState, useRef, useEffect, useMemo } from "react";
import "./RoadmapGraph.css";

// Layout constants
const SECTION_SPACING_Y = 250;
const TOPIC_SPACING_Y = 80;
const TOPIC_OFFSET_X = 200;

export default function RoadmapGraph({ roadmap, relatedRoadmaps = [], onTopicStatusChange }) {
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 50, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activePopover, setActivePopover] = useState(null); // topicId
  const [activeDrawer, setActiveDrawer] = useState(null);   // topic object

  // --- Layout Calculation ---
  const { nodes, edges } = useMemo(() => {
    if (!roadmap || !roadmap.sections) return { nodes: [], edges: [] };

    const nodesList = [];
    const edgesList = [];

    let currentY = 100;
    const spineX = 0;

    roadmap.sections.forEach((section, sIdx) => {
      const sectionNode = {
        id: `s-${sIdx}`,
        type: "section",
        title: section.title,
        sectionData: section,
        x: spineX,
        y: currentY,
      };
      nodesList.push(sectionNode);

      let topicY = currentY + TOPIC_SPACING_Y;

      section.topics?.forEach((topic, tIdx) => {
        const isLeft = tIdx % 2 === 0;
        const topicX = isLeft ? spineX - TOPIC_OFFSET_X : spineX + TOPIC_OFFSET_X;

        nodesList.push({
          id: topic._id || `t-${sIdx}-${tIdx}`,
          type: "topic",
          data: topic,
          x: topicX,
          y: topicY,
        });

        edgesList.push({
          id: `e-t-${sIdx}-${tIdx}`,
          type: "topic",
          x1: spineX,
          y1: topicY,
          x2: topicX,
          y2: topicY,
        });

        topicY += TOPIC_SPACING_Y;
      });

      currentY = Math.max(currentY + SECTION_SPACING_Y, topicY + 50);
    });

    return { nodes: nodesList, edges: edgesList };
  }, [roadmap]);

  const spineEdges = useMemo(() => {
    const sEdges = [];
    const sections = nodes.filter((n) => n.type === "section");
    for (let i = 1; i < sections.length; i++) {
      sEdges.push({
        id: `spine-${i}`,
        x1: sections[i - 1].x,
        y1: sections[i - 1].y,
        x2: sections[i].x,
        y2: sections[i].y,
      });
    }
    return sEdges;
  }, [nodes]);

  const topicEdges = edges.filter((e) => e.type === "topic");

  // --- Pan and Zoom ---
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform((t) => ({
        ...t,
        scale: Math.min(Math.max(t.scale * scaleFactor, 0.2), 3),
      }));
    } else {
      setTransform((t) => ({ ...t, x: t.x - e.deltaX, y: t.y - e.deltaY }));
    }
  };

  const handlePointerDown = (e) => {
    if (
      e.target.closest(".roadmap-topic-node") ||
      e.target.closest(".topic-popover")
    )
      return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      setTransform((t) => ({ ...t, x: width / 2, y: 50 }));
    }
  }, []);

  const totalTopics =
    roadmap?.sections?.reduce((sum, s) => sum + (s.topics?.length || 0), 0) || 0;
  const completedTopics =
    roadmap?.sections?.reduce(
      (sum, s) => sum + (s.topics?.filter((t) => t.isCompleted).length || 0),
      0
    ) || 0;
  const progressPct =
    totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  return (
    <div
      className="roadmap-canvas-container"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Visual Canvas Layer */}
      <div
        className="roadmap-canvas"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <svg className="roadmap-svg-layer" style={{ overflow: "visible" }}>
          {spineEdges.map((edge) => (
            <line
              key={edge.id}
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              className="spine-line"
            />
          ))}
          {topicEdges.map((edge) => {
            const controlOffset = (edge.x2 - edge.x1) * 0.5;
            const pathData = `M ${edge.x1} ${edge.y1} C ${edge.x1 + controlOffset} ${edge.y1}, ${edge.x2 - controlOffset} ${edge.y2}, ${edge.x2} ${edge.y2}`;
            return <path key={edge.id} d={pathData} className="topic-line" />;
          })}
        </svg>

        <div className="roadmap-nodes-layer">
          {nodes.map((node) => {
            if (node.type === "section") {
              return (
                <div key={node.id} className="roadmap-section-node" style={{ left: node.x, top: node.y }}>
                  {node.title}
                </div>
              );
            } else if (node.type === "topic") {
              const isDone = node.data.isCompleted;
              return (
                <div key={node.id}>
                  <div
                    className={`roadmap-topic-node ${isDone ? "status-done" : ""}`}
                    style={{ left: node.x, top: node.y }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePopover(activePopover === node.id ? null : node.id);
                    }}
                  >
                    {node.data.title}
                  </div>
                  {activePopover === node.id && (
                    <div
                      className="topic-popover"
                      style={{ left: node.x, top: node.y + 20 }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePopover(null);
                          setActiveDrawer(node.data);
                        }}
                      >
                        📖 View Resources
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTopicStatusChange(node.id, false);
                          setActivePopover(null);
                        }}
                      >
                        📘 Set as Learning
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTopicStatusChange(node.id, true);
                          setActivePopover(null);
                        }}
                      >
                        ✅ Mark as Done
                      </button>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Fixed UI Overlays */}
      <div className="roadmap-overlay-ui">
        <div className="roadmap-info-card top-left">
          <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "8px" }}>
            Other Roadmaps
          </h3>
          <ul style={{ paddingLeft: "1rem", fontSize: "0.85rem" }}>
            {relatedRoadmaps
              .filter((r) => r._id !== roadmap._id)
              .slice(0, 3)
              .map((r) => (
                <li key={r._id}>
                  <a href={`/roadmap/${r._id}`} style={{ color: "#2980b9" }}>
                    {r.title}
                  </a>
                </li>
              ))}
            {relatedRoadmaps.length <= 1 && <li>No other roadmaps.</li>}
          </ul>
        </div>

        <div className="roadmap-info-card top-right">
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: "4px" }}>
            {roadmap.title}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "8px" }}>
            {roadmap.branch} • {roadmap.level} • {roadmap.estimatedWeeks}wks
          </p>
          <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
            Progress: {completedTopics} / {totalTopics} ({progressPct}%)
          </div>
          <div className="roadmap-progress-bar-container">
            <div
              className="roadmap-progress-bar"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
          <p style={{ fontSize: "0.7rem", color: "#888", marginTop: "8px" }}>
            Tip: Drag to pan • Ctrl+scroll to zoom
          </p>
        </div>
      </div>

      {/* Drawer */}
      {activeDrawer && (
        <>
          <div
            className="topic-drawer-backdrop"
            onClick={() => setActiveDrawer(null)}
          ></div>
          <div className="topic-drawer">
            <button className="drawer-close" onClick={() => setActiveDrawer(null)}>
              ×
            </button>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "1rem" }}>
              {activeDrawer.title}
            </h2>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              {activeDrawer.description}
            </p>

            <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Resources</h3>
            <div className="drawer-resource-list">
              {activeDrawer.resources && activeDrawer.resources.length > 0 ? (
                activeDrawer.resources.map((r, i) =>
                  r.url ? (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="drawer-resource-item"
                    >
                      <span>{r.type === "video" ? "🎥" : "📄"}</span>
                      {r.title}
                    </a>
                  ) : (
                    <div
                      key={i}
                      className="drawer-resource-item"
                      style={{ pointerEvents: "none" }}
                    >
                      <span>{r.type === "video" ? "🎥" : "📄"}</span>
                      {r.title}
                    </div>
                  )
                )
              ) : (
                <p style={{ fontSize: "0.9rem", color: "#666" }}>No resources linked.</p>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "2rem" }}
              onClick={() => {
                onTopicStatusChange(activeDrawer._id, !activeDrawer.isCompleted);
                setActiveDrawer({ ...activeDrawer, isCompleted: !activeDrawer.isCompleted });
              }}
            >
              {activeDrawer.isCompleted ? "Mark as Learning" : "Mark as Done"}
            </button>
          </div>
        </>
      )}

    </div>
  );
}
