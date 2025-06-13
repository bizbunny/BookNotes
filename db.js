//This file will be used to separate database operations from route handlers
//Populate this layer (import stuff in) with the stuff from json so client doesn' have to worry about it
//more abstraction
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/table.db');
const config = require('./config');

//Initialize database
function initializeDatabase(){
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            //books table
            db.run(`CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                series TEXT,
                cover_image TEXT,
                UNIQUE(title)
            )`);
            
            //chapters table
            db.run(`CREATE TABLE IF NOT EXISTS chapters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE,
                UNIQUE(book_id, title)
            )`);
            
            //character table
            db.run(`CREATE TABLE IF NOT EXISTS characters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                UNIQUE(name)
            )`);
        
            //character appearances table
            db.run(`CREATE TABLE IF NOT EXISTS character_appearances (
                character_id INTEGER NOT NULL,
                chapter_id INTEGER NOT NULL,
                details TEXT,
                notes TEXT,
                FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE,
                FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
                PRIMARY KEY (character_id, chapter_id)
            )`);
        
            //lore table
            db.run(`CREATE TABLE IF NOT EXISTS lore (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_id INTEGER NOT NULL,
                chapter_id INTEGER,
                key TEXT,
                value TEXT NOT NULL,
                FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE,
                FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
            )`);
        
            //thoughts able
            db.run(`CREATE TABLE IF NOT EXISTS thoughts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                content TEXT NOT NULL,
                FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
            )`);
        
            //questions table
            db.run(`CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_id INTEGER NOT NULL,
                chapter_id INTEGER,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE,
                FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
            )`);
        
            //dragons table (For Empyrean series)
            db.run(`CREATE TABLE IF NOT EXISTS dragons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                color TEXT,
                species TEXT,
                signet TEXT,
                rider_id INTEGER,
                FOREIGN KEY(rider_id) REFERENCES characters(id) ON DELETE SET NULL,
                UNIQUE(name)
            )`);
        
            console.log("Database tables initialized");
            resolve();
        });
    })
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

module.exports = {
    BookRepository, 
    db,
    initializeDatabase
};