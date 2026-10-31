"""Vercel-compatible FastAPI app entrypoint.

This module exists so Vercel can discover the application through the configured
`[tool.vercel] entrypoint = "app:app"` setting.
"""

from main import app

__all__ = ["app"]
