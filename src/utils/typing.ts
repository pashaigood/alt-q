import * as vscode from 'vscode';
import Deferred from '../Deferred';

export default function typeText(text: string) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return {
            defer: Promise.resolve()
        };
    }

    let typingSpeed = 25; // ms

    clearSelection();

    const defer = new Deferred();

    const stop = () => {
        defer.resolve(undefined);
        clearInterval(interval);
    }

    let i = 0;
    let interval = setInterval(() => {
        editor!.edit((editBuilder) => {
            let selection = editor!.selection;
            editBuilder.insert(selection.end, text[i]);

        }, { undoStopBefore: false, undoStopAfter: false });
        i++;
        if (i > text.length) {
            stop();
        }
    }, typingSpeed);

    return {
        defer: defer.promise,
        stop
    }
}

export function typeText2(text: string) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return {
            defer: Promise.resolve()
        };
    }

    let typingDuration = 3000; // ms
    let delay = Math.max(typingDuration / text.length, 30); // time delay between each character
    let substringLength = Math.ceil(text.length / delay); // number of characters to insert at a time
    clearSelection();

    const defer = new Deferred();

    const stop = () => {
        defer.resolve(undefined);
        clearInterval(interval);
    }

    let i = 0;
    let interval = setInterval(() => {
        editor!.edit((editBuilder) => {
            let selection = editor!.selection;
            let substring = text.substring(i, i + substringLength);
            editBuilder.insert(selection.active, substring);
        }, { undoStopBefore: false, undoStopAfter: false });
        i += substringLength;
        if (i >= text.length) {
            stop();
        }
    }, delay);

    return {
        defer: defer.promise,
        stop
    }
}

function clearSelection() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    let selection = editor.selection;
    editor.selections = [new vscode.Selection(
        selection.end.line,
        selection.end.character,
        selection.end.line,
        selection.end.character
    )];
}
