// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getOpenAIAPIResponse } from './api';
import Deferred from './Deferred';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('hello-next.helloWorld', () => {
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

		const model = 'text-davinci-003'//'text-davinci-003';//'text-davinci-002'
		// const model = 'code-davinci-002'//'text-davinci-003';//'text-davinci-002'
		// 		const prompt = 
		// `
		// You a coder helper, that write all required code.
		// Current file name is ${fileName.split("\\").pop()}.
		// The programming language is typescript.
		// '''
		// // Write a hello world.
		// '''
		// function HelloWorld() {
		// 	console.log("Hello, world")
		// }
		// '''
		// ${selectedText}
		// `;
		const promnt = selectedText;

		vscode.window.showInputBox({
			placeHolder: 'Type something',
			prompt: 'This is a prompt'
		}).then(val => {
			if (val) {
				vscode.window.showInformationMessage(val);
			}
		});

		(async () => {
			freez(editor);
			try {
				await getOpenAIAPIResponse(promnt, model).then(res => {
					let editor = vscode.window.activeTextEditor;
					if (!editor) {
						return;
					}

					let selection = editor.selection;

					// Get the current selection

					// Insert the text "Hello, World!" at the current selection
					editor.edit(function (editBuilder) {
						editBuilder.replace(selection, res);
						// editBuilder.insert(selection.start, "Hello, World!");
					});
				})
			} catch (e) {
				vscode.window.showErrorMessage(e.message);
			}
			unfreez(editor);
		})();
	});

	context.subscriptions.push(disposable);
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
	editor.options = {
		// readOnly: true,
		cursorStyle: vscode.TextEditorCursorStyle.Block
	};

	// Show a loading indicator
	loadingIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	loadingIndicator.text = 'Code generation...';
	loadingIndicator.backgroundColor = 'green';
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
	editor.options = {
		// readOnly: false,
		cursorStyle: vscode.TextEditorCursorStyle.Line
	};

	// Hide the loading indicator
	loadingIndicator?.hide();
	animation.stop();
	processDefer?.resolve(undefined);
}

