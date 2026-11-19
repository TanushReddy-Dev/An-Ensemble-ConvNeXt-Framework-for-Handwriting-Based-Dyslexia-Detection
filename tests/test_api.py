"""Unit and integration tests for the Dyslexia Screening REST API."""

import io
from urllib.parse import unquote

import httpx
import torch
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from src import api, auth, report_generator
from src.screening_engine import DyslexiaScreeningEngine
from synthetic_models import PatchModel


@pytest.fixture
def engine(monkeypatch):
    instance = DyslexiaScreeningEngine.__new__(DyslexiaScreeningEngine)
    instance.device = torch.device("cpu")
    instance.backbone = "convnext_tiny"
    instance.screening_threshold = 0.5
    instance.page_ensemble = [PatchModel(index=i, bias=i / 10) for i in range(5)]
    monkeypatch.setattr(api, "get_engine_instance", lambda backbone: instance)
    return instance


@pytest.fixture
def client(monkeypatch, engine):
    monkeypatch.setitem(api.app.dependency_overrides, auth.require_user, lambda: None)
    with TestClient(api.app) as test_client:
        yield test_client


def synthetic_upload():
    image = io.BytesIO()
    Image.new("RGB", (256, 256), "white").save(image, format="PNG")
    return {"file": ("synthetic.png", image.getvalue(), "image/png")}


def test_root_endpoint(client):
    """Verify root documentation and disclaimer metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "SCREENING" in data["disclaimer"]


def test_health_endpoint(client):
    """Verify healthcheck and compute availability."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "convnext_tiny" in data["supported_backbones"]
    assert "resnet50" in data["supported_backbones"]


def test_screen_endpoint_with_image(client):
    """Verify /api/v1/screen returns expected schema and non-null risk scores."""
    # Create a simple synthetic handwriting test image in-memory
    img = Image.new("RGB", (256, 256), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/api/v1/screen?backbone=convnext_tiny&input_mode=page",
        files={"file": ("test_page.png", buf.getvalue(), "image/png")},
    )
    assert response.status_code == 200
    data = response.json()

    assert "risk_score" in data
    assert 0.0 <= data["risk_score"] <= 1.0
    assert "uncertainty_band" in data
    assert len(data["per_fold_predictions"]) == 5
    assert "SCREENING" in data["disclaimer"]
    assert data["backbone"] == "convnext_tiny"


def test_report_endpoint_returns_pdf(client):
    """Verify /api/v1/report returns a valid downloadable PDF byte stream."""
    img = Image.new("RGB", (256, 256), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/api/v1/report",
        data={
            "student_id": "नमूना-001",
            "examiner_name": "Research & Review <team>",
            "backbone": "convnext_tiny",
            "input_mode": "page",
        },
        files={"file": ("test_page.png", buf.getvalue(), "image/png")},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
    assert len(response.content) > 1000
    header = response.headers["content-disposition"]
    assert 'filename="NeuroWrite-Screening.pdf"' in header
    assert unquote(header.split("filename*=UTF-8''", 1)[1]) == "NeuroWrite-नमूना-001.pdf"


@pytest.mark.parametrize("category,expected", [("Typical", "Normal"), ("Elevated Risk", "Potential dyslexia")])
def test_report_uses_authoritative_category_at_rounded_cutoff(monkeypatch, category, expected):
    paragraphs = []
    original_paragraph = report_generator.Paragraph

    def record_paragraph(text, *args, **kwargs):
        paragraphs.append(text)
        return original_paragraph(text, *args, **kwargs)

    monkeypatch.setattr(report_generator, "Paragraph", record_paragraph)
    pdf = report_generator.generate_screening_pdf(
        {
            "risk_percentage": 50.0,
            "risk_category": category,
            "uncertainty_band": {"low": 0.4, "high": 0.6},
            "input_type": "page",
            "backbone": "convnext_tiny",
            "models_in_ensemble": 5,
        },
        Image.new("RGB", (512, 384), "white"),
    )
    assert pdf.startswith(b"%PDF")
    assert any(text.startswith(f"<b>{expected}</b>") for text in paragraphs)
    assert any("An ensemble overlay was unavailable." in text for text in paragraphs)
    assert all("tremors" not in text and "pen pressure" not in text for text in paragraphs)


@pytest.mark.parametrize("route", ["/api/v1/screen", "/api/v1/report", "/predict", "/api/v1/screen-letters-ig"])
def test_upload_endpoints_require_authentication(route):
    with TestClient(api.app) as client:
        response = client.post(route, files=synthetic_upload())
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("status,expected", [(200, 200), (401, 401), (503, 503)])
def test_screen_auth_uses_supabase_user_verification(monkeypatch, engine, status, expected):
    monkeypatch.setenv("SUPABASE_URL", "https://auth.example.test")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "test-publishable-key")
    original_client = httpx.AsyncClient

    def verify(request):
        assert str(request.url) == "https://auth.example.test/auth/v1/user"
        assert request.headers["Authorization"] == "Bearer test-session"
        assert request.headers["apikey"] == "test-publishable-key"
        return httpx.Response(status, json={"id": "11111111-1111-4111-8111-111111111111"})

    monkeypatch.setattr(
        auth.httpx,
        "AsyncClient",
        lambda **options: original_client(transport=httpx.MockTransport(verify), **options),
    )
    with TestClient(api.app) as client:
        response = client.post("/api/v1/screen", files=synthetic_upload(), headers={"Authorization": "Bearer test-session"})
    assert response.status_code == expected


def test_screen_fails_closed_without_supabase_configuration(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_PUBLISHABLE_KEY", raising=False)
    with TestClient(api.app) as client:
        response = client.post("/api/v1/screen", files=synthetic_upload(), headers={"Authorization": "Bearer test-session"})
    assert response.status_code == 503


def test_screen_fullpage_letters_ig_endpoint(client):
    """Verify /api/v1/screen-letters-ig segments letters and returns full-page IG overlays."""
    import numpy as np
    # Draw simple ink patterns on white background
    img_arr = np.ones((120, 240, 3), dtype=np.uint8) * 255
    # Letter 1
    img_arr[30:70, 30:50] = 0
    # Letter 2
    img_arr[30:70, 80:100] = 0
    # Letter 3
    img_arr[30:70, 130:150] = 0

    img = Image.fromarray(img_arr)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/api/v1/screen-letters-ig?max_crops=10",
        files={"file": ("test_page_letters.png", buf.getvalue(), "image/png")},
    )
    assert response.status_code == 200
    data = response.json()

    assert "total_letters_detected" in data
    assert data["total_letters_detected"] >= 1
    assert "crops" in data
    assert "full_page_ig_overlay_base64" in data
    assert data["full_page_ig_overlay_base64"].startswith("data:image/png;base64,")
    assert "annotated_boxes_base64" in data
    assert "SCREENING" in data["disclaimer"]


def test_neurowrite_predict_endpoint(client):
    """Verify Neurowrite frontend /predict endpoint runs ConvNeXt ensemble + IG & GradCAM."""
    img = Image.new("RGB", (256, 256), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/predict",
        files={"file": ("test_specimen.png", buf.getvalue(), "image/png")},
    )
    assert response.status_code == 200
    data = response.json()

    assert "id" in data
    assert "category" in data
    assert "confidence" in data
    assert "probabilities" in data
    assert "Normal" in data["probabilities"]
    assert "Reversal" in data["probabilities"]
    assert "risk_score" in data
    assert "SCREENING" in data["disclaimer"]


