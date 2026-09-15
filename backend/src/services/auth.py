import logging
from uuid import UUID
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext


from src.constants import CreateNewUserModel, CreateUserResponse
from src.db import MongoServices
from src.constants import get_settings


# Configuration
settings = get_settings()
logger = logging.getLogger(__name__)
password_context = CryptContext(schemes=["bcrypt"])



def genrate_password_hash(password:str):
    hash = password_context.hash(password)
    return hash

def verify_password(password: str, hash: str) -> bool:
    return password_context.verify(password, hash)

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
            collection = self.db.connect()
            user_data = collection.find_one({"email": email})

            return user_data 
        
        except Exception as e:
            logger.error(e)
        
        finally:
            self.db.disconnect()

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
            user_id = str(UUID.uuid4())[:7]

            # user password hash
            hash_password = genrate_password_hash(new_user_data['hash_password'])


            # new user
            new_user = CreateNewUserModel(
                user_id=user_id,
                name=new_user_data['name'], 
                email=new_user_data['email'],
                hash_password=hash_password
            )

            # Insert Data to database
            collection = self.db.connect()
            collection.insert_one(new_user.model_dump())

            logger.info("New User created")

            return new_user.model_dump()


        except Exception as e:
            logger.error(e)
            raise e

        finally:
            self.db.disconnect()

    
class AuthServices:
    def __init__(self):
        self.jwt_secret = settings.jwt_secret
        self.jwt_algorithm = settings.jwt_algorithm
    
    async def generate_access_token(self,user_data: dict, expairy: timedelta = None, refresh_token: bool = False) -> str:
        """
        Generate access token.
        Return: Access Token
        """
        try:
            payload = {
                "user": user_data,
                "exp": datetime.now() + (expairy if expairy is not None else timedelta(hours=1)),
                "jit": str(UUID.uuid4()),
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
    
    async def decode_token(self,token:str) -> dict:
        """
        Decode access token.
        Return: Access Token Payload
        """
        try:
            token = jwt.decode(
                token,
                key=self.jwt_secret,
                algorithms=[self.jwt_algorithm]
            )
            return token
        except jwt.PyJWTError as e:
            logger.error(e)
            raise e