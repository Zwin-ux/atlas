const previewUrl = new URL(process.env.ATLAS_PREVIEW_URL ?? "http://127.0.0.1:8787/preview");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const response = await fetch(previewUrl);
const html = await response.text();

assert(response.ok, `/preview returned HTTP ${response.status}.`);
assert(html.includes("city-world") || html.includes("Atlas"), "/preview did not include Atlas city-world markup.");
assert(!/Scout Drop report|dashboard shell/i.test(html), "/preview contains old report/dashboard shell copy.");
if (/Campaign Preview/i.test(html)) {
  assert(
    html.includes("city-world-preview") && html.includes("Session preview. Nothing is saved, sent, or scheduled."),
    "/preview contains campaign preview copy without the accepted session-only in-widget panel contract.",
  );
}
assert(html.length > 10_000, "/preview response is unexpectedly small.");

console.log(
  JSON.stringify(
    {
      ok: true,
      previewUrl: previewUrl.toString(),
      bytes: html.length,
      hasCityWorldMarkup: html.includes("city-world"),
    },
    null,
    2,
  ),
);
