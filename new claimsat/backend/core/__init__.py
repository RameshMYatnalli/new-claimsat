"""Core module initialization"""
from .config import settings
from .database import get_database, db
__all__ = ['settings', 'get_database', 'db']