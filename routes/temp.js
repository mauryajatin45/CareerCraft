const express = require('express');
const router = express.Router();
const http = require('https');
require('dotenv').config(); // Load environment variables from .env

// Example route that uses the API key securely on the server-side
router.get("/temp", (req, res) => {
    const apiKey = process.env.YOUR_RAPIDAPI_KEY_HERE; // Access the API key securely on the server
    res.render("temp.ejs", { apiKey: apiKey });
});

// Run code route using Judge0 API
router.post("/run-code", (req, res) => {
    const { sourceCode, languageId, stdin, expectedOutput } = req.body;

    const options = {
        method: 'POST',
        hostname: 'judge029.p.rapidapi.com',
        port: null,
        path: '/submissions?base64_encoded=true&wait=false&fields=*',
        headers: {
            'x-rapidapi-key': process.env.YOUR_RAPIDAPI_KEY_HERE, // Use the secure API key from .env
            'x-rapidapi-host': 'judge029.p.rapidapi.com',
            'Content-Type': 'application/json'
        }
    };

    const requestBody = JSON.stringify({
        source_code: sourceCode,  // The source code in base64
        language_id: languageId,  // Language ID
        stdin: stdin,             // Optional stdin input
        expected_output: expectedOutput // Optional expected output
    });

    // Rename the `req` variable here to avoid conflict
    const request = http.request(options, (response) => {
        const chunks = [];

        response.on('data', (chunk) => {
            chunks.push(chunk);
        });

        response.on('end', () => {
            const body = Buffer.concat(chunks);
            const responseBody = body.toString();

            // Check for success or failure in response
            if (response.statusCode === 200) {
                // Success response from Judge0 API
                res.json({ success: true, data: JSON.parse(responseBody) });
            } else {
                // Error response from Judge0 API
                res.status(response.statusCode).json({ success: false, error: responseBody });
            }
        });
    });

    request.on('error', (error) => {
        res.status(500).json({ success: false, error: 'Error running code: ' + error.message });
    });

    // Send the request with the JSON body
    request.write(requestBody);
    request.end();
});

module.exports = {router};
