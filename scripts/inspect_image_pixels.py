from PIL import Image
import numpy as np

img = Image.open('public/products/essential-cacao-whey-900g.webp')
arr = np.array(img)
print("Shape:", arr.shape)
# Count non-white pixels (< 250 in any channel)
non_white = ((arr[:, :, 0] < 250) | (arr[:, :, 1] < 250) | (arr[:, :, 2] < 250)).sum()
print("Non-white pixels:", non_white, f"({non_white / (1000*1000) * 100:.1f}%)")
print("Min pixel:", arr.min(axis=(0,1)), "Max pixel:", arr.max(axis=(0,1)))
