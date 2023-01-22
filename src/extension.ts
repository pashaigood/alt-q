// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getOpenAIAPIResponse, getPlaygroundModel } from './api';
import Deferred from './Deferred';
import { getAbsolutePosition, getCurrentCommentBlock, getCurrentLineOffset, getNextLine, getTextAround, insertCharacter, moveCursorToEndOfLine, moveCursorToNextLine, moveCursorToStartOfNextLine, moveCursorToTheEndOfLine, putText, showPrompt } from './utils/editor';
import { delay } from './utils/time';
import typeText, { typeText2 } from './utils/typing';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('pashaigood.alt-q.altQ', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from hello-next!');

		// Get the current text editor
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		// Get the current selection
		let selection = editor.selection;

		let selectedText = editor.document.getText(selection);
		let fileName = editor.document.fileName;

		// console.log(editor.document.getText());

		const model = 'text-davinci-003'
		// const model = 'code-davinci-002'
		let prompt = selectedText.trim();

		let comment = getCurrentCommentBlock();
		let cursor = {
			start: getAbsolutePosition(selection.start),
			end: getAbsolutePosition(selection.end)
		};

		if (comment && selectedText) {
			prompt = prompt;
			cursor = undefined!;
		} else if (comment && !selectedText) {
			prompt = comment.trim();
			cursor = undefined!;
		} else if (!comment && selectedText) {
			const input = await showPrompt({
				title: 'Enter prompt'
			}) || '';

			if (input) {
				prompt = prompt + "\n //" + input;
			} else {
				prompt = '';
			}
		} else if(!selectedText) {
			prompt = await showPrompt({
				title: 'Enter prompt'
			});
		}

		if (prompt.length === 0) {
			return;
		}

		freez(editor);
		try {
			const res = await getOpenAIAPIResponse(prompt, model, {
				file: fileName,
				fileContent: editor.document.getText(),
				cursor
			})

			if (!selection.isEmpty) {
				putText(res.trim(), selection);
			} else {
				moveCursorToTheEndOfLine();
				let whitespace = getCurrentLineOffset();
				insertCharacter("\n" + whitespace)
				await delay(30);
				
				await typeText2(res.trim() + "\n").defer;
			}
		} catch (e) {
			vscode.window.showErrorMessage((e as Error).message);
		}
		unfreez(editor);
	});

	context.subscriptions.push(disposable);

	let disposable2 = vscode.commands.registerCommand('quickInput.open', openQuickInput);
	context.subscriptions.push(disposable2);
}

function openQuickInput() {
	vscode.window.showInputBox({
		prompt: "Enter your desired input:"
	}).then(async input => {
		if (input) {
			const result = await getPlaygroundModel(input);

			const text = result;

			let editor = vscode.window.activeTextEditor;
			if (editor) {
				let selection = editor.selection;
				editor.edit(builder => {
					builder.replace(selection, text);
				});
			}
		}
	});
}


// This method is called when your extension is deactivated
export function deactivate() { }

class DotElapsingAnimation {
	private _intervalId!: NodeJS.Timer;
	private _state: string;
	private tick: (state: string) => void;

	constructor(tick: (state: string) => void) {
		this._state = ".";
		this.tick = tick;
	}

	start() {
		this.tick(this._state);

		this._intervalId = setInterval(() => {
			if (this._state === ".") {
				this._state = "..";
			} else if (this._state === "..") {
				this._state = "...";
			} else {
				this._state = ".";
			}

			this.tick(this._state);
		}, 1000);
	}

	stop() {
		clearInterval(this._intervalId);
	}
}

let loadingIndicator: vscode.StatusBarItem;
let processDefer: Deferred<undefined>;
let animation: DotElapsingAnimation;

function freez(editor: vscode.TextEditor) {
	// Disable user input
	// editor.options = {
	// 	// readOnly: true,
	// 	cursorStyle: vscode.TextEditorCursorStyle.Block
	// };

	// Show a loading indicator
	loadingIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	loadingIndicator.text = 'Code generation...';
	loadingIndicator.show();

	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		// title: "Code generation...",
		cancellable: false
	}, (progress, token) => {
		processDefer = new Deferred();

		animation = new DotElapsingAnimation((state) => {
			progress.report({ message: 'Code generation' + state })
		});
		animation.start();
		return processDefer.promise;
	});
}

function unfreez(editor: vscode.TextEditor) {
	// Enable user input
	// editor.options = {
	// 	// readOnly: false,
	// 	cursorStyle: vscode.TextEditorCursorStyle.Line
	// };

	// Hide the loading indicator
	loadingIndicator?.hide();
	animation.stop();
	processDefer?.resolve(undefined);
}

