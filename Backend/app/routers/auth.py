from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import yaml
from app.database.session import get_db
from app.schemas.user import LoginRequest, TokenOut, UserCreate
from app.services.users_service import authenticate_user, create_user
from app.core.security import create_access_token

router = APIRouter()


@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token(subject=str(user.id))
    return TokenOut(access_token=token)

@router.post("/register",
    openapi_extra={
        "requestBody":{
            "content": {"application/x-yaml": {"schema": UserCreate.model_json_schema()}},
            "required": True,
        },
    },
)
async def register(request:Request):
    
    raw_body = await request.body()
    
    try:
        data = yaml.safe_load(raw_body)
    except yaml.YAMLError:
        raise HTTPException(status_code=422, detail="Invalid YAML")
    
    email = data["email"]
    password = data["password"]
    full_name = data["full_name"]
    
    create_user(db=get_db,email=email,password=password,full_name=full_name)
    