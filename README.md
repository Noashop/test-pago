# Salta Conecta - Plataforma Mayorista

![Salta Conecta Logo](public/logo.png)

## 📋 Descripción del Proyecto

**Salta Conecta** es una plataforma de comercio electrónico mayorista que conecta proveedores, distribuidoras y fabricantes con compradores mayoristas. La plataforma permite a los proveedores ofrecer productos al por mayor con aprobación administrativa, garantizando calidad y confiabilidad en cada transacción.

### 🎯 Objetivo Principal

Crear un ecosistema digital que facilite las transacciones mayoristas, proporcionando:
- **Transparencia** en precios y productos
- **Control de calidad** mediante aprobación administrativa
- **Eficiencia** en la gestión de pedidos y pagos
- **Escalabilidad** para el crecimiento empresarial

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Base de Datos**: MongoDB con Mongoose ODM
- **Autenticación**: NextAuth.js con Google OAuth
- **Pagos**: Mercado Pago SDK
- **UI/UX**: Tailwind CSS, Radix UI, Lucide React
- **Almacenamiento**: Cloudinary para imágenes
- **Estado Global**: Zustand
- **Validación**: Zod schemas
- **Testing**: Jest, Testing Library

### 🔧 Dependencias Principales

```json
{
  "next": "^15.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "mongoose": "^7.6.0",
  "next-auth": "^4.24.0",
  "mercadopago": "^2.0.0",
  "cloudinary": "^1.41.0",
  "tailwindcss": "^3.4.0",
  "zustand": "^4.4.0"
}
```

## 👥 Sistema de Roles y Permisos

### 🔐 Roles de Usuario

#### 1. **Administrador (Admin)**
- **Permisos Completos**: Gestión total de la plataforma
- **Funcionalidades**:
  - Aprobación/rechazo de proveedores
  - Aprobación/rechazo de productos
  - Gestión de usuarios y pedidos
  - Configuración de precios finales
  - Acceso a reportes y estadísticas
  - Gestión de banners y promociones

#### 2. **Proveedor (Supplier)**
- **Acceso Condicional**: Requiere aprobación administrativa
- **Funcionalidades**:
  - Registro de productos con información detallada
  - Gestión de inventario y precios
  - Seguimiento de ventas y pedidos
  - Chat con compradores
  - Facturación y comisiones
  - Dashboard con métricas de rendimiento

#### 3. **Cliente/Comprador (Customer)**
- **Acceso Inmediato**: Aprobación automática
- **Funcionalidades**:
  - Navegación y búsqueda de productos
  - Carrito de compras mayorista
  - Gestión de pedidos
  - Historial de compras
  - Chat con proveedores

## 🚀 Funcionalidades Principales

### 📦 Gestión de Productos

#### Para Proveedores:
- **Registro de Productos**: Formulario completo con validaciones
  - Información general (nombre, descripción, categoría)
  - Precios (costo, venta, recomendado para reventa)
  - Inventario (stock, cantidad mínima de compra)
  - Imágenes múltiples con Cloudinary
  - Campos específicos por categoría

- **Estados de Productos**:
  - `pending`: Pendiente de aprobación
  - `approved`: Aprobado para venta
  - `rejected`: Rechazado con motivo

- **Edición de Productos**: 
  - Modificación de precios y stock
  - Productos aprobados vuelven a estado pendiente tras edición

#### Para Administradores:
- **Panel de Aprobación**: Revisión masiva de productos
- **Gestión de Precios**: Configuración de precios finales
- **Control de Calidad**: Aprobación/rechazo con comentarios

### 🛒 Sistema de Pedidos

#### Flujo de Pedidos:
1. **Creación**: Cliente agrega productos al carrito
2. **Validación**: Verificación de stock y cantidades mínimas
3. **Pago**: Integración con Mercado Pago
4. **Procesamiento**: Notificación a proveedores
5. **Envío**: Gestión por parte del proveedor
6. **Entrega**: Confirmación y cierre del pedido

#### Estados de Pedidos:
- `pending`: Pendiente de confirmación
- `confirmed`: Confirmado por el proveedor
- `shipped`: Enviado
- `delivered`: Entregado
- `cancelled`: Cancelado

### 💰 Sistema de Pagos y Comisiones

#### Estructura de Precios:
- **Precio de Costo**: Costo del proveedor (opcional)
- **Precio de Venta**: Precio mayorista
- **Precio Recomendado**: Sugerencia para reventa
- **Precio Final**: Determinado por el administrador

#### Distribución de Ganancias:
- **51%**: Propietario principal (Facundo Maximiliano Cercuetti)
- **10%**: Captadores (por proveedor adherido)
- **Resto**: Empresa y gastos operativos

### 👤 Gestión de Usuarios

#### Registro y Autenticación:
- **Múltiples métodos**: Email/contraseña, Google OAuth
- **Verificación**: Email de confirmación
- **Roles automáticos**: Clientes aprobados, proveedores pendientes

#### Aprobación de Proveedores:
- **Proceso manual**: Revisión administrativa
- **Documentación**: Información comercial completa
- **Estados**: Pendiente, aprobado, rechazado

### 📊 Dashboard y Reportes

#### Panel Administrativo:
- **Métricas generales**: Usuarios, productos, ventas
- **Gestión de contenido**: Banners, promociones
- **Reportes financieros**: Ingresos, comisiones
- **Análisis de rendimiento**: Productos más vendidos

#### Panel de Proveedores:
- **Estadísticas de ventas**: Ingresos, productos vendidos
- **Gestión de productos**: Estados, rendimiento
- **Facturación**: Comisiones, pagos pendientes
- **Comunicación**: Chat con compradores

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- MongoDB
- Cuenta de Cloudinary
- Cuenta de Mercado Pago

### Variables de Entorno

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/salta-conecta

# Autenticación
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=your-access-token
MERCADOPAGO_PUBLIC_KEY=your-public-key

# Email
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email
EMAIL_SERVER_PASSWORD=your-password
EMAIL_FROM=noreply@saltaconecta.com
```

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/your-repo/salta-conecta.git
cd salta-conecta

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev                    # Servidor de desarrollo
npm run build                  # Construir para producción
npm run start                  # Servidor de producción

# Testing
npm run test                   # Ejecutar tests
npm run test:watch            # Tests en modo watch

# Utilidades
npm run lint                   # Linter
npm run type-check            # Verificación de tipos

# Configuración
npm run setup:cloudinary      # Configurar Cloudinary
npm run setup:categories      # Configurar categorías
npm run migrate:clean         # Migración limpia de datos
```

## 🏢 Información Corporativa

### Estructura Empresarial

**Razón Social**: Salta Conecta  
**Domicilio**: Pasaje La Tablada 159, Salta Capital, Argentina  
**Propietario Principal**: Facundo Maximiliano Cercuetti (51%)  
**Tipo de Sociedad**: Acciones nominativas  

### Roles Organizacionales

#### CEO - Facundo Maximiliano Cercuetti
- **Responsabilidades**:
  - Dirección general de la empresa
  - Programación y desarrollo de la plataforma
  - Análisis estratégico y toma de decisiones
  - Supervisión de todas las operaciones

#### Captadores
- **Función**: Búsqueda y adhesión de proveedores
- **Comisión**: 10% sobre ventas del proveedor adherido
- **Objetivo**: Expandir la red de proveedores con los mejores precios

#### Equipo de Publicidad
- **Responsabilidades**:
  - Creación de estrategias de marketing
  - Gestión de Google Ads y YouTube
  - Maximización de ventas en la plataforma
  - Desarrollo de campañas promocionales

#### Equipo de Comunicación
- **Funciones**:
  - Gestión del sistema de chat
  - Mensajes de reporte y notificaciones
  - Atención al cliente
  - Comunicación interna

### Políticas Operativas

#### Responsabilidades de Envío
- **Proveedores**: Responsables de envíos a domicilio
- **Plataforma**: Facilita la logística y seguimiento
- **Clientes**: Reciben productos directamente del proveedor

#### Sistema Monetario
- **Moneda**: Peso Argentino (ARS)
- **Pasarela de pago**: Mercado Pago
- **Métodos**: Tarjetas, transferencias, efectivo

## 📋 Estatutos de la Empresa

### CAPÍTULO I: DENOMINACIÓN, OBJETO Y DOMICILIO

**Artículo 1 - Denominación**: La empresa se denominará "Salta Conecta".

**Artículo 2 - Objeto**: La empresa tiene por objeto la creación y gestión de una tienda online mayorista que permite a proveedores, distribuidoras, fabricantes y otros proveer productos de ventas por mayor aprobadas por un solo administrador.

**Artículo 3 - Domicilio**: El domicilio de la empresa será Pasaje La Tablada 159, Salta Capital, Argentina.

### CAPÍTULO II: ESTRUCTURA DE PROPIEDAD

**Artículo 4 - Propietario**: Facundo Maximiliano Cercuetti será el propietario del 51% de la empresa.

**Artículo 5 - Participaciones**: Las participaciones de la empresa serán representadas por acciones nominativas.

### CAPÍTULO III: ROLES Y RESPONSABILIDADES

**Artículo 6 - CEO**: Facundo Maximiliano Cercuetti será el CEO y se encargará de la dirección general de la empresa, incluyendo la programación, análisis y desarrollo de la plataforma.

**Artículo 7 - Captadores**: Los captadores serán responsables de buscar proveedores con el mejor precio para adherirlos a la plataforma y recibirán una comisión del 10% sobre las ventas generadas por el proveedor adherido.

**Artículo 8 - Publicidad**: El rol de publicidad será responsable de crear publicidad y estrategias para maximizar las ventas dentro de la plataforma y para Google Ads y YouTube, entre otros.

**Artículo 9 - Comunicación**: El rol de comunicación será responsable de los mensajes de reporte y chat en la plataforma.

### CAPÍTULO IV: POLÍTICA DE PRECIOS

**Artículo 10 - Precios**: Los proveedores asignarán un precio de costo, un precio de venta y un precio recomendable de reventa. El administrador decidirá qué precio ponerle al producto antes de ser publicado.

### CAPÍTULO V: GANANCIAS Y DISTRIBUCIÓN

**Artículo 11 - Ganancias**: Las ganancias de la plataforma se calcularán sobre la diferencia entre el precio de costo del proveedor y el precio de venta publicado por el administrador.

**Artículo 12 - Distribución de ganancias**: Las ganancias se distribuirán de la siguiente manera: 51% para el propietario, 10% para los captadores y el resto para la empresa.

### CAPÍTULO VI: RESPONSABILIDAD DE LOS PROVEEDORES

**Artículo 13 - Envíos**: Los proveedores serán responsables de los envíos de pedidos a domicilio.

### CAPÍTULO VII: MONEDA Y PAGOS

**Artículo 14 - Moneda**: La moneda utilizada será el Peso Argentino.

**Artículo 15 - Pasarela de pago**: La empresa utilizará la pasarela de pago de Mercado Pago.

### CAPÍTULO VIII: GOBIERNO Y TOMA DE DECISIONES

**Artículo 16 - CEO**: El CEO tendrá la autoridad para tomar decisiones importantes.

**Artículo 17 - Reuniones**: Las reuniones de la empresa se realizarán con la presencia de al menos el 51% de los propietarios.

### CAPÍTULO IX: INGRESO Y EGRESO DE INTEGRANTES DEL STAFF

**Artículo 18 - Ingreso**: El ingreso de nuevos integrantes del staff se realizará mediante la aprobación del CEO.

**Artículo 19 - Egreso**: El egreso de un integrante del staff se realizará mediante la decisión del CEO, con causa justificada.

### CAPÍTULO X: NORMAS Y REGULACIONES

**Artículo 20 - Cumplimiento**: La empresa cumplirá con las leyes argentinas y del Mercosur aplicables al negocio.

### CAPÍTULO XI: DISPOSICIONES FINALES

**Artículo 21 - Modificaciones**: Cualquier modificación a este estatuto deberá ser aprobada por el 51% de los propietarios.

**Artículo 22 - Vigencia**: Este estatuto entrará en vigor a partir de la fecha de su aprobación.

## 📋 Documentación Legal Requerida

### Para Inscripción en el Registro Público de Comercio:
- [ ] Estatuto social firmado
- [ ] Acta constitutiva
- [ ] Designación de autoridades
- [ ] Comprobante de domicilio legal
- [ ] Documento de identidad del representante legal

### Para Obtención del CUIT:
- [ ] Formulario 460/J (AFIP)
- [ ] Documento de identidad
- [ ] Comprobante de domicilio
- [ ] Constancia de inscripción en el Registro Público

### Cumplimiento Normativo:
- [ ] Ley de Defensa del Consumidor (24.240)
- [ ] Ley de Comercio Electrónico (25.506)
- [ ] Normativas de AFIP para e-commerce
- [ ] Regulaciones de Mercado Pago
- [ ] Protección de Datos Personales (25.326)

## 🔒 Seguridad y Privacidad

### Medidas de Seguridad:
- **Autenticación robusta**: JWT tokens, OAuth
- **Validación de datos**: Esquemas Zod
- **Rate limiting**: Prevención de ataques
- **Sanitización**: Prevención de XSS e inyecciones
- **HTTPS**: Comunicación encriptada

### Protección de Datos:
- **Encriptación**: Contraseñas con bcrypt
- **Tokens seguros**: Manejo de sesiones
- **Validación de archivos**: Imágenes seguras
- **Logs de auditoría**: Seguimiento de acciones

## 📈 Roadmap y Futuras Funcionalidades

### Fase 1 - Funcionalidades Básicas ✅
- [x] Sistema de autenticación
- [x] Gestión de productos
- [x] Panel administrativo
- [x] Sistema de pedidos básico

### Fase 2 - Mejoras de UX 🚧
- [x] Panel de proveedores mejorado
- [x] Sistema de chat
- [x] Edición de productos
- [ ] Notificaciones push
- [ ] App móvil

### Fase 3 - Escalabilidad 📋
- [ ] API pública para integraciones
- [ ] Sistema de afiliados avanzado
- [ ] Inteligencia artificial para recomendaciones
- [ ] Marketplace internacional

## 🤝 Contribución

### Para Desarrolladores:
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código:
- **TypeScript**: Tipado estricto
- **ESLint**: Linting configurado
- **Prettier**: Formateo automático
- **Conventional Commits**: Mensajes estandarizados

## 📞 Contacto y Soporte

**Empresa**: Salta Conecta  
**CEO**: Facundo Maximiliano Cercuetti  
**Dirección**: Pasaje La Tablada 159, Salta Capital, Argentina  
**Email**: info@saltaconecta.com  
**Soporte Técnico**: soporte@saltaconecta.com  

### Canales de Comunicación:
- **Website**: [www.saltaconecta.com](https://www.saltaconecta.com)
- **GitHub**: [github.com/salta-conecta](https://github.com/salta-conecta)
- **LinkedIn**: [Salta Conecta](https://linkedin.com/company/salta-conecta)

---

## ⚖️ Nota Legal

**Este documento constituye un borrador de los estatutos empresariales. Es fundamental que un abogado especializado en derecho comercial revise y apruebe los estatutos antes de su implementación oficial. La empresa se compromete a cumplir con todos los requisitos legales y regulatorios aplicables en Argentina y el Mercosur.**

---

*Última actualización: Enero 2025*  
*Versión: 1.0.0*  
*Licencia: Propietaria - Salta Conecta*
# mayorista-demo-13-08-25
