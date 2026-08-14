// Universal version bump + preconnect injection for TRIYA static deploy.
// Usage: node bump-versions.js [token]
// - Replaces ?v=N on EVERY relative .js/.css reference in all .html files
// - Adds ?v=token to relative .js/.css refs that have no query string
// - Injects preconnect links into every page head (if missing)
// Writes UTF-8 WITHOUT BOM (Node default). Never touches https:// URLs.

const fs = require("fs");
const path = require("path");

const dir = __dirname;
const token = process.argv[2] || String(Date.now());
const htmls = fs.readdirSync(dir).filter(f => f.endsWith(".html"));

const PRECONNECT = `    <link rel="preconnect" href="https://cdn.jsdelivr.net">\n    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>\n    <link rel="preconnect" href="https://vtazrwksizpeyezwctko.supabase.co">\n`;

let changed = 0;

for (const f of htmls) {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, "utf8");
  let before = c;

  c = c.replace(/(\.(?:js|css))\?v=\d+/g, "$1?v=" + token);
  c = c.replace(/(src|href)="(?!https?:)([^"?]+\.(?:js|css))"/g, '$1="$2?v=' + token + '"');

  if (c.indexOf('href="https://cdn.jsdelivr.net"') < 0 && c.indexOf("</head>") >= 0) {
    c = c.replace("</head>", PRECONNECT + "</head>");
  }

  if (c !== before) {
    fs.writeFileSync(p, c, "utf8");
    changed++;
  }
}

console.log("Token:", token);
console.log("Files changed:", changed, "/", htmls.length);
