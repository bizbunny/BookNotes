//helps to organize endpoints using Express Router to maintain this site better
//business logic
//services will help with addtitional abstraction to not have other stuff handle too much, divy the responsiblities basically
const express = require('express');
const router = express.Router();
const { BookRepository } = require('../db/db');//look into general database without having to know how the database looks like inside
const SearchService = require('../services/searchService');//using the search enhancer

//Get all books
router.get('/', async (req, res) => {
    try {
        const books = await BookRepository.getAll();
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Search endpoint
router.get('/search', async (req, res) => {
    try {
        const { q, book, type, page = 1, pageSize = 10 } = req.query;
        const results = await SearchService.search(q, { book, type }, parseInt(page), parseInt(pageSize));
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;