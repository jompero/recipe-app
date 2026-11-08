// PROTOTYPE (EPIC-10 / US-10.1): throwaway. The floating variant switcher.
import { useEffect, useState } from "react";
import { setVariant, usePrototypeState, type Dimension } from "./prototypeStore.ts";

function cycle(dim: Dimension, current: string | undefined, step: number) {
  const index = Math.max(
    0,
    dim.options.findIndex((o) => o.value === current),
  );
  const next = dim.options[(index + step + dim.options.length) % dim.options.length]!;
  setVariant(dim.key, next.value);
}

/** Bottom-right, high contrast so it's obviously not part of the design. Dev builds only. */
export function PrototypeBar() {
  const { values, dimensions, stats } = usePrototypeState();
  const [width, setWidth] = useState(window.innerWidth);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ← / → cycle the current page's first dimension (the shell is last in the list).
  const pageDim = dimensions.find((d) => d.key !== "shell") ?? dimensions[0];
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      if (!pageDim) return;
      if (event.key === "ArrowLeft") cycle(pageDim, values[pageDim.key], -1);
      if (event.key === "ArrowRight") cycle(pageDim, values[pageDim.key], 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageDim, values]);

  if (!import.meta.env.DEV) return null;

  const ordered = [...dimensions].sort((a, b) =>
    a.key === "shell" ? 1 : b.key === "shell" ? -1 : 0,
  );

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 1000,
        background: "#111",
        color: "#fff",
        borderRadius: 10,
        boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
        font: "12px/1.4 system-ui, sans-serif",
        padding: collapsed ? "6px 10px" : "8px 10px",
        minWidth: collapsed ? 0 : 240,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, opacity: 0.7 }}>
        <span>
          PROTOTYPE · {width}px · {width >= 992 ? "wide" : width >= 768 ? "tablet" : "phone"}
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ all: "unset", cursor: "pointer", padding: "0 4px" }}
          aria-label={collapsed ? "Expand prototype bar" : "Collapse prototype bar"}
        >
          {collapsed ? "▴" : "▾"}
        </button>
      </div>
      {!collapsed && (
        <>
          {ordered.map((dim) => {
            const current = dim.options.find((o) => o.value === values[dim.key]) ?? dim.options[0]!;
            return (
              <div
                key={dim.key}
                style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}
              >
                <span style={{ opacity: 0.6, width: 70, flex: "none" }}>{dim.label}</span>
                <Arrow onClick={() => cycle(dim, values[dim.key], -1)}>‹</Arrow>
                <span style={{ flex: 1, textAlign: "center", fontWeight: 600 }}>
                  {current.label}
                </span>
                <Arrow onClick={() => cycle(dim, values[dim.key], 1)}>›</Arrow>
              </div>
            );
          })}
          {Object.entries(stats).map(([key, text]) => (
            <div key={key} style={{ marginTop: 6, opacity: 0.7 }}>
              {text}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function Arrow({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        cursor: "pointer",
        width: 22,
        height: 22,
        textAlign: "center",
        borderRadius: 6,
        background: "#333",
      }}
    >
      {children}
    </button>
  );
}
