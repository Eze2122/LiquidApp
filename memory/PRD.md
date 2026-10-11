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
