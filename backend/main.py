from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from redis import Redis
from qdrant_client import QdrantClient
from contextlib import asynccontextmanager
from config import settings
from routers import auth, workflows, users, nodes
import uvicorn
from starlette.middleware.sessions import SessionMiddleware
import logging
from fastapi.responses import JSONResponse
import os
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("workflow_api.log")
    ]
)
logger = logging.getLogger("workflow_api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup operations
    logger.info("Starting Workflow Automation API")
    
    # MongoDB connection
    app.mongodb_client = AsyncIOMotorClient(settings.MONGODB_URL)
    app.mongodb = app.mongodb_client[settings.MONGODB_DB_NAME]
    
    # Redis connection
    app.redis = Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        decode_responses=True
    )
    
    # Qdrant connection
    app.qdrant = QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY
    )
    
    yield
    
    # Shutdown operations
    logger.info("Shutting down Workflow Automation API")
    
    # Cleanup
    app.mongodb_client.close()
    app.redis.close()
    app.qdrant.close()

app = FastAPI(title="FlowMind AI API", lifespan=lifespan)

# Determine if we're using HTTPS (for Secure cookie flag)
is_https = settings.FRONTEND_URL.startswith("https")

# Session middleware must be first
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.OAUTH2_SECRET,
    session_cookie="flowmind_session",
    max_age=1800,  # 30 minutes
    # Use Lax for localhost development
    same_site="lax",  # "none" only works when secure=True
    https_only=is_https  # Set based on HTTPS usage
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add middleware for request logging and timing
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    request_id = str(int(time.time() * 1000))
    logger.info(f"Request {request_id} - {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"Request {request_id} completed in {process_time:.3f}s - Status: {response.status_code}")
        
        # Add timing header to response
        response.headers["X-Process-Time"] = str(process_time)
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request {request_id} failed in {process_time:.3f}s: {str(e)}")
        return JSONResponse(
            status_code=500, 
            content={"detail": "Internal Server Error", "error": str(e)}
        )

# Add error handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)}
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(workflows.router, prefix="/api/workflows", tags=["Workflows"])
app.include_router(nodes.router, prefix="/api/nodes", tags=["Nodes"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Workflow Automation API"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)