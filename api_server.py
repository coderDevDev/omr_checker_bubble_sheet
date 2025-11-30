"""
OMR Scanner API Server

Flask REST API server that wraps the OMR processing logic from main.py
Provides endpoints for mobile app to upload images and get results

Author: Generated for OMR Scanner Project
"""

import os
import sys
import json
import base64
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import cv2
import numpy as np

# Production environment detection
IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production' or os.getenv('RENDER')

# Import OMR processing modules
from src.entry import process_dir
from src.template import Template
from src.defaults import CONFIG_DEFAULTS
from src.utils.parsing import open_config_with_defaults
from src import constants

app = Flask(__name__)

# Configure CORS for production
if IS_PRODUCTION:
    # In production, allow specific origins or use environment variables
    allowed_origins = os.getenv('ALLOWED_ORIGINS', '*').split(',')
    CORS(app, origins=allowed_origins, supports_credentials=True)
else:
    # Development: allow all origins
    CORS(app)

# Configuration
# Use environment variable for upload folder in production
UPLOAD_FOLDER = Path(os.getenv('UPLOAD_FOLDER', 'temp_uploads'))
RESULTS_FOLDER = Path(os.getenv('RESULTS_FOLDER', 'temp_results'))
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Max upload size (16MB default, configurable via env)
MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

UPLOAD_FOLDER.mkdir(exist_ok=True)
RESULTS_FOLDER.mkdir(exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_temp_files(session_id):
    """Clean up temporary files for a session"""
    try:
        session_upload = UPLOAD_FOLDER / session_id
        session_result = RESULTS_FOLDER / session_id
        
        if session_upload.exists():
            shutil.rmtree(session_upload)
        if session_result.exists():
            shutil.rmtree(session_result)
    except Exception as e:
        print(f"Cleanup error: {e}")

def process_omr_image(image_path, template_path, output_dir):
    """
    Process a single OMR image using the template
    
    Args:
        image_path: Path to the image file
        template_path: Path to template.json
        output_dir: Directory for output files
        
    Returns:
        dict: Processing results including answers, score, etc.
    """
    try:
        # Load template
        tuning_config = CONFIG_DEFAULTS
        local_config_path = template_path.parent / constants.CONFIG_FILENAME
        if local_config_path.exists():
            tuning_config = open_config_with_defaults(local_config_path)
        
        template = Template(template_path, tuning_config)
        
        # Set up output paths
        from src.utils.file import Paths, setup_dirs_for_paths, setup_outputs_for_template
        paths = Paths(output_dir)
        setup_dirs_for_paths(paths)
        outputs_namespace = setup_outputs_for_template(paths, template)
        
        # Read image
        image_path = Path(image_path)
        in_omr = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
        
        if in_omr is None:
            return {
                'success': False,
                'error': 'Failed to read image'
            }
        
        # Reset image saves
        template.image_instance_ops.reset_all_save_img()
        template.image_instance_ops.append_save_img(1, in_omr)
        
        # Apply preprocessors
        in_omr = template.image_instance_ops.apply_preprocessors(
            str(image_path), in_omr, template
        )
        
        if in_omr is None:
            return {
                'success': False,
                'error': 'Image preprocessing failed - markers not detected'
            }
        
        # Read OMR response
        file_id = image_path.name
        save_dir = paths.save_marked_dir
        
        (
            response_dict,
            final_marked,
            multi_marked,
            _,
        ) = template.image_instance_ops.read_omr_response(
            template, image=in_omr, name=file_id, save_dir=save_dir
        )
        
        # Get concatenated response
        from src.utils.parsing import get_concatenated_response
        omr_response = get_concatenated_response(response_dict, template)
        
        # Prepare response array
        resp_array = []
        for k in template.output_columns:
            resp_array.append(omr_response.get(k, '-'))
        
        # Save marked image
        marked_image_path = save_dir / file_id
        if final_marked is not None:
            cv2.imwrite(str(marked_image_path), final_marked)
        
        return {
            'success': True,
            'file_name': file_id,
            'answers': omr_response,
            'answers_array': resp_array,
            'multi_marked_count': multi_marked,
            'marked_image_path': str(marked_image_path),
            'output_columns': template.output_columns,
            'total_questions': len([k for k in omr_response.keys() if k.startswith('Q')])
        }
        
    except Exception as e:
        import traceback
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'OMR Scanner API',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/process', methods=['POST'])
def process_image():
    """
    Process an OMR image
    
    Request:
        - file: Image file (multipart/form-data)
        - template: (optional) Template ID, defaults to 'dxuian'
        
    Response:
        - success: bool
        - file_name: str
        - answers: dict of question -> answer
        - marked_image: base64 encoded marked image
        - total_questions: int
    """
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type. Allowed: png, jpg, jpeg'
            }), 400
        
        # Get template ID (default to 'dxuian')
        template_id = request.form.get('template', 'dxuian')
        
        # Create session directory
        session_id = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        session_upload_dir = UPLOAD_FOLDER / session_id
        session_result_dir = RESULTS_FOLDER / session_id
        session_upload_dir.mkdir(parents=True, exist_ok=True)
        session_result_dir.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        if not filename:
            filename = f"omr_{session_id}.jpg"
        
        upload_path = session_upload_dir / filename
        file.save(str(upload_path))
        
        # Get template path
        template_path = Path('inputs') / 'template.json'
        if not template_path.exists():
            cleanup_temp_files(session_id)
            return jsonify({
                'success': False,
                'error': f'Template not found: {template_path}'
            }), 404
        
        # Process the image
        result = process_omr_image(upload_path, template_path, session_result_dir)
        
        if not result['success']:
            cleanup_temp_files(session_id)
            return jsonify(result), 400
        
        # Encode marked image to base64
        marked_image_path = Path(result['marked_image_path'])
        marked_image_base64 = None
        
        if marked_image_path.exists():
            with open(marked_image_path, 'rb') as img_file:
                marked_image_base64 = base64.b64encode(img_file.read()).decode('utf-8')
        
        # Prepare response
        response_data = {
            'success': True,
            'session_id': session_id,
            'file_name': result['file_name'],
            'answers': result['answers'],
            'answers_array': result['answers_array'],
            'output_columns': result['output_columns'],
            'total_questions': result['total_questions'],
            'multi_marked_count': result['multi_marked_count'],
            'marked_image': marked_image_base64,
            'timestamp': datetime.now().isoformat()
        }
        
        # Clean up temporary files after a delay (or you can keep them)
        # cleanup_temp_files(session_id)
        
        return jsonify(response_data), 200
        
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/process-base64', methods=['POST'])
def process_image_base64():
    """
    Process an OMR image sent as base64
    
    Request JSON:
        - image: base64 encoded image
        - filename: (optional) original filename
        - template: (optional) Template ID
        
    Response: Same as /api/process
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        # Decode base64 image
        try:
            image_data = base64.b64decode(data['image'])
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Invalid base64 image: {str(e)}'
            }), 400
        
        # Create session directory
        session_id = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        session_upload_dir = UPLOAD_FOLDER / session_id
        session_result_dir = RESULTS_FOLDER / session_id
        session_upload_dir.mkdir(parents=True, exist_ok=True)
        session_result_dir.mkdir(parents=True, exist_ok=True)
        
        # Save image
        filename = data.get('filename', f'omr_{session_id}.jpg')
        filename = secure_filename(filename)
        upload_path = session_upload_dir / filename
        
        with open(upload_path, 'wb') as f:
            f.write(image_data)
        
        # Get template path
        template_id = data.get('template', 'dxuian')
        template_path = Path('inputs') / 'template.json'
        
        if not template_path.exists():
            cleanup_temp_files(session_id)
            return jsonify({
                'success': False,
                'error': f'Template not found: {template_path}'
            }), 404
        
        # Process the image
        result = process_omr_image(upload_path, template_path, session_result_dir)
        
        if not result['success']:
            cleanup_temp_files(session_id)
            return jsonify(result), 400
        
        # Encode marked image to base64
        marked_image_path = Path(result['marked_image_path'])
        marked_image_base64 = None
        
        if marked_image_path.exists():
            with open(marked_image_path, 'rb') as img_file:
                marked_image_base64 = base64.b64encode(img_file.read()).decode('utf-8')
        
        # Prepare response
        response_data = {
            'success': True,
            'session_id': session_id,
            'file_name': result['file_name'],
            'answers': result['answers'],
            'answers_array': result['answers_array'],
            'output_columns': result['output_columns'],
            'total_questions': result['total_questions'],
            'multi_marked_count': result['multi_marked_count'],
            'marked_image': marked_image_base64,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Get list of available templates"""
    try:
        templates = []
        inputs_dir = Path('inputs')
        
        if inputs_dir.exists():
            template_file = inputs_dir / 'template.json'
            if template_file.exists():
                with open(template_file, 'r') as f:
                    template_data = json.load(f)
                    
                templates.append({
                    'id': 'default',
                    'name': 'Default Template',
                    'file': 'inputs/template.json',
                    'pageDimensions': template_data.get('pageDimensions'),
                    'bubbleDimensions': template_data.get('bubbleDimensions'),
                    'fieldBlockCount': len(template_data.get('fieldBlocks', {}))
                })
        
        return jsonify({
            'success': True,
            'templates': templates
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/marked-image/<session_id>/<filename>', methods=['GET'])
def get_marked_image(session_id, filename):
    """Get marked image file"""
    try:
        image_path = RESULTS_FOLDER / session_id / 'CheckedOMRs' / filename
        
        if not image_path.exists():
            return jsonify({
                'success': False,
                'error': 'Image not found'
            }), 404
        
        return send_file(str(image_path), mimetype='image/jpeg')
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# RECTANGLE DETECTION ENDPOINT
# ============================================================================

def validate_image_quality(image):
    """Validate image quality and provide feedback"""
    warnings = []
    
    height, width = image.shape[:2]
    
    # Check resolution
    MIN_WIDTH = 800
    MIN_HEIGHT = 600
    RECOMMENDED_WIDTH = 1920
    RECOMMENDED_HEIGHT = 1080
    
    if width < MIN_WIDTH or height < MIN_HEIGHT:
        return False, [f"Image too small ({width}x{height}). Minimum: {MIN_WIDTH}x{MIN_HEIGHT}"], None
    
    if width < RECOMMENDED_WIDTH or height < RECOMMENDED_HEIGHT:
        warnings.append(f"Low resolution ({width}x{height}). Recommended: {RECOMMENDED_WIDTH}x{RECOMMENDED_HEIGHT}")
    
    # Check brightness
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    
    brightness_status = "Good"
    if mean_brightness < 40:
        warnings.append(f"Image too dark (brightness: {mean_brightness:.1f}/255)")
        brightness_status = "Too Dark"
    elif mean_brightness > 215:
        warnings.append(f"Image too bright (brightness: {mean_brightness:.1f}/255)")
        brightness_status = "Too Bright"
    
    # Check contrast
    std_brightness = np.std(gray)
    if std_brightness < 30:
        warnings.append(f"Low contrast (std: {std_brightness:.1f})")
    
    # Check blur
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    sharpness_status = "Good"
    if laplacian_var < 100:
        warnings.append(f"Image may be blurry (sharpness: {laplacian_var:.1f})")
        sharpness_status = "Blurry"
    
    quality_info = {
        "brightness": float(mean_brightness),
        "brightness_status": brightness_status,
        "contrast": float(std_brightness),
        "sharpness": float(laplacian_var),
        "sharpness_status": sharpness_status
    }
    
    return True, warnings, quality_info

def detect_answer_rectangles(image):
    """Detect rectangles in the image (answer sections)"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 75, 200)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter by area and aspect ratio
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
    
    return rects

def image_to_base64(image):
    """Convert OpenCV image to base64 string"""
    _, buffer = cv2.imencode('.jpg', image)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return img_base64

@app.route('/api/detect-rectangles', methods=['POST'])
def detect_rectangles():
    """
    Detect rectangles (answer sections) in an OMR image
    
    Request JSON:
        - image: base64 encoded image
        - filename: (optional) original filename
    
    Returns:
        - success: boolean
        - rectangles_found: number of rectangles detected
        - selected_rectangle: coordinates and size of selected rectangle
        - detected_image: base64 image with rectangles drawn
        - cropped_image: base64 cropped answer section
        - warnings: list of quality warnings
    """
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        # Decode base64 image
        image_data = base64.b64decode(data['image'])
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({'success': False, 'error': 'Invalid image data'}), 400
        
        height, width = image.shape[:2]
        print(f"📸 Processing image for rectangle detection: {width}x{height}")
        
        # Validate image quality
        is_valid, warnings, quality_info = validate_image_quality(image)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': 'Image quality too low',
                'warnings': warnings
            }), 400
        
        # Detect rectangles
        rects = detect_answer_rectangles(image)
        
        if len(rects) == 0:
            return jsonify({
                'success': False,
                'error': 'No rectangles detected',
                'warnings': ['No clear borders found. Ensure answer section has visible borders.']
            }), 400
        
        print(f"✅ Found {len(rects)} rectangle(s)")
        
        # Draw rectangles for visualization
        output = image.copy()
        for i, (x, y, w, h) in enumerate(rects):
            # Green for last (selected), blue for others
            color = (0, 255, 0) if i == len(rects) - 1 else (255, 0, 0)
            thickness = 4 if i == len(rects) - 1 else 2
            cv2.rectangle(output, (x, y), (x + w, y + h), color, thickness)
            cv2.putText(output, f"#{i+1}", (x, y - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 2)
            print(f"   Rectangle #{i+1}: pos=({x},{y}), size={w}x{h}, area={w*h:,}")
        
        # Crop the last (bottom-most) rectangle - typically the answer section
        x, y, w, h = rects[-1]
        cropped = image[y:y + h, x:x + w]
        
        print(f"✂️  Cropped answer section: {w}x{h}")
        
        # Convert images to base64
        detected_image_base64 = image_to_base64(output)
        cropped_image_base64 = image_to_base64(cropped)
        
        # Prepare response
        response = {
            'success': True,
            'rectangles_found': len(rects),
            'selected_rectangle': {
                'position': {'x': int(x), 'y': int(y)},
                'size': {'width': int(w), 'height': int(h)},
                'area': int(w * h)
            },
            'image_dimensions': f"{width}x{height}",
            'brightness_status': quality_info['brightness_status'],
            'sharpness_status': quality_info['sharpness_status'],
            'warnings': warnings,
            'detected_image': detected_image_base64,
            'cropped_image': cropped_image_base64
        }
        
        print(f"✅ Rectangle detection successful!")
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Rectangle detection error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("OMR Scanner API Server")
    print("=" * 60)
    print("Server starting...")
    print(f"Environment: {'PRODUCTION' if IS_PRODUCTION else 'DEVELOPMENT'}")
    print(f"Upload folder: {UPLOAD_FOLDER.absolute()}")
    print(f"Results folder: {RESULTS_FOLDER.absolute()}")
    print("\nEndpoints:")
    print("  GET  /api/health              - Health check")
    print("  POST /api/detect-rectangles   - Detect answer section rectangles")
    print("  POST /api/process             - Process image (multipart)")
    print("  POST /api/process-base64      - Process image (base64)")
    print("  GET  /api/templates           - List templates")
    
    # Get port from environment variable (Render.com sets PORT)
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    debug = not IS_PRODUCTION
    
    print(f"\nServer will run on: http://{host}:{port}")
    if not IS_PRODUCTION:
        print("For mobile app access: http://<your-ip>:5000")
    print("=" * 60)
    
    # Run server
    # In production, use gunicorn (configured in render.yaml)
    # This is only for local development
    app.run(host=host, port=port, debug=debug)
