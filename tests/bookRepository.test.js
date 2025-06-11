//get data from data.json using db.js
const { BookRepository } = require('../db');
const { db } = require('../db');

describe('BookRepository', () => {
    beforeAll(async () => {
        // Set up test database
        //ADD STUFF
    });
    
    afterAll(async () => {
        // Clean up
        db.close();
    });
    
    test('getAll returns all books', async () => {
        const books = await BookRepository.getAll();
        expect(books).toBeInstanceOf(Array);
        expect(books.length).toBeGreaterThan(0);
    });
    
    // Add more tests
    //ADD STUFF
});