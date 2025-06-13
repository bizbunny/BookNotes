//Get data from data.json using db.js
const { BookRepository } = require('../db/db');
const { db } = require('../db/db');
const testData = require('./testData.json');

describe('BookRepository', () => {
    beforeAll(async () => {
        //Set up test database with test data
        await db.run('DELETE FROM books');
        await Promise.all(
            testData.map(book => 
                db.run(
                    'INSERT INTO books (title, series) VALUES (?, ?)',
                    [book.title, book.series]
                )
            )
        );
    });
    
    afterAll(async () => {
        await db.run('DELETE FROM books');
        db.close();
    });
    
    test('getAll returns all books', async () => {
        const books = await BookRepository.getAll();
        expect(books).toBeInstanceOf(Array);
        expect(books.length).toBe(testData.length);
    });
    
    test('getById returns correct book', async () => {
        const testBook = testData[0];
        const book = await BookRepository.getById(1); //Assuming first book has ID 1
        expect(book.title).toBe(testBook.title);
        expect(book.series).toBe(testBook.series);
    });
    
    test('getById returns undefined for non-existent id', async () => {
        const book = await BookRepository.getById(999);
        expect(book).toBeUndefined();
    });
});