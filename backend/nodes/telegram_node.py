from telegram import Bot

from core.config import settings


async def send_message(message: str):
    try:
        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
        await bot.send_message(chat_id=settings.TELEGRAM_CHAT_ID, text=message)
        print("✅ Message sent successfully!")
    except Exception as e:
        print(f"❌ Error sending message: {e}")
