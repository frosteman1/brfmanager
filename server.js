const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Root path
app.get('/', (req, res) => {
    res.status(200).send('Server is running');
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// Keep the process alive
process.stdin.resume();

// Basic error handling
process.on('SIGTERM', () => {
    console.log('Received SIGTERM');
    process.exit(0);
});
