from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from models.user import UserCreate, UserInDB, User
from config import settings
from typing import Optional
from database import get_user_collection
from starlette.responses import RedirectResponse, JSONResponse
from authlib.integrations.starlette_client import OAuth
import secrets
import urllib.parse
import logging

# Add a logger at the top of the file
logger = logging.getLogger("workflow_api")

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
oauth = OAuth()

# Configure Google OAuth2
logger.info(f"Configuring Google OAuth with client_id: {settings.GOOGLE_CLIENT_ID[:8]}...")
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    authorize_params=None,
    access_token_url="https://accounts.google.com/o/oauth2/token",
    access_token_params=None,
    refresh_token_url="https://accounts.google.com/o/oauth2/token",
    jwks_uri="https://www.googleapis.com/oauth2/v3/certs",
    userinfo_endpoint="https://openidconnect.googleapis.com/v1/userinfo",
    client_kwargs={
        'scope': 'openid email profile',
        'token_endpoint_auth_method': 'client_secret_post'
    }
)
logger.info("Google OAuth client registration complete")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user_collection = await get_user_collection(request)
    user = await user_collection.find_one({"email": email})
    
    if user is None:
        raise credentials_exception

    return User(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name", ""),
        picture=user.get("picture", "")
    )

@router.post("/token")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    user_collection = await get_user_collection(request)
    user = await user_collection.find_one({"email": form_data.username})

    # Check if user exists and has a hashed_password
    if not user or "hashed_password" not in user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password, or account uses OAuth login.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=User)
async def register(request: Request, user: UserCreate):
    user_collection = await get_user_collection(request)
    
    # Check if user exists
    if await user_collection.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    
    result = await user_collection.insert_one(user_in_db.dict())
    
    return User(
        id=str(result.inserted_id),
        email=user.email,
        full_name=user.full_name
    )

@router.get("/google/login")
async def google_login(request: Request):
    # Generate and store state parameter
    state = secrets.token_urlsafe(16)
    request.session['oauth_state'] = state
    
    # Build redirect URI dynamically
    redirect_uri = str(request.base_url.replace(path='/api/auth/google/auth'))
    logger.info(f"Google OAuth login initiated - redirect_uri: {redirect_uri}")
    
    try:
        return await oauth.google.authorize_redirect(
            request,
            redirect_uri,
            state=state
        )
    except Exception as e:
        logger.error(f"Google OAuth authorize_redirect error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize Google OAuth: {str(e)}"
        )

@router.get("/google/auth")
async def google_auth(request: Request):
    try:
        # Verify state parameter
        state = request.query_params.get('state')
        stored_state = request.session.pop('oauth_state', None)
        
        logger.info(f"Google OAuth callback received - state valid: {state == stored_state}")
        
        if not state or state != stored_state:
            logger.error(f"Invalid state parameter - received: {state}, stored: {stored_state}")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/auth/callback?error=Invalid+state+parameter",
                status_code=302
            )
        
        # Get OAuth2 token
        logger.info("Attempting to get OAuth access token")
        try:
            token = await oauth.google.authorize_access_token(request)
            if not token:
                logger.error("Failed to get access token from Google")
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/auth/callback?error=Failed+to+get+access+token",
                    status_code=302
                )
            logger.info("Successfully obtained access token")
            logger.debug(f"Token keys: {token.keys()}")
        except Exception as e:
            logger.error(f"Error getting access token: {str(e)}", exc_info=True)
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/auth/callback?error=Token+error:+{str(e)}",
                status_code=302
            )

        # Get user info from Google
        try:
            # First attempt to parse id_token
            logger.info("Attempting to parse ID token")
            user_info = None
            try:
                if 'id_token' in token:
                    user_info = await oauth.google.parse_id_token(request, token)
                    logger.info("Successfully parsed ID token")
            except Exception as e:
                logger.error(f"Error parsing ID token: {str(e)}", exc_info=True)
            
            # If parse_id_token fails, try to get user info directly
            if not user_info:
                logger.info("Falling back to userinfo endpoint")
                try:
                    user_info = await oauth.google.userinfo(token=token)
                    logger.info("Successfully retrieved user info from userinfo endpoint")
                except Exception as e:
                    logger.error(f"Error from userinfo endpoint: {str(e)}", exc_info=True)
                    return RedirectResponse(
                        url=f"{settings.FRONTEND_URL}/auth/callback?error=Userinfo+error:+{str(e)}",
                        status_code=302
                    )
            
            if not user_info:
                logger.error("Failed to get user info via both methods")
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/auth/callback?error=Failed+to+get+user+info+via+all+methods",
                    status_code=302
                )
            
            logger.info(f"User info retrieved successfully for: {user_info.get('email', 'unknown')}")
        except Exception as e:
            logger.error(f"User info error: {str(e)}", exc_info=True)
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/auth/callback?error=User+info+error:+{str(e)}",
                status_code=302
            )

        # Find or create user in database
        user_collection = await get_user_collection(request)
        user = await user_collection.find_one({"email": user_info['email']})
        
        is_new_user = False
        if not user:
            # Create new user
            user_data = {
                "email": user_info['email'],
                "full_name": user_info.get('name', ''),
                "oauth_provider": "google",
                "oauth_id": user_info['sub'],
                "picture": user_info.get('picture', ''),
                "created_at": datetime.utcnow()
            }
            result = await user_collection.insert_one(user_data)
            user_id = str(result.inserted_id)
            is_new_user = True
        else:
            # Update existing user's OAuth info
            await user_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "oauth_provider": "google",
                    "oauth_id": user_info['sub'],
                    "picture": user_info.get('picture', ''),
                    "last_login": datetime.utcnow()
                }}
            )
            user_id = str(user['_id'])

        # Create JWT token
        access_token = create_access_token(
            data={
                "sub": user_info['email'],
                "name": user_info.get('name', ''),
                "picture": user_info.get('picture', ''),
                "oauth_provider": "google",
                "oauth_id": user_info['sub']
            },
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        # Redirect to frontend with token and new user status
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={access_token}"
        if is_new_user:
            redirect_url += "&new_user=true"
            
        return RedirectResponse(url=redirect_url, status_code=302)

    except Exception as e:
        error_message = str(e)
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?error={error_message}",
            status_code=302
        )

@router.get("/google/manual-complete")
async def manual_complete_google_auth(request: Request, code: str, state: Optional[str] = None):
    """
    Manually completes the OAuth flow when the frontend receives a code but not a token.
    This endpoint is called directly from the frontend when the normal flow fails.
    """
    try:
        # Set up the token request
        token_request = {
            'code': code,
            'redirect_uri': str(request.base_url.replace(path='/api/auth/google/auth')),
        }
        
        # Get token from Google
        try:
            token = await oauth.google.fetch_access_token(**token_request)
            if not token or 'access_token' not in token:
                logger.error("Failed to get access token from Google in manual completion")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get access token from Google"
                )
            logger.info("Successfully obtained access token in manual completion")
            logger.debug(f"Token keys: {token.keys()}")
        except Exception as e:
            logger.error(f"Error getting access token in manual completion: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Token error: {str(e)}"
            )
            
        # Get user info
        try:
            user_info = None
            # First attempt to parse id_token
            logger.info("Attempting to parse ID token in manual completion")
            try:
                if 'id_token' in token:
                    user_info = await oauth.google.parse_id_token(request, token)
                    logger.info("Successfully parsed ID token in manual completion")
            except Exception as e:
                logger.error(f"Error parsing ID token in manual completion: {str(e)}", exc_info=True)
            
            # If parse_id_token fails, try to get user info directly
            if not user_info:
                logger.info("Falling back to userinfo endpoint in manual completion")
                try:
                    user_info = await oauth.google.userinfo(token=token)
                    logger.info("Successfully retrieved user info from userinfo endpoint in manual completion")
                except Exception as e:
                    logger.error(f"Error from userinfo endpoint in manual completion: {str(e)}", exc_info=True)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Userinfo error: {str(e)}"
                    )
            
            if not user_info:
                logger.error("Failed to get user info via both methods in manual completion")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info via all methods"
                )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.error(f"User info error in manual completion: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User info error: {str(e)}"
            )

        # Find or create user in database
        user_collection = await get_user_collection(request)
        user = await user_collection.find_one({"email": user_info['email']})
        
        is_new_user = False
        if not user:
            # Create new user
            user_data = {
                "email": user_info['email'],
                "full_name": user_info.get('name', ''),
                "oauth_provider": "google",
                "oauth_id": user_info['sub'],
                "picture": user_info.get('picture', ''),
                "created_at": datetime.utcnow()
            }
            result = await user_collection.insert_one(user_data)
            user_id = str(result.inserted_id)
            is_new_user = True
        else:
            # Update existing user's OAuth info
            await user_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "oauth_provider": "google",
                    "oauth_id": user_info['sub'],
                    "picture": user_info.get('picture', ''),
                    "last_login": datetime.utcnow()
                }}
            )
            user_id = str(user['_id'])
        
        # Create JWT token
        access_token = create_access_token(
            data={
                "sub": user_info['email'],
                "name": user_info.get('name', ''),
                "picture": user_info.get('picture', ''),
                "oauth_provider": "google",
                "oauth_id": user_info['sub'],
                "is_new_user": is_new_user
            },
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        # Return the token directly as JSON
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error completing authentication: {str(e)}"
        )

@router.get("/validate")
async def validate_token(current_user: User = Depends(get_current_user)):
    """Endpoint to validate the current token"""
    return {"status": "valid", "user": current_user}