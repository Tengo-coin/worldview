import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import OlCoordinates from '../components/map/ol-coordinates';
import vectorDialog from './vector-dialog';
import { onMapClickGetVectorFeatures } from '../modules/vector-styles/util';
import { openCustomContent, onClose } from '../modules/modal/actions';
import { selectVectorFeatures } from '../modules/vector-styles/actions';
import { groupBy as lodashGroupBy, debounce as lodashDebounce, get as lodashGet } from 'lodash';
import { changeCursor } from '../modules/map/actions';
import { isFromActiveCompareRegion } from '../modules/compare/util';
import VectorTooltip from '../components/map/vector-label';

const tooltipDefaultProps = {
  active: false,
  offsetLeft: 0,
  offsetTop: 0,
  label: '',
  id: null
};
export class MapInteractions extends React.Component {
  constructor(props) {
    super(props);
    this.mouseMove = lodashDebounce(this.mouseMove.bind(this), 8);
    this.singleClick = this.singleClick.bind(this);
    this.registerMouseListeners();
    this.state = {
      tooltip: tooltipDefaultProps
    }
  }

  registerMouseListeners() {
    this.props.mouseEvents.on('mousemove', this.mouseMove);
    this.props.mouseEvents.on('singleclick', this.singleClick);
  }

  singleClick(e, map) {
    const { lastSelected, openVectorDiaglog, onCloseModal, selectVectorFeatures, modalState, getDialogObject, measureIsActive, isMobile } = this.props;
    if (measureIsActive) return;
    const isVectorModalOpen = modalState.id.includes('vector_dialog') && modalState.isOpen;
    const pixels = e.pixel;
    const clickObj = getDialogObject(pixels, map);
    const metaArray = clickObj.metaArray || [];
    const selected = clickObj.selected || {};
    const offsetLeft = clickObj.offsetLeft || 10;
    const offsetTop = clickObj.offsetTop || 100;
    const dialogId = isVectorModalOpen ? modalState.id : 'vector_dialog' + pixels[0] + pixels[1];

    if (metaArray.length) {
      openVectorDiaglog(dialogId, metaArray, offsetLeft, offsetTop, isMobile);
    }
    if (Object.entries(selected).length || (Object.entries(lastSelected).length && !isVectorModalOpen)) {
      selectVectorFeatures(selected);
    } else if (isVectorModalOpen && !Object.entries(selected).length) {
      onCloseModal();
      selectVectorFeatures({});
    }
  }

  mouseMove(event, map, crs) {
    const pixels = map.getEventPixel(event);
    const coord = map.getCoordinateFromPixel(pixels);
    const { isShowingClick, changeCursor, measureIsActive, compareState, swipeOffset, proj } = this.props;
    const { tooltip } = this.state;
    const [lon, lat] = coord;
    const hasFeatures = map.hasFeatureAtPixel(pixels);
    let newTooltip = tooltipDefaultProps;
    if (hasFeatures && !isShowingClick && !measureIsActive) {
      let isActiveLayer = false;
      map.forEachFeatureAtPixel(pixels, function (feature, layer) {
        const def = lodashGet(layer, 'wv.def');
        if (!def) return;
        const isWrapped = proj.id === 'geographic' && (def.wrapadjacentdays || def.wrapX);
        const isRenderedFeature = isWrapped ? (lon > -250 || lon < 250 || lat > -90 || lat < 90) : true;
        if (isRenderedFeature && isFromActiveCompareRegion(map, pixels, layer.wv, compareState, swipeOffset)) {
          isActiveLayer = true;
          const vectorDataId = lodashGet(layer, 'wv.def.vectorData.id');
          if (vectorDataId && vectorDataId === 'OrbitTracks') {
            const label = feature.getProperties().label;
            if (label) {
              const coords = feature.getFlatCoordinates();
              const pixel = map.getPixelFromCoordinate(coords);
              newTooltip = {
                label,
                active: true,
                offsetLeft: pixel[0],
                offsetTop: pixel[1] - 6,
                id: feature.ol_uid
              }
            }
          }
        }
      });
      if (isActiveLayer && !isShowingClick) changeCursor(true);
    } else if (!hasFeatures && isShowingClick) {
      changeCursor(false);
    }
    if (newTooltip.id !== tooltip.id) {
      this.setState({ tooltip: newTooltip });
    }
  }

  render() {
    const { isShowingClick, mouseEvents } = this.props;
    const { tooltip } = this.state;
    const mapClasses = isShowingClick ? 'wv-map' + ' cursor-pointer' : 'wv-map';

    return (
      <React.Fragment>
        <div id="wv-map" className={mapClasses} />
        <OlCoordinates mouseEvents={mouseEvents} />
        <VectorTooltip {...tooltip} />
      </React.Fragment>
    );
  }
}
const mapDispatchToProps = dispatch => ({
  selectVectorFeatures: (features) => {
    setTimeout(() => {
      dispatch(selectVectorFeatures(features));
    }, 1);
  },
  changeCursor: (bool) => {
    dispatch(changeCursor(bool));
  },
  onCloseModal: () => {
    dispatch(onClose());
  },
  openVectorDiaglog: (dialogId, metaArray, offsetLeft, offsetTop, isMobile) => {
    const dialogKey = new Date().getUTCMilliseconds();
    dispatch(openCustomContent(dialogId,
      {
        backdrop: false,
        clickableBehindModal: true,
        desktopOnly: true,
        isDraggable: true,
        wrapClassName: 'vector-modal-wrap',
        modalClassName: 'vector-modal light',
        CompletelyCustomModal: vectorDialog,
        isResizable: true,
        dragHandle: '.modal-header',
        dialogKey,
        key: dialogKey,
        vectorMetaObject: lodashGroupBy(metaArray, 'id'),
        width: isMobile ? 250 : 445,
        height: 300,
        offsetLeft,
        offsetTop,
        timeout: 0,
        onClose: () => {
          setTimeout(() => {
            dispatch(selectVectorFeatures({}));
          }, 1);
        }
      }
    ));
  }
});
function mapStateToProps(state) {
  const { modal, map, measure, vectorStyles, browser, compare, proj } = state;
  let swipeOffset;
  if (compare.active && compare.mode === 'swipe') {
    const percentOffset = state.compare.value || 50;
    swipeOffset = browser.screenWidth * (percentOffset / 100);
  }
  return {
    modalState: modal,
    isShowingClick: map.isClickable,
    getDialogObject: (pixels, map) => onMapClickGetVectorFeatures(pixels, map, state, swipeOffset),
    lastSelected: vectorStyles.selected,
    measureIsActive: measure.isActive,
    isMobile: browser.lessThan.medium,
    compareState: compare,
    swipeOffset,
    proj
  };
}
MapInteractions.propTypes = {
  changeCursor: PropTypes.func.isRequired,
  getDialogObject: PropTypes.func.isRequired,
  isShowingClick: PropTypes.bool.isRequired,
  measureIsActive: PropTypes.bool.isRequired,
  modalState: PropTypes.object.isRequired,
  mouseEvents: PropTypes.object.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  openVectorDiaglog: PropTypes.func.isRequired,
  selectVectorFeatures: PropTypes.func.isRequired,
  compareState: PropTypes.object,
  isMobile: PropTypes.bool,
  lastSelected: PropTypes.object,
  proj: PropTypes.object,
  swipeOffset: PropTypes.number
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MapInteractions);
