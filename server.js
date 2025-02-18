const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

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
const PORT = process.env.PORT || 3002; // Matcha Railway's port
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('IPv6 enabled:', process.env.IPv6);
});

// Increase timeouts
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
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

// Keep process alive
process.stdin.resume();
