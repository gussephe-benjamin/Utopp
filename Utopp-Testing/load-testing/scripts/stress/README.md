# Stress (k6): rampas progresivas

Script: `main.js`

## Qué hace

- Rampas desde 0 hasta `STRESS_MAX_VUS` (por defecto 250). Con valores **grandes** (p. ej. **1000**) no usa un pasito por cada tens de VUs: genera una **serie espaciada** (~×1,35 hasta el tope) para que el test tarde minutos/u horas dependibles, no días (`STRESS_COARSE_STEP_CAP` limita el número de niveles).
- Opcional **`STRESS_CUSTOM_STEPS`** = `50,200,500,1000` fuerza tus propios niveles hasta `STRESS_MAX_VUS`.
- Por cada nivel: subida gradual + meseta (`STRESS_PLATEAU`, segundos, por defecto 45).
- Con `STRESS_MAX_VUS >= 500` el threshold de fracaso HTTP se relaja (**90 %**) salvo que definas **`STRESS_FAIL_RATE_MAX`**; las latencias permiten hasta **120 s**.
- **`--no-thresholds`** en k6 fuerza sólo métricas, sin cortar por SLAs (`docker run … grafana/k6:latest run --no-thresholds scripts/stress/main.js`).

### Prueba muy agresiva (~1000 VUs simultáneos)

Hay **50 cuentas** en `data/users.json`; k6 repite credencial por VU (**reuso normal** en benchmarks). Duración típica **≥ 20–40 minutos** según mesetas y ramps.

PowerShell desde `Utopp-Testing/load-testing`:

```powershell
$env:API_URL='http://host.docker.internal:8000'
$env:STRESS_MAX_VUS='1000'
$env:STRESS_PLATEAU='30'
docker run --rm -i -v "${PWD}:/app" -w /app `
  -e API_URL=$env:API_URL -e STRESS_MAX_VUS -e STRESS_PLATEAU -- `
  grafana/k6:latest run --no-thresholds --summary-export=/app/reports/k6-stress-1000.json scripts/stress/main.js
```

## Orden sugerido entre los tres tipos

1. **Load** (`scripts/load/main.js`) — carga sostenida: baseline estable.
2. **Stress** (esta carpeta) — sube VUs hasta ver dónde suben latencias/errores.
3. **Spike** (`scripts/spike/main.js`) — pico brusco para ver colas y recuperación.

## Uso

Desde `Utopp-Testing/load-testing`:

```bash
set API_URL=http://localhost:8000
set STRESS_MAX_VUS=200
set STRESS_PLATEAU=60
k6 run scripts/stress/main.js
```

Con Docker (daemon en ejecución):

```bash
docker run --rm -i -v "%CD%:/app" -w /app -e API_URL=http://host.docker.internal:8000 -e STRESS_MAX_VUS=200 grafana/k6:latest run scripts/stress/main.js
```

## Métricas y fallos

- Los requests llevan `tags.name`: `login`, `get_feed`, `get_users_me`, `get_all_users`, `get_roles_me` y el contador `utopp_failures_by_stage` con `stage` acorde.
- En el backend: **login** → `routers/auth.py`; **feed** → feed router; **users** → users; **roles** → roles. Errores 500 genéricos suelen salir del manejador en `main.py` o la capa de servicio de cada ruta.
