import logging
import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, status, HTTPException

# pyrefly: ignore [missing-import]
from src.constants import CreateUserRequest, CreateUserResponse, LoginUserRequest,LoginUserResponse
# pyrefly: ignore [missing-import]
from src.services import UserServices, AuthServices, verify_password

# Logger
logger = logging.getLogger(__name__)

# Initialize Services
user_services = UserServices()
auth_services = AuthServices()

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

        # generate access token
        access_token = await auth_services.generate_access_token(user_payload, expairy=timedelta(hours=1))
        refresh_token = await auth_services.generate_access_token(user_payload, expairy=timedelta(days=7), refresh_token=True)
        
        return LoginUserResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_info,
            message="Login Successfully"
        )
        

    except HTTPException as e:
        logger.error(f"HTTPException : {e}")
        raise e



        