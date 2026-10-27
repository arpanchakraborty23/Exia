"""
Exia Main Application Gateway.

Acts as the default application bridge:
  - For Vercel Serverless: exports `app` from `main_vercel.py`
  - For local desktop execution: run `python main_desktop.py`
"""

from main_desktop import app

__all__ = ["app"]
