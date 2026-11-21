from PIL import Image
import numpy as np
import os

img_test = Image.open('test_official/cacao_whey_official.webp')
arr_test = np.array(img_test)
non_white_test = ((arr_test[:, :, 0] < 250) | (arr_test[:, :, 1] < 250) | (arr_test[:, :, 2] < 250)).sum()
print("test_official non-white:", non_white_test, f"({non_white_test / (1000*1000) * 100:.1f}%)")

# What did fetch_essential_official_images.py download?
# Let's check the URL that was matched
