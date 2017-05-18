/**
 * Created by Julian on 12/30/16.
 */
import Meteor, {
  getData
} from 'react-native-meteor';
import {
  createStore,
  combineReducers
} from 'redux';
import _ from 'lodash';
import EventEmitter from 'events';
import nextFrame from 'next-frame';

const meteorReduxReducers = (state = {}, action) => {
    const {type, collection, id, fields} = action;
    switch (type) {
        case 'ADDED':
            // collection doesn't exist yet, add it
            if (!state[collection]) {
                return {
                    ...state,
                    [collection]: {
                        [id]: fields,
                    },
                };
                // no doc with _id exists yet
            } else if (!state[collection][id]) {
                return {
                    ...state,
                    [collection]: {
                        ...state[collection],
                        [id]: fields,
                    },
                };
                // duplicate found, update it
            } else if (state[collection] && state[collection][id]){
                // console.warn(`${id} not added to ${collection}, duplicate found`);
                return {
                    ...state,
                    [collection]: {
                      ...state[collection],
                        [id]: {...fields, ...state[collection][id]},
                    }
                };
            }
            return state;
        case 'CHANGED':
            return {
              ...state,
                [collection]: {
                    ...state[collection],
                    [id]: _.merge(state[collection][id], fields),
                }
            };
        case 'REMOVED':
            if (state[collection][id]) {
              const withoutDoc = {...state};
              delete withoutDoc[collection][id];
              return withoutDoc;
            }
            // console.error(`Couldn't remove ${id}, not found in ${collection} collection`);
            return state;
        case 'SET_READY':
            return {
              ...state,
                ready: action.ready,
            }
        case 'persist/REHYDRATE':
            if (typeof Meteor.ddp === 'undefined' || Meteor.ddp.status === 'disconnected') {
                return action.payload;
            }
            return state;
        case 'HARDRESET':
            console.log('hard reset');
            return {};
        default:
            return state;
    }
<<<<<<< HEAD
    case 'ADDED': {
      let newState;
      if (!state[collection]) {
        // collection doesn't exist yet, add it with doc and 'new' flag
        newState = _.clone(state);
        newState[collection] = { [id]: fields };
        return newState;
      } else if (!state[collection][id]) {
        // no doc with _id exists yet, add it
        newState = _.clone(state);
        newState[collection][id] = fields;
        return newState;
      } else if (state[collection] && state[collection][id]) {
        // duplicate found, update it
        // console.warn(`${id} not added to ${collection}, duplicate found`);
        if (_.isEqual(state[collection][id], fields)) return state;
        newState = _.clone(state);
        newState[collection][id] = { ...state[collection][id], ...fields };
        return newState;
      }
      return state;
    }
    case 'CHANGED': {
      const newState = _.clone(state);
      newState[collection][id] = _.merge(state[collection][id], fields);
      return newState;
    }
    case 'REMOVED':
      if (state[collection][id]) {
        const newState = _.clone(state);
        delete newState[collection][id];
        return newState;
      }
      // console.error(`Couldn't remove ${id}, not found in ${collection} collection`);
      return state;
    case 'SET_READY':
      // todo: check for removed docs
      return {
        ...state,
        ready: action.ready,
      };
    case 'REMOVE_AFTER_RECONNECT':
      // todo: check for removed docs
      const { removed } = action;
      const newState = _.clone(state);
      // newState.reactNativeMeteorOfflineRecentlyAdded[collection] = [];
      newState[collection] = _.omit(newState[collection], removed);
      console.log('collection now contains ', _.size(newState[collection]));
      getData().db[collection].remove({ _id: { $in: removed } });
      return newState;
    case 'CLEAR_OFFLINE_RECENTLY_ADDED':
      const newState = _.clone(state);
      newState.reactNativeMeteorOfflineRecentlyAdded[collection] = [];
      return newState;
    case 'persist/REHYDRATE':
      if (
        typeof Meteor.ddp === 'undefined' ||
        Meteor.ddp.status === 'disconnected'
      ) {
        return action.payload;
      }
      return state;
    case 'HARDRESET':
      console.log('hard reset');
      return {};
    default:
      return state;
  }
=======
>>>>>>> parent of 7378d05... Merge remote-tracking branch 'DesignmanIO/master'
};

const meteorReduxEmitter = new EventEmitter();

const initMeteorRedux = (preloadedState = undefined, enhancer = undefined, customReducers = undefined) => {
    // console.log(preloadedState, enhancer)
    const newReducers = (customReducers !== undefined) ? combineReducers({ ...customReducers, meteorReduxReducers }) : meteorReduxReducers;
    const MeteorStore = createStore(newReducers, preloadedState, enhancer);

    MeteorStore.loaded = () => {
        meteorReduxEmitter.emit('rehydrated');
    };

    meteorReduxEmitter.once('rehydrated', () => {
        // restore collections to minimongo
        _.each(MeteorStore.getState(), (collection, key) => {
            const correctedCollection = _.chain(collection)
              .map((doc) => doc)
              .filter('_id')
              .value();
            // add the collection if it doesn't exist
            if (!getData().db[key]) {
                // add collection to minimongo
                getData().db.addCollection(key);
            }
            // only upsert if the data doesn't match
            if(!_.isEqual(getData().db[key], collection)){
                // add documents to collection
                getData().db[key].upsert(correctedCollection);
            }
        });
        MeteorStore.dispatch({type: 'SET_READY', ready: true});
    });

    Meteor.waitDdpConnected(() => {
        // return false;
        // question: do I need to check for disconnection?
        let connected = true;
        Meteor.ddp.on('disconnected', () => {
            connected = false;
        });
        if (connected) {
            Meteor.ddp.on('removed', async (obj) => {
                const {collection, id} = obj;
                const fields = obj.fields || {};
                await nextFrame();
                MeteorStore.dispatch({type: 'REMOVED', collection, id, fields});
            });
            Meteor.ddp.on('changed', async (obj) => {
                const {collection, id} = obj;
                const fields = obj.fields || {};
                await nextFrame();
                MeteorStore.dispatch({type: 'CHANGED', collection, id, fields});
            });
            Meteor.ddp.on('added', async (obj) => {
                const {collection, id} = obj;
                const fields = obj.fields || {};
                fields._id = id;
                const getCollection = MeteorStore.getState()[collection];
                if(
                  !getCollection ||
                  !getCollection[id] ||
                  !_.isEqual(getCollection[id], fields)
                ){
                    MeteorStore.dispatch({type: 'ADDED', collection, id, fields});
                }
            });
        }
    });

    return MeteorStore;
};

class MeteorStore {
    constructor(props) {

    }
}

const subscribeCached = (store, name, ...args) => {
    Meteor.waitDdpConnected(() => {
        if (Meteor.ddp.status === 'connected') {
            return Meteor.subscribe(name, ...args);
        }
    });
    // fallback if store not initialized
    if (!store) return Meteor.subscribe(name, ...args);
    // if callback exists, run it
    if(typeof args[args.length - 1] === 'function' && store.getState().ready){
        const callback = _.once(args[args.length - 1]);
        callback();
    }
    return {
        ready: () => {return store.getState().ready || false},
        offline: true,
    };
};

returnCached = (cursor, store, collectionName, doDisable) => {
    if (Meteor.ddp && Meteor.ddp.status === 'disconnected') {
        return store.getState()[collectionName] || [];
    }
<<<<<<< HEAD
    if (
      Meteor.ddp.status === 'disconnected'
    ) {
      this.store.dispatch({ type: 'CLEAR_OFFLINE_RECENTLY_ADDED', collection });
    }
    this.collections = _.uniq([...this.collections, collection]);
    return Meteor.collection(collection);
  }
=======
    return cursor;
>>>>>>> parent of 7378d05... Merge remote-tracking branch 'DesignmanIO/master'
}

export {
  meteorReduxReducers,
  subscribeCached,
  returnCached
};
export default initMeteorRedux;
// export default connectMeteorRedux;
