import cv2

# Load and preprocess
image = cv2.imread("test/4.jpg")
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
blur = cv2.GaussianBlur(gray, (5, 5), 0)
edges = cv2.Canny(blur, 75, 200)

# Find contours
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Filter by area and aspect ratio (to remove small boxes like ID or instruction area)
rects = []
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    area = w * h
    aspect_ratio = w / float(h)

    # Adjust thresholds as needed for your paper
    if area > 50000 and 0.8 < aspect_ratio < 3.5:
        rects.append((x, y, w, h))

# Sort rectangles from top to bottom
rects = sorted(rects, key=lambda r: r[1])

# Draw rectangles for visualization
output = image.copy()
for i, (x, y, w, h) in enumerate(rects):
    cv2.rectangle(output, (x, y), (x + w, y + h), (0, 255, 0), 3)
    cv2.putText(output, f"{i+1}", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 2)

# Save visualization
cv2.imwrite("rectangles_detected_fixed.jpg", output)

# ✅ Crop the very last (bottom-most) rectangle
if len(rects) >= 1:
    x, y, w, h = rects[-1]  # last rectangle
    cropped = image[y:y + h, x:x + w]
    cv2.imwrite("answer_section.jpg", cropped)
    print("✅ Cropped the last (bottom-most) rectangle as 'answer_section.jpg'")
else:
    print("⚠️ No rectangles detected.")
