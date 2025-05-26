import { legacy_createStore as createStore, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from '../reducers';

const persistConfig = {
  key: 'organiz-asso',
  storage,
  whitelist: ['auth', 'forums'], // Éléments à persister (cacher localement)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configuration pour les Redux DevTools (si disponible)
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// Création du store avec middlewares
export const store = createStore(
  persistedReducer,
  composeEnhancers(applyMiddleware(thunk))
);

// Création du persistor pour l'utiliser avec PersistGate
export const persistor = persistStore(store); 