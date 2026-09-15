from fastapi import Request, HTTPException , status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


from .auth import AuthServices

auth_services = AuthServices()

class AcessTokenBearer(HTTPBearer):
    def __init__(self,auto_error:bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self,request : Request)->HTTPAuthorizationCredentials:
        creds = await super().__call__(request)
        
        token = creds.credentials

        token_data = self.auth_services.decode_token(token)
        
        if not self.token_valid(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )  
        self.verify_token_data(token_data)
        
        return token_data

    def token_valid(self,token: str)->bool:
        """
        Validate the token here using pyjwt
        """    

        return auth_services.validate_token(token)  

    def verify_token_data(self, token_data: dict) -> None:
        if token_data and token_data["refresh"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please provide an access token",
            )