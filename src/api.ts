// import axios from 'axios';

import detectLanguage from "./detectLanguage";

// export async function getOpenAIAPIResponse(prompt: string, model: string, apiKey: string): Promise<string> {
//     const apiUrl = `https://api.openai.com/v1/engines/${model}/completions`;
//     const apiHeaders = {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${apiKey}`
//     }
//     const apiBody = {
//         prompt: prompt,
//         max_tokens: 1000
//     }

//     const json = await axios.post(apiUrl, apiBody, {headers: apiHeaders});
//     console.log(json);

//     return 'tmp'
//     // return json.choices[0].text;
// }


const { Configuration, OpenAIApi } = require("openai");
const apiKey = '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'

const configuration = new Configuration({
  apiKey: apiKey//process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function getOpenAIAPIResponse(command: string, model: string, context: {
  file: string,
  fileContent: string,
  cursor?: { start: number, end: number }
}) {

  let [prefix, suffix] = context.fileContent.split(command);

  if (context.cursor) {
    prefix = context.fileContent.substring(0, context.cursor.start);
    suffix = context.fileContent.substring(context.cursor.end, context.fileContent.length)
  }

  let prompt =
    `You are AltQ, a coder AI, that write all required code. Your code is high performanced and clear and withou comments.
Current programming language is ${detectLanguage(context.file)}.
'''
// Write a hello wolrd function.
'''
function helloWorld() {
  console.log("Hello, world!");
}
'''
Add greet paramter.
'''
function helloWorld(greet: string) {
  console.log(\`Hello, \${greet}\`);
}
'''
${prefix}${command}
'''`;

  console.log(command);
  console.log("Prompt length", prompt.length);
  console.log(prompt);
  console.log(suffix);

  // return '';

  const { data, ...rest } = await openai.createCompletion({
    model: model,
    prompt: prompt,
    suffix: suffix,
    // prompt: prompt + "\n'''typescript:\n",
    // temperature: 0,
    // max_tokens: 1000,
    // top_p: 1,
    // frequency_penalty: 0,
    // presence_penalty: 0,

    // suffix: "\n",
    // temperature: 0,
    // max_tokens: 450,
    // top_p: 1,
    // frequency_penalty: 0,
    // presence_penalty: 0,
    // stop: ["\"\"\""],

    // prompt: "1. Create a list of first names\n2. Create a list of last names\n3. Combine them randomly into a list of 100 full names\n\"\"\"\n",
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ["'''"],
  });

  console.log(data, rest);

  return data.choices[0].text.trim();
}

export async function getPlaygroundModel(request: string) {

  const preposition = "<|endoftext|>/* I start with a blank HTML page, and incrementally modify it via <script> injection. Written for Chrome. */\n/* Command: Add \"Hello World\", by adding an HTML DOM node */\nvar helloWorld = document.createElement('div');\nhelloWorld.innerHTML = 'Hello World';\ndocument.body.appendChild(helloWorld);\n/* Command: Clear the page. */\nwhile (document.body.firstChild) {\n  document.body.removeChild(document.body.firstChild);\n}\n\n";

  const prompt = preposition + `/* Command: ${request} */\n`

  console.log(prompt);

  try {
    const resounse = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: 'Please complete the following sentence: "I am feeling _____."',
      temperature: 0.5,
      stream: true
    }, { responseType: 'stream' })

    resounse.data.on("data", (...rest: any[]) => {
      console.log(rest.toString());
    });
  } catch (e) {
    console.log(e);
  }


  return '';
  // return resounse.data.choices[0].text;
}


