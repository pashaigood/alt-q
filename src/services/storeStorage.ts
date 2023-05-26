import debounce from 'lodash/debounce';
import * as vscode from 'vscode';
import storeEvent from '../events/storeEvent';
import { retrieveData, storeData } from '../utils/storage';
import store, { ReplaceStateAction, RootState } from '../store';

function activate(context: vscode.ExtensionContext) {
  initializeStore(context).then(() => {
    storeEvent.on(debouncedStoreData);
  });

  const debouncedStoreData = debounce(
    async (state: RootState) => {
      await storeData(context, 'workspaceState', 'appState', state);
    },
    300 // Debounce delay (in milliseconds)
  );
}

async function initializeStore(context: vscode.ExtensionContext) {
  const savedState = await retrieveData(context, 'workspaceState', 'appState');

  if (savedState) {
    const replaceStateAction: ReplaceStateAction = {
      type: 'REPLACE_STATE',
      payload: savedState,
    };
    store.dispatch(replaceStateAction);
  }
}

const storeStorage = {
  activate
}

export default storeStorage;