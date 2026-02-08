const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Just 3 Days API',
            version: '1.0.0',
            description: 'API documentation for Just 3 Days habit formation service',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local server',
            },
            {
                url: 'https://backend-r08l.onrender.com',
                description: 'Render Production Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        nickname: { type: 'string' },
                        email: { type: 'string' }
                    }
                },
                Challenge: {
                    type: 'object',
                    properties: {
                        challengeId: { type: 'string' },
                        title: { type: 'string' },
                        category: { type: 'string' },
                        plan: { type: 'string' },
                        days: {
                            type: 'array',
                            items: { type: 'boolean' }
                        },
                        currentDay: { type: 'integer' },
                        isComplete: { type: 'boolean' }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
