// utils/storage.ts
import * as vscode from 'vscode';

export async function storeData(context: vscode.ExtensionContext, storage: 'globalState' | 'workspaceState', key: string, value: any): Promise<void> {
  return await context[storage].update(key, value);
}

export async function retrieveData(context: vscode.ExtensionContext, storage: 'globalState' | 'workspaceState', key: string): Promise<any> {
  return await context[storage].get(key);
}
