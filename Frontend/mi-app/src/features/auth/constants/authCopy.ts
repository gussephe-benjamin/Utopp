export const AUTH_VALUE = {
  headline: "No te pierdas de nada en Utopp.",
  subheadline:
    "Descubre eventos, comparte y entérate de lo último de las organizaciones de tu universidad, y conecta con otros estudiantes.",
  benefits: [
    "Comparte experiencias",
    "Entérate de los últimos eventos",
    "Conecta con estudiantes",
    "Encuentra oportunidades",
  ] as const,
  mobileTagline: "Eventos y organizaciones de tu universidad.",
} as const;

export const AUTH_LOGIN = {
  title: "Bienvenido de nuevo",
  subtitle: "Inicia sesión para seguir explorando la comunidad",
  googleHint: "Recomendado si creaste tu cuenta con Google",
  dividerLabel: "¿Tienes cuenta institucional?",
  submitLabel: "Iniciar sesión",
  footerQuestion: "¿Primera vez en Utopp?",
  footerAction: "Crea tu cuenta con Google",
  registeredBannerTitle: "¡Cuenta creada exitosamente!",
  registeredBannerBody: "Ingresa tu contraseña para continuar.",
} as const;

export const AUTH_REGISTER = {
  title: "Únete a la comunidad",
  subtitle: "Comienza en segundos con tu cuenta de Google",
  legalPrefix: "Al continuar, aceptas los",
  termsLabel: "Términos",
  legalMiddle: "y la",
  privacyLabel: "Política de Privacidad",
  footerQuestion: "¿Ya tienes cuenta?",
  footerAction: "Inicia sesión",
  legalLoadError:
    "No se pudieron cargar los textos legales. Recarga la página o intenta más tarde.",
} as const;

export const AUTH_GOOGLE = {
  continue: "Continuar con Google",
  connecting: "Conectando con Google...",
  validatingLogin: "Validando con Google...",
  registering: "Registrando con Google...",
} as const;
