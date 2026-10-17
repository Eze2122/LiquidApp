# LiquidApp — PRD

Aplicación móvil (Expo React Native) para liquidaciones entre un **chofer** y un **dueño** de un vehículo. Reemplazo nativo del proyecto Capacitor original.

- **Nombre**: LiquidApp
- **Package / bundleId**: `com.liquidapp.app`
- **Distribución**: Amazon Appstore + Google Play
- **Modelo**: Gratis con anuncios AdMob + Premium USD 2/mes (sin ads) — Premium "próximamente" hasta que se publique en Google Play

## Pantallas

- `/` (index): formulario de liquidación con spotlight de resultado destacado y banner AdMob anclado al fondo.
- `/history`: historial local (AsyncStorage), con copiar / eliminar / borrar todo. Destaca tarjeta recibida y saldo pendiente.
- `/premium`: pantalla de suscripción Premium USD 2/mes con botón "Disponible próximamente" (placeholder hasta integrar RevenueCat).

## Lógica de cálculo (`src/liquidapp/logic.ts`)

Porcentajes se aplican SIEMPRE sobre la recaudación total.
- `parteDueno = total × %dueño` / `parteChofer = total × (100 − %dueño)`
- Combustible = GNC + Nafta. 4 modalidades: Chofer 100% / Dueño 100% / Según porcentaje de la recaudación / Personalizado.
- `netoDueno = parteDueno − combustibleDueno`
- `gananciaRealChofer = parteChofer − combustibleChofer`
- Efectivo/tarjeta/excedente:
  - `cash ≤ total`: tarjeta = `total − cash` (ya recibida por el dueño).
  - `cash > total`: excedente = `cash − total` (plataforma, separado del reparto).
- Liquidación chofer↔dueño (asume que el chofer pagó físicamente el combustible):
  - `efectivoBase = min(cash, total)`
  - `diferencia = efectivoBase − combustible − gananciaRealChofer`
  - `>0`: chofer entrega a dueño. `<0`: dueño entrega a chofer. `=0`: no se deben.

## Pruebas contables (fase 2) — 13/13 pasan ✅

- **Prueba A** (89k / 120k cash / GNC 10k / 50/50 / combustible 50/50) → netos 39.5k/39.5k, excedente 31k, chofer entrega 39.5k.
- **Prueba B** (120k / 80k cash / GNC 5k / 50/50 / combustible 50/50) → netos 57.5k/57.5k, tarjeta 40k, chofer entrega **17.5k**.
- Casos A–E originales, idempotencia, 70/30, todo tarjeta, caso límite todos cero.

## Monetización — AdMob

- Paquete: `react-native-google-mobile-ads` v17 (necesita development build, no Expo Go).
- IDs **de PRUEBA** oficiales de Google (en `src/ads/config.ts`): se reemplazan por los reales en producción.
- Banner adaptativo anclado al fondo del index.
- Interstitial precargado al arranque, se muestra únicamente al pulsar CALCULAR, con cooldown de 30s. Si no está listo o falla, el cálculo continúa sin bloquear.
- Web preview: módulos `.web.ts` son no-ops (la app no crashea sin AdMob).

## Premium placeholder

- `src/premium/state.ts` centraliza `isPremium()` + `hydratePremium()` + `usePremium()`.
- Persistido en AsyncStorage key `liquidapp_is_premium`.
- Hoy siempre `false`. Cuando se integre RevenueCat, llamar `_setPremium(true/false)` desde el listener de billing.
- Banners e interstitial consultan `isPremium()` antes de renderizar/precargar/mostrar.

## Historial (AsyncStorage, key `liquidapp_historial`)

Guarda todos los campos. Compatibilidad con registros antiguos (campos opcionales con fallback). Pantalla destaca tarjeta ya recibida y saldo pendiente.

## Identidad preservada

- Icono y adaptive icon extraídos del APK original (no se agregó branding de Emergent).
- Nombre LiquidApp, package com.liquidapp.app.


## Auditoría pre-publicación — 2026-06 (sin modificar lógica)

Proyecto cargado desde ZIP del usuario al entorno Emergent. Estado de las comprobaciones:

1. **Lógica (calculadora / porcentajes / combustible / excedentes / liquidaciones / historial)**: ✅ `tests/test_logic.js` 14/14 PASS. Testing E2E de UI 31/31 PASS (preview web 390x844).
2. **Identidad**: ✅ name "LiquidApp", package Android `com.liquidapp.app`, iOS bundle `com.liquidapp.app`, ícono/adaptive-icon/splash presentes.
3. **AdMob**: Android App ID real `ca-app-pub-7902708143841298~3236886398` ✅. iOS App ID de prueba (se deja así por decisión del usuario, publica en Play). Ad unit IDs (banner + intersticial) de PRUEBA — se publica así por decisión explícita del usuario (no generan ingresos aún).
4. **Permiso AD_ID** (`com.google.android.gms.permission.AD_ID`): lo inyecta automáticamente el plugin `react-native-google-mobile-ads` v17 en el build. Declarar uso de ID de publicidad en el formulario de Seguridad de datos de Play Console.
5. **versionCode**: 103 en `app.json` (el usuario asumió default; no verificable contra Play Console desde el entorno).
6. **Premium**: placeholder deshabilitado, `isPremium()` siempre false. NO modificado. Pendiente desarrollar fuera de Emergent tras publicar.

Decisiones del usuario registradas: publicar con ad unit IDs de prueba; dejar iOS App ID de prueba; versionCode por default (103); correr testing completo de UI (hecho); cargar el proyecto al entorno (hecho).

Dependencias agregadas al entorno para que la app corra: `expo-clipboard`, `react-native-google-mobile-ads@17.2.0` (vía `yarn expo install`). Archivos protegidos preservados: `.env`, `metro.config.js`, `eas.json`, `backend/.env`.

## Portabilidad / salida de Emergent — 2026-06 (cambios mínimos aplicados)

Alcance aprobado por el usuario: solo lo esencial para build/portabilidad, conservando el backend.

Archivos MODIFICADOS:
- `frontend/app.json`: `version` 1.0.0 → **1.0.1**, `android.versionCode` 103 → **104**.
- `frontend/package.json`: eliminado el hook `preinstall` (guard de Emergent `./scripts/cmd-guard.js`).
- `backend/requirements.txt`: eliminada la dependencia privada `emergentintegrations==0.2.2` (verificado: `server.py` no la importa; nada depende de ella).
- `README.md` (raíz): reescrito como guía completa de LiquidApp (estructura, setup, build EAS/Gradle, secretos, nota de portabilidad).

Archivos CREADOS:
- `frontend/.env.example`, `backend/.env.example` (placeholders, sin secretos).
- `frontend/eas.example.json` (plantilla EAS; renombrar a `eas.json` al exportar — no se creó `eas.json` directo porque esa ruta la gestiona la plataforma Emergent).

NO modificado: lógica, identidad visual, AdMob, Premium (sigue placeholder), backend `server.py`.
Pendiente de limpieza opcional al exportar (documentado en README): `.emergent/`, `TEMPLATE.md`, `.gitconfig`, `memory/`, `scripts/cmd-guard/`.

## Release 1.0.2 (versionCode 106) — preparación de AAB firmado FUERA de Emergent — 2026-06

Contexto: el AAB anterior (vía Publish de Emergent) salió con versionCode remoto (105), firma automática "Liquidapp Auditoria" e identidad/owner de Emergent → inservible para Play. Decisión del usuario: compilar fuera de Emergent (GitHub Actions) con su propia clave de carga.

Archivos MODIFICADOS:
- `frontend/app.json`: `version` → **1.0.2**, `android.versionCode` → **106** (confirmado por el usuario; sujeto a validar contra Play).
- `frontend/eas.example.json`: `cli.appVersionSource: "local"` (evita autoincremento remoto del versionCode) + `build.production.credentialsSource: "local"` + `buildType: app-bundle`.

Archivos CREADOS:
- `.github/workflows/android-release.yml`: build de producción con `eas build --local` en GitHub Actions (sin créditos EAS/Emergent), keystore y credentials desde GitHub Secrets, verificación de manifest + certificado, AAB como artifact descargable. Disparo manual (workflow_dispatch con confirm="build").
- `frontend/credentials.example.json`: plantilla (sin secretos) del credentials.json local.
- `frontend/scripts/verify-aab.sh`: verifica package/versionName/versionCode + SHA-256/SHA-1 del certificado contra los fingerprints de la clave de carga del usuario.
- `docs/ANDROID_RELEASE.md`: procedimiento completo (secrets, build GitHub Actions/EAS local/Gradle, verificación).

Secrets requeridos (en GitHub, NUNCA en el repo): `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `EXPO_TOKEN`. `.gitignore` confirma que `upload-keystore.jks` y `credentials.json` quedan ignorados.

Fingerprints esperados de la clave de carga (para verificar, NO para firmar):
- SHA-256: F6:A7:36:E4:11:89:E3:90:68:06:58:E1:61:83:49:88:54:69:8A:EE:78:A7:90:09:4E:B9:AA:D3:77:91:E3:21
- SHA-1: 07:C3:C5:87:D3:21:67:28:9C:F8:EB:1F:1E:B2:41:D2:1F:56:6B:02

BLOQUEOS (informados al usuario): el agente NO puede firmar con el keystore del usuario (no está en el entorno y es secreto) ni generar un AAB descargable dentro de Emergent. La compilación firmada se corre fuera de Emergent (GitHub Actions). El certificado del AAB solo se puede verificar sobre el archivo final generado por el usuario. NO se ejecutó ningún build. Lógica, pruebas, backend, AdMob y Premium intactos.
