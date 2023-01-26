import detectLanguage from "./detectLanguage";
import templates from "./templates";
import { ApiContext } from "./types";
import { getConfig } from "./utils/config";
import { convertFromHtmlCode } from "./utils/html";
import { memoize } from "./utils/memo";

const { Configuration, OpenAIApi } = require("openai");

export const SEPARATOR = "'''"//'⟱';
export const COMMAND = "Command: ";

function getBugSentence() {
  let prompt =
    `${SEPARATOR}${COMMAND}function generateColor(hue: number): number {
  const hueRange = [0, 360];
  const hueValue = Math.floor(Math.random() * (hueRange[1] - hueRange[0])) + hueRange[0];
  return hueValue;
}
${SEPARATOR}
${COMMAND}You forget to use the hue parameter.
${SEPARATOR}// AltQ: You are right, that the fixed version.
function generateColor(hue?: number): number {
  const hueRange = hue || [0, 360];
  const hueValue = Math.floor(Math.random() * (hueRange[1] - hueRange[0])) + hueRange[0];
  return hueValue;
}
`;
  return prompt;
}

function getQAndA() {
  return `${SEPARATOR}${COMMAND}how to use react? using TypeScript
${SEPARATOR}/*
  AltQ:
  React is a JavaScript library for building user interfaces.
  It allows building reusable UI components and efficiently updating
  the UI in response to user interactions and data changes.
*/
${SEPARATOR}${COMMAND}how to create my own game server? using TypeScript
${SEPARATOR}/*
  AltQ:
  You can create your own game server using Node.js.
  Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine.
  It is used to build scalable network applications.
*/`
}

export async function writeCode(command: string, model: string, context: ApiContext) {
  const openai = createApi(getConfig().apiKey);

  const {
    language,
    suffix,
    prefix
  } = getData(command, context);

  const getCommand = (language: string, input: string) => `${COMMAND}${input} using ${language}.`;

  let VariantA = 'You are AltQ, the AI Programming Assistant. You are writing highly performant and clear code with minimal comments that are easy for a 5 year old to understand. Keep comments within 80-90 characters for better readability.';
  let VariantB = 'You are AltQ, the AI Programming Assistant. You are working on a code project in an IDE. Write highly performant and clear code with minimal comments that are easy for a 5 year old to understand. Keep comments within 80-90 characters for better readability. Also make sure that the code is well-organized and follows proper indentation and naming conventions.';
  let VariantC = `You are AltQ, the AI Programming Assistant. You are working on a code project in an IDE. Your task is to write highly performant and clear code in the designated programming language (e.g Python, Java, C++) that is easy for a person with little or no programming experience, such as a 5-year-old child, to understand. The code should be well-organized and follow proper indentation and naming conventions. Additionally, include minimal comments that are concise and useful, and keep comments within 80-90 characters for better readability. The current file you are working on is a ${context.file}. Make sure the code you write is relevant and specific to this file's purpose and function within the overall project.`;
  let VariatnD = `You are AltQ, the AI Programming Assistant. You are using a computer program to write code for a project. Your job is to help to code. The code should be clear, organized, and use simple words for a 5-year-old in comments. The file you are working on now is ${context.file}. Make sure the code you write is relevant to this file's job in the project.`
  let prompt =
    `<|endoftext|>${VariatnD}
${SEPARATOR}${getCommand(language, 'TypeScript. Write a hello world function.')}
${SEPARATOR}
function helloWorld(): void {
  console.log("Hello, World!");
}
${getQAndA()}
${SEPARATOR}
${getBugSentence()}
${SEPARATOR}
class Game:
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
${getCommand("Python", "add gravitaion")}
${SEPARATOR}
        self.gravity = 9.8
${SEPARATOR}
${getCommand("Python", "apply gravitation to all game objects.")}
${SEPARATOR}
    def apply_gravity(self):
      # AltQ: Don't forget to add the "objects" property.
      for obj in self.objects:
          obj.y += self.gravity
${SEPARATOR}
${prefix}
${SEPARATOR}${getCommand(language, command)}
${SEPARATOR}`;

  // prompt = templates[detectLanguage(context.file)]({
  //   separator,
  //   prefix,
  //   command
  // });

  console.log(command);
  console.log("Prompt length", prompt.length);
  console.log(prompt);
  console.log(suffix);


  const { data, ...rest } = await openai.createCompletion({
    model: model,
    prompt: prompt,
    suffix: suffix,
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: [SEPARATOR],
  });

  console.log(data, rest);

  let response = data.choices[0].text;

  return convertFromHtmlCode(response).trim();
}

function getData(command: string, context: ApiContext) {
  let [prefix, suffix] = context.fileContent.split(command);

  if (context.cursor) {
    prefix = context.fileContent.substring(0, context.cursor.start);
    suffix = context.fileContent.substring(context.cursor.end, context.fileContent.length)
  }

  const language = detectLanguage(context.file);

  return {
    prefix,
    suffix,
    language
  }
}

export async function getPlaygroundModel(request: string) {
  const openai = createApi(getConfig().token);

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

const createApi = memoize((apiKey) => {
  const configuration = new Configuration({
    apiKey: apiKey//process.env.OPENAI_API_KEY,
  });
  return new OpenAIApi(configuration);
});


