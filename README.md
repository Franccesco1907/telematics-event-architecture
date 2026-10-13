# Telematics Event Architecture

Prototipo NestJS de monitoreo de flotas para el reto de arquitectura de CCS. Separa ingesta HTTP, evaluación de reglas y notificaciones; Kafka distingue telemetría normal, pánico y eventos, y Redis almacena estado/reglas.

## Ejecutar localmente

Requiere Docker Compose. Desde la raíz:

```sh
cp .env.example .env
docker compose -f docker-compose.local.yml up --build
```

El ejemplo conecta PostgreSQL, Redis y Kafka por sus nombres de servicio. Los puertos predeterminados son 3000 (ingestor), 3001 (rules-engine) y 3002 (notifier). Revisa credenciales y variables en `.env.example` antes de exponer servicios.

- Swagger: `http://localhost:3000/api`; OpenAPI: `/api-json`.
- `POST /ingestion/seed` crea datos de demostración; úsalo solo en una base de pruebas.
- `POST /ingestion/signal` recibe, por ejemplo, `{"vehicleId":1,"signalType":"gps","value":{"speed":80},"latitude":4.7110,"longitude":-74.0721}`.

## Verificar y orientar cambios

Para pruebas locales, usa Node.js 22 (como el Dockerfile): `npm ci`, `npm test -- --runInBand` y `npm run test:cov -- --runInBand`. Compila cada aplicación con `npm run build -- ingestor`, `npm run build -- rules-engine` y `npm run build -- notifier`.

`apps/` contiene los tres servicios; `libs/common/src/` contiene configuración, Kafka, caché, persistencia y utilidades. Las pruebas usan `jest.config.ts`. `docker-compose.prod.yml` y `Dockerfile.prod` definen las imágenes compiladas.

## Alcance real

Los 500 eventos/s y la reacción al pánico en menos de 2 s son objetivos del diseño, no resultados medidos. La ingesta persiste cada señal antes de publicar en Kafka; no implementa un flujo sin I/O ni inserciones SQL masivas. Compose usa PostgreSQL, no TimescaleDB. Los envíos de email/SMS/push/webhook son simulaciones. La cobertura debe calcularse, no asumirse.
