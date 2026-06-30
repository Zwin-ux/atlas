# Atlas Services and Modules

## Core services

### CountyPackService
Loads and validates curated county packs.

### GeoDataAdapter
Interface for mock/Google location data.

### MockGeoDataAdapter
Deterministic Alpha data.

### GoogleMapsAdapter
Beta implementation behind the same interface.

### SignalExtractor
Converts raw geo/places data into ScoutSignals.

### CountyGraphBuilder
Builds semantic nodes and edges.

### VoxelSemanticMapper
Maps nodes/signals to tiles/markers.

### VoxelSceneCompiler
Builds VoxelScene for widget.

### ScoutDropService
Creates Scout Drop reports.

### CampaignEngineService
Generates local campaign preview/assets.

### ClawdCompanionService
Free session Clawd.

### HostedClawdService
Paid persistent Clawd.

### UsageLimitService
Free/paid usage caps.

### BillingService
External checkout / subscription later.

### ActivityLogService
Events and usage.

## Dependency direction

Adapters call tools.
Tools call services.
Services call repositories/adapters.
Renderer consumes scene only.

Never let widget directly calculate business logic.
