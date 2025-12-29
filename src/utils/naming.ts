export class NamingUtil {
  static sanitizeTagName(tag: string): string {
    return tag
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, '_$&')
      .toLowerCase();
  }

  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static pascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => this.capitalize(word))
      .join('');
  }

  static camelCase(str: string): string {
    const pascal = this.pascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  static getInterfaceName(baseName: string, suffix: string): string {
    return `I${this.pascalCase(baseName)}${suffix}`;
  }

  static getFileName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  static singularize(word: string): string {
    const rules: [RegExp, string][] = [
      [/ies$/i, 'y'],        // categories -> category
      [/ves$/i, 'f'],        // wolves -> wolf
      [/ses$/i, 's'],        // addresses -> address
      [/xes$/i, 'x'],        // boxes -> box
      [/zes$/i, 'z'],        // quizzes -> quiz
      [/ches$/i, 'ch'],      // watches -> watch
      [/shes$/i, 'sh'],      // wishes -> wish
      [/men$/i, 'man'],      // men -> man
      [/people$/i, 'person'],// people -> person
      [/children$/i, 'child'],// children -> child
      [/s$/i, ''],           // customers -> customer
    ];

    for (const [pattern, replacement] of rules) {
      if (pattern.test(word)) {
        return word.replace(pattern, replacement);
      }
    }

    return word;
  }
}