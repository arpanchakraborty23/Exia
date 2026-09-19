import logging
import uuid
from datetime import datetime, timezone, timedelta
import jwt



from src.constants import get_settings, CreateNewUserModel, CreateUserResponse
from .db import MongoServices
from src.utils import genrate_password_hash, verify_password


# Configuration
settings = get_settings()
logger = logging.getLogger(__name__)


class UserServices:
    def __init__(self):
        self.db =  MongoServices(
            url=settings.mongodb_uri,
            db=settings.mongodb_database,
            collection=settings.mongodb_user_collection
        )
    async def get_user_by_email(self,email: str) -> dict:
        """
        Fetch a user by their name from the database.
        Return: Database Schema
        """
        email =email.lower()
        try:
            return self.db.find_one({"email": email})
        
        except Exception as e:
            logger.error(e)
            return None

    async def user_exist(self,email)-> bool:
        """validate User Data"""

        user_data = await self.get_user_by_email(email)
        if not user_data:
            logger.info("User Not found in the database.")
            return False
        
        logger.info("User Exist in database!")

        return True

    async def create_user(self,user_data: CreateNewUserModel) -> CreateUserResponse:
        """
        New  User creation.
        Return: New user data
        """
        try:
            # user data to dict
            new_user_data= user_data.model_dump()

            # User id
            user_id = str(uuid.uuid4())[:7]

            # user password hash
            hash_password = genrate_password_hash(new_user_data['password'])


            # new user
            new_user = CreateNewUserModel(
                user_id=user_id,
                name=new_user_data['name'], 
                email=new_user_data['email'],
                hash_password=hash_password
            )

            # Insert Data to database (connect/disconnect handled inside)
            self.db.insert_one(new_user.model_dump())

            logger.info("New User created")

            return new_user.model_dump()


        except Exception as e:
            logger.error(e)
            raise e

    async def update_user_password(self,user_id,email:str,new_password:str) -> bool:
        try:
            filter_criteria = {
                "user_id": user_id,
                "email" : email
                }

            updated_password = {
                "$set" :{
                    "hash_password": genrate_password_hash(new_password)
                }
            }

            self.db.update_one(filter_criteria, updated_password)
            logger.info(f"User {user_id} password updated")

            return True

        except Exception as e:
            logger.error(e)
            raise e
    








class AuthServices:
    def __init__(self):
        self.jwt_secret = settings.jwt_secret
        self.jwt_algorithm = settings.jwt_algorithm
    
    async def generate_access_token(self,user_data: dict, expiry: timedelta | None = None, refresh_token: bool = False, expairy: timedelta | None = None) -> str:
        """
        Generate access token.
        Return: Access Token
        """
        try:
            # Backward compat: old callers used misspelled `expairy` kwarg.
            effective_expiry = expiry if expiry is not None else expairy
            payload = {
                "user": user_data,
                "exp": datetime.now(timezone.utc) + (effective_expiry if effective_expiry else timedelta(hours=1)),
                "jti": str(uuid.uuid4()),
                "refresh": refresh_token
            }
            
            access_token = jwt.encode(
                payload,
                key=self.jwt_secret,
                algorithm=self.jwt_algorithm
            )
            return access_token

        except jwt.PyJWTError as e:
            logger.error(e)
            raise e
    
    def decode_token(self,token:str) -> dict:
        """
        Decode access token.
        Return: Access Token Payload
        """
        try:
            token_data = jwt.decode(
                token,
                key=self.jwt_secret,
                algorithms=[self.jwt_algorithm]
            )
            return token_data
        except jwt.PyJWTError as e:
            logger.error(e)
            raise e

    def validate_token(self, token: str) -> bool:
        """
        Validate access token.
        Return: bool
        """
        try:
            jwt.decode(
                token,
                key=self.jwt_secret,
                algorithms=[self.jwt_algorithm]
            )
            return True
        except jwt.PyJWTError:
            return False