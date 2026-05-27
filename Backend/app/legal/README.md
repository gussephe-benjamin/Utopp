# Textos legales en el repositorio

Los documentos que ve el usuario provienen de Markdown en esta carpeta. El API los **sincroniza al arranque** (y puedes forzar sincronización con el script de publicación).

## Archivos

| Archivo     | Uso                                      |
|------------|-------------------------------------------|
| `terms.md` | Términos y condiciones                    |
| `privacy.md` | Política de datos y privacidad        |

- Codificación: **UTF-8**.
- Formato: Markdown (el frontend lo renderiza).

## Cómo actualizar el texto

1. Edita `terms.md` y/o `privacy.md` en el editor.
2. **Reinicia el proceso del API** (o vuelve a levantar el contenedor) para que la nueva versión se cargue en base de datos **sin cambiar el id** del documento activo; las aceptaciones ya registradas siguen siendo válidas.
3. Opcional: desde la carpeta `Backend`, ejecuta `python -m app.scripts.publish_terms` para sincronizar contra la base sin reiniciar (útil en entornos donde el API no se reinicia solo).

No hace falta un número de versión manual para el flujo diario: el contenido se actualiza **in situ** en la fila activa de cada slug (`terms`, `privacy`).

## Despliegue

En Docker Compose, tras cambiar los `.md`, reconstruye o reinicia el servicio del backend para que el `lifespan` de FastAPI vuelva a ejecutar la sincronización.
