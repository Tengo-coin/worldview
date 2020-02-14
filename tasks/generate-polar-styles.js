var fs = require('fs');
var nodeDir = require('node-dir');
var layout = {
  'text-field': ['get', 'label'],
  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
  'text-size': [
    'step',
    ['zoom'], 7,
    3, 10
  ],
  'text-transform': 'uppercase',
  'text-letter-spacing': 0.05,
  'text-radial-offset': 0.5,
  'text-variable-anchor': ['bottom', 'top']
};
var paint = {
  'text-color': '#fff',
  'text-halo-color': '#999',
  'text-halo-width': 1,
  'text-opacity': [
    'step',
    ['zoom'], ['case', ['!=', ['%', ['get', 'minute'], 5], 0], 0, 1],
    5, 1
  ]
};
nodeDir.readFiles('./config/default/common/vectorstyles/', // the root path
  {
    match: /_polar/, // only match polar tracks
    recursive: false // only the root dir
  },

  function (err, content, filename, next) {
    console.log(filename);
    if (err) {
      console.warn(err);
    } else {
      var json = JSON.parse(content);

      var layers = json.layers;
      let hasSymbol = false;

      for (var i = 0, length = layers.length; i < length; i++) {
        const layer = layers[i];
        if (layer.type === 'symbol') {
          layer.layout = layout;
          layer.paint = paint;
          hasSymbol = true;
          layers.push(layers.splice(layers.indexOf(layer), 1)[0]);
        }
      }
      if (!hasSymbol) {
        var obj = {
          id: layers[0].id,
          source: layers[0].id,
          'source-layer': layers[0].id,
          'source-description': 'Default',
          type: 'symbol'
        };
        obj.layout = layout;
        obj.paint = paint;
        layers.push(obj);
      }
      var jsonDone = JSON.stringify(json, null, 2);
      var shortName = filename.split('.').slice(0, -1).join('.');
      fs.writeFile(shortName + '.json', jsonDone, 'utf8', () => {
        console.log('wrote: ' + shortName + '.json');
      });
    }
    next();
  },
  function() {
    console.log('end');
  }

);
