var fs = require('fs');
var nodeDir = require('node-dir');
// var opacity = [
//   'step',
//   ['zoom'], ['case', ['!=', ['%', ['get', 'minute'], 5], 0], 0, 1],
//   17, 1
// ];
const circleRadius = ['step', ['zoom'], 2.5, 18, 3.5, 20, 5];
const textOpacity = ['step', ['zoom'], ['case', ['!=', ['%', ['get', 'minute'], 10], 0], 0, 1], 19, ['case', ['!=', ['%', ['get', 'minute'], 5], 0], 0, 1], 20, 1];
const circleOpacity = ['step', ['zoom'], ['case', ['!=', ['%', ['get', 'minute'], 10], 0], 0, 1], 19, ['case', ['!=', ['%', ['get', 'minute'], 5], 0], 0, 1], 20, 1];
nodeDir.readFiles('./config/default/common/vectorstyles/', // the root path
  {
    match: /.json$/, // only match orbit tracks
    exclude: /_polar/,
    recursive: false // only the root dir
  },

  function (err, content, filename, next) {
    console.log(filename);
    if (err) {
      console.warn(err);
    } else {
      var json = JSON.parse(content);

      var layers = json.layers;
      for (var i = 0, length = layers.length; i < length; i++) {
        const layer = layers[i];
        if (layer.type === 'circle') {
          layer.paint['circle-radius'] = circleRadius;
          layer.paint['circle-opacity'] = circleOpacity;
        }
        if (layer.type === 'symbol') {
          layer.paint['text-opacity'] = textOpacity;
        }
      }
      // var symbolIndex = findIndex(layers, { type: 'symbol' });
      // if (symbolIndex > 0) {
      //   const newLayer = layers[symbolIndex];
      //   layers.splice(symbolIndex, 1);
      //   layers.unshift(newLayer);
      // }
      // if (!hasSymbol) {
      //   var obj = {
      //     id: layers[0].id,
      //     source: layers[0].id,
      //     'source-layer': layers[0].id,
      //     'source-description': 'Default',
      //     type: 'symbol'
      //   };
      //   obj.layout = layout;
      //   obj.paint = paint;
      //   layers.push(obj);
      // }
      var jsonDone = JSON.stringify(json, null, 2);

      fs.writeFile(filename, jsonDone, 'utf8', () => {
        console.log('written');
      });
    }
    next();
  },
  function() {
    console.log('end');
  }

);
