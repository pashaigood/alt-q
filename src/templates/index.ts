import { TemplateParams } from '../types';
import TypeScript from './typescript';
import Python from './python';

const templates: Record<string, (params: TemplateParams) => string> = {
    TypeScript,
    Python
}

export default templates;