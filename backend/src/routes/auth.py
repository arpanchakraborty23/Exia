import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, status, HTTPException

# pyrefly: ignore [missing-import]
from src.constants import (
    CreateUserRequest,
    CreateUserResponse,
    LoginUserRequest,
    LoginUserResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    LogoutRequest,
    LogoutResponse,
)
# pyrefly: ignore [missing-import]
from src.services import UserServices, AuthServices, AccessTokenBearer, RefreshTokenBearer, TokenBlacklistServices
from src.services.security import TokenBearer
from src.utils import verify_password

# Logger
logger = logging.getLogger(__name__)

# Initialize Services
user_services = UserServices()
auth_services = AuthServices()
access_token_bearer = AccessTokenBearer()
refresh_token_bearer = RefreshTokenBearer()
# Accepts any valid (access or refresh) token so logout can revoke the session
any_token_bearer = TokenBearer()
# Accepts any token if present; if missing/invalid/expired, returns None so logout is idempotent
optional_token_bearer = TokenBearer(auto_error=False)
blacklist_services = TokenBlacklistServices()
# Correct names
access_token = access_token_bearer
refresh_token = refresh_token_bearer
# Deprecated typo alias — kept for backward compat with existing imports
acess_token = access_token_bearer

# Router
auth_route = APIRouter(prefix="/api", tags=["Auth"])

@auth_route.post("/auth/create-account", response_model=CreateUserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_account(user_data: CreateUserRequest):
    user_email = user_data.email
    logger.info("[POST /api/auth/create-account] Account registration attempt for email=%s, name=%s", user_email, user_data.name)

    # check first user exist or not
    user_exists = await user_services.user_exist(user_email)

    if user_exists:
        logger.warning("[POST /api/auth/create-account] Rejected: User with email=%s already exists", user_email)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User Already Exist !"
        )

    # check password length
    if not user_data.password or len(user_data.password) < 8:
        logger.warning("[POST /api/auth/create-account] Rejected: Password length < 8 for email=%s", user_email)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password length must be at least 8 characters !"
        )

    new_user = await user_services.create_user(user_data)
    user_id = new_user.get("user_id") if isinstance(new_user, dict) else getattr(new_user, "user_id", "")
    name = new_user.get("name") if isinstance(new_user, dict) else getattr(new_user, "name", "")
    email = new_user.get("email") if isinstance(new_user, dict) else getattr(new_user, "email", "")
    logger.info("[POST /api/auth/create-account] New user account created: user_id=%s, email=%s", user_id, email)

    user_payload = {"user_id": user_id, "name": name, "email": email}
    access_token_jwt = await auth_services.generate_access_token(user_payload, expiry=timedelta(hours=1))
    refresh_token_jwt = await auth_services.generate_access_token(user_payload, expiry=timedelta(days=7), refresh_token=True)
    return CreateUserResponse(
        user_id=new_user.get("user_id") if isinstance(new_user, dict) else new_user.user_id,
        name=new_user.get("name") if isinstance(new_user, dict) else new_user.name,
        email=email,
        access_token=access_token_jwt,
        refresh_token=refresh_token_jwt,
        message="Account created successfully"
    )

@auth_route.post("/signin", response_model=LoginUserResponse, status_code=status.HTTP_200_OK)
@auth_route.post("/auth/login", response_model=LoginUserResponse, status_code=status.HTTP_200_OK)
async def login_user(user_data: LoginUserRequest):
    try:
        email = user_data.email
        password = user_data.password 
        logger.info("[POST /api/auth/login] Authentication attempt for email=%s", email)

        if not email or not password:
            logger.warning("[POST /api/auth/login] Missing email or password in request")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required!"
            )

        # validate user
        user = await user_services.get_user_by_email(email)
        
        if not user:
            logger.warning("[POST /api/auth/login] User email=%s not found in database", email)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User Not Found in database!"
            )

        # check password is correct or not
        db_hash = user.get("hash_password") if isinstance(user, dict) else getattr(user, "hash_password", None)
        if not db_hash or not verify_password(password, db_hash):
            logger.warning("[POST /api/auth/login] Password verification failed for email=%s", email)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Password Not Matched!"
            )

        # sanitize user for response and token payload
        user_info = dict(user) if isinstance(user, dict) else user.model_dump()
        if "_id" in user_info:
            user_info["_id"] = str(user_info["_id"])
        user_info.pop("hash_password", None)

        user_payload = {
            "user_id": user_info.get("user_id"),
            "name": user_info.get("name"),
            "email": user_info.get("email")
        }

        # generate access + refresh tokens
        access_token = await auth_services.generate_access_token(user_payload, expiry=timedelta(hours=1))
        new_refresh_token = await auth_services.generate_access_token(user_payload, expiry=timedelta(days=7), refresh_token=True)
        logger.info("[POST /api/auth/login] Authentication successful for user_id=%s, email=%s", user_payload.get("user_id"), email)

        return LoginUserResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            user=user_info,
            message="Login Successfully"
        )
        

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[POST /api/auth/login] Unexpected login error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@auth_route.post("/refresh_token", status_code=status.HTTP_200_OK)
async def get_new_access_token(token_data: dict = Depends(refresh_token_bearer)):
    try:
        # RefreshTokenBearer already verifies signature + expiry via jwt.decode.
        # Reject access tokens used as refresh tokens (defense in depth).
        if not isinstance(token_data, dict) or not token_data.get("refresh", False):
            logger.warning("[POST /api/refresh_token] Access token supplied instead of refresh token")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please provide a refresh token",
            )

        token_user = token_data.get("user")
        if not isinstance(token_user, dict):
            logger.warning("[POST /api/refresh_token] Invalid token payload: 'user' field missing")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        token_user_id = token_user.get("user_id")
        token_email = token_user.get("email")
        if not token_user_id or not isinstance(token_user_id, str) or not token_email or not isinstance(token_email, str):
            logger.warning("[POST /api/refresh_token] Invalid token payload: missing user_id or email")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        logger.info("[POST /api/refresh_token] Processing token refresh for user_id=%s, email=%s", token_user_id, token_email)

        # Refetch from DB: reject deleted users + rebuild fresh payload
        # instead of trusting (possibly stale) token claims.
        db_user = await user_services.get_user_by_email(token_email)
        if not db_user:
            logger.warning("[POST /api/refresh_token] User email=%s no longer exists in database", token_email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user",
            )

        if isinstance(db_user, dict):
            fresh_user_id = db_user.get("user_id")
            fresh_name = db_user.get("name")
            fresh_email = db_user.get("email")
        else:
            fresh_user_id = getattr(db_user, "user_id", None)
            fresh_name = getattr(db_user, "name", None)
            fresh_email = getattr(db_user, "email", None)

        if not fresh_user_id or not fresh_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user",
            )

        user_payload = {
            "user_id": fresh_user_id,
            "name": fresh_name,
            "email": fresh_email,
        }

        new_access_token = await auth_services.generate_access_token(
            user_payload, expiry=timedelta(hours=1)
        )
        logger.info("[POST /api/refresh_token] Successfully generated new access token for user_id=%s", fresh_user_id)

        return {"access_token": new_access_token}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[POST /api/refresh_token] Refresh token error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


@auth_route.post("/auth/change-password", response_model=ChangePasswordResponse, status_code=status.HTTP_200_OK)
async def change_password(user_data: ChangePasswordRequest, token_data: dict = Depends(access_token_bearer)):
    """Settings-view compat: verify current password, then update (frontend POSTs here)."""
    try:
        payload_user = token_data.get("user", {}) if isinstance(token_data, dict) else {}
        user_id = payload_user.get("user_id")
        email = payload_user.get("email")
        logger.info("[POST /api/auth/change-password] Password change requested for user_id=%s, email=%s", user_id, email)

        if not user_id or not email:
            logger.warning("[POST /api/auth/change-password] Missing user_id or email in token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        if not user_data.current_password or not user_data.new_password:
            logger.warning("[POST /api/auth/change-password] Missing current or new password")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password and new password are required"
            )

        if len(user_data.new_password) < 8:
            logger.warning("[POST /api/auth/change-password] New password length < 8")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password length must be at least 8 characters !"
            )

        db_user = await user_services.get_user_by_email(email)
        if not db_user:
            logger.warning("[POST /api/auth/change-password] User not found: email=%s", email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid User"
            )

        db_hash = db_user.get("hash_password") if isinstance(db_user, dict) else getattr(db_user, "hash_password", None)
        if not db_hash or not verify_password(user_data.current_password, db_hash):
            logger.warning("[POST /api/auth/change-password] Incorrect current password for email=%s", email)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Current password is incorrect"
            )

        updated = await user_services.update_user_password(user_id, email, user_data.new_password)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal Server Error"
            )

        logger.info("[POST /api/auth/change-password] Password successfully updated for user_id=%s", user_id)
        return ChangePasswordResponse(message="Password successfully updated")

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[POST /api/auth/change-password] Password update error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )


@auth_route.post("/auth/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
async def logout(body: LogoutRequest | None = None, token_data: dict | None = Depends(optional_token_bearer)):
    """Revoke the bearer token (and optional refresh token) so it can't be reused.

    Idempotent: If the token is already expired, invalid, revoked, or missing,
    the logout request still succeeds with HTTP 200 so the client's local session can cleanly terminate.
    """
    try:
        user_id = "anonymous"
        jti = None
        if isinstance(token_data, dict):
            jti = token_data.get("jti")
            exp = token_data.get("exp")
            token_user = token_data.get("user") or {}
            user_id = token_user.get("user_id", "unknown")
            if jti:
                try:
                    blacklist_services.revoke(jti, exp)
                    logger.info("[POST /api/auth/logout] Revoked access/bearer token (jti=%s, user_id=%s)", jti, user_id)
                except Exception as revoke_err:
                    logger.warning("[POST /api/auth/logout] Failed to revoke bearer token jti=%s: %s", jti, revoke_err)
        else:
            logger.info("[POST /api/auth/logout] Token invalid, expired, or missing; proceeding with idempotent logout")

        # Optionally revoke the refresh token too (closes the refresh hole)
        refresh_token = (body.refresh_token if body else None)
        if refresh_token:
            try:
                refresh_data = auth_services.decode_token(refresh_token)
                if isinstance(refresh_data, dict) and refresh_data.get("jti"):
                    blacklist_services.revoke(refresh_data.get("jti"), refresh_data.get("exp"))
                    logger.info("[POST /api/auth/logout] Associated refresh token revoked (jti=%s)", refresh_data.get("jti"))
            except Exception as decode_err:
                logger.warning("[POST /api/auth/logout] Refresh token decode failed during logout: %s", decode_err)

        logger.info("[POST /api/auth/logout] Session successfully logged out (user_id=%s, jti=%s)", user_id, jti)
        return LogoutResponse(message="Logged out successfully")

    except Exception as e:
        logger.exception("[POST /api/auth/logout] Logout error: %s", e)
        # Even on unexpected error during logout, client wants session terminated
        return LogoutResponse(message="Logged out successfully")

        