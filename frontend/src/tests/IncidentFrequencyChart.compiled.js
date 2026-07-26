import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from "react";
const VB_W = 800;
const VB_H = 220;
const PAD = { top: 20, right: 24, bottom: 36, left: 44 };
const DAYS_MON_TO_SUN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_JAN_TO_DEC = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FALLBACK_HOURLY = [
  5,
  3,
  2,
  1,
  1,
  2,
  4,
  8,
  12,
  15,
  14,
  16,
  18,
  17,
  15,
  16,
  20,
  24,
  28,
  26,
  22,
  18,
  14,
  9
].map((count, i) => ({
  label: `${String(i).padStart(2, "0")}:00`,
  hour: i,
  count
}));
const FALLBACK_WEEKLY = [
  { label: "Mon", day: "Mon", count: 32 },
  { label: "Tue", day: "Tue", count: 28 },
  { label: "Wed", day: "Wed", count: 35 },
  { label: "Thu", day: "Thu", count: 41 },
  { label: "Fri", day: "Fri", count: 52 },
  { label: "Sat", day: "Sat", count: 68 },
  { label: "Sun", day: "Sun", count: 45 }
];
const FALLBACK_MONTHLY = [
  { label: "Jan", month: "Jan", count: 120 },
  { label: "Feb", month: "Feb", count: 115 },
  { label: "Mar", month: "Mar", count: 140 },
  { label: "Apr", month: "Apr", count: 155 },
  { label: "May", month: "May", count: 130 },
  { label: "Jun", month: "Jun", count: 165 },
  { label: "Jul", month: "Jul", count: 180 },
  { label: "Aug", month: "Aug", count: 175 },
  { label: "Sep", month: "Sep", count: 160 },
  { label: "Oct", month: "Oct", count: 190 },
  { label: "Nov", month: "Nov", count: 205 },
  { label: "Dec", month: "Dec", count: 220 }
];
function normalizeDayName(raw) {
  if (typeof raw === "number") {
    const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return map[raw] || "Mon";
  }
  const s = String(raw).trim();
  if (s.startsWith("Mon")) return "Mon";
  if (s.startsWith("Tue")) return "Tue";
  if (s.startsWith("Wed")) return "Wed";
  if (s.startsWith("Thu")) return "Thu";
  if (s.startsWith("Fri")) return "Fri";
  if (s.startsWith("Sat")) return "Sat";
  if (s.startsWith("Sun")) return "Sun";
  return "Mon";
}
function generateSmoothPath(coords) {
  if (!coords || coords.length === 0) return "";
  if (coords.length === 1) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  const S = 0.16;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(coords.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) * S;
    const cp1y = p1.y + (p2.y - p0.y) * S;
    const cp2x = p2.x - (p3.x - p1.x) * S;
    const cp2y = p2.y - (p3.y - p1.y) * S;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}
function IncidentFrequencyChart({ trends, data, cases, defaultChartType = "area", defaultGranularity = "weekly" }) {
  const [chartType, setChartType] = useState(defaultChartType);
  const [granularity, setGranularity] = useState(defaultGranularity);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const rawPoints = useMemo(() => {
    if (granularity === "hourly") {
      const src2 = trends?.hourly || data?.hourly;
      if (Array.isArray(src2) && src2.length > 0) {
        const slots = Array.from({ length: 24 }, (_, i) => ({
          label: `${String(i).padStart(2, "0")}:00`,
          hour: i,
          count: 0
        }));
        let matched = false;
        src2.forEach((item) => {
          let h = item?.hour !== void 0 ? parseInt(item.hour, 10) : null;
          if (h === null && item?.label) {
            h = parseInt(String(item.label).split(":")[0], 10);
          }
          if (h !== null && h >= 0 && h < 24) {
            slots[h].count = Math.max(0, parseInt(item.count || item.value || 0, 10));
            matched = true;
          }
        });
        if (matched) return slots;
      }
      return FALLBACK_HOURLY;
    }
    if (granularity === "monthly") {
      const src2 = trends?.monthly || data?.monthly;
      if (Array.isArray(src2) && src2.length > 0) {
        const countsMap = Object.fromEntries(MONTHS_JAN_TO_DEC.map((m) => [m, 0]));
        let matched = false;
        src2.forEach((item) => {
          const rawStr = String(item.month || item.label || item.date || "");
          const mMatch = MONTHS_JAN_TO_DEC.find((m) => rawStr.toLowerCase().includes(m.toLowerCase()));
          if (mMatch) {
            countsMap[mMatch] = Math.max(0, parseInt(item.count || item.value || 0, 10));
            matched = true;
          }
        });
        if (matched) {
          return MONTHS_JAN_TO_DEC.map((m) => ({ label: m, month: m, count: countsMap[m] }));
        }
      }
      return FALLBACK_MONTHLY;
    }
    const src = trends?.weekly || data?.weekly || (Array.isArray(data) ? data : null);
    if (Array.isArray(src) && src.length > 0) {
      const countsMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      let matched = false;
      src.forEach((item) => {
        const dayName = normalizeDayName(item.day || item.date || item.dow || item.label);
        if (Object.prototype.hasOwnProperty.call(countsMap, dayName)) {
          countsMap[dayName] = Math.max(0, parseInt(item.count || item.value || 0, 10));
          matched = true;
        }
      });
      if (matched) {
        return DAYS_MON_TO_SUN.map((day) => ({ label: day, day, count: countsMap[day] }));
      }
    }
    return FALLBACK_WEEKLY;
  }, [trends, data, granularity]);
  const plotW = VB_W - PAD.left - PAD.right;
  const plotH = VB_H - PAD.top - PAD.bottom;
  const maxCount = Math.max(1, ...rawPoints.map((p) => p.count));
  const coords = useMemo(() => {
    const N = rawPoints.length;
    return rawPoints.map((p, i) => {
      const x = PAD.left + (N === 1 ? plotW / 2 : plotW * i / (N - 1));
      const y = PAD.top + plotH - plotH * p.count / maxCount;
      return { ...p, x, y, index: i };
    });
  }, [rawPoints, plotW, plotH, maxCount]);
  const linePath = useMemo(() => generateSmoothPath(coords), [coords]);
  const areaPath = useMemo(() => {
    if (!coords || coords.length === 0) return "";
    const topCurve = generateSmoothPath(coords);
    const firstX = coords[0].x.toFixed(1);
    const lastX = coords[coords.length - 1].x.toFixed(1);
    const bottomY = (PAD.top + plotH).toFixed(1);
    return `${topCurve} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [coords, plotH]);
  const gridLines = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      y: PAD.top + plotH * t,
      value: Math.round(maxCount * (1 - t))
    }));
  }, [plotH, maxCount]);
  const barSlot = plotW / rawPoints.length;
  const barWidth = Math.min(48, Math.max(6, barSlot * 0.65));
  const activePoint = hoveredIndex !== null ? coords[hoveredIndex] : null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 h-[360px] flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300",
      style: { backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 mb-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-base shadow-inner", children: "\u{1F4C8}" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold tracking-wide text-slate-100 uppercase font-mono flex items-center gap-2 m-0", children: [
                "Incident Frequency Dynamics",
                /* @__PURE__ */ jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", children: "Live" })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 font-sans m-0 mt-0.5", children: [
                granularity === "hourly" && "24-Hour Incident Velocity",
                granularity === "weekly" && "7-Day Comparative Trend",
                granularity === "monthly" && "12-Month Historical Dynamics"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex items-center bg-slate-950/60 border border-slate-800 p-1 rounded-xl gap-1",
                role: "radiogroup",
                "aria-label": "Chart type selection",
                children: [
                  { type: "bar", label: "Bar" },
                  { type: "area", label: "Area" },
                  { type: "line", label: "Line" }
                ].map(({ type, label }) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    role: "radio",
                    "aria-checked": chartType === type,
                    onClick: () => setChartType(type),
                    className: `px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all duration-200 cursor-pointer ${chartType === type ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-500/50" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"}`,
                    children: label
                  },
                  type
                ))
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex items-center bg-slate-950/60 border border-slate-800 p-1 rounded-xl gap-1",
                role: "radiogroup",
                "aria-label": "Time granularity selection",
                children: [
                  { g: "hourly", label: "Hourly" },
                  { g: "weekly", label: "Weekly" },
                  { g: "monthly", label: "Monthly" }
                ].map(({ g, label }) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    role: "radio",
                    "aria-checked": granularity === g,
                    onClick: () => setGranularity(g),
                    className: `px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all duration-200 cursor-pointer ${granularity === g ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25 border border-emerald-500/50" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"}`,
                    children: label
                  },
                  g
                ))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 w-full min-h-0 flex items-center justify-center", children: [
          /* @__PURE__ */ jsxs(
            "svg",
            {
              viewBox: `0 0 ${VB_W} ${VB_H}`,
              preserveAspectRatio: "xMidYMid meet",
              className: "w-full h-full overflow-visible select-none",
              onMouseLeave: () => setHoveredIndex(null),
              children: [
                /* @__PURE__ */ jsxs("defs", { children: [
                  /* @__PURE__ */ jsxs("linearGradient", { id: "incFreqAreaGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                    /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#3b82f6", stopOpacity: "0.4" }),
                    /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#3b82f6", stopOpacity: "0.0" })
                  ] }),
                  /* @__PURE__ */ jsxs("linearGradient", { id: "incFreqBarGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                    /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#60a5fa", stopOpacity: "0.95" }),
                    /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#1d4ed8", stopOpacity: "0.75" })
                  ] }),
                  /* @__PURE__ */ jsxs("filter", { id: "incFreqGlow", x: "-20%", y: "-20%", width: "140%", height: "140%", children: [
                    /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: "3", result: "blur" }),
                    /* @__PURE__ */ jsx("feComposite", { in: "SourceGraphic", in2: "blur", operator: "over" })
                  ] }),
                  /* @__PURE__ */ jsx("style", { children: `
              @keyframes incLineDraw { to { stroke-dashoffset: 0; } }
              @keyframes incFadeIn { to { opacity: 1; } }
              @keyframes incBarGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
              .inc-line-path {
                stroke-dasharray: 2500;
                stroke-dashoffset: 2500;
                animation: incLineDraw 1000ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
              }
              .inc-area-path { opacity: 0; animation: incFadeIn 600ms 200ms ease forwards; }
              .inc-bar-rect {
                transform-box: fill-box;
                transform-origin: bottom;
                animation: incBarGrow 500ms cubic-bezier(0.4, 0, 0.2, 1) both;
              }
            ` })
                ] }),
                gridLines.map((g, i) => /* @__PURE__ */ jsxs("g", { children: [
                  /* @__PURE__ */ jsx(
                    "line",
                    {
                      x1: PAD.left,
                      y1: g.y,
                      x2: VB_W - PAD.right,
                      y2: g.y,
                      stroke: "#334155",
                      strokeWidth: "1",
                      strokeDasharray: "4 4",
                      opacity: "0.4"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "text",
                    {
                      x: PAD.left - 10,
                      y: g.y + 4,
                      textAnchor: "end",
                      className: "fill-slate-400 font-mono text-[11px]",
                      children: g.value
                    }
                  )
                ] }, i)),
                chartType === "bar" && coords.map((c, i) => {
                  const h = plotH * c.count / maxCount;
                  const x = PAD.left + barSlot * i + (barSlot - barWidth) / 2;
                  const y = PAD.top + plotH - h;
                  const isHovered = hoveredIndex === i;
                  return /* @__PURE__ */ jsxs("g", { onMouseEnter: () => setHoveredIndex(i), children: [
                    /* @__PURE__ */ jsx(
                      "rect",
                      {
                        className: "inc-bar-rect cursor-pointer transition-all duration-200",
                        x,
                        y,
                        width: barWidth,
                        height: Math.max(3, h),
                        rx: "6",
                        ry: "6",
                        fill: "url(#incFreqBarGrad)",
                        opacity: hoveredIndex === null || isHovered ? 1 : 0.4,
                        stroke: isHovered ? "#93c5fd" : "none",
                        strokeWidth: isHovered ? 1.5 : 0,
                        style: { animationDelay: `${i * 25}ms` }
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "text",
                      {
                        x: x + barWidth / 2,
                        y: y - 6,
                        textAnchor: "middle",
                        className: `font-mono text-[10px] font-semibold transition-all ${isHovered ? "fill-blue-300 font-bold" : "fill-slate-400 opacity-80"}`,
                        children: c.count
                      }
                    )
                  ] }, i);
                }),
                (chartType === "area" || chartType === "line") && /* @__PURE__ */ jsxs(Fragment, { children: [
                  chartType === "area" && /* @__PURE__ */ jsx("path", { className: "inc-area-path", d: areaPath, fill: "url(#incFreqAreaGrad)" }),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      className: "inc-line-path",
                      d: linePath,
                      fill: "none",
                      stroke: "#3b82f6",
                      strokeWidth: "3",
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      filter: "url(#incFreqGlow)"
                    }
                  )
                ] }),
                coords.map((c, i) => {
                  const isHovered = hoveredIndex === i;
                  const stepWidth = plotW / Math.max(1, coords.length - 1);
                  const triggerX = c.x - stepWidth / 2;
                  return /* @__PURE__ */ jsxs("g", { onMouseEnter: () => setHoveredIndex(i), children: [
                    /* @__PURE__ */ jsx(
                      "rect",
                      {
                        x: triggerX,
                        y: PAD.top,
                        width: stepWidth,
                        height: plotH,
                        fill: "transparent",
                        className: "cursor-pointer"
                      }
                    ),
                    (chartType === "line" || chartType === "area") && /* @__PURE__ */ jsx(
                      "circle",
                      {
                        cx: c.x,
                        cy: c.y,
                        r: isHovered ? 6.5 : 4,
                        className: "transition-all duration-200 cursor-pointer",
                        fill: isHovered ? "#60a5fa" : "#0f172a",
                        stroke: "#3b82f6",
                        strokeWidth: isHovered ? 3 : 2
                      }
                    )
                  ] }, i);
                }),
                activePoint && /* @__PURE__ */ jsx(
                  "line",
                  {
                    x1: activePoint.x,
                    y1: PAD.top,
                    x2: activePoint.x,
                    y2: PAD.top + plotH,
                    stroke: "#60a5fa",
                    strokeWidth: "1.5",
                    strokeDasharray: "4 4",
                    className: "pointer-events-none transition-all duration-150"
                  }
                ),
                coords.map((c, i) => {
                  const showLabel = rawPoints.length <= 12 || i % Math.ceil(rawPoints.length / 8) === 0 || i === rawPoints.length - 1;
                  if (!showLabel && chartType !== "bar") return null;
                  return /* @__PURE__ */ jsx(
                    "text",
                    {
                      x: chartType === "bar" ? PAD.left + barSlot * i + barSlot / 2 : c.x,
                      y: VB_H - PAD.bottom + 22,
                      textAnchor: "middle",
                      className: `font-sans text-[11px] transition-colors ${hoveredIndex === i ? "fill-blue-300 font-semibold" : "fill-slate-400"}`,
                      children: c.label
                    },
                    i
                  );
                })
              ]
            }
          ),
          activePoint && /* @__PURE__ */ jsxs(
            "div",
            {
              className: "absolute z-20 pointer-events-none px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs transition-all duration-150 transform -translate-x-1/2 -translate-y-full",
              style: {
                left: `${activePoint.x / VB_W * 100}%`,
                top: `${Math.max(10, activePoint.y / VB_H * 100 - 10)}%`
              },
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 font-mono text-slate-400 text-[11px] mb-0.5", children: /* @__PURE__ */ jsxs("span", { children: [
                  "\u{1F4C5} ",
                  activePoint.label
                ] }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-100 font-bold text-sm", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-blue-400 animate-pulse" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    activePoint.count,
                    " Incidents"
                  ] })
                ] })
              ]
            }
          )
        ] })
      ]
    }
  );
}
export {
  IncidentFrequencyChart as default
};
