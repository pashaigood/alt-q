import * as vscode from 'vscode';
import activeFile from './activeFile';
import dataEvent from '../events/DataEvent';
import { getCurrentDocumentRelativePath, extractImportsAndRequires } from '../utils/fileDeps';
import plugin from './plugin';
import detectLanguage, { simplifyLanguage } from '../utils/detectLanguage';

function getFileDeps(file: vscode.TextDocument) {
  const fileContent = file.getText();

  const pluginName = simplifyLanguage(detectLanguage(file.uri.fsPath));

  console.log(pluginName);
  

  return plugin(pluginName).deps.get(fileContent);
}

function activate(context: vscode.ExtensionContext) {
  // On change
  activeFile.activate(context, (file: vscode.TextDocument) => {
    dataEvent.emit('file-deps', {
      payload: {
        file: getCurrentDocumentRelativePath(file),
        deps: getFileDeps(file)
      }
    });
  });

  // On open
  setTimeout(() => {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const file = editor.document;
    dataEvent.emit('file-deps', {
      payload: {
        file: getCurrentDocumentRelativePath(file),
        deps: getFileDeps(file)
      }
    });
  }, 100);
}

const deps = {
  activate
}

export default deps;