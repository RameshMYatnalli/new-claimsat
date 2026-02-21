"""
Initialize Sample Data
Run this script to populate the database with sample disasters, claims, missing persons, etc.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import uuid
async def init_sample_data():
    """Initialize sample data for testing"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.claimsat_reunify
    
    print("🗑️  Clearing existing data...")
    await db.disasters.delete_many({})
    await db.claims.delete_many({})
    await db.claim_events.delete_many({})
    await db.missing_persons.delete_many({})
    await db.survivors.delete_many({})
    await db.reunify_matches.delete_many({})
    
    print("🌊 Creating sample disaster...")
    disaster = {
        "disaster_id": "DIS001",
        "name": "Chennai Floods 2024",
        "type": "flood",
        "location": {
            "type": "Polygon",
            "coordinates": [[
                [80.2, 13.0],
                [80.3, 13.0],
                [80.3, 13.1],
                [80.2, 13.1],
                [80.2, 13.0]
            ]]
        },
        "start_date": (datetime.now() - timedelta(days=2)).isoformat(),
        "end_date": None,
        "status": "active",
        "severity": 4,
        "description": "Severe flooding in Chennai due to heavy monsoon rains",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    await db.disasters.insert_one(disaster)
    print(f"  ✅ Disaster: {disaster['disaster_id']} - {disaster['name']}")
    
    print("\n👥 Creating sample missing persons...")
    missing_persons = [
        {
            "person_id": "MP001",
            "disaster_id": "DIS001",
            "name": "Ramesh Kumar",
            "age": 45,
            "gender": "male",
            "height": 170,
            "physical_description": "Medium build, black hair, wearing blue shirt",
            "last_seen_location": "Anna Nagar, Chennai",
            "last_seen_date": (datetime.now() - timedelta(days=1)).isoformat(),
            "last_seen_coordinates": {"lat": 13.05, "lng": 80.25},
            "reported_by": "Lakshmi Kumar",
            "reporter_contact": "+91-9876543210",
            "reporter_relation": "Wife",
            "status": "missing",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "person_id": "MP002",
            "disaster_id": "DIS001",
            "name": "Priya Sharma",
            "age": 28,
            "gender": "female",
            "height": 160,
            "physical_description": "Slim build, long hair, wearing red saree",
            "last_seen_location": "T Nagar, Chennai",
            "last_seen_date": (datetime.now() - timedelta(days=1)).isoformat(),
            "last_seen_coordinates": {"lat": 13.04, "lng": 80.24},
            "reported_by": "Suresh Sharma",
            "reporter_contact": "+91-9876543211",
            "reporter_relation": "Brother",
            "status": "missing",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ]
    
    for person in missing_persons:
        await db.missing_persons.insert_one(person)
        print(f"  ✅ Missing Person: {person['person_id']} - {person['name']}")
    
    print("\n🏥 Creating sample survivors...")
    survivors = [
        {
            "survivor_id": "SV001",
            "disaster_id": "DIS001",
            "name": "Ramesh",
            "age": 46,
            "gender": "male",
            "height": 168,
            "physical_description": "Medium build, black hair, blue clothing",
            "current_location": "Relief Camp A, Anna Nagar",
            "current_coordinates": {"lat": 13.06, "lng": 80.26},
            "shelter_name": "Anna Nagar Relief Camp",
            "registered_by": "Red Cross Chennai",
            "registered_at": datetime.utcnow().isoformat(),
            "status": "searching",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "survivor_id": "SV002",
            "disaster_id": "DIS001",
            "name": "Priya",
            "age": 27,
            "gender": "female",
            "height": 162,
            "physical_description": "Slim, long dark hair, red clothing",
            "current_location": "Relief Camp B, T Nagar",
            "current_coordinates": {"lat": 13.045, "lng": 80.245},
            "shelter_name": "T Nagar Community Center",
            "registered_by": "District Administration",
            "registered_at": datetime.utcnow().isoformat(),
            "status": "searching",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ]
    
    for survivor in survivors:
        await db.survivors.insert_one(survivor)
        print(f"  ✅ Survivor: {survivor['survivor_id']} - {survivor['name']}")
    
    print("\n📋 Creating sample claim...")
    claim = {
        "claim_id": "CLM001",
        "claimant_name": "Vijay Reddy",
        "claimant_contact": "+91-9876543212",
        "property_address": "123 Main Street, Anna Nagar, Chennai",
        "location": {"lat": 13.05, "lng": 80.25},
        "disaster_id": "DIS001",
        "incident_date": (datetime.now() - timedelta(days=1)).isoformat(),
        "damage_description": "Ground floor completely flooded, furniture damaged",
        "estimated_loss": 500000,
        "evidence": [],
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    await db.claims.insert_one(claim)
    print(f"  ✅ Claim: {claim['claim_id']} - {claim['claimant_name']}")
    
    print("\n✅ Sample data initialization complete!")
    print("\nYou can now:")
    print("  • View disasters at: http://localhost:8000/api/reunify/disasters")
    print("  • View missing persons at: http://localhost:8000/api/reunify/missing-persons")
    print("  • View survivors at: http://localhost:8000/api/reunify/survivors")
    print("  • View claims at: http://localhost:8000/api/claims")
    print("  • API docs at: http://localhost:8000/docs")
    
    client.close()
if __name__ == "__main__":
    asyncio.run(init_sample_data())