"""Check the location of a Grad-CAM hotspot without training checkpoints."""

import base64
import io

import numpy as np
import pytest
import torch
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from src import config
from src.auth import require_user
from src.screening_engine import DyslexiaScreeningEngine
from synthetic_models import PatchModel


@pytest.fixture
def engine():
    result = DyslexiaScreeningEngine.__new__(DyslexiaScreeningEngine)
    result.device = torch.device("cpu")
    result.page_ensemble = [PatchModel()]
    result.screening_threshold = 0.5
    result.backbone = "convnext_tiny"
    return result


@pytest.mark.parametrize("image_height", [512, 384])
def test_gradcam_locates_last_patch_after_unpadding(image_height, engine):
    height, width = config.PAGE_SIZE
    page = torch.ones((1, height, width))
    original = Image.new("RGB", (width, image_height), "white")
    overlay = np.asarray(engine._compute_gradcam(original, page), dtype=float)
    intensity = (255 - overlay).sum(axis=2)
    y, x = np.indices(intensity.shape)
    centroid = [(axis * intensity).sum() / intensity.sum() for axis in (x, y)]

    patch_center = (config.PATCH_SIZE - 1) / 2
    last_left = ((width - config.PATCH_SIZE) // config.PATCH_STRIDE) * config.PATCH_STRIDE
    last_top = ((height - config.PATCH_SIZE) // config.PATCH_STRIDE) * config.PATCH_STRIDE
    padding_top = (height - image_height) // 2
    np.testing.assert_allclose(
        centroid, [last_left + patch_center, last_top + patch_center - padding_top], atol=2
    )
    hotspot = overlay[round(centroid[1]), round(centroid[0])]
    assert hotspot[0] < hotspot[1] < hotspot[2]
    assert hotspot[0] > 150


@pytest.mark.parametrize("activation", [0.0, 1e-5])
def test_gradcam_leaves_blank_or_negligible_maps_uncolored(activation, engine):
    height, width = config.PAGE_SIZE
    page = torch.full((1, height, width), activation)
    original = Image.new("RGB", (width, height), "white")
    overlay = engine._compute_gradcam(original, page)

    np.testing.assert_array_equal(overlay, original)


def test_gradcam_combines_folds_and_preserves_hotspot_locations(engine):
    engine.page_ensemble = [PatchModel(index=0), PatchModel()]
    height, width = config.PAGE_SIZE
    page = torch.ones((1, height, width))
    original = Image.new("RGB", (width, height), "white")
    overlay = np.asarray(engine._compute_gradcam(original, page))

    first = config.PATCH_SIZE // 2
    last = first + 2 * config.PATCH_STRIDE
    assert overlay[first, first, 0] < 200
    assert overlay[last, last, 0] < 200
    assert overlay[first, last, 0] == 255
    assert all(model.gain.grad is None for model in engine.page_ensemble)


def test_gradcam_cancels_opposing_folds_before_rendering(engine):
    engine.page_ensemble = [PatchModel(), PatchModel(gain=-1.0)]
    height, width = config.PAGE_SIZE
    page = torch.ones((1, height, width))
    original = Image.new("RGB", (width, height), "white")

    np.testing.assert_array_equal(engine._compute_gradcam(original, page), original)


def test_gradcam_weights_folds_by_the_sigmoid_score_gradient(engine):
    engine.page_ensemble = [PatchModel(index=0, bias=10.0), PatchModel()]
    height, width = config.PAGE_SIZE
    page = torch.ones((1, height, width))
    original = Image.new("RGB", (width, height), "white")
    overlay = np.asarray(engine._compute_gradcam(original, page))

    first = config.PATCH_SIZE // 2
    last = first + 2 * config.PATCH_STRIDE
    assert overlay[first, first, 0] == 255
    assert overlay[last, last, 0] < 200


def test_screen_api_returns_the_ensemble_overlay_and_average_score(engine, monkeypatch):
    from src import api

    engine.page_ensemble = [PatchModel(index=0, bias=-0.8), PatchModel(bias=1.4)]
    monkeypatch.setattr(api, "get_engine_instance", lambda backbone: engine)
    monkeypatch.setitem(api.app.dependency_overrides, require_user, lambda: None)
    original = Image.new("RGB", (512, 384), "white")
    ImageDraw.Draw(original).rectangle((15, 50, 45, 100), fill="black")
    data = io.BytesIO()
    original.save(data, format="PNG")
    with TestClient(api.app) as client:
        response = client.post(
            "/api/v1/screen",
            files={"file": ("synthetic.png", data.getvalue(), "image/png")},
        )

    assert response.status_code == 200, response.text[:500]
    result = response.json()
    assert result["gradcam_target"] == "ensemble_mean"
    assert result["models_in_ensemble"] == 2
    assert result["risk_score"] == pytest.approx(np.mean(result["per_fold_predictions"]), abs=1e-4)
    encoded = result["gradcam_overlay_base64"].removeprefix("data:image/png;base64,")
    image = Image.open(io.BytesIO(base64.b64decode(encoded)))
    assert image.size == original.size
    assert np.any(np.asarray(image) != np.asarray(original))
