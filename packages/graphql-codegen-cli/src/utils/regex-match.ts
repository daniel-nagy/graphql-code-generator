export default class RegexMatch {
  end?: number;
  groups?: string[];
  input: string;
  isMatch = false;
  match?: string;
  start?: number;

  constructor(input: string, regex: RegExp) {
    this.input = input;

    const matchArray = input.match(regex);

    if (matchArray === null) {
      return;
    }

    const [match, ...groups] = matchArray;

    this.end = matchArray.index + match.length;
    this.groups = groups;
    this.input = matchArray.input;
    this.isMatch = true;
    this.match = match;
    this.start = matchArray.index;
  }
}
