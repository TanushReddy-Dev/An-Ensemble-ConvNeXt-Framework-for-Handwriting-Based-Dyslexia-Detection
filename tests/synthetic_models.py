import torch
from torch import nn

from src import preprocess


class PatchModel(nn.Module):
    """Make the logit depend on one patch's central activation."""

    def __init__(self, index=-1, gain=1.0, bias=0.0):
        super().__init__()
        self.index = index
        self.gain = nn.Parameter(torch.tensor(gain))
        self.bias = bias
        self.encoder = nn.Module()
        self.encoder.backbone = nn.Module()
        self.encoder.backbone.features = nn.Sequential(*[nn.Identity() for _ in range(8)])

    def forward(self, page):
        patches = preprocess.extract_patches(page)
        features = torch.nn.functional.adaptive_avg_pool2d(patches, 7)
        center = torch.zeros_like(features)
        center[:, :, 3, 3] = 1
        activations = self.encoder.backbone.features(features * center)
        logit = activations[self.index].mean() * self.gain + self.bias
        attention = torch.full((len(patches),), 1.0 / len(patches), device=page.device)
        return logit.reshape(1), attention
