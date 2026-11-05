# 3D map army clip (1812 march on Russia)

5-second vertical (1080x1920, 30 fps) clip in a GeoGlobeTales-style map look: extruded Natural Earth countries,
kingdom colours, forests and mountains, an invasion arrow, low-poly soldiers marching over the map, and captions.

Kingdom borders use modern countries as stand-ins, so they are approximate.

```bash
npm install                # three, world-atlas, d3-geo, fonts (needs Playwright + Chromium available)
npm run prep               # projects the countries into map.json
npm run test-frames        # renders 3 preview frames into frames/
npm run render             # renders 150 frames into frames/
ffmpeg -framerate 30 -i frames/f_%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p clip.mp4
```

Edit `scene.html` to change the story: `groups` in `prep.mjs` sets which countries form each kingdom,
`route` sets the army path, and `renderAt(t)` holds the camera, army and caption timeline.
The finished clip is in `outputs/napoleon_1812_map_clip.mp4`.
