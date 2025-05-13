declare module '@/lib/docs-content' {
  export interface DocContentBase {
    type: string;
    title?: string;
    text?: string;
    items?: string[];
    code?: string;
    language?: string;
    headers?: string[];
    rows?: string[][];
  }

  export interface DocContentHeading extends DocContentBase {
    type: 'heading';
    title: string;
  }

  export interface DocContentSubheading extends DocContentBase {
    type: 'subheading';
    title: string;
  }

  export interface DocContentList extends DocContentBase {
    type: 'list';
    items: string[];
  }

  export interface DocContentNumberedList extends DocContentBase {
    type: 'numbered-list';
    items: string[];
  }

  export interface DocContentCode extends DocContentBase {
    type: 'code';
    code: string;
    language?: string;
  }

  export interface DocContentNote extends DocContentBase {
    type: 'note';
    title: string;
    text: string;
  }

  export interface DocContentWarning extends DocContentBase {
    type: 'warning';
    title: string;
    text: string;
  }

  export interface DocContentTable extends DocContentBase {
    type: 'table';
    headers: string[];
    rows: string[][];
  }

  export type DocContent = string | DocContentHeading | DocContentSubheading | DocContentList | 
                          DocContentNumberedList | DocContentCode | DocContentNote | 
                          DocContentWarning | DocContentTable;

  export interface DocItem {
    id: string;
    title: string;
    description?: string;
    content: DocContent[];
  }

  export interface DocSection {
    id: string;
    title: string;
    items: DocItem[];
  }

  export const docSections: DocSection[];
}