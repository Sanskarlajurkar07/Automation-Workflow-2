from fastapi import APIRouter, Depends, HTTPException, status
from models.user import User, UserUpdate
from database import get_user_collection
from .auth import oauth2_scheme
from bson import ObjectId

router = APIRouter()

@router.get("/me", response_model=User)
async def read_users_me(token: str = Depends(oauth2_scheme)):
    user_collection = await get_user_collection()
    user = await user_collection.find_one({"_id": ObjectId(token)})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/me", response_model=User)
async def update_user(
    user_update: UserUpdate,
    token: str = Depends(oauth2_scheme)
):
    user_collection = await get_user_collection()
    user = await user_collection.find_one_and_update(
        {"_id": ObjectId(token)},
        {"$set": user_update.dict(exclude_unset=True)},
        return_document=True
    )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user