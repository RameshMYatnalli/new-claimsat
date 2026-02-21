## 📄 `backend/core/config.py`
"""
Configuration Management
Loads settings from environment variables
"""
from pydantic_settings import BaseSettings
from typing import List
import json
class Settings(BaseSettings):
    """Application settings"""
    
    # MongoDB Configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "claimsat_reunify"
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    
    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".mp4", ".mov", ".avi"]
    
    # Scoring Weights (ClaimSat)
    LOCATION_WEIGHT: float = 0.30
    TIME_WEIGHT: float = 0.20
    EVIDENCE_TYPE_WEIGHT: float = 0.15
    VISUAL_RELEVANCE_WEIGHT: float = 0.20
    METADATA_INTEGRITY_WEIGHT: float = 0.15
    
    # Reunify Matching Weights
    NAME_SIMILARITY_WEIGHT: float = 0.30
    AGE_OVERLAP_WEIGHT: float = 0.20
    GENDER_WEIGHT: float = 0.10
    LOCATION_PROXIMITY_WEIGHT: float = 0.25
    PHYSICAL_DESC_WEIGHT: float = 0.15
    
    # Thresholds
    AGE_TOLERANCE: int = 3
    LOCATION_THRESHOLD_KM: float = 50.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
        # Custom JSON deserializer for list fields
        @staticmethod
        def parse_env_var(field_name: str, raw_val: str):
            if field_name in ['CORS_ORIGINS', 'ALLOWED_EXTENSIONS']:
                try:
                    return json.loads(raw_val)
                except json.JSONDecodeError:
                    return raw_val.split(',')
            return raw_val
# Global settings instance
settings = Settings()
