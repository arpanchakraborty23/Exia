import bcrypt


def genrate_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(password: str, hash: str) -> bool:
    try:
        pwd_bytes = password.encode("utf-8")[:72]
        hash_bytes = hash.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False