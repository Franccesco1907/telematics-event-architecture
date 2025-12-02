-- ==============================================================================
-- SEED DATA - Datos Iniciales para Pruebas
-- ==============================================================================

-- Usuarios de prueba
INSERT INTO users (full_name, email, phone, role) VALUES
('Carlos Rodríguez', 'carlos.rodriguez@ccs.com', '+573001234567', 'ADMIN'),
('María González', 'maria.gonzalez@flota.com', '+573007654321', 'OWNER'),
('Juan Pérez', 'juan.perez@conductor.com', '+573009876543', 'DRIVER'),
('Ana López', 'ana.lopez@flota.com', '+573001112222', 'OWNER')
ON CONFLICT (email) DO NOTHING;

-- Vehículos de prueba
INSERT INTO vehicles (owner_id, plate, vehicle_type, device_imei, is_active) VALUES
(2, 'ABC123', 'TRUCK', '123456789012345', TRUE),
(2, 'XYZ789', 'CAR', '987654321098765', TRUE),
(2, 'MOT456', 'MOTO', '456789123456789', TRUE),
(4, 'DEF456', 'TRUCK', '111222333444555', TRUE),
(4, 'GHI789', 'CAR', '666777888999000', TRUE)
ON CONFLICT (plate) DO NOTHING;

-- Reglas de ejemplo
INSERT INTO rules (vehicle_id, name, event_type, condition_value, action_type, priority, is_active) VALUES
(1, 'Botón de Pánico', 'PANIC', '{}', 'CALL_EMERGENCY', 10, TRUE),
(1, 'Exceso de Velocidad', 'SPEED_LIMIT', '{"max_speed": 90}', 'SMS_OWNER', 7, TRUE),
(1, 'Parada No Planificada', 'STOP_UNPLANNED', '{"min_stop_duration": 300}', 'EMAIL_OWNER', 5, TRUE),
(2, 'Salida de Geocerca', 'GEOFENCE_EXIT', '{"geofence_id": "zone_1"}', 'PUSH_NOTIFICATION', 8, TRUE),
(3, 'Temperatura Alta', 'TEMPERATURE_ALERT', '{"max_temp": 50}', 'SMS_OWNER', 6, TRUE)
ON CONFLICT DO NOTHING;

SELECT 'Seed data inserted successfully!' AS status;

