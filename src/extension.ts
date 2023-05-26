// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { writeCode, askQuestion } from './api';
import StringBuffer from './classes/StringBuffer';
import Deferred from './Deferred';
import { removeCommentStart } from './utils/code';
import { disableAutoClosingTags, getConfig, restoreAutoClosingTags, updateConfig } from './utils/config';
import detectLanguage from './utils/detectLanguage';
import { detectDocumentLanguage, getAbsolutePosition, getCurrentCommentBlock, moveToNextLineIfCurrentNotEmpty, putText, showPrompt } from './utils/editor';
import { isQuestion } from './utils/NLU';
import Sidebar from './panels/Sidebar';
import RequestContext from './panels/RequestContext';
import LastRequest, { LastRequest as TLastRequest } from './panels/LastRequest';
import env from './constants/env';
import activeFile from './services/activeFile';
import { extractImportsAndRequires, getCurrentDocumentRelativePath } from './utils/fileDeps';
import dataEvent from './events/DataEvent';
import './store';
import { selectFiles } from './features/fileStore';
import store from './store';
import { getAbsolutePathFromFile, resolveFile } from './utils/fileSystem';
import { ApiContext } from './types';
import storeStorage from './services/storeStorage';
import deps from './services/deps';
import plugin from './services/plugin';

let MODE: 'test' | 'dev' | 'production' = 'production';

let lastRequestPanel: TLastRequest;

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('alt-q.altQ', async () => {
		await actionAltQ(context);
	});

	if (context.extensionMode === vscode.ExtensionMode.Development) {
		env.DEV = true;
	} else if (context.extensionMode === vscode.ExtensionMode.Test) {
		MODE = 'test';
	}

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('alt-q.altQDeep', async () => {
		await actionAltQ(context);
	});

	Sidebar.register(context);
	lastRequestPanel = LastRequest.register(context);
	RequestContext.register(context);

	storeStorage.activate(context);

	deps.activate(context);

	plugin.activate();
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

	// Get the current text editor
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	// Get the current selection
	let selection = editor.selection;

	let selectedText = editor.document.getText(selection);

	let fileName = editor.document.fileName;

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


		const deps = selectFiles(
			store.getState().fileStore,
			getCurrentDocumentRelativePath(editor.document)
		)

		const resolve = plugin(detectDocumentLanguage(true)).deps.resolve;

		const depends = (
			deps
				.filter(d => d.enabled)
				.map(filePath => getAbsolutePathFromFile(editor!.document, filePath.value))
				.filter(Boolean) as string[]
		)
			.map(resolve)
			.filter(Boolean) as string[];

		const apiContext: ApiContext = {
			environment: {
				depends: Array.from(new Set(depends))
			},
			file: fileName,
			fileContent: editor.document.getText(),
			cursor
		};


		if (selection.isEmpty) {
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
					await action(prompt, model, apiContext, (data) => {
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
				const result = await action(prompt, model, apiContext, undefined, axiosParams) || '';
				moveToNextLineIfCurrentNotEmpty();
				lastRequestPanel.updateHistory(prompt, result);
				putText(result, selection);
			}
		} else {
			const result = (await action(prompt, model, apiContext, undefined, axiosParams) || '').trim();
			lastRequestPanel.updateHistory(prompt, result);
			putText(result, selection);
		}
	} catch (e) {
		vscode.window.showErrorMessage((e as Error).message);
	}
	unfreez();
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

