"""Validate API bearer tokens against the configured Supabase Auth service."""

import os
from urllib.parse import urlsplit

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer = HTTPBearer(auto_error=False)
bearer_challenge = {"WWW-Authenticate": "Bearer"}


async def require_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> None:
    if not credentials:
        raise HTTPException(
            401, "Sign in to use the screening service.", headers=bearer_challenge
        )

    origin = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "").strip()
    try:
        url = urlsplit(origin)
    except ValueError as error:
        raise HTTPException(503, "Screening authentication is not configured.") from error
    local = url.scheme == "http" and url.hostname in {"127.0.0.1", "localhost", "::1"}
    if (
        not key
        or not url.hostname
        or (url.scheme != "https" and not local)
        or url.username
        or url.password
        or url.path
        or url.query
        or url.fragment
    ):
        raise HTTPException(503, "Screening authentication is not configured.")

    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=False) as client:
            response = await client.get(
                f"{origin}/auth/v1/user",
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {credentials.credentials}",
                },
            )
        if response.status_code in (401, 403):
            raise HTTPException(
                401, "Your session is invalid or expired. Sign in again.", headers=bearer_challenge
            )
        response.raise_for_status()
        user = response.json()
        if not isinstance(user, dict) or not isinstance(user.get("id"), str) or not user["id"]:
            raise ValueError("Missing user ID")
    except (httpx.HTTPError, ValueError) as error:
        raise HTTPException(503, "Screening authentication is temporarily unavailable.") from error
