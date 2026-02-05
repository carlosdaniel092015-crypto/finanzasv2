# 🔄 Cómo Actualizar la PWA

Si instalaste la aplicación como PWA y no ves los últimos cambios, sigue estos pasos:

## Opción 1: Forzar Actualización (Recomendado)

### En Chrome/Edge (PC):
1. Abre la PWA instalada
2. Presiona `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
3. Esto forzará una recarga sin caché

### En Chrome (Android):
1. Abre Chrome (no la PWA)
2. Ve a `chrome://apps`
3. Encuentra "Finance App"
4. Click derecho → "Desinstalar"
5. Visita nuevamente la URL de la app
6. Reinstala la PWA

### En Safari (iOS):
1. Ve a Ajustes → Safari
2. Toca "Borrar historial y datos de sitios web"
3. Vuelve a agregar la app a la pantalla de inicio

## Opción 2: Limpiar Caché Manualmente

### En el Navegador:
1. Abre DevTools (F12)
2. Ve a la pestaña "Application" o "Aplicación"
3. En el menú izquierdo, busca "Storage" o "Almacenamiento"
4. Click en "Clear site data" o "Borrar datos del sitio"
5. Recarga la página

## Opción 3: Desinstalar y Reinstalar

1. **Desinstala la PWA:**
   - Windows: Configuración → Aplicaciones → Busca "Finance App" → Desinstalar
   - Android: Mantén presionado el ícono → Desinstalar
   - iOS: Mantén presionado el ícono → Eliminar

2. **Reinstala:**
   - Visita la URL de la aplicación en el navegador
   - Click en el botón de "Instalar" cuando aparezca

## 🆕 Nuevas Características (Versión Actual)

- ✅ Carga múltiple de imágenes/PDFs de facturas
- ✅ Vista previa de miniaturas
- ✅ Botones de acción (Delete, Copy, Bookmark)
- ✅ OCR mejorado para extracción automática de datos
- ✅ Almacenamiento en Supabase Storage
- ✅ Interfaz mejorada con diseño premium

## 🐛 Problemas Comunes

### No veo las nuevas funciones
- Asegúrate de haber limpiado el caché
- Verifica que estés usando la última versión del navegador
- Intenta acceder desde modo incógnito primero

### La PWA no se actualiza automáticamente
- Las PWA usan Service Workers que cachean agresivamente
- Necesitas forzar la actualización manualmente
- En futuras versiones, agregaremos notificación de actualización automática

## 📱 Versión Actual
Versión: 2.0.0 (Febrero 2026)
