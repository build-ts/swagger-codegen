# Swagger Code Generator

Swagger/OpenAPI spesifikasiyalarından TypeScript model-lər, endpoint-lər, axios config və React hook-lar generate edin.

## Quraşdırma
```bash
npm install -g @alistack/swagger-codegen
# və ya
npm install --save-dev @alistack/swagger-codegen
```

## Tez Başlanğıc
```bash
# Sadə istifadə
swagger-codegen https://api.example.com/swagger.json

# Config fayl ilə
swagger-codegen
```

## Xüsusiyyətlər

✅ TypeScript interface-lər (Request/Response/Params)  
✅ Nested obyekt interface-ləri  
✅ Endpoint tərifləri  
✅ Axios instance konfiqurasiyası  
✅ React hooks (ayrı və ya birləşmiş)  
✅ Native fetch API dəstəyi  
✅ Config fayl dəstəyi  

## Konfiqurasiya

`swagger-codegen.config.js` yaradın:
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

## CLI Seçimləri
```bash
swagger-codegen [swagger-url] [seçimlər]

Seçimlər:
  -o, --output <dir>       Output directory
  -m, --models <dir>       Models subdirectory
  -e, --endpoints <dir>    Endpoints subdirectory
  --hooks <dir>            Hooks subdirectory
  --hook-pattern <type>    'separate' və ya 'combined'
  --use-fetch              axios əvəzinə fetch istifadə et
  --no-hooks               Hook-lar generate etmə
  --no-axios               Axios config generate etmə
  --base-url <expr>        Base URL placeholder
  -c, --config <path>      Config fayl yolu
```

## Generate Olunan Struktur
```
src/generated/
├── models/
│   ├── customer.ts          # ICustomerRequest, ICustomerResponse, və s.
│   └── index.ts
├── endpoints/
│   ├── customer.ts          # customerEndpoints
│   └── index.ts
├── config/
│   └── axiosInstance.ts     # Konfiqurasiya olunmuş axios
└── hooks/
    └── customer/
        ├── useGetCustomer.ts    # Ayrı pattern
        ├── usePostCustomer.ts
        └── useCustomer.ts       # Birləşmiş pattern
```

## İstifadə Nümunələri

### Ayrı Hook Pattern
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

### Birləşmiş Hook Pattern
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

### Endpoint-ləri Birbaşa İstifadə
```typescript
import { customerEndpoints } from './generated/endpoints/customer';
import { axiosInstance } from './generated/config/axiosInstance';

// Manual API çağırışı
const response = await axiosInstance.get(customerEndpoints.getCustomers.path);
```

## Nümunələr
```bash
# Default (axios + ayrı hooks)
swagger-codegen https://api.example.com/swagger.json

# Native fetch API
swagger-codegen https://api.example.com/swagger.json --use-fetch

# Birləşmiş hooks
swagger-codegen https://api.example.com/swagger.json --hook-pattern combined

# Xüsusi output
swagger-codegen ./swagger.json -o ./src/api

# Hook-lar olmadan
swagger-codegen ./swagger.json --no-hooks

# Config fayl istifadə et
swagger-codegen --config ./my-config.js
```

## Peer Dependencies

Generate olunan kodun ehtiyacı:
- `axios` >= 0.27.0 (axios istifadə edilirsə)
- `react` >= 16.8.0 (hook-lar generate edilirsə)
```bash
npm install axios react
```

## Lisenziya

MIT