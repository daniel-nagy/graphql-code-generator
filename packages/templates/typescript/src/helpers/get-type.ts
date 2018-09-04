import { SafeString } from 'handlebars';
import { getResultType } from '../utils/get-result-type';

export function getType(type, ...rest) {
  const [ignoreInterfacePrefix, options] = rest.length === 2 ? rest : [false, ...rest];

  if (!type) {
    return '';
  }

  const result = getResultType(type, options, ignoreInterfacePrefix);

  return new SafeString(result);
}
