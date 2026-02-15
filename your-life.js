/**
 * Interactive form and chart events / logic.
 */
(function () {
  var yearEl = document.getElementById('year'),
    monthEl = document.getElementById('month'),
    dayEl = document.getElementById('day'),
    unitboxEl = document.getElementById('unitbox'),
    unitText = document.querySelector('.unitbox-label').textContent.toLowerCase(),
    items = document.querySelectorAll('.chart li'),
    itemCount,
    COLOR = '#d5d5d5',
    KEY = {
      UP: 38,
      DOWN: 40
    };

  // Set listeners
  unitboxEl.addEventListener('change', _handleUnitChange);
  yearEl.addEventListener('input', _handleDateChange);
  yearEl.addEventListener('keydown', _handleUpdown);
  yearEl.addEventListener('blur', _unhideValidationStyles);
  monthEl.addEventListener('change', _handleDateChange);
  monthEl.addEventListener('keydown', _handleUpdown);
  dayEl.addEventListener('input', _handleDateChange);
  dayEl.addEventListener('blur', _unhideValidationStyles);
  dayEl.addEventListener('keydown', _handleUpdown);

  // Ensure the month is unselected by default.
  monthEl.selectedIndex = -1;

  // Load default values
  _loadStoredValueOfDOB();

  // Event Handlers
  function _handleUnitChange(e) {
    window.location = '' + e.currentTarget.value + '.html';
  }

  function _handleDateChange(e) {

    // Save date of birth in local storage
    localStorage.setItem("DOB", JSON.stringify({
      month: monthEl.value,
      year: yearEl.value,
      day: dayEl.value
    }));

    if (_dateIsValid()) {
      itemCount = calculateElapsedTime();
      _repaintItems(itemCount);
    } else {
      _repaintItems(0);
    }
  }

  function _handleUpdown(e) {
    var newNum;
    // A crossbrowser keycode option.
    thisKey = e.keyCode || e.which;
    if (e.target.checkValidity()) {
      if (thisKey === KEY.UP) {
        newNum = parseInt(e.target.value, 10);
        e.target.value = newNum += 1;
        // we call the date change function manually because the input event isn't
        // triggered by arrow keys, or by manually setting the value, as we've done.
        _handleDateChange();
      } else if (thisKey === KEY.DOWN) {
        newNum = parseInt(e.target.value, 10);
        e.target.value = newNum -= 1;
        _handleDateChange();
      }
    }
  }

  function _unhideValidationStyles(e) {
    e.target.classList.add('touched');
  }

  function calculateElapsedTime() {
    var currentDate = new Date(),
      dateOfBirth = _getDateOfBirth(),
      diff = currentDate.getTime() - dateOfBirth.getTime(),
      elapsedTime;

    switch (unitText) {
      case 'weeks':
        // Measuring weeks is tricky since our chart shows 52 weeks per year (for simplicity)
        // when the actual number of weeks per year is 52.143. Attempting to calculate weeks
        // with a diffing strategy will result in build-up over time. Instead, we'll add up
        // 52 per elapsed full year, and only diff the weeks on the current partial year.
        var elapsedYears = (new Date(diff).getUTCFullYear() - 1970);
        var isThisYearsBirthdayPassed = (currentDate.getTime() > new Date(currentDate.getUTCFullYear(), monthEl.value, dayEl.value).getTime());
        var birthdayYearOffset = isThisYearsBirthdayPassed ? 0 : 1;
        var dateOfLastBirthday = new Date(currentDate.getUTCFullYear() - birthdayYearOffset, monthEl.value, dayEl.value);
        var elapsedDaysSinceLastBirthday = Math.floor((currentDate.getTime() - dateOfLastBirthday.getTime()) / (1000 * 60 * 60 * 24));
        var elapsedWeeks = (elapsedYears * 52) + Math.floor(elapsedDaysSinceLastBirthday / 7);
        elapsedTime = elapsedWeeks;
        break;
      case 'months':
        // Months are tricky, being variable length, so I opted for the average number
        // of days in a month as a close-enough approximation (30.4375). This can make
        // the chart look off by a day when you're right on the month threshold, but
        // it's otherwise fairly accurate over long periods of time.
        elapsedTime = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.4375));
        break;
      case 'years':
        // We can represent our millisecond diff as a year and subtract 1970 to
        // end up with an accurate elapsed time. To see why, consider the following:
        //
        //   1. JavaScript's Date timestamp represents milliseconds since 1970. Thus,
        //      new Date(0).toUTCString() → 'Thu, 01 Jan 1970 00:00:00 GMT'
        //   2. Picture the diff between today and tomorrow. It's a small number. A
        //      newly created date with that number would result in January 2 1970.
        //   3. Thus, subtracting 1970 from that date gives us elapsed time. We use
        //      UTC because otherwise we'd need to offset "1970" by our timezone.
        //
        // See more details here: https://stackoverflow.com/a/24181701/1154642
        elapsedTime = (new Date(diff).getUTCFullYear() - 1970);
        break;
    }

    return elapsedTime;
  }

  function _dateIsValid() {
    return monthEl.checkValidity() && dayEl.checkValidity() && yearEl.checkValidity();
  }

  function _getDateOfBirth() {
    return new Date(yearEl.value, monthEl.value, dayEl.value);
  }

  function _repaintItems(number) {
    for (var i = 0; i < items.length; i++) {
      if (i < number) {
        items[i].style.backgroundColor = COLOR;
      } else {
        items[i].style.backgroundColor = '';
      }
    }
  }

  function _loadStoredValueOfDOB() {
    var DOB = JSON.parse(localStorage.getItem('DOB'));

    if (!DOB) {
      return;
    }

    if (DOB.month >= 0 && DOB.month < 12) {
      monthEl.value = DOB.month
    }

    if (DOB.year) {
      yearEl.value = DOB.year
    }

    if (DOB.day > 0 && DOB.day < 32) {
      dayEl.value = DOB.day
    }
    _handleDateChange();
  }

  // --- Week Notes Feature (weeks page only) ---
  if (unitText === 'weeks') {
    var overlayEl = document.getElementById('week-modal-overlay'),
      modalLabelEl = document.getElementById('modal-week-label'),
      modalDateEl = document.getElementById('modal-week-dates'),
      modalNoteEl = document.getElementById('modal-note'),
      modalReadEl = document.getElementById('modal-read'),
      modalEditEl = document.getElementById('modal-edit'),
      modalRenderedEl = document.getElementById('modal-rendered'),
      modalSaveBtn = document.getElementById('modal-save'),
      modalDeleteBtn = document.getElementById('modal-delete'),
      modalEditBtn = document.getElementById('modal-edit-btn'),
      modalCancelBtn = document.getElementById('modal-cancel'),
      modalCloseBtn = document.getElementById('modal-close'),
      modalReadTitleEl = document.getElementById('modal-read-title'),
      modalTitleInput = document.getElementById('modal-note-title'),
      activeWeekIndex = null,
      easyMDE = null,
      autoSaveTimer = null;

    var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function _formatDate(date) {
      return MONTH_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    }

    function _getWeekDates(index) {
      var dob = _getDateOfBirth();
      // The chart uses 52 weeks per year, aligned to birthdays.
      // Row = year of life, col = week within that year.
      var yearOffset = Math.floor(index / 52);
      var weekInYear = index % 52;
      var birthday = new Date(dob.getFullYear() + yearOffset, dob.getMonth(), dob.getDate());
      var start = new Date(birthday.getTime() + weekInYear * 7 * 24 * 60 * 60 * 1000);
      var end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
      return { start: start, end: end };
    }

    function _getWeekDateRange(index) {
      var dates = _getWeekDates(index);
      return _formatDate(dates.start) + ' – ' + _formatDate(dates.end);
    }

    function _getWeekNotes() {
      return JSON.parse(localStorage.getItem('weekNotes')) || {};
    }

    function _saveWeekNotes(notes) {
      localStorage.setItem('weekNotes', JSON.stringify(notes));
    }

    function _applyNoteIndicators() {
      var notes = _getWeekNotes();
      for (var i = 0; i < items.length; i++) {
        if (notes[i]) {
          items[i].classList.add('has-note');
        } else {
          items[i].classList.remove('has-note');
        }
      }
    }

    function _initEasyMDE() {
      if (easyMDE) return;
      easyMDE = new EasyMDE({
        element: modalNoteEl,
        spellChecker: false,
        status: false,
        placeholder: 'What happened this week?',
        toolbar: ['bold', 'italic', 'heading', '|',
                  'unordered-list', 'ordered-list', '|',
                  'link', 'quote', 'code', '|', 'preview'],
        autoDownloadFontAwesome: true
      });
      easyMDE.codemirror.on('change', _scheduleAutoSave);
    }

    function _scheduleAutoSave() {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(_autoSave, 500);
    }

    function _autoSave() {
      if (activeWeekIndex === null) return;
      var notes = _getWeekNotes();
      var title = modalTitleInput.value.trim();
      var body = easyMDE ? easyMDE.value().trim() : '';
      if (body) {
        notes[activeWeekIndex] = title ? { title: title, body: body } : body;
      } else if (!title) {
        delete notes[activeWeekIndex];
      }
      _saveWeekNotes(notes);
      _applyNoteIndicators();
      _writeBackupToFile();
    }

    function _showReadView(title, markdown) {
      modalReadEl.hidden = false;
      modalEditEl.hidden = true;
      if (title) {
        modalReadTitleEl.textContent = title;
        modalReadTitleEl.hidden = false;
      } else {
        modalReadTitleEl.hidden = true;
      }
      modalRenderedEl.innerHTML = easyMDE
        ? easyMDE.markdown(markdown)
        : (typeof marked !== 'undefined' ? marked.parse(markdown) : markdown);
      modalDeleteBtn.hidden = false;
    }

    function _showEditView(title, markdown) {
      modalReadEl.hidden = true;
      modalEditEl.hidden = false;
      modalTitleInput.value = title || '';
      _initEasyMDE();
      easyMDE.value(markdown || '');
      // Refresh CodeMirror after becoming visible
      setTimeout(function () { easyMDE.codemirror.refresh(); }, 0);
    }

    // Custom tooltip via event delegation
    var tooltipEl = document.createElement('div');
    tooltipEl.className = 'week-tooltip';
    document.body.appendChild(tooltipEl);

    var chartEl = document.querySelector('.chart');
    var itemsArray = Array.prototype.slice.call(items);

    chartEl.addEventListener('mouseover', function (e) {
      if (e.target.tagName !== 'LI' || !_dateIsValid()) return;
      var idx = itemsArray.indexOf(e.target);
      if (idx === -1) return;
      var age = Math.floor(idx / 52);
      var week = (idx % 52) + 1;
      var dates = _getWeekDates(idx);
      var label = 'Age ' + age + ', Week ' + week + '  ·  ' + _formatDate(dates.start) + ' – ' + _formatDate(dates.end);
      var note = _parseNote(_getWeekNotes()[idx]);
      if (note.title) label += '  ·  ' + note.title;
      tooltipEl.textContent = label;
      tooltipEl.hidden = false;
    });

    chartEl.addEventListener('mousemove', function (e) {
      if (!tooltipEl.hidden) {
        tooltipEl.style.left = e.pageX + 12 + 'px';
        tooltipEl.style.top = e.pageY - 28 + 'px';
      }
    });

    chartEl.addEventListener('mouseout', function (e) {
      if (e.target.tagName === 'LI') {
        tooltipEl.hidden = true;
      }
    });

    // Parse a note entry — handles both old string format and new {title, body} format
    function _parseNote(entry) {
      if (!entry) return { title: '', body: '' };
      if (typeof entry === 'string') return { title: '', body: entry };
      return { title: entry.title || '', body: entry.body || '' };
    }

    function _openModal(index) {
      var age = Math.floor(index / 52);
      var week = (index % 52) + 1;
      activeWeekIndex = index;
      modalLabelEl.textContent = 'Age ' + age + ', Week ' + week;
      modalDateEl.textContent = _getWeekDateRange(index);

      var notes = _getWeekNotes();
      var note = _parseNote(notes[index]);

      if (note.body) {
        _showReadView(note.title, note.body);
      } else {
        _showEditView('', '');
      }

      overlayEl.hidden = false;
    }

    function _closeModal() {
      overlayEl.hidden = true;
      modalReadEl.hidden = true;
      modalEditEl.hidden = true;
      activeWeekIndex = null;
    }

    function _saveNote() {
      var notes = _getWeekNotes();
      var title = modalTitleInput.value.trim();
      var body = easyMDE ? easyMDE.value().trim() : modalNoteEl.value.trim();
      if (body) {
        notes[activeWeekIndex] = title ? { title: title, body: body } : body;
        _saveWeekNotes(notes);
        _applyNoteIndicators();
        _writeBackupToFile();
        _showReadView(title, body);
      } else {
        delete notes[activeWeekIndex];
        _saveWeekNotes(notes);
        _applyNoteIndicators();
        _writeBackupToFile();
        _closeModal();
      }
    }

    function _deleteNote() {
      if (!confirm('Are you sure you want to delete this note?')) return;
      var notes = _getWeekNotes();
      delete notes[activeWeekIndex];
      _saveWeekNotes(notes);
      _applyNoteIndicators();
      _writeBackupToFile();
      _closeModal();
    }

    function _handleEditBtn() {
      var notes = _getWeekNotes();
      var note = _parseNote(notes[activeWeekIndex]);
      _showEditView(note.title, note.body);
    }

    function _handleCancelBtn() {
      var notes = _getWeekNotes();
      var note = _parseNote(notes[activeWeekIndex]);
      if (note.body) {
        _showReadView(note.title, note.body);
      } else {
        _closeModal();
      }
    }

    // Find the nearest week <li> to a given page coordinate
    // Uses grid geometry to check only nearby candidates instead of all 4680
    function _nearestWeek(pageX, pageY) {
      if (items.length === 0) return -1;
      // Estimate row/col from first item's size
      var sample = items[0].getBoundingClientRect();
      var cellW = sample.width + 2; // width + margins
      var cellH = sample.height + 2;
      var chartRect = chartEl.getBoundingClientRect();
      var relX = pageX - (chartRect.left + window.scrollX);
      var relY = pageY - (chartRect.top + window.scrollY);
      var estCol = Math.round(relX / cellW);
      var estRow = Math.round(relY / cellH);

      // Search a small window around the estimated position
      var best = -1;
      var bestDist = Infinity;
      for (var r = estRow - 2; r <= estRow + 2; r++) {
        for (var c = estCol - 2; c <= estCol + 2; c++) {
          var idx = r * 52 + c;
          if (idx < 0 || idx >= items.length) continue;
          var rect = items[idx].getBoundingClientRect();
          var cx = rect.left + rect.width / 2 + window.scrollX;
          var cy = rect.top + rect.height / 2 + window.scrollY;
          var dx = pageX - cx;
          var dy = pageY - cy;
          var dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            bestDist = dist;
            best = idx;
          }
        }
      }
      // Only match if within a reasonable radius (~20px)
      if (best >= 0 && Math.sqrt(bestDist) < 20) return best;
      return -1;
    }

    // On touch devices, use nearest-neighbor matching for forgiving taps
    var isTouchDevice = 'ontouchstart' in window;

    if (isTouchDevice) {
      chartEl.addEventListener('click', function (e) {
        if (!_dateIsValid()) return;
        var idx = _nearestWeek(e.pageX, e.pageY);
        if (idx >= 0) _openModal(idx);
      });
    } else {
      // Desktop: attach click handlers directly
      for (var i = 0; i < items.length; i++) {
        (function (idx) {
          items[idx].addEventListener('click', function () {
            _openModal(idx);
          });
        })(i);
      }
    }

    // Modal controls
    modalSaveBtn.addEventListener('click', _saveNote);
    modalDeleteBtn.addEventListener('click', _deleteNote);
    modalEditBtn.addEventListener('click', _handleEditBtn);
    modalCancelBtn.addEventListener('click', _handleCancelBtn);
    modalTitleInput.addEventListener('input', _scheduleAutoSave);
    modalCloseBtn.addEventListener('click', _closeModal);
    overlayEl.addEventListener('click', function (e) {
      if (e.target === overlayEl) {
        _closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlayEl.hidden) {
        _closeModal();
      }
    });

    // Adjust modal height when mobile keyboard opens/closes
    if (window.visualViewport) {
      var modalPanel = document.getElementById('week-modal');
      window.visualViewport.addEventListener('resize', function () {
        var vpHeight = window.visualViewport.height;
        modalPanel.style.setProperty('--visual-vh', vpHeight + 'px');
      });
    }

    // Export / Import / Auto-Backup
    var exportBtn = document.getElementById('export-btn');
    var importBtn = document.getElementById('import-btn');
    var autoBackupBtn = document.getElementById('auto-backup-btn');
    var importFileEl = document.getElementById('import-file');
    var backupFileHandle = null;

    function _getBackupData() {
      return {
        weekNotes: _getWeekNotes(),
        DOB: JSON.parse(localStorage.getItem('DOB'))
      };
    }

    function _writeBackupToFile() {
      if (!backupFileHandle) return;
      var json = JSON.stringify(_getBackupData(), null, 2);
      backupFileHandle.createWritable().then(function (writable) {
        writable.write(json).then(function () {
          writable.close();
        });
      }).catch(function () {
        // Permission revoked or file gone — clear handle
        backupFileHandle = null;
        autoBackupBtn.textContent = 'Auto-Backup';
        autoBackupBtn.classList.remove('active');
      });
    }

    exportBtn.addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(_getBackupData(), null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'life-in-weeks-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    // Show auto-backup button only in browsers that support File System Access API
    if (window.showSaveFilePicker) {
      autoBackupBtn.hidden = false;
      autoBackupBtn.addEventListener('click', function () {
        if (backupFileHandle) {
          // Toggle off
          backupFileHandle = null;
          autoBackupBtn.textContent = 'Auto-Backup';
          autoBackupBtn.classList.remove('active');
          return;
        }
        window.showSaveFilePicker({
          suggestedName: 'life-in-weeks-backup.json',
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        }).then(function (handle) {
          backupFileHandle = handle;
          autoBackupBtn.textContent = 'Auto-Backup: On';
          autoBackupBtn.classList.add('active');
          // Write immediately
          _writeBackupToFile();
        }).catch(function () {
          // User cancelled picker
        });
      });
    }

    importBtn.addEventListener('click', function () {
      importFileEl.click();
    });

    importFileEl.addEventListener('change', function () {
      var file = importFileEl.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var data = JSON.parse(e.target.result);
          if (!data.weekNotes || typeof data.weekNotes !== 'object') {
            alert('Invalid backup file — no notes found.');
            return;
          }
          if (!confirm('This will replace all your current notes. Continue?')) return;
          _saveWeekNotes(data.weekNotes);
          if (data.DOB) {
            localStorage.setItem('DOB', JSON.stringify(data.DOB));
          }
          _applyNoteIndicators();
          alert('Notes imported successfully.');
        } catch (err) {
          alert('Could not read file. Make sure it is a valid JSON backup.');
        }
      };
      reader.readAsText(file);
      // Reset so the same file can be re-imported
      importFileEl.value = '';
    });

    // Apply note indicators on load
    _applyNoteIndicators();
  }
})();
