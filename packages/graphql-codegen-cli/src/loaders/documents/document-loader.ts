import { validate, GraphQLSchema, GraphQLError } from 'graphql';
import { DocumentNode, Source, parse, concatAST, logger } from 'graphql-codegen-core';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentParser } from '../../utils/document-parser';

export const loadFileContent = (filePath: string): DocumentNode | null => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Document file ${filePath} does not exists!`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const fileExt = path.extname(filePath);

  if (fileExt === '.graphql' || fileExt === '.gql') {
    return parse(new Source(fileContent, filePath));
  }

  const paresedDocument = new DocumentParser(fileContent);
  const documentRefs = paresedDocument.getDocuments();

  const documentMap = documentRefs.reduce(
    (groups, { document, namespace }) => {
      const { [namespace]: existingDocument = '' } = groups;
      groups[namespace] = `${existingDocument} ${document}`;
      return groups;
    },
    {} as { [key: string]: string }
  );

  const entries = Object.entries(documentMap);
  const documentNodes = entries.map(([namespace, document]) => {
    const documentNode = parse(new Source(document));

    documentNode.definitions.forEach(definition => {
      (definition as any).namespace = namespace;
    });

    return documentNode;
  });

  return concatAST(documentNodes);
};

export const loadDocumentsSources = (
  schema: GraphQLSchema,
  filePaths: string[]
): DocumentNode | ReadonlyArray<GraphQLError> => {
  const loadResults = filePaths
    .map(filePath => {
      const fileContent = loadFileContent(filePath);
      const errors = validate(schema, fileContent);
      return {
        fileContent,
        errors
      };
    })
    .filter(content => content);

  const errors = loadResults.map(r => r.errors).reduce((soFar, current) => soFar.concat(current), []);
  return errors.length > 0 ? errors : concatAST(loadResults.map(r => r.fileContent));
};
