import * as vscode from 'vscode';
import * as path from 'path';

export function removeComments(fileContent: string): string {
  const singleLineCommentRegex = /\/\/.*$/gm;
  const multiLineCommentRegex = /\/\*[\s\S]*?\*\//gm;

  const cleanedContent = fileContent
    .replace(singleLineCommentRegex, '')
    .replace(multiLineCommentRegex, '');

  return cleanedContent;
}

export function extractImportsAndRequires(fileContent: string): string[] {
  const cleanedContent = removeComments(fileContent);

  const importRegex = /import(?:["'\s]*[\w*${}\n\r\t, ]+from\s*)?["']([^"']+)["'];\n?/g;
  const requireRegex = /const(?:["'\s]*[\w*${}\n\r\t, ]+)=\s*require\(["']([^"']+)["']\);\n?/g;

  const importMatches = Array.from(cleanedContent.matchAll(importRegex));
  const requireMatches = Array.from(cleanedContent.matchAll(requireRegex));

  const importsAndRequires = importMatches.concat(requireMatches);

  const result = new Set(importsAndRequires.map((match) => match[1]));
  return Array.from(result);
}

export function getCurrentDocumentRelativePath(file: vscode.TextDocument): string {
  const activeDocumentUri = file.uri;
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!workspaceRoot) {
    throw new Error('No working root');
  }

  return path.relative(workspaceRoot, activeDocumentUri.fsPath);
}

export function getCurrentDocument() {
  const activeEditor = vscode.window.activeTextEditor;

  if (!activeEditor) {
    throw new Error('No document found');
  }
  return activeEditor.document;
}