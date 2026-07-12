# Atlas County Data Inventory

Packet: `ATLAS PACKET USA-DATA`

Scope: catalog the public county data Atlas can honestly stage for national
coverage. This packet only stages fields already committed in
`data/census/2024_Gaz_counties_national.txt`; no network fetches were run.

Status counts:

| Status | Count |
| --- | ---: |
| STAGED | 2 |
| RECOMMENDED | 6 |
| REJECTED | 1 |

## Consumption Rules

- The county spine consumes offline, source-labeled facts keyed by GEOID.
- Renderer-facing scene data must stay compiled Atlas data, not raw provider or
  shapefile payloads.
- County facts may improve parameter selection, coverage copy, source notes,
  and future QA gates. They must not create public-playable claims by
  themselves.
- Water, elevation, land-cover, climate, places, and seats are identity signals.
  They are not permission to invent roads, buildings, businesses, or local
  geometry.

## Inventory

| Status | Dataset | Exact source file/API | Fields Atlas would stage | Size | License / public status | North Star moved | Spine consumption | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STAGED | Census 2024 county gazetteer | In repo: `data/census/2024_Gaz_counties_national.txt`. Upstream source URL already recorded in `US_COUNTY_INDEX_SOURCE_URL`: `https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip`. | `USPS`, `GEOID`, `ANSICODE`, `NAME`, `ALAND`, `AWATER`, `ALAND_SQMI`, `AWATER_SQMI`, `INTPTLAT`, `INTPTLONG`. This packet stages land area, water area, and water fraction; the county index already stages centroid and identity. | 647,830 bytes in repo; 3,222 data rows plus header. | US Census Bureau public data; public domain as US government work. | NS-4 honest source basis; NS-6 national county differentiation. | Build-time source for `US_COUNTY_INDEX` and `US_COUNTY_FACTS`; hot path reads compact tuples by GEOID. | Done for area/water; future effort S for bounds or centroid QA. |
| STAGED | Census 2024 county population estimates, PEP | In repo: `data/census/co-est2024-alldata.csv`. Upstream Census PEP county totals CSV: `https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/counties/totals/co-est2024-alldata.csv`. | `STATE`, `COUNTY`, `STNAME`, `CTYNAME`, `POPESTIMATE2024` plus historical estimate fields not currently consumed. Puerto Rico municipios are not present in the staged file and keep the explicit fallback table. | 1,769,182 bytes in repo; 3,195 data rows plus header; 3,144 direct county rows consumed. | US Census Bureau public data; public domain as US government work. | NS-6 county parameter quality; makes density routing less bucket-noise. | Build-time `population2024` keyed by GEOID; paired with land area to derive density tier. | Done for 2024 population; future effort M to replace PR fallback with a PR-inclusive staged source. |
| RECOMMENDED | TIGER/Line county boundaries, hydrography, and coastline flags | Census TIGER/Line 2024 patterns: `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip`, `https://www2.census.gov/geo/tiger/TIGER2024/AREAWATER/tl_2024_<STATEFP>_areawater.zip`, `https://www2.census.gov/geo/tiger/TIGER2024/LINEARWATER/tl_2024_<STATEFP>_linearwater.zip`, `https://www2.census.gov/geo/tiger/TIGER2024/COASTLINE/tl_2024_us_coastline.zip`. | County polygon bounds, coastline intersects, water feature count/area by MTFCC, major river/lake flags, island/coastal flags. | Not staged; national county/coastline files are medium, per-state water collections are large and should be staged as derived county summaries only. | US Census Bureau public data; public domain as US government work. | NS-4 and NS-6: honest water/coast identity without provider geometry. | Offline spatial join to per-GEOID booleans and ratios: `isCoastal`, `majorWaterShare`, `isIslandLike`, `riverPresence`. Raw shapes never enter `_meta` or renderer state. | L: requires geospatial tooling, state loop, and verifier fixtures. |
| RECOMMENDED | USGS 3DEP elevation | USGS The National Map / 3DEP bulk products under `s3://prd-tnm/StagedProducts/Elevation/1/TIFF/current/`; TNM products API pattern: `https://tnmaccess.nationalmap.gov/api/v1/products?datasets=National%20Elevation%20Dataset%20(NED)%201%20arc-second&bbox=<minx,miny,maxx,maxy>`. | Mean elevation, min/max elevation, relief, slope proxy, mountain/valley flag. | Not staged; national raster staging is GB/TB class if raw, but derived county stats are tiny. | USGS public data; public domain as US government work. | NS-6: terrain identity from real public topography, not name or seed alone. | Offline zonal stats by county polygon into compact facts: `meanElevationFt`, `reliefFt`, `slopeBand`. Generator may consume only the derived scalar bands in a named future packet. | XL for full national zonal stats; M if first pass samples centroids and bounded grids. |
| RECOMMENDED | NLCD land cover proportions | MRLC National Land Cover Database product downloads / services, starting with NLCD 2021 Land Cover CONUS layer `NLCD_2021_Land_Cover_L48`; Alaska, Hawaii, and Puerto Rico coverage must be confirmed and staged separately before national claims. | Percent developed, forest, shrub/scrub, grassland, cropland, wetland, open water, barren. | Not staged; raster products are GB class; derived per-county proportions are tiny. | Public US government interagency data; public use with source attribution recommended. | NS-6: vegetation, ground tone, and rural/urban texture from real land-cover proportions. | Offline raster zonal stats into `landCoverProportions` keyed by GEOID. Renderer consumes only compiled material grammar, never raster cells. | XL for national coverage; L for CONUS-only proof; coverage gap risk for territories. |
| RECOMMENDED | Census place names within county | Census Gazetteer places: `https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip`; TIGER place polygons for county join: `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/tl_2024_<STATEFP>_place.zip`. | Place GEOID, name, LSAD, class, centroid, land/water area, county overlap share, primary county flag. | Not staged; place gazetteer is small, TIGER place polygon collection is medium. | US Census Bureau public data; public domain as US government work. | V1 engine promise: users can recognize real local identity in supported counties. | Offline county-place join to source-labeled place summaries. Use for Q&A, selector copy, and future curated-pack candidates; do not auto-place labels or geometry in generated scenes. | L: multi-county places and overlap rules need careful QA. |
| RECOMMENDED | County seat names | Wikidata Query Service `https://query.wikidata.org/sparql`, using county items with FIPS property `P882` and seat/capital property `P36`, then reconciling to Census GEOID. | County GEOID, county item id, seat item id, seat name, coordinates if present, source/reference status. | Not staged; target output is about 3,222 rows and small. | Wikidata is CC0 public data, but not an official Census source; coverage and references must be audited. | V1 comprehension: county overview copy and local orientation. | Stage as source-labeled text only: `countySeatName` and confidence. Do not use as geometry unless backed by a separate place polygon/source. | M: reconciliation and missing/ambiguous county seats need manual/audited exceptions. |
| RECOMMENDED | NOAA 1991-2020 climate normals | NOAA NCEI normals bulk access directories, including `https://www.ncei.noaa.gov/data/normals-annualseasonal/1991-2020/access/` and `https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/`. | Station id, station lat/lon, temperature normals, precipitation, snowfall, heating/cooling degree days; county aggregate fields after station assignment. | Not staged; station CSVs are MB to low-hundreds-MB depending selected normal tables; derived county climate bands are tiny. | NOAA public data; generally public domain as US government work, attribution recommended. | NS-6: climate-driven roof, vegetation, snow, aridity, and color discipline. | Assign stations to counties or nearest-county grid, then stage climate bands and confidence. Never use live weather or storm claims. | L: station density, county assignment, and normals completeness need QA. |
| REJECTED | FCC Broadband Data Collection location-level availability | FCC National Broadband Map / BDC data download portal: `https://broadbandmap.fcc.gov/data-download/nationwide-data?version=<vintage>`, especially fixed broadband availability location/provider files. | Provider brand, technology, max advertised speed, location id, fabric/location availability. | Not staged; very large state/national downloads. | Public FCC dataset with portal terms and caveats; provider-reported fields require careful interpretation. | Rejected for the current map/scene spine. It does not improve honest voxel county identity enough to justify the claim risk. | Do not feed generation, county readiness, or visual identity. A future Scout-only packet could use county-level aggregate broadband summaries if a concrete user workflow needs connectivity context and caveats are visible. | Rejected now; future effort L if reopened for Scout/business analysis only. |

## Staging Priority

1. Keep the current STAGED Census facts as the baseline county fact record.
2. Stage TIGER/Line coastline and water summaries next if the goal is more
   honest water/coastal parameter behavior.
3. Stage elevation and NLCD only after the county fact verifier can compare all
   3,222 GEOIDs and prove territory coverage gaps explicitly.
4. Stage place and county-seat names only as source-labeled text. They should
   help users orient, not camouflage weak generated art.
5. Keep FCC broadband out of the scene spine unless a later product slice names
   a business-facing use that can explain the data caveats.
