// store.ts
import { PayloadAction, configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { fileStoreReducer } from './features/fileStore';
import fileStoreMiddleware from './features/fileStore/fileStoreMiddleware';

const combinedReducer = combineReducers({
  fileStore: fileStoreReducer,
});

export type RootState = ReturnType<typeof combinedReducer>;

// Define a custom action type for the REPLACE_STATE action
export interface ReplaceStateAction extends PayloadAction<RootState> {
  type: 'REPLACE_STATE';
}

const rootReducer = (
  state: RootState | undefined,
  action: ReplaceStateAction | PayloadAction<any>
): RootState => {
  if (action.type === 'REPLACE_STATE') {
    return (action as ReplaceStateAction).payload;
  }

  return combinedReducer(state, action);
};

const store = configureStore({
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(fileStoreMiddleware),
  reducer: rootReducer,
});

export default store;


