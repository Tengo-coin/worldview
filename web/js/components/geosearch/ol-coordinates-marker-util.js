/* eslint-disable no-restricted-syntax */
/* eslint-disable no-nested-ternary */
import Overlay from 'ol/Overlay';
import React from 'react';
import ReactDOM from 'react-dom';
import CoordinatesDialog from './coordinates-dialog';
import { coordinatesCRSTransform } from '../../modules/projection/util';

/**
 * Get parsed precision coordinate number
 * @param {String} coordinate
 * @returns {Number} parsed coordinate with modified precision
 */
function getCoordinateDisplayPrecision(coordinate) {
  const coordinateNumber = Number(coordinate);
  const coordinatePrecision = Math.abs(coordinateNumber) > 100
    ? 7
    : coordinateNumber < 0
      ? 7
      : 6;

  return parseFloat(coordinateNumber.toPrecision(coordinatePrecision));
}

/**
 * Create tooltip React DOM element
 *
 * @param {Object} map
 * @param {Array} coordinates
 * @param {Object} coordinatesMetadata
 *
 * @returns {Void}
 */
function renderTooltip(map, config, coordinates, coordinatesMetadata) {
  const { projections } = config;
  const { proj } = map;
  const { crs } = projections[proj];
  const [latitude, longitude] = coordinates;

  // create tooltip overlay
  const tooltipElement = document.createElement('div');
  const tooltipId = `coordinates-map-marker-${latitude},${longitude}`;
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
  tooltipOverlay.setPosition(coordinatesPosition);

  // helper function to remove tooltip overlay
  const removeTooltip = () => {
    map.removeOverlay(tooltipOverlay);
  };

  ReactDOM.render((
    <CoordinatesDialog
      coordinatesMetadata={coordinatesMetadata}
      toggleWithClose={removeTooltip}
    />
  ), tooltipOverlay.getElement());
}

/**
 * Get coordinate dialog feature at clicked map pixel
 *
 * @param {Array} pixels
 * @param {Object} map
 *
 * @returns {Void}
 */
export default function getCoordinatesDialogAtMapPixel(pixels, map, config) {
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

      const { latitude, longitude, reverseGeocodeResults } = featureProperties;
      const { address, error } = reverseGeocodeResults;

      const parsedLatitude = getCoordinateDisplayPrecision(latitude);
      const parsedLongitude = getCoordinateDisplayPrecision(longitude);

      // build title and metadata based on available parameters
      let title;
      if (error) {
        title = `${parsedLatitude}, ${parsedLongitude}`;
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
      const coordinatesMetadata = {
        features: {
          latitude: parsedLatitude,
          longitude: parsedLongitude,
        },
        title,
      };

      // create tooltip overlay React DOM element
      renderTooltip(map, config, [latitude, longitude], coordinatesMetadata);
    }
  });
}