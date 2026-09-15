from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime



class CreateNewUserModel(BaseModel):
    __table__="users"

    user_id : str = Field(..., min_length=7, max_length=7)
    name: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    hash_password: str


class AgentSessionModel(BaseModel):
    __table__="session"

    user_id  : str = Field(...,max_length=7)
    session_id: str = Field(...,description="agent session id")
    name     : str = Field(...,description="participant name")
    token    : str = Field(...,description="agent token")
    session_summary : Optional[str] = Field(None,description="summary") 
    conversation : Optional[Dict] = Field(None,description="session conversation")
    created_at : datetime = Field(default_factory=datetime.now())
    updated_at : datetime = Field(default_factory=datetime.now())

    
    
    
    