"""Check the location of a Grad-CAM hotspot without training checkpoints."""

import numpy as np
import pytest
import torch
from PIL import Image
from torch import nn

from src import config, preprocess
from src.screening_engine import DyslexiaScreeningEngine


class LastPatchModel(nn.Module):
    """Make the logit depend only on the central activation of the last patch."""

    def __init__(self):
        super().__init__()
        self.encoder = nn.Module()
        self.encoder.backbone = nn.Module()
        self.encoder.backbone.features = nn.Sequential(*[nn.Identity() for _ in range(8)])

    def forward(self, page):
        patches = preprocess.extract_patches(page)
        features = torch.nn.functional.adaptive_avg_pool2d(patches, 7)
        center = torch.zeros_like(features)
        center[:, :, 3, 3] = 1
        activations = self.encoder.backbone.features(features * center)
        return activations[-1].mean().reshape(1), None


@pytest.mark.parametrize("image_height", [512, 384])
def test_gradcam_locates_last_patch_after_unpadding(image_height):
    engine = DyslexiaScreeningEngine.__new__(DyslexiaScreeningEngine)
    engine.device = torch.device("cpu")
    engine.page_ensemble = [LastPatchModel()]

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
def test_gradcam_leaves_blank_or_negligible_maps_uncolored(activation):
    engine = DyslexiaScreeningEngine.__new__(DyslexiaScreeningEngine)
    engine.device = torch.device("cpu")
    engine.page_ensemble = [LastPatchModel()]

    height, width = config.PAGE_SIZE
    page = torch.full((1, height, width), activation)
    original = Image.new("RGB", (width, height), "white")
    overlay = engine._compute_gradcam(original, page)

    np.testing.assert_array_equal(overlay, original)
