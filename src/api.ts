// import axios from 'axios';

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

export async function getOpenAIAPIResponse(prompt: string, model: string) {

    console.log(prompt);

    prompt = 
`You a coder, that write all required code. Your code is high performanced and clear and withou comments.
The programming language is TypeScript.
'''
// Write a hello wolrd function.
'''
function helloWorld() {
  console.log("Hello, world!");
}
'''
${prompt}
'''`;
    
    const {data, ...rest} = await openai.createCompletion({
        model: model,
        prompt: prompt,
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

      return data.choices[0].text;
}


