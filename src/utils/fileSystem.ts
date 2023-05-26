import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function getAbsolutePath(requiredFile: string): string | null {
  const activeEditor = vscode.window.activeTextEditor;

  if (activeEditor) {
    return getAbsolutePathFromFile(activeEditor.document, requiredFile);
  }

  return null;
}

export function getAbsolutePathFromFile(file: vscode.TextDocument, requiredFile: string): string | null {
  const activeDocumentPath = file.uri.fsPath;
  const activeDocumentDir = path.dirname(activeDocumentPath);
  return path.resolve(activeDocumentDir, requiredFile);
}

export function getFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(err);
    return '';
  }
}

function hasExtension(filePath: string): boolean {
  const ext = path.extname(filePath);

  return !!ext;
}

export function resolveFile(filepath: string): string | null {
  if (hasExtension(filepath) && fs.existsSync(filepath)) {
    return filepath;
  }

  const fileWithoutExt = filepath.replace(/\.\.\//g, '');
  const fileDir = path.dirname(fileWithoutExt);
  const fileName = path.basename(fileWithoutExt);

  const possibleFiles = [
    path.join(fileDir, `${fileName}.ts`),
    path.join(fileDir, `${fileName}.tsx`),
    path.join(fileDir, `${fileName}.js`),
    path.join(fileDir, `${fileName}.jsx`),
    path.join(fileDir, fileName, 'index.ts'),
    path.join(fileDir, fileName, 'index.tsx'),
    path.join(fileDir, fileName, 'index.js'),
    path.join(fileDir, fileName, 'index.jsx'),
  ];

  for (const file of possibleFiles) {
    if (fs.existsSync(file)) {
      return file;
    }
  }

  return null;
}

export function getRelativePath(fsPath: string): string | null {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!workspaceRoot) {
    throw new Error('No working root');
  }

  return path.relative(workspaceRoot, fsPath);
}

export function getRelativePathFromTo(from: string, to: string): string {
  return path.relative(path.dirname(from), to);
}

export function normalizePath(filePath: string): string {
  // Replace backslashes with forward slashes
  const normalizedPath = filePath.replace(/\\/g, '/');
  // Normalize the path using the path.posix.normalize method
  return path.posix.normalize(normalizedPath);
}