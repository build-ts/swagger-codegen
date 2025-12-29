export class NamingUtil {
  /**
   * Convert string to camelCase
   */
  static camelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
      .replace(/^[A-Z]/, (c) => c.toLowerCase());
  }

  /**
   * Convert string to PascalCase
   */
  static pascalCase(str: string): string {
    const camel = this.camelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  /**
   * Capitalize first letter
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert plural to singular
   */
  static singularize(word: string): string {
    // Handle special cases
    const specialCases: Record<string, string> = {
      people: "person",
      men: "man",
      women: "woman",
      children: "child",
      teeth: "tooth",
      feet: "foot",
      mice: "mouse",
      geese: "goose",
    };

    const lower = word.toLowerCase();
    if (specialCases[lower]) {
      return this.capitalize(specialCases[lower]);
    }

    // Regular patterns
    if (word.endsWith("ies")) {
      return word.slice(0, -3) + "y";
    }
    if (word.endsWith("ves")) {
      return word.slice(0, -3) + "f";
    }
    if (word.endsWith("ses")) {
      return word.slice(0, -2);
    }
    if (word.endsWith("xes")) {
      return word.slice(0, -2);
    }
    if (word.endsWith("ches") || word.endsWith("shes")) {
      return word.slice(0, -2);
    }
    if (word.endsWith("s") && !word.endsWith("ss")) {
      return word.slice(0, -1);
    }

    return word;
  }

  /**
   * Clean operation ID from controller/service/handler suffixes
   * categoryControllerGetCategoryById -> categoryGetCategoryById
   */
  /**
   * Clean operation ID from controller/service/handler suffixes AND resource prefix
   * assignmentCreateAssignmentForOrder -> createAssignmentForOrder
   */
  static cleanOperationId(operationId: string): string {
    let cleaned = operationId
      .replace(/Controller/g, "")
      .replace(/Service/g, "")
      .replace(/Handler/g, "")
      .replace(/Manager/g, "")
      .replace(/Processor/g, "");

    const words = cleaned.split(/(?=[A-Z])/);

    if (words.length >= 2) {
      const firstWord = words[0].toLowerCase();
      const secondWordIndex = cleaned.toLowerCase().indexOf(firstWord, 1);

      if (secondWordIndex > 0) {
        // Resource name repeats, remove first occurrence
        cleaned = cleaned.slice(firstWord.length);
        // Lowercase first letter
        cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
      }
    }

    return cleaned;
  }

  /**
   * Extract resource name from operation ID
   * categoryGetCategoryById -> Category
   * getCategoryById -> Category
   * getAllCategories -> Category
   */
  static extractResourceName(operationId: string): string {
    // Clean first
    const cleaned = this.cleanOperationId(operationId);

    // Split by capital letters
    const words = cleaned.split(/(?=[A-Z])/);

    // Action verbs to skip
    const actionVerbs = [
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "create",
      "update",
      "remove",
      "delete",
      "find",
      "fetch",
      "search",
      "list",
      "add",
      "set",
      "modify",
      "change",
      "retrieve",
      "query",
      "load",
    ];

    // Find first non-action word (the resource)
    for (const word of words) {
      if (word && !actionVerbs.includes(word.toLowerCase())) {
        return this.singularize(this.capitalize(word));
      }
    }

    // Fallback
    return this.capitalize(words[0] || "Unknown");
  }

  /**
   * Get interface name with prefix and suffix
   * ICategoryResponse, ICategoryRequest, ICategoryParams
   */
  static getInterfaceName(baseName: string, suffix: string): string {
    const pascal = this.pascalCase(baseName);
    return `I${pascal}${suffix}`;
  }

  /**
   * Sanitize tag name for file naming
   */
  static sanitizeTagName(tag: string): string {
    return tag
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  /**
   * Generate hook name from operation ID
   * categoryControllerGetCategoryById -> useGetCategoryById
   */
  static getHookName(operationId: string | undefined): string {
    if (!operationId) {
      return "useEndpoint"; // Fallback
    }
    const cleaned = this.cleanOperationId(operationId);
    const camelCased = this.camelCase(cleaned);
    return `use${this.capitalize(camelCased)}`;
  }

  /**
   * Generate method name from operation ID
   * categoryControllerGetCategoryById -> getCategoryById
   */
  static getMethodName(operationId: string | undefined): string {
    if (!operationId) {
      return "execute"; // Fallback
    }
    const cleaned = this.cleanOperationId(operationId);
    return this.camelCase(cleaned);
  }

  /**
   * Generate hook file name
   * useGetCategoryById -> useGetCategoryById.ts
   */
  static getHookFileName(operationId: string): string {
    const hookName = this.getHookName(operationId);
    return `${hookName}.ts`;
  }

  /**
   * Strip base path from endpoint path
   * /v1/api/categories -> /categories
   */
  static stripBasePath(path: string, basePaths: string[]): string {
    for (const basePath of basePaths) {
      if (path.startsWith(basePath)) {
        const stripped = path.substring(basePath.length);
        return stripped.startsWith("/") ? stripped : "/" + stripped;
      }
    }
    return path;
  }

  /**
   * Get resource name from path
   * /categories/:id -> categories
   * /hotel-rooms -> hotel-rooms
   */
  static getResourceFromPath(path: string): string {
    const parts = path
      .split("/")
      .filter((p) => p && !p.startsWith(":") && !p.startsWith("{"));
    return parts[parts.length - 1] || "default";
  }
}
