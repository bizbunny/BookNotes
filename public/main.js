const bookCoverImages = {
    "Fourth Wing": "/images/bookCovers_FW.webp",
    "Iron Flame": "/images/bookCovers_IF.webp",
    "Onyx Storm": "/images/bookCovers_OS.webp",
    "The Faceless Old Woman":"/images/bookCovers_FOW.webp",
    "AngelMaker":"/images/bookCovers_AM.webp",
    "Heaven Official's Blessing 1":"/images/bookCovers_HOB1.webp",
    "Heaven Official's Blessing 2":"/images/bookCovers_HOB2.webp"
};

//Function to extract dragon information from character notes
function extractDragonsFromCharacterNotes(characterCompendium) {
    const dragonCompendium = {};
    
    for (const [characterName, characterData] of Object.entries(characterCompendium)) {
        //Skip human-only characters that shouldn't be dragons
        if (['Reagan', 'Fen Riorson'].includes(characterName)) {
            continue;
        }

        characterData.details.forEach(detail => {
            if (detail.includes("human") || detail.includes("character") || 
                detail.includes("mother") || detail.includes("father")) {
                return;
            }

            const dragonNameMatch = detail.match(/(?:dragon's name is|named|name is) (\w+)/i);
            const dragonName = dragonNameMatch ? dragonNameMatch[1] : null;
            
            const dragonColorMatch = detail.match(/(\w+) dragon/i) || 
                                   detail.match(/(?:is|was) (?:a )?(\w+(?: \w+)?)(?: dragon| scales|,|$)/i);
            let dragonColor = dragonColorMatch ? dragonColorMatch[1].replace(/,$/, '') : 'unknown';
            
            if (['his', 'her', 'their'].includes(dragonColor.toLowerCase())) {
                dragonColor = 'unknown';
            }
            
            const speciesMatch = detail.match(/species:? (\w+[\s\w]*)/i);
            let species = speciesMatch ? speciesMatch[1] : 'unknown';
            
            if (species.toLowerCase().startsWith('red ')) {
                species = species.substring(4);
            }

            if (dragonName) {
                if (!dragonCompendium[dragonName]) {
                    dragonCompendium[dragonName] = {
                        rider: characterName,
                        color: dragonColor,
                        species: species,
                        signet: 'unknown',
                        appearances: [...characterData.appearances]
                    };
                } else {
                    dragonCompendium[dragonName].appearances = [
                        ...new Set([...dragonCompendium[dragonName].appearances, ...characterData.appearances])
                    ];
                    
                    if (dragonColor !== 'unknown' && dragonCompendium[dragonName].color === 'unknown') {
                        dragonCompendium[dragonName].color = dragonColor;
                    }
                    
                    if (species !== 'unknown' && dragonCompendium[dragonName].species === 'unknown') {
                        dragonCompendium[dragonName].species = species;
                    }
                }
            }
        });
    }
    
    return dragonCompendium;
}

function assignSignetsToDragons(dragonCompendium, characterToSignet) {
    for (const [dragonName, dragonData] of Object.entries(dragonCompendium)) {
        if (characterToSignet[dragonData.rider]) {
            dragonData.signet = characterToSignet[dragonData.rider];
        }
    }
    
    return dragonCompendium;
}
//searchability
async function initializeBookFilter() {
    try {
        const response = await fetch('/api/books');
        const books = await response.json();
        
        const bookFilter = document.getElementById('book-filter');
        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book;
            option.textContent = book;
            bookFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load books:', error);
    }
}

// Perform search with API
// Store the current query globally
let currentQuery = '';

async function performSearch(query, page = 1, filters = {}) {
    currentQuery = query; // Store the query
    try {
        const params = new URLSearchParams({
            q: query,
            page: page,
            ...(filters.book && { book: filters.book }),
            ...(filters.type && { type: filters.type })
        });
        
        const response = await fetch(`/api/search?${params}`);
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        displaySearchResults(data.results, data.query); // Pass the query
        updatePaginationControls(data.pagination);
    } catch (error) {
        console.error('Search error:', error);
        document.getElementById('search-results').innerHTML = `
            <div class="alert alert-danger">
                Search failed: ${error.message}
            </div>
        `;
    }
}

function updatePaginationControls(pagination) {
    const paginationContainer = document.getElementById('pagination-controls');
    paginationContainer.innerHTML = '';
    
    //Previous button
    if (pagination.hasPreviousPage) {
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.addEventListener('click', () => {
            performSearch(currentQuery, currentPage - 1);
        });
        paginationContainer.appendChild(prevButton);
    }
    
    //Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === pagination.currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            performSearch(currentQuery, i);
        });
        paginationContainer.appendChild(pageButton);
    }
    
    //Next button
    if (pagination.hasNextPage) {
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.addEventListener('click', () => {
            performSearch(currentQuery, currentPage + 1);
        });
        paginationContainer.appendChild(nextButton);
    }
    
    //Results count
    const countSpan = document.createElement('span');
    const startItem = ((pagination.currentPage - 1) * pagination.pageSize) + 1;
    const endItem = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);
    countSpan.textContent = `Showing ${startItem}-${endItem} of ${pagination.totalItems} results`;
    paginationContainer.appendChild(countSpan);
}
document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    const bookFilter = document.getElementById('book-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    
    performSearch(query, 1, {
        book: bookFilter,
        type: typeFilter
    });
});
//debouncing for better UX
let searchTimeout;
// Input event for live search
document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch(e.target.value, 1);
    }, 300);
});

function displaySearchResults(results, query) {
    const container = document.getElementById('search-results');
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = '<p>No results found</p>';
        return;
    }
    
    results.forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.className = 'search-result';
        
        resultElement.innerHTML = `
            <h4>${result.book} ${result.chapter ? `- ${result.chapter}` : ''}</h4>
            <p>${highlightMatches(result.content, query)}</p>
            <small>Found in: ${result.type}</small>
        `;
        
        container.appendChild(resultElement);
    });
}

function highlightMatches(text, query) {
    if (!query) return text;
    const regex = new RegExp(query, 'gi');
    return text.replace(regex, match => `<span class="highlight">${match}</span>`);
}
function indexAllContent(bookData, query = '') {
    const searchIndex = [];
    
    bookData.forEach(bookDataItem => {
        const bookKey = Object.keys(bookDataItem)[0];
        const book = bookDataItem[bookKey];
        
        //Index book title
        searchIndex.push({
            book: book.title,
            type: 'book',
            content: book.title,
            chapter: null
        });

        //index thoughts
        Object.entries(book.Thoughts).forEach(([date, thought]) => {
            const thoughtText = Array.isArray(thought) ? thought.join(' ') : thought;
            if (thoughtText.toLowerCase().includes(query)) {
                searchIndex.push({
                    book: book.title,
                    type: 'Thought',
                    content: thoughtText,
                    chapter: null,
                    date: date
                });
            }
        });
        //index chapters
        Object.entries(book.chapters).forEach(([chapterTitle, chapterContent]) => {
                //Search character notes
                if (chapterContent["Character Notes"]) {
                    Object.entries(chapterContent["Character Notes"]).forEach(([character, notes]) => {
                        const allDetails = notes.details.join(' ');
                        if (allDetails.toLowerCase().includes(query) || 
                            (notes.note && notes.note.toLowerCase().includes(query))) {
                            searchIndex.push({
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
                                searchIndex.push({
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
                                searchIndex.push({
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
                            searchIndex.push({
                                book: book.title,
                                type: 'Question',
                                content: `${question}: ${answer}`,
                                chapter: chapterTitle
                            });
                        }
                    });
                }
            }
    )});
    
    //Store in database or memory
    return searchIndex;
}

//Call this on server startup
$(document).ready(function() {
    //Initialize containers
    const $coversContainer = $('#book-covers-container');
    const $notesContainer = $('#book-notes-container');
    
    //back button HTML to notes container
    $notesContainer.prepend(`
        <button class="back-to-covers">
            <i class="fa fa-arrow-left"></i> Back to Books
        </button>
    `);
    const $backButton = $('.back-to-covers');
    
    //Hide notes container initially
    $notesContainer.hide();
    
    //Back button handler
    $backButton.on('click', function() {
        $notesContainer.hide().empty();
        $coversContainer.show();
    });
    
    //Load the book notes from JSON
    $.getJSON('/data/data.json', function(data) {
        console.log('Loaded book data:', data);
        //Generate book covers HTML
        let coversHtml = '';
       
        //const searchIndex = indexAllContent(data);

        data.forEach((bookData, index) => {
            const bookKey = Object.keys(bookData)[0];
            const book = bookData[bookKey];
            
            if (book.title && book.title.includes("(not read yet)")) {
                return; //Skip unread books
            }
            
            const coverImage = bookCoverImages[book.title] || 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/DefaultImage.png/330px-DefaultImage.png';
            coversHtml += `
                <div class="book-cover" data-book-index="${index}">
                    <div class="book-cover-front" style="background-image: url('${coverImage}')"></div>
                    <div class="book-cover-spine"></div>
                    <div class="book-cover-back">
                        <div class="book-cover-title">${book.title}</div>
                    </div>
                </div>
            `;
        });
        $coversContainer.html(coversHtml);
        
        //click handlers for book covers
        $coversContainer.on('click', '.book-cover', function() {
            const bookIndex = $(this).data('book-index');
            const bookData = data[bookIndex];
            const bookKey = Object.keys(bookData)[0];
            const book = bookData[bookKey];
            
            //Hide covers and show notes container
            $coversContainer.hide();
            $notesContainer.show();
            
            //Generate and display notes for this book
            displayBookNotes(book, bookKey);
        });
    }).fail(function(jqxhr, textStatus, error) {
        console.error("Error loading JSON:", textStatus, error);
        $('#book-covers-container').html(`
            <div class="alert alert-danger">
                Failed to load books: ${textStatus}
            </div>
        `);
    });
    
    //Collapse handler for all collapsible sections
    $(document).on('click', '[data-bs-toggle="collapse"]', function() {
        const icon = $(this).find('.fa');
        const isExpanded = $(this).attr('aria-expanded') === 'true';
        
        icon.toggleClass('fa-chevron-right', !isExpanded);
        icon.toggleClass('fa-chevron-down', isExpanded);
    });
});

function displayBookNotes(book, bookKey) {
    const bookId = bookKey.replace(/\s+/g, '-').replace(/'/g, "\\'");
    let html = '<div class="books-container">';

    //Create character compendium if this isn't a thoughts-only book
    const characterCompendium = {};
    const loreCompendium = {
        notes: [],
        entries: {}
    };
    const characterToSignet = {};
    
    //Check if this is a thoughts-only book (like The AngelMaker)
    const isThoughtsOnlyBook = !book.chapters && book.Thoughts;
    const isEmpyreanSeries = book.series && book.series.includes("Empyrean");
    
    //Only process chapters if this isn't a thoughts-only book
    if (!isThoughtsOnlyBook && book.chapters) {
        //Scan all chapters for signet information
        Object.values(book.chapters).forEach(chapter => {
            const characterNotes = chapter["Character Notes"] || {};
            
            Object.entries(characterNotes).forEach(([characterName, details]) => {
                details.details.forEach(detail => {
                    const signetMatch = detail.match(/signet:?\s*(.*)/i);
                    if (signetMatch && signetMatch[1]) {
                        characterToSignet[characterName] = signetMatch[1].trim();
                    }
                });
                
                if (details.note && details.note.includes("signet")) {
                    const signetMatch = details.note.match(/signet:?\s*(.*)/i);
                    if (signetMatch && signetMatch[1]) {
                        characterToSignet[characterName] = signetMatch[1].trim();
                    }
                }
            });
        });

        //Collect all character data
        for (const [chapterTitle, chapterContent] of Object.entries(book.chapters)) {
            //Process Character Notes
            if (chapterContent["Character Notes"]) {
                for (const [characterName, characterDetails] of Object.entries(chapterContent["Character Notes"])) {
                    if (!characterCompendium[characterName]) {
                        characterCompendium[characterName] = {
                            details: [],
                            notes: [],
                            appearances: []
                        };
                    }
                    characterDetails.details.forEach(detail => {
                        if (!characterCompendium[characterName].details.includes(detail)) {
                            characterCompendium[characterName].details.push(detail);
                        }
                    });
                    if (characterDetails.note && !characterCompendium[characterName].notes.includes(characterDetails.note)) {
                        characterCompendium[characterName].notes.push(characterDetails.note);
                    }
                    characterCompendium[characterName].appearances.push(chapterTitle);
                }
            }
            
            //Process Lore Notes
            if (chapterContent["Lore"]) {
                if (Array.isArray(chapterContent["Lore"].notes)) {
                    chapterContent["Lore"].notes.forEach(note => {
                        if (!loreCompendium.notes.includes(note)) {
                            loreCompendium.notes.push(note);
                        }
                    });
                } else if (typeof chapterContent["Lore"].notes === 'object') {
                    for (const [key, value] of Object.entries(chapterContent["Lore"].notes)) {
                        if (!loreCompendium.entries[key]) {
                            loreCompendium.entries[key] = {
                                value: Array.isArray(value) ? value.join('<br>• ') : value,
                                appearances: []
                            };
                        }
                        loreCompendium.entries[key].appearances.push(chapterTitle);
                    }
                }
            }
        }
    }
    
    //Book title section
    html += `
<div class="book-title" 
    style="--book-order: 0"
    data-bs-toggle="collapse" 
    data-bs-target="#${bookId}" 
    aria-expanded="false">
    <i class="fa fa-chevron-right collapsible-icon"></i>
    <h2>${book.title || bookKey}</h2>
    ${book.series ? `<div class="series-tag">${book.series}</div>` : ''}
</div>
<div id="${bookId}" class="collapse book-content">
    `;
    
    //Only show compendium sections if this isn't a thoughts-only book
    if (!isThoughtsOnlyBook) {
        //Character Compendium Section
        if (Object.keys(characterCompendium).length > 0) {
            html += `
<div class="compendium-section">
    <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${bookId}-characters" aria-expanded="false">
        <i class="fa fa-chevron-right collapsible-icon"></i>
        <h3>Character Compendium</h3>
    </div>
    <div id="${bookId}-characters" class="collapse">
        <div class="row">
            `;
            
            let cardOrder = 0;
            for (const [characterName, characterData] of Object.entries(characterCompendium)) {
                html += `
<div class="col-md-6 col-lg-4">
    <div class="character-card" style="--card-order: ${cardOrder++}">
        <div class="character-name">${characterName}</div>
        <div class="appearances text-muted small mb-2">
            Appears in: ${characterData.appearances.join(', ')}
        </div>
        <ul class="list-unstyled">
                `;
                
                characterData.details.forEach(detail => {
                    html += `<li class="note-item">• ${detail}</li>`;
                });
              
                characterData.notes.forEach(note => {
                    html += `<li class="note-item text-muted">Note: ${note}</li>`;
                });
              
                html += `
        </ul>
    </div>
</div>
                `;
            }
            
            html += `
        </div>
    </div>
</div>
            `;
        }
        
        //Lore Compendium Section
        if (loreCompendium.notes.length > 0 || Object.keys(loreCompendium.entries).length > 0) {
            html += `
<div class="compendium-section">
    <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${bookId}-lore-compendium" aria-expanded="false">
        <i class="fa fa-chevron-right collapsible-icon"></i>
        <h3>Lore Compendium</h3>
    </div>
    <div id="${bookId}-lore-compendium" class="collapse">
        <div class="lore-compendium-content">
            `;
            
            //Sort general lore notes alphabetically
            loreCompendium.notes.sort();
            
            //Sort lore entries alphabetically by key
            const sortedLoreEntries = {};
            Object.keys(loreCompendium.entries)
                .sort()
                .forEach(key => {
                    sortedLoreEntries[key] = loreCompendium.entries[key];
                });
            loreCompendium.entries = sortedLoreEntries;
            
            //lore list items
            if (loreCompendium.notes.length > 0) {
                html += `<h4 class="mt-3">General Lore Notes</h4><ul class="list-unstyled">`;
                loreCompendium.notes.forEach(note => {
                    html += `<li class="lore-item">• ${note}</li>`;
                });
                html += `</ul>`;
            }
            
            //lore entries
            if (Object.keys(loreCompendium.entries).length > 0) {
                html += `<h4 class="mt-3">Lore Entries</h4><ul class="list-unstyled">`;
                for (const [key, entry] of Object.entries(loreCompendium.entries)) {
                    html += `
<li class="lore-entry-item">
    <strong>${key}:</strong> ${entry.value}
    <div class="appearances text-muted small">
        (Mentioned in: ${entry.appearances.join(', ')})
    </div>
</li>
                    `;
                }
                html += `</ul>`;
            }
            
            html += `
        </div>
    </div>
</div>
            `;
        }
        
        //Dragon Compendium Section - Only for Empyrean series
        if (isEmpyreanSeries) {
            const dragonCompendium = extractDragonsFromCharacterNotes(characterCompendium);
            const dragonCompendiumWithSignets = assignSignetsToDragons(dragonCompendium, characterToSignet);
            
            if (Object.keys(dragonCompendiumWithSignets).length > 0) {
                html += `
<div class="compendium-section">
    <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${bookId}-dragons" aria-expanded="false">
        <i class="fa fa-chevron-right collapsible-icon"></i>
        <h3>Dragon Compendium</h3>
    </div>
    <div id="${bookId}-dragons" class="collapse">
        <div class="row">
                `;
                
                let dragonOrder = 0;
                Object.entries(dragonCompendiumWithSignets)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .forEach(([dragonName, dragonData]) => {
                        if (['Reagan', 'Fen'].some(name => dragonName.includes(name))) {
                            return;
                        }
                        
                        html += `
<div class="col-md-6 col-lg-4">
    <div class="dragon-card" style="--card-order: ${dragonOrder++}">
        <div class="dragon-name">${dragonName}</div>
        ${dragonData.color !== 'unknown' ? 
            `<div class="dragon-color">Color: ${dragonData.color}</div>` : ''}
        ${dragonData.species !== 'unknown' ? 
            `<div class="dragon-species">Species: ${dragonData.species}</div>` : ''}
        ${dragonData.rider ? 
            `<div class="dragon-rider">Rider: ${dragonData.rider}</div>` : ''}
        ${dragonData.signet !== 'unknown' ? 
            `<div class="dragon-signet">Signet: ${dragonData.signet}</div>` : ''}
        ${dragonData.appearances.length > 0 ? `
            <div class="appearances text-muted small">
                Appears in: ${dragonData.appearances.join(', ')}
            </div>
        ` : ''}
    </div>
</div>
                        `;
                    });
                
                html += `
        </div>
    </div>
</div>
                `;
            }
        }
    }
    
    //Thoughts Section - Show for all books that have thoughts
    if (book.Thoughts && Object.keys(book.Thoughts).length > 0) {
        const thoughtsId = `${bookId}-thoughts`;
         html += `
<div class="compendium-section">
    <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${thoughtsId}" aria-expanded="false">
        <i class="fa fa-chevron-right collapsible-icon"></i>
        <h3>Thoughts</h3>
    </div>
    <div id="${thoughtsId}" class="collapse">
        <div class="thoughts-content">
        `;
    
    //Sort thoughts by date (newest first)
         const sortedThoughts = Object.entries(book.Thoughts)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));
    
    sortedThoughts.forEach(([date, thought]) => {
        html += `
<div class="thought-item">
    <div class="thought-date">${date}</div>
    <div class="thought-text">
            `;
            
            if (Array.isArray(thought)) {
            html += `<ul class="list-unstyled">`;
            thought.forEach(item => {
                html += `<li>• ${item}</li>`;
            });
            html += `</ul>`;
        } else {
            html += thought;
        }
        
        html += `
    </div>
</div>
            `;
    });
        
        html += `
        </div>
    </div>
</div>
        `;
    }
    
    //Chapters Section - Only for books that have chapters and aren't thoughts-only
    if (!isThoughtsOnlyBook && book.chapters) {
        for (const [chapterTitle, chapterContent] of Object.entries(book.chapters)) {
            const chapterId = `${bookId}-${chapterTitle.replace(/\s+/g, '-').replace(/'/g, "\\'")}`;
            html += `
<div class="chapter-header" data-bs-toggle="collapse" data-bs-target="#${chapterId}" aria-expanded="false">
    <i class="fa fa-chevron-right collapsible-icon"></i>
    <h3>${chapterTitle}</h3>
</div>
<div id="${chapterId}" class="collapse chapter-content">
            `;
            
            //Process Character Notes
            if (chapterContent["Character Notes"] && Object.keys(chapterContent["Character Notes"]).length > 0) {
                const sectionId = `${chapterId}-characters`;
                html += `
<div class="section-header" data-bs-toggle="collapse" data-bs-target="#${sectionId}" aria-expanded="false">
    <i class="fa fa-chevron-right collapsible-icon"></i>
    <h4>Character Notes</h4>
</div>
<div id="${sectionId}" class="collapse">
    <div class="row">
                `;
                
                let cardOrder = 0;
                for (const [characterName, characterDetails] of Object.entries(chapterContent["Character Notes"])) {
                    html += `
<div class="col-md-6 col-lg-4">
    <div class="character-card" style="--card-order: ${cardOrder++}">
        <div class="character-name">${characterName}</div>
        <ul class="list-unstyled">
                    `;
                    
                    characterDetails.details.forEach(detail => {
                        html += `<li class="note-item">• ${detail}</li>`;
                    });
                    
                    if (characterDetails.note) {
                        html += `<li class="note-item text-muted">Note: ${characterDetails.note}</li>`;
                    }
                    
                    html += `
        </ul>
    </div>
</div>
                    `;
                }
                
                html += `
    </div>
</div>
                `;
            }
            
            //Process Lore
            if (chapterContent["Lore"]) {
                const sectionId = `${chapterId}-lore`;
                html += `
<div class="section-header" data-bs-toggle="collapse" data-bs-target="#${sectionId}" aria-expanded="false">
    <i class="fa fa-chevron-right collapsible-icon"></i>
    <h4>Lore</h4>
</div>
<div id="${sectionId}" class="collapse">
    <ul class="list-unstyled">
                `;
                
                if (Array.isArray(chapterContent["Lore"].notes)) {
                    chapterContent["Lore"].notes.forEach(note => {
                        html += `<li class="lore-item">• ${note}</li>`;
                    });
                } else if (chapterContent["Lore"].notes && typeof chapterContent["Lore"].notes === 'object') {
                    for (const [key, value] of Object.entries(chapterContent["Lore"].notes)) {
                        html += `<li class="lore-item"><strong>${key}:</strong> `;
                        if (Array.isArray(value)) {
                            html += `<ul class="list-unstyled">`;
                            value.forEach(item => {
                                html += `<li>• ${item}</li>`;
                            });
                            html += `</ul>`;
                        } else {
                            html += value;
                        }
                        html += `</li>`;
                    }
                }
                
                html += `
    </ul>
</div>
                `;
            }
            
            //Process Questions
            if (chapterContent["Questions"] && Object.keys(chapterContent["Questions"]).length > 0) {
                const sectionId = `${chapterId}-questions`;
                html += `
<div class="section-header" data-bs-toggle="collapse" data-bs-target="#${sectionId}" aria-expanded="false">
    <i class="fa fa-chevron-right collapsible-icon"></i>
    <h4>Questions</h4>
</div>
<div id="${sectionId}" class="collapse">
    <div class="questions-content">
                `;
                
                for (const [questionTitle, questionText] of Object.entries(chapterContent["Questions"])) {
                    html += `
<div class="question-box">
    <h5>${questionTitle}</h5>
    <p>${questionText}</p>
</div>
                    `;
                }
                
                html += `
    </div>
</div>
                `;
            }
            
            html += `</div>`; //Close chapter-content
        }
    }
    
    //Close book-content and books-container
    html += `
</div>
</div>
    `;
    
    //Update the notes container and show it
    $('#book-notes-container').find('.books-container').remove(); //Remove old content
    $('#book-notes-container').html(html).show();
}