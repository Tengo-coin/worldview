var fs = require('fs');
var nodeDir = require('node-dir');
var circleOpacity = [
  'step',
  [
    'zoom'
  ],
  [
    'case',
    [
      '!=',
      [
        '%',
        [
          'get',
          'minute'
        ],
        5
      ],
      0
    ],
    0,
    1
  ],
  5,
  1
];
var circleRadius = [
  'step',
  [
    'zoom'
  ],
  2.5,
  5,
  5
];
var textRadialOffset = 0.2;
var textOpacity = [
  'step',
  [
    'zoom'
  ],
  [
    'case',
    [
      '!=',
      [
        '%',
        [
          'get',
          'minute'
        ],
        5
      ],
      0
    ],
    0,
    1
  ],
  5,
  1
];
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

      for (var i = 0, length = layers.length; i < length; i++) {
        const layer = layers[i];
        if (layer.type === 'symbol') {
          layer.paint['text-opacity'] = textOpacity;
          layer.layout['text-radial-offset'] = textRadialOffset;
        }
        if (layer.type === 'circle') {
          layer.paint['circle-opacity'] = circleOpacity;
          layer.paint['circle-radius'] = circleRadius;
        }
      }

      var jsonDone = JSON.stringify(json, null, 2);
      // var shortName = filename.split('.').slice(0, -1).join('.');
      fs.writeFile(filename, jsonDone, 'utf8', () => {
        console.log('wrote: ' + filename + '.json');
      });
    }
    next();
  },
  function() {
    console.log('end');
  }

);
