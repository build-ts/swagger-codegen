# @build-ts/swagger-codegen

[![npm version](https://badge.fury.io/js/@build-ts%2Fswagger-codegen.svg)](https://www.npmjs.com/package/@build-ts/swagger-codegen)
[![npm downloads](https://img.shields.io/npm/dm/@build-ts/swagger-codegen.svg)](https://www.npmjs.com/package/@build-ts/swagger-codegen)
[![License](https://img.shields.io/npm/l/@build-ts/swagger-codegen.svg)](https://github.com/build-ts/swagger-codegen/blob/main/LICENSE)

> Generate clean TypeScript models from Swagger/OpenAPI specifications

## ✨ Features

- 🎯 **Type-Safe Models** - Fully typed interfaces with proper types
- 🔗 **Nested Objects** - Separate interfaces for complex structures  
- 📝 **JSDoc Comments** - Documentation from Swagger descriptions
- 🎨 **Zero Config** - Works out of the box
- ⚡ **Fast & Lightweight** - No runtime dependencies

## 📦 Installation
```bash
# Global
npm install -g @build-ts/swagger-codegen

# Local (recommended)
npm install --save-dev @build-ts/swagger-codegen
```

## 🚀 Quick Start
```bash
# Models only
swagger-codegen https://api.example.com/docs/json

# Models + Endpoints
swagger-codegen https://api.example.com/docs/json --endpoints
```

## 📋 Generated Structure

**Models Only (default):**
```
src/api/
└── models/
    ├── customer.ts       # All customer types
    ├── product.ts        # All product types
    └── index.ts
```

**Models + Endpoints:**
```
src/api/
├── models/
│   ├── customer.ts
│   └── index.ts
└── endpoints/
    ├── customer.ts       # customerEndpoints functions
    └── index.ts
```

## 💡 Example Output

**Models:**
```typescript
// models/customer.ts
export interface ICustomerSettings {
  notifications?: boolean;
  theme?: 'light' | 'dark';
}

export interface ICustomerCreateRequest {
  name: string;
  email: string;
  settings?: ICustomerSettings;
}

export interface ICustomerCreateResponse {
  id: number;
  name: string;
  email: string;
  settings?: ICustomerSettings;
  createdAt: string;
}
```

**Endpoints:**
```typescript
// endpoints/customer.ts
export const customerEndpoints = {
  create: () => '/customers',
  getAll: (params?: { page?: number }) => {
    const query = params ? '?' + new URLSearchParams(...) : '';
    return '/customers' + query;
  },
  getById: (id: string | number) => `/customers/${id}`,
  update: (id: string | number) => `/customers/${id}`,
  delete: (id: string | number) => `/customers/${id}`,
} as const;
```

## 💻 Usage
```typescript
import { 
  type ICustomerCreateRequest,
  type ICustomerCreateResponse 
} from './api/models/customer';
import { customerEndpoints } from './api/endpoints/customer';

// Type-safe API calls
async function createCustomer(data: ICustomerCreateRequest) {
  const url = customerEndpoints.create();
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json() as Promise<ICustomerCreateResponse>;
}

// Full IntelliSense!
const customer = await createCustomer({
  name: 'John Doe',
  email: 'john@example.com',
  settings: {
    notifications: true,
    theme: 'dark'
  }
});
```

## ⚙️ Configuration

Create `swagger-codegen.config.js`:
```javascript
export default {
  swaggerUrl: 'https://api.example.com/docs/json',
  outputDir: './src/api',
  stripBasePath: '/v1/api',  // Optional: remove base path
  endpoints: {
    generateEndpoints: true,  // Optional: generate endpoints
  },
};
```

Then run:
```bash
swagger-codegen -c swagger-codegen.config.js
```

## 🎯 CLI Options
```bash
Options:
  -o, --output <dir>         Output directory (default: ./src/api)
  -m, --models <dir>         Models subdirectory (default: models)
  -e, --endpoints [dir]      Generate endpoints (default: endpoints)
  --strip <path>             Strip base path (e.g., /v1/api)
  -c, --config <path>        Config file path
  -v, --version              Show version
  -h, --help                 Show help
```

## 📚 Examples

**Models only:**
```bash
swagger-codegen https://api.example.com/docs/json
```

**Models + Endpoints:**
```bash
swagger-codegen https://api.example.com/docs/json --endpoints
```

**Strip base path:**
```bash
swagger-codegen https://api.example.com/docs/json --endpoints --strip /v1/api
```

**Multiple APIs:**
```bash
swagger-codegen https://api1.com/docs/json -o ./src/api/service1 --endpoints
swagger-codegen https://api2.com/docs/json -o ./src/api/service2 --endpoints
```

**CI/CD:**
```json
{
  "scripts": {
    "codegen": "swagger-codegen -c swagger-codegen.config.js",
    "prebuild": "npm run codegen"
  }
}
```

## 🤔 FAQ

**Q: Works without React?**  
A: Yes! Generates plain TypeScript interfaces.

**Q: OpenAPI 3.0 support?**  
A: Yes, both Swagger 2.0 and OpenAPI 3.0+.

**Q: Can I customize generated code?**  
A: Don't edit generated files. Instead, extend types or create wrappers.

**Q: Multiple Swagger sources?**  
A: Yes, generate to different directories.

## 📝 License

MIT © [build-ts](https://github.com/build-ts)

## 🔗 Links

- [NPM](https://www.npmjs.com/package/@build-ts/swagger-codegen)
- [GitHub](https://github.com/build-ts/swagger-codegen)
- [Issues](https://github.com/build-ts/swagger-codegen/issues)

⭐ Star on [GitHub](https://github.com/build-ts/swagger-codegen) if this helped you!

---

Made with ❤️ by [build-ts](https://github.com/build-ts)