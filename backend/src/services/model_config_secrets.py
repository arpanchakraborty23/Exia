from typing import Any

from cryptography.fernet import Fernet, InvalidToken

ENCRYPTED_PREFIX = "enc:v1:"


def _fernet(key: str) -> Fernet:
    if not key:
        raise ValueError(
            "MODEL_CONFIG_ENCRYPTION_KEY must be configured to store provider API keys."
        )
    try:
        return Fernet(key.encode("ascii"))
    except (ValueError, UnicodeEncodeError) as exc:
        raise ValueError(
            "MODEL_CONFIG_ENCRYPTION_KEY must be a valid Fernet key."
        ) from exc


def encrypt_model_secrets(value: Any, key: str) -> Any:
    if isinstance(value, dict):
        return {
            name: _encrypt_secret(name, item, key)
            for name, item in value.items()
        }
    if isinstance(value, list):
        return [encrypt_model_secrets(item, key) for item in value]
    return value


def _encrypt_secret(name: str, value: Any, key: str) -> Any:
    if name == "api_keys" and isinstance(value, dict):
        return {
            provider: _encrypt_secret("api_key", secret, key)
            for provider, secret in value.items()
        }
    if name == "api_key" or name.endswith("_api_key"):
        if not isinstance(value, str) or not value:
            return value
        if value.startswith(ENCRYPTED_PREFIX):
            return value
        return ENCRYPTED_PREFIX + _fernet(key).encrypt(value.encode("utf-8")).decode("ascii")
    return encrypt_model_secrets(value, key)


def decrypt_model_secrets(value: Any, key: str) -> Any:
    if isinstance(value, dict):
        return {
            name: _decrypt_secret(name, item, key)
            for name, item in value.items()
        }
    if isinstance(value, list):
        return [decrypt_model_secrets(item, key) for item in value]
    return value


def _decrypt_secret(name: str, value: Any, key: str) -> Any:
    if name == "api_keys" and isinstance(value, dict):
        return {
            provider: _decrypt_secret("api_key", secret, key)
            for provider, secret in value.items()
        }
    if name == "api_key" or name.endswith("_api_key"):
        if not isinstance(value, str) or not value.startswith(ENCRYPTED_PREFIX):
            return value
        try:
            return _fernet(key).decrypt(value[len(ENCRYPTED_PREFIX):].encode("ascii")).decode("utf-8")
        except InvalidToken as exc:
            raise ValueError(
                "Could not decrypt a model API key; verify MODEL_CONFIG_ENCRYPTION_KEY."
            ) from exc
    return decrypt_model_secrets(value, key)


def redact_model_secrets(value: Any) -> Any:
    if isinstance(value, dict):
        redacted = {}
        for name, item in value.items():
            if name == "api_keys" and isinstance(item, dict):
                redacted["api_keys_configured"] = {
                    provider: bool(secret) for provider, secret in item.items()
                }
                continue
            if name == "api_key" or name.endswith("_api_key"):
                redacted[name] = None
                redacted[f"{name}_configured"] = bool(item)
            else:
                redacted[name] = redact_model_secrets(item)
        return redacted
    if isinstance(value, list):
        return [redact_model_secrets(item) for item in value]
    return value
