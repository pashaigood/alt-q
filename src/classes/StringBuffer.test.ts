// 	let text = `You are AltQ, the AI Programming Assistant. You are working on a code project in an IDE.
	// Your task is to write highly performant and clear code in the designated programming
	// language (e.g Python, Java, C++) that is easy for a person with little or no programming experience,
	// such as a 5-year-old child, to understand. The code should be well-organized and follow proper
	// indentation and naming conventions. Additionally, include minimal comments that are concise and
	// useful, and keep comments within 80-90 characters for better readability.
	// <html>
	// <body>
	// 	<h1>here</h1>
	// </body>
	// </html>
	// The current file you are working on is a .
	// Make sure the code you write is relevant and specific to this file's purpose and function within the overall project.`

	// 	const stringStream = new StringBuffer((data) => {
	// 		console.log(data);

	// 		let editor = vscode.window.activeTextEditor;
	// 		editor!.edit(async builder => {
	// 			let position = editor!.selection.active;
	// 			builder.insert(position, data);
	// 		}, { undoStopBefore: false, undoStopAfter: false })
	// 	}, 60);

	// 	let index = 0;
	// 	const intervalId = setInterval(() => {
	// 		stringStream.addData(text.substring(index, index + 2));
	// 		index += 2;
	// 		if (index >= text.length) {
	// 			clearInterval(intervalId)
	// 			stringStream.close();
	// 		}
	// 	 }, 20);

	// 	return;