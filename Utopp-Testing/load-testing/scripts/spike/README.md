# Spike (k6): pico brusco

Script: `main.js`

## Qué hace

- Línea base (`SPIKE_BASELINE_VUS`, default 15) → subida rápida al pico (`SPIKE_PEAK_VUS`, default 180) → sostenimiento (`SPIKE_HOLD`) → bajada → apagado.
- Duraciones de rampa/bajada en formato k6, p. ej. `15s`, `45s`.

## Orden sugerido

1. Load → 2. Stress → 3. Spike (cuando ya conoces un rango razonable de VUs).

## Uso

Desde `Utopp-Testing/load-testing`:

```bash
set API_URL=http://localhost:8000
set SPIKE_BASELINE_VUS=10
set SPIKE_PEAK_VUS=150
set SPIKE_RAMP_UP=10s
set SPIKE_HOLD=60s
set SPIKE_RAMP_DOWN=30s
k6 run scripts/spike/main.js
```

Con Docker:

```bash
docker run --rm -i -v "%CD%:/app" -w /app -e API_URL=http://host.docker.internal:8000 -e SPIKE_PEAK_VUS=200 grafana/k6:latest run scripts/spike/main.js
```

## Interpretación

- El pico mide **cola** y **timeouts** bajo tráfico súbito; muchos 502/connection reset suelen ser límite de workers/DB/red, no solo una ruta.
- Mismo mapeo `tags.name` → routers que en stress/load (ver README de stress).
