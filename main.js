// Load the book notes from JSON
$(document).ready(function() {
    $.getJSON('data.json', function(data) {
      const bookData = data[0]; // Get the first (and only) book
      const bookTitle = Object.keys(bookData)[0];
      const bookNotes = bookData[bookTitle];
      
      let html = `
        <div class="book-title">
          <h2>${bookTitle}</h2>
        </div>
      `;
      
      // Process each chapter
      for (const [chapterTitle, chapterContent] of Object.entries(bookNotes)) {
        html += `
          <div class="chapter-header" data-toggle="collapse" data-target="#${chapterTitle.replace(/\s+/g, '-')}">
            <i class="fa fa-chevron-down collapsible-icon"></i>
            <h3>${chapterTitle}</h3>
          </div>
          <div id="${chapterTitle.replace(/\s+/g, '-')}" class="collapse show">
        `;
        
        // Process Character Notes
        if (chapterContent["Character Notes"]) {
          html += `
            <div class="section-header" data-toggle="collapse" data-target="#${chapterTitle.replace(/\s+/g, '-')}-characters">
              <i class="fa fa-chevron-down collapsible-icon"></i>
              <h4>Character Notes</h4>
            </div>
            <div id="${chapterTitle.replace(/\s+/g, '-')}-characters" class="collapse show">
              <div class="row">
          `;
          
          for (const [characterName, characterDetails] of Object.entries(chapterContent["Character Notes"])) {
            html += `
              <div class="col-md-6 col-lg-4">
                <div class="character-card">
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
          html += `
            <div class="section-header" data-toggle="collapse" data-target="#${chapterTitle.replace(/\s+/g, '-')}-lore">
              <i class="fa fa-chevron-down collapsible-icon"></i>
              <h4>Lore</h4>
            </div>
            <div id="${chapterTitle.replace(/\s+/g, '-')}-lore" class="collapse show">
              <ul class="list-unstyled">
          `;
          
          if (Array.isArray(chapterContent["Lore"].notes)) {
            chapterContent["Lore"].notes.forEach(note => {
              html += `<li class="lore-item">• ${note}</li>`;
            });
          } else {
            for (const [key, value] of Object.entries(chapterContent["Lore"].notes)) {
              html += `<li class="lore-item"><strong>${key}:</strong> ${value}</li>`;
            }
          }
          
          html += `
              </ul>
            </div>
          `;
        }
        
        // Process Questions
        if (chapterContent["Questions"]) {
          html += `
            <div class="section-header" data-toggle="collapse" data-target="#${chapterTitle.replace(/\s+/g, '-')}-questions">
              <i class="fa fa-chevron-down collapsible-icon"></i>
              <h4>Questions</h4>
            </div>
            <div id="${chapterTitle.replace(/\s+/g, '-')}-questions" class="collapse show">
              <div class="question-box">
                <p>${chapterContent["Questions"]["To consider"]}</p>
              </div>
            </div>
          `;
        }
        
        html += `</div>`; // Close chapter collapse div
      }
      
      $('#book-notes-container').html(html);
      
      // Add click handlers for collapsible sections
      $('[data-toggle="collapse"]').click(function() {
        $(this).find('.fa').toggleClass('fa-chevron-down fa-chevron-right');
      });
    }).fail(function() {
      $('#book-notes-container').html('<div class="alert alert-danger">Failed to load book notes.</div>');
    });
  });
  
  function loadingLoader() {
    // Your loader function implementation
    setTimeout(function() {
      document.getElementById("loader").style.display = "none";
    }, 1000);
  }