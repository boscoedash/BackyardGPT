import base64
import json
import os
import time
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

import azure.functions as func
from azure.core.exceptions import AzureError, ResourceExistsError
from azure.storage.blob import (
    BlobServiceClient,
    ContentSettings,
    PublicAccess,
)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
CONTAINER_NAME = "yard-images"
MAX_RETRIES = 3
BACKOFF_BASE_SECONDS = 1.0
DEFAULT_EXTENSION = ".jpg"


class PayloadTooLargeError(Exception):
    """Raised when the decoded payload exceeds the allowed size."""


class ValidationError(Exception):
    """Raised when the request payload fails validation."""


def main(req: func.HttpRequest, context: func.Context) -> func.HttpResponse:
    logger = context.logger if context else None

    try:
        payload = _parse_request(req)
        image_bytes = _decode_image(payload["imageData"])
        _enforce_size_limit(image_bytes)

        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if not connection_string:
            raise ValidationError("Missing AZURE_STORAGE_CONNECTION_STRING configuration.")

        blob_name = _resolve_blob_name(
            provided_name=payload.get("fileName"),
            user_id=payload["userId"],
        )

        blob_client = _get_blob_client(connection_string, blob_name, logger)
        _upload_with_retry(blob_client, image_bytes, payload["userId"], logger)

        response_body = {
            "imageUrl": blob_client.url,
            "imageId": blob_client.blob_name,
            "uploadedAt": datetime.now(timezone.utc).isoformat(),
        }

        if logger:
            logger.info(
                "Image uploaded",
                extra={
                    "blobName": blob_client.blob_name,
                    "userId": payload["userId"],
                    "contentLength": len(image_bytes),
                },
            )

        return func.HttpResponse(
            status_code=200,
            mimetype="application/json",
            body=json.dumps(response_body),
        )

    except ValidationError as exc:
        if logger:
            logger.warning("Validation failed: %s", exc)
        return func.HttpResponse(str(exc), status_code=400)
    except PayloadTooLargeError as exc:
        if logger:
            logger.warning("Payload too large: %s", exc)
        return func.HttpResponse(str(exc), status_code=413)
    except AzureError as exc:
        if logger:
            logger.error("Azure SDK error: %s", exc, exc_info=True)
        return func.HttpResponse("Upload failed.", status_code=500)
    except Exception as exc:  # pylint: disable=broad-except
        if logger:
            logger.error("Unexpected error: %s", exc, exc_info=True)
        return func.HttpResponse("Upload failed.", status_code=500)


def _parse_request(req: func.HttpRequest) -> dict:
    try:
        payload = req.get_json()
    except ValueError as exc:
        raise ValidationError("Request body must be valid JSON.") from exc

    image_data = payload.get("imageData")
    user_id = payload.get("userId")

    if not image_data or not isinstance(image_data, str):
        raise ValidationError("Field 'imageData' is required and must be a base64 string.")
    if not user_id or not isinstance(user_id, str):
        raise ValidationError("Field 'userId' is required and must be a string.")

    return payload


def _decode_image(image_data: str) -> bytes:
    normalized = image_data.strip()
    if normalized.startswith("data:") and "," in normalized:
        normalized = normalized.split(",", maxsplit=1)[1]

    try:
        return base64.b64decode(normalized, validate=True)
    except (base64.binascii.Error, ValueError) as exc:
        raise ValidationError("Invalid base64 image data.") from exc


def _enforce_size_limit(image_bytes: bytes) -> None:
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise PayloadTooLargeError("Image exceeds 10MB limit.")


def _resolve_blob_name(provided_name: Optional[str], user_id: str) -> str:
    if provided_name:
        cleaned = provided_name.strip()
        if cleaned:
            return cleaned

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    generated_name = f"{user_id}_{timestamp}_{uuid4().hex}{DEFAULT_EXTENSION}"
    return generated_name


def _get_blob_client(connection_string: str, blob_name: str, logger) -> any:
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service_client.get_container_client(CONTAINER_NAME)

    try:
        container_client.create_container(public_access=PublicAccess.Blob)
        if logger:
            logger.info("Created container %s with public access.", CONTAINER_NAME)
    except ResourceExistsError:
        # Ensure public access in case it was created without it previously.
        container_client.set_container_access_policy(public_access=PublicAccess.Blob)

    return container_client.get_blob_client(blob_name)


def _upload_with_retry(blob_client, data: bytes, user_id: str, logger) -> None:
    metadata = {"userId": user_id}
    content_settings = ContentSettings(content_type=_guess_content_type(blob_client.blob_name))

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            blob_client.upload_blob(
                data,
                overwrite=True,
                metadata=metadata,
                content_settings=content_settings,
            )
            return
        except AzureError as exc:
            if attempt == MAX_RETRIES:
                raise
            delay = BACKOFF_BASE_SECONDS * (2 ** (attempt - 1))
            if logger:
                logger.warning(
                    "Upload attempt %s failed (%s). Retrying in %.1fs",
                    attempt,
                    exc,
                    delay,
                )
            time.sleep(delay)


def _guess_content_type(blob_name: str) -> str:
    lowered = blob_name.lower()
    if lowered.endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    if lowered.endswith(".png"):
        return "image/png"
    if lowered.endswith(".webp"):
        return "image/webp"
    if lowered.endswith(".gif"):
        return "image/gif"
    return "application/octet-stream"
