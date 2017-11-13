import { GraphQLInterfaceType, GraphQLSchema } from 'graphql';
import { Interface, debugLog } from 'graphql-codegen-common';
import { resolveFields } from './transform-fields';
import { getDirectives } from '../utils/get-directives';

export function transformInterface(schema: GraphQLSchema, gqlInterface: GraphQLInterfaceType): Interface {
  debugLog(`[transformInterface] transformed interface ${gqlInterface.name}`);

  const resolvedFields = resolveFields(schema, gqlInterface.getFields());
  const directives = getDirectives(schema, gqlInterface);

  return {
    name: gqlInterface.name,
    description: gqlInterface.description || '',
    fields: resolvedFields,
    hasFields: resolvedFields.length > 0,
    directives,
    usesDirectives: Object.keys(directives).length > 0,
  };
}
