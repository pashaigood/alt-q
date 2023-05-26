import { readFileSync } from "fs";

export function convertToHtmlCode(str: string): string {
    const specialChars: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, (char) => specialChars[char]);
}

export function convertFromHtmlCode(str: string): string {
    const htmlCodes: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
    };
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, (code) => htmlCodes[code]);
}

type ResourceMapper = (url: string) => string;

export function mapExternalResources(
    htmlFilePath: string,
    mapper: ResourceMapper
): string {
    // Read the HTML file
    const html = readFileSync(htmlFilePath, 'utf-8');

    // Regular expressions for finding src and href attributes
    const srcRegExp = /src\s*=\s*["']([^"']+)["']/g;
    const hrefRegExp = /href\s*=\s*["']([^"']+)["']/g;

    // Function to replace attribute values with the result of the mapper function
    function replacer(match: string, url: string): string {
        return match.replace(url, mapper(url));
    }

    // Replace src and href attribute values using the mapper function
    const resultHtml = html
        .replace(srcRegExp, replacer)
        .replace(hrefRegExp, replacer);

    return resultHtml;
}