import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as olProj from 'ol/proj';
import { debounce as lodashDebounce } from 'lodash';
import moment from 'moment';
import SmartHandoffModal from './smart-handoff-modal';
import Button from '../../components/util/button';
import Checkbox from '../../components/util/checkbox';
import Crop from '../../components/util/image-crop';
import util from '../../util/util';
import { getLayers } from '../../modules/layers/selectors';
import { imageUtilGetCoordsFromPixelValues } from '../../modules/image-download/util';
import { onClose, openCustomContent } from '../../modules/modal/actions';
import getSelectedDate from '../../modules/date/selectors';


/**
 * The Smart-Handoff components replaces the existing data download capability
 * by directing users to select specific layer products within Worldview and 'hand' them 'off'
 * to NASA's Earthdata Search web tool that will proceed in fetching corresponding
 * layer data and granule files that are available for download.
 */
class SmartHandoff extends Component {
  /**
   * SmartHandoff's default constructor
   * @param {*} props | A read-only object used to transfer data from a parent component
   */
  constructor(props) {
    super(props);

    const {
      screenWidth,
      screenHeight,
    } = props;

    this.state = {
      boundaries: props.boundaries || {
        x: screenWidth / 2 - 100,
        y: screenHeight / 2 - 100,
        x2: screenWidth / 2 + 100,
        y2: screenHeight / 2 + 100,
      },
      selectedLayer: {},
      showBoundingBox: false,
      selectedGranules: 0,
      totalGranules: 0,
      currentExtent: {},
      coordinates: {},
    };


    this.onBoundaryChange = this.onBoundaryChange.bind(this);
    this.updateExtent = this.updateExtent.bind(this);
    this.debouncedUpdateExtent = lodashDebounce(this.updateExtent, 500);
  }

  updateExtent() {
    const { currentExtent, selectedLayer } = this.state;
    if (selectedLayer && currentExtent) {
      this.updateGranuleCount(currentExtent);
    }
  }

  /**
   * Fires when the image cropper is moved around on the map; updates the SW and NE lat/lon coordinates.
   * @param {*} boundaries - the focal point to which layer data should be contained within
   */
  onBoundaryChange(boundaries) {
    const { proj, map } = this.props;
    const { selectedLayer } = this.state;
    const {
      x, y, width, height,
    } = boundaries;
    const newBoundaries = {
      x,
      y,
      x2: x + width,
      y2: y + height,
    };

    const lonlats = imageUtilGetCoordsFromPixelValues(
      newBoundaries,
      map.ui.selected,
    );
    const { crs } = proj;
    // Retrieve the lat/lon coordinates based on the defining boundary and map projection
    const geolonlat1 = olProj.transform(lonlats[0], crs, 'EPSG:4326');
    const geolonlat2 = olProj.transform(lonlats[1], crs, 'EPSG:4326');

    const currentExtent = {
      southWest: `${geolonlat1[0]},${geolonlat1[1]}`,
      northEast: `${geolonlat2[0]},${geolonlat2[1]}`,
    };

    const coordinates = {
      bottomLeft: util.formatCoordinate([geolonlat1[0], geolonlat1[1]]),
      topRight: util.formatCoordinate([geolonlat2[0], geolonlat2[1]]),
    };

    this.setState({
      boundaries: newBoundaries,
      coordinates,
      currentExtent,
    }, () => {
      if (selectedLayer && currentExtent) {
        this.debouncedUpdateExtent();
      }
    });
  }

  onLayerChange(layer, currentExtent) {
    this.setState({ selectedLayer: layer }, () => this.updateGranuleCount(currentExtent));
  }

  async updateGranuleCount(currentExtent) {
    const { selectedDate } = this.props;
    const { selectedLayer, showBoundingBox } = this.state;
    const startDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T00:00:00.000Z`;
    const endDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T23:59:59.999Z`;
    const dateRange = `${startDate},${endDate}`;

    let totalGranules = 0;
    let selectedGranules = 0;

    const urlTotalGranules = 'https://cmr.earthdata.nasa.gov/search/granules.json?'
                + `temporal=${dateRange}&`
                + `collection_concept_id=${selectedLayer.conceptId}&`
                + `day_night_flag=${selectedLayer.daynight}&`
                + 'include_facets=v2&'
                + 'page_size=0';

    let urlSelectedGranules = urlTotalGranules;

    totalGranules = await fetch(urlTotalGranules, { timeout: 5000 })
      .then(async(response) => {
        const result = await response.json();
        return result.feed.facets.children[0].children[0].children[0].count;
      })
      .catch((error) => 0);

    if (showBoundingBox) {
      urlSelectedGranules += `&bounding_box=${currentExtent.southWest},${currentExtent.northEast}`;
      selectedGranules = await fetch(urlSelectedGranules, { timeout: 5000 })
        .then(async(response) => {
          const result = await response.json();
          return result.feed.facets.children[0].children[0].children[0].count;
        })
        .catch((error) => 0);
    }

    this.setState({ selectedGranules, totalGranules });
  }

  /**
   * Default render which displays the data-download panel
   */
  render() {
    const {
      screenWidth,
      screenHeight,
      activeLayers,
      isActive,
      showWarningModal,
      selectedDate,
    } = this.props;

    const { selectedLayer } = this.state;
    const {
      selectedGranules, totalGranules, coordinates, currentExtent, showBoundingBox,
    } = this.state;

    // Determine if data-download 'smart-handoff' tab is activated by user
    if (!isActive) return null;

    // Bounardies referencing the coordinates displayed around image crop
    const { boundaries } = this.state;
    const {
      x, y, x2, y2,
    } = boundaries;


    // Default modal state
    const showModal = false;

    // Determine if existing selected layer is active still and visibility toggle is 'ON'
    const isLayerStillActive = activeLayers.find((layer) => selectedLayer === layer && layer.visible);

    // Determine if any hidden layers are available for download; if so, displays hidden layers */
    const areHiddenLayersAvailable = activeLayers.filter((layer) => layer.conceptId !== undefined && !layer.visible).length;

    if (!isLayerStillActive) {
      // Need to handle cases here when a layer has been toggled to 'hidden'.
    }

    return (
      <div id="smart-handoff-side-panel">

        {/** Listing of layers that are available to download via Earthdata Search */}
        <h1>Select an available layer to download:</h1>

        <div id="esd-notification">
          Downloading layer granules and map imagery will be performed using NASA's Earthdata Search application.
        </div>

        <hr />

        <div id="smart-handoff-layer-list">
          {activeLayers.map((layer, i) => {
            if (layer.conceptId && layer.visible) {
              return (
                <div className="layer-item" key={layer.conceptId}>
                  <input
                    id={layer.id}
                    type="radio"
                    value={layer.conceptId}
                    name="smart-handoff-layer-radio"
                    checked={selectedLayer && selectedLayer.id === layer.id}
                    onChange={() => this.onLayerChange(layer, currentExtent)}
                  />
                  <label htmlFor={layer.id}>{layer.title}</label>
                  <span>{layer.subtitle}</span>
                </div>
              );
            }
            return null;
          })}
        </div>

        <hr />

        <div id="crop-toggle">
          <Checkbox
            id="chk-crop-toggle"
            label="Bounding Box"
            text="Toggle boundary selection."
            checked={showBoundingBox}
            onCheck={() => {
              this.setState({ showBoundingBox: !showBoundingBox }, () => {
                if (selectedLayer) this.updateGranuleCount(currentExtent);
              });
            }}
          />
        </div>

        <hr />

        { showBoundingBox && (
        <div id="granule-count">
          <h1>
            {' '}
            Granules available:
            {' '}
            <span>{`${selectedGranules} of ${totalGranules}`}</span>
          </h1>
        </div>
        )}

        { !showBoundingBox && (
        <div id="granule-count">
          <h1>
            {' '}
            Granules available:
            {' '}
            <span>{totalGranules}</span>
          </h1>
        </div>
        )}

        { /** Download button that transfers user to NASA's Earthdata Search */ }
        <Button
          onClick={() => {
            if (showModal) showWarningModal(selectedDate, selectedLayer, currentExtent);
            else openEarthDataSearch(selectedDate, selectedLayer, currentExtent)();
          }}
          id="download-btn"
          text="GO TO EARTHDATA SEARCH"
          className="red"
          valid={selectedLayer && (totalGranules !== 0)}
        />

        {/** Listing of layers that are excluded from downloading */}
        { areHiddenLayersAvailable > 0 && (
          <div>
            <hr />
            <div id="smart-handoff-hidden-layer-list">
              <h1>Hidden layers:</h1>
              {activeLayers.map((layer, i) => {
                if (layer.conceptId && !layer.visible) {
                  return (
                    <div className="hidden-layer">
                      <p>{layer.title}</p>
                      <p>{layer.subtitle}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}


        { /** Image crop overlay used to determine user's area of interest */ }
        { showBoundingBox && (
        <Crop
          className="download-extent"
          x={x}
          y={y}
          width={x2 - x}
          height={y2 - y}
          maxHeight={screenHeight}
          maxWidth={screenWidth}
          onChange={this.onBoundaryChange}
          onClose={onClose}
          keepSelection
          bottomLeftStyle={{
            left: x,
            top: y2 + 5,
            width: x2 - x,
          }}
          topRightStyle={{
            left: x,
            top: y - 20,
            width: x2 - x,
          }}
          coordinates={coordinates}
          showCoordinates
        />
        )}
      </div>
    );
  }
}

const openEarthDataSearch = (selectedDate, selectedLayer, extentCoords) => () => {
  const { conceptId, daynight } = selectedLayer;
  const { southWest, northEast } = extentCoords;

  const startDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T00:00:00.000Z`;
  const endDate = `${moment.utc(selectedDate).format('YYYY-MM-DD')}T23:59:59.999Z`;

  const dateRange = `${startDate},${endDate}`;

  let earthDataSearchURL = `https://search.earthdata.nasa.gov/search/granules?p=${conceptId}&[qt]=${dateRange}&sb=${southWest},${northEast}&m=0.0!-180.0!0!1!0!0,2`;

  if (daynight) {
    earthDataSearchURL += `&pg[0][dnf]=${daynight}`;
  }

  window.open(earthDataSearchURL, '_blank');
};

/**
 * Handle type-checking of defined properties
 */
SmartHandoff.propTypes = {
  isActive: PropTypes.bool,
  activeLayers: PropTypes.array,
  map: PropTypes.object.isRequired,
  boundaries: PropTypes.object,
  proj: PropTypes.object,
  screenHeight: PropTypes.number,
  screenWidth: PropTypes.number,
  selectedDate: PropTypes.instanceOf(Date),
  showWarningModal: PropTypes.func,
};

/**
 * ReactRedux; used for selecting the part of the data from the store
 * that the Smarthandoff component needs. This is called every time the
 * store state changes.
 * @param {*} state | Encapsulates the entire Redux store state.
 * @param {*} ownProps | Data from SmartHandoff that is used to retrieve data from the store.
 */
const mapStateToProps = (state, ownProps) => {
  const { tabTypes } = ownProps;
  const {
    browser, layers, map, proj, compare, sidebar, boundaries,
  } = state;
  const { screenWidth, screenHeight } = browser;
  const { activeString } = compare;
  const activeLayers = getLayers(layers[activeString], { proj: proj.id });
  return {
    activeLayers,
    boundaries,
    isActive: sidebar.activeTab === 'download',
    map,
    proj: proj.selected,
    screenWidth,
    screenHeight,
    selectedDate: getSelectedDate(state),
    tabTypes,
  };
};

/**
 * React-Redux; used for SmartHandoff component to fire specific actions events
 * @param {*} dispatch | A function of the Redux store that is triggered upon a change of state.
 */
const mapDispatchToProps = (dispatch) => ({
  showWarningModal: (selectedDate, selectedLayer, extentCoords) => {
    dispatch(
      openCustomContent('transferring-to-earthdata-search', {
        headerText: 'Leaving Worldview',
        bodyComponent: SmartHandoffModal,
        bodyComponentProps: {
          selectedDate,
          selectedLayer,
          extentCoords,
          goToEarthDataSearch: openEarthDataSearch(selectedDate, selectedLayer, extentCoords),
        },
        size: 'lg',
      }),
    );
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SmartHandoff);
