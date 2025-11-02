//////////////////////////////
// Dominios confiables (eTLD+1)
//////////////////////////////
globalThis.DEFAULT_TRUSTED_ETLD1 = [
  // ——— Bancos/Financieras Perú (ejemplos base) ———
  "bcp.com.pe","interbank.pe","bbva.pe","scotiabank.com.pe","bn.com.pe","banbif.pe",
  "mibanco.com.pe","pichincha.pe","bancofalabella.pe","bancoripley.com.pe",
  "cajaarequipa.pe","cajahuancayo.com.pe","cajapiura.pe","cajasullana.pe","cajatrujillo.pe",

  // ——— Proveedores globales de correo / cuentas ———
  "google.com","microsoft.com","outlook.com","office.com","live.com","hotmail.com",
  "apple.com","icloud.com","yahoo.com",

  // ——— Plataformas de desarrollo / colaboración ———
  "github.com","gitlab.com","stackoverflow.com","atlassian.com","docker.com","slack.com","zoom.us",

  // ——— Social / medios / e-commerce ———
  "linkedin.com","facebook.com","whatsapp.com","instagram.com","x.com",
  "tiktok.com","reddit.com","youtube.com","netflix.com","spotify.com",
  "amazon.com","ebay.com","paypal.com","mercadolibre.com"
];

// Opcionales (DESACTIVADOS por defecto, por riesgo de sobre-incluir)
// Para activarlos, añade estos valores a storage.sync.trustedSuffixes o a la lista de arriba.
globalThis.OPTIONAL_TRUSTED_SUFFIXES = [
  "edu",      // Educación global (MIT, Harvard, etc.) — Úsalo con criterio
  "com.pe"    // Comercial Perú (bn.com.pe, bcp.com.pe, etc.)
];

//////////////////////////////
// Sufijos confiables (wildcard)
//////////////////////////////
// Activos por defecto:
globalThis.DEFAULT_TRUSTED_SUFFIXES = [
  "gob.pe",   // Gobierno de Perú (MINSA, RENIEC, SUNAT, etc.)
  "edu.pe"    // Educación Perú (UTP, PUCP, UNI, SENATI, etc.)
];