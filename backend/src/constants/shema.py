from pydantic import BaseModel
from typing import Optional, Dict


# Auth

class CreateUserRequest(BaseModel):
    name: str = None
    email: str = None
    password : str = None

class CreateUserResponse(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None  
    message : Optional[str] = None  

class LoginUserRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None


class LoginUserResponse(BaseModel):
    access_token: str = None
    refresh_token: str = None
    message: str = None    
    user : dict = None


class NewPasswordRequest(BaseModel):
    new_password: str = None    

class NewPasswordResponse(BaseModel):
    message : str = None 


# livekit Session token
class AgentTokenRequest(BaseModel):
    room_name: Optional[str] = None


class AgentTokenResponse(BaseModel):
    room_name : Optional[str] = None
    user_id : str = None    
    server_url: str = None
    session_id: str = None
    token : str = None