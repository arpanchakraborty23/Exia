import logging
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
    if len(user_data.hash_password) < 8:
        logger.info("Password length must be 8 characters !")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password length must be 8 characters !"
        )

    new_user = await user_services.create_user(user_data)
    return CreateUserResponse(
        user_id=new_user.user_id,
        name=new_user.name,
        email=new_user.email
    )

@auth_route.post("/login", response_model=LoginUserResponse, status_code=status.HTTP_200_OK)
async def login_user(user_data: LoginUserRequest):
    try:
        email = user_data.email
        password = user_data.hash_password

        # validate user
        user = await user_services.get_user_by_email(email)
        
        if not user:
            logger.info("User Not Found in database!")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User Not Found in database!"
            )

        # check password is correct or not
        if not verify_password(password, user.hash_password):
            logger.info("Password Not Matched!")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Password Not Matched!"
            )

        # generate access token
        access_token = await auth_services.generate_access_token(user_data, expairy=timedelta(hours=1))
        refresh_token = await auth_services.generate_access_token(user_data, expairy=timedelta(days=7), refresh_token=True)
        
        return LoginUserResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user,
            message="Login Successfully"
        )
        

    except HTTPException as e:
        logger.error(f"HTTPException : {e}")
        raise e



        