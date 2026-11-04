/* eslint-disable react-hooks/immutability -- PROTOTYPE, throwaway */
// PROTOTYPE (US-3.1), throwaway. Variant A, "Book": the spec's starting direction. Centred,
// letter-spaced uppercase italic Cormorant titles; EB Garamond text; Jost labels; 2-column grid.
import { useState } from "react";
import type { StoredRecipe } from "../../data/recipes.ts";
import {
  CORMORANT,
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

const look = { title: CORMORANT, italic: true, upper: true };

const titleStyle = {
  fontFamily: CORMORANT,
  fontStyle: "italic",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontWeight: 500,
  textAlign: "center",
  color: INK,
} as const;

export function BookGrid({ recipes }: { recipes: StoredRecipe[] }) {
  const nav = useProtoNav();
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const shown = filterRecipes(recipes, q, tags);

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "48px 16px 110px", color: INK }}>
      <h1 style={{ ...titleStyle, fontSize: 30, margin: 0 }}>Cookbook</h1>
      <div style={{ ...label, textAlign: "center", marginTop: 6 }}>{shown.length} recipes</div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search"
        style={{
          display: "block",
          width: "100%",
          margin: "28px 0 14px",
          border: "none",
          borderBottom: `1px solid ${RULE}`,
          padding: "8px 2px",
          fontFamily: GARAMOND,
          fontSize: 18,
          fontStyle: "italic",
          outline: "none",
          background: "transparent",
        }}
      />
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
        {tagCounts(recipes)
          .slice(0, 12)
          .map((t) => {
            const on = tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                style={{
                  ...label,
                  flex: "none",
                  color: on ? "#fff" : INK,
                  background: on ? GREEN : "transparent",
                  border: `1px solid ${on ? GREEN : RULE}`,
                  borderRadius: 999,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            );
          })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "28px 14px",
          marginTop: 24,
        }}
      >
        {shown.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => nav(`/${r.id}`)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            {r.thumbnail ? (
              <img
                src={r.thumbnail}
                alt=""
                style={{
                  width: "100%",
                  aspectRatio: "4 / 5",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <PhotoPlaceholder title={r.title} style={{ width: "100%", aspectRatio: "4 / 5" }} />
            )}
            <div style={{ ...titleStyle, fontSize: 13, lineHeight: 1.35, marginTop: 10 }}>
              {r.title}
            </div>
          </button>
        ))}
      </div>
      <MenuButtonAndOverlay actions={["New recipe", "Show archived"]} look={look} />
    </div>
  );
}

export function BookRecipe({ recipe }: { recipe: StoredRecipe }) {
  const photo = usePhoto(recipe);
  const [ticks, toggle] = useTicks();
  const [scale, setScale] = useState("1×");
  let step = 0;

  const meta = [
    ["Serves", recipe.yield],
    ["Active", recipe.activeTime],
    ["Total", recipe.totalTime],
  ].filter(([, v]) => v);

  return (
    <div style={{ background: "#fff", minHeight: "100vh", paddingBottom: 110, color: INK }}>
      {photo ? (
        <img
          src={photo}
          alt=""
          style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }}
        />
      ) : (
        <PhotoPlaceholder title={recipe.title} style={{ width: "100%", aspectRatio: "4 / 3" }} />
      )}

      <div style={{ padding: "36px 24px 0" }}>
        <h1 style={{ ...titleStyle, fontSize: 28, lineHeight: 1.25, margin: 0 }}>{recipe.title}</h1>
        {recipe.source && (
          <div style={{ ...label, textAlign: "center", marginTop: 10 }}>
            {recipe.sourceUrl ? (
              <a href={recipe.sourceUrl} style={{ color: MUTED }}>
                {recipe.source}
              </a>
            ) : (
              recipe.source
            )}
          </div>
        )}
        {recipe.description && (
          <p
            style={{
              fontFamily: GARAMOND,
              fontStyle: "italic",
              fontSize: 18,
              lineHeight: 1.5,
              textAlign: "center",
              margin: "22px 0 0",
              whiteSpace: "pre-line",
            }}
          >
            {recipe.description}
          </p>
        )}

        {meta.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 28,
              margin: "28px 0 0",
              paddingTop: 12,
              borderTop: `1px solid ${INK}`,
            }}
          >
            {meta.map(([k, v]) => (
              <div key={k} style={{ textAlign: "center" }}>
                <div style={label}>{k}</div>
                <div style={{ fontFamily: GARAMOND, fontSize: 15, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {recipe.tags.length > 0 && (
          <div style={{ ...label, textAlign: "center", marginTop: 18, color: GREEN }}>
            {recipe.tags.join(" · ")}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            margin: "40px 0 12px",
          }}
        >
          <h2 style={{ ...label, color: INK, fontSize: 11, margin: 0 }}>Ingredients</h2>
          <div style={{ display: "flex", gap: 4 }}>
            {["½", "1×", "2×", "3×"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                style={{
                  fontFamily: GARAMOND,
                  fontSize: 14,
                  width: 34,
                  height: 28,
                  border: `1px solid ${s === scale ? GREEN : RULE}`,
                  background: s === scale ? GREEN : "transparent",
                  color: s === scale ? "#fff" : INK,
                  borderRadius: 2,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {recipe.ingredients.map((line, i) =>
            isHeader(line) ? (
              <li key={i} style={{ ...label, margin: "18px 0 6px", color: INK }}>
                {line.header}
              </li>
            ) : (
              <li
                key={i}
                onClick={() => toggle(`i${i}`)}
                style={{
                  fontFamily: GARAMOND,
                  fontSize: 17,
                  lineHeight: 1.45,
                  padding: "5px 0",
                  borderBottom: `1px solid ${RULE}`,
                  cursor: "pointer",
                  opacity: ticks.has(`i${i}`) ? 0.35 : 1,
                  textDecoration: ticks.has(`i${i}`) ? "line-through" : "none",
                }}
              >
                {line.raw}
              </li>
            ),
          )}
        </ul>

        <h2 style={{ ...label, color: INK, fontSize: 11, margin: "40px 0 12px" }}>Method</h2>
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {recipe.instructions.map((line, i) => {
            if (isHeader(line))
              return (
                <li key={i} style={{ ...label, margin: "20px 0 8px", color: INK }}>
                  {line.header}
                </li>
              );
            step += 1;
            return (
              <li
                key={i}
                onClick={() => toggle(`s${i}`)}
                style={{
                  display: "flex",
                  gap: 14,
                  fontFamily: GARAMOND,
                  fontSize: 17,
                  lineHeight: 1.55,
                  margin: "0 0 16px",
                  cursor: "pointer",
                  opacity: ticks.has(`s${i}`) ? 0.35 : 1,
                }}
              >
                <span
                  style={{
                    fontFamily: CORMORANT,
                    fontStyle: "italic",
                    fontSize: 22,
                    lineHeight: 1.1,
                    color: GREEN,
                    minWidth: 18,
                  }}
                >
                  {step}
                </span>
                <span>{line.text}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <MenuButtonAndOverlay actions={["Edit recipe", "Archive"]} look={look} />
    </div>
  );
}
