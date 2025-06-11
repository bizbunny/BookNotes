const express = require('express');
const app = express();
const bookData = require('./data/data.json');

function performFullSearch(query) {
    const results = [];
    
    bookData.forEach(bookData => {
        const bookKey = Object.keys(bookData)[0];
        const book = bookData[bookKey];
        
        //Search book title
        if (book.title && book.title.toLowerCase().includes(query)) {
            results.push({
                book: book.title,
                type: 'Book Title',
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
                        type: 'Thought',
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
                                type: 'Character Note',
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
                                    type: 'Lore Note',
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
                                    type: 'Lore Entry',
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
                                type: 'Question',
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

app.get('/api/search', (req, res) => {
    const query = req.query.q.toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const filters = {
        book: req.query.book,
        type: req.query.type,
        chapter: req.query.chapter
    };
    
    //accept filters
    const allResults = performFullSearch(query, filters);
    
    //Calculate pagination values
    const totalItems = allResults.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    //Slice the results for the current page
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedResults = allResults.slice(startIndex, endIndex);
    
    //Return paginated response
    res.json({
        results: paginatedResults,
        pagination: {
            currentPage: page,
            pageSize: pageSize,
            totalItems: totalItems,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    });
});

app.listen(3000, () => console.log('Server running'));