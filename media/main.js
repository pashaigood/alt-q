const vscode = acquireVsCodeApi();

const oldState = vscode.getState() || { items: [] };

/** @type {Array<{ id: number, text: string, result?: string }>} */
let items = oldState.items;

const hisotryList = document.getElementById('history');

// Handle messages sent from the extension to the webview
window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
        case 'updateHistory':
            {
                items = message.data;
                vscode.setState({ items });
                updateHistory();
                break;
            }
    }
});

function updateHistory() {

    const html = items.map(i => `
    <div id=${i.id}>
        <h3>Request:</h3>
        <pre>${i.text}</pre>
        <h3>Response:</h3>
        <pre>${i.result ? i.result : '...'}</pre>
    </div>
    `);

    hisotryList.innerHTML = html
}