// whitelist.js — semillas por defecto (se combinan con listas del usuario)

// --- Sufijos confiables base ---
globalThis.DEFAULT_TRUSTED_SUFFIXES = [
  "gob.pe",  // Gobierno del Perú
  "edu.pe"   // Educación Perú
];

// (Opcional) otros sufijos confiables frecuentes (actívalos desde Options si deseas)
globalThis.OPTIONAL_TRUSTED_SUFFIXES = [
  "edu",
  "com.pe"
];

// --- Dominios confiables base (eTLD+1) ---
globalThis.DEFAULT_TRUSTED_ETLD1 = [
  // Bancos/financieras Perú
  "viabcp.com","interbank.pe","bbva.pe","scotiabank.com.pe","bn.com.pe","banbif.com.pe","citibank.com","compartamos.com.pe","santander.com.pe",
  "mibanco.com.pe","pichincha.pe","bancofalabella.pe","bancoripley.com.pe","bancom.pe","bancognb.com.pe","bancofalabella.pe","alfinbanco.pe","bankofchina.com",".bancobci.pe",
  "cajaarequipa.pe","cajahuancayo.com.pe","cajapiura.pe","cajasullana.pe","cajatrujillo.com.pe","icbc.com.pe","santanderconsumer.com.pe",
  "agrobanco.com.pe","cofide.com.pe","mivivienda.com.pe","confianza.pe","efectiva.com.pe","proempresa.com.pe","surgir.com.pe","mafperu.com","tarjetaoh.pe",
  "qapaq.pe","cmac-cusco.com.pe","cajadelsanta.pe","cajaica.pe","cajamaynas.pe","cajapaita.pe","cmactacna.com.pe","cajametropolitana.com.pe","cajaincasur.com.pe",
  "losandes.pe","prymera.pe","cajacentro.com.pe","tarjetacencosud.pe","alternativa.com.pe","volvofinancialservices.com","vivela.lat","santanderconsumer.com.pe","totalserviciosfinancieros.com.pe",
  "jpmorgan.com",

  // Proveedores de cuenta/correo
  "google.com","microsoft.com","outlook.com","office.com","live.com","hotmail.com",
  "apple.com","icloud.com","yahoo.com",

  // Dev/colaboración
  "github.com","gitlab.com","stackoverflow.com","atlassian.com","docker.com","slack.com","zoom.us",

  // Social/medios/e-commerce
  "linkedin.com","facebook.com","whatsapp.com","instagram.com","x.com",
  "tiktok.com","reddit.com","youtube.com","netflix.com","spotify.com",
  "amazon.com","ebay.com","paypal.com","mercadolibre.com","mercadolibre.com.pe"
];