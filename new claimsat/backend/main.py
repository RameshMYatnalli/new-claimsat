"""
ClaimSat + Reunify Backend
FastAPI Main Application Entry Point
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core import database
from routes import claims, reunify

# -------------------------------------------------------------------
# Logging Configuration
# -------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
)
logger = logging.getLogger("claimsat-backend")

# -------------------------------------------------------------------
# Application Lifespan (Startup & Shutdown)
# -------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting ClaimSat + Reunify Backend...")
    try:
        await database.connect_to_mongo()
        if database.db is not None:
            logger.info("✅ MongoDB connected successfully")
        else:
            logger.info("⚠️ Running without database connection")
    except Exception as e:
        logger.warning(f"⚠️ Database connection issue: {e}")
        logger.info("🚀 Server will continue without database")

    yield

    logger.info("🛑 Shutting down ClaimSat + Reunify Backend...")
    await database.close_mongo_connection()
    logger.info("✅ Backend shutdown complete")

# -------------------------------------------------------------------
# FastAPI App Initialization
# -------------------------------------------------------------------
app = FastAPI(
    title="ClaimSat + Reunify API",
    description="Disaster Response Platform – Damage Verification & Reunification System",
    version="1.0.0",
    lifespan=lifespan,
)

# -------------------------------------------------------------------
# CORS Middleware
# -------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Global Exception Handler
# -------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.API_RELOAD else "An unexpected error occurred",
        },
    )

# -------------------------------------------------------------------
# Health Check
# -------------------------------------------------------------------
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "database": "connected" if database.db is not None else "disconnected",
        "service": "ClaimSat + Reunify",
        "version": "1.0.0",
    }

# -------------------------------------------------------------------
# Root Endpoint
# -------------------------------------------------------------------
@app.get("/", tags=["System"])
async def root():
    return {
        "message": "ClaimSat + Reunify API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }

# -------------------------------------------------------------------
# API Routers
# -------------------------------------------------------------------
app.include_router(
    claims.router,
    prefix="/api/claims",
    tags=["ClaimSat"],
)

app.include_router(
    reunify.router,
    prefix="/api/reunify",
    tags=["Reunify"],
)

# -------------------------------------------------------------------
# Local Development Entry Point
# -------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD,
    )