import * as vscode from 'vscode';
import _debounce from 'lodash/debounce';


async function getActiveFileContent(): Promise<string | null> {
  const activeEditor = vscode.window.activeTextEditor;

  if (!activeEditor) {
    vscode.window.showErrorMessage('No active text editor found.');
    return null;
  }

  const activeDocument = activeEditor.document;
  const fileContent = activeDocument.getText();

  return fileContent;
}

function onActiveFileChanged(callback: (editor: vscode.TextEditor | undefined) => void): vscode.Disposable {
  const disposable = vscode.window.onDidChangeActiveTextEditor(callback);
  return disposable;
}

function activate(
  context: vscode.ExtensionContext,
  changeChanger: (file: vscode.TextDocument) => void
): void {
  const disposable = onActiveFileChanged((editor: vscode.TextEditor | undefined) => {
    if (!editor) {
      return;
    }

    changeChanger(editor.document);
  });

  const debounceChanger = _debounce((event: vscode.TextDocumentChangeEvent) => {
    changeChanger(event.document);
  }, 250);

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
      debounceChanger(event);
    })
  );

  context.subscriptions.push(disposable);
}

export default {
  activate
}

export function deactivate() { }
