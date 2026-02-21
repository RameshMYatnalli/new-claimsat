"""
Evidence Analysis Service
Lightweight visual relevance scoring using OpenCV
NO damage detection, NO flood detection, NO ML training
"""
import cv2
import numpy as np
from typing import Tuple, Dict, Any
import logging
import hashlib
import io
from PIL import Image
logger = logging.getLogger(__name__)
def calculate_file_hash(file_bytes: bytes) -> str:
    """Calculate SHA-256 hash of file"""
    return hashlib.sha256(file_bytes).hexdigest()
def analyze_image_quality(image_bytes: bytes) -> Dict[str, Any]:
    """
    Analyze basic image quality metrics
    Returns quality indicators WITHOUT claiming damage detection
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {
                "valid": False,
                "error": "Unable to decode image"
            }
        
        # Basic metrics
        height, width = img.shape[:2]
        total_pixels = height * width
        
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Calculate metrics
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()  # Higher = sharper
        brightness = np.mean(gray)
        contrast = np.std(gray)
        
        # Color diversity (more diverse = more likely to be real scene)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        color_diversity = np.std(hsv[:, :, 0])  # Hue channel std deviation
        
        return {
            "valid": True,
            "width": width,
            "height": height,
            "total_pixels": total_pixels,
            "blur_score": float(blur_score),
            "brightness": float(brightness),
            "contrast": float(contrast),
            "color_diversity": float(color_diversity)
        }
    
    except Exception as e:
        logger.error(f"Error analyzing image: {e}")
        return {
            "valid": False,
            "error": str(e)
        }
def calculate_visual_relevance_score(image_bytes: bytes) -> Tuple[float, str]:
    """
    Calculate visual relevance score (0-1) based on image characteristics
    
    This does NOT detect damage or floods
    This only assesses if image appears to be a real outdoor/structural photo
    
    Returns: (score: 0-1, explanation: str)
    """
    quality = analyze_image_quality(image_bytes)
    
    if not quality.get("valid", False):
        return 0.0, f"Invalid or corrupted image: {quality.get('error', 'Unknown error')}"
    
    # Calculate relevance based on quality metrics
    score_components = []
    explanations = []
    
    # 1. Sharpness (blur_score)
    blur_score = quality.get("blur_score", 0)
    if blur_score > 500:
        score_components.append(0.9)
        explanations.append("sharp focus")
    elif blur_score > 200:
        score_components.append(0.7)
        explanations.append("moderate focus")
    elif blur_score > 50:
        score_components.append(0.5)
        explanations.append("slightly blurry")
    else:
        score_components.append(0.2)
        explanations.append("very blurry")
    
    # 2. Brightness (not too dark, not overexposed)
    brightness = quality.get("brightness", 0)
    if 50 <= brightness <= 200:
        score_components.append(0.9)
        explanations.append("good lighting")
    elif 30 <= brightness <= 220:
        score_components.append(0.6)
        explanations.append("acceptable lighting")
    else:
        score_components.append(0.3)
        explanations.append("poor lighting")
    
    # 3. Contrast (diverse tones = real scene)
    contrast = quality.get("contrast", 0)
    if contrast > 50:
        score_components.append(0.9)
        explanations.append("high detail")
    elif contrast > 30:
        score_components.append(0.7)
        explanations.append("moderate detail")
    else:
        score_components.append(0.4)
        explanations.append("low detail")
    
    # 4. Resolution
    total_pixels = quality.get("total_pixels", 0)
    if total_pixels > 2000000:  # > 2MP
        score_components.append(0.9)
        explanations.append("high resolution")
    elif total_pixels > 500000:  # > 0.5MP
        score_components.append(0.7)
        explanations.append("adequate resolution")
    else:
        score_components.append(0.4)
        explanations.append("low resolution")
    
    # Calculate final score (average of components)
    final_score = np.mean(score_components)
    
    # Build explanation
    explanation = f"Image quality: {', '.join(explanations)}. "
    explanation += "Visual relevance indicates likelihood of genuine outdoor/structural photo, not damage detection."
    
    return float(final_score), explanation
def analyze_video_quality(file_bytes: bytes) -> Tuple[float, str]:
    """
    Analyze video quality
    Videos generally get higher scores as they're harder to fake
    
    Returns: (score: 0-1, explanation: str)
    """
    try:
        # For simplicity, videos get a higher base score
        # In production, you could analyze frame count, duration, etc.
        file_size_mb = len(file_bytes) / (1024 * 1024)
        
        if file_size_mb > 5:
            return 0.95, "High-quality video evidence (large file size suggests genuine footage)"
        elif file_size_mb > 1:
            return 0.85, "Good video evidence (adequate duration and quality)"
        elif file_size_mb > 0.5:
            return 0.75, "Acceptable video evidence (short duration or compressed)"
        else:
            return 0.6, "Low-quality video (very short or heavily compressed)"
    
    except Exception as e:
        logger.error(f"Error analyzing video: {e}")
        return 0.5, f"Unable to analyze video quality: {str(e)}"
def analyze_evidence(file_bytes: bytes, file_extension: str) -> Tuple[float, str, str]:
    """
    Main evidence analysis function
    
    Returns: (visual_score: 0-1, explanation: str, file_hash: str)
    """
    # Calculate file hash
    file_hash = calculate_file_hash(file_bytes)
    
    # Analyze based on file type
    ext = file_extension.lower()
    
    if ext in ['.jpg', '.jpeg', '.png']:
        score, explanation = calculate_visual_relevance_score(file_bytes)
    elif ext in ['.mp4', '.mov', '.avi']:
        score, explanation = analyze_video_quality(file_bytes)
    else:
        score, explanation = 0.5, "Unknown file type, cannot analyze"
    
    return score, explanation, file_hash