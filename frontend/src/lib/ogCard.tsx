/**
 * Shared renderer for the generated 1200×630 Open Graph cards.
 *
 * Every page gets a real preview image, which matters more than it looks:
 * social/AI surfaces that can't find an `og:image` fall back to an ugly
 * default or nothing at all, and `BlogPosting.image` is a required property
 * for article rich results.
 *
 * Deliberately uses only system-safe font stacks and flat colour — Satori (the
 * renderer behind `next/og`) would otherwise need to fetch a webfont at build
 * time, which makes builds depend on a third-party host. This keeps OG
 * generation hermetic and fast, consistent with the font strategy in
 * `app/layout.tsx`.
 */
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BG = "#0e1014";
const FG = "#f4f2ef";
const MUTED = "#9aa3b2";
const ACCENT = "#7aa2f7";

export function renderOgCard(options: {
  title: string;
  eyebrow?: string;
  meta?: string;
  siteName: string;
}) {
  const { title, eyebrow, meta, siteName } = options;
  // Long titles need to step down a size or they overflow the card.
  const fontSize = title.length > 85 ? 52 : title.length > 55 ? 62 : 74;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: BG,
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Accent rule along the top edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: ACCENT,
            display: "flex",
          }}
        />

        {eyebrow ? (
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: ACCENT,
              fontWeight: 600,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            fontSize,
            lineHeight: 1.12,
            fontWeight: 700,
            color: FG,
            letterSpacing: -1.5,
            paddingTop: 16,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #2a2f3a",
            paddingTop: 28,
            fontSize: 27,
            color: MUTED,
          }}
        >
          <div style={{ display: "flex", color: FG, fontWeight: 600 }}>{siteName}</div>
          {meta ? <div style={{ display: "flex" }}>{meta}</div> : null}
        </div>
      </div>
    ),
    OG_SIZE
  );
}
