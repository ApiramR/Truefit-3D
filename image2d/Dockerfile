# 1. Base Image: Use an official Python 3.8 image.
# Consider nvidia/cuda base image for more control if needed, but python:3.8 often works.
# Example for PyTorch 2.0.1 on CUDA 11.8: FROM nvidia/cuda:11.8.0-cudnn8-devel-ubuntu20.04
FROM python:3.8-slim 
# Sticking with python:3.8-slim for now, add system deps if needed

# 2. Set Working Directory
WORKDIR /app

# 3. Set Environment Variable for Detectron2 Build (Optional but good practice)
# Ensure it builds for the common architectures found in G4dn (Turing - 7.5)
# Check your specific target GPU compute capability if needed.
# See: https://developer.nvidia.com/cuda-gpus
ENV TORCH_CUDA_ARCH_LIST="7.5"

# 4. Install System Dependencies
# Essential for building detectron2 and running opencv etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ninja-build \
    libgl1-mesa-glx \
    libglib2.0-0 \
    git \
 && rm -rf /var/lib/apt/lists/*

# 5. Copy requirements first
COPY requirements.txt .

# 6. Install PyTorch FIRST (Crucial for Detectron2)
# ** IMPORTANT: Modify this line based on the CUDA version on your G4dn base AMI/setup **
# Example for CUDA 11.8 (often used with PyTorch 2.0.x) - VERIFY THIS!
RUN pip install --upgrade pip && \
    pip install torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 --index-url https://download.pytorch.org/whl/cu118

# 7. Install Detectron2 Dependencies (Cython, pycocotools)
RUN pip install cython

# Clone cocoapi, build pycocotools from the PythonAPI subdirectory, then remove clone
RUN git clone https://github.com/cocodataset/cocoapi.git /tmp/cocoapi && \
    pip install --no-cache-dir --no-build-isolation -e /tmp/cocoapi/PythonAPI && \
    rm -rf /tmp/cocoapi

# 8. Install Detectron2 from Source
# This clones the repo and installs it in editable mode.
# Using python -m pip install ensures it uses the correct python/pip.
RUN python -m pip install 'git+https://github.com/facebookresearch/detectron2.git'
# Alternatively, to pin to a specific commit for stability:
# RUN git clone https://github.com/facebookresearch/detectron2.git && \
#     cd detectron2 && \
#     git checkout <specific_commit_hash> && \
#     python -m pip install -e . && \
#     cd .. && \
#     rm -rf detectron2 # Clean up clone if not needed

# 9. Install Remaining Dependencies from requirements.txt
# Filter out torch, torchvision, torchaudio, and detectron2 related ones already installed.
# Use grep to filter out lines (adjust pattern if needed)
RUN grep -vE '^torch|^detectron2|^cython|^git\+https:\/\/github\.com\/cocodataset\/cocoapi\.git|^pycocotools' requirements.txt > /tmp/filtered_requirements.txt || true
RUN pip install --no-cache-dir -r /tmp/filtered_requirements.txt

# 10. Copy the rest of your application code
COPY . .

# 11. Expose the port
EXPOSE 8000

# 12. Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]