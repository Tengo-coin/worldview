var fs = require('fs');
var nodeDir = require('node-dir');
fs.readFile('./web/config/wv.json', (err, config) => {
  if (err) {
    console.error(err);
    return;
  }
  var jsonConfig = JSON.parse(config);
  var layers = jsonConfig.layers;
  nodeDir.readFiles('./config/default/common/config/wv.json/layers/reference/orbits/', // the root path
    {
      match: /.json/, // only match polar tracks
      recursive: false // only the root dir
    },

    function (err, content, filename, next) {
      // var shortName = filename.split('.').slice(0, -1);
      // shortName = filename.split('_polar').slice(0, -1);

      var shortname = filename.substring(filename.lastIndexOf('/') + 1);
      shortname = shortname.substring(0, shortname.indexOf('.'));
      console.log(shortname);
      console.log(filename);

      if (err) {
        console.warn(err);
      } else {
        var json = JSON.parse(content);
        const refLayer = layers[shortname];
        const layer = json.layers[shortname];
        if (refLayer && layer) {
          if (refLayer.wrapadjacentdays) {
            layer.wrapadjacentdays = refLayer.wrapadjacentdays;
          } else if (layer.wrapadjacentdays) {
            delete layer.wrapadjacentdays;
          }
          const jsonDone = JSON.stringify(json, null, 2);
          fs.writeFile(filename, jsonDone, 'utf8', () => {
            console.log('wrote: ' + filename + '.json');
          });
        }
      };
      next();
    },
    function() {
      console.log('end');
    }

  );
})
;
