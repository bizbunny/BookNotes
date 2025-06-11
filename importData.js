//help import the data in data.json into the database (db)
//create the routes to organize API endpoints
const { db } = require('./db');
const bookData = require('./data/data.json');

async function importData() {
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
                // ADD STUFF
                // Process other content types similarly
                //titles?
                //chapters
                //thoughts
                //questions
                //other stuff?
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
}

//Helper functions for each table insert
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
// ADD STUFF
// Add similar functions for other tables

importData().then(() => {
    console.log("Data import completed");
    db.close();
}).catch(err => {
    console.error("Error during import:", err);
    db.close();
});