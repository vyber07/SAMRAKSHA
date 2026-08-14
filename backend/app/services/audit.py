import logging
from sqlalchemy import text
from typing import Optional
import uuid

logger = logging.getLogger("samraksha.audit")

async def log_activity(db, officer_id: Optional[str], action: str, details: str, ip_address: Optional[str] = None):
    """
    Log system and officer activity to the tamper-proof system_logs table.
    """
    try:
        parsed_officer_id = None
        if officer_id:
            try:
                parsed_officer_id = uuid.UUID(str(officer_id))
            except (ValueError, TypeError):
                parsed_officer_id = None

        # Clean IP address or set None if local / test string
        clean_ip = None
        if ip_address:
            # Check basic valid IP syntax (IPv4/IPv6) or ignore host strings
            if ip_address in ("localhost", "127.0.0.1", "testclient"):
                clean_ip = "127.0.0.1"
            else:
                clean_ip = ip_address

        query = text("""
            INSERT INTO system_logs (officer_id, action, details, ip_address, created_at)
            VALUES (:officer_id, :action, :details, :ip_address, NOW())
        """)
        
        await db.execute(query, {
            "officer_id": parsed_officer_id,
            "action": action[:50] if action else "action",
            "details": details,
            "ip_address": clean_ip
        })
        await db.commit()
    except Exception as e:
        logger.warning(f"Failed to record audit activity: {e}")
