from pydantic import BaseModel
from typing import Optional, Dict


# livekit Session token
class AgentTokenRequest(BaseModel):
    room_name: Optional[str] = None
    participant_identity: Optional[str] = None
    participant_name: Optional[str] = None
    participant_metadata: Optional[str] = None
    participant_attributes: Optional[Dict[str, str]] = None
    room_config: Optional[dict] = None


class CreateUser(BaseModel):
    user_id : Optional[str] = None
    name: str = None
    email: str = None
    hash_password : str = None

class CreateUserResponse(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None    

class LoginUser(BaseModel):
    user_id: str = None
    password: str = None

class LoginUserResponse(BaseModel):
    access_token: str = None
    refresh_token: str = None
    message: str = None    
    user : dict = None