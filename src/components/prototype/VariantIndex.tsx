/* eslint-disable react-hooks/immutability -- PROTOTYPE, throwaway */
// PROTOTYPE (US-3.1), throwaway. Variant C, "Index": no photo grid. The cookbook is a book's
// contents page (A–Z with letter dividers, small thumbnails); the recipe page is left-aligned
// EB Garamond throughout, inset photo, amounts in their own column.
import { useState } from "react";
import type { StoredRecipe } from "../../data/recipes.ts";
import {
  filterRecipes,
  GARAMOND,
  GREEN,
  INK,
  isHeader,
  label,
  MenuButtonAndOverlay,
  MUTED,
  PhotoPlaceholder,
  RULE,
  tagCounts,
  usePhoto,
  useProtoNav,
  useTicks,
} from "./protoShared.tsx";

const look = { title: GARAMOND, italic: true, upper: false };

// Rough split of "2 dl milk" into amount + rest, just for the look.
const AMOUNT =
  /^((?:\d+[\d.,/]*|[½¼¾⅓⅔])(?:\s*[-–]\s*\d+[\d.,/]*)?(?:\s*[½¼¾⅓⅔])?(?:\s*(?:g|kg|ml|dl|cl|l|tsp|tbsp|tl|rkl|cups?|oz|lbs?)\b\.?)?)\s+(.*)$/i;

export function IndexGrid({ recipes }: { recipes: StoredRecipe[] }) {
  const nav = useProtoNav();
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const shown = filterRecipes(recipes, q, tags);
  let lastLetter = "";

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "54px 22px 110px", color: INK }}>
      <h1
        style={{
          fontFamily: GARAMOND,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 40,
          margin: 0,
        }}
      >
        Contents
      </h1>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginTop: 18 }}>
        <span style={label}>Find</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            borderBottom: `1px solid ${INK}`,
            padding: "4px 0",
            fontFamily: GARAMOND,
            fontSize: 18,
            outline: "none",
          }}
        />
      </div>
      <div style={{ marginTop: 12, lineHeight: 1.9 }}>
        {tagCounts(recipes)
          .slice(0, 14)
          .map((t, i) => {
            const on = tags.includes(t);
            return (
              <span key={t}>
                {i > 0 && <span style={{ color: RULE }}> / </span>}
                <button
                  type="button"
                  onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                  style={{
                    ...label,
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: on ? GREEN : MUTED,
                    fontWeight: on ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              </span>
            );
          })}
      </div>

      <div style={{ marginTop: 22 }}>
        {shown.map((r) => {
          const letter = r.title.charAt(0).toUpperCase();
          const divider = letter !== lastLetter;
          lastLetter = letter;
          return (
            <div key={r.id}>
              {divider && (
                <div
                  style={{
                    fontFamily: GARAMOND,
                    fontStyle: "italic",
                    fontSize: 28,
                    color: GREEN,
                    margin: "22px 0 4px",
                  }}
                >
                  {letter}
                </div>
              )}
              <button
                type="button"
                onClick={() => nav(`/${r.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  background: "none",
                  border: "none",
                  borderBottom: `1px solid ${RULE}`,
                  padding: "10px 0",
                  textAlign: "left",
                  cursor: "pointer",
                  color: INK,
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontFamily: GARAMOND,
                      fontSize: 19,
                      lineHeight: 1.25,
                    }}
                  >
                    {r.title}
                  </span>
                  <span style={{ ...label, display: "block", marginTop: 3 }}>
                    {[r.totalTime, r.tags.slice(0, 2).join(", ")].filter(Boolean).join(" — ")}
                  </span>
                </span>
                {r.thumbnail ? (
                  <img
                    src={r.thumbnail}
                    alt=""
                    style={{ width: 56, height: 56, objectFit: "cover", flex: "none" }}
                  />
                ) : (
                  <PhotoPlaceholder
                    title={r.title}
                    style={{ width: 56, height: 56, flex: "none", fontSize: 22 }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
      <MenuButtonAndOverlay actions={["New recipe", "Show archived"]} look={look} />
    </div>
  );
}

export function IndexRecipe({ recipe }: { recipe: StoredRecipe }) {
  const photo = usePhoto(recipe);
  const [ticks, toggle] = useTicks();
  const [scale, setScale] = useState("1×");
  let step = 0;

  const meta = [
    ["Yield", recipe.yield],
    ["Active time", recipe.activeTime],
    ["Total time", recipe.totalTime],
    ["Source", recipe.source],
    ["Tags", recipe.tags.join(", ")],
  ].filter(([, v]) => v);

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "22px 22px 110px", color: INK }}>
      {photo ? (
        <img
          src={photo}
          alt=""
          style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }}
        />
      ) : (
        <PhotoPlaceholder title={recipe.title} style={{ width: "100%", aspectRatio: "2 / 1" }} />
      )}

      <h1
        style={{
          fontFamily: GARAMOND,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 36,
          lineHeight: 1.1,
          margin: "26px 0 0",
        }}
      >
        {recipe.title}
      </h1>
      {recipe.description && (
        <p
          style={{
            fontFamily: GARAMOND,
            fontSize: 18,
            lineHeight: 1.5,
            color: "#3c3b37",
            whiteSpace: "pre-line",
          }}
        >
          {recipe.description}
        </p>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
        <tbody>
          {meta.map(([k, v]) => (
            <tr key={k} style={{ borderTop: `1px solid ${RULE}` }}>
              <td style={{ ...label, padding: "8px 0", width: "38%", verticalAlign: "top" }}>
                {k}
              </td>
              <td style={{ fontFamily: GARAMOND, fontSize: 16, padding: "6px 0" }}>
                {k === "Source" && recipe.sourceUrl ? (
                  <a href={recipe.sourceUrl} style={{ color: GREEN }}>
                    {v}
                  </a>
                ) : (
                  v
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          margin: "36px 0 6px",
        }}
      >
        <h2
          style={{
            fontFamily: GARAMOND,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 26,
            margin: 0,
          }}
        >
          Ingredients
        </h2>
        <span style={{ display: "flex", gap: 10 }}>
          {["½", "1×", "2×", "3×"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScale(s)}
              style={{
                fontFamily: GARAMOND,
                fontSize: 16,
                background: "none",
                border: "none",
                padding: 0,
                color: s === scale ? GREEN : MUTED,
                textDecoration: s === scale ? "underline" : "none",
                textUnderlineOffset: 4,
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {recipe.ingredients.map((line, i) => {
            if (isHeader(line))
              return (
                <tr key={i}>
                  <td colSpan={2} style={{ ...label, color: INK, padding: "16px 0 4px" }}>
                    {line.header}
                  </td>
                </tr>
              );
            const m = AMOUNT.exec(line.raw);
            const done = ticks.has(`i${i}`);
            return (
              <tr
                key={i}
                onClick={() => toggle(`i${i}`)}
                style={{
                  cursor: "pointer",
                  opacity: done ? 0.35 : 1,
                  borderTop: `1px solid ${RULE}`,
                }}
              >
                <td
                  style={{
                    fontFamily: GARAMOND,
                    fontSize: 16,
                    color: GREEN,
                    padding: "6px 12px 6px 0",
                    width: "28%",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m ? m[1] : ""}
                </td>
                <td
                  style={{ fontFamily: GARAMOND, fontSize: 17, padding: "6px 0", lineHeight: 1.35 }}
                >
                  {m ? m[2] : line.raw}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2
        style={{
          fontFamily: GARAMOND,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 26,
          margin: "36px 0 6px",
        }}
      >
        Method
      </h2>
      {recipe.instructions.map((line, i) => {
        if (isHeader(line))
          return (
            <div key={i} style={{ ...label, color: INK, margin: "18px 0 4px" }}>
              {line.header}
            </div>
          );
        step += 1;
        return (
          <p
            key={i}
            onClick={() => toggle(`s${i}`)}
            style={{
              fontFamily: GARAMOND,
              fontSize: 17,
              lineHeight: 1.55,
              margin: "0 0 12px",
              cursor: "pointer",
              opacity: ticks.has(`s${i}`) ? 0.35 : 1,
            }}
          >
            <span style={{ ...label, color: GREEN, fontSize: 11, marginRight: 8 }}>
              Step {step}
            </span>
            {line.text}
          </p>
        );
      })}
      <MenuButtonAndOverlay actions={["Edit recipe", "Archive"]} look={look} />
    </div>
  );
}
