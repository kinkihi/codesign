"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import {
  Cursor,
  Hand,
  ImageSquare,
  UploadSimple,
  Play,
  // TODO: 图层功能恢复时取消注释
  // Stack,
  // GearSix,
  Minus,
  Plus,
  X,
  CaretDown,
  ChatCircleDots,
  SidebarSimple,
  Copy,
  Check,
  Trash,
  Lock,
  DotsThree,
  ArrowsOut,
  Sparkle,
  MagicWand,
  FrameCorners,
  DownloadSimple,
  Prohibit,
} from "@phosphor-icons/react";
import { ChatInput } from "@/components/chat-input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 300, damping: 28 };
const easeInOut = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const };
const RIGHT_PANEL_WIDTH = 360;
const RECT_SEL = "#3B82F6";
const FRAME_SEL = "#8B5CF6";

const ZOOM_MIN = 10;
const ZOOM_MAX = 800;
const ZOOM_LEVELS = [
  10, 25, 33, 50, 67, 75, 100, 125, 150, 200, 300, 400, 800,
];

function clampZoom(z: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z)));
}

function nextZoomLevel(current: number) {
  return ZOOM_LEVELS.find((l) => l > current) ?? ZOOM_MAX;
}

function prevZoomLevel(current: number) {
  return [...ZOOM_LEVELS].reverse().find((l) => l < current) ?? ZOOM_MIN;
}

const SNAP_THRESHOLD = 5;
const SNAP_GUIDE_COLOR = "#93C5FD";

type SimpleRect = { x: number; y: number; w: number; h: number };

function computeSnapGuides(
  dragBbox: SimpleRect,
  others: SimpleRect[],
  threshold: number,
) {
  const dxPts = [dragBbox.x, dragBbox.x + dragBbox.w / 2, dragBbox.x + dragBbox.w];
  const dyPts = [dragBbox.y, dragBbox.y + dragBbox.h / 2, dragBbox.y + dragBbox.h];

  let snapDx = 0;
  let snapDy = 0;
  let bestAbsX = threshold;
  let bestAbsY = threshold;

  for (const o of others) {
    const oxPts = [o.x, o.x + o.w / 2, o.x + o.w];
    const oyPts = [o.y, o.y + o.h / 2, o.y + o.h];

    for (const d of dxPts) {
      for (const ox of oxPts) {
        const dist = Math.abs(d - ox);
        if (dist < bestAbsX) {
          bestAbsX = dist;
          snapDx = ox - d;
        }
      }
    }
    for (const d of dyPts) {
      for (const oy of oyPts) {
        const dist = Math.abs(d - oy);
        if (dist < bestAbsY) {
          bestAbsY = dist;
          snapDy = oy - d;
        }
      }
    }
  }

  const sb = {
    x: dragBbox.x + snapDx,
    y: dragBbox.y + snapDy,
    w: dragBbox.w,
    h: dragBbox.h,
  };
  const sxPts = [sb.x, sb.x + sb.w / 2, sb.x + sb.w];
  const syPts = [sb.y, sb.y + sb.h / 2, sb.y + sb.h];
  const EPS = 0.5;

  const xMap = new Map<number, { y1: number; y2: number }>();
  const yMap = new Map<number, { x1: number; x2: number }>();

  for (const o of others) {
    const oxPts = [o.x, o.x + o.w / 2, o.x + o.w];
    const oyPts = [o.y, o.y + o.h / 2, o.y + o.h];

    for (const sx of sxPts) {
      for (const ox of oxPts) {
        if (Math.abs(sx - ox) < EPS) {
          const key = Math.round(sx * 2) / 2;
          const y1 = Math.min(sb.y, o.y);
          const y2 = Math.max(sb.y + sb.h, o.y + o.h);
          const prev = xMap.get(key);
          if (prev) { prev.y1 = Math.min(prev.y1, y1); prev.y2 = Math.max(prev.y2, y2); }
          else xMap.set(key, { y1, y2 });
        }
      }
    }
    for (const sy of syPts) {
      for (const oy of oyPts) {
        if (Math.abs(sy - oy) < EPS) {
          const key = Math.round(sy * 2) / 2;
          const x1 = Math.min(sb.x, o.x);
          const x2 = Math.max(sb.x + sb.w, o.x + o.w);
          const prev = yMap.get(key);
          if (prev) { prev.x1 = Math.min(prev.x1, x1); prev.x2 = Math.max(prev.x2, x2); }
          else yMap.set(key, { x1, x2 });
        }
      }
    }
  }

  return {
    snapDx,
    snapDy,
    xGuides: Array.from(xMap.entries()).map(([pos, ext]) => ({ pos, ...ext })),
    yGuides: Array.from(yMap.entries()).map(([pos, ext]) => ({ pos, ...ext })),
  };
}

export default function CanvasPage() {
  const router = useRouter();
  const [hasMounted, setHasMounted] = React.useState(false);
  const entranceDone = React.useRef(false);
  React.useEffect(() => {
    setHasMounted(true);
    const id = window.setTimeout(() => { entranceDone.current = true; }, 800);
    return () => window.clearTimeout(id);
  }, []);
  const [rightPanelOpen, setRightPanelOpen] = React.useState(false);
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [inputExpanded, setInputExpanded] = React.useState(false);
  const [chatMessages, setChatMessages] = React.useState<
    { id: string; role: "user" | "assistant"; content: string }[]
  >([]);
  const [isThinking, setIsThinking] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isThinking]);

  function handleChatSend(message: string) {
    if (!message.trim()) return;
    const userMsg = { id: Date.now().toString(), role: "user" as const, content: message };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `收到你的消息。让我来帮你处理。\n\n你可以使用 **@** 来引用相关资源，或使用 **/** 选择特定指令来获得更精准的帮助。`,
        },
      ]);
    }, 800);
  }

  function handleCopy(messageId: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const [zoom, setZoom] = React.useState(100);
  const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = React.useState<
    "select" | "hand" | "rectangle" | "frame"
  >("select");

  const [isSpaceDown, setIsSpaceDown] = React.useState(false);
  const [isZDown, setIsZDown] = React.useState(false);
  const [isAltDown, setIsAltDown] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);

  type Rect = { x: number; y: number; w: number; h: number; fill?: string; stroke?: string; id?: string; tag?: string };
  const [rectangles, setRectangles] = React.useState<Rect[]>([]);
  const [drawingRect, setDrawingRect] = React.useState<Rect | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [selectedRectIndices, setSelectedRectIndices] = React.useState<number[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const drawStartRef = React.useRef({ x: 0, y: 0 });
  const drawingRectRef = React.useRef<Rect | null>(null);
  const drawingToolRef = React.useRef<"rectangle" | "frame">("rectangle");

  const [frames, setFrames] = React.useState<Rect[]>([]);
  const [selectedFrameIndices, setSelectedFrameIndices] = React.useState<number[]>([]);
  const [edges, setEdges] = React.useState<{ fromId: string; toId: string }[]>([]);

  const dragStartCanvasRef = React.useRef({ x: 0, y: 0 });
  const dragInitialRectsRef = React.useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragInitialFramesRef = React.useRef<Map<number, { x: number; y: number }>>(new Map());
  const hasDraggedRef = React.useRef(false);
  const clickedObjRef = React.useRef<{ type: "rect" | "frame"; idx: number } | null>(null);

  const dragAllRectsRef = React.useRef<SimpleRect[]>([]);
  const dragAllFramesRef = React.useRef<SimpleRect[]>([]);
  const [snapGuides, setSnapGuides] = React.useState<{
    x: { pos: number; y1: number; y2: number }[];
    y: { pos: number; x1: number; x2: number }[];
  }>({ x: [], y: [] });

  const [isMarqueeSelecting, setIsMarqueeSelecting] = React.useState(false);
  const [marqueeRect, setMarqueeRect] = React.useState<Rect | null>(null);
  const marqueeStartRef = React.useRef({ x: 0, y: 0 });
  const marqueeCtrlRef = React.useRef(false);

  const [colorPicker, setColorPicker] = React.useState<"fill" | "stroke" | null>(null);

  const [upscaleSize, setUpscaleSize] = React.useState<string>("2x");

  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    type: "single" | "multi" | "canvas";
    canvasPt: { x: number; y: number };
  } | null>(null);

  const [isResizing, setIsResizing] = React.useState(false);
  const resizeCornerRef = React.useRef<"nw" | "ne" | "sw" | "se">("se");
  const resizeAnchorRef = React.useRef({ x: 0, y: 0 });

  const inputInitialDone = React.useRef(false);
  const sidebarInputRef = React.useRef<HTMLTextAreaElement>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const panStartRef = React.useRef({ x: 0, y: 0 });
  const panOffsetStartRef = React.useRef({ x: 0, y: 0 });

  const zoomRef = React.useRef(zoom);
  zoomRef.current = zoom;
  const panOffsetRef = React.useRef(panOffset);
  panOffsetRef.current = panOffset;

  const isHandMode = activeTool === "hand" || isSpaceDown;
  const isZoomMode = isZDown && !isSpaceDown;

  // ------ Zoom helpers ------

  const zoomAtPoint = React.useCallback(
    (clientX: number, clientY: number, newZoom: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const oldS = zoomRef.current / 100;
      const clamped = clampZoom(newZoom);
      const newS = clamped / 100;
      const wx = (mx - panOffsetRef.current.x) / oldS;
      const wy = (my - panOffsetRef.current.y) / oldS;
      setPanOffset({ x: mx - wx * newS, y: my - wy * newS });
      setZoom(clamped);
    },
    []
  );

  const zoomInCenter = React.useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      setZoom((z) => clampZoom(nextZoomLevel(z)));
      return;
    }
    zoomAtPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      nextZoomLevel(zoomRef.current)
    );
  }, [zoomAtPoint]);

  const zoomOutCenter = React.useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      setZoom((z) => clampZoom(prevZoomLevel(z)));
      return;
    }
    zoomAtPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      prevZoomLevel(zoomRef.current)
    );
  }, [zoomAtPoint]);

  // ------ Keyboard shortcuts ------

  React.useEffect(() => {
    const isEditing = (e: KeyboardEvent) => {
      const t = e.target;
      return (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        (t instanceof HTMLElement && t.isContentEditable)
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isEditing(e)) return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpaceDown(true);
      }
      if (e.key === "z" || e.key === "Z") setIsZDown(true);
      if (e.key === "Alt") {
        e.preventDefault();
        setIsAltDown(true);
      }
      if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey) {
        setActiveTool((t) => (t === "rectangle" ? "select" : "rectangle"));
      }
      if ((e.key === "i" || e.key === "I") && !e.ctrlKey && !e.metaKey) {
        setActiveTool((t) => (t === "frame" ? "select" : "frame"));
      }
      if ((e.key === "v" || e.key === "V") && !e.ctrlKey && !e.metaKey) {
        setActiveTool("select");
      }
      if (e.key === "Escape") {
        setActiveTool("select");
        setSelectedRectIndices([]);
        setSelectedFrameIndices([]);
        setColorPicker(null);
        setContextMenu(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        setSelectedRectIndices((prev) => {
          if (prev.length > 0) {
            const toDelete = new Set(prev);
            setRectangles((rects) => rects.filter((_, i) => !toDelete.has(i)));
          }
          return [];
        });
        setSelectedFrameIndices((prev) => {
          if (prev.length > 0) {
            const toDelete = new Set(prev);
            setFrames((fs) => {
              const deletedIds = new Set(
                [...toDelete].map((i) => fs[i]?.id).filter((id): id is string => !!id)
              );
              if (deletedIds.size > 0) {
                setEdges((oldEdges) => oldEdges.filter((e) => !deletedIds.has(e.fromId) && !deletedIds.has(e.toId)));
              }
              return fs.filter((_, i) => !toDelete.has(i));
            });
          }
          return [];
        });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpaceDown(false);
      if (e.key === "z" || e.key === "Z") setIsZDown(false);
      if (e.key === "Alt") setIsAltDown(false);
    };

    const onBlur = () => {
      setIsSpaceDown(false);
      setIsZDown(false);
      setIsAltDown(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // ------ Wheel: zoom (pinch / Ctrl+wheel) & pan (two-finger swipe) ------

  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      // macOS trackpad pinch-to-zoom → ctrlKey is true
      if (e.ctrlKey) {
        const factor = Math.pow(2, -e.deltaY * 0.01);
        const newZoom = clampZoom(zoomRef.current * factor);
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const oldS = zoomRef.current / 100;
        const newS = newZoom / 100;
        const wx = (mx - panOffsetRef.current.x) / oldS;
        const wy = (my - panOffsetRef.current.y) / oldS;
        setPanOffset({ x: mx - wx * newS, y: my - wy * newS });
        setZoom(newZoom);
      } else {
        // Two-finger swipe → pan
        setPanOffset((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [hasMounted]);

  // ------ Panning (drag) ------

  React.useEffect(() => {
    if (!isPanning) return;

    const onMove = (e: MouseEvent) => {
      setPanOffset({
        x: panOffsetStartRef.current.x + e.clientX - panStartRef.current.x,
        y: panOffsetStartRef.current.y + e.clientY - panStartRef.current.y,
      });
    };
    const onUp = () => setIsPanning(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isPanning]);

  // ------ Canvas mouse down ------

  const screenToCanvas = React.useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const s = zoomRef.current / 100;
      return {
        x: (clientX - rect.left - panOffsetRef.current.x) / s,
        y: (clientY - rect.top - panOffsetRef.current.y) / s,
      };
    },
    []
  );

  const totalSelected = selectedRectIndices.length + selectedFrameIndices.length;
  const singleSelectedRect = totalSelected === 1 && selectedRectIndices.length === 1 ? selectedRectIndices[0] : null;
  const singleSelectedFrame = totalSelected === 1 && selectedFrameIndices.length === 1 ? selectedFrameIndices[0] : null;

  const selectedFrameTag = singleSelectedFrame !== null ? frames[singleSelectedFrame]?.tag : null;

  const handleResizeStart = React.useCallback(
    (corner: "nw" | "ne" | "sw" | "se", e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const shape =
        singleSelectedRect !== null
          ? rectangles[singleSelectedRect]
          : singleSelectedFrame !== null
            ? frames[singleSelectedFrame]
            : null;
      if (!shape) return;
      resizeCornerRef.current = corner;
      const anchors = {
        nw: { x: shape.x + shape.w, y: shape.y + shape.h },
        ne: { x: shape.x, y: shape.y + shape.h },
        sw: { x: shape.x + shape.w, y: shape.y },
        se: { x: shape.x, y: shape.y },
      };
      resizeAnchorRef.current = anchors[corner];
      setIsResizing(true);
    },
    [singleSelectedRect, singleSelectedFrame, rectangles, frames]
  );

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-canvas-ui]")) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setInputExpanded(false);
    setColorPicker(null);
    setContextMenu(null);

    if (isHandMode) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOffsetStartRef.current = { ...panOffset };
      return;
    }

    if (isZoomMode) {
      e.preventDefault();
      if (isAltDown) {
        zoomAtPoint(e.clientX, e.clientY, prevZoomLevel(zoom));
      } else {
        zoomAtPoint(e.clientX, e.clientY, nextZoomLevel(zoom));
      }
      return;
    }

    if (activeTool === "rectangle" || activeTool === "frame") {
      e.preventDefault();
      drawingToolRef.current = activeTool;
      const pt = screenToCanvas(e.clientX, e.clientY);
      drawStartRef.current = pt;
      setDrawingRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
      setIsDrawing(true);
      return;
    }

    if (activeTool === "select") {
      const pt = screenToCanvas(e.clientX, e.clientY);
      const isCtrl = e.ctrlKey || e.metaKey || e.shiftKey;

      let hitRectIdx = -1;
      for (let i = rectangles.length - 1; i >= 0; i--) {
        const r = rectangles[i];
        if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
          hitRectIdx = i;
          break;
        }
      }
      let hitFrameIdx = -1;
      for (let i = frames.length - 1; i >= 0; i--) {
        const r = frames[i];
        if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
          hitFrameIdx = i;
          break;
        }
      }

      const hitType = hitRectIdx >= 0 ? "rect" as const : hitFrameIdx >= 0 ? "frame" as const : null;
      const hitIdx = hitType === "rect" ? hitRectIdx : hitFrameIdx;

      if (hitType && hitIdx >= 0) {
        if (isCtrl) {
          if (hitType === "rect") {
            setSelectedRectIndices((prev) =>
              prev.includes(hitIdx) ? prev.filter((i) => i !== hitIdx) : [...prev, hitIdx]
            );
          } else {
            setSelectedFrameIndices((prev) =>
              prev.includes(hitIdx) ? prev.filter((i) => i !== hitIdx) : [...prev, hitIdx]
            );
          }
          clickedObjRef.current = null;
        } else {
          const isAlreadySelected =
            hitType === "rect"
              ? selectedRectIndices.includes(hitIdx)
              : selectedFrameIndices.includes(hitIdx);

          if (!isAlreadySelected) {
            if (hitType === "rect") {
              setSelectedRectIndices([hitIdx]);
              setSelectedFrameIndices([]);
            } else {
              setSelectedFrameIndices([hitIdx]);
              setSelectedRectIndices([]);
            }
          }
          clickedObjRef.current = { type: hitType, idx: hitIdx };
        }

        hasDraggedRef.current = false;
        dragStartCanvasRef.current = pt;
        const rp = new Map<number, { x: number; y: number }>();
        const newRectSel =
          isCtrl
            ? hitType === "rect"
              ? selectedRectIndices.includes(hitIdx)
                ? selectedRectIndices.filter((i) => i !== hitIdx)
                : [...selectedRectIndices, hitIdx]
              : selectedRectIndices
            : hitType === "rect"
              ? selectedRectIndices.includes(hitIdx) ? selectedRectIndices : [hitIdx]
              : [];
        for (const idx of newRectSel) {
          const r = rectangles[idx];
          if (r) rp.set(idx, { x: r.x, y: r.y });
        }
        dragInitialRectsRef.current = rp;

        const fp = new Map<number, { x: number; y: number }>();
        const newFrameSel =
          isCtrl
            ? hitType === "frame"
              ? selectedFrameIndices.includes(hitIdx)
                ? selectedFrameIndices.filter((i) => i !== hitIdx)
                : [...selectedFrameIndices, hitIdx]
              : selectedFrameIndices
            : hitType === "frame"
              ? selectedFrameIndices.includes(hitIdx) ? selectedFrameIndices : [hitIdx]
              : [];
        for (const idx of newFrameSel) {
          const r = frames[idx];
          if (r) fp.set(idx, { x: r.x, y: r.y });
        }
        dragInitialFramesRef.current = fp;

        dragAllRectsRef.current = rectangles;
        dragAllFramesRef.current = frames;
        setIsDragging(true);
        e.preventDefault();
      } else {
        if (!isCtrl) {
          setSelectedRectIndices([]);
          setSelectedFrameIndices([]);
        }
        marqueeStartRef.current = pt;
        marqueeCtrlRef.current = isCtrl;
        setMarqueeRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
        setIsMarqueeSelecting(true);
        e.preventDefault();
      }
    }
  };

  // ------ Context menu (right-click) ------

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-canvas-ui]")) return;
    e.preventDefault();

    const pt = screenToCanvas(e.clientX, e.clientY);
    const selCount = selectedRectIndices.length + selectedFrameIndices.length;

    let hitObject = false;
    if (selCount === 0) {
      for (let i = rectangles.length - 1; i >= 0; i--) {
        const r = rectangles[i];
        if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
          setSelectedRectIndices([i]);
          setSelectedFrameIndices([]);
          hitObject = true;
          break;
        }
      }
      if (!hitObject) {
        for (let i = frames.length - 1; i >= 0; i--) {
          const r = frames[i];
          if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
            setSelectedFrameIndices([i]);
            setSelectedRectIndices([]);
            hitObject = true;
            break;
          }
        }
      }
    } else {
      hitObject = true;
    }

    const menuType: "single" | "multi" | "canvas" = !hitObject
      ? "canvas"
      : selCount > 1
        ? "multi"
        : "single";

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: menuType,
      canvasPt: pt,
    });
  };

  const clipboardRef = React.useRef<{ rects: Rect[]; frames: Rect[] }>({ rects: [], frames: [] });

  const ctxCopy = React.useCallback(() => {
    clipboardRef.current = {
      rects: selectedRectIndices.map((i) => rectangles[i]).filter(Boolean),
      frames: selectedFrameIndices.map((i) => frames[i]).filter(Boolean),
    };
    setContextMenu(null);
  }, [selectedRectIndices, selectedFrameIndices, rectangles, frames]);

  const ctxPaste = React.useCallback(
    (at?: { x: number; y: number }) => {
      const { rects, frames: frms } = clipboardRef.current;
      if (rects.length === 0 && frms.length === 0) { setContextMenu(null); return; }

      const all = [...rects, ...frms];
      const cx = all.reduce((s, r) => s + r.x + r.w / 2, 0) / all.length;
      const cy = all.reduce((s, r) => s + r.y + r.h / 2, 0) / all.length;
      const ox = at ? at.x - cx : 20;
      const oy = at ? at.y - cy : 20;

      if (rects.length > 0) {
        setRectangles((prev) => {
          const newRects = rects.map((r) => ({ ...r, x: r.x + ox, y: r.y + oy }));
          const startIdx = prev.length;
          setSelectedRectIndices(newRects.map((_, i) => startIdx + i));
          return [...prev, ...newRects];
        });
      }
      if (frms.length > 0) {
        setFrames((prev) => {
          const newFrames = frms.map((r) => ({ ...r, x: r.x + ox, y: r.y + oy, id: crypto.randomUUID(), tag: r.tag }));
          const startIdx = prev.length;
          setSelectedFrameIndices(newFrames.map((_, i) => startIdx + i));
          return [...prev, ...newFrames];
        });
      }
      setContextMenu(null);
    },
    []
  );

  const ctxDuplicate = React.useCallback(() => {
    const selRects = selectedRectIndices.map((i) => rectangles[i]).filter(Boolean);
    const selFrames = selectedFrameIndices.map((i) => frames[i]).filter(Boolean);
    const allSel = [...selRects, ...selFrames];
    if (allSel.length === 0) { setContextMenu(null); return; }

    const bboxRight = Math.max(...allSel.map((r) => r.x + r.w));
    const bboxLeft = Math.min(...allSel.map((r) => r.x));
    const offsetX = bboxRight - bboxLeft + 40;

    if (selRects.length > 0) {
      setRectangles((prev) => {
        const duped = selRects.map((r) => ({ ...r, x: r.x + offsetX }));
        const startIdx = prev.length;
        setSelectedRectIndices(duped.map((_, i) => startIdx + i));
        return [...prev, ...duped];
      });
    }
    if (selFrames.length > 0) {
      setFrames((prev) => {
        const duped = selFrames.map((r) => ({ ...r, x: r.x + offsetX, id: crypto.randomUUID(), tag: r.tag }));
        const startIdx = prev.length;
        setSelectedFrameIndices(duped.map((_, i) => startIdx + i));
        return [...prev, ...duped];
      });
    }
    if (selRects.length === 0) setSelectedRectIndices([]);
    if (selFrames.length === 0) setSelectedFrameIndices([]);
    setContextMenu(null);
  }, [selectedRectIndices, selectedFrameIndices, rectangles, frames]);

  const ctxBringToFront = React.useCallback(() => {
    if (selectedRectIndices.length > 0) {
      setRectangles((prev) => {
        const sel = new Set(selectedRectIndices);
        const rest = prev.filter((_, i) => !sel.has(i));
        const moved = selectedRectIndices.map((i) => prev[i]).filter(Boolean);
        const startIdx = rest.length;
        setSelectedRectIndices(moved.map((_, i) => startIdx + i));
        return [...rest, ...moved];
      });
    }
    if (selectedFrameIndices.length > 0) {
      setFrames((prev) => {
        const sel = new Set(selectedFrameIndices);
        const rest = prev.filter((_, i) => !sel.has(i));
        const moved = selectedFrameIndices.map((i) => prev[i]).filter(Boolean);
        const startIdx = rest.length;
        setSelectedFrameIndices(moved.map((_, i) => startIdx + i));
        return [...rest, ...moved];
      });
    }
    setContextMenu(null);
  }, [selectedRectIndices, selectedFrameIndices]);

  const ctxBringToBack = React.useCallback(() => {
    if (selectedRectIndices.length > 0) {
      setRectangles((prev) => {
        const sel = new Set(selectedRectIndices);
        const rest = prev.filter((_, i) => !sel.has(i));
        const moved = selectedRectIndices.map((i) => prev[i]).filter(Boolean);
        setSelectedRectIndices(moved.map((_, i) => i));
        return [...moved, ...rest];
      });
    }
    if (selectedFrameIndices.length > 0) {
      setFrames((prev) => {
        const sel = new Set(selectedFrameIndices);
        const rest = prev.filter((_, i) => !sel.has(i));
        const moved = selectedFrameIndices.map((i) => prev[i]).filter(Boolean);
        setSelectedFrameIndices(moved.map((_, i) => i));
        return [...moved, ...rest];
      });
    }
    setContextMenu(null);
  }, [selectedRectIndices, selectedFrameIndices]);

  const ctxDelete = React.useCallback(() => {
    if (selectedRectIndices.length > 0) {
      const toDelete = new Set(selectedRectIndices);
      setRectangles((prev) => prev.filter((_, i) => !toDelete.has(i)));
    }
    if (selectedFrameIndices.length > 0) {
      const toDelete = new Set(selectedFrameIndices);
      const deletedIds = new Set(
        selectedFrameIndices.map((i) => frames[i]?.id).filter((id): id is string => !!id)
      );
      if (deletedIds.size > 0) {
        setEdges((prev) => prev.filter((e) => !deletedIds.has(e.fromId) && !deletedIds.has(e.toId)));
      }
      setFrames((prev) => prev.filter((_, i) => !toDelete.has(i)));
    }
    setSelectedRectIndices([]);
    setSelectedFrameIndices([]);
    setContextMenu(null);
  }, [selectedRectIndices, selectedFrameIndices, frames]);

  const ctxFitCanvas = React.useCallback(() => {
    const allShapes = [...rectangles, ...frames];
    if (allShapes.length === 0) {
      setZoom(100);
      setPanOffset({ x: 0, y: 0 });
      setContextMenu(null);
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) { setContextMenu(null); return; }

    const x1 = Math.min(...allShapes.map((r) => r.x));
    const y1 = Math.min(...allShapes.map((r) => r.y));
    const x2 = Math.max(...allShapes.map((r) => r.x + r.w));
    const y2 = Math.max(...allShapes.map((r) => r.y + r.h));
    const bw = x2 - x1;
    const bh = y2 - y1;
    const pad = 60;
    const scaleX = (rect.width - pad * 2) / bw;
    const scaleY = (rect.height - pad * 2) / bh;
    const newS = clampZoom(Math.min(scaleX, scaleY) * 100) / 100;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    setPanOffset({
      x: rect.width / 2 - cx * newS,
      y: rect.height / 2 - cy * newS,
    });
    setZoom(Math.round(newS * 100));
    setContextMenu(null);
  }, [rectangles, frames]);

  const handleToolbarAction = React.useCallback(
    (actionName: string) => {
      if (singleSelectedFrame === null) return;
      const sourceFrame = frames[singleSelectedFrame];
      if (!sourceFrame || !sourceFrame.id) return;

      const sourceId = sourceFrame.id;
      const childEdges = edges.filter((e) => e.fromId === sourceId);
      const childFrames = childEdges
        .map((e) => frames.find((f) => f.id === e.toId))
        .filter((f): f is Rect => !!f);

      const gap = 80;
      const verticalGap = 40;
      const newX = sourceFrame.x + sourceFrame.w + gap;
      let newY: number;
      if (childFrames.length === 0) {
        newY = sourceFrame.y;
      } else {
        const bottomMost = childFrames.reduce((a, b) =>
          a.y + a.h > b.y + b.h ? a : b
        );
        newY = bottomMost.y + bottomMost.h + verticalGap;
      }

      const newId = crypto.randomUUID();
      const newFrame: Rect = {
        x: newX,
        y: newY,
        w: sourceFrame.w,
        h: sourceFrame.h,
        id: newId,
        tag: actionName,
      };

      setFrames((prev) => {
        const next = [...prev, newFrame];
        setSelectedFrameIndices([next.length - 1]);
        return next;
      });
      setSelectedRectIndices([]);
      setEdges((prev) => [...prev, { fromId: sourceId, toId: newId }]);
    },
    [singleSelectedFrame, frames, edges]
  );

  // ------ Keyboard shortcuts (Ctrl+C / V / D, [ / ]) ------

  React.useEffect(() => {
    const isEditing = (e: KeyboardEvent) => {
      const t = e.target;
      return (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        (t instanceof HTMLElement && t.isContentEditable)
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditing(e)) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        ctxCopy();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        ctxPaste();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        ctxDuplicate();
      }
      if (e.key === "[" && !e.ctrlKey && !e.metaKey) {
        ctxBringToFront();
      }
      if (e.key === "]" && !e.ctrlKey && !e.metaKey) {
        ctxBringToBack();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ctxCopy, ctxPaste, ctxDuplicate, ctxBringToFront, ctxBringToBack]);

  // ------ Rectangle drawing (drag) ------

  React.useEffect(() => {
    if (!isDrawing) return;

    const onMove = (e: MouseEvent) => {
      const pt = screenToCanvas(e.clientX, e.clientY);
      const sx = drawStartRef.current.x;
      const sy = drawStartRef.current.y;
      const next = {
        x: Math.min(sx, pt.x),
        y: Math.min(sy, pt.y),
        w: Math.abs(pt.x - sx),
        h: Math.abs(pt.y - sy),
      };
      drawingRectRef.current = next;
      setDrawingRect(next);
    };

    const onUp = () => {
      const r = drawingRectRef.current;
      const tool = drawingToolRef.current;
      setIsDrawing(false);
      setDrawingRect(null);
      drawingRectRef.current = null;
      if (r && r.w > 2 && r.h > 2) {
        if (tool === "frame") {
          setFrames((prev) => {
            const next = [...prev, { ...r, id: crypto.randomUUID() }];
            setSelectedFrameIndices([next.length - 1]);
            return next;
          });
          setSelectedRectIndices([]);
        } else {
          setRectangles((prev) => {
            const next = [...prev, r];
            setSelectedRectIndices([next.length - 1]);
            return next;
          });
          setSelectedFrameIndices([]);
        }
      }
      setActiveTool("select");
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDrawing, screenToCanvas]);

  // ------ Move selected shapes (drag) ------

  React.useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      hasDraggedRef.current = true;
      const pt = screenToCanvas(e.clientX, e.clientY);
      let dx = pt.x - dragStartCanvasRef.current.x;
      let dy = pt.y - dragStartCanvasRef.current.y;

      const draggedShapes: SimpleRect[] = [];
      for (const [idx, pos] of dragInitialRectsRef.current) {
        const orig = dragAllRectsRef.current[idx];
        if (orig) draggedShapes.push({ x: pos.x + dx, y: pos.y + dy, w: orig.w, h: orig.h });
      }
      for (const [idx, pos] of dragInitialFramesRef.current) {
        const orig = dragAllFramesRef.current[idx];
        if (orig) draggedShapes.push({ x: pos.x + dx, y: pos.y + dy, w: orig.w, h: orig.h });
      }

      const draggedRectIdxs = new Set(dragInitialRectsRef.current.keys());
      const draggedFrameIdxs = new Set(dragInitialFramesRef.current.keys());
      const others: SimpleRect[] = [
        ...dragAllRectsRef.current.filter((_, i) => !draggedRectIdxs.has(i)),
        ...dragAllFramesRef.current.filter((_, i) => !draggedFrameIdxs.has(i)),
      ];

      if (draggedShapes.length > 0 && others.length > 0) {
        const bx1 = Math.min(...draggedShapes.map((r) => r.x));
        const by1 = Math.min(...draggedShapes.map((r) => r.y));
        const bx2 = Math.max(...draggedShapes.map((r) => r.x + r.w));
        const by2 = Math.max(...draggedShapes.map((r) => r.y + r.h));
        const bbox: SimpleRect = { x: bx1, y: by1, w: bx2 - bx1, h: by2 - by1 };

        const snap = computeSnapGuides(bbox, others, SNAP_THRESHOLD);
        dx += snap.snapDx;
        dy += snap.snapDy;
        setSnapGuides({ x: snap.xGuides, y: snap.yGuides });
      } else {
        setSnapGuides({ x: [], y: [] });
      }

      if (dragInitialRectsRef.current.size > 0) {
        setRectangles((prev) => {
          const next = [...prev];
          for (const [idx, pos] of dragInitialRectsRef.current) {
            if (next[idx]) next[idx] = { ...next[idx], x: pos.x + dx, y: pos.y + dy };
          }
          return next;
        });
      }
      if (dragInitialFramesRef.current.size > 0) {
        setFrames((prev) => {
          const next = [...prev];
          for (const [idx, pos] of dragInitialFramesRef.current) {
            if (next[idx]) next[idx] = { ...next[idx], x: pos.x + dx, y: pos.y + dy };
          }
          return next;
        });
      }
    };

    const onUp = () => {
      setIsDragging(false);
      setSnapGuides({ x: [], y: [] });
      if (!hasDraggedRef.current && clickedObjRef.current) {
        const { type, idx } = clickedObjRef.current;
        if (type === "rect") {
          setSelectedRectIndices([idx]);
          setSelectedFrameIndices([]);
        } else {
          setSelectedFrameIndices([idx]);
          setSelectedRectIndices([]);
        }
      }
      clickedObjRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, screenToCanvas]);

  // ------ Resize selected shape (corner drag) ------

  React.useEffect(() => {
    if (!isResizing) return;
    const rectIdx = singleSelectedRect;
    const frameIdx = singleSelectedFrame;

    const onMove = (e: MouseEvent) => {
      const pt = screenToCanvas(e.clientX, e.clientY);
      const a = resizeAnchorRef.current;
      const nr = {
        x: Math.min(a.x, pt.x),
        y: Math.min(a.y, pt.y),
        w: Math.max(2, Math.abs(pt.x - a.x)),
        h: Math.max(2, Math.abs(pt.y - a.y)),
      };
      if (rectIdx !== null) {
        setRectangles((prev) => {
          const next = [...prev];
          next[rectIdx] = nr;
          return next;
        });
      } else if (frameIdx !== null) {
        setFrames((prev) => {
          const next = [...prev];
          next[frameIdx] = nr;
          return next;
        });
      }
    };

    const onUp = () => setIsResizing(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing, singleSelectedRect, singleSelectedFrame, screenToCanvas]);

  // ------ Marquee selection (drag) ------

  React.useEffect(() => {
    if (!isMarqueeSelecting) return;

    const onMove = (e: MouseEvent) => {
      const pt = screenToCanvas(e.clientX, e.clientY);
      const sx = marqueeStartRef.current.x;
      const sy = marqueeStartRef.current.y;
      setMarqueeRect({
        x: Math.min(sx, pt.x),
        y: Math.min(sy, pt.y),
        w: Math.abs(pt.x - sx),
        h: Math.abs(pt.y - sy),
      });
    };

    const onUp = () => {
      setIsMarqueeSelecting(false);
      setMarqueeRect((mq) => {
        if (mq && mq.w > 2 && mq.h > 2) {
          const rectHits: number[] = [];
          rectangles.forEach((r, i) => {
            if (mq.x < r.x + r.w && mq.x + mq.w > r.x && mq.y < r.y + r.h && mq.y + mq.h > r.y) {
              rectHits.push(i);
            }
          });
          const frameHits: number[] = [];
          frames.forEach((r, i) => {
            if (mq.x < r.x + r.w && mq.x + mq.w > r.x && mq.y < r.y + r.h && mq.y + mq.h > r.y) {
              frameHits.push(i);
            }
          });

          if (marqueeCtrlRef.current) {
            setSelectedRectIndices((prev) => [...new Set([...prev, ...rectHits])]);
            setSelectedFrameIndices((prev) => [...new Set([...prev, ...frameHits])]);
          } else {
            setSelectedRectIndices(rectHits);
            setSelectedFrameIndices(frameHits);
          }
        }
        return null;
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isMarqueeSelecting, rectangles, frames, screenToCanvas]);

  // ------ Grid ------

  const gridSize = (24 * zoom) / 100;
  const dotRadius = Math.max(0.5, Math.min(2, zoom / 100));
  const bgX = ((panOffset.x % gridSize) + gridSize) % gridSize;
  const bgY = ((panOffset.y % gridSize) + gridSize) % gridSize;

  // ------ Cursor ------

  let canvasCursor = "default";
  if (isResizing) {
    const c = resizeCornerRef.current;
    canvasCursor = c === "nw" || c === "se" ? "nwse-resize" : "nesw-resize";
  } else if (isDragging) canvasCursor = "move";
  else if (isPanning) canvasCursor = "grabbing";
  else if (isHandMode) canvasCursor = "grab";
  else if (isZoomMode && isAltDown) canvasCursor = "zoom-out";
  else if (isZoomMode) canvasCursor = "zoom-in";
  else if (activeTool === "rectangle" || activeTool === "frame") canvasCursor = "crosshair";

  const s = zoom / 100;

  const selColor =
    singleSelectedRect !== null ? RECT_SEL :
    singleSelectedFrame !== null ? FRAME_SEL : FRAME_SEL;
  const selRect =
    singleSelectedRect !== null ? rectangles[singleSelectedRect] ?? null :
    singleSelectedFrame !== null ? frames[singleSelectedFrame] ?? null : null;
  const selScreen = selRect
    ? {
        x: panOffset.x + selRect.x * s,
        y: panOffset.y + selRect.y * s,
        w: selRect.w * s,
        h: selRect.h * s,
      }
    : null;

  const allSelectedShapes = [
    ...selectedRectIndices.map((i) => rectangles[i]).filter(Boolean),
    ...selectedFrameIndices.map((i) => frames[i]).filter(Boolean),
  ];
  const multiBbox =
    totalSelected > 1 && allSelectedShapes.length > 1
      ? {
          x: Math.min(...allSelectedShapes.map((r) => r.x)),
          y: Math.min(...allSelectedShapes.map((r) => r.y)),
          w:
            Math.max(...allSelectedShapes.map((r) => r.x + r.w)) -
            Math.min(...allSelectedShapes.map((r) => r.x)),
          h:
            Math.max(...allSelectedShapes.map((r) => r.y + r.h)) -
            Math.min(...allSelectedShapes.map((r) => r.y)),
        }
      : null;
  const multiBboxScreen = multiBbox
    ? {
        x: panOffset.x + multiBbox.x * s,
        y: panOffset.y + multiBbox.y * s,
        w: multiBbox.w * s,
        h: multiBbox.h * s,
      }
    : null;

  const drawScreen = drawingRect
    ? {
        x: panOffset.x + drawingRect.x * s,
        y: panOffset.y + drawingRect.y * s,
        w: drawingRect.w * s,
        h: drawingRect.h * s,
      }
    : null;

  const canvasModeBadge = (
    <CanvasModeBadge onClose={() => router.push("/")} />
  );

  if (!hasMounted) {
    return <div className="relative flex h-full flex-col overflow-hidden" />;
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Dot grid — scales & pans with canvas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={entranceDone.current ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, var(--border) ${dotRadius}px, transparent ${dotRadius}px)`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${bgX}px ${bgY}px`,
        }}
      />

      {/* Title bar — left */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={entranceDone.current ? { duration: 0 } : { ...spring, delay: 0.06 }}
        className="relative z-30 flex h-10 shrink-0 items-center px-2"
        data-canvas-ui
      >
        <div className="flex items-center">
          <button
            type="button"
            className="rounded px-2 py-1 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Untitled
          </button>
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded text-foreground/40 transition-colors hover:bg-accent hover:text-foreground/60"
          >
            <CaretDown size={12} weight="regular" />
          </button>
        </div>
      </motion.div>

      {/* Title bar — right buttons (absolute, above sidebar) */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={entranceDone.current ? { duration: 0 } : { ...spring, delay: 0.06 }}
        className="absolute right-0 top-0 z-30 flex h-10 items-center gap-0.5 px-2"
        data-canvas-ui
      >
        <button
          type="button"
          className="flex size-6 items-center justify-center rounded text-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          title="聊天记录"
        >
          <ChatCircleDots size={16} weight="regular" />
        </button>
        <button
          type="button"
          onClick={() => setRightPanelOpen((v) => !v)}
          className="flex size-6 items-center justify-center rounded text-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          title="展开侧栏"
        >
          <SidebarSimple
            size={16}
            weight="regular"
            className="-scale-x-100"
          />
        </button>
      </motion.div>

      {/* Canvas workspace */}
      <div
        ref={canvasRef}
        className="relative flex-1"
        style={{ cursor: canvasCursor }}
        onMouseDown={handleCanvasMouseDown}
        onContextMenu={handleCanvasContextMenu}
      >
        {/* Rectangles layer */}
        <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible">
          <defs>
            {frames.map((r, i) => {
              const repX = Math.max(1, Math.round(r.w / 24));
              const repY = Math.max(1, Math.round(r.h / 24));
              const pw = r.w / repX;
              const ph = r.h / repY;
              return (
                <pattern
                  key={`checker-pat-${i}`}
                  id={`checker-${i}`}
                  x={r.x}
                  y={r.y}
                  width={pw}
                  height={ph}
                  patternUnits="userSpaceOnUse"
                >
                  <rect width={pw} height={ph} fill="#EFEFEF" />
                  <rect width={pw / 2} height={ph / 2} fill="#FFFFFF" />
                  <rect x={pw / 2} y={ph / 2} width={pw / 2} height={ph / 2} fill="#FFFFFF" />
                </pattern>
              );
            })}
          </defs>
          <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${s})`}>
            {edges.map((edge) => {
              const from = frames.find((f) => f.id === edge.fromId);
              const to = frames.find((f) => f.id === edge.toId);
              if (!from || !to) return null;
              const x1 = from.x + from.w;
              const y1 = from.y + from.h / 2;
              const x2 = to.x;
              const y2 = to.y + to.h / 2;

              const fromIdx = frames.findIndex((f) => f.id === edge.fromId);
              const toIdx = frames.findIndex((f) => f.id === edge.toId);
              const isActive = selectedFrameIndices.includes(fromIdx) || selectedFrameIndices.includes(toIdx);

              const dx = (x2 - x1) * 0.45;
              const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              const strokeColor = isActive ? "#8B5CF6" : "#9CA3AF";

              return (
                <path
                  key={`edge-${edge.fromId}-${edge.toId}`}
                  d={d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2 / s}
                  strokeDasharray={isActive ? "none" : `${6 / s} ${4 / s}`}
                />
              );
            })}
            {frames.map((r, i) => (
              <rect
                key={`frame-${i}`}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill={`url(#checker-${i})`}
                stroke="none"
              />
            ))}
            {rectangles.map((r, i) => (
              <rect
                key={i}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill={r.fill ?? "white"}
                stroke={selectedRectIndices.includes(i) ? "none" : (r.stroke ?? "rgba(0,0,0,0.06)")}
                strokeWidth={1 / s}
              />
            ))}
            {drawingRect && (
              <rect
                x={drawingRect.x}
                y={drawingRect.y}
                width={drawingRect.w}
                height={drawingRect.h}
                fill={drawingToolRef.current === "rectangle" ? "rgba(59,130,246,0.04)" : "rgba(139,92,246,0.04)"}
                stroke={drawingToolRef.current === "rectangle" ? RECT_SEL : FRAME_SEL}
                strokeWidth={1.5 / s}
                strokeDasharray={`${5 / s} ${4 / s}`}
              />
            )}
            {marqueeRect && (
              <rect
                x={marqueeRect.x}
                y={marqueeRect.y}
                width={marqueeRect.w}
                height={marqueeRect.h}
                fill="rgba(59,130,246,0.08)"
                stroke="rgba(59,130,246,0.4)"
                strokeWidth={1 / s}
              />
            )}
            {selectedRectIndices.map((i) => {
              const r = rectangles[i];
              return r ? <SelectionOverlay key={`rsel-${i}`} r={r} s={s} color={RECT_SEL} /> : null;
            })}
            {selectedFrameIndices.map((i) => {
              const r = frames[i];
              const color = r?.tag === "Upscale" ? "#792fff" : FRAME_SEL;
              return r ? <SelectionOverlay key={`fsel-${i}`} r={r} s={s} color={color} /> : null;
            })}
            {multiBbox && (
              <rect
                x={multiBbox.x}
                y={multiBbox.y}
                width={multiBbox.w}
                height={multiBbox.h}
                fill="none"
                stroke={RECT_SEL}
                strokeWidth={1 / s}
                strokeDasharray={`${4 / s} ${3 / s}`}
              />
            )}
            {snapGuides.x.map((g, i) => (
              <line
                key={`sgx-${i}`}
                x1={g.pos}
                y1={g.y1}
                x2={g.pos}
                y2={g.y2}
                stroke={SNAP_GUIDE_COLOR}
                strokeWidth={1 / s}
                strokeDasharray={`${3 / s} ${2 / s}`}
              />
            ))}
            {snapGuides.y.map((g, i) => (
              <line
                key={`sgy-${i}`}
                x1={g.x1}
                y1={g.pos}
                x2={g.x2}
                y2={g.pos}
                stroke={SNAP_GUIDE_COLOR}
                strokeWidth={1 / s}
                strokeDasharray={`${3 / s} ${2 / s}`}
              />
            ))}
          </g>
        </svg>

        {/* Frame tags + overlay */}
        {frames.map((f, i) => {
          if (!f.tag) return null;
          const screenX = panOffset.x + f.x * s;
          const screenY = panOffset.y + f.y * s;
          const screenW = f.w * s;
          const screenH = f.h * s;
          const isSelected = selectedFrameIndices.includes(i);
          const isUpscale = f.tag === "Upscale";
          return (
            <React.Fragment key={`frame-tag-${f.id || i}`}>
              <div
                className="pointer-events-none absolute z-[2]"
                style={{
                  left: screenX + 8,
                  top: screenY + 8,
                }}
              >
                <span className="inline-flex items-center rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                  {f.tag}
                </span>
              </div>
              {isUpscale && (
                <div
                  className={cn(
                    "absolute z-[3] flex items-center justify-center overflow-clip",
                    isSelected
                      ? "pointer-events-auto backdrop-blur-[50px]"
                      : "pointer-events-none"
                  )}
                  style={{
                    left: screenX,
                    top: screenY,
                    width: screenW,
                    height: screenH,
                    backgroundColor: "rgba(175, 130, 255, 0.24)",
                    border: isSelected ? "1px solid #792fff" : "none",
                  }}
                >
                  {isSelected ? (
                    <button
                      data-canvas-ui
                      type="button"
                      className="flex h-8 items-center gap-1 rounded-full border border-white/10 bg-black px-3 shadow-lg transition-colors hover:bg-black/80"
                    >
                      <Play size={14} weight="fill" className="text-white" />
                      <span className="text-[13px] text-white">Execute</span>
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-foreground/30">
                      Wait to execute
                    </span>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Drawing size label */}
        {drawScreen && drawingRect && drawingRect.w > 8 && drawingRect.h > 8 && (
          <div
            className="pointer-events-none absolute z-20"
            style={{
              left: drawScreen.x + drawScreen.w / 2,
              top: drawScreen.y + drawScreen.h + 8,
              transform: "translateX(-50%)",
            }}
          >
            <div className="rounded-md px-2 py-0.5 text-[11px] font-medium text-white tabular-nums whitespace-nowrap" style={{ backgroundColor: drawingToolRef.current === "rectangle" ? RECT_SEL : FRAME_SEL }}>
              {Math.round(drawingRect.w)} × {Math.round(drawingRect.h)}
            </div>
          </div>
        )}

        {/* Selected — size label */}
        {selScreen && selRect && (
          <div
            data-canvas-ui
            className="pointer-events-none absolute z-20"
            style={{
              left: selScreen.x + selScreen.w / 2,
              top: selScreen.y + selScreen.h + 8,
              transform: "translateX(-50%)",
            }}
          >
            <div className="rounded-md px-2 py-0.5 text-[11px] font-medium text-white tabular-nums whitespace-nowrap" style={{ backgroundColor: selColor }}>
              {Math.round(selRect.w)} × {Math.round(selRect.h)}
            </div>
          </div>
        )}

        {/* Selected — resize corner handles */}
        {selScreen && selRect && (
          <>
            {(
              [
                ["nw", selScreen.x, selScreen.y, "nwse-resize"],
                ["ne", selScreen.x + selScreen.w, selScreen.y, "nesw-resize"],
                ["sw", selScreen.x, selScreen.y + selScreen.h, "nesw-resize"],
                ["se", selScreen.x + selScreen.w, selScreen.y + selScreen.h, "nwse-resize"],
              ] as const
            ).map(([corner, cx, cy, cursor]) => (
              <div
                key={corner}
                data-canvas-ui
                className="absolute z-20"
                style={{
                  left: cx - 6,
                  top: cy - 6,
                  width: 12,
                  height: 12,
                  cursor,
                }}
                onMouseDown={(e) => handleResizeStart(corner, e)}
              />
            ))}
          </>
        )}

        {/* Selected rectangle — floating toolbar (fill / stroke) */}
        {selScreen && selRect && singleSelectedRect !== null && (() => {
          const curRect = rectangles[singleSelectedRect];
          if (!curRect) return null;
          const curFill = curRect.fill ?? "#FFFFFF";
          const curStroke = curRect.stroke ?? "none";
          return (
            <div
              data-canvas-ui
              className="absolute z-20 flex items-center overflow-clip rounded-lg border border-border bg-card shadow-lg"
              style={{
                left: selScreen.x + selScreen.w / 2,
                top: selScreen.y - 48,
                transform: "translateX(-50%)",
                cursor: "default",
              }}
            >
              <TooltipProvider delayDuration={200}>
              <div className="relative flex items-center gap-1 p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded transition-colors hover:bg-accent"
                      onClick={() => setColorPicker((v) => (v === "fill" ? null : "fill"))}
                    >
                      <span
                        className="size-5 rounded-full border-2 border-border/60"
                        style={{ backgroundColor: curFill }}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>填充颜色</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="relative flex size-8 items-center justify-center rounded transition-colors hover:bg-accent"
                      onClick={() => setColorPicker((v) => (v === "stroke" ? null : "stroke"))}
                    >
                      <span
                        className="size-5 rounded-full border-2"
                        style={{
                          backgroundColor: curStroke === "none" ? "transparent" : curStroke,
                          borderColor: curStroke === "none" ? "var(--border)" : curStroke,
                        }}
                      />
                      {curStroke === "none" && (
                        <Prohibit size={14} weight="bold" className="absolute text-foreground/40" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>边框颜色</TooltipContent>
                </Tooltip>

                {colorPicker && (
                  <div
                    className="absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 rounded-lg border border-border bg-card p-2 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="grid grid-cols-5 gap-1.5">
                      {colorPicker === "stroke" && (
                        <button
                          type="button"
                          title="无边框"
                          className="relative flex size-6 items-center justify-center rounded-full border border-border/60 bg-transparent transition-colors hover:bg-accent"
                          onClick={() => {
                            setRectangles((prev) => {
                              const next = [...prev];
                              next[singleSelectedRect!] = { ...next[singleSelectedRect!], stroke: "none" };
                              return next;
                            });
                            setColorPicker(null);
                          }}
                        >
                          <Prohibit size={12} weight="bold" className="text-foreground/40" />
                        </button>
                      )}
                      {["#FFFFFF", "#000000", "#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="size-6 rounded-full border border-border/40 transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            const key = colorPicker;
                            setRectangles((prev) => {
                              const next = [...prev];
                              next[singleSelectedRect!] = { ...next[singleSelectedRect!], [key]: c };
                              return next;
                            });
                            setColorPicker(null);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </TooltipProvider>
            </div>
          );
        })()}

        {/* Selected frame — floating toolbar */}
        {selScreen && selRect && singleSelectedFrame !== null && (
          <div
            data-canvas-ui
            className="absolute z-20 flex items-center overflow-clip rounded-lg border border-border bg-card shadow-lg"
            style={{
              left: selScreen.x + selScreen.w / 2,
              top: selScreen.y - 48,
              transform: "translateX(-50%)",
              cursor: "default",
            }}
          >
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center border-r border-border p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        if (rightPanelOpen) {
                          requestAnimationFrame(() => sidebarInputRef.current?.focus());
                        } else {
                          setInputExpanded(true);
                        }
                      }}
                      className="flex h-8 items-center gap-1 rounded px-2 text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Sparkle size={16} weight="fill" />
                      <span className="text-[13px] font-medium">Chat</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>描述你的想法</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-1 border-r border-border p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleToolbarAction("Refine")}
                      className="flex size-8 items-center justify-center rounded text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <MagicWand size={16} weight="regular" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>Refine</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleToolbarAction("Enhance")}
                      className="flex size-8 items-center justify-center rounded text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.9719 2.81119L11.7488 0.674676C11.7679 0.623406 11.8021 0.579187 11.847 0.547962C11.8919 0.516737 11.9453 0.5 12 0.5C12.0547 0.5 12.1081 0.516737 12.153 0.547962C12.1979 0.579187 12.2321 0.623406 12.2512 0.674676L13.0281 2.81119C13.0416 2.84801 13.063 2.88146 13.0908 2.90921C13.1185 2.93696 13.152 2.95836 13.1888 2.97193L15.3253 3.74884C15.3766 3.76787 15.4208 3.80214 15.452 3.84704C15.4833 3.89193 15.5 3.94531 15.5 4C15.5 4.05469 15.4833 4.10807 15.452 4.15296C15.4208 4.19786 15.3766 4.23213 15.3253 4.25116L13.1888 5.02807C13.152 5.04164 13.1185 5.06304 13.0908 5.09079C13.063 5.11854 13.0416 5.15199 13.0281 5.18881L12.2512 7.32532C12.2321 7.37659 12.1979 7.42081 12.153 7.45204C12.1081 7.48326 12.0547 7.5 12 7.5C11.9453 7.5 11.8919 7.48326 11.847 7.45204C11.8021 7.42081 11.7679 7.37659 11.7488 7.32532L10.9719 5.18881C10.9584 5.15199 10.937 5.11854 10.9092 5.09079C10.8815 5.06304 10.848 5.04164 10.8112 5.02807L8.67468 4.25116C8.62341 4.23213 8.57919 4.19786 8.54796 4.15296C8.51674 4.10807 8.5 4.05469 8.5 4C8.5 3.94531 8.51674 3.89193 8.54796 3.84704C8.57919 3.80214 8.62341 3.76787 8.67468 3.74884L10.8112 2.97193C10.848 2.95836 10.8815 2.93696 10.9092 2.90921C10.937 2.88146 10.9584 2.84801 10.9719 2.81119Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9.5 8C9.91421 8 10.25 7.66421 10.25 7.25C10.25 6.83579 9.91421 6.5 9.5 6.5C9.08579 6.5 8.75 6.83579 8.75 7.25C8.75 7.66421 9.08579 8 9.5 8Z" fill="currentColor"/>
                        <path d="M1.5 12L5.2949 7.78344C5.67817 7.35759 6.34018 7.34018 6.7453 7.7453L9 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 3.5L2.5 3.5C1.94772 3.5 1.5 3.94772 1.5 4.5L1.5 12.5C1.5 13.0523 1.94772 13.5 2.5 13.5L9 13.5H13.5C14.0523 13.5 14.5 13.0523 14.5 12.5L14.5 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>Enhance</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleToolbarAction("Upscale")}
                      className="flex size-8 items-center justify-center rounded text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <FrameCorners size={16} weight="regular" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>Upscale</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleToolbarAction("Stylize")}
                      className="flex size-8 items-center justify-center rounded text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.2501 8.10369L12.4864 9.44932C12.5436 9.48462 12.61 9.50222 12.6772 9.49993C12.7444 9.49763 12.8094 9.47553 12.8641 9.4364C12.9188 9.39727 12.9607 9.34286 12.9845 9.28C13.0084 9.21714 13.0132 9.14863 12.9982 9.08307L12.3901 6.57119L14.3801 4.89119C14.4313 4.84809 14.4684 4.79072 14.4867 4.72641C14.5051 4.6621 14.5039 4.59378 14.4832 4.53017C14.4626 4.46656 14.4234 4.41056 14.3707 4.36933C14.3181 4.3281 14.2543 4.3035 14.1876 4.29869L11.5757 4.09182L10.5695 1.70807C10.5429 1.64629 10.4987 1.59366 10.4425 1.55668C10.3863 1.5197 10.3205 1.5 10.2532 1.5C10.186 1.5 10.1202 1.5197 10.064 1.55668C10.0078 1.59366 9.96362 1.64629 9.93699 1.70807L8.93074 4.09182L6.31886 4.29869C6.2519 4.30294 6.18773 4.32713 6.13463 4.36814C6.08152 4.40916 6.0419 4.46513 6.02086 4.52884C5.99982 4.59256 5.99833 4.66112 6.01657 4.72569C6.03482 4.79027 6.07197 4.8479 6.12324 4.89119L8.11324 6.57119L7.50011 9.08307C7.48518 9.14863 7.48994 9.21714 7.51381 9.28C7.53767 9.34286 7.57958 9.39727 7.63426 9.4364C7.68895 9.47553 7.75397 9.49763 7.82117 9.49993C7.88838 9.50222 7.95476 9.48462 8.01199 9.44932L10.2501 8.10369Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5.15312 7.34668L1.5 10.9998" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5.82875 11.1714L2.5 14.5001" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10.3925 11.1074L7 14.4999" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>Stylize</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.5 14.5V13L6.00063 6.5L2.5 13V14.5" stroke="currentColor" strokeLinecap="square" strokeLinejoin="round"/>
                        <path d="M4 10.5H8M3 14.5H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M1.5 7L6 1.5L12.5 7L14.5 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>Inpaint</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <DownloadSimple size={16} weight="regular" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>Download</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        )}

        {/* Upscale popover — shown when an Upscale-tagged frame is selected */}
        <AnimatePresence>
          {selectedFrameTag === "Upscale" && selScreen && selRect && singleSelectedFrame !== null && (
            <motion.div
              data-canvas-ui
              initial={{ opacity: 0, y: -6, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -6, x: "-50%" }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 w-[320px] overflow-clip rounded-lg border border-border bg-card shadow-lg"
              style={{
                left: selScreen.x + selScreen.w / 2,
                top: selScreen.y + selScreen.h + 12,
                cursor: "default",
              }}
            >
              <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">Upscale</span>
                  <span className="text-[13px] text-muted-foreground">Select upscale size</span>
                </div>
                <div className="flex gap-2">
                  {["2x", "4x", "6x", "8x", "12x"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setUpscaleSize(size)}
                      className={cn(
                        "flex h-6 flex-1 items-center justify-center rounded text-xs transition-colors",
                        upscaleSize === size
                          ? "border border-violet-500 bg-violet-500/20 text-violet-400"
                          : "border border-border text-foreground hover:bg-accent"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context menu */}
        {contextMenu && (
          <CanvasContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            type={contextMenu.type}
            canvasPt={contextMenu.canvasPt}
            onClose={() => setContextMenu(null)}
            onChat={() => { setRightPanelOpen(true); setContextMenu(null); }}
            onCopy={ctxCopy}
            onPaste={() => ctxPaste(contextMenu?.type === "canvas" ? contextMenu.canvasPt : undefined)}
            onDuplicate={ctxDuplicate}
            onBringToFront={ctxBringToFront}
            onBringToBack={ctxBringToBack}
            onDelete={ctxDelete}
            onFitCanvas={ctxFitCanvas}
          />
        )}

        {/* Left toolbar */}
        <TooltipProvider delayDuration={200}>
          <motion.div
            data-canvas-ui
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={entranceDone.current ? { duration: 0 } : { ...spring, delay: 0.18 }}
            className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col rounded-lg border border-border bg-ai-foreground"
            style={{ cursor: "default" }}
          >
            <div className="flex flex-col gap-1 border-b border-border p-1">
              <ToolbarButton
                icon={RectangleIcon}
                label="矩形"
                shortcut="R"
                active={activeTool === "rectangle"}
                activeColor="blue"
                onClick={() =>
                  setActiveTool((t) => (t === "rectangle" ? "select" : "rectangle"))
                }
              />
              <ToolbarButton
                icon={FrameIcon}
                label="图框"
                shortcut="I"
                description="绘制空白画框后生成"
                active={activeTool === "frame"}
                onClick={() =>
                  setActiveTool((t) => (t === "frame" ? "select" : "frame"))
                }
              />
              <ToolbarButton icon={UploadSimple} label="上传图片" />
              <ToolbarButton icon={ImageSquare} label="选择图片" />
            </div>
            <div className="flex items-center justify-center p-2">
              <ToolbarButton icon={Play} label="执行全部任务" variant="circular" />
            </div>
          </motion.div>
        </TooltipProvider>

        {/* Bottom-left — tool selection & zoom */}
        <motion.div
          data-canvas-ui
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={entranceDone.current ? { duration: 0 } : { ...spring, delay: 0.24 }}
          className="absolute bottom-4 left-4 z-10 flex items-center gap-2"
          style={{ cursor: "default" }}
        >
          <TooltipProvider>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTool("select")}
                    className={cn(
                      "flex size-6 items-center justify-center rounded backdrop-blur-[50px]",
                      activeTool === "select" && !isSpaceDown
                        ? "bg-primary/25 text-foreground"
                        : "text-foreground/60 transition-colors hover:text-foreground"
                    )}
                  >
                    <Cursor size={14} weight="regular" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  选择工具
                  <kbd data-slot="kbd" className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded bg-background/15 px-1 text-[10px] font-medium text-background">
                    V
                  </kbd>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveTool("hand")}
                    className={cn(
                      "flex size-6 items-center justify-center rounded backdrop-blur-[50px]",
                      activeTool === "hand" || isSpaceDown
                        ? "bg-primary/25 text-foreground"
                        : "text-foreground/60 transition-colors hover:text-foreground"
                    )}
                  >
                    <Hand size={14} weight="regular" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  抓手工具
                  <kbd data-slot="kbd" className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded bg-background/15 px-1 text-[10px] font-medium text-background">
                    Space
                  </kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </motion.div>

        {/* Bottom-right — zoom controls */}
        <motion.div
          data-canvas-ui
          initial={{ opacity: 0, right: -80 }}
          animate={{
            opacity: 1,
            right: rightPanelOpen ? RIGHT_PANEL_WIDTH + 16 : 16,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-4 z-10 flex items-center"
          style={{ cursor: "default" }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={zoomOutCenter}
                  className="flex size-6 items-center justify-center text-foreground/40 transition-colors hover:text-foreground/60"
                >
                  <Minus size={12} weight="regular" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                缩小
                <kbd data-slot="kbd" className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded bg-background/15 px-1 text-[10px] font-medium text-background">
                  Z
                </kbd>
                <span className="text-[10px] text-background/50">+</span>
                <kbd data-slot="kbd" className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-background/15 px-1 text-[10px] font-medium text-background">
                  ⌥
                </kbd>
              </TooltipContent>
            </Tooltip>
            <span className="min-w-[36px] text-center text-xs tabular-nums text-foreground/60">
              {Math.round(zoom)}%
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={zoomInCenter}
                  className="flex size-6 items-center justify-center text-foreground/40 transition-colors hover:text-foreground/60"
                >
                  <Plus size={12} weight="regular" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                放大
                <kbd data-slot="kbd" className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded bg-background/15 px-1 text-[10px] font-medium text-background">
                  Z
                </kbd>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        {/* TODO: 图层功能实现时恢复这些按钮
        <motion.div
          data-canvas-ui
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.28 }}
          className="absolute bottom-4 z-10 flex items-center gap-0.5"
          style={{
            cursor: "default",
            right: rightPanelOpen ? RIGHT_PANEL_WIDTH + 16 : 16,
            transition: "right 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded text-foreground/60 backdrop-blur-[50px] transition-colors hover:text-foreground"
          >
            <Stack size={14} weight="regular" />
          </button>
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded text-foreground/60 backdrop-blur-[50px] transition-colors hover:text-foreground"
          >
            <GearSix size={14} weight="regular" />
          </button>
        </motion.div>
        */}
      </div>

      {/* Right sidebar overlay — always mounted, animated via x + visibility */}
      <motion.div
        initial={false}
        animate={{ x: rightPanelOpen ? 0 : RIGHT_PANEL_WIDTH }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onAnimationStart={() => {
          if (rightPanelOpen) setSidebarVisible(true);
        }}
        onAnimationComplete={() => {
          if (!rightPanelOpen) setSidebarVisible(false);
        }}
        className="absolute bottom-0 right-0 top-0 z-20 flex h-full w-[360px] flex-col border-l border-border bg-[var(--ai-foreground)]"
        style={{
          pointerEvents: rightPanelOpen ? "auto" : "none",
          visibility: sidebarVisible || rightPanelOpen ? "visible" : "hidden",
        }}
      >
        {/* Spacer matching title bar height */}
        <div className="h-10 shrink-0" />

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {chatMessages.length === 0 ? (
            <p className="pt-8 text-center text-xs text-foreground/30">
              暂无消息
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                      mass: 0.8,
                    }}
                    className="group flex flex-col gap-1"
                  >
                    {msg.role === "user" ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-4 py-2.5">
                          <p className="whitespace-pre-wrap text-[13px] leading-6 text-foreground/90">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-col gap-2">
                          {msg.content.split("\n\n").map((para, i) => (
                            <p
                              key={i}
                              className="text-[13px] leading-6 text-foreground/80"
                            >
                              {para.split("\n").map((line, j) => (
                                <React.Fragment key={j}>
                                  {j > 0 && <br />}
                                  {renderInlineMarkdown(line)}
                                </React.Fragment>
                              ))}
                            </p>
                          ))}
                        </div>
                        <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className={cn(
                              "flex size-6 items-center justify-center rounded-md transition-colors",
                              copiedId === msg.id
                                ? "text-foreground/50"
                                : "text-foreground/25 hover:bg-accent hover:text-foreground/50"
                            )}
                            title="复制"
                          >
                            {copiedId === msg.id ? (
                              <Check size={13} weight="bold" />
                            ) : (
                              <Copy size={13} weight="regular" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {isThinking && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <SidebarThinkingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input inside sidebar */}
        <div className="shrink-0 p-3">
          <ChatInput
            ref={sidebarInputRef}
            onSend={(message) => handleChatSend(message)}
            isLoading={isThinking}
            onStop={() => setIsThinking(false)}
            modeBadge={canvasModeBadge}
          />
        </div>
      </motion.div>

      {/* Canvas input — only visible when sidebar is closed */}
      {!rightPanelOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={inputInitialDone.current ? spring : { ...spring, delay: 0.3 }}
          onAnimationComplete={() => { inputInitialDone.current = true; }}
          className="pointer-events-none absolute bottom-0 z-30 flex justify-center px-[100px] pb-4"
          style={{ left: 0, right: 0 }}
        >
          <div
            className="pointer-events-auto mx-auto w-full"
            style={{ minWidth: 320, maxWidth: inputExpanded ? 800 : 480 }}
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <ChatInput
                compact={!inputExpanded}
                onExpand={() => setInputExpanded(true)}
                onSend={(message) => {
                  handleChatSend(message);
                  setInputExpanded(false);
                  setRightPanelOpen(true);
                }}
                modeBadge={canvasModeBadge}
                className={inputExpanded ? "max-w-[800px]" : undefined}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function CanvasModeBadge({ onClose }: { onClose: () => void }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.button
      type="button"
      onClick={onClose}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="inline-flex h-6 items-center justify-center gap-0.5 rounded bg-[rgba(253,237,35,0.32)] p-1 text-foreground backdrop-blur-[50px]"
    >
      <span className="flex size-4 items-center justify-center">
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 3.5H14M3.5 1.5V14.5M2 12.5H14M12.5 1.5V14.5"
            stroke="currentColor"
          />
        </svg>
      </span>
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 16, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex size-4 items-center justify-center overflow-hidden rounded-full bg-foreground/[0.03]"
          >
            <X size={10} weight="bold" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function CanvasContextMenu({
  x,
  y,
  type,
  onClose,
  onChat,
  onCopy,
  onPaste,
  onDuplicate,
  onBringToFront,
  onBringToBack,
  onDelete,
  onFitCanvas,
}: {
  x: number;
  y: number;
  type: "single" | "multi" | "canvas";
  canvasPt: { x: number; y: number };
  onClose: () => void;
  onChat: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onBringToBack: () => void;
  onDelete: () => void;
  onFitCanvas: () => void;
}) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x, y });

  React.useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = x + rect.width > window.innerWidth ? window.innerWidth - rect.width - 4 : x;
    const ny = y + rect.height > window.innerHeight ? window.innerHeight - rect.height - 4 : y;
    setPos({ x: nx, y: ny });
  }, [x, y]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const MenuItem = ({
    label,
    shortcut,
    icon,
    onClick,
  }: {
    label: string;
    shortcut?: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      type="button"
      className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs font-medium text-popover-foreground transition-colors hover:bg-accent"
      onClick={onClick}
    >
      {icon && <span className="flex size-4 items-center justify-center">{icon}</span>}
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-xs text-muted-foreground">{shortcut}</span>
      )}
    </button>
  );

  const Separator = () => <div className="my-0.5 h-px bg-border" />;

  return (
    <div
      ref={menuRef}
      data-canvas-ui
      className="fixed z-50 w-[206px] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {type === "single" ? (
        <>
          <MenuItem
            label="Chat"
            icon={<Sparkle size={14} weight="fill" />}
            onClick={onChat}
          />
          <Separator />
          <MenuItem label="Copy" shortcut="Ctrl + C" onClick={onCopy} />
          <MenuItem label="Paste" shortcut="Ctrl + V" onClick={onPaste} />
          <MenuItem label="Duplicate" shortcut="Ctrl + D" onClick={onDuplicate} />
          <Separator />
          <MenuItem label="Bring to Front" shortcut="[" onClick={onBringToFront} />
          <MenuItem label="Bring to Back" shortcut="]" onClick={onBringToBack} />
          <Separator />
          <MenuItem label="Save to Project" onClick={onClose} />
          <Separator />
          <MenuItem label="Download" onClick={onClose} />
          <Separator />
          <MenuItem label="Delete" onClick={onDelete} />
        </>
      ) : type === "multi" ? (
        <>
          <MenuItem label="Copy" shortcut="Ctrl + C" onClick={onCopy} />
          <MenuItem label="Paste" shortcut="Ctrl + V" onClick={onPaste} />
          <MenuItem label="Duplicate" shortcut="Ctrl + D" onClick={onDuplicate} />
          <Separator />
          <MenuItem label="Save to Project" onClick={onClose} />
          <Separator />
          <MenuItem label="Download" onClick={onClose} />
          <Separator />
          <MenuItem label="Delete" onClick={onDelete} />
        </>
      ) : (
        <>
          <MenuItem label="Paste here" onClick={onPaste} />
          <Separator />
          <MenuItem label="Fit Canvas" onClick={onFitCanvas} />
        </>
      )}
    </div>
  );
}

function SelectionOverlay({
  r,
  s,
  color = FRAME_SEL,
}: {
  r: { x: number; y: number; w: number; h: number };
  s: number;
  color?: string;
}) {
  const sw = 1.5 / s;
  const hs = 8 / s;
  const hh = hs / 2;

  const corners = [
    [r.x, r.y],
    [r.x + r.w, r.y],
    [r.x, r.y + r.h],
    [r.x + r.w, r.y + r.h],
  ];

  return (
    <>
      <rect
        x={r.x}
        y={r.y}
        width={r.w}
        height={r.h}
        fill="none"
        stroke={color}
        strokeWidth={2 / s}
      />
      {corners.map(([cx, cy], i) => (
        <rect
          key={`sq-${i}`}
          x={cx - hh}
          y={cy - hh}
          width={hs}
          height={hs}
          fill="white"
          stroke={color}
          strokeWidth={sw}
        />
      ))}
    </>
  );
}

function RectangleIcon({
  size = 16,
}: {
  size?: number;
  weight?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

function FrameIcon({
  size = 16,
}: {
  size?: number;
  weight?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 5.69231V8V10.3077V14H5.69231H8H10.3077H14V10.3077V8V5.69231V2H10.3077H8H5.69231H2V5.69231Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="6" y="2" width="4" height="4" fill="currentColor" />
      <rect x="6" y="10" width="4" height="4" fill="currentColor" />
      <rect x="2" y="6" width="4" height="4" fill="currentColor" />
      <rect x="10" y="6" width="4" height="4" fill="currentColor" />
    </svg>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  shortcut,
  description,
  active,
  activeColor = "purple",
  onClick,
  variant = "default",
}: {
  icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "bold" | "fill";
    className?: string;
  }>;
  label: string;
  shortcut?: string;
  description?: string;
  active?: boolean;
  activeColor?: "purple" | "blue";
  onClick?: () => void;
  variant?: "default" | "circular";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "flex items-center justify-center transition-colors",
            variant === "circular"
              ? "size-6 rounded-full border border-border/60 text-foreground/60 hover:bg-accent hover:text-foreground"
              : "size-8 rounded text-foreground/60 hover:bg-accent hover:text-foreground",
            active && (activeColor === "blue"
              ? "bg-[rgba(59,130,246,0.15)] text-[#3B82F6]"
              : "bg-[rgba(139,92,246,0.15)] text-[#8B5CF6]")
          )}
        >
          <Icon size={variant === "circular" ? 12 : 16} weight="regular" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        className={description ? "flex-col items-start" : undefined}
      >
        <span className="inline-flex items-center">
          {label}
          {shortcut && (
            <kbd
              data-slot="kbd"
              className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded bg-background/15 px-1 text-[10px] font-medium text-background"
            >
              {shortcut}
            </kbd>
          )}
        </span>
        {description && (
          <span className="text-[11px] leading-tight text-background/50">
            {description}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarThinkingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <Sparkle
        size={14}
        weight="fill"
        className="text-muted-foreground/50"
        style={{ animation: "sparkle-spin 1.5s ease-in-out infinite" }}
      />
      <span
        className="text-[13px] font-medium"
        style={{
          background:
            "linear-gradient(90deg, var(--muted-foreground) 0%, var(--foreground) 50%, var(--muted-foreground) 100%)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "thinking-shimmer 1.5s ease-in-out infinite",
          opacity: 0.45,
        }}
      >
        思考中
      </span>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1 rounded-full bg-muted-foreground/40"
            style={{
              animation: "thinking-dot 1.2s ease-in-out infinite",
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
