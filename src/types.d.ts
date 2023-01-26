export interface TemplateParams {
    command: string;
    prefix: string;
    separator: string;
}

export interface ApiContext {
    file: string,
    fileContent: string,
    cursor?: { start: number, end: number }
}