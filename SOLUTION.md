#  Descripción Detallada de la Arquitectura

## 1. Patrón Arquitectónico: Event-Driven Architecture (EDA)

La arquitectura se basa en un modelo orientado a eventos, crucial para el alto volumen y la baja latencia requeridos.

* **Desacoplamiento:** La recepción de señales (Ingesta) está separada del procesamiento de reglas y las notificaciones. Si el servicio de notificaciones falla, la ingesta y el almacenamiento de datos no se detienen.
* **Escalabilidad Horizontal:** Cada microservicio (Ingestor, Rule Engine, Notificador) puede tener múltiples réplicas (contenedores) para manejar el aumento de 20% anual.

## 2. Diagrama de Componentes (Opcional: Agregar Imagen)

**Flujo de la señal:** Dispositivo -> MQTT Broker -> Kafka -> Microservicios -> Bases de Datos / Notificaciones.

* **Ingesta (MQTT Broker):** Utiliza MQTT por ser ligero y diseñado para dispositivos IoT con ancho de banda limitado.
* **Buffer de Carga (Apache Kafka):** Actúa como cola de mensajes. Es el componente clave para soportar los picos de **500 señales/segundo**. Permite que los servicios "consuman" a su propio ritmo.

## 3. Estrategia de Latencia Crítica (< 2 Segundos)

Para garantizar la respuesta de emergencia en menos de **2 segundos** (ej: Botón de Pánico), se implementan dos mecanismos:

1. **Carril Rápido (Priority Topic):** Las señales de emergencia se enrutan a un *topic* de Kafka exclusivo (`panic-priority`) que solo es escuchado por un *worker* dedicado y optimizado.
2. **Consulta en Caché (Redis):** El motor de reglas no consulta PostgreSQL. En su lugar, utiliza **Redis** para buscar la configuración de reglas del vehículo en memoria, eliminando la latencia de I/O de disco.

## 4. Estrategia de Escalabilidad a Nivel de Base de Datos

Para manejar el volumen masivo de datos de GPS y sensores (telemetría), se utiliza un modelo híbrido.

* **Datos Transaccionales (PostgreSQL):** Almacena datos estables (Usuarios, Vehículos, Reglas).
* **Datos de Telemetría (TimescaleDB / Particionamiento):** La tabla de señales (`telemetry_signals`) se particiona por tiempo (día o semana). Esto:
  * **Optimiza Inserción:** Las escrituras son rápidas al dirigirse solo a la partición activa.
  * **Optimiza Lectura:** Las consultas históricas ignoran las particiones irrelevantes, mejorando el rendimiento.

## 5. Justificación de los Componentes

| Componente                        | Función Principal                                     | Disponibilidad / Escalabilidad                                                                                                          |
| :-------------------------------- | :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **Microservicios (Docker)** | Lógica de negocio (Rules Engine, Notifier, Ingestor). | **Escalabilidad:** Se puede levantar cualquier número de réplicas de Docker para manejar la carga (Horizontal Scaling).         |
| **Apache Kafka**            | Buffer de eventos y separación de responsabilidades.  | **Disponibilidad:** Configurado como un clúster con múltiples *brokers* (replicación). Si un nodo cae, la ingesta continúa. |
| **Redis**                   | Caché de reglas y estado del vehículo.               | **Disponibilidad:** Modo *Sentinel* o *Cluster* para failover automático si el nodo primario falla.                          |
