/**
 * Renders JSON-LD blocks.
 *
 * Each schema goes in its own `<script>` tag rather than being merged into one
 * `@graph`: Google parses both, but separate blocks fail independently, so one
 * malformed node can't invalidate the rest of the page's structured data.
 *
 * `undefined` values are dropped by `JSON.stringify`, which is what lets the
 * builders in `lib/seo.ts` use optional spread-free fields. `<` is escaped so a
 * title containing markup can never break out of the script element.
 */
export default function JsonLd({ schemas }: { schemas: Record<string, unknown>[] }) {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
