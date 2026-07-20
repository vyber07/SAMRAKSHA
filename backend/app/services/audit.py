from app.db.connection import execute

async def log_activity(db, officer_id: str, action: str, details: str, ip_address: str = None):
    """
    Logs system activity to the tamper-proof system_logs table.
    """
    await execute(db, """
        INSERT INTO system_logs (officer_id, action, details, ip_address)
        VALUES ($1, $2, $3, $4)
    """, [officer_id, action, details, ip_address])
    await db.commit()
