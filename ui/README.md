# CONAFSync — Balance Presupuestario Mensual

App de gestión presupuestaria para la Dirección Regional de CONAF, Región de Los Ríos.

Automatiza el proceso mensual de consolidación del Balance Presupuestario desde archivos SIGFE, reemplazando el trabajo manual en Excel.

## Problema que resuelve

Cada mes, el Departamento de Finanzas y Administración (DEFA) descarga datos del sistema contable SIGFE y debe generar un informe de Balance Presupuestario que:
- Filtra solo **Bienes y Servicios** y **Viáticos** (excluye Personal/sueldos)
- Agrupa por **Programa Presupuestario** (CONAF 01, 03, 04, 05-Forestal, 05-Fiscalización, 06, PEE)
- Consolida **folios iguales** en una sola fila
- Separa datos por **oficina** (Regional, Valdivia, Panguipulli, Ranco)
- Muestra presupuesto asignado, gasto acumulado, saldo y % de avance

Este proceso manual toma horas y es propenso a errores. CONAFSync lo hace en segundos.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + RLS + Edge Functions)
- **Parser**: xlsx.js — procesamiento 100% en el navegador
- **Charts**: Recharts
- **Deploy**: Lovable.dev → Vercel
- **Repo**: [CONAF-AMPARO/defa-conaf](https://github.com/CONAF-AMPARO/defa-conaf)

## Formatos soportados

| Formato | Archivo ejemplo | Hojas |
|---------|----------------|-------|
| **Balance Consolidado** | `Balance Presup Consol al 30-11-2025.xls` | REGIONAL, VALDIVIA, PANGUIPULLI, RANCO, CONSOLIDADO |
| **SIGFE Raw** | `Base al 01.04.26 Blce Ppto ListadoDisponibilidadRequerimiento.xls` | Una sola hoja |

El parser auto-detecta el formato y procesa correctamente ambos.

## Programas presupuestarios

| Código | Nombre | Unidad Demandante |
|--------|--------|-------------------|
| 01 | Dirección-DEFA | — |
| 03 | DEPRIF (Manejo del Fuego) | — |
| 04 | DASP (Áreas Silvestres) | — |
| 05-GBCC | Dpto. Forestal | UD 12 |
| 05-FISC | Dpto. Fiscalización | UD 14 |
| 06 | Arborización | — |
| PEE | Prog. Empleos | — |

Programa 05 se separa automáticamente por Unidad Demandante (Catálogo 04 del SIGFE).

## Perfiles de acceso

| Perfil | Código | Permisos |
|--------|--------|----------|
| Administrador | `2025` | Acceso completo: subir, exportar, eliminar, configurar |
| Editor | `1234` | Subir archivos y exportar Excel |
| Consulta | `0000` | Solo lectura |

Los códigos se pueden cambiar desde Supabase > Table Editor > `app_profiles`.

## Base de datos (Supabase)

| Tabla | Descripción |
|-------|-------------|
| `balances` | Un registro por archivo subido (período, totales, archivo) |
| `balance_oficinas` | Datos por oficina dentro de un balance |
| `balance_programas` | Programas dentro de una oficina |
| `balance_items` | Líneas individuales (ByS o Viático) |
| `balance_alertas` | Sobregirados, críticos, sub-ejecutados |
| `balance_notes` | Notas y observaciones por balance (observación, acción, alerta manual) |
| `app_profiles` | Perfiles de usuario con código PIN |
| `access_log` | Registro de accesos y acciones |
| `app_settings` | Configuración de alertas y preferencias (key-value JSON) |
| `modification_log` | Auditoría de cambios en datos |

RLS habilitado en todas las tablas con políticas públicas (sin auth de Supabase, acceso controlado por PIN).

## Módulos

### Dashboard
- KPIs: Presupuesto total, ejecución acumulada, saldo, avance global
- Gráfico de barras por programa (presupuesto vs ejecutado)
- Cards por programa con barra de avance, iconos, montos
- Panel de alertas (sobregirados >100%, críticos >90%, sub-ejecutados <30%)

### Procesador (Upload)
- Drag & drop de archivos .xls/.xlsx
- Auto-detecta formato (Balance Consolidado o SIGFE Raw)
- Pipeline visual de procesamiento
- Muestra oficinas detectadas, programas, ítems, alertas
- Guarda automáticamente en Supabase

### Balance Mensual
- Tabla colapsable por programa
- Tabs dinámicos por oficina (desde datos parseados)
- Filtro ByS / Viáticos
- Búsqueda por título o folio
- Fila de totales generales
- Exportación avanzada con modal de configuración

### Histórico
- Gráfico combinado (barras + línea de % avance)
- Tabla de períodos con barras de progreso
- Variación mensual en puntos porcentuales
- Se alimenta de todos los balances guardados en Supabase

### Exportación Excel
- Presets: Completo, Solo alertas, Resumen ejecutivo, Por programa, Solo viáticos
- Filtros: programas, tipo (ByS/Viático), rango de avance (%), oficina
- Hojas: Resumen, Detalle, Alertas, Comparativo, Metadata
- Formato: pesos ($), miles (M$), millones (MM$)
- Opción de una hoja por programa

### Analytics Avanzado
Inspirado en [OpenGov](https://opengov.com), [ClearGov](https://cleargov.com), OneStream y dashboards fintech modernos.

- **Budget Health Score (0-100)**: métrica compuesta de 4 factores ponderados — ritmo de ejecución vs esperado (30%), homogeneidad entre programas (20%), ausencia de sobregiros (25%), saldo proyectado suficiente (25%)
- **Burn Rate & Forecast**: velocidad de gasto mensual, proyección al cierre del año, mes de agotamiento, detección de riesgo de sobregiro
- **Variance Analysis**: esperado vs ejecutado por programa (proporcional al mes), clasificación automática (adelantado/normal/retrasado/sobregirado), gráfico + tabla de detalle
- **What-If Simulator**: sliders por programa (-50% a +50%), impacto en tiempo real sobre avance %, saldo, alertas
- **Program Rankings**: ranking por ejecución con badges de riesgo (low/medium/high/critical)

### Configuración
- Umbrales de alerta editables por admin (sobregirado, crítico, alto, sub-ejecutado)
- Guardados en Supabase (`app_settings`)
- Solo perfil admin puede modificar

### Notas y Observaciones
- Sistema de notas por balance (observación, acción requerida, alerta manual)
- Cada nota tiene autor, fecha, programa asociado
- Se pueden marcar como resueltas
- Visible debajo de la tabla de Balance Mensual

### Comparador de períodos
- Selecciona 2 balances guardados para comparar lado a lado
- KPIs con deltas (presupuesto, ejecutado, saldo, avance) y flechas de dirección
- Gráfico de barras período A vs B por programa
- Tabla detalle con % delta y varianza monetaria por programa

### Gestión de balances
- Dropdown en header para listar todos los balances guardados
- Seleccionar cual visualizar
- Eliminar balances antiguos (cascade delete)
- **Detección inteligente de duplicados**: al subir un archivo del mismo período, pregunta si reemplazar el anterior o mantener ambos
- Se puede alimentar la app semanalmente o diariamente (no solo mensual)

### Recordatorio de actualización
- Banner inteligente en el Dashboard cuando no se suben datos por más de 7 días
- 3 niveles: azul (7-14 días), amarillo (14-30 días), rojo (+30 días)
- Botón "Subir ahora" que lleva directo al Procesador

### Ayuda interactiva
- Sección "Ayuda" en el sidebar con 11 secciones en acordeón
- Cubre cada pantalla paso a paso, pensada para usuarios no técnicos
- Tips destacados y preguntas frecuentes

## Guía de uso paso a paso

Esta guía está pensada para personas que no son técnicas. Explica cada pantalla con lenguaje simple.

---

### 1. Entrar a la plataforma

1. Abre el link de la aplicación en tu navegador (Chrome, Edge, Safari — cualquiera sirve)
2. Verás una pantalla oscura con 4 casillas para ingresar un número
3. Escribe tu **código de 4 dígitos** (cada persona tiene el suyo):
   - Administrador: `2025`
   - Editor: `1234`
   - Consulta: `0000`
4. El sistema te deja entrar automáticamente al escribir el cuarto dígito

> Si te equivocas, las casillas se sacuden y se borran solas. Solo vuelve a escribir el código.

---

### 2. Pantalla principal (Resumen)

Es lo primero que ves al entrar. Muestra un resumen rápido de cómo va el presupuesto:

- **4 recuadros arriba**: Presupuesto total, cuánto se ha gastado, cuánto queda, y el % de avance
- **Gráfico de barras**: compara lo asignado vs lo gastado por cada programa (CONAF 01, 03, 04, etc.)
- **Tarjetas por programa**: cada programa tiene su propia tarjeta con una barra de color que muestra qué tan gastado está
- **Alertas**: a la derecha aparecen avisos en rojo/amarillo si algún programa se está pasando del presupuesto

> Si no ves datos, es porque todavía no se ha subido ningún archivo. Ve al paso 3.

---

### 3. Subir un archivo (Procesador)

Así es como cargas los datos del mes:

1. En el menú de la izquierda, haz clic en **"Procesador"**
2. Verás un recuadro grande que dice "Arrastra el archivo aquí"
3. Tienes dos opciones:
   - **Arrastrar**: toma el archivo Excel desde tu carpeta y suéltalo sobre el recuadro
   - **Hacer clic**: haz clic en el recuadro y se abre una ventana para buscar el archivo
4. Selecciona el archivo `.xls` que bajaste del SIGFE
5. El sistema lo procesa automáticamente (demora unos segundos)
6. Cuando termine, verás:
   - Cuántas **oficinas** se detectaron (Regional, Valdivia, etc.)
   - Cuántos **programas** se encontraron
   - Cuántos **ítems** (líneas de gasto) tiene
   - Cuántas **alertas** hay
7. Haz clic en el botón verde **"Ver Balance Generado"** para ir a la tabla

> El archivo se guarda automáticamente en la nube. La próxima vez que entres, los datos ya estarán ahí.

**Archivos que acepta:**
- `Balance Presup Consol al XX-XX-XXXX.xls` (el consolidado con las 4 oficinas)
- `Base al XX.XX.XX Blce Ppto ListadoDisponibilidadRequerimiento.xls` (el que se baja directo del SIGFE)

---

### 4. Ver la tabla del Balance

1. En el menú de la izquierda, haz clic en **"Balance"**
2. Arriba verás pestañas con las oficinas: **Consolidado**, **Regional**, **Valdivia**, **Panguipulli**, **Ranco**
   - "Consolidado" suma todas las oficinas juntas
   - Haz clic en cualquier pestaña para ver solo esa oficina
3. Puedes filtrar por tipo de gasto:
   - **Todos**: muestra todo
   - **ByS**: solo Bienes y Servicios
   - **Viáticos**: solo viáticos
4. Cada programa se puede **expandir o colapsar** haciendo clic en su nombre
5. Los colores del % de avance significan:
   - **Verde**: todo bien (bajo 80%)
   - **Amarillo**: ojo, se está acercando al límite (80-90%)
   - **Rojo**: se pasó o está por pasarse (sobre 90%)
6. Al final de la tabla hay una fila negra con el **TOTAL GENERAL**

> Debajo de la tabla hay un espacio para **Notas**. Puedes dejar observaciones sobre el balance (ver paso 8).

---

### 5. Exportar a Excel

Si necesitas mandar el balance por correo o imprimirlo:

1. En la pantalla de Balance, haz clic en el botón verde **"Exportar"** (arriba a la derecha)
2. Se abre una ventana con opciones:
   - **Presets rápidos**: elige uno con un clic
     - "Completo" — todo
     - "Solo alertas" — solo lo que tiene problemas
     - "Resumen ejecutivo" — para jefatura
     - "Por programa" — una pestaña Excel por cada programa
     - "Solo viáticos" — filtra solo viáticos
   - **Filtros**: puedes marcar qué programas incluir, el tipo de gasto, y el rango de avance
   - **Formato de montos**: pesos ($), miles (M$), o millones (MM$)
3. Haz clic en **"Descargar .xlsx"**
4. Se descarga un archivo Excel a tu computador con varias hojas (Resumen, Detalle, Alertas, Comparativo)

---

### 6. Ver el Histórico

Si has subido balances de varios meses, puedes ver cómo ha evolucionado el gasto:

1. En el menú de la izquierda, haz clic en **"Histórico"**
2. Verás:
   - **3 recuadros**: último período, % de ejecución actual, y cuánto cambió respecto al mes anterior
   - **Gráfico**: barras grises (presupuesto) + barras verdes (ejecutado) + línea azul (% avance)
   - **Tabla**: detalle mes a mes con barras de progreso

> Mientras más meses subas, más útil se vuelve esta pantalla.

---

### 7. Analytics (análisis avanzado)

Para los que quieren entender más a fondo qué está pasando:

1. En el menú de la izquierda, haz clic en **"Analytics"**
2. Verás tres recuadros principales:
   - **Salud Presupuestaria**: un puntaje de 0 a 100 que resume qué tan bien va todo. Verde = bien, rojo = mal.
   - **Velocidad de Gasto**: cuánto se gasta por mes y si el presupuesto alcanza hasta fin de año. Si dice "Riesgo de sobregiro" en rojo, hay que tomar medidas.
   - **Ranking**: qué programa va más adelantado y cuál más atrasado
3. Más abajo hay un **gráfico de varianza**: compara lo que se debería haber gastado a esta fecha vs lo que realmente se gastó
4. Al final hay un **simulador "Qué pasa si..."**: mueve los controles deslizantes para ver qué pasaría si un programa gasta más o menos

---

### 8. Dejar notas u observaciones

Debajo de la tabla del Balance puedes dejar comentarios:

1. Haz clic en **"Agregar"**
2. Elige el tipo de nota:
   - **Observación**: un comentario general
   - **Acción requerida**: algo que alguien tiene que hacer
   - **Alerta manual**: una advertencia que quieres dejar registrada
3. Escribe tu nota y haz clic en **"Agregar nota"**
4. La nota queda visible para todos los que entran al sistema
5. Cuando el tema se resuelve, haz clic en el **check verde** para marcarla como resuelta

---

### 9. Cambiar entre balances guardados

Si has subido varios archivos de distintos meses:

1. En la barra superior, haz clic en el botón que muestra el período actual (ej: "noviembre 2025")
2. Se abre un listado con todos los balances guardados
3. Haz clic en el **ojo** para ver uno distinto
4. Haz clic en el **tacho de basura** para eliminar uno que ya no necesites (solo el administrador puede eliminar)

---

### 10. Configuración (solo administrador)

Si eres administrador (código `2025`):

1. En el menú de la izquierda, haz clic en **"Configuración"**
2. Puedes cambiar los **umbrales de alerta**:
   - A qué % se considera "sobregirado" (por defecto: 100%)
   - A qué % se considera "crítico" (por defecto: 90%)
   - A qué % se considera "alto" (por defecto: 80%)
   - A qué % se considera "sub-ejecutado" (por defecto: 30%)
3. Haz clic en **"Guardar umbrales"** para que los cambios se apliquen

---

### Preguntas frecuentes

**¿Se pierden los datos si cierro el navegador?**
No. Los datos quedan guardados en la nube. La próxima vez que entres con tu código, todo estará ahí.

**¿Puedo subir el mismo mes dos veces?**
Sí, pero quedarán ambas versiones guardadas. Puedes eliminar la que no necesites desde el selector de balances.

**¿Qué pasa si subo un archivo equivocado?**
Lo puedes eliminar desde el selector de balances (botón de tacho de basura) y subir el correcto.

**¿Funciona en el celular?**
Sí. La plataforma se adapta a pantallas chicas. El menú se esconde y aparece un botón de menú arriba a la izquierda.

**¿Necesito instalar algo?**
No. Solo necesitas un navegador web (Chrome, Edge, Safari) y conexión a internet.

**¿Quién puede ver mis datos?**
Solo las personas que tienen un código de acceso. Cada acción queda registrada (quién entró, quién subió archivos, etc.).

---

## Viáticos vs ByS

- **Viáticos**: código de concepto que empieza con `2101` (Comisiones de Servicios en el País)
- **Bienes y Servicios**: todo lo demás (22xx, 34xx, etc.)

Esto es consistente con la clasificación presupuestaria del SIGFE.

## Desarrollo local

```bash
git clone https://github.com/CONAF-AMPARO/defa-conaf.git
cd defa-conaf
npm install
npm run dev
# Abre http://localhost:8080
```

Variables de entorno (`.env`):
```
VITE_SUPABASE_URL=https://iikkpvvfnbcztcvsjvbz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
```

## Supabase CLI

```bash
supabase link --project-ref iikkpvvfnbcztcvsjvbz
supabase db push  # aplica migraciones
```

## Verificación del parser

Los totales del parser fueron verificados fila por fila contra los 4 archivos Excel originales de René:

| Oficina | Rows | ByS Ppto | Viat Ppto | Status |
|---------|------|----------|-----------|--------|
| Regional | 55 | $1,924M | $62M | OK |
| Valdivia | 34 | $548M | $17M | OK |
| Panguipulli | 32 | $105M | $7M | OK |
| Ranco | 29 | $279M | $11M | OK |
| **SIGFE Raw** | 307 | $6,786M total | — | OK |

## Equipo

| Persona | Rol |
|---------|-----|
| René Hernández | Jefe Regional Depto. Administración y Finanzas (DEFA), usuario principal |
| Amparo Donoso | Desarrollo y automatización |
