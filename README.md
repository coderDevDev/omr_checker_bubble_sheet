# OMRChecker - Automated OMR Sheet Checker

An intelligent **Optical Mark Recognition (OMR)** system that automatically reads and grades bubble sheets using computer vision. Process exam answer sheets, surveys, and other bubble-based forms with high accuracy and speed.

---

## 🎯 What is OMRChecker?

OMRChecker is a Python-based application that:

- **Reads scanned or photographed OMR sheets** (bubble answer sheets)
- **Detects marked bubbles** automatically using computer vision
- **Evaluates responses** against answer keys
- **Exports results** to CSV files for easy analysis

Think of it as an automatic grading assistant that saves hours of manual checking!

---

## 📋 Table of Contents

- [What OMRChecker Does](#-what-omrchecker-does)
- [How It Works](#-how-it-works)
- [Key Features](#-key-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Output Files](#-output-files)
- [Technology Stack](#-technology-stack)
- [License](#-license)

---

## 💡 What OMRChecker Does

### Input

- Scanned images or photos of OMR sheets (PNG, JPG, JPEG)
- Template configuration file (`template.json`) defining bubble locations
- Optional answer key for automatic grading (`evaluation.json`)

### Output

- **CSV files** with detected responses and scores
- **Visual overlays** showing which bubbles were detected
- **Error reports** for problematic sheets
- **Processing statistics** (speed, accuracy)

### Real-World Example

```
1. Teacher creates answer sheet with bubbles
2. Students fill in their answers
3. Teacher scans/photographs the completed sheets
4. Runs: python main.py -i scans/
5. Gets CSV with all student names, answers, and scores
```

---

## 🔄 How It Works

### Complete Processing Pipeline

```
Input Image → Pre-processing → Alignment → Detection → Evaluation → Output
```

### Detailed Step-by-Step Process

#### 1. **Image Loading**

- Reads OMR sheet images from specified directory
- Supports scanner quality and mobile phone photos
- Handles various angles and lighting conditions

#### 2. **Pre-processing**

- Resizes images to standard dimensions
- Applies filters (crop markers, page alignment)
- Normalizes brightness and contrast
- Removes shadows and artifacts

#### 3. **Auto-Alignment** (Optional)

- Detects template shifts and rotations
- Corrects misalignments from scanning
- Uses morphological operations to find edges
- Aligns bubble regions precisely

#### 4. **Bubble Detection**

- Analyzes intensity of each bubble region
- Calculates **global threshold** across all bubbles
- Calculates **local thresholds** for each question strip
- Determines which bubbles are marked vs. unmarked
- Uses adaptive algorithms for different paper/scan quality

#### 5. **Response Extraction**

- Maps detected bubbles to question answers
- Handles multi-marked bubbles (errors)
- Concatenates roll numbers and responses
- Creates structured response dictionary

#### 6. **Evaluation** (if answer key provided)

- Compares responses to correct answers
- Calculates scores using marking schemes
- Supports:
  - Single correct answers
  - Multiple correct answers
  - Weighted scoring
  - Custom marking schemes per section
  - Bonus sections

#### 7. **Output Generation**

- Creates visual overlays showing detected bubbles
- Generates CSV files with results
- Separates error files (multi-marked, unreadable)
- Provides processing statistics

---

## 🌟 Key Features

| Feature                 | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| **Fast**                | Processes 200+ OMR sheets per minute                                 |
| **Accurate**            | ~100% accurate on scanner images, ~90% on mobile photos              |
| **Robust**              | Handles xeroxed sheets, low resolution (640x480+), varying lighting  |
| **Flexible Input**      | Works with scanner images OR phone photos at any angle               |
| **Customizable**        | Easy template configuration for any OMR layout                       |
| **Auto-Alignment**      | Corrects misalignments automatically                                 |
| **Visual Debug**        | Shows step-by-step processing for troubleshooting                    |
| **Error Handling**      | Identifies and separates problematic sheets                          |
| **Advanced Evaluation** | Supports weighted answers, multiple correct answers, custom sections |

---

## 📦 Installation

### Prerequisites

- **Python 3.5+**
- **OpenCV 4.0.0+**
- **pip** (Python package manager)

### Step 1: Install Python Dependencies

```bash
# Check if Python and pip are installed
python3 --version
python3 -m pip --version

# Install OpenCV
python3 -m pip install --user --upgrade pip
python3 -m pip install --user opencv-python
python3 -m pip install --user opencv-contrib-python
```

### Step 2: Clone Repository

```bash
git clone https://github.com/Udayraj123/OMRChecker
cd OMRChecker/
```

### Step 3: Install Project Dependencies

```bash
python3 -m pip install --user -r requirements.txt
```

---

## 🚀 Quick Start

### 1. Try Sample Data

```bash
# Copy sample data to inputs folder
cp -r ./samples/sample1 inputs/

# Run OMRChecker
python3 main.py
```

### 2. Check Results

Results will be generated in the `outputs/` folder:

- `Results.csv` - All responses and scores
- `CheckedOMRs/` - Visual images with detected bubbles
- `ErrorFiles/` - Problematic sheets

---

## 📖 Usage

### Basic Command

```bash
python3 main.py
```

### Command-Line Arguments

```bash
python3 main.py [--inputDir DIR] [--outputDir DIR] [--setLayout] [--autoAlign]
```

| Argument      | Short | Description                                                           |
| ------------- | ----- | --------------------------------------------------------------------- |
| `--inputDir`  | `-i`  | Input directory with OMR images and template.json (default: `inputs`) |
| `--outputDir` | `-o`  | Output directory for results (default: `outputs`)                     |
| `--setLayout` | `-l`  | Launch interactive layout editor to configure template                |
| `--autoAlign` | `-a`  | Enable automatic alignment for misaligned scans                       |
| `--debug`     | `-d`  | Enable debugging mode with detailed errors                            |

### Examples

```bash
# Process custom input directory
python3 main.py -i scans/ -o results/

# Set up template layout interactively
python3 main.py -l -i inputs/

# Enable auto-alignment for misaligned scans
python3 main.py -a -i inputs/

# Process multiple directories
python3 main.py -i folder1/ folder2/ folder3/
```

---

## ⚙️ Configuration

### Required Files in Input Directory

1. **template.json** - Defines OMR sheet layout

   - Bubble positions
   - Field blocks (question groups)
   - Page dimensions
   - Pre-processors

2. **OMR Images** - PNG/JPG files to process

3. **evaluation.json** (Optional) - For automatic grading
   - Answer key
   - Marking schemes
   - Scoring rules

### Template Configuration

Create `template.json` to define your OMR layout:

```json
{
  "pageDimensions": [900, 1200],
  "bubbleDimensions": [30, 30],
  "fieldBlocks": {
    "q1-10": {
      "origin": [100, 200],
      "bubblesPerRow": 4,
      "labelsGap": 50
    }
  }
}
```

Use the **Interactive Layout Editor** to configure visually:

```bash
python3 main.py -l -i inputs/
```

---

## 📂 Output Files

### Directory Structure

```
outputs/
├── Results_HHMMSS.csv          # Main results file
├── CheckedOMRs/                # Visual verification images
│   ├── studentsheet1.jpg
│   └── studentsheet2.jpg
├── Manual/
│   ├── ErrorFiles/             # Unreadable sheets
│   ├── MultiMarkedFiles/       # Multiple bubbles marked
│   └── *.csv files
└── Evaluation/                 # Detailed scoring (if enabled)
    └── *_evaluation.csv
```

### Results CSV Format

| Column          | Description                        |
| --------------- | ---------------------------------- |
| `file_name`     | Original image filename            |
| `file_path`     | Input file path                    |
| `output_path`   | Output file path                   |
| `score`         | Total score (if evaluated)         |
| `q1`, `q2`, ... | Detected answers for each question |
| `roll_number`   | Student roll number (if present)   |

---

## 🔧 Technology Stack

### Core Technologies

- **Python 3.5+** - Programming language
- **OpenCV** - Computer vision and image processing
- **NumPy** - Numerical computations
- **Pandas** - Data manipulation and CSV export
- **Matplotlib** - Visualization and debugging

### Computer Vision Algorithms

- **Morphological Operations** - Edge detection and alignment
- **Adaptive Thresholding** - Bubble detection
- **CLAHE** - Contrast enhancement
- **Template Matching** - Alignment correction

### Key Processing Modules

| Module              | Function                                 |
| ------------------- | ---------------------------------------- |
| `main.py`           | CLI entry point and argument parsing     |
| `src/entry.py`      | Main processing coordinator              |
| `src/core.py`       | Core bubble detection algorithms         |
| `src/template.py`   | Template configuration handler           |
| `src/evaluation.py` | Answer evaluation and scoring            |
| `src/processors/`   | Image pre-processors (crop, align, etc.) |

---

## 📊 Performance

- **Processing Speed**: 200+ OMR sheets per minute
- **Accuracy**:
  - Scanner images: ~100%
  - Mobile photos: ~90%
- **Min Resolution**: 640x480 pixels
- **Supported Formats**: PNG, JPG, JPEG

---

## 🛠️ Advanced Features

### 1. Multiple Correct Answers

```json
"answers_in_order": [["A", "B"], "C", "D"]
```

### 2. Weighted Scoring

```json
"answers_in_order": [[["A", 2], ["B", 1]], "C"]
```

### 3. Custom Marking Schemes

```json
"marking_schemes": {
  "section1": {
    "questions": "q1-q20",
    "marking": {
      "correct": 4,
      "incorrect": -1,
      "unmarked": 0
    }
  }
}
```

### 4. Visual Debug Levels

Set in `config.json`:

- `show_image_level: 0` - No visuals (fastest)
- `show_image_level: 2` - Detected bubbles
- `show_image_level: 6` - Full debugging visuals

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Bubbles not detected correctly

- **Solution**: Run layout mode: `python3 main.py -l -i inputs/`

**Issue**: Misaligned templates

- **Solution**: Enable auto-align: `python3 main.py -a -i inputs/`

**Issue**: Low accuracy on mobile photos

- **Solution**: Ensure good lighting, straight angle, no shadows

---

## 🤝 Contributing

This is an open-source project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Udayraj Deshmukh**

- GitHub: [@Udayraj123](https://github.com/Udayraj123)
- Project: [OMRChecker](https://github.com/Udayraj123/OMRChecker)

---

## 🙏 Acknowledgments

Originally developed for [Technothlon](https://technothlon.techniche.org.in), a logic-based international school championship organized by IIT Guwahati students.

Special thanks to:

- Adrian Rosebrock (PyImageSearch)
- Harrison Kinsley (sentdex)
- Satya Mallic (LearnOpenCV)
- All contributors worldwide

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Udayraj123/OMRChecker/issues)
- **Discord**: [Join Community](https://discord.gg/qFv2Vqf)
- **Wiki**: [Documentation](https://github.com/Udayraj123/OMRChecker/wiki)

---

**Made with ❤️ by the Open Source Community**
#   o m r _ b u b b l e _ s h e e t _ c h e c k e r  
 #   o m r _ c h e c k e r _ b u b b l e _ s h e e t  
 