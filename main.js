/*
"Chapter X": {
    "Character Notes": {
        "": {
            "details": [
                ]
        }
    },
    "Lore": {
        "notes": {
            "": ""
            }
    },
    "Questions" : {
        "": ""
        }
}
*/

const bookCoverImages = {
  "Fourth Wing": "/images/bookCovers_FW.webp",
  "Iron Flame": "/images/bookCovers_IF.webp",
  "Onyx Storm": "/images/bookCovers_OS.webp"
};

// Function to extract dragon information from character notes
function extractDragonsFromCharacterNotes(characterCompendium) {
    const dragonCompendium = {};
    
    for (const [characterName, characterData] of Object.entries(characterCompendium)) {
        // Skip human-only characters that shouldn't be dragons
        if (['Reagan', 'Fen Riorson'].includes(characterName)) {
            continue;
        }

        // Look for dragon information in details
        characterData.details.forEach(detail => {
            // Skip if this is clearly not a dragon reference
            if (detail.includes("human") || detail.includes("character") || 
                detail.includes("mother") || detail.includes("father")) {
                return;
            }

            // Match dragon name (e.g., "dragon's name is Sgaeyl" or "named Tein")
            const dragonNameMatch = detail.match(/(?:dragon's name is|named|name is) (\w+)/i);
            const dragonName = dragonNameMatch ? dragonNameMatch[1] : null;
            
            // Match dragon color (e.g., "brown dragon" or "is navy blue")
            const dragonColorMatch = detail.match(/(\w+) dragon/i) || 
                                   detail.match(/(?:is|was) (?:a )?(\w+(?: \w+)?)(?: dragon| scales|,|$)/i);
            let dragonColor = dragonColorMatch ? dragonColorMatch[1].replace(/,$/, '') : 'unknown';
            
            // Clean up color values
            if (['his', 'her', 'their'].includes(dragonColor.toLowerCase())) {
                dragonColor = 'unknown';
            }
            
            // Match dragon species if available
            const speciesMatch = detail.match(/species:? (\w+[\s\w]*)/i);
            let species = speciesMatch ? speciesMatch[1] : 'unknown';
            
            // Clean up species values
            if (species.toLowerCase().startsWith('red ')) {
                species = species.substring(4); // Remove "red " prefix
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
                    // Merge appearances if dragon already exists
                    dragonCompendium[dragonName].appearances = [
                        ...new Set([...dragonCompendium[dragonName].appearances, ...characterData.appearances])
                    ];
                    
                    // Update color if we found a better value
                    if (dragonColor !== 'unknown' && dragonCompendium[dragonName].color === 'unknown') {
                        dragonCompendium[dragonName].color = dragonColor;
                    }
                    
                    // Update species if we found a better value
                    if (species !== 'unknown' && dragonCompendium[dragonName].species === 'unknown') {
                        dragonCompendium[dragonName].species = species;
                    }
                }
            }
        });
    }
    
    return dragonCompendium;
}

// Function to assign signets to dragons based on their riders
function assignSignetsToDragons(dragonCompendium, characterToSignet) {
    // First pass: assign signets directly from rider's signet
    for (const [dragonName, dragonData] of Object.entries(dragonCompendium)) {
        if (characterToSignet[dragonData.rider]) {
            dragonData.signet = characterToSignet[dragonData.rider];
        }
    }
    
    return dragonCompendium;
}
$(document).on('click', '[data-bs-toggle="collapse"]', function() {
    const icon = $(this).find('.fa');
    const target = $(this).attr('data-bs-target');
    const isExpanded = $(this).attr('aria-expanded') === 'true';
    
    // Update the icon based on the new state (opposite of current)
    icon.toggleClass('fa-chevron-right', !isExpanded);
    icon.toggleClass('fa-chevron-down', isExpanded);
});
// Load the book notes from JSON
$(document).ready(function() {
  $.getJSON('data/data.json', function(data) {
    let html = '<div class="books-container">';
    // Initialize containers
    const $coversContainer = $('#book-covers-container');
    const $notesContainer = $('#book-notes-container');

    // Generate book covers HTML
    let coversHtml = '';
    data.forEach((bookData, index) => {
        const bookKey = Object.keys(bookData)[0];
        const book = bookData[bookKey];
        
        if (book.title && book.title.includes("(not read yet)")) {
            return; // Skip unread books
        }
        
        const coverImage = bookCoverImages[book.title] || 'https://via.placeholder.com/200x300?text=No+Cover';
        coversHtml += `
            <div class="book-cover" data-book-index="${index}" style="background-image: url('${coverImage}')">
                <div class="book-cover-title">${book.title}</div>
            </div>
        `;
    });
    $coversContainer.html(coversHtml);

      // Process each book
      data.forEach((bookData, index) => {
        const bookKey = Object.keys(bookData)[0];
        const book = bookData[bookKey];
        const bookId = bookKey.replace(/\s+/g, '-').replace(/'/g, "\\'");

        // Skip books marked as "not read yet"
        if (book.title && book.title.includes("(not read yet)")) {
            return; // Skip this iteration
        }

        // Create character compendium
        const characterCompendium = {};
        const loreCompendium = {
            notes: [],
            entries: {}
        };
        const characterToSignet = {};

        // Scan all chapters for signet information
        Object.values(book.chapters || {}).forEach(chapter => {
            const characterNotes = chapter["Character Notes"] || {};
            
            Object.entries(characterNotes).forEach(([characterName, details]) => {
                // Look for signet in details
                details.details.forEach(detail => {
                    const signetMatch = detail.match(/signet:?\s*(.*)/i);
                    if (signetMatch && signetMatch[1]) {
                        characterToSignet[characterName] = signetMatch[1].trim();
                    }
                });
                
                // Also check notes for signet info
                if (details.note && details.note.includes("signet")) {
                    const signetMatch = details.note.match(/signet:?\s*(.*)/i);
                    if (signetMatch && signetMatch[1]) {
                        characterToSignet[characterName] = signetMatch[1].trim();
                    }
                }
            });
        });

        // Collect all character data
        if (book.chapters) {
          for (const [chapterTitle, chapterContent] of Object.entries(book.chapters)) {
              // Process Character Notes
              if (chapterContent["Character Notes"]) {
                  for (const [characterName, characterDetails] of Object.entries(chapterContent["Character Notes"])) {
                      if (!characterCompendium[characterName]) {
                          characterCompendium[characterName] = {
                              details: [],
                              notes: [],
                              appearances: []
                          };
                      }
                      // Add details
                      characterDetails.details.forEach(detail => {
                          if (!characterCompendium[characterName].details.includes(detail)) {
                              characterCompendium[characterName].details.push(detail);
                          }
                      });
                      // Add notes
                      if (characterDetails.note && !characterCompendium[characterName].notes.includes(characterDetails.note)) {
                          characterCompendium[characterName].notes.push(characterDetails.note);
                      }
                      // Track appearances
                      characterCompendium[characterName].appearances.push(chapterTitle);
                  }
              }
              // Process Lore Notes
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
        
        // Extract dragons from character notes
        const dragonCompendium = extractDragonsFromCharacterNotes(characterCompendium);
        const dragonCompendiumWithSignets = assignSignetsToDragons(dragonCompendium, characterToSignet);
        
        // Build HTML
        html += `
<div class="book-title" 
    style="--book-order: ${index}"
    data-bs-toggle="collapse" 
    data-bs-target="#${bookId}" 
    aria-expanded="false">
    <i class="fa fa-chevron-right collapsible-icon"></i>
    <h2>${book.title || bookKey}</h2>
    ${book.series ? `<div class="series-tag">${book.series}</div>` : ''}
</div>
<div id="${bookId}" class="collapse book-content">
    <!-- Character Compendium Section -->
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
    </div> <!-- Close character compendium -->

    <!-- Lore Compendium Section -->
    <div class="compendium-section">
        <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${bookId}-lore-compendium" aria-expanded="false">
            <i class="fa fa-chevron-right collapsible-icon"></i>
            <h3>Lore Compendium</h3>
        </div>
        <div id="${bookId}-lore-compendium" class="collapse">
            <div class="lore-compendium-content">
`;

        // Sort general lore notes alphabetically
        loreCompendium.notes.sort();

        // Sort lore entries alphabetically by key
        const sortedLoreEntries = {};
        Object.keys(loreCompendium.entries)
            .sort()
            .forEach(key => {
                sortedLoreEntries[key] = loreCompendium.entries[key];
            });
        loreCompendium.entries = sortedLoreEntries;

        // Add lore list items
        if (loreCompendium.notes.length > 0) {
            html += `<h4 class="mt-3">General Lore Notes</h4><ul class="list-unstyled">`;
            loreCompendium.notes.forEach(note => {
                html += `<li class="lore-item">• ${note}</li>`;
            });
            html += `</ul>`;
        }

        // Add lore entries
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
    </div> <!-- Close lore compendium -->

    <!-- Dragon Compendium Section -->
    <div class="compendium-section">
        <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${bookId}-dragons" aria-expanded="false">
            <i class="fa fa-chevron-right collapsible-icon"></i>
            <h3>Dragon Compendium</h3>
        </div>
        <div id="${bookId}-dragons" class="collapse">
            <div class="row">
`;

        if (Object.keys(dragonCompendiumWithSignets).length > 0) {
            let dragonOrder = 0;
            Object.entries(dragonCompendiumWithSignets)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .forEach(([dragonName, dragonData]) => {
                    // Skip if this is clearly not a dragon (shouldn't happen with the improved extraction)
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
        } else {
            html += `
                <div class="col-12">
                    <p class="text-muted">No confirmed dragon information recorded yet.</p>
                </div>
            `;
        }

        html += `
            </div>
        </div>
    </div> <!-- Close dragon compendium -->
`;
// Thoughts Section
if (book.Thoughts && Object.keys(book.Thoughts).length > 0) {
    html += `
        <div class="compendium-section">
            <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${bookId}-thoughts" aria-expanded="false">
                <i class="fa fa-chevron-right collapsible-icon"></i>
                <h3>Thoughts</h3>
            </div>
            <div id="${bookId}-thoughts" class="collapse">
                <div class="thoughts-content">
    `;

    // Sort thoughts by date (newest first)
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
        // Process each chapter
        if (book.chapters) {
            for (const [chapterTitle, chapterContent] of Object.entries(book.chapters)) {
                const chapterId = `${bookId}-${chapterTitle.replace(/\s+/g, '-').replace(/'/g, "\\'")}`;
                html += `
                    <div class="chapter-header" data-bs-toggle="collapse" data-bs-target="#${chapterId}" aria-expanded="false">
                        <i class="fa fa-chevron-right collapsible-icon"></i>
                        <h3>${chapterTitle}</h3>
                    </div>
                    <div id="${chapterId}" class="collapse chapter-content">
                `;
                
                // Process Character Notes
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
                    cardOrder = 0; // Reset for each chapter
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
                
                // Process Lore
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
                
                // Process Questions
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
                    
                    // Loop through all questions
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
                
                html += `</div>`; // Close chapter collapse div
            }
        }
        
        html += `</div>`; // Close book collapse div
      });
      
    html += '</div>'; // Close books container
    $('#book-notes-container').html(html);
    
    // Add click handlers for all collapsible sections
    $(document).on('click', '[data-bs-toggle="collapse"]', function() {
        const icon = $(this).find('.fa');
        const target = $(this).attr('data-bs-target');
        const isExpanded = $(this).attr('aria-expanded') === 'true';
        
        // Update the icon based on the new state (opposite of current)
        icon.toggleClass('fa-chevron-right', !isExpanded);
        icon.toggleClass('fa-chevron-down', isExpanded);
    });
  }).fail(function(jqXHR, textStatus, errorThrown) {
      console.error("Error loading JSON:", textStatus, errorThrown);
      $('#book-notes-container').html(`<div class="alert alert-danger">
          Failed to load book notes: ${textStatus}<br>
          Error: ${errorThrown}<br>
          Check browser console for details
      </div>`);
  });
});

function loadingLoader() {
    setTimeout(function() {
        document.getElementById("loader").style.display = "none";
    }, 1000);
}

