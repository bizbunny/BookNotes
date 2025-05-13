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
// Load the book notes from JSON
$(document).ready(function() {
  $.getJSON('/data/data.json', function(data) {
      let html = '<div class="books-container">';//consistent value to help with buidling HTML
      
      // Process each book
      data.forEach((bookData, index) => {
        const bookKey = Object.keys(bookData)[0];
        const book = bookData[bookKey];
        const bookId = bookKey.replace(/\s+/g, '-').replace(/'/g, "\\'");//in case book title has '

        // Skip books marked as "not read yet"
        if (book.title && book.title.includes("(not read yet)")) {
            return; // Skip this iteration
        }

        // Create character compendium
        const characterCompendium = {};//store char compendium
        const loreCompendium = {
            notes: [],//lore notes that only have one info piece
            entries: {}//lore notes that have multiple info pieces
        };
        const dragonCompendium = {};//store dragon compendium

        const characterToSignet = {};//Signet Info

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
`;

  // Add dragon content if any dragons are found
  let dragonsFound = false;

  // Check character notes for dragons
  for (const [characterName, characterData] of Object.entries(characterCompendium)) {
      const dragonInfo = characterData.details.find(detail => 
          detail.includes("dragon") || detail.includes("Dragon")
      );

      if (dragonInfo) {
          const dragonNameMatch = dragonInfo.match(/(?:named|name is) (\w+)/i);
          const dragonColorMatch = dragonInfo.match(/(\w+) dragon/i);
          
          const dragonName = dragonNameMatch ? dragonNameMatch[1] : `${characterName}'s dragon`;
          const dragonColor = dragonColorMatch ? dragonColorMatch[1] : 'unknown color';
          
          if (!dragonCompendium[dragonName]) {
              dragonCompendium[dragonName] = {
                  rider: characterName,
                  color: dragonColor,
                  appearances: characterData.appearances
              };
              dragonsFound = true;
          }
      }
  }

  // First pass: Extract all signet information from character notes
Object.values(book.chapters || {}).forEach(chapter => {
    const characterNotes = chapter["Character Notes"] || {};
    
    Object.entries(characterNotes).forEach(([characterName, details]) => {
        // Extract from details
        details.details.forEach(detail => {
            const signetMatch = detail.match(/signet:?\s*(.*?)(?:\.|$)/i);
            if (signetMatch && signetMatch[1]) {
                characterToSignet[characterName] = signetMatch[1].trim();
            }
        });
        
        // Extract from notes
        if (details.note) {
            const signetMatch = details.note.match(/signet:?\s*(.*?)(?:\.|$)/i);
            if (signetMatch && signetMatch[1]) {
                characterToSignet[characterName] = signetMatch[1].trim();
            }
        }
    });
});

// Dragon Compendium Section
html += `
    <div class="compendium-section">
        <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${bookId}-dragons" aria-expanded="false">
            <i class="fa fa-chevron-right collapsible-icon"></i>
            <h3>Dragon Compendium</h3>
        </div>
        <div id="${bookId}-dragons" class="collapse">
            <div class="row">
`;
if (Object.keys(dragonCompendium).length > 0) {
    let dragonOrder = 0;
    Object.entries(dragonCompendium)
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically
        .forEach(([dragonName, dragonData]) => {
            // Skip invalid entries
            if (!dragonName || dragonName === 'undefined') return;
            
            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="dragon-card" style="--card-order: ${dragonOrder++}">
                        <div class="dragon-name">${dragonName}</div>
                        ${dragonData.color !== 'unknown' ? 
                            `<div class="dragon-color">Color: ${dragonData.color}</div>` : ''}
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
    </div>
`;
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
      $('#book-notes-container').html('<div class="alert alert-danger">Failed to load book notes. Check console for details.</div>');
  });
});

function loadingLoader() {
  setTimeout(function() {
      document.getElementById("loader").style.display = "none";
  }, 1000);
}
$('#book-notes-container').on('show.bs.collapse hide.bs.collapse', function(e) {
  const trigger = $('[data-bs-target="#' + e.target.id + '"]');
  const icon = trigger.find('.fa');
  
  if (e.type === 'show') {
      icon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
  } else {
      icon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
  }
  // Force reflow to restart animations
  /* $(e.target).find('.character-card').each(function() {
    this.style.animation = 'none';
    void this.offsetWidth; /* trigger reflow
    this.style.animation = null;
}); */
}).fail(function(jqXHR, textStatus, errorThrown) {
    console.error("Error loading JSON:", textStatus, errorThrown);
    $('#book-notes-container').html(`
        <div class="alert alert-danger">
            Failed to load book notes: ${textStatus}<br>
            Error: ${errorThrown}<br>
            Check browser console for details
        </div>
    `);
});