import { resolveFile } from "../../utils/fileSystem";

function removeComments(fileContent: string): string {
  const singleLineCommentRegex = /\/\/.*$/gm;
  const multiLineCommentRegex = /\/\*[\s\S]*?\*\//gm;

  const cleanedContent = fileContent
    .replace(singleLineCommentRegex, '')
    .replace(multiLineCommentRegex, '');

  return cleanedContent;
}

export function get(fileContent: string): string[] {
  const cleanedContent = removeComments(fileContent);

  const importRegex = /import(?:["'\s]*[\w*${}\n\r\t, ]+from\s*)?["']([^"']+)["'];\n?/g;
  const requireRegex = /const(?:["'\s]*[\w*${}\n\r\t, ]+)=\s*require\(["']([^"']+)["']\);\n?/g;

  const importMatches = Array.from(cleanedContent.matchAll(importRegex));
  const requireMatches = Array.from(cleanedContent.matchAll(requireRegex));

  const importsAndRequires = importMatches.concat(requireMatches);

  const result = new Set(importsAndRequires.map((match) => match[1]));
  return Array.from(result);
}

export function resolve(fileName: string) {
  return resolveFile(fileName);
}