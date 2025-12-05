import os
import json
import base64
import uuid
import time
from datetime import datetime

import azure.functions as func
from azure.storage.blob import BlobServiceClient

CONTAINER_NAME = "yard-images"
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024


def _strip_data_url_prefix(image_b64: str) -> str:
    if "," in image_b64:
        return image_b64.split(",", 1)[1]
    return image_b64


def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse(json.dumps({"error": "Invalid JSON body"}), status_code=400, mimetype="application/json")

    image_b64 = body.get("imageBase64")
    user_id = body.get("userId")
    file_name = body.get("fileName")

    if not image_b64 or not user_id:
        return func.HttpResponse(json.dumps({"error": "Missing required fields: imageBase64, userId"}), status_code=400, mimetype="application/json")

    image_b64 = _strip_data_url_prefix(image_b64)

    try:
        blob_bytes = base64.b64decode(image_b64, validate=True)
    except Exception:
        return func.HttpResponse(json.dumps({"error": "Invalid base64 image"}), status_code=400, mimetype="application/json")

    size_bytes = len(blob_bytes)
    if size_bytes > MAX_IMAGE_SIZE_BYTES:
        return func.HttpResponse(json.dumps({"error": "Image too large (max 10MB)"}), status_code=413, mimetype="application/json")

    ts = int(time.time() * 1000)
    unique = str(uuid.uuid4())
    safe_name = file_name if file_name else f"{user_id}_{ts}_{unique}.jpg"

    conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    if not conn:
        return func.HttpResponse(json.dumps({"error": "Storage not configured"}), status_code=500, mimetype="application/json")

    try:
        svc = BlobServiceClient.from_connection_string(conn)
        container = svc.get_container_client(CONTAINER_NAME)
        try:
            container.create_container(public_access="blob")
        except Exception:
            pass

        blob_client = container.get_blob_client(safe_name)
        blob_client.upload_blob(blob_bytes, overwrite=True, content_type="image/jpeg")

        image_url = blob_client.url
        resp = {
            "imageUrl": image_url,
            "imageId": safe_name.replace(".jpg", ""),
            "uploadedAt": datetime.utcnow().isoformat() + "Z",
            "sizeBytes": size_bytes,
            "sizeMB": round(size_bytes / (1024 * 1024), 3),
        }
        return func.HttpResponse(json.dumps(resp), status_code=200, mimetype="application/json")
    except Exception as e:
        return func.HttpResponse(json.dumps({"error": "Upload failed", "message": str(e)}), status_code=500, mimetype="application/json")
