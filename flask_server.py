from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
import requests
import io
import PyPDF2

app = Flask(__name__)

# MongoDB configuration (update with your actual connection details)
MONGO_URI = "mongodb://localhost:27017/"
client = MongoClient(MONGO_URI)
db = client['your_database']          # Replace with your database name
collection = db['your_collection']    # Replace with your collection name

try:
    EXTERNAL_API_URL = "https://magicloops.dev/api/loop/fe2ef75f-80fa-4d1c-82a6-ca4ebf4089a6/run"
    API_KEY = "magic_loop_api"         # Replace with your actual API key
except Exception as e:
    print(f"Error loading external API configuration: {str(e)}")

@app.route('/process_resume/<doc_id>', methods=['GET'])
def process_resume(doc_id):
    # Try to convert the document ID to an ObjectId
    try:
        object_id = ObjectId(doc_id)
    except Exception as e:
        return jsonify({'error': 'Invalid document ID format', 'details': str(e)}), 400

    # Retrieve the document from MongoDB
    doc = collection.find_one({'_id': object_id})
    if not doc:
        return jsonify({'error': 'Document not found'}), 404

    # Expect the MongoDB document to have a 'pdf_url' field
    pdf_url = doc.get('pdf_url')
    if not pdf_url:
        return jsonify({'error': 'No PDF url found in document'}), 400

    # Download the PDF
    pdf_response = requests.get(pdf_url)
    if pdf_response.status_code != 200:
        return jsonify({'error': 'Could not download PDF', 'status_code': pdf_response.status_code}), 400

    # Extract text from the PDF using PyPDF2
    try:
        pdf_file = io.BytesIO(pdf_response.content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        extracted_text = ""
        for page in pdf_reader.pages:
            extracted_text += page.extract_text() or ""
    except Exception as e:
        return jsonify({'error': 'Error processing PDF', 'details': str(e)}), 500

    # Build the JSON payload
    payload = { "resume": extracted_text }
    
    # Set up the headers (including the API key if the external API requires it)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    # Send the POST request to the external API
    try:
        external_response = requests.post(EXTERNAL_API_URL, json=payload, headers=headers)
        external_response.raise_for_status()
    except Exception as e:
        return jsonify({'error': 'Error sending payload to external API', 'details': str(e)}), 500

    # Return the response received from the external API
    try:
        result = external_response.json()
    except Exception:
        result = {'response_text': external_response.text}
        
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
