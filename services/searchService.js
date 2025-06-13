//search enhancer for more complex query cases
//data access layer
//creates repo for each thingy like character, lore, thoughts, questions
const { db } = require('../db/db');
class SearchService {
    static async search(query, filters = {}, page = 1, pageSize = 10) {
        //Build the base query
        let baseQuery = `
            SELECT 
                b.title as book_title,
                c.title as chapter_title,
                'character' as type,
                ch.name as character_name,
                ca.details as content
            FROM character_appearances ca
            JOIN characters ch ON ca.character_id = ch.id
            JOIN chapters c ON ca.chapter_id = c.id
            JOIN books b ON c.book_id = b.id
            WHERE ca.details LIKE ?
            
            UNION ALL
            
            SELECT 
                b.title as book_title,
                c.title as chapter_title,
                'lore' as type,
                l.key as lore_key,
                l.value as content
            FROM lore l
            JOIN books b ON l.book_id = b.id
            LEFT JOIN chapters c ON l.chapter_id = c.id
            WHERE l.value LIKE ? OR l.key LIKE ?
            
            UNION ALL
            
            SELECT 
                b.title as book_title,
                NULL as chapter_title,
                'thought' as type,
                t.date as thought_date,
                t.content as content
            FROM thoughts t
            JOIN books b ON t.book_id = b.id
            WHERE t.content LIKE ?
            
            UNION ALL
            
            SELECT 
                b.title as book_title,
                c.title as chapter_title,
                'question' as type,
                q.title as question_title,
                q.content as content
            FROM questions q
            JOIN books b ON q.book_id = b.id
            LEFT JOIN chapters c ON q.chapter_id = c.id
            WHERE q.content LIKE ? OR q.title LIKE ?
        `;
        
        //filters
        const params = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];
        
        if (filters.book) {
            baseQuery += " AND b.title = ?";
            params.push(filters.book);
        }
        
        if (filters.type) {
            baseQuery += " AND type = ?";
            params.push(filters.type);
        }
        
        //pagination
        const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery})`;
        const paginatedQuery = `${baseQuery} LIMIT ? OFFSET ?`;
        
        const total = await new Promise((resolve, reject) => {
            db.get(countQuery, params, (err, row) => {
                if (err) reject(err);
                resolve(row.total);
            });
        });
        
        const paginatedParams = [...params, pageSize, (page - 1) * pageSize];
        const results = await new Promise((resolve, reject) => {
            db.all(paginatedQuery, paginatedParams, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
        
        return {
            results,
            pagination: {
                currentPage: page,
                pageSize,
                totalItems: total,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }
}

module.exports = SearchService;