// fileStore.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { DepFile } from './types';

interface FileStore {
  auto: { [relativePath: string]: DepFile[] };
  manual: { [relativePath: string]: DepFile[] };
}

const initialState: FileStore = {
  auto: {},
  manual: {},
};

const fileStoreSlice = createSlice({
  name: 'fileStore',
  initialState,
  reducers: {
    toggleFileEnabled: (
      state,
      action: PayloadAction<{ relativePath: string; id: string; fileType?: 'auto' | 'manual' }>
    ) => {
      const { relativePath, id, fileType = 'auto' } = action.payload;
      const file = state[fileType][relativePath]?.find((file) => file.id === id);
      if (file) {
        file.enabled = !file.enabled;
      }
    },

    addFiles: (
      state,
      action: PayloadAction<{ relativePath: string; files: string[]; fileType?: 'auto' | 'manual' }>
    ) => {
      const { relativePath, files, fileType = 'auto' } = action.payload;

      if (!state[fileType][relativePath]) {
        state[fileType][relativePath] = [];
      }

      const updatedState: DepFile[] = [];

      files.forEach((newFile) => {
        const existingFile = state[fileType][relativePath].find((file) => file.value === newFile);

        if (existingFile) {
          updatedState.push(existingFile);
        } else {
          updatedState.push({
            id: uuidv4(),
            value: newFile,
            enabled: true,
            type: fileType,
            file: ''
          });
        }
      });

      state[fileType][relativePath] = updatedState;
    },

    removeFileById: (
      state,
      action: PayloadAction<{ relativePath: string; id: string; fileType?: 'auto' | 'manual' }>
    ) => {
      const { relativePath, id, fileType = 'auto' } = action.payload;

      if (state[fileType][relativePath]) {
        state[fileType][relativePath] = state[fileType][relativePath].filter((file) => file.id !== id);
      }
    },

    addManualFile: (
      state,
      action: PayloadAction<{ relativePath: string; value: string }>
    ) => {
      const { relativePath, value } = action.payload;

      if (!state.manual[relativePath]) {
        state.manual[relativePath] = [];
      }

      state.manual[relativePath].push({
        id: uuidv4(),
        value,
        enabled: true,
        type: 'manual',
        file: ''
      });
    },

    updateManualFile: (
      state,
      action: PayloadAction<{ relativePath: string; id: string; value: string }>
    ) => {
      const { relativePath, id, value } = action.payload;
      const file = state.manual[relativePath]?.find((file) => file.id === id);

      if (file) {
        file.value = value;
      }
    },

    deleteManualFile: (
      state,
      action: PayloadAction<{ relativePath: string; id: string }>
    ) => {
      const { relativePath, id } = action.payload;

      if (state.manual[relativePath]) {
        state.manual[relativePath] = state.manual[relativePath].filter((file) => file.id !== id);
      }
    },
  },
});

export const {
  addFiles,
  toggleFileEnabled,
  removeFileById,
  addManualFile,
  updateManualFile,
  deleteManualFile,
} = fileStoreSlice.actions;

export const fileStoreReducer = fileStoreSlice.reducer;

export function selectFilesByType(
  store: FileStore,
  relativePath: string | null,
  fileType: 'auto' | 'manual' = 'auto'
): DepFile[] {
  return store[fileType][relativePath!] || [];
}


export function selectFiles(
  store: FileStore,
  relativePath: string | null
): DepFile[] {
  const auto = store.auto[relativePath!] || [];
  const manual = store.manual[relativePath!] || [];
  return [...auto, ...manual]
}
