import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

const VectorTooltip = (props) => {
  const {
    offsetLeft, offsetTop, active, label, id,
  } = props;
  const style = {
    display: active ? 'block' : 'none',
    left: offsetLeft,
    top: offsetTop,
    position: 'absolute',
  };
  const elId = 'vector-hover-label-tooltip';
  return (
    <>
      <span id={elId} style={style}> </span>
      {active ? (
        <Tooltip
          id="vector-label-tooltip"
          boundariesElement="window"
          placement="top"
          isOpen={active}
          target={elId}
          fade={false}
          key={id}
          className="noselect"
        >
          {`${label} UTC`}
        </Tooltip>
      ) : null}
    </>
  );
};

VectorTooltip.propTypes = {
  active: PropTypes.bool,
  label: PropTypes.string,
  offsetLeft: PropTypes.number,
  offsetTop: PropTypes.number,
  id: PropTypes.string,
};

export default VectorTooltip;
