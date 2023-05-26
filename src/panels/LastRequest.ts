import * as vscode from 'vscode';
import path, { resolve } from 'path';
import env from '../constants/env';
import { convertToHtmlCode, mapExternalResources } from '../utils/html';

function register(context: vscode.ExtensionContext): LastRequest {
  const sideBar = new LastRequest(context.extensionUri);

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(LastRequest.viewType, sideBar));

  return sideBar;
}

type HistoryItem = { id: number, text: string, result?: string };

export class LastRequest implements vscode.WebviewViewProvider {

  public static readonly viewType = 'alt-q.history';

  public view?: vscode.WebviewView;

  private history: HistoryItem[] = [
    {
      id: 0,
      text: '...',
      result: '...'
    }
  ];

  public apiProvider = createApi({
    history: {
      get: () => this.history[0] ? [this.history[0]] : [],
      changed: () => this.apiProvider.history.get()
    }
  }, this)

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        this._extensionUri
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // const apiProvider = provideApi({
    //   history: {
    //     get: () => this.history[0] ? [this.history[0]] : [],
    //     changed: () => { /* This function is intentionally left blank as it is used for subscription */ },
    //   },
    // });


    webviewView.webview.onDidReceiveMessage(data => {
      processRequest(data, this);

      switch (data.type) {
        case 'getHistory':
          {
            this.view?.webview.postMessage({ type: 'updateHistory', payload: this.history[0] ? [this.history[0]] : [] });
            break;
          }
      }
    });
  }

  public updateHistory(text: string, result?: string) {
    if (this.view) {
      this.history.unshift({ id: 1, text: text, result: result });
      // this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders

      this.apiProvider.history.changed();
      this.view.webview.postMessage({ type: 'updateHistory', payload: [this.history[0]] });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    let resultHtml = '';

    if (env.DEV) {
      try {
        resultHtml = mapExternalResources(
          resolve(__dirname, '../../client/build/index.html'),
          url => 'http://localhost:1234' + url
        )
      } catch (e) {
        console.error(e);
        return '';
      }
    }

    resultHtml = mapExternalResources(
      resolve(__dirname, '../../client/build/index.html'),
      url => webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'client/build', url)).toString()
    );

    return resultHtml.replace('%APP%', 'LastRequest');
  }
}

function createApi(api: any, context: LastRequest) {
  return (
    new Proxy(api, {
      get: (target, prop) => {
        const obj = target[prop];
        if (typeof obj === 'object') {
          return new Proxy(obj, {
            get: (innerTarget, innerProp) => {
              if (innerProp === 'changed') {
                return (...args: any[]) => {
                  const payload = innerTarget[innerProp].apply(context, args);
                  context.view?.webview.postMessage({ type: `${prop.toString()}.${innerProp}`, payload })
                };
              }

              return innerTarget[innerProp];
            },
          });
        }
        return obj;
      },
    })
  )
}


function processRequest(data: { type: string, id: number, args: any[] }, context: LastRequest) {
  const [namespace, functionName] = data.type.split('.');
  if (namespace && functionName) {

    const apiFunction = context.apiProvider[namespace]?.[functionName];
    if (apiFunction) {
      const payload = apiFunction(...(data.args || []));
      context.view?.webview.postMessage({ type: data.type, id: data.id, payload });
    }
  }
}

export default {
  register
};