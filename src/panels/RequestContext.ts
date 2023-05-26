import * as vscode from 'vscode';
import storeEvent from '../events/storeEvent';
import { getCurrentDocument, getCurrentDocumentRelativePath } from '../utils/fileDeps';
import { addManualFile, deleteManualFile, selectFiles, selectFilesByType, toggleFileEnabled } from '../features/fileStore';
import { Panel } from '../classes/Panel';
import { DepFile } from '../features/fileStore/types';
import store from '../store';
import { getRelativePath, getRelativePathFromTo, normalizePath } from '../utils/fileSystem';


function register(context: vscode.ExtensionContext): RequestContext {
  const sideBar = new RequestContext(context.extensionUri);

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(
    RequestContext.viewType,
    sideBar,
    {

      webviewOptions: {
        // retainContextWhenHidden: true
      }
    }
  ));

  return sideBar;
}

export class RequestContext extends Panel {
  protected appName = 'RequestContext';

  public static readonly viewType = 'alt-q.dependencies';

  public api = {
    deps: {
      get: () => this.deps,
      changed: () => this.api.deps.get(),
      setEditable: (id: string) => {
        this.toggleEditable(id);
      }
    },
    manualDeps: {
      get: () => this.manualDeps,
      changed: () => this.api.manualDeps.get(),
      selectFile: async () => {
        const filePath = await getFilePath();

        if (!filePath) {
          return;
        }

        const document = getCurrentDocument();
        const relativePath = getCurrentDocumentRelativePath(document);
        
        if (!relativePath) { return }

        const fileRelativePath = normalizePath(
          getRelativePathFromTo(document.uri.fsPath, filePath)
        );

        store.dispatch(
          addManualFile({
            relativePath,
            value: fileRelativePath
          })
        )
      },
      setEditable: (id: string, type: DepFile['type']) => {
        this.toggleEditable(id, type);
      },
      delete: (id: string) => {
        const document = getCurrentDocument();
        const relativePath = getCurrentDocumentRelativePath(document);

        store.dispatch(
          deleteManualFile({
            relativePath,
            id
          },
          )
        )
      }
    }
  }

  private deps: DepFile[] = [];

  private manualDeps: DepFile[] = [];

  private toggleEditable(id: string, type?: DepFile['type']) {
    const document = getCurrentDocument();

    const relativePath = getCurrentDocumentRelativePath(document);
    if (!relativePath) { return }

    store.dispatch(
      toggleFileEnabled({
        relativePath,
        id,
        fileType: type
      },
      )
    )
  }

  activate() {
    storeEvent.on((state) => {
      const document = getCurrentDocument();
      this.deps = selectFilesByType(
        state.fileStore,
        getCurrentDocumentRelativePath(document)
      );

      this.manualDeps = selectFilesByType(
        state.fileStore,
        getCurrentDocumentRelativePath(document),
        'manual'
      );

      this.api.deps.changed();
      this.api.manualDeps.changed();
    });
  }
}

export default {
  register
};


async function getFilePath(): Promise<string | undefined> {
  // Set up options for the open dialog
  const options: vscode.OpenDialogOptions = {
    canSelectMany: false, // Allow the user to select only one file
    openLabel: 'Select File',
    filters: {
      // You can specify filters to allow selection of specific file types
      'All Files': ['*'],
    },
  };

  // Show the open dialog and wait for user's file selection
  const fileUri = await vscode.window.showOpenDialog(options);

  // If the user selects a file, return its file system path, otherwise return undefined
  return fileUri && fileUri[0] ? fileUri[0].fsPath : undefined;
}