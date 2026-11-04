/* eslint-disable react-hooks/immutability -- PROTOTYPE, throwaway */
// PROTOTYPE (US-3.1), throwaway. Variant B, "Magazine": one column of large photos, big
// mixed-case Cormorant titles, Lora body, ingredients in a linen panel, steps with big numerals.
import { useState } from "react";
import type { StoredRecipe } from "../../data/recipes.ts";
import {
  CORMORANT,
  filterRecipes,
  GREEN,
  INK,
  isHeader,
  JOST,
  label,
  LINEN,
  LORA,
  MenuButtonAndOverlay,
  MUTED,
  PhotoPlaceholder,
  RULE,
  tagCounts,
  usePhoto,
  useProtoNav,
  useTicks,
} from "./protoShared.tsx";

const look = { title: CORMORANT, italic: false, upper: false };

export function MagazineGrid({ recipes }: { recipes: StoredRecipe[] }) {
  const nav = useProtoNav();
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const shown = filterRecipes(recipes, q, tags);

  return (
    <div style={{ background: "#fff", minHeight: "100vh", paddingBottom: 110, color: INK }}>
      <div style={{ padding: "52px 20px 8px" }}>
        <div style={label}>The shared cookbook</div>
        <h1
          style={{
            fontFamily: CORMORANT,
            fontWeight: 500,
            fontSize: 52,
            lineHeight: 1,
            margin: "6px 0 0",
          }}
        >
          Recipes
        </h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find a recipe or ingredient…"
          style={{
            display: "block",
            width: "100%",
            margin: "22px 0 12px",
            border: "none",
            background: LINEN,
            padding: "12px 14px",
            fontFamily: LORA,
            fontSize: 15,
            outline: "none",
            borderRadius: 0,
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
          {tagCounts(recipes)
            .slice(0, 10)
            .map((t) => {
              const on = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                  style={{
                    fontFamily: LORA,
                    fontStyle: "italic",
                    fontSize: 15,
                    background: "none",
                    border: "none",
                    padding: "2px 0",
                    color: on ? GREEN : MUTED,
                    textDecoration: on ? "underline" : "none",
                    textUnderlineOffset: 4,
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              );
            })}
        </div>
      </div>

      {shown.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => nav(`/${r.id}`)}
          style={{
            display: "block",
            width: "100%",
            background: "none",
            border: "none",
            padding: 0,
            marginTop: 30,
            textAlign: "left",
            cursor: "pointer",
            color: INK,
          }}
        >
          {r.thumbnail ? (
            <img
              src={r.thumbnail}
              alt=""
              style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", display: "block" }}
            />
          ) : (
            <PhotoPlaceholder title={r.title} style={{ width: "100%", aspectRatio: "3 / 2" }} />
          )}
          <div style={{ padding: "12px 20px 0" }}>
            <div style={{ fontFamily: CORMORANT, fontWeight: 500, fontSize: 28, lineHeight: 1.1 }}>
              {r.title}
            </div>
            <div style={{ ...label, marginTop: 6 }}>
              {[r.totalTime, r.yield].filter(Boolean).join("  ·  ") ||
                r.tags.slice(0, 3).join(" · ")}
            </div>
          </div>
        </button>
      ))}
      <MenuButtonAndOverlay actions={["New recipe", "Show archived"]} look={look} />
    </div>
  );
}

export function MagazineRecipe({ recipe }: { recipe: StoredRecipe }) {
  const photo = usePhoto(recipe);
  const [ticks, toggle] = useTicks();
  const [scale, setScale] = useState("1×");
  let step = 0;

  return (
    <div style={{ background: "#fff", minHeight: "100vh", paddingBottom: 110, color: INK }}>
      <div style={{ position: "relative" }}>
        {photo ? (
          <img
            src={photo}
            alt=""
            style={{ width: "100%", height: "72vh", objectFit: "cover", display: "block" }}
          />
        ) : (
          <PhotoPlaceholder title={recipe.title} style={{ width: "100%", height: "50vh" }} />
        )}
        <div
          style={{
            position: "absolute",
            inset: "auto 0 0 0",
            padding: "80px 20px 22px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
            color: "#fff",
          }}
        >
          <div style={{ ...label, color: "rgba(255,255,255,0.85)" }}>{recipe.tags.join(" · ")}</div>
          <h1
            style={{
              fontFamily: CORMORANT,
              fontWeight: 500,
              fontSize: 42,
              lineHeight: 1.02,
              margin: "6px 0 0",
            }}
          >
            {recipe.title}
          </h1>
        </div>
      </div>

      <div style={{ padding: "22px 20px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: `1px solid ${RULE}`,
            borderBottom: `1px solid ${RULE}`,
          }}
        >
          {[
            ["Yield", recipe.yield],
            ["Active", recipe.activeTime],
            ["Total", recipe.totalTime],
          ].map(([k, v], i) => (
            <div
              key={k}
              style={{
                padding: "10px 0",
                borderLeft: i ? `1px solid ${RULE}` : "none",
                textAlign: "center",
              }}
            >
              <div style={label}>{k}</div>
              <div style={{ fontFamily: LORA, fontSize: 14, marginTop: 2 }}>{v || "–"}</div>
            </div>
          ))}
        </div>

        {recipe.description && (
          <p style={{ fontFamily: LORA, fontSize: 17, lineHeight: 1.6, whiteSpace: "pre-line" }}>
            <span
              style={{
                fontFamily: CORMORANT,
                fontSize: 48,
                float: "left",
                lineHeight: 0.85,
                marginRight: 6,
              }}
            >
              {recipe.description.charAt(0)}
            </span>
            {recipe.description.slice(1)}
          </p>
        )}
        {recipe.source && (
          <div style={{ ...label, marginTop: 8 }}>
            From{" "}
            {recipe.sourceUrl ? (
              <a href={recipe.sourceUrl} style={{ color: GREEN }}>
                {recipe.source}
              </a>
            ) : (
              recipe.source
            )}
          </div>
        )}
      </div>

      <div style={{ background: LINEN, margin: "28px 0 0", padding: "22px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: CORMORANT, fontWeight: 500, fontSize: 30, margin: 0 }}>
            You need
          </h2>
          <div style={{ display: "flex", background: "#fff", borderRadius: 999, padding: 3 }}>
            {["½", "1×", "2×", "3×"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                style={{
                  fontFamily: JOST,
                  fontSize: 12,
                  padding: "5px 10px",
                  border: "none",
                  borderRadius: 999,
                  background: s === scale ? GREEN : "transparent",
                  color: s === scale ? "#fff" : INK,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
          {recipe.ingredients.map((line, i) =>
            isHeader(line) ? (
              <li
                key={i}
                style={{
                  fontFamily: LORA,
                  fontStyle: "italic",
                  fontSize: 15,
                  margin: "14px 0 4px",
                  color: GREEN,
                }}
              >
                {line.header}
              </li>
            ) : (
              <li
                key={i}
                onClick={() => toggle(`i${i}`)}
                style={{
                  display: "flex",
                  gap: 10,
                  fontFamily: LORA,
                  fontSize: 15,
                  lineHeight: 1.5,
                  padding: "4px 0",
                  cursor: "pointer",
                  opacity: ticks.has(`i${i}`) ? 0.4 : 1,
                }}
              >
                <span
                  style={{
                    flex: "none",
                    width: 14,
                    height: 14,
                    marginTop: 4,
                    border: `1px solid ${GREEN}`,
                    background: ticks.has(`i${i}`) ? GREEN : "transparent",
                  }}
                />
                {line.raw}
              </li>
            ),
          )}
        </ul>
      </div>

      <div style={{ padding: "26px 20px 0" }}>
        <h2 style={{ fontFamily: CORMORANT, fontWeight: 500, fontSize: 30, margin: "0 0 8px" }}>
          Method
        </h2>
        {recipe.instructions.map((line, i) => {
          if (isHeader(line))
            return (
              <div
                key={i}
                style={{
                  fontFamily: LORA,
                  fontStyle: "italic",
                  fontSize: 15,
                  color: GREEN,
                  margin: "18px 0 4px",
                }}
              >
                {line.header}
              </div>
            );
          step += 1;
          return (
            <div
              key={i}
              onClick={() => toggle(`s${i}`)}
              style={{
                margin: "14px 0 0",
                cursor: "pointer",
                opacity: ticks.has(`s${i}`) ? 0.35 : 1,
              }}
            >
              <div style={{ fontFamily: CORMORANT, fontSize: 40, lineHeight: 1, color: GREEN }}>
                {String(step).padStart(2, "0")}
              </div>
              <div style={{ fontFamily: LORA, fontSize: 16, lineHeight: 1.65, marginTop: 2 }}>
                {line.text}
              </div>
            </div>
          );
        })}
      </div>
      <MenuButtonAndOverlay actions={["Edit recipe", "Archive"]} look={look} />
    </div>
  );
}
