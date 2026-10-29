# 9 · Costos

Montos en USD, sin IVA, para México. Fuente: estimaciones de Alejandro Gil para Logisa (1 y 20-oct-2026)
y precios oficiales consultados en oct-2026. **Verificar precios en cada consola al arrancar un
cliente nuevo.**

## Por concepto

| Concepto | Costo | Nota |
|---|---|---|
| Servidor | AWS Lightsail 2 GB ≈ 12/mes + snapshots ≈ 2/mes (o EC2 t4g.micro México ≈ 11,67 con disco e IP fija; Azure B1s ≈ 14,61; Railway Pro ≈ 20) | Fijo. |
| IA (Claude Sonnet 5.5) | 2 por millón de tokens de entrada, 10 por millón de salida | Medido en Logisa: < 0,01 por conversación. Presupuestar ≤ 0,03. |
| WhatsApp (Meta) | **Desde el 1-oct-2026 cobra los mensajes de servicio**: 1.000 gratis por mes por número; después ≈ 0,0085 por mensaje entregado en México | Es el costo mayor. Sin método de pago, Meta deja de entregar al agotar el cupo. Las plantillas (fuera de las 24 h) se cobran aparte. |
| HubSpot | 0 (licencia del cliente) | — |
| Certificado HTTPS | 0 (Let's Encrypt) | — |
| Túnel de pruebas | 0 (cloudflared sin cuenta) | Solo pruebas. |
| Número de prueba de Meta | 0 | Solo 5 destinatarios. |

Un bot de calificación manda **13–16 mensajes por conversación**.

## Mensual (AWS + Sonnet 5.5, supuestos del 20-oct)

| Conversaciones/mes | Servidor | IA | WhatsApp | **Total** |
|---|---|---|---|---|
| 100 | ≈ 14 | ≤ 3 | 4 | **≈ 21** |
| 200 | ≈ 14 | ≤ 6 | 17 | **≈ 37** |
| 300 | ≈ 14 | ≤ 9 | 30 | **≈ 53** |
| 400 | ≈ 14 | ≤ 12 | 43 | **≈ 69** |

Como referencia, en Logisa el total quedó en **menos del 10 % de lo que cobraban los proveedores
de bots anteriores**.

## Pruebas

- Créditos de IA para pruebas: USD 20 alcanzan para miles de conversaciones; una corrida completa
  de pruebas con IA cuesta USD 1–3.
- Medir con `registros/costos.jsonl` durante la semana de pruebas y rehacer la tabla con datos
  reales antes de pedir la aprobación final.

## Qué se le presenta a dirección

Una tabla de una página: costo mensual por volumen (100–400 conversaciones), comparando proveedor
de servidor y modelo, con la recomendación y la alerta del método de pago de Meta.
