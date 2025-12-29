# Swagger Code Generator

Generate TypeScript models, endpoints, axios config, and React hooks from Swagger/OpenAPI specifications.

## Installation
```bash
npm install -g @alistack/swagger-codegen
# or
npm install --save-dev @alistack/swagger-codegen
```

## Quick Start
```bash
# Simple usage
swagger-codegen https://api.example.com/swagger.json

# With config file
swagger-codegen
```

## Features

✅ TypeScript interfaces (Request/Response/Params)  
✅ Nested object interfaces  
✅ Endpoint definitions  
✅ Axios instance configuration  
✅ React hooks (separate or combined)  
✅ Native fetch API support  
✅ Config file support  

## Configuration

Create `swagger-codegen.config.js`:
```javascript
module.exports = {
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: './src/generated',
  
  hooks: {
    generateHooks: true,
    hookPattern: 'separate', // 'separate' | 'combined'
    useFetch: false,         // false = axios, true = fetch
  },
  
  axiosConfig: {
    generateAxiosConfig: true,
    baseUrlPlaceholder: 'process.env.REACT_APP_API_URL',
  },
};
```

## CLI Options
```bash
swagger-codegen [swagger-url] [options]

Options:
  -o, --output <dir>       Output directory
  -m, --models <dir>       Models subdirectory
  -e, --endpoints <dir>    Endpoints subdirectory
  --hooks <dir>            Hooks subdirectory
  --hook-pattern <type>    'separate' or 'combined'
  --use-fetch              Use fetch instead of axios
  --no-hooks               Skip hooks generation
  --no-axios               Skip axios config
  --base-url <expr>        Base URL placeholder
  -c, --config <path>      Config file path
```

## Generated Structure
```
src/generated/
├── models/
│   ├── customer.ts          # ICustomerRequest, ICustomerResponse, etc.
│   └── index.ts
├── endpoints/
│   ├── customer.ts          # customerEndpoints
│   └── index.ts
├── config/
│   └── axiosInstance.ts     # Configured axios instance
└── hooks/
    └── customer/
        ├── useGetCustomer.ts    # Separate pattern
        ├── usePostCustomer.ts
        └── useCustomer.ts       # Combined pattern
```

## Usage Examples

### Separate Hooks Pattern
```typescript
import { useGetCustomer, usePostCustomer } from './generated/hooks/customer';

function Component() {
  const { data, isLoading, get } = useGetCustomer();
  const { post } = usePostCustomer();

  useEffect(() => {
    get({ id: '123' });
  }, []);

  const handleCreate = () => {
    post({ name: 'John', email: 'john@example.com' });
  };
}
```

### Combined Hooks Pattern
```typescript
import { useCustomer } from './generated/hooks/customer';

function Component() {
  const {
    getCustomersData,
    getCustomersLoading,
    getCustomers,
    postCustomer,
  } = useCustomer();

  useEffect(() => {
    getCustomers();
  }, []);
}
```

### Using Endpoints Directly
```typescript
import { customerEndpoints } from './generated/endpoints/customer';
import { axiosInstance } from './generated/config/axiosInstance';

// Manual API call
const response = await axiosInstance.get(customerEndpoints.getCustomers.path);
```

## Examples
```bash
# Default (axios + separate hooks)
swagger-codegen https://api.example.com/swagger.json

# Native fetch API
swagger-codegen https://api.example.com/swagger.json --use-fetch

# Combined hooks
swagger-codegen https://api.example.com/swagger.json --hook-pattern combined

# Custom output
swagger-codegen ./swagger.json -o ./src/api

# Skip hooks
swagger-codegen ./swagger.json --no-hooks

# Use config file
swagger-codegen --config ./my-config.js
```

## Peer Dependencies

Generated code requires:
- `axios` >= 0.27.0 (if using axios)
- `react` >= 16.8.0 (if generating hooks)
```bash
npm install axios react
```

## License

MIT