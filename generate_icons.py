from PIL import Image
import os

source_path = "assets/original_logo.jpg"
output_dir = "assets"

sizes = {
    "icon-16.png": (16, 16),
    "icon-32.png": (32, 32),
    "icon-64.png": (64, 64),
    "icon-80.png": (80, 80),
    "icon-128.png": (128, 128),
    "logo-filled.png": (300, 300)  # For index.html, slightly larger
}

try:
    with Image.open(source_path) as img:
        # Convert to RGBA just in case, though source is JPG
        img = img.convert("RGBA")
        
        for filename, size in sizes.items():
            # Resize with high quality resampling
            resized = img.resize(size, Image.Resampling.LANCZOS)
            output_path = os.path.join(output_dir, filename)
            resized.save(output_path, "PNG")
            print(f"Generated {filename}")
            
except Exception as e:
    print(f"Error: {e}")
