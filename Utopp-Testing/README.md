# Utopp API Testing

Proyecto independiente de pruebas de integración para la API de Utopp.

## Requisitos Previos

- Python 3.12 o superior
- La API de Utopp debe estar corriendo en `http://localhost:8000`

## Configuración

1. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurar URL de la API:**
   
   Edita el archivo `config.py` si necesitas cambiar la URL base de la API:
   ```python
   API_BASE_URL = "http://localhost:8000"
   ```

## Ejecutar Tests

### Ejecutar todos los tests de usuarios:
```bash
pytest test_users.py -v
```

### Ejecutar un test específico:
```bash
pytest test_users.py::TestUsersAPI::test_get_current_user_profile -v
```

### Ejecutar tests con más detalle:
```bash
pytest test_users.py -vv -s
```

## Endpoints Testeados

### Sin Autenticación:
- `GET /users/all-users` - Listar todos los usuarios
- `GET /users/check-username` - Verificar disponibilidad de username
- `GET /users/check-email` - Verificar disponibilidad de email
- `GET /users/{user_id}` - Obtener perfil público de usuario
- `GET /users/{user_id}/posts` - Obtener posts de un usuario
- `GET /users/{user_id}/followers` - Obtener seguidores de un usuario
- `GET /users/{user_id}/following` - Obtener usuarios seguidos por un usuario

### Con Autenticación:
- `GET /users/me` - Obtener perfil del usuario actual
- `PATCH /users/me` - Actualizar perfil del usuario actual
- `PUT /users/me/interests` - Actualizar intereses del usuario
- `POST /users/{user_id}/follow` - Seguir a un usuario
- `DELETE /users/{user_id}/follow` - Dejar de seguir a un usuario
- `DELETE /users/me/followers/{follower_id}` - Eliminar un seguidor

## Notas

- Los tests crean un usuario de prueba (`test.integration@utec.edu.pe`) automáticamente
- Los tests requieren que la API esté corriendo y accesible
- Algunos tests pueden fallar si la base de datos no tiene datos suficientes (por ejemplo, tests de follow/unfollow requieren múltiples usuarios)

---

# Load Testing con k6

Esta sección cubre las pruebas de carga (load testing) para la API de Utopp usando k6.

## ¿Qué es k6?

k6 es una herramienta de open source para pruebas de carga y rendimiento de APIs. Está escrita en Go y utiliza JavaScript para escribir scripts de prueba.

## Instalación de k6

### Windows

Usando Chocolatey:
```bash
choco install k6
```

Usando Scoop:
```bash
scoop install k6
```

Usando Winget:
```bash
winget install k6
```

Descarga manual:
1. Visita https://k6.io/docs/getting-started/installation/
2. Descarga el instalador para Windows
3. Ejecuta el instalador

Verificar instalación:
```bash
k6 version
```

## Estructura del Proyecto de Load Testing

```
load-testing/
├── config/
│   └── config.js          # Configuración centralizada (URL, thresholds, parámetros)
├── scripts/
│   ├── load/
│   │   └── main.js       # Script principal de load testing
│   ├── stress/           # Placeholder para stress testing futuro
│   └── spike/            # Placeholder para spike testing futuro
├── data/
│   └── users.json        # Credenciales de usuarios de prueba
└── reports/              # Directorio para reportes de tests
```

## Configuración

La configuración se encuentra en `load-testing/config/config.js`. Puedes modificar:

- **API URL**: Cambiar la URL base de la API
- **VUs**: Número de usuarios virtuales (por defecto: 50)
- **Duration**: Duración del test (por defecto: 30s)
- **Thresholds**: Criterios de rendimiento (p(95) < 500ms, error rate < 1%)

### Variables de Entorno

También puedes usar variables de entorno para sobrescribir la configuración:

```bash
# Cambiar URL de la API
set API_URL=http://localhost:8000

# Cambiar número de VUs
set VUS=100

# Cambiar duración
set DURATION=60s
```

## Preparación de Datos de Prueba

Antes de ejecutar los tests de carga, necesitas crear los usuarios de prueba en la base de datos. El archivo `load-testing/data/users.json` contiene 50 usuarios con credenciales.

Para crear estos usuarios, puedes usar el script de registro o crearlos manualmente en la base de datos.

## Ejecutar Load Test

### Ejecución Básica

```bash
cd load-testing
k6 run scripts/load/main.js
```

### Ejecutar con Parámetros Personalizados

```bash
k6 run --env VUS=100 --env DURATION=60s scripts/load/main.js
```

### Generar Reporte HTML

```bash
k6 run --out json=reports/report.json scripts/load/main.js
```

### Ejecutar con Salida Detallada

```bash
k6 run --summary-export=reports/summary.json scripts/load/main.js
```

## Interpretar Resultados

### Métricas Principales

k6 muestra las siguientes métricas al finalizar el test:

- **http_req_duration**: Tiempo de respuesta de las requests HTTP
  - `avg`: Promedio
  - `p(95)`: 95th percentile (95% de las requests completan en este tiempo)
  - `p(99)`: 99th percentile (99% de las requests completan en este tiempo)

- **http_reqs**: Número total de requests
  - `rate`: Requests por segundo

- **http_req_failed**: Requests fallidas
  - `rate`: Tasa de error (debe ser < 1%)

- **vus**: Usuarios virtuales activos durante el test

### Thresholds

Los thresholds son criterios de rendimiento que determinan si el test pasa o falla:

- `p(95)<500`: 95% de las requests deben completar en menos de 500ms
- `p(99)<1000`: 99% de las requests deben completar en menos de 1000ms
- `rate<0.01`: Tasa de error debe ser menor al 1%
- `rate>=10`: Debe haber al menos 10 requests por segundo

Si un threshold no se cumple, el test fallará (exit code 1).

### Ejemplo de Salida Exitosa

```
✓ login status is 200
✓ login response has access_token
✓ feed status is 200
✓ feed response has items
✓ users/me status is 200
✓ users/me response has id
✓ all-users status is 200
✓ all-users response is array
✓ roles/me status is 200
✓ roles/me response is array

checks.........................: 100.00% ✓ 20000 ✗ 0
data_received..................: 15 MB 500 kB/s
data_sent......................: 5.0 MB 166 kB/s
http_req_blocked...............: avg=1.2ms  min=0s    med=1ms   max=15ms  p(95)=2ms   p(99)=3ms
http_req_connecting............: avg=0s     min=0s    med=0s    max=0s    p(95)=0s    p(99)=0s
http_req_duration..............: avg=245ms  min=150ms med=230ms max=450ms p(95)=350ms p(99)=400ms
  { type:API }.................: avg=245ms  min=150ms med=230ms max=450ms p(95)=350ms p(99)=400ms
http_req_failed................: 0.00%   ✓ 20000 ✗ 0
  { type:API }.................: 0.00%   ✓ 20000 ✗ 0
http_req_receiving.............: avg=10ms   min=1ms   med=8ms   max=50ms  p(95)=15ms  p(99)=20ms
http_req_sending...............: avg=1ms    min=0s    med=1ms   max=5ms   p(95)=2ms   p(99)=3ms
http_req_tls_handshaking.......: avg=0s     min=0s    med=0s    max=0s    p(95)=0s    p(99)=0s
http_req_waiting...............: avg=234ms  min=140ms med=220ms max=440ms p(95)=340ms p(99)=390ms
http_reqs......................: 20000  666.666667/s
iteration_duration.............: avg=2.5s   min=2.1s  med=2.4s  max=3.2s  p(95)=2.8s  p(99)=3.0s
iterations.....................: 5000   166.666667/s
vus............................: 50     min=50   max=50
vus_max........................: 50     min=50   max=50
```

## Endpoints Probados

El script de load testing prueba los siguientes endpoints (todos requieren autenticación):

- `POST /auth/login` - Login para obtener token de autenticación
- `GET /feed` - Obtener feed principal
- `GET /users/me` - Obtener perfil del usuario actual
- `GET /users/all-users` - Listar todos los usuarios
- `GET /roles/me` - Obtener roles del usuario

## Roadmap Futuro

### Stress Testing

Pruebas de estrés para identificar puntos de ruptura del sistema.

Ubicación: `load-testing/scripts/stress/`

### Spike Testing

Pruebas de picos de tráfico para simular aumentos súbitos de carga.

Ubicación: `load-testing/scripts/spike/`

## Solución de Problemas

### Error: "Cannot connect to API"

- Verifica que la API esté corriendo en `http://localhost:8000`
- Verifica la configuración en `config/config.js`

### Error: "Login failed"

- Verifica que los usuarios en `data/users.json` existan en la base de datos
- Verifica que las credenciales sean correctas

### Thresholds No Cumplidos

- Si p(95) > 500ms: La API está respondiendo más lento de lo esperado
- Si error rate > 1%: Hay demasiados errores en las requests
- Revisa los logs de la API para identificar el problema

## Recursos Adicionales

- [Documentación oficial de k6](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Best Practices for Load Testing](https://k6.io/docs/guides/best-practices/)
