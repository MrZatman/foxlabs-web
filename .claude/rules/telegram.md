---
paths:
  - "**/telegram/**"
  - "**/api/telegram/**"
---

# Telegram Bots

## Bot Publico: @FoxLabsDev_bot
- **Token env**: `TELEGRAM_FOXLABS_BOT_TOKEN`
- **Webhook**: `/api/telegram/webhook`
- **Funcion**: Recibe mensajes de leads potenciales
- **Comportamiento**:
  - Guarda/actualiza lead en Supabase
  - Envia auto-reply al usuario
  - Forwardea mensaje al admin bot

## Bot Admin: @FoxOrchestrator_bot
- **Token env**: `TELEGRAM_ADMIN_BOT_TOKEN`
- **Chat ID env**: `TELEGRAM_ADMIN_CHAT_ID`
- **Funcion**: Notifica al admin sobre:
  - Nuevos leads del cotizador
  - Nuevos requests del portal
  - Mensajes del bot publico

## Configurar Webhook

```bash
https://api.telegram.org/bot{TELEGRAM_FOXLABS_BOT_TOKEN}/setWebhook?url=https://foxlabs.vercel.app/api/telegram/webhook
```

## Variables de Entorno

```env
TELEGRAM_FOXLABS_BOT_TOKEN=8634069503:AAG...
TELEGRAM_ADMIN_BOT_TOKEN=8435361885:AAG...
TELEGRAM_ADMIN_CHAT_ID=8302303906
```
