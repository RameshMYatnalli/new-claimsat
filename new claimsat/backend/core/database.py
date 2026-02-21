"""
MongoDB Database Connection
Manages database connection and provides database instance
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging
from core.config import settings
logger = logging.getLogger(__name__)
# Global database instances
client: Optional[AsyncIOMotorClient] = None
db = None
async def connect_to_mongo():
    """
    Connect to MongoDB
    Creates indexes for optimal query performance
    """
    global client, db
    
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}")
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        db = client[settings.DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        logger.info("✅ MongoDB connection successful")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.warning(f"⚠️ MongoDB connection failed: {e}")
        logger.info("🚀 Server will continue without database connection")
        # Don't raise the exception, allow server to start without DB
async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    
    if client is not None:
        client.close()
        logger.info("MongoDB connection closed")
async def create_indexes():
    """Create database indexes for optimal performance"""
    
    if db is None:
        logger.warning("⚠️ Database not available, skipping index creation")
        return
        
    try:
        # Claims indexes
        await db.claims.create_index("claim_id", unique=True)
        await db.claims.create_index("status")
        await db.claims.create_index("created_at")
        await db.claims.create_index([("location.coordinates", "2dsphere")])
        
        # Claim events indexes
        await db.claim_events.create_index("claim_id")
        await db.claim_events.create_index("timestamp")
        
        # Disasters indexes
        await db.disasters.create_index("disaster_id", unique=True)
        await db.disasters.create_index("status")
        await db.disasters.create_index([("location.coordinates", "2dsphere")])
        
        # Missing persons indexes
        await db.missing_persons.create_index("person_id", unique=True)
        await db.missing_persons.create_index("status")
        await db.missing_persons.create_index("disaster_id")
        
        # Survivors indexes
        await db.survivors.create_index("survivor_id", unique=True)
        await db.survivors.create_index("status")
        await db.survivors.create_index("disaster_id")
        
        # Reunify matches indexes
        await db.reunify_matches.create_index("match_id", unique=True)
        await db.reunify_matches.create_index("missing_person_id")
        await db.reunify_matches.create_index("survivor_id")
        await db.reunify_matches.create_index("confidence_score")
        
        logger.info("✅ Database indexes created successfully")
        
    except Exception as e:
        logger.warning(f"⚠️ Index creation warning: {e}")
def get_database():
    """Get database instance (dependency injection)"""
    return db
