# SIH26191 — Plan in Plain Language
*Hazard-Based Red Zones, Carrying Capacity Assessment & Relocation Ranking — Ministry of Home Affairs / Disaster Management*

## Does something like this already exist?

Half of it, yes. Half of it, no — and that gap is exactly what you'd be building.

**The "where is it dangerous" half already exists, and it's public:**
- The Geological Survey of India has mapped **4.3 lakh sq. km** of landslide-prone land across the country (2025) and is rolling out early-warning systems.
- ISRO's **Bhuvan** platform (run by NRSC) already hosts a Disaster Management Support Service with hazard layers for floods, landslides, cyclones, earthquakes, forest fires and drought — free to view, and the data layers can be pulled into a mapping tool like QGIS.
- There's active 2025/2026 academic research (published in *Nature Scientific Reports* and other journals) doing national-scale landslide risk mapping.

**The "what do we actually do about it, and who moves first" half does not exist as a public tool.** I checked Bhuvan's own disaster service directly — it's described as purely hazard *visualization and monitoring*. Nothing about ranking which resettlement site can hold how many people, or which villages need to move most urgently. That decision layer is missing, and it's exactly what PS26191 asks for.

## Why this matters right now (not just in theory)

This isn't an abstract problem — real people are stuck on this exact question today:

- **Wayanad, Kerala (landslides, July 2024):** As of mid-2026, survivors are *still waiting for finalized resettlement land* — the Kerala cabinet approved a rehabilitation plan, but the actual site allocation and "who goes where, how many can each site hold" process has dragged on for well over a year.
- **Joshimath, Uttarakhand (land subsidence, since 2023):** The town is still sinking in places. The Centre approved a ₹1,658 crore recovery and reconstruction plan, and the rehabilitation policy is still described as being worked out "into sharp focus" — meaning it's still an open, unresolved problem, years later.
- **Darjeeling (landslides, 2025):** Another recent event feeding into the same national pattern.

In every one of these cases, the slow part wasn't identifying that the land was dangerous — that was known. The slow part was figuring out, in an organized and defensible way, where the affected people could actually go and who needed to move first. That's precisely the tool this PS is asking for. You'd be building something aimed at a real, current, unsolved bottleneck — not a hypothetical one.

## What we're actually going to build, in plain terms

Think of it in three layers, stacked on top of each other:

1. **The danger map** — we don't build this ourselves. We pull it from Bhuvan/GSI, who already did this work. This shows "here's land that's unsafe to live on" (landslide-prone slopes, flood zones, coastal erosion areas).
2. **The "where could people go instead" layer** — for candidate resettlement sites, we score each one on things like: how much usable flat land is there, is it itself safe from hazards, is it close to roads/water/schools, and roughly how many people could it realistically house. This turns "here's an empty patch of land" into "this site could reasonably hold about 400 families."
3. **The "who should move first" layer** — for each at-risk settlement, we combine how dangerous their current location is, how many people live there, and how urgent past warning signs have been (recent landslide activity, cracks in the ground, etc.) into a ranked list — so instead of "everyone is at risk," officials get "these three villages need to move this year, these others have more time."

The end result is a map you can click around on: red zones highlighted, candidate resettlement sites shown with how many people they could hold, and a ranked list of which settlements are most urgent.

## How we're going to build it — a realistic, beginner-friendly path

Since you're starting from zero on GIS work, here's a build order that teaches you the concepts in the order you'll actually need them, instead of throwing everything at once:

**Step 1 — Learn to see the data (no coding yet).** Install **QGIS** (free, open-source map software with a normal point-and-click interface — this is the standard beginner's door into GIS, not a compromise tool, professionals use it too). Load a Bhuvan hazard layer into it and just look at it. This is where you build the basic mental model: what's a "layer," what's the difference between a hazard map and a population map, how do you overlay two maps on top of each other. AI can walk you through every click here — this step is about intuition, not code.

**Step 2 — Get the population and elevation data.** You'll need: Census population data (for how many people live where), and elevation data (DEM — Digital Elevation Model, basically a map of how flat or steep the land is, which tells you whether a candidate resettlement site is buildable). Both are publicly downloadable (Census handles population; SRTM/Bhuvan's open EO archive handles elevation).

**Step 3 — Learn the scoring method (AHP), in the simplest form.** AHP (Analytic Hierarchy Process) sounds intimidating but the idea is simple: you pick a handful of factors that matter (safety, flat land available, distance to roads, distance to water), decide how important each factor is relative to the others, and combine them into a single score per site. You don't need the full academic version — a simplified weighted-scoring spreadsheet is a legitimate, honest starting point, and you can make it more sophisticated later. This is very teachable step by step with AI — it's arithmetic and judgment, not advanced math.

**Step 4 — Move from QGIS to code.** Once you understand what you're trying to compute by doing it manually in QGIS, *then* learn Python's `geopandas` and `rasterio` libraries to automate it. This order matters for beginners — learning to code the thing before you understand what the thing does makes debugging nearly impossible; understanding it visually first makes the code make sense.

**Step 5 — Build the web map.** A simple interactive map using **Leaflet** (a beginner-friendly JavaScript mapping library) that shows the red zones, the candidate resettlement sites with their capacity scores, and the ranked urgency list. This is the part your jury actually sees and clicks on, so it's worth having AI help you make it look clean even if the backend is still simple underneath.

**Step 6 — Write down your assumptions honestly.** Because your data is real but your scoring weights are your own judgment calls, be upfront in the demo about what's real government data versus what's your own reasonable-but-simplified model. That honesty is a strength, not a weakness — it's exactly the pattern that's worked well in your ECDAT planning too.

## The single most important thing to get right

Don't try to recreate the hazard map — that's already done, and redoing it would waste your limited time on the *least* differentiated part of the whole idea. Spend your energy on the part nobody has built yet: turning "this land is dangerous" into "here's where these specific people should go, and here's who needs to move first." That's your actual contribution, and it's the part with a real, current, headline-worthy problem behind it.

---
*Sources checked 2026-08-28: GSI landslide mapping coverage, Bhuvan/NRSC thematic data and disaster support service documentation, and recent reporting on Wayanad, Joshimath and Darjeeling relocation efforts. Re-verify specific data-access details (registration, exact download links) directly on the Bhuvan portal before building against them, since government portal mechanics can change.*
