const express = require('express');
const path = require('path');
const cors = require('cors');
const SearchService = require('./services/searchService');
const bookData = require('./public/data/data.json');

const app = express();

//Middleware
app.use(cors()); //Enable CORS for development
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); //Serve static files

//API Routes
app.get('/api/search', async (req, res) => {
    try {
        const { q: query = '', book = '', type = '', page = 1 } = req.query;
        const pageSize = 10;

        //Use the SearchService for database searches
        //const results = await SearchService.search(query, { book, type }, page, pageSize);
        
        //Or use the client-side search as fallback (for now)
        const results = performFullSearch(query.toLowerCase());
        
        //Apply filters
        let filteredResults = results;
        if (book) {
            filteredResults = filteredResults.filter(r => {
                const bookDataItem = bookData.find(b => {
                    const bookKey = Object.keys(b)[0];
                    return b[bookKey].title === r.book;
                });
                
                if (!bookDataItem) return false;
                
                const bookKey = Object.keys(bookDataItem)[0];
                const currentBook = bookDataItem[bookKey];  // <-- Changed to currentBook
                
                return currentBook.series === book || currentBook.title === book;
            });
        }
        
        if (type) {
            filteredResults = filteredResults.filter(r => r.type.includes(type));
        }
        
        //Pagination
        const totalItems = filteredResults.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        const paginatedResults = filteredResults.slice(
            (page - 1) * pageSize,
            page * pageSize
        );

        res.json({
            results: paginatedResults,
            query: query,
            pagination: {
                currentPage: parseInt(page),
                pageSize,
                totalItems,
                totalPages
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

//Client-side search function (same as in your searchService.js)
function performFullSearch(query) {
    const results = [];
    
    bookData.forEach(bookData => {
        const bookKey = Object.keys(bookData)[0];
        const book = bookData[bookKey];
        
        //Search book title
        if (book.title && book.title.toLowerCase().includes(query)) {
            results.push({
                book: book.title,
                type: 'book',
                content: book.title,
                chapter: null
            });
        }
        
        //Search thoughts
        if (book.Thoughts) {
            Object.entries(book.Thoughts).forEach(([date, thought]) => {
                const thoughtText = Array.isArray(thought) ? thought.join(' ') : thought;
                if (thoughtText.toLowerCase().includes(query)) {
                    results.push({
                        book: book.title,
                        type: 'thought',
                        content: thoughtText,
                        chapter: null,
                        date: date
                    });
                }
            });
        }
        
        //Search chapters
        if (book.chapters) {
            Object.entries(book.chapters).forEach(([chapterTitle, chapterContent]) => {
                //Search character notes
                if (chapterContent["Character Notes"]) {
                    Object.entries(chapterContent["Character Notes"]).forEach(([character, notes]) => {
                        const allDetails = notes.details.join(' ');
                        if (allDetails.toLowerCase().includes(query) || 
                            (notes.note && notes.note.toLowerCase().includes(query))) {
                            results.push({
                                book: book.title,
                                type: 'character',
                                content: notes.note ? `${allDetails} ${notes.note}` : allDetails,
                                chapter: chapterTitle,
                                character: character
                            });
                        }
                    });
                }
                
                //Search lore
                if (chapterContent["Lore"]) {
                    if (Array.isArray(chapterContent["Lore"].notes)) {
                        chapterContent["Lore"].notes.forEach(note => {
                            if (note.toLowerCase().includes(query)) {
                                results.push({
                                    book: book.title,
                                    type: 'lore',
                                    content: note,
                                    chapter: chapterTitle
                                });
                            }
                        });
                    } else if (typeof chapterContent["Lore"].notes === 'object') {
                        Object.entries(chapterContent["Lore"].notes).forEach(([key, value]) => {
                            const loreText = Array.isArray(value) ? value.join(' ') : value;
                            if (loreText.toLowerCase().includes(query) || key.toLowerCase().includes(query)) {
                                results.push({
                                    book: book.title,
                                    type: 'lore',
                                    content: `${key}: ${loreText}`,
                                    chapter: chapterTitle
                                });
                            }
                        });
                    }
                }
                
                //Search questions
                if (chapterContent["Questions"]) {
                    Object.entries(chapterContent["Questions"]).forEach(([question, answer]) => {
                        if (question.toLowerCase().includes(query) || answer.toLowerCase().includes(query)) {
                            results.push({
                                book: book.title,
                                type: 'question',
                                content: `${question}: ${answer}`,
                                chapter: chapterTitle
                            });
                        }
                    });
                }
            });
        }
    });
    
    return results;
}

//Book list endpoint (for the book filter dropdown)
app.get('/api/books', (req, res) => {
    const filterOptions = new Set();
    
    bookData.forEach(bookDataItem => {
        const bookKey = Object.keys(bookDataItem)[0];
        const book = bookDataItem[bookKey];
        
        //Skip books marked as "not read yet"
        if (book.title && book.title.includes("(not read yet)")) {
            return;
        }
        
        //Add series name if it exists, otherwise add book title
        if (book.series) {
            filterOptions.add(book.series);
        } else if (book.title) {
            filterOptions.add(book.title);
        }
    });
    
    //Convert Set to array and sort alphabetically
    const sortedOptions = Array.from(filterOptions).sort();
    res.json(sortedOptions);
});

//Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`- GET /api/search?q=query&book=filter&type=filter&page=1`);
    console.log(`- GET /api/books`);
});