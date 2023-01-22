import * as vscode from 'vscode';

export function isSelection() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return false;
    }
    let selection = editor.selection;
    if (selection.isEmpty) {
        return false;
    }
    return true;
}

export function putText(text: string, selection?: vscode.Selection) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    selection = selection || editor.selection;
    editor.edit((editBuilder) => {
        editBuilder.replace(selection!, text);
    });
}

export async function showPrompt(options: vscode.InputBoxOptions) {
    return await vscode.window.showInputBox(options) || '';
}

export function moveCursorToTheEndOfLine() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log("No active editor found.");
        return;
    }
    let selection = editor.selection;

    // Get the current position of the cursor
    let currentPosition = selection.active;

    // Create a new position one line down
    let newPosition = new vscode.Position(currentPosition.line, 10000);

    // Select the new position
    editor.selection = new vscode.Selection(newPosition, newPosition);
}

export function getNextLine() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log("No active editor found.");
        return;
    }
    let selection = editor.selection;

    // Get the current position of the cursor
    let currentPosition = selection.active;

    // Create a new position one line down
    return new vscode.Position(currentPosition.line + 1, 0);
}

export function moveCursorToNextLine() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log("No active editor found.");
        return;
    }

    let newPosition = getNextLine();
    if (newPosition) {
        // Select the new position
        editor.selection = new vscode.Selection(newPosition, newPosition);
    }
}

export function moveCursorToEndOfLine() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log("No active editor found.");
        return;
    }
    let position = editor.selection.active;
    let line = editor.document.lineAt(position);
    let newPosition = new vscode.Position(position.line, line.range.end.character);
    editor.selection = new vscode.Selection(newPosition, newPosition);
}

export function getCurrentLineOffset() {
    let editor = vscode.window.activeTextEditor;
    let position = editor!.selection.active;
    let currentLine = editor!.document.lineAt(position).text;
    return currentLine.match(/^\s*/)[0];
}

export function moveCursorToStartOfNextLine() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log("No active editor found.");
        return;
    }
    let whitespace = getCurrentLineOffset();
    let position = editor.selection.active;
    let newPosition = new vscode.Position(position.line + 1, whitespace.length);
    editor.selection = new vscode.Selection(newPosition, newPosition);
}

export function insertCharacter(value: string) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log("No active editor found.");
        return;
    }
    let position = editor.selection.active;
    editor.edit(builder => {
        builder.insert(position, value);
    }, { undoStopBefore: false, undoStopAfter: false });
}

export function getCurrentLine() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log("No active editor found.");
        return;
    }
    let selection = editor.selection;
    return editor.document.lineAt(selection.active.line)
}

export function getCurrentLineText() {
    return getCurrentLine()?.text;
}

export function isCursorInComment(language: string = 'JavaScript') {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log("No active editor found.");
        return;
    }
    let cursorPos = editor.selection.active;
    let document = editor.document;
    let lineIndex = cursorPos.line;

    let currentLine = document.lineAt(lineIndex);
    let text = currentLine.text;

    const startSingle = ['//'];

    if (startSingle.find(s => text.startsWith(s))) {
        return true;
    }


    const start = ['/*'];
    const stop = ['*/'];

    while (lineIndex >= 0) {
        let line = document.lineAt(lineIndex);
        let text = line.text.trim();

        if (start.find(s => text.startsWith(s))) {
            return true;
        }

        if (stop.find(s => text.endsWith(s))) {
            if (currentLine.lineNumber === lineIndex) {
                return true;
            } else {
                return false;
            }
        }

        const result = getTextAround(
            text,
            lineIndex == currentLine.lineNumber ? cursorPos.character : Math.floor(text.length / 2),
            stop,
            start,
        );

        if (result.findBefore) {
            return false;
        }

        lineIndex--;
    }

    return false;
}

export function getCurrentCommentBlock() {
    const text = getCurrentLineText();
    if (text) {
        return text.trim().startsWith('//') ? text : '';
    }
    return '';


    // let editor = vscode.window.activeTextEditor;
    // if (!editor) {
    //     console.log("No active editor found.");
    //     return '';
    // }
    // let cursorPos = editor.selection.active;
    // let document = editor.document;
    // let text = document.getText();
    // let position = document.offsetAt(cursorPos);

    // if (isCursorInComment()) {
    //     return getComment(text, position);
    // }

    // return '';
}

function getComment(text: string, position: number) {
    const multiResult = getTextAround(
        text,
        position,
        ['/*'],
        ['*/']
    );

    if (multiResult.findBefore && multiResult.findAfter) {
        return multiResult.before + multiResult.after;
    }

    const result = getTextAround(
        text,
        position,
        ['//'],
        [/^\n(?!.*\/\/)/]
    );

    if (result.findBefore) {
        return result.before + result.after;
    }

    return '';
}

export function getTextAround(text: string, cursorPos: number, beforeStopChars: (string | RegExp)[], afterStopChars: (string | RegExp)[], props?: { breakOnBefore: boolean }): { before: string, findBefore: boolean, after: string, findAfter: boolean } {
    let before = "";
    let after = "";

    let beforeStop = false;
    for (let i = cursorPos - 1; i >= 0; i--) {
        beforeStopChars.forEach(stopSeq => {
            if (typeof stopSeq === 'string' && getSubstring(text, i - stopSeq.length, i) === stopSeq) {
                beforeStop = true;
            } else if (stopSeq instanceof RegExp && stopSeq.test(text.substring(0, i))) {
                beforeStop = true;
            }
        });

        before = text[i] + before;
        if (beforeStop) {
            break;
        }
    }

    let afterStop = false;
    if (!(props?.breakOnBefore && beforeStop)) {
        for (let i = cursorPos; i < text.length; i++) {
            afterStopChars.forEach(stopSeq => {
                if (typeof stopSeq === 'string' && text.substring(i, i + stopSeq.length) === stopSeq) {
                    afterStop = true;
                } else if (stopSeq instanceof RegExp && stopSeq.test(text.substring(i, text.length))) {
                    afterStop = true;
                }
            });
            if (afterStop) {
                break;
            }
            after += text[i];
        }
    }

    return { before, findBefore: beforeStop, after, findAfter: afterStop };
}



function getSubstring(str: string, start: number, end?: number): string {
    // handle negative indexes
    if (start < 0) {
        start = start;
        end = start * -1;
        start = 0;
    }

    // use built-in substring method with adjusted indexes
    return str.substring(start, end);
}

export function getAbsolutePosition(cursorPos: vscode.Position) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log("No active editor found.");
        return -1;
    }

    let document = editor.document;

    return document.offsetAt(cursorPos)
}


