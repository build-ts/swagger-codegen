# @build-ts/swagger-codegen

[![npm version](https://badge.fury.io/js/@build-ts%2Fswagger-codegen.svg)](https://www.npmjs.com/package/@build-ts/swagger-codegen)
[![npm downloads](https://img.shields.io/npm/dm/@build-ts/swagger-codegen.svg)](https://www.npmjs.com/package/@build-ts/swagger-codegen)
[![License](https://img.shields.io/npm/l/@build-ts/swagger-codegen.svg)](https://github.com/build-ts/swagger-codegen/blob/main/LICENSE)

> Swagger/OpenAPI spesifikasiyalarından təmiz TypeScript model-lər generate edin

## ✨ Xüsusiyyətlər

- 🎯 **Type-Safe Model-lər** - Düzgün type-larla tam typed interface-lər
- 🔗 **Nested Obyektlər** - Mürəkkəb strukturlar üçün ayrı interface-lər
- 📝 **JSDoc Comment-lər** - Swagger description-lardan sənədləşdirmə
- 🎨 **Sıfır Config** - Hazır işləyir
- ⚡ **Sürətli və Yüngül** - Runtime dependency yoxdur

## 📦 Quraşdırma
```bash
# Global
npm install -g @build-ts/swagger-codegen

# Local (tövsiyə)
npm install --save-dev @build-ts/swagger-codegen
```

## 🚀 Tez Başlanğıc
```bash
# Yalnız model-lər
swagger-codegen https://api.example.com/docs/json

# Model-lər + Endpoint-lər
swagger-codegen https://api.example.com/docs/json --endpoints
```

## 📋 Generate Olunan Struktur

**Yalnız Model-lər (default):**
```
src/api/
└── models/
    ├── customer.ts       # Bütün müştəri type-ları
    ├── product.ts        # Bütün məhsul type-ları
    └── index.ts
```

**Model-lər + Endpoint-lər:**
```
src/api/
├── models/
│   ├── customer.ts
│   └── index.ts
└── endpoints/
    ├── customer.ts       # customerEndpoints funksiyaları
    └── index.ts
```

## 💡 Nümunə Output

**Model-lər:**
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

**Endpoint-lər:**
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

## 💻 İstifadə
```typescript
import { 
  type ICustomerCreateRequest,
  type ICustomerCreateResponse 
} from './api/models/customer';
import { customerEndpoints } from './api/endpoints/customer';

// Type-safe API çağırışları
async function createCustomer(data: ICustomerCreateRequest) {
  const url = customerEndpoints.create();
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json() as Promise<ICustomerCreateResponse>;
}

// Tam IntelliSense!
const customer = await createCustomer({
  name: 'Əli Məmmədov',
  email: 'ali@example.com',
  settings: {
    notifications: true,
    theme: 'dark'
  }
});
```

## ⚙️ Konfiqurasiya

`swagger-codegen.config.js` yaradın:
```javascript
export default {
  swaggerUrl: 'https://api.example.com/docs/json',
  outputDir: './src/api',
  stripBasePath: '/v1/api',  // Optional: base path sil
  endpoints: {
    generateEndpoints: true,  // Optional: endpoint-lər generate et
  },
};
```

Sonra işə salın:
```bash
swagger-codegen -c swagger-codegen.config.js
```

## 🎯 CLI Seçimləri
```bash
Seçimlər:
  -o, --output <dir>         Output directory (default: ./src/api)
  -m, --models <dir>         Models subdirectory (default: models)
  -e, --endpoints [dir]      Endpoint-lər generate et (default: endpoints)
  --strip <path>             Base path sil (məs., /v1/api)
  -c, --config <path>        Config fayl yolu
  -v, --version              Versiya göstər
  -h, --help                 Kömək göstər
```

## 📚 Nümunələr

**Yalnız model-lər:**
```bash
swagger-codegen https://api.example.com/docs/json
```

**Model-lər + Endpoint-lər:**
```bash
swagger-codegen https://api.example.com/docs/json --endpoints
```

**Base path sil:**
```bash
swagger-codegen https://api.example.com/docs/json --endpoints --strip /v1/api
```

**Çoxlu API:**
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

## 🤔 Tez-tez Verilən Suallar

**S: React olmadan işləyir?**  
C: Bəli! Sadə TypeScript interface-lər yaradır.

**S: OpenAPI 3.0 dəstəyi?**  
C: Bəli, həm Swagger 2.0 həm də OpenAPI 3.0+.

**S: Generated kodu fərdiləşdirə bilərəm?**  
C: Generated faylları edit etməyin. Əvəzinə type-ları extend edin.

**S: Çoxlu Swagger mənbəyi?**  
C: Bəli, müxtəlif directory-lərə generate edin.

## 📝 Lisenziya

MIT © [build-ts](https://github.com/build-ts)

## 🔗 Linklər

- [NPM](https://www.npmjs.com/package/@build-ts/swagger-codegen)
- [GitHub](https://github.com/build-ts/swagger-codegen)
- [Issues](https://github.com/build-ts/swagger-codegen/issues)

⭐ [GitHub](https://github.com/build-ts/swagger-codegen)-da ⭐ verin!

---

❤️ ilə [build-ts](https://github.com/build-ts) tərəfindən hazırlanmışdır