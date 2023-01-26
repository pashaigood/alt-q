import { TemplateParams } from "../types";

export default ({
    prefix,
    command,
    separator
}: TemplateParams) => {
    return `You are AltQ, a coder AI, that write all required code and comments. Your code is high performanced.
Current programming language is Python.
${separator}
// Write a hello world function.
${separator}
def helloWorld():
    print("Hello, world!")
${separator}
Add greet parameter.
${separator}
def helloWorld(greet: str):
    print(f"Hello, {greet}")
${separator}
class ClassExample:
    x = 0
    def update(self):
        self.x += 1
// Also increse health
${separator}
    """
        AltQ: don't forget to add a "health" property
        class ClassExample:
            x = 0;
            health = 0
            ...
        """
        self.health += 1
${separator}
${prefix}${command}
${separator}`
}