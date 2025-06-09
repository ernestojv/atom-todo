# 🚀 Atom TODO - Challenge Técnico FullStack

![Angular](https://img.shields.io/badge/Angular-19-red?style=for-the-badge&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange?style=for-the-badge&logo=firebase)
![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=for-the-badge&logo=node.js)

## 📋 Descripción

**Atom TODO** es la solución al challenge técnico FullStack Developer de **Atom**. Una aplicación completa de gestión de tareas desarrollada con Angular 19 y las mejores prácticas de desarrollo frontend moderno.

### 🌐 **Demo en Vivo**
🔗 **[Ver Aplicación](https://ernestojv-atom-todo.web.app/auth/login)**

---

## ✨ Características Implementadas

### 🎯 **Funcionalidades Core** (Según Challenge)
- ✅ **Sistema de autenticación** por email
- ✅ **Creación automática de usuarios** si no existen
- ✅ **Gestión completa de tareas** (CRUD)
- ✅ **Estados de tareas**: Por Hacer, En Progreso, Completadas
- ✅ **Interfaz responsive** para todos los dispositivos

### 🏗️ **Arquitectura y Patrones Frontend**
- ✅ **Arquitectura modular** con separación de capas
- ✅ **Principios SOLID** aplicados
- ✅ **Componentes standalone** (Angular 19)
- ✅ **Observables y RxJS** para gestión de estado
- ✅ **Reactive Forms** con validaciones
- ✅ **Guards** para protección de rutas
- ✅ **Interceptors** para manejo de JWT
- ✅ **TypeScript** con tipado fuerte

### 🎨 **UX/UI y Accesibilidad**
- ✅ **Design System** con Tailwind CSS
- ✅ **Accesibilidad completa** (WCAG 2.1 AA)
- ✅ **Navegación por teclado**
- ✅ **Lectores de pantalla** compatibles
- ✅ **Estados de loading** y feedback visual
- ✅ **Responsive design** móvil-first

### ⚡ **Optimizaciones de Performance**
- ✅ **Lazy loading** de módulos
- ✅ **OnPush** change detection
- ✅ **TrackBy** functions para *ngFor
- ✅ **Async pipe** para prevenir memory leaks
- ✅ **Tree shaking** y code splitting
- ✅ **Caching** con service workers

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **Angular 19** - Framework principal
- **TypeScript** - Lenguaje tipado
- **Tailwind CSS** - Framework de estilos
- **RxJS** - Programación reactiva
- **PrimeIcons** - Iconografía

### **DevOps & Tools**
- **Firebase Hosting** - Deploy y CDN
- **GitHub Actions** - CI/CD automático
- **ESLint** - Linting de código
- **Prettier** - Formateo de código

---

## 🚀 Inicio Rápido

### **📋 Prerequisitos**
```bash
# Node.js 20+ requerido
node --version  # v22.15.0
npm --version   # 10.9.2

# Angular CLI 19
npm install -g @angular/cli@19
```

### **⚡ Instalación**
```bash
# 1. Clonar repositorio
git clone https://github.com/ernestojv/atom-todo.git
cd atom-todo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp src/environments/environment.example.ts src/environments/environment.ts

# 4. Ejecutar en desarrollo
npm start
```

### 🔧 Variables de Entorno
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://tu-backend-url.cloudfunctions.net/api'
};
```

---

## 📱 Scripts Disponibles

```bash
# Desarrollo
npm start                 # Servidor de desarrollo (http://localhost:4200)
npm run dev              # Alias para start

# Build
npm run build            # Build de desarrollo
npm run build:prod       # Build optimizado para producción
npm run build:staging    # Build para staging

# Linting & Formatting
npm run lint             # Verificar código con ESLint
npm run lint:fix         # Corregir problemas automáticamente
npm run format           # Formatear código con Prettier

# Análisis
npm run analyze          # Analizar bundle size
npm run audit            # Auditoría de dependencias
```

---


## 🚀 Despliegue

### **🔄 CI/CD Automático**
El proyecto incluye pipeline automático con **GitHub Actions**:

1. **Push a `main`** → Deploy automático a producción
2. **Pull Request** → Deploy preview automático
3. **Build optimizado** para producción

### **📦 Deploy Manual**
```bash
# Build de producción
npm run build:prod

# Deploy con Firebase CLI
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```

### **🌐 URLs de Deploy**
- **Producción**: https://ernestojv-atom-todo.web.app/auth/login
- **Preview**: URLs automáticas en cada PR

---

## 🛡️ Características de Seguridad Frontend

- ✅ **JWT Authentication** con manejo automático de tokens
- ✅ **Route Guards** para protección de rutas
- ✅ **HTTP Interceptors** para manejo automático de tokens
- ✅ **Input validation** con Reactive Forms
- ✅ **XSS Protection** con sanitización de Angular
- ✅ **Type safety** con TypeScript

---

## ♿ Accesibilidad

- ✅ **WCAG 2.1 AA** compliant
- ✅ **Keyboard navigation** completa
- ✅ **Screen reader** compatible
- ✅ **ARIA labels** y landmarks
- ✅ **Focus management** apropiado
- ✅ **High contrast** support

---

## 📊 Performance

### **Optimizaciones Implementadas**
- ✅ **Lazy loading** de rutas
- ✅ **OnPush** change detection strategy
- ✅ **TrackBy** functions en listas
- ✅ **Image optimization**
- ✅ **Bundle splitting**
- ✅ **Preloading** de módulos críticos
