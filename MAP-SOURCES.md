# International presence visualization

The interactive globe uses `globe.js`, `globe-countries.json` and a locally bundled D3 Geo module (`vendor/geo.js`; licenses in `vendor/LICENSES.txt`). It renders country polygons with an orthographic projection on canvas, rotates at 3 degrees per second, supports pointer dragging and arrow keys, and respects reduced-motion preferences. Rendering pauses while the globe is offscreen or the document is hidden.

The static SVG remains as a fallback if JavaScript, canvas or the country data is unavailable. Both visualizations highlight countries without displaying individual client records.

`global-presence.svg` uses Natural Earth's public-domain 1:110m country geometry:
https://www.naturalearthdata.com/about/terms-of-use/
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson

Presence was derived from 118 points exported from the existing SimpleDEV Google My Maps map on 2026-09-16. The export was compared with country boundaries; coastal points outside the simplified polygons were assigned to the nearest country only within 0.35 degrees. This identified Argentina, Australia, Brazil, Colombia, Denmark, France, Germany, Ireland, Malaysia, Portugal, Spain, the United Kingdom and the United States.

The SVG uses a rectangular equirectangular projection and highlights the identified countries. It includes no client points, names, address data, links or interactive controls. The original export is not part of the website repository.

Paraguay was additionally confirmed by the user and added to both visualizations and the bilingual country list.
