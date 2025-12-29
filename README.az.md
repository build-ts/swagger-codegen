# @build-ts/swagger-codegen

[![npm version](https://badge.fury.io/js/@build-ts%2Fswagger-codegen.svg)](https://www.npmjs.com/package/@build-ts/swagger-codegen)
[![npm downloads](https://img.shields.io/npm/dm/@build-ts/swagger-codegen.svg)](https://www.npmjs.com/package/@build-ts/swagger-codegen)
[![GitHub license](https://img.shields.io/github/license/build-ts/swagger-codegen.svg)](https://github.com/build-ts/swagger-codegen/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/build-ts/swagger-codegen.svg)](https://github.com/build-ts/swagger-codegen/stargazers)

> **BuildTS** - TypeScript-i Daha Sürətli Yarat ⚡

Swagger/OpenAPI spesifikasiyalarından production-ready TypeScript kodu generate edin. Sıfır konfiqurasiya ilə tam typed model-lər, endpoint-lər, axios config və React hook-ları əldə edin.

## ✨ Xüsusiyyətlər

- 🎯 **TypeScript Əsaslı** - Nested obyekt dəstəyi ilə tam typed interface-lər
- 🔄 **Ağıllı Hook Generation** - Mənalı adlarla ayrı və ya birləşmiş React hook-lar
- ⚡ **Çevik HTTP Client** - Axios və ya native Fetch API
- 📝 **Auto Sənədləşdirmə** - Swagger description-lardan JSDoc comment-lər
- 🎨 **Sıfır Config** - Hazır işləyir, lazım olduqda fərdiləşdir
- 🔧 **CLI və Programmatik** - Command line və ya Node.js API
- 📦 **Config Fayl Dəstəyi** - JavaScript, JSON və ya TypeScript

## 📦 Quraşdırma
```bash
# Global quraşdırma
npm install -g @build-ts/swagger-codegen

# Local quraşdırma (tövsiyə olunur)
npm install --save-dev @build-ts/swagger-codegen
```

## 🚀 Tez Başlanğıc
```bash
# URL-dən generate et
swagger-codegen https://api.example.com/swagger.json

# Local fayldan generate et
swagger-codegen ./swagger.json

# Xüsusi output directory
swagger-codegen https://api.example.com/swagger.json -o ./src/api
```

Bu qədər! API client-iniz istifadəyə hazırdır.

## 📋 Nə Generate Olunur
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
│   ├── axiosInstance.ts      # Konfiqurasiya olunmuş axios instance
│   └── types.ts
└── hooks/
    ├── customer/
    │   ├── useGetCustomers.ts
    │   ├── useGetCustomerById.ts
    │   ├── usePostCustomer.ts
    │   ├── usePutCustomer.ts
    │   ├── useDeleteCustomer.ts
    │   └── useCustomer.ts    # Birləşmiş (optional)
    └── order/
        └── ...
```

## 💡 İstifadə Nümunələri

### Əsas İstifadə - Ayrı Hook-lar
```typescript
import { useGetCustomers } from './generated/hooks/customer/useGetCustomers';
import { usePostCustomer } from './generated/hooks/customer/usePostCustomer';

function CustomerList() {
  const { data, isLoading, error, getCustomers } = useGetCustomers();
  const { postCustomer, isLoading: isCreating } = usePostCustomer();

  useEffect(() => {
    // Component mount olduqda müştəriləri gətir
    getCustomers({ status: 'active', page: 1 });
  }, []);

  const handleCreate = async () => {
    const newCustomer = await postCustomer({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    });

    if (newCustomer) {
      // Listi yenilə
      getCustomers();
    }
  };

  if (isLoading) return <div>Yüklənir...</div>;
  if (error) return <div>Xəta: {error}</div>;

  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? 'Yaradılır...' : 'Müştəri Əlavə Et'}
      </button>
      
      {data?.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

### ID ilə Gətirmə
```typescript
import { useGetCustomerById } from './generated/hooks/customer/useGetCustomerById';

function CustomerProfile({ customerId }: { customerId: string }) {
  const { data: customer, isLoading, getCustomerById } = useGetCustomerById();

  useEffect(() => {
    getCustomerById({ id: customerId });
  }, [customerId]);

  if (isLoading) return <div>Yüklənir...</div>;
  if (!customer) return <div>Müştəri tapılmadı</div>;

  return (
    <div>
      <h1>{customer.name}</h1>
      <p>{customer.email}</p>
    </div>
  );
}
```

### Update Əməliyyatları
```typescript
import { usePutCustomer } from './generated/hooks/customer/usePutCustomer';
import { useDeleteCustomer } from './generated/hooks/customer/useDeleteCustomer';

function CustomerActions({ customer }) {
  const { putCustomer, isLoading: isUpdating } = usePutCustomer();
  const { deleteCustomer, isLoading: isDeleting } = useDeleteCustomer();

  const handleUpdate = async () => {
    await putCustomer({
      ...customer,
      name: 'Yenilənmiş Ad',
    });
  };

  const handleDelete = async () => {
    if (confirm('Əminsiniz?')) {
      await deleteCustomer({ id: customer.id });
    }
  };

  return (
    <div>
      <button onClick={handleUpdate} disabled={isUpdating}>
        Yenilə
      </button>
      <button onClick={handleDelete} disabled={isDeleting}>
        Sil
      </button>
    </div>
  );
}
```

### Birləşmiş Hook Pattern

Birləşmiş hook-larla generate et:
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
    
    if (result) getCustomers(); // Listi yenilə
  };

  const handleView = (id: string) => {
    getCustomerById({ id });
  };

  return (
    <div>
      {getCustomersLoading && <p>Müştərilər yüklənir...</p>}
      {/* ... */}
    </div>
  );
}
```

### Native Fetch API İstifadəsi
```bash
swagger-codegen https://api.example.com/swagger.json --use-fetch --no-axios
```
```typescript
import { usePostCustomer } from './generated/hooks/customer/usePostCustomer';

function CreateCustomer() {
  const { postCustomer, isLoading } = usePostCustomer();

  const handleSubmit = async (formData) => {
    // Arxada native fetch() istifadə olunur
    const result = await postCustomer(formData, {
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': generateId(),
    });

    if (result) {
      toast.success('Müştəri yaradıldı!');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Xüsusi Header-lər
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

## ⚙️ Konfiqurasiya

### Əsas Config Faylı

`swagger-codegen.config.js` yarat:
```javascript
module.exports = {
  swaggerUrl: 'https://api.example.com/swagger.json',
  outputDir: './src/api',
};
```

### Tam Konfiqurasiya
```javascript
// swagger-codegen.config.js
module.exports = {
  // Tələb olunur: Swagger/OpenAPI spesifikasiyası
  swaggerUrl: 'https://api.example.com/swagger.json',
  
  // Output yolları
  outputDir: './src/generated',
  modelsDir: 'models',
  endpointsDir: 'endpoints',
  generateIndex: true,
  
  // Axios konfiqurasiyası
  axiosConfig: {
    generateAxiosConfig: true,
    axiosConfigPath: 'config',
    baseUrlPlaceholder: 'process.env.REACT_APP_API_URL',
    includeInterceptors: true,
  },
  
  // React hooks konfiqurasiyası
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

## 🎯 CLI Seçimləri
```bash
swagger-codegen [swagger-url] [seçimlər]

Arqumentlər:
  swagger-url              Swagger/OpenAPI spesifikasiyasının URL və ya yolu

Seçimlər:
  -o, --output <dir>       Output directory (default: ./src/generated)
  -m, --models <dir>       Models subdirectory (default: models)
  -e, --endpoints <dir>    Endpoints subdirectory (default: endpoints)
  --hooks <dir>            Hooks subdirectory (default: hooks)
  --hook-pattern <type>    'separate' və ya 'combined' (default: separate)
  --use-fetch              Axios əvəzinə native fetch istifadə et
  --no-hooks               React hooks generate etmə
  --no-axios               Axios config generate etmə
  --base-url <expr>        Base URL placeholder
  --no-index               Index faylları generate etmə
  -c, --config <path>      Config fayl yolu
  -h, --help               Kömək mesajı

Nümunələr:
  # Əsas istifadə
  swagger-codegen https://api.example.com/swagger.json
  
  # Local fayl
  swagger-codegen ./swagger.json -o ./src/api
  
  # Config fayl istifadə et
  swagger-codegen --config ./my-config.js
  
  # Native fetch + birləşmiş hooks
  swagger-codegen https://api.example.com/swagger.json --use-fetch --hook-pattern combined
  
  # Yalnız models və endpoints (hooks olmadan)
  swagger-codegen https://api.example.com/swagger.json --no-hooks
```

## 🔧 Ətraflı İstifadə

### Axios Instance-i Fərdiləşdirmə

Generation-dan sonra axios instance-i fərdiləşdirin:
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
    // Authentication token əlavə et
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Xüsusi header-lər
    config.headers['X-Client-Version'] = '1.0.0';
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 401 Unauthorized handle et
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    // Network xətaları handle et
    if (!error.response) {
      console.error('Network xətası:', error);
    }
    
    return Promise.reject(error);
  }
);
```

### Çoxlu API Mənbələri
```bash
# Müxtəlif API-lərdən generate et
swagger-codegen https://api1.example.com/swagger.json -o ./src/api/service1
swagger-codegen https://api2.example.com/swagger.json -o ./src/api/service2
swagger-codegen https://api3.example.com/swagger.json -o ./src/api/service3
```

### CI/CD İnteqrasiyası
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

### Vite/Next.js İnteqrasiyası

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

### Xəta İdarəetmə Pattern-ləri
```typescript
import { useGetCustomers } from './generated/hooks/customer/useGetCustomers';
import { toast } from 'react-hot-toast';

function CustomerList() {
  const { data, error, isLoading, getCustomers } = useGetCustomers();

  useEffect(() => {
    getCustomers()
      .then((result) => {
        if (result) {
          console.log('Müştərilər yükləndi:', result.length);
        }
      })
      .catch((err) => {
        toast.error('Müştərilər yüklənə bilmədi');
        logError(err);
      });
  }, []);

  // UI-da xəta göstər
  if (error) {
    return (
      <div className="error">
        <h3>Müştərilər yüklənə bilmədi</h3>
        <p>{error}</p>
        <button onClick={() => getCustomers()}>
          Yenidən cəhd et
        </button>
      </div>
    );
  }

  // ...
}
```

### Loading State-lər
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
        {isCreating ? 'Yaradılır...' : 'Yarat'}
      </button>
      
      <button onClick={handleUpdate} disabled={isUpdating}>
        {isUpdating ? 'Yenilənir...' : 'Yenilə'}
      </button>
      
      <button onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? 'Silinir...' : 'Sil'}
      </button>
    </div>
  );
}
```

### Optimistic Update-lər
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

    // API çağırışı
    const result = await postCustomer(newCustomer);

    if (result) {
      // Temp-i real data ilə əvəz et
      getCustomers();
    } else {
      // Xəta olduqda geri al
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

## 🤔 Tez-tez Verilən Suallar

**S: React olmadan istifadə edə bilərəm?**  
C: Bəli! Hook generation-u disable edin:
```bash
swagger-codegen https://api.example.com/swagger.json --no-hooks
```

**S: OpenAPI 3.0 dəstəkləyir?**  
C: Bəli! Həm Swagger 2.0 həm də OpenAPI 3.0+ tam dəstəklənir.

**S: Generated kodu fərdiləşdirə bilərəm?**  
C: Generated faylları birbaşa edit etməyin. Əvəzinə, type-ları extend edin və ya hook-ları xüsusi məntiqinizlə wrap edin.

**S: GraphQL ilə işləyir?**  
C: Xeyr, bu REST API-lər üçün Swagger/OpenAPI ilə işləyir. GraphQL üçün [graphql-code-generator](https://www.graphql-code-generator.com/) istifadə edin.

**S: Authentication-u necə handle edim?**  
C: `src/generated/config/axiosInstance.ts`-də axios interceptor-ları fərdiləşdirin və ya hook method-larına header göndərin.

**S: Çoxlu Swagger mənbəyindən istifadə edə bilərəm?**  
C: Bəli! Müxtəlif directory-lərə generate edin:
```bash
swagger-codegen https://api1.com/swagger.json -o ./src/api/service1
swagger-codegen https://api2.com/swagger.json -o ./src/api/service2
```

**S: Rate limiting haqqında nə demək olar?**  
C: Rate limiting-i axios interceptor-larınızda implement edin və ya `axios-rate-limit` kimi kitabxana istifadə edin.

**S: Production-ready-dir?**  
C: Bəli! Bir çox komanda production-da istifadə edir. Deploy etməmişdən əvvəl həmişə generated kodu test edin.

## 🙏 Peer Dependencies

Tələb olunan dependency-lər (proyektinizdə quraşdırın):
```json
{
  "dependencies": {
    "axios": ">=0.27.0",
    "react": ">=16.8.0"
  }
}
```

Quraşdırın:
```bash
npm install axios react
```

**Qeyd:** `--use-fetch` istifadə edirsinizsə, axios tələb olunmur. `--no-hooks` istifadə edirsinizsə, React tələb olunmur.

## 📝 Lisenziya

MIT © [BuildTS](https://github.com/build-ts)

## 🔗 Linklər

- [NPM Package](https://www.npmjs.com/package/@build-ts/swagger-codegen)
- [GitHub Repository](https://github.com/build-ts/swagger-codegen)
- [Issue Tracker](https://github.com/build-ts/swagger-codegen/issues)
- [Changelog](https://github.com/build-ts/swagger-codegen/releases)

## 🤝 Töhfə Vermə

Töhfələr xoş gəlmisiniz! Pull Request göndərməmişdən əvvəl [töhfə qaydalarımızı](https://github.com/build-ts/swagger-codegen/blob/main/CONTRIBUTING.md) oxuyun.

## ⭐ Dəstəyinizi Göstərin

Bu proyekt sizə kömək etdisə, [GitHub](https://github.com/build-ts/swagger-codegen)-da ⭐ verin!

---

❤️ ilə [BuildTS](https://github.com/build-ts) tərəfindən hazırlanmışdır