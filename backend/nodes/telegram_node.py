import logging

from telegram import Bot

from core.config import settings

logger = logging.getLogger(__name__)


async def send_message(message: str):
    try:
        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
        await bot.send_message(chat_id=settings.TELEGRAM_CHAT_ID, text=message)
        logger.info("telegram_message_sent", extra={"chat_id": settings.TELEGRAM_CHAT_ID})
    except Exception:
        logger.exception("telegram_message_failed")
        raise
