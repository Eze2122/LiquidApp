# 🚕 LiquidApp

Aplicación móvil (Expo / React Native) para calcular **liquidaciones entre un chofer y un dueño de vehículo**: reparto por porcentajes, combustible (GNC + nafta), efectivo vs. tarjeta, excedentes de plataforma e historial local.

- **Package / Bundle ID**: `com.liquidapp.app`
- **versionName**: `1.0.1` · **versionCode**: `104`
- **Plataformas**: Android (Google Play) · iOS preparado
- **Backend**: no requerido — la app funciona 100 % offline (AsyncStorage)

---

## ✨ Funcionalidades

- Calculadora de liquidación por **turno** o **semanal**.
- Reparto por **porcentaje** configurable (dueño / chofer).
- 4 modalidades de **combustible**: Chofer 100 %, Dueño 100 %, Según porcentaje, Personalizado.
- Manejo de **efectivo, tarjeta y excedente** de plataforma.
- **Historial** local con copiar / eliminar / borrar todo (persistente).
- Monetización con **AdMob** (banner + intersticial).
- Pantalla **Premium** (placeholder — aún no implementado).

---

## 🗂️ Estructura del proyecto

```
.
├── frontend/                 # App Expo / React Native (lo principal)
│   ├── app/                  # Rutas (expo-router): index, history, premium
│   ├── src/
│   │   ├── liquidapp/        # logic.ts (lógica de cálculo) + storage.ts
│   │   ├── ads/              # AdMob: config + interstitial (native/web)
│   │   ├── components/       # BottomBanner, ErrorBoundary
│   │   ├── premium/          # state.ts (placeholder, isPremium)
│   │   ├── theme.ts          # tokens de color
│   │   └── utils/            # storage, upload (utilitarios)
│   ├── assets/               # íconos, splash, fuentes (identidad visual)
│   ├── app.json              # config Expo (nombre, package, AdMob, versión)
│   ├── eas.example.json      # plantilla EAS (renombrar a eas.json — ver abajo)
│   ├── package.json / yarn.lock
│   └── .env.example
├── backend/                  # FastAPI + MongoDB (OPCIONAL — la app no lo usa hoy)
│   ├── server.py
│   ├── requirements.txt
│   └── .env.example
└── tests/
    └── test_logic.js         # pruebas de la lógica de liquidación
```

---

## 🚀 Puesta en marcha (entorno limpio)

### Requisitos
- Node.js 20+ y Yarn 1.x
- (Build Android nativo) Android SDK / Android Studio
- Cuenta de Expo (para EAS Build)

### 1) Frontend
```bash
cd frontend
cp .env.example .env        # completá si hace falta (opcional)
yarn install
npx expo start              # abre el dev server
```
> ⚠️ AdMob es un módulo **nativo**: no corre en Expo Go. Para probar anuncios usá un **development build** (`npx expo run:android`) o un build de EAS.

### 2) Pruebas de lógica
```bash
# requiere ts-node o transpilar logic.ts; ejecuta los 14 casos contables
node tests/test_logic.js
```

### 3) Backend (opcional, no requerido por la app)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
cp .env.example .env
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

---

## 📱 Compilar para Android (AAB / APK)

Este repo usa el flujo **managed** de Expo. Para compilar:

### Opción A — EAS Build (recomendado)
```bash
cd frontend
cp eas.example.json eas.json      # ver nota de portabilidad abajo
npm i -g eas-cli
eas login
eas build -p android --profile production   # genera AAB para Google Play
eas build -p android --profile preview      # genera APK para pruebas
```
El `app.json` ya referencia tu cuenta (`owner`) y `extra.eas.projectId`. La **firma / keystore de carga** la gestiona EAS (`eas credentials`) — **no se guarda en el repo**.

### Opción B — Build local con Gradle
```bash
cd frontend
npx expo prebuild -p android      # genera la carpeta android/
cd android
./gradlew bundleRelease           # AAB
./gradlew assembleRelease         # APK
```
Necesitás un **keystore propio** configurado en `android/gradle.properties` (no incluido).

---

## 🔐 Configuración de servicios y secretos

| Servicio | Dónde se configura | ¿Va a GitHub? |
|---|---|---|
| AdMob **App IDs** | `frontend/app.json` (plugin `react-native-google-mobile-ads`) | Sí (son públicos) |
| AdMob **ad unit IDs** | `frontend/src/ads/config.ts` | Sí (hoy son de PRUEBA) |
| Backend Mongo / env | `backend/.env` (desde `.env.example`) | **No** (gitignored) |
| Expo / EAS | `app.json` (`owner`, `projectId`) + `eas credentials` | config sí, keystore **no** |
| Firma Android | EAS credentials o `android/` local | **Nunca** |

`.gitignore` ya excluye `.env`, `*.env`, `*.key`, `*.jks`, `*.p12`, `*.p8`, `credentials.json`.

> **AdMob**: hoy los *ad unit IDs* y el *iOS App ID* son de **prueba**. Reemplazalos por los reales en `src/ads/config.ts` / `app.json` cuando quieras monetizar. Declará el uso de "ID de publicidad" en el formulario de Seguridad de datos de Google Play (el permiso `com.google.android.gms.permission.AD_ID` lo agrega automáticamente el plugin de AdMob).

---

## 🧭 Nota de portabilidad (migración desde Emergent)

Este proyecto nació en Emergent. Para hacerlo independiente ya se aplicaron los cambios mínimos; al exportar a GitHub tené en cuenta:

- **`eas.json`**: se incluye como `eas.example.json`. Renombralo a `eas.json` en tu repo (el entorno de Emergent gestionaba ese archivo aparte).
- Podés **borrar del repo** (opcionales, solo de Emergent): `.emergent/`, `TEMPLATE.md`, `.gitconfig`, `test_result.md`, `memory/`, `frontend/scripts/cmd-guard/`, `install-guard.sh`, `sync-shims.sh`.
- El backend FastAPI es opcional; se quitó la dependencia privada `emergentintegrations` (no se usaba).

---

## 📄 Licencia
Privado — © LiquidApp.
