/* eslint-disable react-refresh/only-export-components -- PROTOTYPE, throwaway */
// PROTOTYPE (US-3.1), throwaway. Shared bits for the three look variants: data hooks, the
// rough bottom button + overlay, and the variant switcher. Deleted in US-3.2.
import "@fontsource-variable/cormorant";
import "@fontsource-variable/cormorant/wght-italic.css";
import "@fontsource-variable/eb-garamond";
import "@fontsource-variable/eb-garamond/wght-italic.css";
import "@fontsource-variable/jost";
import "@fontsource-variable/lora";
import "@fontsource-variable/lora/wght-italic.css";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { loadFullImage } from "../../data/images.ts";
import { loadAllRecipes, type StoredRecipe } from "../../data/recipes.ts";
import type { IngredientLine, InstructionLine, SectionHeader } from "../../parsing/types.ts";

export const INK = "#1d1d1b";
export const MUTED = "#6f6d66";
export const RULE = "#d9d6cf";
export const LINEN = "#eeebe4";
export const GREEN = "#4f5d4a"; // deep linen green, the one accent

export const CORMORANT = "'Cormorant Variable', serif";
export const GARAMOND = "'EB Garamond Variable', serif";
export const LORA = "'Lora Variable', serif";
export const JOST = "'Jost Variable', sans-serif";

export const label: CSSProperties = {
  fontFamily: JOST,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: MUTED,
};

export function isHeader(line: IngredientLine | InstructionLine): line is SectionHeader {
  return "header" in line;
}

let cache: StoredRecipe[] | null = null;

/** All active recipes, loaded once (prototype: no live updates). */
export function useRecipes(): StoredRecipe[] | null {
  const [recipes, setRecipes] = useState(cache);
  useEffect(() => {
    if (cache) return;
    void loadAllRecipes().then((all) => {
      cache = all
        .filter((r) => !r.archived)
        .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
      setRecipes(cache);
    });
  }, []);
  return recipes;
}

/** Thumbnail first, then the full image once it arrives. */
export function usePhoto(recipe: StoredRecipe | undefined): string | null {
  const [full, setFull] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    if (!recipe?.hasImage) return;
    let live = true;
    void loadFullImage(recipe.id).then((url) => {
      if (live && url) setFull({ id: recipe.id, url });
    });
    return () => {
      live = false;
    };
  }, [recipe?.id, recipe?.hasImage]);
  if (!recipe) return null;
  return full?.id === recipe.id ? full.url : recipe.thumbnail;
}

/** Navigation that keeps the chosen variant in the URL. */
export function useProtoNav() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const variant = params.get("v") ?? "A";
  return (path: string) => {
    void navigate(`/prototype${path}?v=${variant}`);
    window.scrollTo(0, 0);
  };
}

/** Tick-off state for a recipe page (in memory only in the prototype). */
export function useTicks(): [Set<string>, (key: string) => void] {
  const [ticks, setTicks] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setTicks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  return [ticks, toggle];
}

export function tagCounts(recipes: StoredRecipe[]): string[] {
  const counts = new Map<string, number>();
  for (const r of recipes) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

export function filterRecipes(recipes: StoredRecipe[], q: string, tags: string[]): StoredRecipe[] {
  const needle = q.trim().toLowerCase();
  return recipes.filter(
    (r) =>
      tags.every((t) => r.tags.includes(t)) &&
      (!needle ||
        r.title.toLowerCase().includes(needle) ||
        r.tags.some((t) => t.includes(needle)) ||
        r.ingredients.some((i) => !isHeader(i) && i.raw.toLowerCase().includes(needle))),
  );
}

export interface OverlayStyle {
  title: string; // font for the overlay's big entries
  italic: boolean;
  upper: boolean;
}

/**
 * The one bottom button and its full-screen overlay. Opening pushes `menu=1` into the URL, so
 * phone Back closes it.
 */
export function MenuButtonAndOverlay({ actions, look }: { actions: string[]; look: OverlayStyle }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const open = params.get("menu") === "1";
  const variant = params.get("v") ?? "A";

  const openMenu = () => {
    const next = new URLSearchParams(params);
    next.set("menu", "1");
    setParams(next);
  };
  const close = () => void navigate(-1);

  const entry = (text: string, onClick: () => void, big: boolean) => (
    <button
      key={text}
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        background: "none",
        border: "none",
        padding: big ? "14px 0" : "10px 0",
        textAlign: "center",
        cursor: "pointer",
        color: INK,
        fontFamily: big ? look.title : JOST,
        fontStyle: big && look.italic ? "italic" : "normal",
        textTransform: big && look.upper ? "uppercase" : big ? "none" : "uppercase",
        letterSpacing: big ? (look.upper ? "0.14em" : "0.02em") : "0.18em",
        fontSize: big ? 30 : 12,
      }}
    >
      {text}
    </button>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        onClick={openMenu}
        style={{
          position: "fixed",
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: `1px solid ${RULE}`,
          background: "rgba(255,255,255,0.94)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          cursor: "pointer",
          zIndex: 50,
          display: "grid",
          placeItems: "center",
        }}
      >
        <span style={{ display: "grid", gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ display: "block", width: 18, height: 1.5, background: INK }} />
          ))}
        </span>
      </button>
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#fff",
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "40px 32px",
          }}
        >
          <div style={{ ...label, textAlign: "center", marginBottom: 6 }}>This page</div>
          {actions.map((a) => entry(a, close, false))}
          <div style={{ height: 1, background: RULE, margin: "28px 40px" }} />
          {entry(
            "Cookbook",
            () => void navigate(`/prototype?v=${variant}`, { replace: true }),
            true,
          )}
          {entry("Data", close, true)}
          {entry("Account", close, true)}
          <button
            type="button"
            onClick={close}
            style={{
              ...label,
              marginTop: 36,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}

const VARIANT_NAMES: Record<string, string> = {
  A: "Book",
  B: "Magazine",
  C: "Index",
};

/**
 * Prototype-only variant switcher. Sits at the TOP (not the bottom, as usual) so it can't be
 * confused with the app's own bottom menu button.
 */
export function PrototypeSwitcher() {
  const [params, setParams] = useSearchParams();
  const keys = Object.keys(VARIANT_NAMES);
  const current = params.get("v") ?? "A";
  const go = (delta: number) => {
    const i = (keys.indexOf(current) + delta + keys.length) % keys.length;
    const next = new URLSearchParams(params);
    next.set("v", keys[i] ?? "A");
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (el instanceof HTMLElement && el.isContentEditable) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const arrow = (text: string, delta: number) => (
    <button
      type="button"
      onClick={() => go(delta)}
      style={{
        background: "none",
        border: "none",
        color: "#fff",
        fontSize: 16,
        padding: "4px 10px",
        cursor: "pointer",
      }}
    >
      {text}
    </button>
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        background: "#e8590c",
        color: "#fff",
        borderRadius: 999,
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {arrow("‹", -1)}
      <span>
        {current} ({VARIANT_NAMES[current]})
      </span>
      {arrow("›", 1)}
    </div>
  );
}

export function PhotoPlaceholder({ title, style }: { title: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: LINEN,
        display: "grid",
        placeItems: "center",
        color: MUTED,
        fontFamily: CORMORANT,
        fontStyle: "italic",
        fontSize: 34,
        ...style,
      }}
    >
      {title.charAt(0)}
    </div>
  );
}

export function Loading({ children }: { children?: ReactNode }) {
  return (
    <div style={{ ...label, padding: 60, textAlign: "center" }}>
      {children ?? "Loading recipes…"}
    </div>
  );
}
