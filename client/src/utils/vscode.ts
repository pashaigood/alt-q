
const vscode = window.vscode = window.vscode ? window.vscode : window.acquireVsCodeApi()

let messageId = 0;

const postMessageAsync = (message: any) => {
  return new Promise((resolve) => {
    const currentMessageId = ++messageId;
    const eventHandler = (event: MessageEvent) => {
      if (event.data.type === message.type && event.data.id === currentMessageId) {
        window.removeEventListener('message', eventHandler);
        resolve(event.data.payload);
      }
    };

    window.addEventListener('message', eventHandler);
    vscode.postMessage({ ...message, id: currentMessageId });
  });
};

const subscribe = (type: string, callback: (payload: any) => void) => {
  const eventHandler = (event: MessageEvent) => {
    if (event.data.type === type) {
      callback(event.data.payload);
    }
  };

  window.addEventListener('message', eventHandler);
  return () => {
    window.removeEventListener('message', eventHandler);
  };
};

const apiHandler = {
  get: (target: any, namespace: string) => {
    if (typeof target[namespace] === 'undefined') {
      target[namespace] = new Proxy({}, {
        get: (_, functionName: string) => {
          if (functionName === 'changed') {
            return (callback: (payload: any) => void) => {
              return subscribe(`${namespace}.${functionName}`, callback);
            };
          }

          return async (...args: any[]) => {
            const message = {
              type: `${namespace}.${functionName}`,
              args,
            };
            return await postMessageAsync(message);
          };
        },
      });
    }
    return target[namespace];
  },
};

const api = new Proxy({}, apiHandler);

export {
  api,
  subscribe
}

export default vscode;