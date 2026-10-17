# 📦 LiquidApp — Generar el AAB de producción para Google Play (fuera de Emergent)

Objetivo: AAB con **identidad LiquidApp**, **versionName 1.0.2**, **versionCode 106** y **firmado con TU clave de carga** (no la automática de Emergent).

> ⚠️ Esta compilación **NO se hace con el botón Publish de Emergent** (ese flujo usa el keystore automático "Liquidapp Auditoria" y versionCode remoto → fue la causa del AAB inservible). Se hace **fuera de Emergent**: GitHub Actions (recomendado), EAS local, o Gradle local.

---

## 0) Valores objetivo (ya configurados en el repo)
| Dato | Valor | Dónde |
|---|---|---|
| name | LiquidApp | `frontend/app.json` |
| package | `com.liquidapp.app` | `frontend/app.json` |
| versionName | **1.0.2** | `frontend/app.json` → `expo.version` |
| versionCode | **106** | `frontend/app.json` → `expo.android.versionCode` |
| owner / projectId | `eze2122` / `d25e6eb0-…` | `frontend/app.json` |
| versionado | **local** (no remoto) | `frontend/eas.example.json` → `cli.appVersionSource` |
| firma producción | **local** (tu keystore) | `frontend/eas.example.json` → `build.production.credentialsSource` |

> El `appVersionSource: "local"` evita que EAS autoincremente el versionCode en su servidor (lo que generó el "105"). El `credentialsSource: "local"` fuerza el uso de TU keystore vía `credentials.json`, no una clave autogenerada.

---

## 1) Secretos que necesitás (NUNCA van al repo)

Creá estos **GitHub Secrets** en: repo → *Settings → Secrets and variables → Actions → New repository secret*.

| Secret | Qué es |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Tu keystore de carga (`.jks`) codificado en base64 |
| `ANDROID_KEYSTORE_PASSWORD` | Contraseña del keystore |
| `ANDROID_KEY_ALIAS` | Alias de la clave dentro del keystore |
| `ANDROID_KEY_PASSWORD` | Contraseña de la clave (suele ser igual a la del keystore) |
| `EXPO_TOKEN` | Token de acceso de tu cuenta Expo (`eze2122`). Generar en https://expo.dev/accounts/[cuenta]/settings/access-tokens |

### Cómo generar el base64 del keystore (en TU máquina, no en el chat)
```bash
# Linux
base64 -w0 upload-keystore.jks > keystore.b64
# macOS
base64 -i upload-keystore.jks | tr -d '\n' > keystore.b64
```
Abrí `keystore.b64`, copiá TODO el contenido y pegalo como valor del secret `ANDROID_KEYSTORE_BASE64`.

> 🔐 El `.jks`, el `credentials.json` y las contraseñas **no se suben al repo** (ya están en `.gitignore`). En CI, el workflow los reconstruye desde los Secrets y los borra al terminar.

---

## 2) Método recomendado — GitHub Actions (sin créditos de EAS/Emergent)

Ya está incluido: `.github/workflows/android-release.yml`.

1. Subí el proyecto a GitHub (usá "Save to GitHub" desde Emergent).
2. Cargá los 5 Secrets del punto 1.
3. En GitHub: pestaña **Actions → "LiquidApp - Android Release (AAB firmado)" → Run workflow**, escribí `build` para confirmar.
4. El workflow:
   - instala dependencias (`--frozen-lockfile`),
   - materializa `eas.json` desde `eas.example.json`,
   - reconstruye `upload-keystore.jks` + `credentials.json` desde los Secrets,
   - corre `eas build --local` (compila en el runner, **no usa cola ni créditos de EAS**),
   - verifica manifest + certificado,
   - publica el **AAB como artifact descargable** (`LiquidApp-AAB`).
5. Descargá el AAB desde la corrida del workflow (sección *Artifacts*).

> El runner `ubuntu-latest` trae Android SDK/NDK. `eas build --local` hace el prebuild y el Gradle por vos.

---

## 3) Alternativa — Build local en tu máquina

Requisitos: Node 20, Java 17, Android SDK/NDK, `eas-cli`.
```bash
cd frontend
cp eas.example.json eas.json
cp credentials.example.json credentials.json   # completá tus valores reales (NO commitear)
# dejá tu keystore como frontend/upload-keystore.jks

export EXPO_TOKEN=xxxxx          # o 'eas login'
eas build --platform android --profile production --local --output ../LiquidApp-1.0.2-106.aab
```

### Alternativa sin EAS (Gradle puro)
```bash
cd frontend
npx expo prebuild -p android --clean
# configurá la firma en android/gradle.properties apuntando a tu keystore:
#   MYAPP_UPLOAD_STORE_FILE=upload-keystore.jks
#   MYAPP_UPLOAD_KEY_ALIAS=<alias>
#   MYAPP_UPLOAD_STORE_PASSWORD=<pass>
#   MYAPP_UPLOAD_KEY_PASSWORD=<pass>
# y el signingConfig release en android/app/build.gradle
cd android
./gradlew bundleRelease        # genera app/build/outputs/bundle/release/app-release.aab
```

---

## 4) Verificación REAL del AAB (antes de subir)

Con el script incluido:
```bash
cd frontend
./scripts/verify-aab.sh ../LiquidApp-1.0.2-106.aab
```
Debe mostrar:
- `package="com.liquidapp.app"`
- `android:versionName="1.0.2"`
- `android:versionCode="106"`
- **SHA-256** del certificado == `F6:A7:36:E4:11:89:E3:90:68:06:58:E1:61:83:49:88:54:69:8A:EE:78:A7:90:09:4E:B9:AA:D3:77:91:E3:21`
- **SHA-1** == `07:C3:C5:87:D3:21:67:28:9C:F8:EB:1F:1E:B2:41:D2:1F:56:6B:02`

Si el SHA-256/SHA-1 **no** coincide → el AAB está firmado con otra clave: revisá que los Secrets correspondan a tu keystore de carga registrado en Play. **No subas** hasta que coincida.

---

## 5) Notas importantes
- **versionCode 106**: confirmá en Play Console → *Historial de versiones* que sea mayor que el mayor ya subido. Si estuviera ocupado, subí el número en `frontend/app.json` y recompilá.
- **AdMob y permisos**: se conservan. El permiso `com.google.android.gms.permission.AD_ID` lo inyecta el plugin de ads automáticamente; verificalo también en el manifest si querés.
- **Premium**: sigue como placeholder, sin Billing.
- **No** uses el keystore automático de Emergent. **No** generes una clave nueva: la firma válida es la que ya registraste en Play.
