import OlLayerTile from 'ol/layer/Tile';
import OlTileGridTileGrid from 'ol/tilegrid/TileGrid';
import OlSourceTileWMS from 'ol/source/TileWMS';
import util from '../util/util';

const ZOOM_DURATION = 250;

export function createWMSLayer(date, extent, layerId, res) {
  layerId = layerId.replace('_v6_NRT', '');
  layerId = layerId.replace('_v1_NRT', '');
  console.log(layerId);
  const parameters = {
    LAYERS: layerId,
    VERSION: '1.1.1',
  };
  console.log(date);
  const sourceOptions = {
    url: `https://gibs-{a-c}.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?TIME=${util.toISOStringSeconds(util.roundTimeOneMinute(date))}`,
    cacheSize: 4096,
    style: 'default',
    crossOrigin: 'anonymous',
    transition: 0,
    wrapX: true,
    params: parameters,
    tileGrid: new OlTileGridTileGrid({
      origin: [-180, 90],
      resolutions: res,
    }),
  };
  const layer = new OlLayerTile({
    preload: Infinity,
    extent,
    source: new OlSourceTileWMS(sourceOptions),
    minResolution: res[5],
  });
  layer.date = date;
  return layer;
}
/*
 * Setting a zoom action
 *
 * @function self.zoomAction
 * @static
 *
 * @param {Object} map - OpenLayers Map Object
 * @param {number} amount - Direction and
 *  amount to zoom
 * @param {number} duation - length of animation
 * @param {array} center - point to center zoom
 *
 * @returns {void}
 */
export function mapUtilZoomAction(map, amount, duration, center) {
  const zoomDuration = duration || ZOOM_DURATION;
  const centerPoint = center || undefined;
  const view = map.getView();
  const zoom = view.getZoom();
  view.animate({
    zoom: zoom + amount,
    duration: zoomDuration,
    center: centerPoint,
  });
}
export function getActiveLayerGroup(map, layerGroupString) {
  let group = null;
  const array = map.getLayers().getArray();
  for (let i = 0, len = array.length; i < len; i++) {
    const layerGroup = array[i];
    if (layerGroup.get('group') === layerGroupString) {
      group = layerGroup;
      break;
    }
  }
  return group;
}
