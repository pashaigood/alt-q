import * as vscode from 'vscode';
import { ExtansionConfiguration } from '../types';

type Config = vscode.WorkspaceConfiguration & ExtansionConfiguration;

export function getConfig(): Config {
    return vscode.workspace.getConfiguration("alt-q") as Config;
}

export async function updateConfig(property: keyof ExtansionConfiguration, value: any) {
    const config = getConfig();
    await config.update(property, value, vscode.ConfigurationTarget.Global)
}