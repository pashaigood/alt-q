import * as vscode from 'vscode';
import env from '../constants/env';
import { resolve } from 'path';
import { mapExternalResources } from '../utils/html';

export class Panel<T = Record<string, any>> implements vscode.WebviewViewProvider {
  protected readonly appName!: string;

  public view!: vscode.WebviewView;
  public api!: T

  constructor(private readonly _extensionUri: vscode.Uri) {

    setTimeout(() => {
      this.api = createApi(this.api, this as Panel) as T;
      this.activate();
    }, 0)
  }

  public activate(): void {

  }

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


    webviewView.webview.onDidReceiveMessage(data => {
      processRequest(data, this as Panel);
    });
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

    return resultHtml.replace('%APP%', this.appName);
  }
}

function createApi(api: any, context: Panel) {
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
                  context.view.webview.postMessage({ type: `${String(prop)}.${innerProp}`, payload })
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

function processRequest(data: { type: string, id: number, args: any[] }, context: Panel) {
  const [namespace, functionName] = data.type.split('.');
  if (namespace && functionName) {

    const apiFunction = context.api[namespace]?.[functionName];
    if (apiFunction) {
      const payload = apiFunction(...(data.args || []));
      context.view?.webview.postMessage({ type: data.type, id: data.id, payload });
    }
  }
}
