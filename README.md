# Anti-Phishing Perú (Bancos & Financieras) — Chrome Extension

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
![Manifest](https://img.shields.io/badge/manifest-v3-black)
![Status](https://img.shields.io/badge/status-MVP-success)

Detecta señales de **phishing** en sitios que imitan a bancos y financieras del Perú.
Muestra **alertas** en página (banner + sonido), marca el ícono con **badge** y ofrece un
**Modo Estricto** que **bloquea temporalmente** la escritura en campos sensibles
(**tarjeta**, **CVV/CVC**, **fecha de vencimiento**, **CCI**, y opcionalmente **DNI**) cuando el dominio **no** es oficial.

> Repo: <https://github.com/bvislao/antiphishing-peru-ext>  
> Autor: <https://bvislao.me> · ☕ <https://www.buymeacoffee.com/bvislao>

---

## ✨ Características

- ✅ **Heurísticas locales** (sin enviar tus datos)
  - Conexión **HTTPS**
  - **Punycode** / homógrafos
  - Dominios **look-alike** (distancia a lista de oficiales)
  - Formularios que envían a **otro dominio** o **sin HTTPS**
  - **Campos sensibles** detectados por labels/patrones: **DNI**, **Tarjeta**, **CVV/CVC**, **Fecha de vencimiento**, **CCI**
- 🛡️ **Modo Estricto**: bloquea inputs sensibles en dominios no oficiales; botón para **desbloquear 60s**
- 🧰 **Lista blanca** editable (eTLD+1) para bancos/financieras del Perú
- 🔔 **Alertas**: banner en la página, beep, badge en el action y notificación en riesgo **ALTO**
- 🧪 Integración **opcional** con **Google Safe Browsing** (stub incluido)

---

## 🚀 Instalación (Modo desarrollador)

1. Descarga/clona este repositorio.
2. Abre `chrome://extensions` y activa **Developer mode**.
3. Clic en **Load unpacked** → selecciona la carpeta del proyecto.
4. Abre cualquier sitio y observa el **badge** del ícono (vacío / `!` / `!!`).
5. Si hay riesgo **MEDIO** o **ALTO**, verás un **banner** y escucharás un **beep**.
6. En **Options**, edita la **lista de dominios confiables** y el **Modo Estricto**.

---

## ⚙️ Configuración

### Lista de dominios confiables (eTLD+1)
Edita en **Options** (uno por línea):  
ej.: `viabcp.com`, `bbva.pe`, `scotiabank.com.pe`, `interbank.pe`, `banbif.pe`, etc.

### Modo Estricto
Activa/desactiva el bloqueo de inputs sensibles en dominios **no** oficiales y elige qué tipos bloquear:  
`card`, `cvv`, `expiry`, `cci`, `dni`.  

---

## 🔐 Permisos y privacidad

**Permisos**: `storage`, `notifications`.
**Privacidad**:
- El análisis es **local**; no recolectamos datos personales ni historial.
- Si habilitas **Safe Browsing**, ciertas URLs se consultan contra la API de Google con fines de seguridad.

---

## 🖼️ Capturas (sugeridas)

Incluye imágenes (p. ej. en `docs/`) y referencia aquí:

- `docs/screenshot-popup.png` — Popup con estado y razones  
- `docs/screenshot-options.png` — Options (lista + modo estricto)  
- `docs/screenshot-banner.png` — Banner de alerta  

---

## 🤝 Contribuir

1. Haz un fork y crea rama: `feat/mi-mejora`  
2. Aplica cambios y prueba en `chrome://extensions` (renombrando manifest.chrome.json -> manifest.json ) 
3. Abre un **Pull Request** con descripción + capturas
4. Tienes una **Guia** mejor explicada <https://whitelist-antiphishing-pe.netlify.app/>

**Roadmap**:
- Lista blanca remota (JSON) ✅ DONE
  Lista remota obtenida oficialmente de <https://whitelist-antiphishing-pe.netlify.app/whitelist.json>
- Heurística de homógrafos visuales mejorada 🚧
- Reglas `declarativeNetRequest` para patrones de alto riesgo 🚧
- Integraciones opcionales (PhishTank / OpenPhish) : Funciona como una base de datos comunitaria donde los usuarios pueden reportar sitios web de phishing que han encontrado. 🚧


🚧 : **Pendiente**
✅ : **Implementado**
---

## 📄 Licencia

Este proyecto se distribuye bajo **Apache-2.0**. Ver [LICENSE](./LICENSE).

---

## 🙌 Agradecimientos & Sponsor

¿Te sirvió? **Invítame un café** ☕  
<https://www.buymeacoffee.com/bvislao>

**Autor:** <https://bvislao.me>
