//This will help add API documentation

//https://swagger.io/docs/
//https://www.ibm.com/docs/en/app-connect/11.0.0?topic=apis-swagger
//https://www.techtarget.com/searchapparchitecture/definition/Swagger
//Swagger allows you to describe the structure of your APIs so that machines can read them.
//Swagger helps users build, document, test and consume RESTful web services. It can be used with both a top-down and bottom-up API development approach. In the top-down, or design-first, method, Swagger can be used to design an API before any code is written.
//The Swagger framework allows developers to create interactive, machine and human-readable API documentation.

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Book Notes API',
            version: '1.0.0',
            description: 'API for managing book notes and related data',
        },
    },
    apis: ['./routes/*.js'], //files containing annotations
};

const specs = swaggerJsdoc(options);

module.exports = specs;