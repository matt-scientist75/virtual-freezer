(function(){
  // All app JS moved from inline index.html
  var API = location.origin;
  var containers = [];
  var containerId = null;
  var state = { cells: [], filterText:'', filterStatus:'' };
  state.searchMatches = [];
  state.searchContainer = null;

  function showConfirmDialog(message, onConfirm){
    var overlay = document.getElementById('modalOverlay');
    var msgEl = document.getElementById('modalMessage');
    var okBtn = document.getElementById('modalOk');
    var cancelBtn = document.getElementById('modalCancel');
    
    msgEl.textContent = message;
    overlay.classList.add('active');
    
    var handleConfirm = function(){
      overlay.classList.remove('active');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      onConfirm();
    };
    var handleCancel = function(){
      overlay.classList.remove('active');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
    };
    
    okBtn.onclick = handleConfirm;
    cancelBtn.onclick = handleCancel;
  }

  function showRenameDialog(defaultValue, onConfirm){
    var overlay = document.getElementById('modalOverlay');
    var titleEl = document.getElementById('modalTitle');
    var msgEl = document.getElementById('modalMessage');
    var okBtn = document.getElementById('modalOk');
    var cancelBtn = document.getElementById('modalCancel');

    titleEl.textContent = 'Rename Box';
    msgEl.innerHTML = '';
    var input = document.createElement('input');
    input.id = 'modalInput';
    input.type = 'text';
    input.value = defaultValue || '';
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.background = 'var(--panel)';
    input.style.color = 'var(--text)';
    input.style.border = '1px solid #374151';
    input.style.borderRadius = '6px';
    msgEl.appendChild(input);
    overlay.classList.add('active');
    input.focus();

    var handleConfirm = function(){
      var v = input.value.trim();
      overlay.classList.remove('active');
      okBtn.onclick = null; cancelBtn.onclick = null; titleEl.textContent = 'Confirm'; msgEl.innerHTML = '';
      onConfirm(v);
    };
    var handleCancel = function(){
      overlay.classList.remove('active');
      okBtn.onclick = null; cancelBtn.onclick = null; titleEl.textContent = 'Confirm'; msgEl.innerHTML = '';
    };
    okBtn.onclick = handleConfirm;
    cancelBtn.onclick = handleCancel;
  }

  function log(msg){ try{ console.log(msg); }catch(e){} }
  function showError(err){
    var e = document.getElementById('errorState');
    if(e){ e.style.display='block'; e.textContent = 'Error: ' + (err && err.message ? err.message : String(err)); }
    log('ERROR: ' + String(err));
  }
  function httpGetJson(url){
    log('GET ' + url);
    return fetch(url).then(function(r){
      if(!r.ok){ throw new Error('HTTP ' + r.status + ' on ' + url); }
      return r.json();
    });
  }
  function httpPostJson(url, body){
    log('POST ' + url + ' body=' + JSON.stringify(body));
    return fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    }).then(function(r){
      if(!r.ok){ throw new Error('HTTP ' + r.status + ' on ' + url); }
      return r.json();
    });
  }

  function httpPutJson(url, body){
    log('PUT ' + url + ' body=' + JSON.stringify(body));
    return fetch(url, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      .then(function(r){ if(!r.ok){ throw new Error('HTTP ' + r.status + ' on ' + url); } return r.json(); });
  }

  function httpDeleteJson(url){
    log('DELETE ' + url);
    return fetch(url, { method:'DELETE' }).then(function(r){ if(!r.ok){ throw new Error('HTTP ' + r.status + ' on ' + url); } return r.json(); });
  }

  function ensureUI(){
    var select = document.getElementById('containerSelect');
    var emptyBanner = document.getElementById('emptyState');
    var title = document.getElementById('containerTitle');
    var grid = document.getElementById('grid');

    if (!containers.length){
      emptyBanner.style.display = 'block';
      select.innerHTML = '';
      title.textContent = '';
      grid.innerHTML = '';
      log('UI empty state shown');
      return false;
    } else {
      emptyBanner.style.display = 'none';
      var options = '';
      for (var i=0;i<containers.length;i++){
        options += '<option value="' + containers[i].id + '">' + containers[i].name + '</option>';
      }
      select.innerHTML = options;
      if (!containerId){ containerId = containers[0].id; }
      select.value = containerId;
      var c = null;
      for (var j=0;j<containers.length;j++){ if (containers[j].id === containerId){ c = containers[j]; break; } }
      if (!c){ c = containers[0]; containerId = c.id; }
      title.textContent = c.name + ' \u00B7 ' + c.rows + '\u00D7' + c.cols;
      log('UI set for container ' + containerId);
      return true;
    }
  }

  function init(){
    log('init start');
    httpGetJson(API + '/containers/')
      .then(function(json){
        containers = json;
        log('containers length=' + containers.length);
        var ok = ensureUI();
        attachUI();
        if (ok){ loadCells().then(function(){ renderGrid(getCols()); }); }
      })
      .catch(showError);
  }
  function getCols(){
    var c=null;
    for(var i=0;i<containers.length;i++){ if(containers[i].id===containerId){ c=containers[i]; break; } }
    return c ? c.cols : 9;
  }

  function createNineByNine(){
    var boxName = document.getElementById('newBoxName').value.trim() || 'Cryo Box · 9×9';
    httpPostJson(API + '/containers/', { name: boxName, type:'BOX', rows:9, cols:9 })
      .then(function(){ return httpGetJson(API + '/containers/'); })
      .then(function(json){
        containers = json;
        containerId = containers[containers.length - 1].id;
        document.getElementById('newBoxName').value = '';
        ensureUI();
        return loadCells();
      })
      .then(function(){ renderGrid(getCols()); })
      .catch(showError);
  }

  function createEightByEight(){
    var boxName = document.getElementById('newBoxName').value.trim() || 'Cryo Box · 8×8';
    httpPostJson(API + '/containers/', { name: boxName, type:'BOX', rows:8, cols:8 })
      .then(function(){ return httpGetJson(API + '/containers/'); })
      .then(function(json){
        containers = json;
        containerId = containers[containers.length - 1].id;
        document.getElementById('newBoxName').value = '';
        ensureUI();
        return loadCells();
      })
      .then(function(){ renderGrid(getCols()); })
      .catch(showError);
  }

  function loadCells(){
    return httpGetJson(API + '/containers/' + containerId + '/cells')
      .then(function(json){
        state.cells = json;
        log('cells length=' + state.cells.length);
      });
  }

  function matchesFilters(cell){
    var t = (state.filterText||'').toLowerCase();
    var s = state.filterStatus||'';
    var text = String(cell.vial_name||'').toLowerCase();
    var statusOk = !s || cell.status===s;
    var textOk = !t || (text.indexOf(t) !== -1);
    return statusOk && textOk;
  }

  function performSearch(){
    var q = (document.getElementById('search').value||'').trim().toLowerCase();
    var resultsEl = document.getElementById('searchResults');
    state.searchMatches = [];
    state.searchContainer = null;
    if(!q){ resultsEl.style.display='none'; return; }
    // Search all containers' cells
    var promises = containers.map(function(c){
      return httpGetJson(API + '/containers/' + c.id + '/cells').then(function(cells){
        var matches = [];
        for(var i=0;i<cells.length;i++){
          var cell = cells[i];
          var a = String(cell.vial_name||'').toLowerCase();
          var b = String(cell.owner||'').toLowerCase();
          var p = String(cell.project||'').toLowerCase();
          if(a.indexOf(q)!==-1 || b.indexOf(q)!==-1 || p.indexOf(q)!==-1){ matches.push(cell.id); }
        }
        return { container: c, matches: matches };
      }).catch(function(){ return { container: c, matches: [] }; });
    });
    Promise.all(promises).then(function(list){
      var html = '';
      var any=false;
      for(var i=0;i<list.length;i++){
        var item = list[i];
        if(item.matches && item.matches.length){
          any = true;
          html += '<div class="panel" style="margin-bottom:6px">' +
                  '<button class="primary" data-id="'+item.container.id+'">' +
                  item.container.name + ' (' + item.matches.length + ')</button>' +
                  '</div>';
        }
      }
      if(!any){ html = '<div style="color:var(--muted)">No matches</div>'; }
      resultsEl.innerHTML = html; resultsEl.style.display='block';
      // wire clicks
      var btns = resultsEl.querySelectorAll('button[data-id]');
      for(var j=0;j<btns.length;j++){
        (function(btn){ btn.onclick = function(){
            var id = Number(btn.getAttribute('data-id'));
            state.searchContainer = id;
            // find item's matches from list
            var matches = [];
            for(var k=0;k<list.length;k++){ if(list[k].container.id===id){ matches = list[k].matches; break; } }
            state.searchMatches = matches;
            containerId = id;
            ensureUI();
            loadCells().then(function(){ renderGrid(getCols()); resultsEl.style.display='none'; });
        }; })(btns[j]);
      }
    }).catch(showError);
  }

  function renderGrid(cols){
    var grid = document.getElementById('grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    for (var i=0;i<state.cells.length;i++){
      var cell = state.cells[i];
      var visible = matchesFilters(cell);
      var div = document.createElement('div');
      div.className = 'cell ' + String(cell.status||'').toLowerCase();
      div.style.opacity = visible? '1' : '0.25';
      var wellNumber = i + 1;
      div.textContent = String(wellNumber);
      div.title = 'Well: ' + wellNumber + ' | Vial: ' + (cell.vial_name||'') + ' | Status: ' + cell.status;
      // highlight if part of last search matches (and same container)
      if(state.searchContainer && state.searchContainer === containerId && state.searchMatches && state.searchMatches.indexOf(cell.id)!==-1){
        div.className += ' match';
      }
      div.onclick = (function(cellCopy){ return function(){ openEditor(cellCopy); }; })(cell);
      grid.appendChild(div);
    }
    log('renderGrid done with ' + state.cells.length + ' cells');
  }

  function openEditor(cell){
    var wellIndex = state.cells.indexOf(cell) + 1;
    var html = '' +
      '<div class="panel" style="margin-top:12px">' +
      '<strong>Edit Well ' + wellIndex + '</strong>' +
      '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-top:8px">' +
      '<label>Status<select id="f_status">' +
      '<option ' + (cell.status==='EMPTY'?'selected':'') + ' value="EMPTY">Empty</option>' +
      '<option ' + (cell.status==='OCCUPIED'?'selected':'') + ' value="OCCUPIED">Occupied</option>' +
      '<option ' + (cell.status==='RESERVED'?'selected':'') + ' value="RESERVED">Reserved</option>' +
      '</select></label>' +
      '<label>Vial name<input id="f_vial_name" type="text" value="' + (cell.vial_name||'') + '" /></label>' +
      '<label>Owner<input id="f_owner" type="text" value="' + (cell.owner||'') + '" /></label>' +
      '<label>Project<input id="f_project" type="text" value="' + (cell.project||'') + '" /></label>' +
      '</div>' +
      '<div style="margin-top:8px; display:flex; gap:8px">' +
      '<button id="saveBtn" class="primary">Save</button>' +
      '<button id="clearBtn">Clear</button>' +
      '</div>' +
      '</div>';
    document.getElementById('details').innerHTML = html;
    document.getElementById('saveBtn').onclick = function(){
      var st = document.getElementById('f_status').value;
      var vn = document.getElementById('f_vial_name').value.replace(/^\s+|\s+$/g,'');
      var ow = document.getElementById('f_owner').value.replace(/^\s+|\s+$/g,'');
      var pj = document.getElementById('f_project').value.replace(/^\s+|\s+$/g,'');
      fetch(API + '/containers/' + containerId + '/cells/' + cell.id, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ status: st, vial_name: vn||null, owner: ow||null, project: pj||null })
      }).then(function(){ return loadCells(); })
        .then(function(){ renderGrid(getCols()); })
        .catch(showError);
    };
    document.getElementById('clearBtn').onclick = function(){
      showConfirmDialog('Are you sure you want to clear this vial?', function(){
        fetch(API + '/containers/' + containerId + '/cells/' + cell.id, {
          method:'PUT', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ status: 'EMPTY', vial_name: null, owner: null, project: null })
        }).then(function(){ return loadCells(); })
          .then(function(){ renderGrid(getCols()); })
          .catch(showError);
      });
    };
  }

  function exportCsv(){
    var rows = [['Row','Col','Coord','Status','Vial']];
    for (var i=0;i<state.cells.length;i++){
      var cell = state.cells[i];
      rows.push([cell.row, cell.col, String.fromCharCode(64+cell.row) + String(cell.col), cell.status, cell.vial_name||'']);
    }
    var lines = [];
    for (var j=0;j<rows.length;j++){
      var r = rows[j];
      var escaped = [];
      for (var k=0;k<r.length;k++){
        escaped.push('"' + String(r[k]).replace(/\"/g,'\"\"') + '"');
      }
      lines.push(escaped.join(','));
    }
    var csv = lines.join('\n');
    var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'cryo_box_9x9.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function attachUI(){
    var create9x9Btn = document.getElementById('create9x9Btn');
    var create8x8Btn = document.getElementById('create8x8Btn');
    if (create9x9Btn) { create9x9Btn.onclick = createNineByNine; }
    if (create8x8Btn) { create8x8Btn.onclick = createEightByEight; }
    var searchBtn = document.getElementById('searchBtn');
    if(searchBtn){ searchBtn.onclick = performSearch; }
    var renameBtn = document.getElementById('renameBtn');
    var deleteBtn = document.getElementById('deleteBtn');
    if (renameBtn){ renameBtn.onclick = function(){
      var sel = document.getElementById('containerSelect');
      var id = Number(sel.value);
      var current = null;
      for(var i=0;i<containers.length;i++){ if(containers[i].id===id){ current = containers[i]; break; } }
      showRenameDialog(current ? current.name : '', function(newName){
        if (newName && newName.trim()){
          httpPutJson(API + '/containers/' + id, { name: newName.trim() })
            .then(function(){ return httpGetJson(API + '/containers/'); })
            .then(function(json){ containers = json; ensureUI(); loadCells().then(function(){ renderGrid(getCols()); }); })
            .catch(showError);
        }
      });
    }; }
    if (deleteBtn){ deleteBtn.onclick = function(){
      var sel = document.getElementById('containerSelect');
      var id = Number(sel.value);
      showConfirmDialog('Delete this box and all its vials? This cannot be undone.', function(){
        httpDeleteJson(API + '/containers/' + id)
          .then(function(){ return httpGetJson(API + '/containers/'); })
          .then(function(json){ containers = json; containerId = null; ensureUI(); if (containers.length) { containerId = containers[0].id; ensureUI(); loadCells().then(function(){ renderGrid(getCols()); }); } })
          .catch(showError);
      });
    }; }
    document.getElementById('search').oninput = function(e){
      state.filterText = e.target.value;
      // search is performed only when clicking the Search button
    };
    document.getElementById('statusFilter').onchange = function(e){
      state.filterStatus = e.target.value;
      renderGrid(getCols());
    };
    document.getElementById('exportCsv').onclick = exportCsv;
    document.getElementById('containerSelect').onchange = function(e){
      containerId = Number(e.target.value);
      // update UI title immediately and then reload cells
      ensureUI();
      loadCells().then(function(){ renderGrid(getCols()); });
    };
  }

  // Start
  init();
})();
