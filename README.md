# @build-ts/swagger-codegen

[![npm version](https://badge.fury.io/js/@build-ts%2Fswagger-codegen.svg)](https://www.npmjs.com/package/@build-ts/swagger-codegen)
[![npm downloads](https://img.shields.io/npm/dm/@build-ts/swagger-codegen.svg)](https://www.npmjs.com/package/@build-ts/swagger-codegen)
[![GitHub license](https://img.shields.io/github/license/build-ts/swagger-codegen.svg)](https://github.com/build-ts/swagger-codegen/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/build-ts/swagger-codegen.svg)](https://github.com/build-ts/swagger-codegen/stargazers)

> **BuildTS** - Build TypeScript, Faster ⚡

Generate production-ready TypeScript code from Swagger/OpenAPI specifications. Get fully-typed models, endpoints, axios config, and React hooks with zero configuration.

## ✨ Features

- 🎯 **TypeScript First** - Fully typed interfaces with nested object support
- 🔄 **Smart Hook Generation** - Separate or combined React hooks with meaningful names
- ⚡ **Flexible HTTP Client** - Choose between Axios or native Fetch API
- 📝 **Auto Documentation** - JSDoc comments from Swagger descriptions
- 🎨 **Zero Config** - Works out of the box, customize when needed
- 🔧 **CLI & Programmatic** - Use via command line or Node.js API
- 📦 **Config File Support** - JavaScript, JSON, or TypeScript configs

## 📦 Installation
```bash
# Global installation
npm install -g @build-ts/swagger-codegen

# Local installation (recommended)
npm install --save-dev @build-ts/swagger-codegen
```

## 🚀 Quick Start
```bash
# Generate from URL
swagger-codegen https://api.example.com/swagger.json

# Generate from local file
swagger-codegen ./swagger.json

# Custom output directory
swagger-codegen https://api.example.com/swagger.json -o ./src/api
```

That's it! Your API client is ready to use.

## 📋 What Gets Generated
```
src/generated/
├── models/
│   ├── customer.ts           # ICustomerRequest, ICustomerResponse, ICustomerParams
│   ├── order.ts
│   └── index.ts
├── endpoints/
│   ├── customer.ts           # customerEndpoints
│   ├── order.ts
│   └── index.ts
├── config/
│   ├── axiosInstance.ts      # Configured axios instance
│   └── types.ts
└── hooks/
    ├── customer/
    │   ├── useGetCustomers.ts
    │   ├── useGetCustomerById.ts
    │   ├── usePostCustomer.ts
    │   ├── usePutCustomer.ts
    │   ├── useDeleteCustomer.ts
    │   └── useCustomer.ts    # Combined (optional)
    └── order/
        └── ...
```

## 💡 Usage Examples

### Basic Usage - Separate Hooks
```typescript
import { useGetCustomers } from './generated/hooks/customer/useGetCustomers';
import { usePostCustomer } from './generated/hooks/customer/usePostCustomer';

function CustomerList() {
  const { data, isLoading, error, getCustomers } = useGetCustomers();
  const { postCustomer, isLoading: isCreating } = usePostCustomer();

  useEffect(() => {
    // Fetch customers on mount
    getCustomers({ status: 'active', page: 1 });
  }, []);

  const handleCreate = async () => {
    const newCustomer = await postCustomer({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    });

    if (newCustomer) {
      // Refresh the list
      getCustomers();
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Add Customer'}
      </button>
      
      {data?.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

### Get By ID
```typescript
import { useGetCustomerById } from './generated/hooks/customer/useGetCustomerById';

function CustomerProfile({ customerId }: { customerId: string }) {
  const { data: customer, isLoading, getCustomerById } = useGetCustomerById();

  useEffect(() => {
    getCustomerById({ id: customerId });
  }, [customerId]);

  if (isLoading) return <div>Loading...</div>;
  if (!customer) return <div>Customer not found</div>;

  return (
    <div>
      <h1>{customer.name}</h1>
      <p>{customer.email}</p>
    </div>
  );
}
```

### Update Operations
```typescript
import { usePutCustomer } from './generated/hooks/customer/usePutCustomer';
import { useDeleteCustomer } from './generated/hooks/customer/useDeleteCustomer';

function CustomerActions({ customer }) {
  const { putCustomer, isLoading: isUpdating } = usePutCustomer();
  const { deleteCustomer, isLoading: isDeleting } = useDeleteCustomer();

  const handleUpdate = async () => {
    await putCustomer({
      ...customer,
      name: 'Updated Name',
    });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure?')) {
      await deleteCustomer({ id: customer.id });
    }
  };

  return (
    <div>
      <button onClick={handleUpdate} disabled={isUpdating}>
        Update
      </button>
      <button onClick={handleDelete} disabled={isDeleting}>
        Delete
      </button>
    </div>
  );
}
```

### Combined Hook Pattern

Generate with combined hooks:
```bash
swagger-codegen https://api.example.com/swagger.json --hook-pattern combined
```
```typescript
import { useCustomer } from './generated/hooks/customer/useCustomer';

function CustomerManager() {
  const {
    // GET /customers
    getCustomersData,
    getCustomersLoading,
    getCustomers,
    
    // GET /customers/{id}
    getCustomerByIdData,
    getCustomerById,
    
    // POST /customers
    postCustomer,
    postCustomerLoading,
    
    // PUT /customers/{id}
    putCustomerById,
    
    // DELETE /customers/{id}
    deleteCustomerById,
  } = useCustomer();

  useEffect(() => {
    getCustomers({ page: 1, limit: 10 });
  }, []);

  const handleCreate = async () => {
    const result = await postCustomer({
      name: 'John',
      email: 'john@example.com',
    });
    
    if (result) getCustomers(); // Refresh list
  };

  const handleView = (id: string) => {
    getCustomerById({ id });
  };

  return (
    <div>
      {getCustomersLoading && <p>Loading customers...</p>}
      {/* ... */}
    </div>
  );
}
```

### Using Native Fetch API
```bash
swagger-codegen https://api.example.com/swagger.json --use-fetch --no-axios
```
```typescript
import { usePostCustomer } from './generated/hooks/customer/usePostCustomer';

function CreateCustomer() {
  const { postCustomer, isLoading } = usePostCustomer();

  const handleSubmit = async (formData) => {
    // Uses native fetch() under the hood
    const result = await postCustomer(formData, {
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': generateId(),
    });

    if (result) {
      toast.success('Customer created!');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Custom Headers
```typescript
import { useGetCustomers } from './generated/hooks/customer/useGetCustomers';

function ProtectedRoute() {
  const { getCustomers } = useGetCustomers();
  const token = useAuthToken();

  useEffect(() => {
    getCustomers(
      { status: 'active' },
      {
        'Authorization': `Bearer ${token}`,
        'X-User-ID': userId,
        'X-Tenant-ID': tenantId,
      }
    );
  }, [token]);

  // ...
}
```

## ⚙️ Configuration

### Basic Config File

Create `swagger-codegen.config.js`:
```javascript
module.exports = {
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: './src/api',
};
```

### Full Configuration
```javascript
// swagger-codegen.config.js
module.exports = {
  // Required: Swagger/OpenAPI specification
  swaggerUrl: 'https://api.example.com/swagger.json',
  
  // Output paths
  outputDir: './src/generated',
  modelsDir: 'models',
  endpointsDir: 'endpoints',
  generateIndex: true,
  
  // Axios configuration
  axiosConfig: {
    generateAxiosConfig: true,
    axiosConfigPath: 'config',
    baseUrlPlaceholder: 'process.env.REACT_APP_API_URL',
    includeInterceptors: true,
  },
  
  // React hooks configuration
  hooks: {
    generateHooks: true,
    hooksDir: 'hooks',
    hookPattern: 'separate',        // 'separate' | 'combined'
    useFetch: false,                // false = axios, true = fetch
    includeHeaders: true,
    headerPlaceholders: ['userId', 'token'],
  },
};
```

### TypeScript Config
```typescript
// swagger-codegen.config.ts
import type { UserGeneratorConfig } from '@build-ts/swagger-codegen';

const config: UserGeneratorConfig = {
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: './src/api',
  hooks: {
    hookPattern: 'combined',
    useFetch: true,
  },
};

export default config;
```

### Environment-Specific Config
```javascript
// swagger-codegen.config.js
const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  swaggerUrl: isDev 
    ? 'http://localhost:3000/swagger.json' 
    : 'https://api.production.com/swagger.json',
  outputDir: './src/api',
  axiosConfig: {
    baseUrlPlaceholder: isDev 
      ? '"http://localhost:3000"' 
      : 'process.env.REACT_APP_API_URL',
  },
};
```

## 🎯 CLI Options
```bash
swagger-codegen [swagger-url] [options]

Arguments:
  swagger-url              URL or path to Swagger/OpenAPI specification

Options:
  -o, --output <dir>       Output directory (default: ./src/generated)
  -m, --models <dir>       Models subdirectory (default: models)
  -e, --endpoints <dir>    Endpoints subdirectory (default: endpoints)
  --hooks <dir>            Hooks subdirectory (default: hooks)
  --hook-pattern <type>    'separate' or 'combined' (default: separate)
  --use-fetch              Use native fetch instead of axios
  --no-hooks               Skip React hooks generation
  --no-axios               Skip axios config generation
  --base-url <expr>        Base URL placeholder
  --no-index               Skip index files generation
  -c, --config <path>      Path to config file
  -h, --help               Display help message

Examples:
  # Basic usage
  swagger-codegen https://api.example.com/swagger.json
  
  # Local file
  swagger-codegen ./swagger.json -o ./src/api
  
  # Use config file
  swagger-codegen --config ./my-config.js
  
  # Native fetch with combined hooks
  swagger-codegen https://api.example.com/swagger.json --use-fetch --hook-pattern combined
  
  # Models and endpoints only (no hooks)
  swagger-codegen https://api.example.com/swagger.json --no-hooks
```

## 🔧 Advanced Usage

### Customizing Axios Instance

After generation, customize the axios instance:
```typescript
// src/generated/config/axiosInstance.ts
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add custom headers
    config.headers['X-Client-Version'] = '1.0.0';
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
    }
    
    return Promise.reject(error);
  }
);
```

### Multiple API Sources
```bash
# Generate from different APIs
swagger-codegen https://api1.example.com/swagger.json -o ./src/api/service1
swagger-codegen https://api2.example.com/swagger.json -o ./src/api/service2
swagger-codegen https://api3.example.com/swagger.json -o ./src/api/service3
```

### CI/CD Integration
```json
// package.json
{
  "scripts": {
    "codegen": "swagger-codegen https://api.example.com/swagger.json",
    "prebuild": "npm run codegen",
    "predev": "npm run codegen",
    "dev": "vite",
    "build": "vite build"
  }
}
```

### Vite/Next.js Integration

**Vite:**
```javascript
// swagger-codegen.config.js
module.exports = {
  swaggerUrl: './swagger.json',
  outputDir: './src/api',
  axiosConfig: {
    baseUrlPlaceholder: 'import.meta.env.VITE_API_URL',
  },
};
```
```env
# .env
VITE_API_URL=https://api.example.com
```

**Next.js:**
```javascript
// swagger-codegen.config.js
module.exports = {
  swaggerUrl: process.env.SWAGGER_URL,
  outputDir: './src/api',
  axiosConfig: {
    baseUrlPlaceholder: 'process.env.NEXT_PUBLIC_API_URL',
  },
};
```
```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
SWAGGER_URL=https://api.example.com/swagger.json
```

### Error Handling Patterns
```typescript
import { useGetCustomers } from './generated/hooks/customer/useGetCustomers';
import { toast } from 'react-hot-toast';

function CustomerList() {
  const { data, error, isLoading, getCustomers } = useGetCustomers();

  useEffect(() => {
    getCustomers()
      .then((result) => {
        if (result) {
          console.log('Customers loaded:', result.length);
        }
      })
      .catch((err) => {
        toast.error('Failed to load customers');
        logError(err);
      });
  }, []);

  // Display error in UI
  if (error) {
    return (
      <div className="error">
        <h3>Failed to load customers</h3>
        <p>{error}</p>
        <button onClick={() => getCustomers()}>
          Retry
        </button>
      </div>
    );
  }

  // ...
}
```

### Loading States
```typescript
function CustomerActions() {
  const { postCustomer, isLoading: isCreating } = usePostCustomer();
  const { putCustomer, isLoading: isUpdating } = usePutCustomer();
  const { deleteCustomer, isLoading: isDeleting } = useDeleteCustomer();

  const isProcessing = isCreating || isUpdating || isDeleting;

  return (
    <div>
      {isProcessing && <LoadingOverlay />}
      
      <button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create'}
      </button>
      
      <button onClick={handleUpdate} disabled={isUpdating}>
        {isUpdating ? 'Updating...' : 'Update'}
      </button>
      
      <button onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
```

### Optimistic Updates
```typescript
function OptimisticCustomerList() {
  const [localCustomers, setLocalCustomers] = useState([]);
  const { data, getCustomers } = useGetCustomers();
  const { postCustomer } = usePostCustomer();

  useEffect(() => {
    setLocalCustomers(data || []);
  }, [data]);

  const handleCreate = async (newCustomer) => {
    // Optimistic update
    const tempCustomer = { ...newCustomer, id: 'temp-' + Date.now() };
    setLocalCustomers([...localCustomers, tempCustomer]);

    // API call
    const result = await postCustomer(newCustomer);

    if (result) {
      // Replace temp with real data
      getCustomers();
    } else {
      // Revert on error
      setLocalCustomers(localCustomers);
    }
  };

  return (
    <div>
      {localCustomers.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```
## 🤔 FAQ

**Q: Can I use this without React?**  
A: Yes! Disable hooks generation:
```bash
swagger-codegen https://api.example.com/swagger.json --no-hooks
```

**Q: Does it support OpenAPI 3.0?**  
A: Yes! Both Swagger 2.0 and OpenAPI 3.0+ are fully supported.

**Q: Can I customize generated code?**  
A: Don't edit generated files directly. Instead, extend types or wrap hooks with your custom logic.

**Q: Does it work with GraphQL?**  
A: No, this is for REST APIs with Swagger/OpenAPI. For GraphQL, use [graphql-code-generator](https://www.graphql-code-generator.com/).

**Q: How do I handle authentication?**  
A: Customize the axios interceptors in `src/generated/config/axiosInstance.ts` or pass headers to hook methods.

**Q: Can I use multiple Swagger sources?**  
A: Yes! Generate to different directories:
```bash
swagger-codegen https://api1.com/swagger.json -o ./src/api/service1
swagger-codegen https://api2.com/swagger.json -o ./src/api/service2
```

**Q: What about rate limiting?**  
A: Implement rate limiting in your axios interceptors or use a library like `axios-rate-limit`.

**Q: Is it production-ready?**  
A: Yes! Many teams use it in production. Always test generated code before deploying.

## 🙏 Peer Dependencies

Required dependencies (install in your project):
```json
{
  "dependencies": {
    "axios": ">=0.27.0",
    "react": ">=16.8.0"
  }
}
```

Install with:
```bash
npm install axios react
```

**Note:** If using `--use-fetch`, axios is not required. If using `--no-hooks`, React is not required.

## 📝 License

MIT © [BuildTS](https://github.com/build-ts)

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@build-ts/swagger-codegen)
- [GitHub Repository](https://github.com/build-ts/swagger-codegen)
- [Issue Tracker](https://github.com/build-ts/swagger-codegen/issues)
- [Changelog](https://github.com/build-ts/swagger-codegen/releases)

## 🤝 Contributing

Contributions welcome! Please read our [contributing guidelines](https://github.com/build-ts/swagger-codegen/blob/main/CONTRIBUTING.md) before submitting a Pull Request.

## ⭐ Show Your Support

Give a ⭐ on [GitHub](https://github.com/build-ts/swagger-codegen) if this project helped you!

---

Made with ❤️ by [BuildTS](https://github.com/build-ts)