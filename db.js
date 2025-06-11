//This file will be used to separate database operations from route handlers
//Populate this layer (import stuff in) with the stuff from json so client doesn' have to worry about it
//more abstraction
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/table.db');

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
    
};