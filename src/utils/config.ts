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

export async function disableAutoClosingTags() {
    const currentValue = getAutoClosingTags();

    const props = Object.keys(currentValue);

    for (let prop of props) {
        try {
            await vscode.workspace.getConfiguration().update(prop, false);
        } catch (e) { }
    }

    return currentValue;
}

export async function restoreAutoClosingTags(currentValue: Record<string, boolean>) {
    const props = Object.keys(currentValue);

    for (let prop of props) {
        try {
            await vscode.workspace.getConfiguration().update(prop, currentValue[prop]);
        } catch (e) { }
    }
}

export function getAutoClosingTags() {
    const value = {
        "html.autoClosingTags": false,
        "typescript.autoClosingTags": false,
        "javascript.autoClosingTags": false,
        "xml.completion.autoCloseRemovesContent.autoCloseTags": false,
        "auto-close-tag.enableAutoCloseTag": false
    }

    return Object.keys(value).reduce((result: Record<string, boolean>, key: string) => {
        const [scope, ...path] = key.split(".");

        result[key] = vscode.workspace.getConfiguration(scope).get(path.join(".")) as boolean;
        return result;
    }, {});
}