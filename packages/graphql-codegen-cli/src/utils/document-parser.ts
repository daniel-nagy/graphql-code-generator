import stripComments from './strip-comments';
import RegexMatch from './regex-match';

export class DocumentParser {
  private _fileChunks: string[] = [];
  private _lexemeRegex = /fragment|mutation|namespace|query|{|}/m;
  private _spacesRegex = /\s\s+/g;

  private static _balanceBraces(chunks: string[]): string[] {
    let braceCount = 0;

    const end = chunks.findIndex(token => {
      switch (token) {
        case DocumentParser.Token.LeftBrace:
          return ++braceCount === 0;
        case DocumentParser.Token.RightBrace:
          return --braceCount === 0;
        default:
          return false;
      }
    });

    if (end === -1) {
      throw new Error('Syntactical Error: Braces mismatch.');
    }

    return chunks.slice(0, end + 1);
  }

  constructor(fileText: string) {
    let text;

    try {
      text = stripComments(fileText, { sourceType: 'module' });
    } catch (exception) {
      try {
        text = stripComments(fileText);
      } catch (exception) {
        text = fileText;
      }
    }

    let regexMatch = new RegexMatch(text, this._lexemeRegex);

    while (regexMatch.isMatch) {
      if (regexMatch.start > 0) {
        const chunk = text.slice(0, regexMatch.start).trim();

        if (chunk.length) {
          this._fileChunks.push(chunk.replace(this._spacesRegex, ' '));
        }
      }

      this._fileChunks.push(regexMatch.match);

      text = text.slice(regexMatch.end);
      regexMatch = new RegexMatch(text, this._lexemeRegex);
    }

    if (text.length) {
      this._fileChunks.push(text.trim().replace(this._spacesRegex, ' '));
    }
  }

  getDocuments(namespace?: string, chunks?: string[]): DocumentParser.DocumentRef[] {
    if (!chunks) {
      return this.getDocuments('', this._fileChunks);
    }

    const documents = [];

    for (let it = 0; it < chunks.length; it++) {
      const token = chunks[it];

      switch (token) {
        case DocumentParser.Token.Namespace:
          const childNamespace = `${namespace && namespace + '.'}${chunks[++it]}`;
          const childBlock = DocumentParser._balanceBraces(chunks.slice(it));

          documents.push(...this.getDocuments(childNamespace, childBlock));
          it += childBlock.length;
          break;
        case DocumentParser.Token.Fragment:
        case DocumentParser.Token.Mutation:
        case DocumentParser.Token.Query:
          const documentBlock = DocumentParser._balanceBraces(chunks.slice(it));

          documents.push({
            document: documentBlock.join(' '),
            type: token,
            namespace
          });

          it += documentBlock.length;
          break;
        default:
        // no default
      }
    }

    return documents;
  }

  getTree(node?: DocumentParser.Node, chunks?: string[]): DocumentParser.Node {
    if (!node) {
      const root = {
        children: [],
        documents: [],
        namespace: ''
      };

      return this.getTree(root, this._fileChunks);
    }

    for (let it = 0; it < chunks.length; it++) {
      const token = chunks[it];

      switch (token) {
        case DocumentParser.Token.Namespace:
          const namespace = chunks[++it];
          const childBlock = DocumentParser._balanceBraces(chunks.slice(it));
          const child = {
            children: [],
            documents: [],
            namespace: `${node.namespace && node.namespace + '.'}${namespace}`
          };

          it += childBlock.length;
          node.children.push(this.getTree(child, childBlock));
          break;
        case DocumentParser.Token.Fragment:
        case DocumentParser.Token.Mutation:
        case DocumentParser.Token.Query:
          const documentBlock = DocumentParser._balanceBraces(chunks.slice(it));
          it += documentBlock.length;
          node.documents.push(documentBlock.join(' '));
          break;
        default:
        // no default
      }
    }

    return node;
  }
}

export namespace DocumentParser {
  export type Node = {
    children: Node[];
    documents: string[];
    namespace: string;
  };

  export type DocumentRef = {
    document: string;
    namespace: string;
    type: DocumentType;
  };

  export enum DocumentType {
    Fragment = 'fragment',
    Mutation = 'mutation',
    Query = 'query'
  }

  export enum Token {
    Fragment = 'fragment',
    LeftBrace = '{',
    Mutation = 'mutation',
    Namespace = 'namespace',
    Query = 'query',
    RightBrace = '}'
  }
}
