# OMR Web Scanner - Integration Guide

This guide shows how to integrate the OMR Scanner with React.js and Tailwind CSS for web-based OMR processing.

## 🏗️ Architecture Overview

```
Frontend (React + Tailwind) ↔ Backend API (Python Flask) ↔ OMR Engine
     ↓                              ↓                    ↓
- Image Upload UI              - Flask API              - Core OMR Logic
- Results Display              - File Processing        - Template System
- Real-time Feedback           - Image Processing       - Detection Algorithms
```

## 🚀 Quick Start

### 1. Backend Setup (Python Flask API)

```bash
# Navigate to backend directory
cd OMRChecker/web_backend

# Install Python dependencies
pip install -r requirements.txt

# Install main OMR dependencies (from parent directory)
cd ..
pip install -r requirements.txt

# Run the Flask API server
cd web_backend
python app.py
```

The backend will be available at `http://localhost:5000`

### 2. Frontend Setup (React + Tailwind)

```bash
# Navigate to frontend directory
cd OMRChecker/web_frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at `http://localhost:3000`

## 📁 Project Structure

```
OMRChecker/
├── web_backend/
│   ├── app.py                 # Flask API server
│   └── requirements.txt       # Python dependencies
├── web_frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Header.js
│   │   │   ├── TemplateUpload.js
│   │   │   ├── ImageUpload.js
│   │   │   ├── ResultsDisplay.js
│   │   │   └── ProcessingStatus.js
│   │   ├── services/
│   │   │   └── api.js         # API service functions
│   │   ├── App.js             # Main React app
│   │   └── index.js           # React entry point
│   ├── public/
│   ├── package.json           # Node.js dependencies
│   └── tailwind.config.js     # Tailwind configuration
└── README_WEB_INTEGRATION.md  # This file
```

## 🔧 Features

### Frontend Features

- **Drag & Drop Upload**: Intuitive file upload interface
- **Template Management**: Upload and validate OMR templates
- **Batch Processing**: Process multiple OMR images at once
- **Real-time Status**: Live processing feedback and progress
- **Results Display**: Comprehensive results table with export
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: User-friendly error messages and validation

### Backend Features

- **RESTful API**: Clean API endpoints for all operations
- **File Processing**: Handle image uploads and template validation
- **OMR Integration**: Full integration with existing OMR engine
- **Error Handling**: Comprehensive error handling and logging
- **CORS Support**: Cross-origin requests for frontend integration

## 🛠️ API Endpoints

### Template Management

- `POST /api/template/upload` - Upload OMR template
- `GET /api/health` - Health check

### Image Processing

- `POST /api/omr/process` - Process single OMR image
- `POST /api/omr/batch-process` - Process multiple OMR images

### Configuration

- `GET /api/config` - Get current configuration
- `POST /api/config` - Update configuration

## 🎨 UI Components

### TemplateUpload Component

- Drag & drop JSON template upload
- Template validation and preview
- Visual feedback for upload status

### ImageUpload Component

- Single image or batch upload modes
- Drag & drop image interface
- File type and size validation
- Upload tips and guidelines

### ResultsDisplay Component

- Comprehensive results table
- Status indicators (success, multi-marked, error)
- Detailed view modal
- CSV export functionality
- Summary statistics

### ProcessingStatus Component

- Real-time progress tracking
- Visual progress bar
- Processing step indicators
- Status messages

## 🔧 Configuration

### Backend Configuration

The Flask backend can be configured through environment variables:

```bash
export FLASK_ENV=development
export FLASK_DEBUG=1
export MAX_CONTENT_LENGTH=16777216  # 16MB max file size
```

### Frontend Configuration

Update the API base URL in `src/services/api.js`:

```javascript
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## 🚀 Deployment

### Backend Deployment (Heroku/Cloud)

```bash
# Create Procfile for Heroku
echo "web: gunicorn app:app" > Procfile

# Deploy to Heroku
heroku create your-omr-scanner-api
git push heroku main
```

### Frontend Deployment (Netlify/Vercel)

```bash
# Build the React app
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=build
```

## 🔒 Security Considerations

1. **File Upload Security**:

   - Validate file types and sizes
   - Scan uploaded files for malware
   - Use secure file storage

2. **API Security**:

   - Implement rate limiting
   - Add authentication/authorization
   - Use HTTPS in production

3. **Data Privacy**:
   - Don't store uploaded images permanently
   - Clear temporary files after processing
   - Implement data retention policies

## 🧪 Testing

### Backend Testing

```bash
cd web_backend
python -m pytest tests/
```

### Frontend Testing

```bash
cd web_frontend
npm test
```

## 📱 Mobile Support

The web interface is fully responsive and works on mobile devices:

- Touch-friendly drag & drop
- Mobile-optimized file selection
- Responsive table layouts
- Touch gestures for navigation

## 🔄 Integration with Existing OMR System

This web integration maintains full compatibility with the existing OMR system:

- Uses the same template format
- Compatible with all field types
- Supports all preprocessing options
- Maintains the same detection algorithms

## 🐛 Troubleshooting

### Common Issues

1. **Backend not starting**:

   - Check Python dependencies
   - Verify port 5000 is available
   - Check for import errors

2. **Frontend API errors**:

   - Verify backend is running
   - Check CORS configuration
   - Validate API endpoints

3. **File upload issues**:
   - Check file size limits
   - Verify file type support
   - Check network connectivity

### Debug Mode

Enable debug mode in both frontend and backend for detailed error messages.

## 📈 Performance Optimization

1. **Image Compression**: Implement client-side image compression
2. **Caching**: Add Redis caching for processed results
3. **CDN**: Use CDN for static assets
4. **Database**: Add database for result persistence

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This web integration follows the same MIT license as the main OMR project.
