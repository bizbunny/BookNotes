// Load the book notes from JSON
$(document).ready(function() {
  $.getJSON('./data/data.json', function(data) {
      let html = '<div class="books-container">';//consistent value to help with buidling HTML
      
      // Process each book
      data.forEach((bookData, index) => {
        const bookKey = Object.keys(bookData)[0];
        const book = bookData[bookKey];
        const bookId = bookKey.replace(/\s+/g, '-').replace(/'/g, "\\'");//in case book title has '

        // Create character compendium
        const characterCompendium = {};//store char compendium
        const loreCompendium = {
            notes: [],//lore notes that only have one info piece
            entries: {}//lore notes that have multiple info pieces
        };
        
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
      // Add character compendium content
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
    
        characterData.details.forEach(detail => {//looping through each detail of each character
            html += `<li class="note-item">• ${detail}</li>`;
        });
      
        characterData.notes.forEach(note => {//looping through to display the list of notes
            html += `<li class="note-item text-muted">Note: ${note}</li>`;
        });
      
        html += `
                    </ul>
                </div>
            </div>
        `;
      }

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

      html += `
                </div>
            </div>
        </div>

        <!-- Lore Compendium Section -->
        <div class="compendium-section">
            <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${bookId}-lore-compendium" aria-expanded="false">
                <i class="fa fa-chevron-right collapsible-icon"></i>
                <h3>Lore Compendium</h3>
            </div>
            <div id="${bookId}-lore-compendium" class="collapse">
                <div class="lore-compendium-content">
      `;

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
      </div>

      <!-- Thoughts Section -->
      <div class="compendium-section">
          <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${bookId}-thoughts" aria-expanded="false">
              <i class="fa fa-chevron-right collapsible-icon"></i>
              <h3>My Thoughts</h3>
          </div>
          <div id="${bookId}-thoughts" class="collapse">
              <div class="thoughts-content">
      `;

      // Add thoughts content
      if (book.Thoughts && Object.keys(book.Thoughts).length > 0) {
          html += `<ul class="list-unstyled">`;
          for (const [date, thought] of Object.entries(book.Thoughts)) {
              html += `
                  <li class="thought-item">
                      <div class="thought-date">${date}</div>
                      <div class="thought-text">${thought}</div>
                  </li>
              `;
          }
          html += `</ul>`;
      } else {
          html += `<p class="text-muted">No thoughts recorded yet.</p>`;
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
          if (chapterContent["Questions"] && chapterContent["Questions"]["To consider"]) {
              const sectionId = `${chapterId}-questions`;
              html += `
                  <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${sectionId}" aria-expanded="false">
                      <i class="fa fa-chevron-right collapsible-icon"></i>
                      <h4>Questions</h4>
                  </div>
                  <div id="${sectionId}" class="collapse">
                      <div class="question-box">
                          <p>${chapterContent["Questions"]["To consider"]}</p>
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
      // Force reflow to trigger animations
      document.querySelectorAll('.book-title').forEach(el => {
          el.style.animation = 'none';
          el.offsetHeight; /* trigger reflow */
          el.style.animation = null;
      });
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
  $(e.target).find('.character-card').each(function() {
    this.style.animation = 'none';
    void this.offsetWidth; /* trigger reflow */
    this.style.animation = null;
});
});