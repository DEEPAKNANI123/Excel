from PIL import Image

# Open the image
img = Image.open('exel-logo.jpg')
img = img.convert("RGBA")
datas = img.getdata()

newData = []
# Threshold for what we consider "black"
for item in datas:
    # item is (R, G, B, A)
    # If the pixel is very dark (r < 50, g < 50, b < 50), make it white.
    # The blue logo has a prominent blue channel, so B will be higher.
    # Let's say if it's generally dark grey/black:
    if item[0] < 50 and item[1] < 50 and item[2] < 100:
        newData.append((255, 255, 255, 255)) # White
    else:
        newData.append(item)

img.putdata(newData)
img.save('exel-logo-white.png', 'PNG')
print("Image processing complete.")
