import io
import base64
import os
import time # For timing startup
import contextlib # For lifespan
from typing import List, Dict, Optional, Tuple
from enum import Enum
from PIL import Image
import numpy as np
import torch
from torchvision import transforms
from torchvision.transforms.functional import to_pil_image
from contextlib import asynccontextmanager # For lifespan

# --- AI/ML Imports ---
# (Keep imports like StableDiffusionXLInpaintPipeline, UNets, CLIP models, etc.)
from src.tryon_pipeline import StableDiffusionXLInpaintPipeline as TryonPipeline
from src.unet_hacked_garmnet import UNet2DConditionModel as UNet2DConditionModel_ref
from src.unet_hacked_tryon import UNet2DConditionModel
from transformers import (
    CLIPImageProcessor,
    CLIPVisionModelWithProjection,
    CLIPTextModel,
    CLIPTextModelWithProjection,
    AutoTokenizer
)
from diffusers import DDPMScheduler, AutoencoderKL
# --- Preprocessing/Util Imports ---
from utils_mask import get_mask_location
import apply_net
from preprocess.humanparsing.run_parsing import Parsing
from preprocess.openpose.run_openpose import OpenPose
from detectron2.data.detection_utils import convert_PIL_to_numpy, _apply_exif_orientation

# --- FastAPI Imports ---
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse

# --- Global Model State ---
# This dictionary will hold the loaded models and components
model_state = {}

# --- Helper Function Definitions (Keep as is) ---
def pil_to_binary_mask(pil_image, threshold=0):
    # ... (implementation from previous version)
    np_image = np.array(pil_image)
    grayscale_image = Image.fromarray(np_image).convert("L")
    binary_mask = np.array(grayscale_image) > threshold
    mask = np.zeros(binary_mask.shape, dtype=np.uint8)
    for i in range(binary_mask.shape[0]):
        for j in range(binary_mask.shape[1]):
            if binary_mask[i,j] == True :
                mask[i,j] = 1
    mask = (mask*255).astype(np.uint8)
    output_mask = Image.fromarray(mask)
    return output_mask

def encode_image_to_base64(image: Image.Image, format="PNG") -> str:
    # ... (implementation from previous version)
    buffered = io.BytesIO()
    image.save(buffered, format=format)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/{format.lower()};base64," + img_str

# --- Lifespan Context Manager for Model Loading ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # === Startup Phase ===
    print("Application startup: Loading models...")
    start_time = time.time()

    # --- Configuration ---
    base_path = 'yisol/IDM-VTON'
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model_state["device"] = device
    print(f"Using device: {device}")
    model_dtype = torch.float16 if device == "cuda" else torch.float32 # Use float32 for CPU? FP16 primarily benefits GPU.
    model_state["dtype"] = model_dtype
    print(f"Using dtype: {model_dtype}")

    # Check if ckpt and configs paths exist (basic check)
    if not os.path.exists("./ckpt") or not os.path.exists("./configs"):
         print("ERROR: './ckpt' or './configs' directory not found. Ensure local models/configs are present.")
         # Optionally raise an error to prevent startup if essential files are missing
         # raise RuntimeError("Missing required 'ckpt' or 'configs' directories.")
         # For now, just print error and continue, loading might fail later.

    # --- Load Models ---
    try:
        print("Loading UNet...")
        model_state["unet"] = UNet2DConditionModel.from_pretrained(
            base_path, subfolder="unet", torch_dtype=model_dtype
        ).to(device)
        model_state["unet"].requires_grad_(False)

        print("Loading Tokenizers...")
        model_state["tokenizer_one"] = AutoTokenizer.from_pretrained(
            base_path, subfolder="tokenizer", revision=None, use_fast=False
        )
        model_state["tokenizer_two"] = AutoTokenizer.from_pretrained(
            base_path, subfolder="tokenizer_2", revision=None, use_fast=False
        )

        print("Loading Scheduler...")
        model_state["noise_scheduler"] = DDPMScheduler.from_pretrained(base_path, subfolder="scheduler")

        print("Loading Text Encoders...")
        model_state["text_encoder_one"] = CLIPTextModel.from_pretrained(
            base_path, subfolder="text_encoder", torch_dtype=model_dtype
        ).to(device)
        model_state["text_encoder_one"].requires_grad_(False)
        model_state["text_encoder_two"] = CLIPTextModelWithProjection.from_pretrained(
            base_path, subfolder="text_encoder_2", torch_dtype=model_dtype
        ).to(device)
        model_state["text_encoder_two"].requires_grad_(False)

        print("Loading Image Encoder...")
        model_state["image_encoder"] = CLIPVisionModelWithProjection.from_pretrained(
            base_path, subfolder="image_encoder", torch_dtype=model_dtype
        ).to(device)
        model_state["image_encoder"].requires_grad_(False)

        print("Loading VAE...")
        model_state["vae"] = AutoencoderKL.from_pretrained(
            base_path, subfolder="vae", torch_dtype=model_dtype
        ).to(device)
        model_state["vae"].requires_grad_(False)

        print("Loading UNet Encoder (Ref)...")
        model_state["unet_encoder_ref"] = UNet2DConditionModel_ref.from_pretrained(
            base_path, subfolder="unet_encoder", torch_dtype=model_dtype
        ).to(device)
        model_state["unet_encoder_ref"].requires_grad_(False)

        print("Loading Parsing Model...")
        # Assuming Parsing class handles device internally or runs on CPU
        model_state["parsing_model"] = Parsing(0) # Pass GPU ID 0, but check Parsing implementation

        print("Loading OpenPose Model...")
        # Assuming OpenPose class handles device internally or runs on CPU/GPU based on ID
        model_state["openpose_model"] = OpenPose(0)
        # Explicitly move critical parts if necessary and possible
        try:
             model_state["openpose_model"].preprocessor.body_estimation.model.to(device)
        except Exception as e:
             print(f"Warning: Could not move OpenPose sub-model to device {device}: {e}")


        print("Loading Image Transforms...")
        model_state["tensor_transform"] = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize([0.5], [0.5]),
        ])

        print("Assembling Tryon Pipeline...")
        model_state["pipe"] = TryonPipeline.from_pretrained(
            base_path, # May load some configs from here
            unet=model_state["unet"],
            vae=model_state["vae"],
            feature_extractor=CLIPImageProcessor(),
            text_encoder=model_state["text_encoder_one"],
            text_encoder_2=model_state["text_encoder_two"],
            tokenizer=model_state["tokenizer_one"],
            tokenizer_2=model_state["tokenizer_two"],
            scheduler=model_state["noise_scheduler"],
            image_encoder=model_state["image_encoder"],
            torch_dtype=model_dtype, # Set default dtype for pipeline ops
        ).to(device) # Move entire pipeline
        model_state["pipe"].unet_encoder = model_state["unet_encoder_ref"].to(device) # Assign and ensure device
        print("Pipeline assembled.")

    except Exception as e:
        print(f"FATAL: Failed to load one or more models during startup: {e}")
        # Optionally re-raise to prevent app start on critical failure
        import traceback
        traceback.print_exc()
        raise RuntimeError("Model loading failed") from e

    # --- Optional: Warm-up Inference ---
    print("Performing warm-up inference...")
    try:
        # Create dummy data (adjust sizes if needed)
        dummy_human = Image.new('RGB', (768, 1024), color = 'gray')
        dummy_garment = Image.new('RGB', (768, 1024), color = 'blue')
        dummy_desc = "blue shirt"
        dummy_category = "upper_body" # Use a valid category

        # Run inference logic with minimal steps
        _ = run_tryon_logic(
            model_state=model_state, # Pass the state
            human_img_orig=dummy_human,
            garm_img=dummy_garment,
            manual_mask=None, # Use auto mask for warm-up
            garment_des=dummy_desc,
            use_auto_mask=True,
            use_auto_crop=False,
            denoise_steps=3, # Minimal steps for warm-up
            seed=-1,
            category=dummy_category
        )
        print("Warm-up inference completed.")
    except Exception as e:
        print(f"Warning: Warm-up inference failed: {e}")
        # Log the error but allow the app to continue starting
        import traceback
        traceback.print_exc()

    end_time = time.time()
    print(f"Model loading and warm-up finished in {end_time - start_time:.2f} seconds.")
    print("--- Application ready to serve requests ---")

    yield # Application runs here

    # === Shutdown Phase ===
    print("Application shutdown: Cleaning up...")
    # Add any cleanup code here if needed (e.g., releasing GPU memory)
    model_state.clear()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    print("Cleanup finished.")


# --- Core Try-On Function (Modified to use model_state) ---
def run_tryon_logic(
    model_state: Dict, # Expects the global state dictionary
    human_img_orig: Image.Image,
    garm_img: Image.Image,
    manual_mask: Optional[Image.Image],
    garment_des: str,
    use_auto_mask: bool,
    use_auto_crop: bool,
    denoise_steps: int,
    seed: int,
    category: str
) -> Tuple[Image.Image, Image.Image]:
    """Core virtual try-on logic using pre-loaded models."""
    # 1. Get components from model_state
    device = model_state["device"]
    dtype = model_state["dtype"]
    pipe = model_state["pipe"]
    parsing_model = model_state["parsing_model"]
    openpose_model = model_state["openpose_model"]
    tensor_transform = model_state["tensor_transform"] # Corrected variable name

    # Ensure relevant sub-models are on the correct device (redundant if lifespan handles it, but safe)
    try:
        openpose_model.preprocessor.body_estimation.model.to(device)
        # pipe components are moved during pipeline creation/loading
    except Exception as e:
        print(f"Warning during inference prep: Could not move OpenPose sub-model: {e}")

    # 2. Image Preprocessing
    garm_img = garm_img.convert("RGB").resize((768,1024))
    orig_size = human_img_orig.size

    # 2.1 Optional Cropping
    if use_auto_crop:
        # ... (cropping logic as before) ...
        width, height = human_img_orig.size
        target_width = int(min(width, height * (3 / 4)))
        target_height = int(min(height, width * (4 / 3)))
        left = (width - target_width) / 2
        top = (height - target_height) / 2
        right = (width + target_width) / 2
        bottom = (height + target_height) / 2
        cropped_img = human_img_orig.crop((left, top, right, bottom))
        crop_size = cropped_img.size
        human_img = cropped_img.resize((768,1024))
    else:
        human_img = human_img_orig.resize((768,1024))
        crop_size = orig_size

    # 3. Generate Mask
    if use_auto_mask:
        print("Generating automatic mask...")
        # Resize human_img for the parsing/pose models
        human_img_resized_for_pp = human_img.resize((384, 512))
        keypoints = openpose_model(human_img_resized_for_pp)
        model_parse, _ = parsing_model(human_img_resized_for_pp)
        # Note: get_mask_location expects width/height of the parse/keypoint input
        mask, mask_gray = get_mask_location('hd', category, model_parse, keypoints, width=384, height=512)
        mask = mask.resize((768,1024)) # Resize final mask
        print("Automatic mask generated.")
    else:
        print("Using provided manual mask...")
        if manual_mask is None:
             raise ValueError("Manual mask mode selected, but no mask image provided.")
        mask = pil_to_binary_mask(manual_mask.convert("RGB").resize((768, 1024)))
        print("Manual mask processed.")

    # 3.3 Generate Gray Mask Visualization
    # Use the transform from model_state
    mask_gray = (1-transforms.ToTensor()(mask)) * tensor_transform(human_img)
    mask_gray = to_pil_image((mask_gray+1.0)/2.0)

    # 4. Pose Processing (DensePose)
    print("Running DensePose...")
    # Resize human_img for DensePose input
    human_img_resized_for_densepose = human_img.resize((384, 512))
    human_img_arg = _apply_exif_orientation(human_img_resized_for_densepose)
    human_img_arg = convert_PIL_to_numpy(human_img_arg, format="BGR")

    # Pass the correct device to DensePose args
    args = apply_net.create_argument_parser().parse_args(('show', './configs/densepose_rcnn_R_50_FPN_s1x.yaml', './ckpt/densepose/model_final_162be9.pkl', 'dp_segm', '-v', '--opts', 'MODEL.DEVICE', device))
    pose_img = args.func(args,human_img_arg)
    pose_img = pose_img[:,:,::-1]
    pose_img = Image.fromarray(pose_img).resize((768,1024))
    print("DensePose finished.")

    # 5. AI Generation Process
    print("Starting AI generation...")
    with torch.no_grad():
        autocast_context = torch.cuda.amp.autocast() if device == 'cuda' else torch.cpu.amp.autocast(enabled=False) # Disable CPU autocast if not beneficial
        with autocast_context:
            # --- Prompt Encoding ---
            prompt = "((best quality, masterpiece, ultra-detailed, high quality photography, photo realistic)), the model is wearing " + garment_des
            negative_prompt = "monochrome, lowres, bad anatomy, worst quality, normal quality, low quality, blurry, jpeg artifacts, sketch"
            with torch.inference_mode(): # Use inference mode for encoding
                (
                    prompt_embeds,
                    negative_prompt_embeds,
                    pooled_prompt_embeds,
                    negative_pooled_prompt_embeds,
                ) = pipe.encode_prompt(
                    prompt, num_images_per_prompt=1, do_classifier_free_guidance=True, negative_prompt=negative_prompt,
                )

                prompt_c = "((best quality, masterpiece, ultra-detailed, high quality photography, photo realistic)), a photo of " + garment_des
                negative_prompt_c = "monochrome, lowres, bad anatomy, worst quality, normal quality, low quality, blurry, jpeg artifacts, sketch"
                if not isinstance(prompt_c, List): prompt_c = [prompt_c] * 1
                if not isinstance(negative_prompt_c, List): negative_prompt_c = [negative_prompt_c] * 1

                ( prompt_embeds_c, _, _, _,) = pipe.encode_prompt(
                    prompt_c, num_images_per_prompt=1, do_classifier_free_guidance=False, negative_prompt=negative_prompt_c,
                )

            # --- Prepare Input Tensors ---
            # Use transform from model_state
            pose_img_tensor = tensor_transform(pose_img).unsqueeze(0).to(device, dtype)
            garm_tensor = tensor_transform(garm_img).unsqueeze(0).to(device, dtype)
            generator = torch.Generator(device).manual_seed(seed) if seed != -1 else None

            # --- Run Pipeline ---
            print(f"Running pipeline with {denoise_steps} steps...")
            images = pipe(
                prompt_embeds=prompt_embeds.to(device, dtype),
                negative_prompt_embeds=negative_prompt_embeds.to(device, dtype),
                pooled_prompt_embeds=pooled_prompt_embeds.to(device, dtype),
                negative_pooled_prompt_embeds=negative_pooled_prompt_embeds.to(device, dtype),
                num_inference_steps=denoise_steps,
                generator=generator,
                strength=1.0,
                pose_img=pose_img_tensor, # Use tensor
                text_embeds_cloth=prompt_embeds_c.to(device, dtype),
                cloth=garm_tensor, # Use tensor
                mask_image=mask, # Still PIL
                image=human_img, # Still PIL
                height=1024,
                width=768,
                ip_adapter_image=garm_img.resize((768,1024)), # PIL
                guidance_scale=2.0,
            )[0]
            print("Pipeline execution finished.")

    # 7. Post-processing and Return
    if use_auto_crop:
        print(f"Resizing output to cropped size: {crop_size}")
        return images[0].resize(crop_size), mask_gray.resize(crop_size)
    else:
        print(f"Resizing output to original size: {orig_size}")
        return images[0].resize(orig_size), mask_gray.resize(orig_size)


# --- FastAPI App Definition ---
# Pass the lifespan manager to the FastAPI app instance
app = FastAPI(title="Virtual Try-On API", lifespan=lifespan)

# Define allowed categories using Enum for validation
class CategoryEnum(str, Enum):
    upper_body = "upper_body"
    lower_body = "lower_body"
    dresses = "dresses"

@app.post("/tryon/", summary="Perform Virtual Try-On")
async def create_tryon(
    human_image: UploadFile = File(..., description="Human model image"),
    garment_image: UploadFile = File(..., description="Garment image"),
    manual_mask_image: Optional[UploadFile] = File(None, description="Manual mask image (required if use_auto_mask=false)"),
    garment_description: str = Form(..., description="Text description of the garment (e.g., 'red short sleeve t-shirt')"),
    use_auto_mask: bool = Form(True, description="Use auto-generated mask? (If false, manual_mask_image is required)"),
    use_auto_crop: bool = Form(False, description="Use auto-crop and resizing?"),
    category: CategoryEnum = Form(CategoryEnum.upper_body, description="Clothing category (used for auto-masking)"),
    denoise_steps: int = Form(30, ge=20, le=40, description="Number of denoising steps"),
    seed: int = Form(-1, description="Random seed (-1 for random)")
):
    """
    Takes human and garment images, processes them using the try-on pipeline,
    and returns the result and mask visualization as base64 encoded images.
    """
    # Check if models are loaded (basic check)
    if "pipe" not in model_state or model_state["pipe"] is None:
        raise HTTPException(status_code=503, detail="Models are not ready. Please wait and try again.")

    print("Received request...")
    request_start_time = time.time()

    # --- Input Validation ---
    # ... (validation logic as before) ...
    if not use_auto_mask and manual_mask_image is None:
        raise HTTPException(status_code=400, detail="manual_mask_image is required when use_auto_mask is false.")
    if use_auto_mask and manual_mask_image is not None:
        print("Warning: manual_mask_image provided but use_auto_mask is true. Manual mask will be ignored.")
        manual_mask_image = None

    # --- Load Images ---
    try:
        # ... (image loading logic as before) ...
        human_bytes = await human_image.read()
        human_img_pil = Image.open(io.BytesIO(human_bytes)).convert("RGB")

        garm_bytes = await garment_image.read()
        garm_img_pil = Image.open(io.BytesIO(garm_bytes)).convert("RGB")

        manual_mask_pil = None
        if manual_mask_image:
            mask_bytes = await manual_mask_image.read()
            manual_mask_pil = Image.open(io.BytesIO(mask_bytes))

        print("Input images loaded.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load or process input images: {e}")
    finally:
        await human_image.close()
        await garment_image.close()
        if manual_mask_image:
            await manual_mask_image.close()

    # --- Run Inference ---
    try:
        print("Calling try-on logic...")
        # Pass the model_state dictionary
        result_image, mask_gray_image = run_tryon_logic(
            model_state=model_state,
            human_img_orig=human_img_pil,
            garm_img=garm_img_pil,
            manual_mask=manual_mask_pil,
            garment_des=garment_description,
            use_auto_mask=use_auto_mask,
            use_auto_crop=use_auto_crop,
            denoise_steps=denoise_steps,
            seed=seed,
            category=category.value
        )
        print("Try-on logic finished successfully.")
    # ... (error handling as before) ...
    except ValueError as ve:
         print(f"Value Error during processing: {ve}")
         raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Error during try-on process: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error during try-on process: {e}")

    # --- Encode Output Images ---
    try:
        print("Encoding output images...")
        # ... (encoding logic as before) ...
        result_base64 = encode_image_to_base64(result_image, format="JPEG")
        mask_base64 = encode_image_to_base64(mask_gray_image, format="PNG")
        print("Output images encoded.")
    except Exception as e:
        print(f"Error encoding output images: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to encode output images: {e}")

    # --- Return Response ---
    request_end_time = time.time()
    print(f"Request processed in {request_end_time - request_start_time:.2f} seconds. Sending response.")
    # ... (response creation as before) ...
    return JSONResponse(content={
        "result_image": result_base64,
        "mask_visualization": mask_base64,
        "input_parameters": {
             "garment_description": garment_description,
             "use_auto_mask": use_auto_mask,
             "use_auto_crop": use_auto_crop,
             "category": category.value,
             "denoise_steps": denoise_steps,
             "seed": seed
        }
    })

# --- Root endpoint (Keep as is) ---
@app.get("/")
async def root():
    # Check if models are loaded
    status = "ready" if "pipe" in model_state and model_state["pipe"] is not None else "loading"
    return {"message": f"Virtual Try-On API is running. Status: {status}"}

# --- To Run (save as main.py) ---
# Ensure ./ckpt and ./configs are populated correctly
# uvicorn main:app --host 0.0.0.0 --port 8000
# Remove --reload for production deployment