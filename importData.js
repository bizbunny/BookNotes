//help import the data in data.json into the database (db)
//create the routes to organize API endpoints
const { db } = require('./db');
const bookData = require('./data/data.json');

async function insertChapter(bookId, title) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT OR IGNORE INTO chapters (book_id, title) VALUES (?, ?)",
            [bookId, title],
            function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            }
        );
    });
}

async function insertCharacter(name) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT OR IGNORE INTO characters (name) VALUES (?)",
            [name],
            function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            }
        );
    });
}

async function insertCharacterAppearance(characterId, chapterId, details, note) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT OR REPLACE INTO character_appearances 
             (character_id, chapter_id, details, notes) 
             VALUES (?, ?, ?, ?)`,
            [characterId, chapterId, details, note],
            function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            }
        );
    });
}

async function insertLore(bookId, chapterId, key, value) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO lore (book_id, chapter_id, key, value) 
             VALUES (?, ?, ?, ?)`,
            [bookId, chapterId, key, value],
            function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            }
        );
    });
}

async function insertQuestion(bookId, chapterId, title, content) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO questions (book_id, chapter_id, title, content) 
             VALUES (?, ?, ?, ?)`,
            [bookId, chapterId, title, content],
            function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            }
        );
    });
}

async function initializeDatabase() {//ADD STUFF
    return new Promise((resolve, reject) => {
        // Your existing schema creation code here
        // Make sure to call resolve() when done
        db.serialize(() => {
            // All your CREATE TABLE statements
            resolve();
        });
    });
}

async function importData() {
    try{
        await initializeDatabase();

        for (const bookEntry of bookData) {
        const bookKey = Object.keys(bookEntry)[0];
        const book = bookEntry[bookKey];

        //Insert book
        const bookId = await insertBook(book.title, book.series);
        
        if (book.chapters) {
            for (const [chapterTitle, chapterContent] of Object.entries(book.chapters)) {
                const chapterId = await insertChapter(bookId, chapterTitle);
                
                //Process character notes
                if (chapterContent["Character Notes"]) {
                    for (const [characterName, characterData] of Object.entries(chapterContent["Character Notes"])) {
                        const characterId = await insertCharacter(characterName);
                        await insertCharacterAppearance(
                            characterId, 
                            chapterId, 
                            characterData.details.join('\n'),
                            characterData.note
                        );
                    }
                }
                //lore
                if (chapterContent["Lore"]) {
                    if (Array.isArray(chapterContent["Lore"].notes)) {
                            for (const note of chapterContent["Lore"].notes) {
                                await insertLore(bookId, chapterId, null, note);
                            }
                        } else if (typeof chapterContent["Lore"].notes === 'object') {
                            for (const [key, value] of Object.entries(chapterContent["Lore"].notes)) {
                                const content = Array.isArray(value) ? value.join('\n') : value;
                                await insertLore(bookId, chapterId, key, content);
                            }
                        }
                }
                //questions
                if (chapterContent["Questions"]) {
                    for (const [question, answer] of Object.entries(chapterContent["Questions"])) {
                            await insertQuestion(bookId, chapterId, question, answer);
                        }
                }
            }
        }
        
        // Process thoughts
        if (book.Thoughts) {
            for (const [date, thought] of Object.entries(book.Thoughts)) {
                const content = Array.isArray(thought) ? thought.join('\n') : thought;
                await insertThought(bookId, date, content);
            }
        }
    }
    console.log("Data import completed successfully");
    } catch (err) {
        console.error("Error during import:", err);
    } finally {
        db.close();
    }
    
}

//Helper functions for each table insert
//Book
async function insertBook(title, series) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT OR IGNORE INTO books (title, series) VALUES (?, ?)",
            [title, series],
            function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            }
        );
    });
}

importData().then(() => {
    console.log("Data import completed");
    db.close();
}).catch(err => {
    console.error("Error during import:", err);
    db.close();
});