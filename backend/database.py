from motor.motor_asyncio import AsyncIOMotorCollection
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager

async def get_user_collection(request: Request):
    return request.app.mongodb["users"]

async def get_workflow_collection(request: Request):
    return request.app.mongodb["workflows"]