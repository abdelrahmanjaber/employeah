import time

import psycopg2

from app.config import settings


def main() -> None:
    attempts = 30
    delay_s = 1
    last_err: Exception | None = None

    dsn = settings.database_url.replace("postgresql+psycopg2://", "postgresql://", 1)

    for _ in range(attempts):
        try:
            conn = psycopg2.connect(dsn)
            conn.close()
            return
        except Exception as e:
            last_err = e
            time.sleep(delay_s)

    raise RuntimeError(f"Database not ready after {attempts} attempts: {last_err}")


if __name__ == "__main__":
    main()
