export interface TemplateParams {
    command: string;
    prefix: string;
    separator: string;
}

export interface ApiContext {
    environment?: {
        depends: string[],
    },
    file: string,
    fileContent: string,
    cursor?: { start: number, end: number }
}

export type ExtansionConfiguration = {
    apiKey: string;
    streamRequest: boolean;
    useTheForce: boolean;
}

export type Plugin = {
    deps: {
        get: (fileContent: string) => string[],
        resolve: (filePath: string) => string | null
    }
};