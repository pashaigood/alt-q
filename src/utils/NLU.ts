export function isQuestion(sentence: string): boolean {
    const questionWords = ["what", "why", "how", "is", "are", "do", "did", "does", "can", "could", "will", "would"];
    const firstWord = sentence.split(" ")[0].toLowerCase();

    return sentence.endsWith("?") || questionWords.includes(firstWord);
}