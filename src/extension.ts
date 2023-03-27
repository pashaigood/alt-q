// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { writeCode, askQuestion } from './api';
import StringBuffer from './classes/StringBuffer';
import Deferred from './Deferred';
import { removeCommentStart } from './utils/code';
import { disableAutoClosingTags, getAutoClosingTags, getConfig, restoreAutoClosingTags, updateConfig } from './utils/config';
import detectLanguage from './utils/detectLanguage';
import { getAbsolutePosition, getCurrentCommentBlock, getCurrentLineOffset, getCurrentLineText, getNextLine, getTextAround, insertCharacter, moveCursorToEndOfLine, moveCursorToNextLine, moveCursorToStartOfNextLine, moveCursorToTheEndOfLine, moveToNextLineIfCurrentNotEmpty, putText, showPrompt } from './utils/editor';
import { isQuestion } from './utils/NLU';
import Sidebar from './panels/Sidebar';
import LastRequest, { ColorsViewProvider } from './panels/LastRequest';


let MODE: 'test' | 'dev' | 'production' = 'production';

let lastRequestPanel: ColorsViewProvider;

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('alt-q.altQ', async () => {
		await actionAltQ(context);
	});

	if (context.extensionMode === vscode.ExtensionMode.Development) {
		MODE = 'dev';
	} else if (context.extensionMode === vscode.ExtensionMode.Test) {
		MODE = 'test';
	}

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('alt-q.altQDeep', async () => {
		await actionAltQ(context);
	});

	Sidebar.register(context);
	lastRequestPanel = LastRequest.register(context);
}


async function actionAltQ(context: vscode.ExtensionContext) {
	if (getConfig().apiKey) {
		await runAltQ(context);
	} else {
		const key = await showPrompt({
			title: "Please, provide you api key first."
		});
		await updateConfig('apiKey', key);
		if (key?.length) {
			await actionAltQ(context);
		}
	}
}

const runAltQ = async (context: vscode.ExtensionContext) => {
	// The code you place here will be executed every time your command is executed
	// Display a message box to the user
	// vscode.window.showInformationMessage('Hello World from hello-next!');

	// Get the current text editor
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	// showPanel(context);

	// Get the current selection
	let selection = editor.selection;

	let selectedText = editor.document.getText(selection);

	let fileName = editor.document.fileName;
	// console.log(vscode.workspace.workspaceFolders, editor.document);

	// console.log(editor.document.getText());

	const promptTitle = 'Enter Prompt'
	const model = 'text-davinci-003';
	let prompt = selectedText.trim();
	let initialPrompt = prompt;

	let comment = getCurrentCommentBlock();
	let cursor = {
		start: getAbsolutePosition(selection.start),
		end: getAbsolutePosition(selection.end)
	};

	if (comment && selectedText) {
		prompt = prompt;
		cursor = undefined!;
	} else if (comment && !selectedText) {
		prompt = removeCommentStart(comment.trim(), detectLanguage(fileName));
		initialPrompt = prompt;
		cursor = undefined!;
	} else if (!comment && selectedText) {
		const input = await showPrompt({
			title: promptTitle
		}) || '';

		if (input) {
			initialPrompt = input;
			prompt = prompt + "\n" + input;
		} else {
			prompt = '';
		}
	} else if (!selectedText) {
		prompt = await showPrompt({
			title: promptTitle
		});
		initialPrompt = prompt;
	}

	if (prompt.length === 0) {
		return;
	}

	lastRequestPanel.updateHistory(prompt);

	prompt = prompt.replace(/\r/g, '');

	// try {

	// 	const autoClosingTagSettings = await disableAutoClosingTags();

	// 	editor!.edit(builder => {
	// 		let editor = vscode.window.activeTextEditor;
	// 		let position = editor!.selection.active;
	// 		builder.replace(position, '<div>');
	// 	}, { undoStopBefore: false, undoStopAfter: false });

	// 	console.log(autoClosingTagSettings);

	// 	await restoreAutoClosingTags(autoClosingTagSettings);
	// } catch (e) {
	// 	console.log(e);
	// }

	const controller = new AbortController();
	freez({
		onCancel() {
			controller.abort();
		}
	});
	try {
		const action = isQuestion(prompt) ? askQuestion : writeCode;
		const axiosParams = {
			signal: controller.signal
		};

		if (selection.isEmpty) {
			const contenxt = {
				file: fileName,
				fileContent: editor.document.getText(),
				cursor
			};
			if (getConfig().streamRequest) {
				const autoClosingTagSettings = await disableAutoClosingTags();
				moveToNextLineIfCurrentNotEmpty();
				const stringStream = new StringBuffer((data: string) => {
					let editor = vscode.window.activeTextEditor;
					let position = editor!.selection.active;
					editor!.edit(builder => {
						builder.insert(position, data);
					}, { undoStopBefore: false, undoStopAfter: false });
				}, 30);

				try {
					await action(prompt, model, contenxt, (data) => {
						stringStream.addData(data);
					}, axiosParams);
				} catch (e) {
					console.error(e);
					throw e;
				} finally {
					lastRequestPanel.updateHistory(prompt, stringStream.getData());
					stringStream.close();
					await restoreAutoClosingTags(autoClosingTagSettings);
				}
			} else {
				const result = await action(prompt, model, contenxt, undefined, axiosParams);
				moveToNextLineIfCurrentNotEmpty();
				lastRequestPanel.updateHistory(prompt, result);
				putText(result, selection);
			}
		} else {
			const result = (await action(prompt, model, {
				file: fileName,
				fileContent: editor.document.getText(),
				cursor
			}, undefined, axiosParams)).trim();
			lastRequestPanel.updateHistory(prompt, result);
			putText(result, selection);
		}

		// const res = await writeCode(prompt, model, {
		// 	file: fileName,
		// 	fileContent: editor.document.getText(),
		// 	cursor
		// });
		// if (!selection.isEmpty) {
		// 	putText(res.trim(), selection);
		// } else {
		// 	moveCursorToTheEndOfLine();
		// 	let whitespace = getCurrentLineOffset();
		// 	insertCharacter("\n" + whitespace)
		// 	await delay(30);

		// 	await typeText2(res.trim() + "\n").defer;
		// }
	} catch (e) {
		vscode.window.showErrorMessage((e as Error).message);
	}
	unfreez();
}

const showPanel = (context: vscode.ExtensionContext) => {
	let panel = vscode.window.createWebviewPanel(
		'sidePanel',
		'My Side Panel',
		vscode.ViewColumn.Beside,
		{
			enableScripts: true
		}
	);

	panel.webview.html = `<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource:; script-src vscode-resource:;">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>My Side Panel</title>
		<script defered type="text/javascript">
		let value = 1;
		document.getElementById('point').innerHTML = 1;

		setInterval(() => {
			document.getElementById('point').innerHTML = value;
			value ++;
		}, 1000);
		</script>
	</head>
	<body>
		<h1>Hello from the side panel!</h1>
		<div id="point">0</div>
		let value = 1;
		document.getElementById('point').innerHTML = 1;

		setInterval(() => {
			document.getElementById('point').innerHTML = value;
			value ++;
		}, 1000);
	</body>
	</html>`;
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

function freez({
	onCancel
}: { onCancel?: () => any }) {
	// Show a loading indicator
	loadingIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	loadingIndicator.text = 'Code generation...';
	loadingIndicator.show();

	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		// title: "Code generation...",
		cancellable: true,
	}, (progress, token) => {
		processDefer = new Deferred();

		token.onCancellationRequested(() => {
			onCancel?.();
		});

		animation = new DotElapsingAnimation((state) => {
			progress.report({ message: 'Code generation' + state })
		});
		animation.start();
		return processDefer.promise;
	});
}

function unfreez() {
	// Hide the loading indicator
	loadingIndicator?.hide();
	animation.stop();
	processDefer?.resolve(undefined);
}

