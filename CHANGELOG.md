# Changelog
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versión siguiendo [SemVer](https://semver.org/lang/es/).

## [Unreleased]
- Mejoras de heurística de homógrafos visuales.
- Reglas `declarativeNetRequest` para patrones de muy alto riesgo.
- Port a Firefox (MV3).

## [1.2.1] - 2025-10-27
### Añadido
- Footer en **popup** y **options** con: **BuyMeACoffee**, enlace a repo y sitio web.
- `README.md` pulido con badges, pasos de publicación y capturas sugeridas.
- `LICENSE` (Apache-2.0) y `.gitignore`.

### Cambiado
- `manifest.json`: `homepage_url` y `author`.

## [1.2.0] - 2025-10-27
### Añadido
- **Modo Estricto**: bloqueo temporal de inputs sensibles (card, cvv, expiry, cci, opcionalmente dni) en dominios no oficiales + **Desbloquear 60s**.
- Controles en **Options** para activar/desactivar y elegir tipos.

## [1.1.0] - 2025-10-27
### Añadido
- Detección de **datos sensibles**: DNI, Tarjeta (Luhn), CCI, Fecha de vencimiento, CVV/CVC.
- Aumento de riesgo si se solicitan en dominio no oficial.

## [1.0.0] - 2025-10-27
### Añadido
- MVP MV3: heurísticas locales (HTTPS, punycode, look-alike, forms externos).
- Lista blanca editable (eTLD+1) de bancos/financieras del Perú.
- Alertas: banner + sonido + badge y notificación en riesgo ALTO.
- Popup de estado y página de Options.