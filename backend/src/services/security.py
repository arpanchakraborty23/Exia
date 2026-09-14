from fastapi.security import HTTPBearer

class AcessTokenBearer(HTTPBearer):
    def __init__(self,auto_error:bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(Self,request : Request,deco)
    