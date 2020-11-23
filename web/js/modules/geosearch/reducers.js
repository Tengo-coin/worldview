import {
  CLEAR_MARKER,
  CLEAR_SUGGESTIONS,
  REQUEST_SUGGEST_PLACE_FAILURE,
  REQUEST_SUGGEST_PLACE_SUCCESS,
  SET_MARKER,
  SET_SUGGESTION,
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_GEOSEARCH,
} from './constants';
import { getLocalStorageCollapseState } from './util';

const localStorageCollapseState = getLocalStorageCollapseState();
export const geosearchState = {
  activeMarker: null,
  coordinates: [],
  isCoordinateSearchActive: false,
  isExpanded: !localStorageCollapseState,
  reverseGeocodeResults: null,
  suggestions: [],
};

export function geosearchReducer(state = geosearchState, action) {
  switch (action.type) {
    case TOGGLE_SHOW_GEOSEARCH:
      return {
        ...state,
        isExpanded: action.value,
      };
    case TOGGLE_REVERSE_GEOCODE:
      return {
        ...state,
        isCoordinateSearchActive: action.value,
      };
    case SET_MARKER:
      return {
        ...state,
        activeMarker: action.value,
        coordinates: action.coordinates,
        isCoordinateSearchActive: false,
        reverseGeocodeResults: action.reverseGeocodeResults,
      };
    case CLEAR_MARKER:
      return {
        ...state,
        activeMarker: null,
        coordinates: [],
        reverseGeocodeResults: null,
      };
    case SET_SUGGESTION:
      return {
        ...state,
        suggestions: action.value,
      };
    case REQUEST_SUGGEST_PLACE_SUCCESS:
      return {
        ...state,
        suggestions: JSON.parse(action.response).suggestions,
      };
    case REQUEST_SUGGEST_PLACE_FAILURE:
      return {
        ...state,
        suggestions: [],
      };
    case CLEAR_SUGGESTIONS:
      return {
        ...state,
        suggestions: action.value,
      };
    default:
      return state;
  }
}
