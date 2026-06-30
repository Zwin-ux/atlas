# Useful Open-Source Repos and Libraries

## Core renderer choices

### PixiJS
Use for the main Atlas Alpha renderer if possible.
- 2D WebGL/WebGPU rendering
- sprites
- glow effects
- smooth panning/zooming
- Clawd movement

### Phaser
Use only if Atlas becomes more game-like than data-widget-like.
- great for game scenes
- heavier than needed for Alpha
- could be useful for mini-game polish later

### Obelisk.js
Use as inspiration or tooling for pixel-isometric tile generation.
- old but relevant for 1:2 pixel-isometric patterns
- useful for generating primitive placeholder voxel blocks

### Isomer
Use as a reference or tiny asset pre-rendering helper.
- simple isometric graphics library for HTML5 canvas
- old, not recommended as the main runtime

## Geo/data visualization

### @vis.gl/react-google-maps
Use for React integration with Google Maps JavaScript API in Beta.

### deck.gl
Use for serious data overlays later, especially if Atlas needs heatmaps or large geospatial layers.

### Three.js
Use only for future Google WebGLOverlayView experiments, not Alpha.

## Rule

Alpha uses mocked/curated data and our own voxel scene. Google data becomes an input to Atlas, not the UI itself.
