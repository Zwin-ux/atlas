# Atlas County Data Pack Spec

County data starts curated, not live.

Each county has a JSON file under:

`data/county_packs/<county_slug>.json`

## Schema

```json
{
  "county": "Riverside County",
  "state": "CA",
  "slug": "riverside-ca",
  "version": "0.1",
  "lastUpdated": "2026-06-29",
  "summary": "",
  "cities": [],
  "corridors": [],
  "businessSignals": [],
  "publicPrograms": [],
  "campaignUseCases": [],
  "mapNodes": [],
  "mapEdges": [],
  "sources": [],
  "confidenceNotes": []
}
```

## Map node

```json
{
  "id": "eastvale",
  "name": "Eastvale",
  "type": "city",
  "voxel": { "x": 32, "y": 18, "z": 0 },
  "tags": ["residential", "suburban", "service-business"],
  "scores": {
    "mobile_detailing": 78,
    "cleaning": 72,
    "local_event": 48
  },
  "signals": ["Residential Demand", "Fast Route Access"],
  "risk": "Competition and city business license requirements should be checked.",
  "campaignSuggestion": "Start with QR flyers, local Facebook posts, and property manager outreach."
}
```

## Source rules

Every data pack should include sources and confidence notes.

Atlas can use curated strategic data in Alpha, but the UI must label it as a demo/curated pack until live ingestion exists.
