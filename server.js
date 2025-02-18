const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Quick response endpoints
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('/', (req, res) => {
    res.status(200).send('Server is running');
});

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();  // No content response for favicon
});

// Start server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle server timeouts
server.keepAliveTimeout = 61 * 1000;
server.headersTimeout = 65 * 1000;

// Basic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
