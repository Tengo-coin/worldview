import {
  geosearchReducer,
  geosearchState,
} from './reducers';
import {
  CLEAR_MARKER,
  SET_MARKER,
  TOGGLE_REVERSE_GEOCODE,
  TOGGLE_SHOW_GEOSEARCH,
} from './constants';

// test variables
const reverseGeocodeResults = {
  address: {},
  location: {},
};

describe('geosearchReducer', () => {
  test('geosearchReducer should return the initial state', () => {
    expect(geosearchReducer(undefined, {})).toEqual(
      geosearchState,
    );
  });
  test(
    `${TOGGLE_SHOW_GEOSEARCH
    } shows geosearch isExpanded and `
      + 'should return new state',
    () => {
      expect(
        geosearchReducer(geosearchState, {
          type: TOGGLE_SHOW_GEOSEARCH,
          value: true,
        }),
      ).toEqual({
        ...geosearchState,
        isExpanded: true,
      });
    },
  );
  test(
    `${TOGGLE_REVERSE_GEOCODE
    } toggles isCoordinateSearchActive to true and `
      + 'should return new state',
    () => {
      expect(
        geosearchReducer(geosearchState, {
          type: TOGGLE_REVERSE_GEOCODE,
          value: true,
        }),
      ).toEqual({
        ...geosearchState,
        isCoordinateSearchActive: true,
      });
    },
  );
  test(
    `${SET_MARKER
    } updates activeMarker, coordinates, reverseGeocodeResults `
    + 'and sets isCoordinateSearchActive to false and should return new state',
    () => {
      expect(
        geosearchReducer(geosearchState, {
          type: SET_MARKER,
          value: {},
          coordinates: [72, 40],
          reverseGeocodeResults,
        }),
      ).toEqual({
        ...geosearchState,
        isCoordinateSearchActive: false,
        coordinates: [72, 40],
        activeMarker: {},
        reverseGeocodeResults,
      });
    },
  );
  test(
    `${CLEAR_MARKER
    } resets cooridnates, activeMarker, and geocode results`
      + 'should return new state',
    () => {
      expect(
        geosearchReducer(geosearchState, {
          type: CLEAR_MARKER,
        }),
      ).toEqual({
        ...geosearchState,
        coordinates: [],
        activeMarker: null,
        reverseGeocodeResults: null,
      });
    },
  );
});
