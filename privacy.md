# Política de Privacidad de "Anti-Phishing Perú"

**Fecha de última actualización:** 5 de noviembre de 2025

Bienvenido a **Anti-Phishing Perú (Bancos & Financieras)** (en adelante, "la Extensión").

Su privacidad y seguridad son nuestra máxima prioridad. Esta política de privacidad explica cómo manejamos la información, o más precisamente, por qué **no recopilamos, almacenamos ni transmitimos** ningún dato personal o de navegación.

Nuestra filosofía es simple: la Extensión debe protegerlo sin comprometer su privacidad.

### 1. El Principio Fundamental: Operación 100% Local

La Extensión ha sido diseñada para operar **exclusivamente en su navegador (cliente-lado)**.

* **Sin Servidores:** No mantenemos servidores que reciban información suya.
* **Sin Recopilación de Datos:** No recopilamos, registramos, rastreamos ni almacenamos ninguna información personal (como nombre, correo electrónico) ni datos de navegación (como su historial web).
* **Sin Registros:** No se requiere ningún tipo de registro o inicio de sesión para usar la Extensión.

### 2. Qué Información "Procesa" la Extensión (y qué NO hace)

Para protegerlo del phishing, la Extensión necesita "ver" las URLs que usted visita en tiempo real. Así es como funciona el proceso, de forma totalmente local:

1.  Cuando usted navega a una nueva página web, la Extensión **lee la URL de esa página**.
2.  Compara esa URL con una **base de datos (blacklist/whitelist) que está almacenada localmente** en su propio dispositivo, dentro de la Extensión.
3.  **La URL nunca abandona su computadora.** Nunca se envía a ningún servidor (ni nuestro ni de terceros) para su análisis.
4.  Si la URL coincide con una amenaza en la base de datos local, la Extensión toma medidas (como bloquear, alertar o redirigir).
5.  Una vez completada la verificación (en milisegundos), la URL se descarta de la memoria.

### 3. Justificación de Permisos Solicitados

La Extensión solicita ciertos permisos para poder cumplir con su única finalidad: protegerlo. Toda la actividad se realiza localmente.

* **`storage` (Almacenamiento):**
    * **Propósito:** Almacenar la lista de sitios de phishing conocidos y sitios legítimos (la base de datos de amenazas) en su dispositivo. También se usa para guardar sus configuraciones (ej. si las notificaciones están activadas).
    * **Privacidad:** Estos datos se guardan solo en su navegador.

* **`webNavigation` y `host_permissions` (`<all_urls>`):**
    * **Propósito:** Esencial para leer la URL de *todas* las pestañas que intenta visitar, *antes* de que la página cargue. Los sitios de phishing pueden estar en cualquier dominio, por lo que necesitamos este permiso amplio para detectar amenazas en tiempo real.
    * **Privacidad:** Como se mencionó, esta URL solo se lee localmente para comparación y nunca se transmite.

* **`tabs`:**
    * **Propósito:** Necesario para tomar medidas de protección, como redirigir al usuario desde una página de phishing peligrosa a una página de advertencia segura (alojada dentro de la extensión).

* **`notifications`:**
    * **Propósito:** Mostrar una alerta nativa del sistema para notificarle inmediatamente que se ha detectado y bloqueado un sitio de phishing.

### 4. Intercambio y Divulgación de Información

Es simple: **No compartimos ni vendemos ningún dato.**

Dado que no recopilamos ningún dato personal o de navegación, no tenemos absolutamente nada que compartir, vender o divulgar a terceros.

### 5. Cambios a esta Política de Privacidad

Podemos actualizar esta Política de Privacidad ocasionalmente para reflejar cambios en la funcionalidad o para cumplir con los requisitos de la Chrome Web Store. Si realizamos cambios, actualizaremos la "Fecha de última actualización" en la parte superior de esta política.

### 6. Contacto

Si tiene alguna pregunta sobre esta Política de Privacidad o sobre sus prácticas de seguridad, no dude en contactarnos.

* **Desarrollador:** Bryan Vislao Chavez
* **Correo Electrónico de Soporte:** [bvislao95@gmail.com](mailto:bvislao95@gmail.com)
* **Enlace del Proyecto (GitHub):** [https://github.com/bvislao/antiphishing-peru-ext](https://github.com/bvislao/antiphishing-peru-ext)
