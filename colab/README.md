# Google Colab Setup & Training Guide

> ⚠️ **SCREENING TOOL DISCLAIMER**: This is an experimental screening tool, not a diagnostic instrument. It should NEVER be used as a substitute for professional clinical diagnosis by qualified medical or educational specialists.

---

## Files & Resources

| Resource | Description | Location / Status |
|---|---|---|
| **`Dyslexia_Screening_Colab.ipynb`** | Complete, self-contained Google Colab notebook for training the 5-fold ConvNeXt-Tiny + Attention MIL model | Located in this directory (`colab/`) |
| **`dyslexia_screening_data.zip`** | Pre-audited clean handwriting dataset (~84.7 MB) | Uploaded to Google Drive root (`MyDrive/`) |

---

## 🚀 Quick Step-by-Step Instructions

### Step 1: Upload the Dataset to Google Drive
1. Open [Google Drive](https://drive.google.com).
2. Upload **`dyslexia_screening_data.zip`** directly to your **My Drive** root folder (`MyDrive/`). *(Kept on Drive to adhere to repository size guidelines).*

---

### Step 2: Open the Notebook in Google Colab
1. Go to [Google Colab](https://colab.research.google.com/).
2. Click **File -> Upload notebook** and select **`colab/Dyslexia_Screening_Colab.ipynb`**.
3. Make sure GPU acceleration is enabled:
   - Navigate to **Runtime -> Change runtime type**
   - Select **T4 GPU** (or any available GPU) under Hardware accelerator.
   - Click **Save**.

---

### Step 3: Run the Notebook
1. Click **Runtime -> Run all** (or step through cell by cell).
2. The notebook will:
   - Mount Google Drive and unpack the dataset.
   - Run 5-fold grouped cross-validation without writer leakage.
   - Train and evaluate the **ConvNeXt-Tiny + Attention MIL** page ensemble.
   - Compute Integrated Gradients stroke attribution maps and Grad-CAM class activation heatmaps.
   - Export 5-fold model weights: `convnext_fold{0..4}_best.pt`.

---

### Step 4: Placing Checkpoints in the Project
Save the 5-fold checkpoint files into:
```
outputs/checkpoints/
  convnext_fold0_best.pt
  convnext_fold1_best.pt
  convnext_fold2_best.pt
  convnext_fold3_best.pt
  convnext_fold4_best.pt
```
The FastAPI backend (`src/api.py`) automatically discovers and loads these weights on startup.
