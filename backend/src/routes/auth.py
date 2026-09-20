import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, status, HTTPException

# pyrefly: ignore [missing-import]
from src.constants import CreateUserRequest, CreateUserResponse, LoginUserRequest, LoginUserResponse, NewPasswordRequest, NewPasswordResponse
# pyrefly: ignore [missing-import]
from src.services import UserServices, AuthServices, AccessTokenBearer, RefreshTokenBearer
from src.utils import verify_password

# Logger
logger = logging.getLogger(__name__)

# Initialize Services
user_services = UserServices()
auth_services = AuthServices()
access_token_bearer = AccessTokenBearer()
refresh_token_bearer = RefreshTokenBearer()
# Correct names
access_token = access_token_bearer
refresh_token = refresh_token_bearer
# Deprecated typo alias — kept for backward compat with existing imports
acess_token = access_token_bearer

# Router
auth_route = APIRouter(prefix="/api", tags=["Auth"])

@auth_route.post("/signup", response_model=CreateUserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_account(user_data: CreateUserRequest):
    # get user eamil
    user_email = user_data.email

    # check first user exist or not
    user_exists = await user_services.user_exist(user_email)

    if user_exists:
        logger.info("User Already Exist !")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User Already Exist !"
        )

    # check password length
    if not user_data.password or len(user_data.password) < 8:
        logger.info("Password length must be 8 characters !")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password length must be at least 8 characters !"
        )

    new_user = await user_services.create_user(user_data)
    logger.info(f"New User {user_data.name} created !")

    return CreateUserResponse(
        user_id=new_user.get("user_id") if isinstance(new_user, dict) else new_user.user_id,
        name=new_user.get("name") if isinstance(new_user, dict) else new_user.name,
        email=new_user.get("email") if isinstance(new_user, dict) else new_user.email
    )

@auth_route.post("/signin", response_model=LoginUserResponse, status_code=status.HTTP_200_OK)
async def login_user(user_data: LoginUserRequest):
    try:
        email = user_data.email
        password = user_data.password 

        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required!"
            )

        # validate user
        user = await user_services.get_user_by_email(email)
        
        if not user:
            logger.info("User Not Found in database!")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User Not Found in database!"
            )

        # check password is correct or not
        db_hash = user.get("hash_password") if isinstance(user, dict) else getattr(user, "hash_password", None)
        if not db_hash or not verify_password(password, db_hash):
            logger.info("Password Not Matched!")
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

        return LoginUserResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            user=user_info,
            message="Login Successfully"
        )
        

    except HTTPException as e:
        logger.error(f"HTTPException : {e}")
        raise e


@auth_route.post("/refresh_token", status_code=status.HTTP_200_OK)
@auth_route.get("/refresh_token", include_in_schema=False)
async def get_new_access_token(token_data: dict = Depends(refresh_token_bearer)):
    try:
        # RefreshTokenBearer already verifies signature + expiry via jwt.decode.
        # Reject access tokens used as refresh tokens (defense in depth).
        if not isinstance(token_data, dict) or not token_data.get("refresh", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please provide a refresh token",
            )

        token_user = token_data.get("user")
        if not isinstance(token_user, dict):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        token_user_id = token_user.get("user_id")
        token_email = token_user.get("email")
        if not token_user_id or not isinstance(token_user_id, str) or not token_email or not isinstance(token_email, str):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        # Refetch from DB: reject deleted users + rebuild fresh payload
        # instead of trusting (possibly stale) token claims.
        db_user = await user_services.get_user_by_email(token_email)
        if not db_user:
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

        return {"access_token": new_access_token}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refresh token error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


@auth_route.patch("/update_password",response_model=NewPasswordResponse,status_code=status.HTTP_202_ACCEPTED)
async def update_password(user_data: NewPasswordRequest,token_data: dict = Depends(access_token_bearer)):
    try:
        # TokenBearer returns a dict: {"user": {"user_id","name","email"}, ...}
        payload_user = token_data.get("user", {}) if isinstance(token_data, dict) else {}
        user_id = payload_user.get("user_id")
        email = payload_user.get("email")

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        user_exists = await user_services.user_exist(email)

        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid User"
            )

        # new password
        new_password = user_data.new_password

        # validate new password (same rule as signup)
        if not new_password or len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password length must be at least 8 characters !"
            )

        # update password
        updated = await user_services.update_user_password(user_id,email,new_password)

        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail = "Internal Server Error"
            )

        return NewPasswordResponse(
            message="New Password Updated !"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update password error :{e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error"
        )

        