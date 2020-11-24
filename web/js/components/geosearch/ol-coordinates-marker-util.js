import Overlay from 'ol/Overlay';
import React from 'react';
import ReactDOM from 'react-dom';
import CoordinatesDialog from './coordinates-dialog';
import { coordinatesCRSTransform } from '../../modules/projection/util';
import util from '../../util/util';
import { getFormattedCoordinates } from './util';

/**
 * getCoordinatesDialogTitle
 *
 * @param {Object} address
 * @param {Object} error
 * @param {String} formattedLatitude
 * @param {String} formattedLongitude
 *
 * @returns {String} title
 */
const getCoordinatesDialogTitle = (address, error, formattedLatitude, formattedLongitude) => {
  let title;
  if (error) {
    title = `${formattedLatitude.trim()}, ${formattedLongitude.trim()}`;
  } else if (address) {
    /* eslint-disable camelcase */
    const {
      Addr_type,
      Match_addr,
      ShortLabel,
      City,
      Region,
    } = address;
    if (Addr_type === 'PointAddress') {
      title = `${ShortLabel}, ${City}, ${Region}`;
    } else if (City && Region) {
      title = `${City}, ${Region}`;
    } else {
      title = `${Match_addr}`;
    }
  }
  return title;
};

/**
 * Create tooltip React DOM element
 *
 * @param {Object} map
 * @param {Object} config
 * @param {Array} coordinates
 * @param {Object} coordinatesMetadata
 * @param {Boolean} isMobile
 * @param {Function} clearCoordinates
 * @param {Function} toggleDialogVisible
 *
 * @returns {Void}
 */
export const renderCoordinatesTooltip = (map, config, coordinates, coordinatesMetadata, isMobile, clearCoordinates, toggleDialogVisible) => {
  const { projections } = config;
  const { proj } = map;
  const { crs } = projections[proj];
  const [latitude, longitude] = coordinates;

  // create tooltip overlay
  const tooltipElement = document.createElement('div');
  const tooltipId = util.encodeId(`coordinates-map-marker_${latitude},${longitude}`);
  const tooltipOverlay = new Overlay({
    id: tooltipId,
    element: tooltipElement,
    offset: [0, -40],
    positioning: 'bottom-center',
    stopEvent: false,
  });

  // transform polar projections coordinates
  let coordinatesPosition;
  if (proj === 'geographic') {
    coordinatesPosition = [longitude, latitude];
  } else {
    coordinatesPosition = coordinatesCRSTransform([longitude, latitude], 'EPSG:4326', crs);
  }

  // add tooltip overlay to map and position based on marker coordinates
  map.addOverlay(tooltipOverlay);
  toggleDialogVisible(true);
  tooltipOverlay.setPosition(coordinatesPosition);

  // helper function to remove/hide tooltip overlay
  const removeCoordinatesDialog = () => {
    map.removeOverlay(tooltipOverlay);
    toggleDialogVisible(false);
  };

  ReactDOM.render((
    <CoordinatesDialog
      coordinatesMetadata={coordinatesMetadata}
      removeCoordinatesDialog={removeCoordinatesDialog}
      clearCoordinates={clearCoordinates}
      isMobile={isMobile}
      tooltipId={tooltipId}
    />
  ), tooltipOverlay.getElement());
};

/**
 * getCoordinatesMetadata for tooltip display
 *
 * @param {Object} geocodeProperties
 *
 * @returns {Object} coordinatesMetadata
 */
export const getCoordinatesMetadata = (geocodeProperties) => {
  const { latitude, longitude, reverseGeocodeResults } = geocodeProperties;
  const { address, error } = reverseGeocodeResults;

  // get formatted coordinates
  const [formattedLatitude, formattedLongitude] = getFormattedCoordinates(latitude, longitude);

  // build title based on available parameters
  const title = getCoordinatesDialogTitle(address, error, formattedLatitude, formattedLongitude);
  const coordinates = `${formattedLatitude.trim()}, ${formattedLongitude.trim()}`;

  return {
    coordinates,
    title,
  };
};

/**
 * Get coordinate dialog feature at clicked map pixel
 *
 * @param {Array} pixels
 * @param {Object} map
 * @param {Object} config
 * @param {Boolean} isMobile
 * @param {Function} clearCoordinates
 * @param {Function} toggleDialogVisible
 *
 * @returns {Void}
 */
export const getCoordinatesDialogAtMapPixel = (pixels, map, config, isMobile, clearCoordinates, toggleDialogVisible) => {
  // check for existing coordinate marker tooltip overlay and prevent multiple renders
  const mapOverlays = map.getOverlays().getArray();
  const coordinatesTooltipOverlay = mapOverlays.filter((overlay) => {
    const { id } = overlay;
    return id && id.includes('coordinates-map-marker');
  });
  if (coordinatesTooltipOverlay.length > 0) {
    return;
  }

  map.forEachFeatureAtPixel(pixels, (feature) => {
    const featureId = feature.getId();
    if (featureId === 'coordinates-map-marker') {
      const featureProperties = feature.getProperties();
      const { latitude, longitude } = featureProperties;

      // get metadata for tooltip
      const coordinatesMetadata = getCoordinatesMetadata(featureProperties);

      // create tooltip overlay React DOM element
      renderCoordinatesTooltip(map, config, [latitude, longitude], coordinatesMetadata, isMobile, clearCoordinates, toggleDialogVisible);
    }
  });
};
