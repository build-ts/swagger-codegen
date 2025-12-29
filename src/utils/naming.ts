export class NamingUtil {
/**
 * Convert string to PascalCase
 * qr-codes -> QrCodes
 * hotel-rooms -> HotelRooms
 */
static pascalCase(str: string): string {
  if (!str) return '';
  
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

  // src/utils/naming.ts

  /**
   * Clean operation ID - remove ALL prefixes
   * assignmentCreateAssignmentForOrder -> createAssignmentForOrder
   * productCreateProduct -> createProduct
   * userGetUserById -> getUserById
   */
  static cleanOperationId(operationId: string): string {
    if (!operationId) return "";

    // Remove common suffixes
    let cleaned = operationId
      .replace(/Controller/g, "")
      .replace(/Service/g, "")
      .replace(/Handler/g, "")
      .replace(/Manager/g, "")
      .replace(/Processor/g, "");

    // Split by capitals
    const words = cleaned.match(/[A-Z][a-z]+|[a-z]+/g) || [];

    if (words.length < 2) return cleaned;

    // Find action verb (get, create, update, delete, etc.)
    const actionVerbs = [
      "get",
      "post",
      "put",
      "delete",
      "patch",
      "create",
      "add",
      "insert",
      "update",
      "edit",
      "modify",
      "change",
      "remove",
      "destroy",
      "find",
      "fetch",
      "search",
      "list",
      "query",
      "assign",
      "unassign",
      "upload",
      "download",
    ];

    let actionIndex = -1;
    let actionVerb = "";

    for (let i = 0; i < words.length; i++) {
      if (actionVerbs.includes(words[i].toLowerCase())) {
        actionIndex = i;
        actionVerb = words[i];
        break;
      }
    }

    if (actionIndex === -1) {
      // No action verb found, return as is
      return this.camelCase(cleaned);
    }

    // Get resource name (word after action, or from remaining words)
    const resourceWords = words.slice(actionIndex + 1);

    if (resourceWords.length === 0) {
      // No resource after action
      return this.camelCase(cleaned);
    }

    // Check if first word before action repeats in resource
    const prefix = words.slice(0, actionIndex).join("").toLowerCase();
    const resource = resourceWords.join("");

    if (resource.toLowerCase().startsWith(prefix)) {
      // Remove prefix from resource
      // assignmentCreateAssignmentForOrder -> createAssignmentForOrder
      // productCreateProduct -> createProduct
      const cleanResource = resource.slice(prefix.length);
      cleaned = actionVerb + cleanResource;
    } else {
      // Keep as is
      cleaned = actionVerb + resource;
    }

    return this.camelCase(cleaned);
  }

  /**
   * Test cases:
   * assignmentCreateAssignmentForOrder -> createAssignmentForOrder ✅
   * productCreateProduct -> createProduct ✅
   * userGetUserById -> getUserById ✅
   * categoryGetAllCategories -> getAllCategories ✅
   * orderUpdateOrderStatus -> updateOrderStatus ✅
   */

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
   * Sanitize tag name for file and variable naming
   * qr-codes -> qrCodes
   * hotel-rooms -> hotelRooms
   */
  static sanitizeTagName(tag: string): string {
    // Convert to camelCase (handles dashes, spaces, underscores)
    return this.camelCase(tag);
  }

  /**
   * Convert string to camelCase
   * qr-codes -> qrCodes
   * hotel_rooms -> hotelRooms
   * hotel rooms -> hotelRooms
   */
  static camelCase(str: string): string {
    if (!str) return "";

    return (
      str
        // Replace dashes, underscores, spaces with separator
        .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
        // Lowercase first character
        .replace(/^[A-Z]/, (char) => char.toLowerCase())
    );
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
