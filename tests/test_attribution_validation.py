"""Measure patch coverage and stroke-attribution convergence on synthetic inputs."""

import numpy as np
import pytest
import torch
from PIL import Image
from torch import nn

from src import config, preprocess
from src.screening_engine import DyslexiaScreeningEngine


@pytest.mark.parametrize("width,height,expected", [(512, 512, 0.765625), (512, 384, 0.875), (384, 512, 0.875)])
def test_model_patch_coverage_excludes_padding(width, height, expected):
    target_h, target_w = config.PAGE_SIZE
    page = torch.zeros((1, target_h, target_w), requires_grad=True)
    (coverage,) = torch.autograd.grad(preprocess.extract_patches(page).sum(), page)
    top, left = (target_h - height) // 2, (target_w - width) // 2
    content = coverage[0, top : top + height, left : left + width]
    assert (content > 0).float().mean().item() == pytest.approx(expected)


def test_stroke_attribution_step_count_can_reverse_region_ranking():
    ink = np.ones(config.PAGE_SIZE, dtype=np.float32)
    ink[110:190, 90:95] = 0
    ink[110:190, 120:125] = 0
    original = Image.fromarray((ink * 255).astype(np.uint8)).convert("RGB")
    mean, std = float(ink.mean()), float(ink.std())
    normalized = (ink - mean) / std
    paper = (1 - mean) / std
    page = torch.from_numpy(normalized).unsqueeze(0)

    class StrokeModel(nn.Module):
        def forward(self, tensor):
            darkness = (paper - tensor) * std
            cubic = 0.8 * darkness[:, 110:190, 90:95].pow(3).mean()
            linear = darkness[:, 110:190, 120:125].mean()
            return (cubic + linear).reshape(1), None

    engine = DyslexiaScreeningEngine.__new__(DyslexiaScreeningEngine)
    engine.device = torch.device("cpu")
    engine.page_ensemble = [StrokeModel()]

    results = [
        engine._compute_page_stroke_attributions(
            original, ink, ink, normalized, page, mean_risk=0.5, max_crops=0, **steps
        )["raw_attribution_map"]
        for steps in ({}, {"ig_steps": 16}, {"ig_steps": 64}, {"ig_steps": 256})
    ]
    # The exact integrated contribution is 0.8 for the first stroke and 1.0 for
    # the second. Each model term averages over the same number of ink pixels.
    per_stroke = [(mapping[150, [92, 122]] * 400).tolist() for mapping in results]
    assert per_stroke[0][0] > per_stroke[0][1]
    assert all(cubic < linear for cubic, linear in per_stroke[1:])
    errors = [abs(cubic - 0.8) for cubic, _ in per_stroke]
    assert errors[0] > errors[1] > errors[2] > errors[3]
    assert errors[3] < 0.005
    assert all(not np.any(mapping[ink == 1]) for mapping in results)
