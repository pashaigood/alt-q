import { CreateCompletionRequest, OpenAIApi, Configuration } from "openai";
import Deferred from "./Deferred";
import detectLanguage from "./utils/detectLanguage";
import { ApiContext } from "./types";
import { getConfig } from "./utils/config";
import { convertFromHtmlCode } from "./utils/html";
import { memoize } from "./utils/memo";
import { AxiosRequestConfig } from "axios";

export const SEPARATOR = "'''"//'⟱';
export const COMMAND = "Command: ";

function getBugSentence() {
  let prompt =
    `${SEPARATOR}${COMMAND}function generateColor(hue: number): number {
  const hueRange = [0, 360];
  const hueValue = Math.floor(Math.random() * (hueRange[1] - hueRange[0])) + hueRange[0];
  return hueValue;
}
${SEPARATOR}${COMMAND}You forget to use the hue parameter.
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
  return `${SEPARATOR}${COMMAND}how to use react? using TypeScript.
${SEPARATOR}/*
  AltQ:
  React is a JavaScript library for building user interfaces.
  It allows building reusable UI components and efficiently updating
  the UI in response to user interactions and data changes.
*/
${SEPARATOR}${COMMAND}how to create a shop using TypeScript.
${SEPARATOR}/*
  AltQ:
  1. Define a class for your products with properties such as name,
  price, and description.
  2. Create an array to store your products.
  3. Create a function to display your products and allow users to
  make purchases.
  4. Implement a shopping cart feature to keep track of the items
  in the user's cart.
  5. Use conditional statements to check if a product is in stock
  and update the product array when a purchase is made.
  6. Create a checkout function to calculate the total cost of
  the items in the cart.
  7. Use an HTML UI to display the
  products, shopping cart, and checkout process to the user.
*/`
}

function getApplyCode() {
  return `${SEPARATOR}
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
          obj.y += self.gravity`
}

export function getCommand(language: string, input: string) {
  return `${COMMAND}${input.replace(/\.$/, '')} using ${language}. Be brief and understandable`;
}

function getPreposition(context: ApiContext) {
  let VariantA = 'You are AltQ, the AI Programming Assistant. You are writing highly performant and clear code with minimal comments that are easy for a 5 year old to understand. Keep comments within 80-90 characters for better readability.';
  let VariantB = 'You are AltQ, the AI Programming Assistant. You are working on a code project in an IDE. Write highly performant and clear code with minimal comments that are easy for a 5 year old to understand. Keep comments within 80-90 characters for better readability. Also make sure that the code is well-organized and follows proper indentation and naming conventions.';
  let VariantC =
    `You are AltQ, the AI Programming Assistant. You are working on a code project in an IDE.
Your task is to write highly performant and clear code in the designated programming
language (e.g Python, Java, C++) that is easy for a person with little or no programming experience,
such as a 5-year-old child, to understand. The code should be well-organized and follow proper
indentation and naming conventions. Additionally, include minimal comments that are concise and
useful, and keep comments within 80-90 characters for better readability.
The current file you are working on is a ${context.file}.
Make sure the code you write is relevant and specific to this file's purpose and function within the overall project.`;
  let VariantD =
    `You are AltQ, the AI Programming Assistant.
You are using a computer program to write code for a project.
Your job is to help to code. The code should be clear, organized, and use simple words for a 5-year-old in comments.
The file you are working on now is ${context.file}.
Make sure the code you write is relevant to this file's job in the project.`
  const VariantE = `You are AltQ, a coder AI, that write all required code and comments. Your code is high performanced and clean.
The file you are working on now is ${context.file}`;
  return VariantE;
}

export async function askQuestion(command: string, model: string, context: ApiContext, onPortion?: (data: string) => any) {
  const {
    language,
    suffix,
    prefix
  } = getData(command, context);

  let prompt =
    `${getPreposition(context)}
${SEPARATOR}
${getQAndA()}
${SEPARATOR}
${prefix}
${SEPARATOR}${getCommand(language, command)}
Write answer as multi-line comment in TypeScript with max 80 char per line.
${SEPARATOR}`;

  const settings = {
    model: model,
    prompt: prompt,
    suffix: suffix,
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: [SEPARATOR, SEPARATOR + 'Command:'],
  };

  console.log(command);
  console.log("Prompt length", prompt.length);
  console.log(prompt);
  console.log(suffix);

  return doRequest(settings, onPortion);
}

export async function writeCode(command: string, model: string, context: ApiContext, onPortion?: (data: string) => any, axioParams?: AxisParams) {

  const {
    language,
    suffix,
    prefix
  } = getData(command, context);

  //   let prompt =
  //     `${getPreposition(context)}
  // ${SEPARATOR}${getCommand(language, 'Write a hello world function.')}
  // ${SEPARATOR}
  // function helloWorld(): void {
  //   console.log("Hello, World!");
  // }
  // ${getQAndA()}
  // ${SEPARATOR}
  // ${getBugSentence()}
  // ${SEPARATOR}
  // ${prefix}
  // ${SEPARATOR}${getCommand(language, command)}
  // ${SEPARATOR}`;

  let prompt =
    `${getPreposition(context)}
${SEPARATOR}${getCommand(language, 'Write a hello world function.')}
${SEPARATOR}
function helloWorld(): void {
  console.log("Hello, World!");
}
${SEPARATOR}
${prefix}
${SEPARATOR}${getCommand(language, command)}
${SEPARATOR}`;


  console.log(command);
  console.log("Prompt length", prompt.length);
  console.log(prompt);
  console.log(suffix);

  const settings = {
    model: model,
    prompt: prompt,
    suffix: suffix,
    temperature: 0,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: [SEPARATOR, SEPARATOR + 'Command:'],
  };

  return doRequest(settings, onPortion, axioParams);
}

type AxisParams = { signal: AxiosRequestConfig<any>['signal'] };

async function doRequest(settings: CreateCompletionRequest, onPortion?: (data: string) => any, axioParams?: AxisParams) {
  if (onPortion) {
    return await pullResult(settings, onPortion, axioParams);
  }

  const { data, ...rest } = await getResult(settings, axioParams);

  let response = data.choices[0].text;

  return convertFromHtmlCode(response || '').trim();
}

function getResult(params: CreateCompletionRequest, axioParams?: AxisParams) {
  const openai = createApi(getConfig().apiKey)!;

  return openai.createCompletion(params, axioParams);
}

async function pullResult(params: CreateCompletionRequest, onPartition: (part: string) => any, axioParams?: AxisParams) {
  const openai = createApi(getConfig().apiKey)!;
  const controller = new AbortController();
  const request = await openai.createCompletion({
    ...params,
     stream: true
  }, {
    responseType: 'stream',
    ...axioParams
  });
  const defer = new Deferred();

  request.data.on("data", (rest: Buffer) => {
    const result = rest.toString().replace('data: ', '').trim();
    // console.log(result);
    if (result === "[DONE]") {
      console.log('Finish');
      defer.resolve(undefined);
    } else {
      const data = JSON.parse(result);
      const text = data.choices[0].text;
      if (text === "\r") {
        return;
      }
      onPartition(data.choices[0].text);
    }
  });

  request.data.on('end', () => {
    defer.resolve(undefined);
    console.log('There will be no more data.');
  });

  request.data.on('error', (e: any) => {
    defer.reject(e);
    console.log('Data with error.', e);
  });

  await defer.promise;
  return '';
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
  const openai = createApi(getConfig().token)!;

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


