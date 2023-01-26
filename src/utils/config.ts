import * as vscode from 'vscode';

export function getConfig() {
    return vscode.workspace.getConfiguration("pashaigood.alt-q");
}

export async function updateConfig(property: string, value: any) {
    const config = getConfig();
    await config.update(property, value, vscode.ConfigurationTarget.Global)
}