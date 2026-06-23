export const AUTH_VALUE = {
  headline: "No te pierdas nada en tu campus.",
  subheadline:
    "Descubre eventos, conecta con estudiantes y mantente informado sobre todo lo que ocurre en tu comunidad universitaria.",
  benefits: [
    "Comparte experiencias",
    "Descubre eventos",
    "Conecta con estudiantes",
    "Encuentra oportunidades",
  ] as const,
  mobileTagline: "Tu comunidad universitaria, en un solo lugar.",
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
  legalCheckboxCombined:
    "He leído y acepto los Términos y condiciones y la Política de Privacidad",
  legalNudgeTitle: "Un último paso para unirte",
  legalNudgeBody:
    "Confirma que aceptas nuestros términos para formar parte de la comunidad Utopp.",
  footerQuestion: "¿Ya tienes cuenta?",
  footerAction: "Inicia sesión",
  legalLoadError:
    "No se pudieron cargar los textos legales. Recarga la página o intenta más tarde.",
  readTerms: "Leer términos",
  readPrivacy: "Leer privacidad",
  acceptLegalInModal: "He leído y acepto",
  modalClose: "Cerrar",
  scrollToAcceptHint: "Desplázate hasta el final del documento para poder aceptar.",
  legalAcceptRequired:
    "Debes aceptar los términos y la política de privacidad para crear tu cuenta.",
} as const;

export const AUTH_GOOGLE = {
  continueWithGoogle: "Iniciar sesión con Google",
  registerWithGoogle: "Crear cuenta con Google",
  connectingWithGoogle: "Conectando con Google...",
  validatingLoginWithGoogle: "Validando inicio de sesión con Google...",
  registeringWithGoogle: "Creando cuenta con Google...",
} as const;

export const AUTH_ENTRY = {
  title: "¡Hola!",
  subtitle: "Inicia sesión para continuar",
  continueWithGoogle: "Continuar con Google",
  dividerLabel: "o con tu correo institucional",
  createAccount: "Crear cuenta",
  creatingAccount: "Creando cuenta...",
  credentialsRequired: "Ingresa tu correo y contraseña.",
} as const;

export const AUTH_UTEC = {
  accessDenied: "Solo se permiten cuentas institucionales UTEC (@utec.edu.pe).",
  notUtecEmail: "Debes usar tu cuenta institucional @utec.edu.pe para ingresar.",
  oauthFailed: "No se pudo completar el inicio con Google. Intenta de nuevo.",
  sessionExpired: "Tu sesión de inicio expiró. Vuelve a continuar con Google.",
  retry: "Reintentar",
} as const;

export const AUTH_CALLBACK = {
  loading: "Iniciando sesión...",
} as const;

export const AUTH_ENTRY_NEW = {
  title: "Bienvenido a Utopp",
  subtitle: "La comunidad universitaria de tu campus",
  continueWithGoogle: "Continuar con Google",
  emailFallbackPrompt: "¿Problemas para ingresar? Usa email",
  emailFallbackHide: "Ocultar formulario de email",
  registerWelcome: (name: string) => `Hola ${name}, únete a la comunidad Utopp`,
  registerWelcomeGeneric: "Únete a la comunidad Utopp",
  termsCheckbox: "He leído y acepto los Términos de uso",
  privacyCheckbox: "He leído y acepto la Política de privacidad",
  readTerms: "Leer términos",
  readPrivacy: "Leer privacidad",
  createAccount: "Crear mi cuenta",
  creatingAccount: "Creando cuenta...",
  cancelRegister: "Cancelar y volver",
} as const;