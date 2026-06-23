SESSION_IDLE_MINUTES = 30
MAX_METADATA_BYTES = 2048
METADATA_FORBIDDEN_KEYS = frozenset(
    {"password", "token", "secret", "authorization", "cookie", "session_token"}
)

ALLOWED_EVENT_TYPES = frozenset(
    {
        "app_opened",
        "login",
        "logout",
        "page_view",
        "feed_viewed",
        "post_created",
        "post_viewed",
        "post_liked",
        "post_commented",
        "profile_viewed",
        "organization_viewed",
        "notification_opened",
        "search_performed",
        "session_started",
        "session_ended",
    }
)

ENGAGEMENT_EVENT_TYPES = frozenset(
    {"post_created", "post_commented", "post_liked"}
)

STATUS_MUY_ACTIVO = "Muy activo"
STATUS_ACTIVO = "Activo"
STATUS_USO_MODERADO = "Uso moderado"
STATUS_BAJO_USO = "Bajo uso"
STATUS_RIESGO = "Riesgo de abandono"
STATUS_INACTIVO = "Inactivo"

STATUS_FILTER_MAP = {
    "muy_activo": STATUS_MUY_ACTIVO,
    "activo": STATUS_ACTIVO,
    "uso_moderado": STATUS_USO_MODERADO,
    "bajo_uso": STATUS_BAJO_USO,
    "riesgo_abandono": STATUS_RIESGO,
    "inactivo": STATUS_INACTIVO,
}
