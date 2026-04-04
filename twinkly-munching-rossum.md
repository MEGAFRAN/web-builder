# Plan: Plataforma Multi-Tenant SSG con Next.js + Azure Static Web Apps

## Contexto

El usuario es desarrollador de software que quiere construir una plataforma multi-tenant para más de 100 sitios web estáticos de clientes (restaurantes, peluquerías, electricistas, etc.), usando un único codebase Next.js con SSG puro (`output: 'export'`), desplegado en Azure Static Web Apps, y un Headless CMS como motor de contenido dinámico por cliente.

---

## 1. Opinión General

### Lo que está bien planteado

- **Catch-all routes `[...slug]/page.tsx`** — patrón correcto para un motor universal de renderizado. Evita archivos físicos por página.
- **Page Builder con bloques dinámicos desde el CMS** — es el enfoque estándar de la industria (Sanity, Contentful, Builder.io). Escalable y flexible.
- **Navbar dinámica por cliente desde el CMS** — elimina el hardcode de rutas, fundamental para multi-tenant real.
- **Webhook + clientId para builds aislados** — idea correcta para no reconstruir los 100 clientes ante un cambio de uno solo.
- **TypeScript fuertemente tipado** — crítico cuando mapeas bloques del CMS que pueden o no existir por cliente.

### Los desafíos reales (no obvios)

1. **SSG puro + multi-tenant = tensión estructural**
   Con `output: 'export'`, `generateStaticParams` debe conocer en build time TODAS las páginas de TODOS los clientes. Sin aislamiento de build, construyes el sitio completo de 100 clientes en cada deploy. A 100 clientes × 20 páginas = 2000 páginas por build. Escala mal.

2. **`next/image` no funciona con `output: 'export'` sin loader personalizado**
   El optimizador de imágenes de Next.js requiere un server runtime. Con export estático necesitas un loader externo (Cloudinary, Imgix, Azure CDN con reglas de transformación).

3. **ISR está fuera de la ecuación**
   Sin ISR, cada cambio de contenido requiere un rebuild completo del cliente afectado. Hay que diseñar el pipeline para que esto sea rápido y no bloquee.

4. **Aislamiento de deployment**: ¿Un Azure Static Web App por cliente o todos en uno?
   - **Un SWA por cliente**: Aislamiento total, dominios custom nativos, un pipeline de CI/CD por cliente. Overhead de gestión de recursos Azure (100+ recursos).
   - **Un SWA con rutas por subdirectorio**: Más simple, pero complica los dominios custom y el aislamiento de código.

---

## 2. Arquitectura Recomendada

### Estructura de deployment

```
Azure Front Door (enrutador de dominios custom)
  ├── restaurante-pepe.com  →  Azure SWA: client-restaurante-pepe
  ├── peluqueria-ana.com    →  Azure SWA: client-peluqueria-ana
  └── electricista-juan.com →  Azure SWA: client-electricista-juan
```

- **Un Azure Static Web App por cliente** con su propio custom domain.
- **Azure Front Door** como enrutador global (opcional si usas subdominios propios: `pepe.tuplataforma.com`).
- Cada SWA tiene su propia clave de deployment.

### Estructura de builds aislados

```yaml
# GitHub Actions - Webhook trigger from CMS
on:
  workflow_dispatch:
    inputs:
      clientId:
        description: 'Client to rebuild'
        required: true

jobs:
  build-client:
    runs-on: ubuntu-latest
    env:
      CLIENT_ID: ${{ github.event.inputs.clientId }}
      CMS_TOKEN: ${{ secrets[format('CMS_TOKEN_{0}', github.event.inputs.clientId)] }}
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets[format('SWA_TOKEN_{0}', github.event.inputs.clientId)] }}
```

### Arquitectura Next.js

```
app/
  layout.tsx              # Root layout (lee config del cliente desde env CLIENT_ID)
  [...slug]/
    page.tsx              # Motor universal — catch-all
    
lib/
  cms.ts                  # Abstracción CMS (agnóstica del proveedor)
  client-config.ts        # Lee config del cliente activo
  
components/
  blocks/                 # Componentes por tipo de bloque
    HeroBlock.tsx
    ServicesBlock.tsx
    ContactBlock.tsx
    BlogBlock.tsx
    ...
  
config/
  clients/
    restaurante-pepe.json  # Feature flags + CMS space ID por cliente
    peluqueria-ana.json
```

### `[...slug]/page.tsx` — Motor Universal

```typescript
// Solo genera páginas del cliente activo (CLIENT_ID en env)
export async function generateStaticParams() {
  const clientId = process.env.CLIENT_ID!
  const pages = await cms.getPages(clientId)
  return pages.map(page => ({ slug: page.slug.split('/') }))
}

export default async function Page({ params }: { params: { slug: string[] } }) {
  const clientId = process.env.CLIENT_ID!
  const slug = params.slug.join('/')
  const page = await cms.getPage(clientId, slug)
  
  return (
    <PageRenderer blocks={page.blocks} />
  )
}
```

### Page Builder con TypeScript fuerte

```typescript
// Tipos discriminados por tipo de bloque
type Block =
  | { _type: 'hero'; title: string; subtitle?: string; cta?: CTA }
  | { _type: 'services'; items: Service[] }
  | { _type: 'contact'; showMap: boolean; phone?: string }
  | { _type: 'blog_list'; postsPerPage: number }

function PageRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block._type) {
          case 'hero': return <HeroBlock key={i} {...block} />
          case 'services': return <ServicesBlock key={i} {...block} />
          case 'contact': return <ContactBlock key={i} {...block} />
          case 'blog_list': return <BlogListBlock key={i} {...block} />
          default: return null // bloque no implementado para este cliente
        }
      })}
    </>
  )
}
```

---

## 3. CMS Recomendado: Sanity

- **Proyectos + Datasets** = modelo multi-tenant nativo. Un dataset por cliente.
- **GROQ** permite queries muy flexibles para estructuras de datos dinámicas.
- **Sanity Studio** embebible en la plataforma como panel de admin por cliente.
- Webhooks nativos con payload configurable (incluir clientId en el payload).
- Alternativa: **Contentful** (spaces por cliente) — más costoso a escala.

---

## 4. Imágenes

Recomendación: **Cloudinary** con el loader de Next.js.

```typescript
// next.config.ts
const nextConfig = {
  output: 'export',
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.ts',
  }
}
```

Alternativa más simple: **Sanity's built-in image CDN** (si usas Sanity como CMS) — tiene transformaciones on-the-fly sin infraestructura adicional.

---

## 5. Config por cliente (JSON versionado en repo)

```json
// config/clients/restaurante-pepe.json
{
  "clientId": "restaurante-pepe",
  "displayName": "Restaurante Pepe",
  "sanityDataset": "restaurante-pepe-prod",
  "customDomain": "restaurante-pepe.com",
  "swaResourceName": "swa-restaurante-pepe",
  "features": {
    "blog": false,
    "booking": true,
    "gallery": true,
    "menu": true,
    "policy": false
  },
  "theme": {
    "primaryColor": "#c0392b",
    "font": "Playfair Display"
  }
}
```

---

## 6. Mejoras adicionales

1. **Turborepo** si el proyecto crece: paquetes compartidos (`ui`, `cms-client`, `types`) aislados del app de Next.js.
2. **Build matrix en GitHub Actions**: permite construir múltiples clientes en paralelo si se necesita rebuild masivo.
3. **Preview environments por cliente**: rama `preview/[clientId]` → deploy a SWA de staging con Azure Static Web Apps environments.
4. **Abstracción del CMS**: interface `CMSProvider` con implementaciones para Sanity y Contentful, para no casarse con un proveedor.
5. **Caché de builds**: GitHub Actions cache de `.next/cache` por clientId para acelerar rebuilds incrementales.

---

## Decisiones confirmadas

| Decisión | Elección |
|---|---|
| Deployment | **Un Azure Static Web App por cliente** — aislamiento real, pipeline independiente |
| Dominios | **Dominios custom propios del cliente** — cada cliente apunta su dominio |
| CMS | **Sanity** — datasets por cliente, CDN de imágenes integrado (resuelve `next/image` con `output:export`) |
| Imágenes | **Sanity Image CDN** con `@sanity/image-url` como loader de Next.js |
| Estilos | **Tailwind CSS + CSS Custom Properties** — Tailwind para layout/utilidades, variables CSS para tema visual del cliente |

### Sistema de temas con Tailwind + CSS Variables

El tema por cliente (colores, fuentes, border-radius) se almacena en el JSON de config del cliente y/o en Sanity. En el `layout.tsx` del root se inyecta un `<style>` tag con las variables del cliente activo:

```tsx
// app/layout.tsx
import { getClientConfig } from '@/lib/client-config'

export default async function RootLayout({ children }) {
  const config = await getClientConfig(process.env.CLIENT_ID!)
  const { theme } = config

  return (
    <html>
      <head>
        <style>{`
          :root {
            --color-primary: ${theme.primaryColor};
            --color-accent: ${theme.accentColor};
            --color-bg: ${theme.backgroundColor};
            --font-heading: '${theme.fontHeading}', serif;
            --font-body: '${theme.fontBody}', sans-serif;
            --radius: ${theme.borderRadius}px;
          }
        `}</style>
      </head>
      <body style={{ fontFamily: 'var(--font-body)' }}>{children}</body>
    </html>
  )
}
```

Tailwind se usa para layout, spacing y utilidades. Las clases que dependen del tema usan variables CSS via `[var(--color-primary)]` o clases semánticas definidas en `globals.css`.

**Fuentes**: Google Fonts cargadas dinámicamente por cliente usando `next/font/google` con el font name del config, o via `<link>` en el `<head>` si la fuente no está en el set de Next.js.

**Archivo `globals.css`** define las clases semánticas reutilizables:
```css
.btn-primary { @apply px-6 py-3 font-semibold; background-color: var(--color-primary); border-radius: var(--radius); }
.text-brand { color: var(--color-primary); }
.section { @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16; }
```

---

## Archivos críticos a crear (fase inicial)

| Archivo | Propósito |
|---|---|
| `next.config.ts` | SSG export + image loader config |
| `app/[...slug]/page.tsx` | Motor universal de renderizado |
| `lib/cms.ts` | Abstracción CMS agnóstica |
| `lib/client-config.ts` | Lee config del cliente activo (env CLIENT_ID) |
| `components/blocks/index.ts` | Registry de bloques dinámicos |
| `types/cms.ts` | Tipos discriminados de bloques |
| `config/clients/*.json` | Config por cliente |
| `.github/workflows/deploy-client.yml` | Pipeline aislado por cliente |
