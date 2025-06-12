//This file will be used to separate database operations from route handlers
//Populate this layer (import stuff in) with the stuff from json so client doesn' have to worry about it
//more abstraction
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/table.db');
const config = require('./config');

db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
        book_title,
        chapter_title,
        content,
        type,
        tokenize="porter unicode61"
    )
`);

// Then modify your import script to populate this table
async function updateSearchIndex() {
    await db.run('DELETE FROM search_index');
    
    // Insert all searchable content
    await db.run(`
        INSERT INTO search_index
        SELECT 
            b.title as book_title,
            c.title as chapter_title,
            ca.details as content,
            'character' as type
        FROM character_appearances ca
        JOIN characters ch ON ca.character_id = ch.id
        JOIN chapters c ON ca.chapter_id = c.id
        JOIN books b ON c.book_id = b.id
        
        UNION ALL
        
        -- Add similar inserts for other content types
    `);
}

class BookRepository {//search my database of books. Don't need to look under the hood if you're just looking (and not editing)
    static async getAll() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM books", [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }
    
    static async getById(id) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM books WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }
}

class Database {
    constructor() {
        this.db = new sqlite3.Database(config.database.file);
        this.init();
    }

    init() {
        this.db.serialize(() => {
            // Your schema creation code here
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                resolve(this);
            });
        });
    }
    //ADD STUFF
    // Add get(), all(), etc. methods similarly
}

db.serialize(() => {
    // After creating tables
    db.run('CREATE INDEX IF NOT EXISTS idx_books_title ON books(title)');
    db.run('CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_character_appearances_character_id ON character_appearances(character_id)');
    //...Add more indexes as needed

    //ADD STUFF?
});

module.exports = {
    BookRepository, 
    
}, new Database();