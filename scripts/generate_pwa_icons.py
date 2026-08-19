import os
from PIL import Image, ImageDraw

def generate_icons():
    source_path = 'LEVL App Logo .png'
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found")
        return

    os.makedirs('public/icons', exist_ok=True)
    os.makedirs('app', exist_ok=True)

    img = Image.open(source_path).convert('RGBA')
    
    # 1. Extract tight bounding box of logo graphic
    width, height = img.size
    pixels = img.load()
    min_x, min_y, max_x, max_y = width, height, 0, 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if (r > 25 or g > 25 or b > 25) and a > 20:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y

    # Add 2px padding to avoid clipping antialiased borders
    min_x = max(0, min_x - 4)
    min_y = max(0, min_y - 4)
    max_x = min(width, max_x + 4)
    max_y = min(height, max_y + 4)

    cropped_logo = img.crop((min_x, min_y, max_x, max_y))
    crop_w, crop_h = cropped_logo.size
    print(f"Extracted logo: {crop_w}x{crop_h}")

    # Standard Square Canvas Creation Helper
    def create_square_icon(size: int, content_ratio: float = 0.78, bg_color=(0, 0, 0, 255)):
        canvas = Image.new('RGBA', (size, size), bg_color)
        
        target_w = int(size * content_ratio)
        scale = target_w / crop_w
        target_h = int(crop_h * scale)
        
        if target_h > int(size * content_ratio):
            target_h = int(size * content_ratio)
            scale = target_h / crop_h
            target_w = int(crop_w * scale)

        resized_logo = cropped_logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        pos_x = (size - target_w) // 2
        pos_y = (size - target_h) // 2
        
        canvas.paste(resized_logo, (pos_x, pos_y), resized_logo)
        return canvas

    # 2. Generate Master 1024x1024
    master_1024 = create_square_icon(1024, content_ratio=0.76)
    master_maskable_1024 = create_square_icon(1024, content_ratio=0.64)

    # Output list definitions: (path, size, is_maskable)
    targets = [
        # Standard PWA Icons
        ('public/icons/icon-512x512.png', 512, False),
        ('public/icons/icon-384x384.png', 384, False),
        ('public/icons/icon-192x192.png', 192, False),
        ('public/icons/icon-144x144.png', 144, False),
        ('public/icons/icon-96x96.png', 96, False),
        ('public/icons/icon-72x72.png', 72, False),
        ('public/icons/icon-48x48.png', 48, False),

        # Maskable Android Icons (with 64% safe-zone to survive circular/squircle masking)
        ('public/icons/icon-maskable-512x512.png', 512, True),
        ('public/icons/icon-maskable-384x384.png', 384, True),
        ('public/icons/icon-maskable-192x192.png', 192, True),

        # Apple Touch Icons
        ('public/icons/apple-touch-icon.png', 180, False),
        ('public/icons/apple-touch-icon-180x180.png', 180, False),
        ('public/icons/apple-touch-icon-152x152.png', 152, False),
        ('public/icons/apple-touch-icon-120x120.png', 120, False),
        ('public/icons/apple-touch-icon-76x76.png', 76, False),
        ('public/apple-touch-icon.png', 180, False),
        ('public/apple-touch-icon-precomposed.png', 180, False),

        # Root Fallbacks & App Router metadata icons
        ('public/logo.png', 512, False),
        ('app/icon.png', 512, False),
        ('app/apple-icon.png', 180, False),
    ]

    for path, size, is_maskable in targets:
        src = master_maskable_1024 if is_maskable else master_1024
        out_img = src.resize((size, size), Image.Resampling.LANCZOS)
        out_img.save(path, 'PNG', optimize=True)
        print(f"Generated: {path} ({size}x{size})")

    # Generate multi-size favicon.ico (16, 32, 48)
    ico_img = master_1024.resize((64, 64), Image.Resampling.LANCZOS)
    ico_img.save('app/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    ico_img.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("Generated: app/favicon.ico and public/favicon.ico")

if __name__ == '__main__':
    generate_icons()
