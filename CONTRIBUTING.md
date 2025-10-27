# Guía de Contribución

¡Gracias por tu interés en mejorar **Anti-Phishing Perú**! Toda ayuda es bienvenida: código, issues, ideas, diseño, pruebas, docs.

> Licencia: Al contribuir aceptas que tus aportes se publiquen bajo **Apache-2.0** (ver `LICENSE`).

---

## Flujo de trabajo

1. **Fork** del repositorio y crea una rama descriptiva:
   - `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`
2. Aplica cambios en tu rama.
3. **Prueba** la extensión en modo desarrollador:
   - `chrome://extensions` → _Developer mode_ → **Load unpacked** → carpeta del proyecto.
4. Actualiza:
   - `manifest.json` → **version** (SemVer).
   - `CHANGELOG.md`.
   - Capturas en `docs/` si cambiaste UI.
5. **Pull Request** hacia `main` con:
   - Descripción clara, pasos de prueba y capturas si aplica.

### Convención de commits (Conventional Commits)

feat: añade modo estricto para CVV
fix: corrige parseo de eTLD+1 en .pe
docs: actualiza README con BuyMeACoffee
refactor: simplifica detección de punycode
chore: bump de versión a 1.2.1

---

## Estándares de código

- **MV3**, JS estándar (ES2020+). Sin ofuscación ni minificación.
- Nada de código remoto inyectado. Evitar dependencias innecesarias.
- Comentarios breves explicando heurísticas y decisiones de seguridad.
- Mantener strings de UI en español neutral (PE), sin datos sensibles.

---

## Qué tocar en cada cambio

- **Heurísticas**: editar principalmente `content.js` (escaneo/DOM) y `background.js` (clasificación y settings).
- **Lista confiable**: `whitelist.js` + opción en `options.html/js`.
- **Modo estricto**: lógica en `content.js` (bloqueo/desbloqueo) y bandera en `background.js`.
- **UI**: `popup.*`, `options.*`, banner/Pill en `content.js`.
- **Permisos**: revisar `manifest.json` y justificar en README si agregas alguno.

---

## Pruebas manuales (checklist)

- **HTTPS**: abrir una página `http://…` y validar subida de riesgo.
- **Punycode**: probar dominios con `xn--…` (pueden ser de prueba).
- **Look-alike**: host parecido a `bcp.com.pe` pero NO igual; revisar motivo en popup.
- **Forms externos**: formulario con `action` a otro dominio / sin https.
- **Campos sensibles** en dominio **no oficial**: DNI (8), Tarjeta (Luhn), CCI (20), Exp `MM/YY`, CVV (3–4).
- **Modo estricto**: que bloquee escritura y el botón **“Desbloquear 60s”** funcione.
- **Lista blanca**: al añadir un dominio oficial en Options, disminuir riesgo.
- **Notificaciones**: en riesgo ALTO se muestre la notificación del sistema.

---

## Reporte de bugs y seguridad

- Abre un **Issue** con plantilla “Bug” o “Security”.
- Para **vulnerabilidades**, preferible reporte privado (enlaza un repro con pasos, sin exponer datos reales).  
  También puedes contactarme vía <https://bvislao.me>.

---

## Publicación

- Bump de versión en `manifest.json` y `CHANGELOG.md`.
- Crear tag: `git tag vX.Y.Z && git push --tags`.
- Empaquetar `.zip` y subir a Chrome Web Store (ver README).
