import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

// previous : next
const formatOrder = {
  'latlon-dd': 'latlon-dm',
  'latlon-dm': 'latlon-dms',
  'latlon-dms': 'latlon-dd'
};

class VectorTooltip extends React.Component {
  render() {
    const { offsetLeft, offsetTop, active, label, id } = this.props;
    const style = {
      display: active ? 'block' : 'none',
      left: offsetLeft,
      top: offsetTop,
      position: 'absolute'
    }
    const elId = 'vector-hover-label-tooltip';
    return (
      <>
        <span id={elId} style={style}> </span>
        <Tooltip
          boundariesElement="window"
          placement="top"
          isOpen={active}
          target={elId}
          fade={false}
          key={id}
        >
          {label}
        </Tooltip>
      </>
    );
  }
}

VectorTooltip.propTypes = {
  offsetLeft: PropTypes.number,
  offsetTop: PropTypes.number,
  active: PropTypes.bool,
  label: PropTypes.string
};

export default VectorTooltip;
