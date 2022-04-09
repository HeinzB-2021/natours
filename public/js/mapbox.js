export const displayMap = (loc) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiaGVpbnpiIiwiYSI6ImNsMWdjaDZuMTAxdGgzb2xuMWtvNWR3ZzEifQ.H8jjf_06mZCTw0nY9efJMw';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/heinzb/cl1gl7isg001315nt0w9fg6gl',
    scrollZoom: false,
    center: [-118.113491, 34.111745],
    zoom: 10,
    // interactive: false
  });
  const bounds = new mapboxgl.LngLatBounds();

  loc.forEach((locs) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(locs.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(locs.coordinates)
      .setHTML(`<p>Day ${locs.day}: ${locs.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(locs.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
