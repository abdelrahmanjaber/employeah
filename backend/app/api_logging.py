from __future__ import annotations

import json
import logging
import time
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("uvicorn.error")


def _safe_decode(b: bytes, max_bytes: int) -> str:
    if len(b) > max_bytes:
        b = b[:max_bytes]
    try:
        return b.decode("utf-8", errors="replace")
    except Exception:
        return "<non-utf8-bytes>"


def _try_json(text: str) -> Any:
    try:
        return json.loads(text)
    except Exception:
        return None


class APILoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, enabled: bool, max_bytes: int = 4096):
        super().__init__(app)
        self.enabled = enabled
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next) -> Response:
        if not self.enabled or not request.url.path.startswith("/api/"):
            return await call_next(request)

        start = time.perf_counter()

        body_bytes = await request.body()

        async def receive():
            return {"type": "http.request", "body": body_bytes, "more_body": False}

        request._receive = receive

        req_ct = (request.headers.get("content-type") or "").lower()
        req_body_preview: Any = None
        if body_bytes:
            raw_text = _safe_decode(body_bytes, self.max_bytes)
            if "application/json" in req_ct:
                req_body_preview = _try_json(raw_text) or raw_text
            else:
                req_body_preview = raw_text

        response = await call_next(request)
        status = response.status_code
        resp_ct = (response.headers.get("content-type") or "").lower()

        resp_body_preview: Any = None
        resp_body_bytes = b""
        try:
            async for chunk in response.body_iterator:  # type: ignore[attr-defined]
                resp_body_bytes += chunk
        except Exception:
            resp_body_bytes = b""

        if resp_body_bytes:
            raw_text = _safe_decode(resp_body_bytes, self.max_bytes)
            if "application/json" in resp_ct:
                resp_body_preview = _try_json(raw_text) or raw_text
            else:
                resp_body_preview = raw_text

        duration_ms = round((time.perf_counter() - start) * 1000, 1)

        logger.info(
            "API %s %s status=%s ms=%s query=%s req_body=%s resp_body=%s",
            request.method,
            request.url.path,
            status,
            duration_ms,
            dict(request.query_params),
            req_body_preview,
            resp_body_preview,
        )

        return Response(
            content=resp_body_bytes,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )
