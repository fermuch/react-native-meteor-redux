import React, { PropTypes } from 'react';
import Meteor, { createContainer } from 'react-native-meteor';
import Details from './Details';
// react-native-meteor-redux
import {subscribeCached} from 'react-native-meteor-redux';
import {MeteorStore} from '../../index';
// end react-native-meteor-redux

const DetailsContainer = ({ detailsReady }) => {
  return (
    <Details
      detailsReady={detailsReady}
    />
  );
};

DetailsContainer.propTypes = {
  detailsReady: PropTypes.bool,
};

export default createContainer(() => {
  // react-native-meteor-redux
<<<<<<< HEAD
  // const handle = subscribeCached(MeteorStore, 'details-list');
  const handle = MO.subscribe('detailsByParam', 'details-list', 'param', {test: 'test'}, () => console.log('callback'));
  const details = MO.collection('details', 'detailsByParam').find();
  console.log(details.length, Meteor.user(), MO.user());
  // console.log(MO.store.getState());
=======
  const handle = subscribeCached(MeteorStore, 'details-list');
>>>>>>> parent of 7378d05... Merge remote-tracking branch 'DesignmanIO/master'
  // end react-native-meteor-redux
  return {
    detailsReady: handle.ready(),
  };
}, DetailsContainer);
