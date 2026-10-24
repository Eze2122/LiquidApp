# LiquidApp Premium — configuración de Google Play y RevenueCat

## Estado y protección

- Rama de trabajo: `liquidapp-revenuecat-integration`
- Backup previo a esta etapa: `backup-before-play-revenuecat-offering-2026-10-24`
- La versión 106 publicada en prueba no se modifica.
- No fusionar el PR ni publicar el APK/AAB sin autorización explícita.

## Firma de Google Play — dato importante

- **SHA-1 de la clave de subida (upload key) informado por el usuario:** `07:C3:C5:87:D3:21:67:28:9C:F8:EB:1F:1E:B2:41:D2:1F:56:6B:02`
- Usar este fingerprint para comparar con el certificado de subida configurado en Play Console.
- Este SHA-1 es el fingerprint del certificado; no reemplaza el archivo keystore ni su contraseña.
- Antes de subir una nueva versión, verificar que el AAB esté firmado con la clave de subida correspondiente y conservar intacta la versión 106.

## Identificadores acordados para la configuración

Antes de crear nada, comprobar en Play Console y RevenueCat que no exista ya un producto equivalente. Si existe, conservar sus IDs actuales y actualizar esta guía con esos valores; no crear duplicados.

Si todavía no existe, usar estos IDs coherentes:

- Google Play subscription product ID: `liquidapp_premium_monthly`
- Base plan ID en Google Play: `monthly`
- RevenueCat entitlement ID: `premium` (el código ya lo espera)
- RevenueCat offering ID: `default`
- RevenueCat package: `$rc_monthly` (paquete mensual estándar de RevenueCat)
- Precio objetivo: equivalente a USD 2 por mes; Google Play debe mostrar el precio localizado y final antes de confirmar.

## Google Play Console

1. Abrir la app `com.liquidapp.app` en Play Console.
2. Ir a Monetizar con Play > Productos > Suscripciones y crear (solo si no existe) `liquidapp_premium_monthly`.
3. Añadir un plan base de renovación automática con ID `monthly`, período de facturación mensual y precio configurado para los países deseados.
4. Activar el producto y el plan base según los requisitos que Play Console muestre. Una suscripción en borrador/inactiva no estará disponible para comprar.
5. No reemplazar ni editar el lanzamiento de prueba de la versión 106. La compilación de integración usa versionCode 107 en la rama aislada.

## RevenueCat

1. En el proyecto de RevenueCat de LiquidApp, abrir Apps y comprobar que la app de Google Play corresponde al paquete `com.liquidapp.app` y que las credenciales de Google Play son válidas.
2. En Product catalog, importar/sincronizar el producto `liquidapp_premium_monthly` desde Google Play.
3. Crear el entitlement `premium` si aún no existe y adjuntarle el producto mensual.
4. Crear la offering `default`, marcarla como Current y añadir el paquete Monthly (`$rc_monthly`) vinculado al producto mensual.
5. Comprobar que la offering actual devuelve al menos un paquete mensual.

## Clave pública de SDK

La app necesita la clave pública de RevenueCat para Android (prefijo habitual `goog_`). No usar una Secret API key en el cliente.

En GitHub Actions, configurar el secreto de repositorio `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` no hace que Expo lo inyecte automáticamente al código si el workflow no lo exporta. Para esta compilación nativa, la variable debe estar presente durante el paso de exportación del bundle. Antes de hacer una compilación de prueba, actualizar el workflow para mapear esa variable de forma segura; nunca escribir la clave literal en un archivo versionado ni en los logs.

El código actual lee `process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`. Sin esa variable, Premium queda desactivado y `getPremiumPackages()` no puede obtener paquetes.

## Verificación antes de probar una compra

- [ ] Producto y plan base activos en Google Play.
- [ ] Producto sincronizado en RevenueCat.
- [ ] Entitlement `premium` vinculado al producto.
- [ ] Offering `default` marcada como Current con paquete mensual.
- [ ] Clave pública Android inyectada de forma segura en el bundle.
- [ ] Tester de licencia/cuenta de prueba configurado en Google Play.
- [ ] AAB de integración firmado con la clave de subida correcta e instalado desde una pista de prueba compatible con Google Play Billing.
- [ ] Compra de prueba activa el entitlement y elimina anuncios.
- [ ] Restaurar compras vuelve a reconocer el entitlement.

## Limitación de acceso

Los cambios de código y este documento se pueden mantener en GitHub. La creación/activación del producto en Play Console y la configuración de la offering dentro del dashboard de RevenueCat requieren acceso autenticado a esos servicios; no deben darse por completadas hasta comprobar sus pantallas o respuestas reales.
