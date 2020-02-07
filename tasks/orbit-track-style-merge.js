var fs = require('fs');

var json = require('../config/default/release/gc/vectorstyles/OrbitTracks.json');
var layers = json.layers;
var layout = {
  'text-field': ['get', 'label'],
  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
  'text-size': [
    'step',
    ['zoom'], 7,
    18, 10
  ],
  'text-transform': 'uppercase',
  'text-letter-spacing': 0.05,
  'text-radial-offset': ['case', ['!=', ['get', 'day_offset'], 0], 6, 4],
  'text-variable-anchor': ['left', 'right']
};
var paint = {
  'text-color': '#fff',
  'text-halo-color': '#999',
  'text-halo-width': 1,
  'text-opacity': [
    'step',
    ['zoom'], ['case', ['!=', ['%', ['get', 'minute'], 5], 0], 0, 1],
    20, 1
  ]
};
for (var i = 0, length = layers.length; i < length; i++) {
  const layer = layers[i];
  if (layer.type === 'symbol') {
    layer.layout = layout;
    layer.paint = paint;
  }
}
var jsonDone = JSON.stringify(json);

console.log(json.layers[2].paint);
fs.writeFile('orbit-styles.json', jsonDone, 'utf8', () => {
  console.log('written');
});
