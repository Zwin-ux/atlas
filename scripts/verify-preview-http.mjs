const previewUrl = new URL(process.env.ATLAS_PREVIEW_URL ?? "http://127.0.0.1:8787/preview");
const routeUrls = [new URL("/", previewUrl), new URL("/explore", previewUrl), previewUrl];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const results = [];

for (const routeUrl of routeUrls) {
  const response = await fetch(routeUrl);
  const html = await response.text();
  const path = routeUrl.pathname;

  assert(response.ok, `${path} returned HTTP ${response.status}.`);
  assert(html.includes("Atlas â€” Shared U.S. Map"), `${path} did not include Atlas title markup.`);
  assert(html.includes('<main id="root"></main>'), `${path} must expose the map as its primary landmark.`);
  assert(html.includes('/widget/component.js'), `${path} must load the eager widget script by reference.`);
  assert(html.includes('/widget/component.css'), `${path} must load widget CSS by reference.`);
  assert(!html.includes("pixi.js"), `${path} should not inline Pixi or renderer code.`);
  assert(!/Scout Drop|Campaign Preview|Hosted Clawd|billing|checkout|dashboard shell/i.test(html), `${path} leaks retired challenge copy.`);
  assert(html.length < 300_000, `${path} response is too large for the split map shell: ${html.length} bytes.`);

  if (path === "/" || path === "/explore") {
    assert(response.headers.get("origin-agent-cluster") === "?1", `${path} must request an origin-keyed agent cluster.`);
    assert(response.headers.get("permissions-policy") === "tools=(self)", `${path} must allow same-origin site tools.`);
  }

  results.push({ path, bytes: html.length });
}

console.log(
  JSON.stringify(
    {
      ok: true,
      origin: previewUrl.origin,
      routes: results,
      externalWidgetAssets: true,
      noLoginTopLevelMap: true,
    },
    null,
    2,
  ),
);
