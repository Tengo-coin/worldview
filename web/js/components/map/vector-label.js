import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

class VectorTooltip extends React.Component {
  render() {
    const { offsetLeft, offsetTop, active, label, id } = this.props;
    const style = {
      display: active ? 'block' : 'none',
      left: offsetLeft,
      top: offsetTop,
      position: 'absolute'
    };
    const elId = 'vector-hover-label-tooltip';
    return (
      <React.Fragment >
        <span id={elId} style={style}> </span>
        {active ? (<Tooltip
          id="vector-label-tooltip"
          boundariesElement="window"
          placement="top"
          isOpen={active}
          target={elId}
          fade={false}
          key={id}
          className='noselect'
        >
          {label + ' UTC'}
        </Tooltip>
        ) : null}
      </ React.Fragment>
    );
  }
}

VectorTooltip.propTypes = {
  active: PropTypes.bool,
  label: PropTypes.string,
  offsetLeft: PropTypes.number,
  offsetTop: PropTypes.number
};

export default VectorTooltip;
