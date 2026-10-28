/* APL Connect Phase 1 — plain JS, no build step.
   DEMO ONLY by default: data lives in localStorage, no backend needed.
   Appwrite is optional (Settings). No real password/token/company data is in this file.
   Pure calculation helpers are exported for Node testing (module.exports guard at bottom). */
function toNum(v){ if(v===null||v===undefined||v==='') return null; var n=Number(v); return isNaN(n)?null:n; }
function calcConsumption(current, previous){ var c=toNum(current), p=toNum(previous); if(c===null||p===null) return null; return c-p; }
function sumNums(){ var s=0, any=false; for(var i=0;i<arguments.length;i++){ var n=toNum(arguments[i]); if(n!==null){ s+=n; any=true; } } return any?s:null; }
function calcRatio(total, steam){ var t=toNum(total), s=toNum(steam); if(t===null||s===null||s===0) return null; return t/s; }
// Daily entry: readings + manual consumptions (used only when no previous day exists).
// Returns a new object with consumptions, totals and ratios filled, exactly like the v3 Excel formulas.
function calcDaily(e, prev){
  var out = Object.assign({}, e);
  var pairs = [
    ['siteGasReading','siteGasCons'],['lossGasReading','lossGasCons'],['bayGasReading','bayGasCons'],
    ['zozenGasReading','zozenGasCons'],['lossDieselReading','lossDieselCons'],['zozenDieselReading','zozenDieselCons'],
    ['factoryWaterReading','factoryWaterCons'],['softnersWaterReading','softnersWaterCons'],
    ['lossSoftReading','lossSoftCons'],['baySoftReading','baySoftCons'],['zozenSoftReading','zozenSoftCons']
  ];
  pairs.forEach(function(p){
    if(prev){ var c=calcConsumption(out[p[0]], prev[p[0]]); out[p[1]] = c; }
    // else keep the manual consumption the operator typed
  });
  out.totalGas = sumNums(out.lossGasCons, out.bayGasCons, out.zozenGasCons);
  out.totalDiesel = sumNums(out.lossDieselCons, out.zozenDieselCons);
  out.totalSoft = sumNums(out.lossSoftCons, out.baySoftCons, out.zozenSoftCons);
  out.gasPerTon = calcRatio(out.totalGas, out.steam);
  out.waterPerTon = calcRatio(out.totalSoft, out.steam);
  out.archived = false; out.archiveDate = null;
  return out;
}
// Hourly entry: previous row = last saved row for that same boiler.
function calcHourly(e, prev){
  var out = Object.assign({}, e);
  if(prev){
    out.fuelGasCons = calcConsumption(out.fuelGasMeter, prev.fuelGasMeter);
    out.softCons = calcConsumption(out.softMeter, prev.softMeter);
    if(out.dieselMeter!==undefined || prev.dieselMeter!==undefined){
      out.dieselCons = calcConsumption(out.dieselMeter, prev.dieselMeter);
    }
  }
  out.archived = false; out.archiveDate = null;
  return out;
}
if (typeof module !== 'undefined' && module.exports){
  module.exports = { toNum: toNum, calcConsumption: calcConsumption, sumNums: sumNums, calcRatio: calcRatio, calcDaily: calcDaily, calcHourly: calcHourly };
}
if (typeof document === 'undefined'){ /* Node test mode: stop here */ }
else {
(function(){
  var $ = function(s){ return document.querySelector(s); };
  var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function load(k, fb){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch(e){ return fb; } }
  function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  var DAILY_METERS = [
    {group:'Site Main Gas Meter', r:'siteGasReading', c:'siteGasCons'},
    {group:'Loss Boiler Gas', r:'lossGasReading', c:'lossGasCons'},
    {group:'Bay Boiler Gas', r:'bayGasReading', c:'bayGasCons'},
    {group:'Zozen HP Boiler Gas', r:'zozenGasReading', c:'zozenGasCons'},
    {group:'Loss Boiler Diesel', r:'lossDieselReading', c:'lossDieselCons'},
    {group:'Zozen Boiler Diesel', r:'zozenDieselReading', c:'zozenDieselCons'},
    {group:'Boiler House Factory Water', r:'factoryWaterReading', c:'factoryWaterCons'},
    {group:'Softners Factory Water', r:'softnersWaterReading', c:'softnersWaterCons'},
    {group:'Loss Boiler Soft Water', r:'lossSoftReading', c:'lossSoftCons'},
    {group:'Bay Boiler Soft Water', r:'baySoftReading', c:'baySoftCons'},
    {group:'Zozen HP Boiler Soft Water', r:'zozenSoftReading', c:'zozenSoftCons'}
  ];
  function hourlyFieldsFor(boiler){
    var hasDiesel = /Loss|Zozen/i.test(boiler);
    var f = [
      {k:'steamPressure', l:'Steam Pressure (bar)', t:'number'},
      {k:'steamTemp', l:'Steam Temp. (°C)', t:'number'},
      {k:'steamFlow', l:'Steam Flow (t/h)', t:'number'},
      {k:'drumLevel', l:'Drum Level (%)', t:'number'},
      {k:'feedTankLevel', l:'Feed Water Tank Level (%) — this boiler only', t:'number'},
      {k:'feedTankTemp', l:'Feed Water Tank Temp. (°C) — this boiler only', t:'number'},
      {k:'feedWaterPressure', l:'Feed Water Pressure (bar)', t:'number'},
      {k:'feedWaterFlow', l:'Feed Water Flow (t/h)', t:'number'},
      {k:'fuelGasMeter', l:'Fuel Gas Meter Reading', t:'number'},
      {k:'fuelGasCons', l:'Fuel Gas Consumption (auto)', t:'number', auto:true},
      {k:'fuelGasPressure', l:'Fuel Gas Pressure (mbar)', t:'number'}
    ];
    if(hasDiesel){
      f.push({k:'dieselMeter', l:'Diesel Meter Reading', t:'number'});
      f.push({k:'dieselCons', l:'Diesel Consumption (auto)', t:'number', auto:true});
    }
    f = f.concat([
      {k:'stackTemp', l:'Stack / Flue Gas Temp. (°C)', t:'number'},
      {k:'o2', l:'Flue Gas O2 (%)', t:'number'},
      {k:'co', l:'Flue Gas CO (ppm)', t:'number'},
      {k:'softMeter', l:'Soft Water Meter Reading', t:'number'},
      {k:'softCons', l:'Soft Water Consumption (auto)', t:'number', auto:true},
      {k:'blowdown', l:'Blowdown Done?', t:'select', opts:['','Yes','No']},
      {k:'tds', l:'Boiler Water TDS (ppm)', t:'number'},
      {k:'ph', l:'Boiler Water pH', t:'number'},
      {k:'alarm', l:'Alarm / Trip?', t:'select', opts:['','Yes','No']},
      {k:'remarks', l:'Remarks', t:'text'}
    ]);
    return f;
  }
  var session = load('apl_session', null);
  var users = load('apl_users', null);
  if(!users){
    users = [
      {name:'Demo Admin', email:'admin@apl.test', password:'admin123', role:'Admin'},
      {name:'Demo Operator', email:'operator@apl.test', password:'operator123', role:'Operator'}
    ]; save('apl_users', users);
  }
  var sections = load('apl_sections', null);
  if(!sections){
    sections = [{id:'sec-boiler-house', name:'Boiler House'}]; save('apl_sections', sections);
  }
  var equipment = load('apl_equipment', null);
  if(!equipment){
    equipment = [
      {id:'eq-loss', sectionId:'sec-boiler-house', name:'Loss Boiler'},
      {id:'eq-bay', sectionId:'sec-boiler-house', name:'Bay Boiler'},
      {id:'eq-zozen', sectionId:'sec-boiler-house', name:'Zozen HP Boiler'}
    ]; save('apl_equipment', equipment);
  }
  var daily = load('apl_daily', []);
  var hourly = load('apl_hourly', []);
  var awConfig = load('apl_appwrite', {});
  var currentBoiler = 'Loss Boiler';

  function isAdmin(){ return session && session.role==='Admin'; }
  function showView(name){
    ['login','dashboard','daily','hourly','reports','settings','admin'].forEach(function(v){
      var el = $('#view-'+v); if(el) el.classList.toggle('hidden', v!==name);
    });
    $('#bottomNav').style.display = (name==='login') ? 'none' : 'flex';
    $('#logoutBtn').style.display = session ? '' : 'none';
    $('#modeBadge').textContent = (session && session.mode==='appwrite') ? 'APPWRITE' : 'DEMO ONLY';
    if(name==='dashboard') renderDashboard();
    if(name==='daily') renderDailyList();
    if(name==='hourly') renderHourly();
    if(name==='reports') {}
    if(name==='settings') renderAw();
    if(name==='admin') renderAdmin();
  }
  function requireLogin(){
    if(!session){ showView('login'); return false; }
    return true;
  }
  document.addEventListener('click', function(e){
    var nav = e.target.closest('[data-nav]');
    if(nav){
      var v = nav.getAttribute('data-nav');
      if(v==='admin' && !isAdmin()){ alert('Admin only. Operators cannot open Admin screens.'); return; }
      if(!requireLogin()) return;
      showView(v);
    }
  });

  // ---- Login ----
  $('#loginBtn').onclick = async function(){
    var email = $('#loginEmail').value.trim().toLowerCase();
    var pass = $('#loginPassword').value;
    var cfg = load('apl_appwrite', {});
    if(cfg.endpoint && cfg.projectId){
      // Appwrite mode: try Appwrite first, do NOT silently fall back to demo on wrong password.
      if(!window.Appwrite){ $('#loginMsg').textContent = 'Appwrite SDK did not load (check internet). Clear Appwrite settings in Settings to use DEMO mode, or reload.'; return; }
      try{
        var client = new window.Appwrite.Client().setEndpoint(cfg.endpoint).setProject(cfg.projectId);
        var account = new window.Appwrite.Account(client);
        await account.createEmailPasswordSession(email, pass);
        var me = await account.get();
        var role = 'Operator', name = me.name || email;
        if(cfg.databaseId && cfg.users){
          try{
            var db = new window.Appwrite.Databases(client);
            var doc = await db.getDocument(cfg.databaseId, cfg.users, me.$id);
            if(doc.role) role = doc.role;
            if(doc.name) name = doc.name;
          }catch(err){ /* role lookup failed: default Operator */ }
        }
        session = {email: email, name: name, role: role, mode:'appwrite'}; save('apl_session', session);
        $('#loginMsg').textContent = 'Logged in via Appwrite as ' + role + '.';
        showView('dashboard'); return;
      }catch(err){
        $('#loginMsg').textContent = 'Appwrite login failed: ' + (err && err.message ? err.message : err) + ' — check email/password and Appwrite settings.';
        return;
      }
    }
    var u = load('apl_users', []).find(function(x){ return x.email===email && x.password===pass; });
    if(!u){ $('#loginMsg').textContent = 'Wrong demo email or password. Use admin@apl.test / admin123 or operator@apl.test / operator123.'; return; }
    session = {email: u.email, name: u.name, role: u.role, mode:'demo'}; save('apl_session', session);
    showView('dashboard');
  };
  $('#fillAdminBtn').onclick = function(){ $('#loginEmail').value='admin@apl.test'; $('#loginPassword').value='admin123'; };
  $('#fillOperatorBtn').onclick = function(){ $('#loginEmail').value='operator@apl.test'; $('#loginPassword').value='operator123'; };
  $('#logoutBtn').onclick = function(){ session=null; save('apl_session', null); showView('login'); };

  function renderDashboard(){
    if(!session) return;
    $('#welcomeText').textContent = 'Welcome, ' + session.name;
    $('#userLine').textContent = session.email + ' • Role: ' + session.role + ' • Mode: ' + (session.mode==='appwrite' ? 'Appwrite' : 'DEMO (local test data only)');
    $('#adminTiles').style.display = isAdmin() ? '' : 'none';
    var counts = {};
    hourly.forEach(function(h){ counts[h.boiler] = (counts[h.boiler]||0)+1; });
    $('#glance').innerHTML = '<p>Daily overview entries: <b>' + daily.length + '</b></p>'
      + '<p>Hourly rows — Loss: <b>' + (counts['Loss Boiler']||0) + '</b> • Bay: <b>' + (counts['Bay Boiler']||0) + '</b> • Zozen HP: <b>' + (counts['Zozen HP Boiler']||0) + '</b></p>'
      + (daily.length ? '<p>Last daily date: <b>' + daily[daily.length-1].date + '</b></p>' : '<p class="muted">No entries yet. Tap Daily to add the first once-daily overview.</p>');
  }

  // ---- Daily ----
  function renderDailyMeters(){
    var wrap = $('#dailyMeters'); wrap.innerHTML = '';
    DAILY_METERS.forEach(function(m){
      var div = document.createElement('div');
      div.innerHTML = '<h3>' + m.group + '</h3><div class="grid">'
        + '<div><label>Meter Reading</label><input type="number" step="any" id="d_' + m.r + '"></div>'
        + '<div><label>Consumption (auto, or manual on first day)</label><input type="number" step="any" id="d_' + m.c + '"></div></div>';
      wrap.appendChild(div);
    });
    wrap.querySelectorAll('input').forEach(function(inp){ inp.addEventListener('input', recomputeDaily); });
    $('#d_steam').addEventListener('input', recomputeDaily);
    $('#d_date').addEventListener('change', function(){ applyDailyPrev(); recomputeDaily(); });
  }
  function prevDailyFor(dateStr){
    if(!dateStr) return null;
    var prev = null;
    daily.forEach(function(d){ if(d.date < dateStr && (!prev || d.date > prev.date)) prev = d; });
    return prev;
  }
  function applyDailyPrev(){
    var prev = prevDailyFor($('#d_date').value);
    DAILY_METERS.forEach(function(m){
      var cons = $('#d_'+m.c);
      if(prev){ cons.readOnly = true; cons.title = 'Auto from previous day ' + prev.date; }
      else { cons.readOnly = false; cons.title = 'No previous day — type consumption manually'; }
    });
  }
  function readDailyForm(){
    var e = { date: $('#d_date').value, filledBy: $('#d_filledBy').value.trim(), remarks: $('#d_remarks').value.trim(),
      steam: toNum($('#d_steam').value), blowdown: toNum($('#d_blowdown').value) };
    DAILY_METERS.forEach(function(m){ e[m.r] = toNum($('#d_'+m.r).value); e[m.c] = toNum($('#d_'+m.c).value); });
    return e;
  }
  function recomputeDaily(){
    var raw = readDailyForm();
    var calc = calcDaily(raw, prevDailyFor(raw.date));
    DAILY_METERS.forEach(function(m){ var el = $('#d_'+m.c); if(el && calc[m.c]!==null && calc[m.c]!==undefined) el.value = calc[m.c]; });
    $('#d_totalGas').value = calc.totalGas===null?'':calc.totalGas;
    $('#d_totalDiesel').value = calc.totalDiesel===null?'':calc.totalDiesel;
    $('#d_totalSoft').value = calc.totalSoft===null?'':calc.totalSoft;
    $('#d_gasPerTon').value = calc.gasPerTon===null?'':Math.round(calc.gasPerTon*100)/100;
    $('#d_waterPerTon').value = calc.waterPerTon===null?'':Math.round(calc.waterPerTon*100)/100;
  }
  function renderDailyList(){
    var list = $('#dailyList');
    if(!daily.length){ list.innerHTML = '<p class="muted">No daily entries yet.</p>'; return; }
    var rows = daily.slice().sort(function(a,b){ return b.date.localeCompare(a.date); }).map(function(d){
      return '<tr><td>'+d.date+'</td><td>'+(d.totalGas===null?'':d.totalGas)+'</td><td>'+(d.totalSoft===null?'':d.totalSoft)+'</td><td>'+(d.steam===null?'':d.steam)+'</td><td>'+(d.gasPerTon===null?'':Math.round(d.gasPerTon*100)/100)+'</td><td>'+(d.filledBy||'')+'</td></tr>';
    }).join('');
    list.innerHTML = '<table><tr><th>Date</th><th>Total Gas</th><th>Total Soft</th><th>Steam</th><th>Gas m³/ton</th><th>Filled By</th></tr>'+rows+'</table>';
  }
  $('#saveDailyBtn').onclick = async function(){
    if(!isAdmin() && session.role!=='Operator' && !isAdmin()){ /* operators may save daily */ }
    var raw = readDailyForm();
    if(!raw.date){ $('#dailyMsg').textContent = 'Pick a date first.'; return; }
    var existing = daily.find(function(d){ return d.date===raw.date; });
    if(existing && !confirm('A daily overview already exists for ' + raw.date + '. Replace it?')){ $('#dailyMsg').textContent = 'Not saved — duplicate date kept.'; return; }
    var calc = calcDaily(raw, prevDailyFor(raw.date));
    calc.id = 'daily-'+raw.date; calc.section = 'Boiler House';
    if(existing){ daily = daily.map(function(d){ return d.date===raw.date ? calc : d; }); }
    else { daily.push(calc); }
    daily.sort(function(a,b){ return a.date.localeCompare(b.date); });
    save('apl_daily', daily);
    await saveToAppwrite('daily', calc);
    $('#dailyMsg').innerHTML = '<span class="ok">Saved daily overview for ' + raw.date + '. Total Gas: ' + (calc.totalGas===null?'-':calc.totalGas) + ', Gas m³/ton: ' + (calc.gasPerTon===null?'-':Math.round(calc.gasPerTon*100)/100) + '</span>';
    renderDailyList(); renderDashboard();
  };
  $('#clearDailyBtn').onclick = function(){ $$('#dailyMeters input, #d_steam, #d_blowdown, #d_remarks').forEach(function(i){ i.value=''; }); recomputeDaily(); };

  // ---- Hourly ----
  function renderHourly(){
    var tabs = $('#boilerTabs'); tabs.innerHTML = '';
    equipment.forEach(function(eq){
      var b = document.createElement('button');
      b.textContent = eq.name; b.className = (eq.name===currentBoiler) ? 'active' : '';
      b.onclick = function(){ currentBoiler = eq.name; renderHourly(); };
      tabs.appendChild(b);
    });
    var hasDiesel = /Loss|Zozen/i.test(currentBoiler);
    $('#boilerNote').innerHTML = 'Sheet for <b>' + currentBoiler + ' only</b>. Fill one row every hour, from shift start to end. The next operator continues on the next row of this same sheet. '
      + (hasDiesel ? 'This boiler has a diesel meter.' : 'Note: Bay Boiler has NO diesel meter in the v3 daily summary, so no diesel fields are shown here. Tell us if Bay also uses diesel.') + ' '
      + 'Feed Water Tank Level / Temp. below are for <b>this boiler’s own tank</b>, not shared.';
    var wrap = $('#hourlyFields'); wrap.innerHTML = '';
    hourlyFieldsFor(currentBoiler).forEach(function(f){
      var div = document.createElement('div');
      if(f.t==='select'){
        div.innerHTML = '<label>'+f.l+'</label><select id="h_'+f.k+'">'+f.opts.map(function(o){ return '<option>'+o+'</option>'; }).join('')+'</select>';
      } else {
        div.innerHTML = '<label>'+f.l+'</label><input type="'+(f.t||'text')+'" step="any" id="h_'+f.k+'"'+(f.auto?' readonly':'')+'>';
      }
      wrap.appendChild(div);
    });
    wrap.className = 'grid';
    if(session) $('#h_operator').value = session.name;
    renderHourlyList();
  }
  function renderHourlyList(){
    var rows = hourly.filter(function(h){ return h.boiler===currentBoiler; }).slice().sort(function(a,b){ return (b.date+b.time).localeCompare(a.date+a.time); }).slice(0,30);
    if(!rows.length){ $('#hourlyList').innerHTML = '<p class="muted">No rows yet for ' + currentBoiler + '. The first row you save becomes the previous row for the next hour’s auto-consumption.</p>'; return; }
    $('#hourlyList').innerHTML = '<table><tr><th>Date</th><th>Time</th><th>Shift</th><th>Steam Flow</th><th>Gas Cons.</th><th>Operator</th></tr>' + rows.map(function(h){
      return '<tr><td>'+h.date+'</td><td>'+h.time+'</td><td>'+h.shift+'</td><td>'+(h.steamFlow===null?'':h.steamFlow)+'</td><td>'+(h.fuelGasCons===null?'':h.fuelGasCons)+'</td><td>'+(h.operator||'')+'</td></tr>';
    }).join('') + '</table>';
  }
  $('#saveHourlyBtn').onclick = async function(){
    var raw = { boiler: currentBoiler, section: 'Boiler House', date: $('#h_date').value, time: $('#h_time').value, shift: $('#h_shift').value, operator: $('#h_operator').value.trim() };
    if(!raw.date || !raw.time){ $('#hourlyMsg').textContent = 'Pick date and time first.'; return; }
    hourlyFieldsFor(currentBoiler).forEach(function(f){
      var el = $('#h_'+f.k); raw[f.k] = (f.t==='number') ? toNum(el.value) : el.value;
    });
    var prevRows = hourly.filter(function(h){ return h.boiler===currentBoiler; });
    var prev = prevRows.length ? prevRows[prevRows.length-1] : null; // last saved row for this boiler
    var calc = calcHourly(raw, prev);
    calc.id = 'hourly-' + Date.now();
    hourly.push(calc); save('apl_hourly', hourly);
    await saveToAppwrite('hourly', calc);
    $('#hourlyMsg').innerHTML = '<span class="ok">Saved hourly row for ' + currentBoiler + ' at ' + raw.date + ' ' + raw.time + '. Gas consumption: ' + (calc.fuelGasCons===null?'- (first row, no previous)':calc.fuelGasCons) + '</span>';
    renderHourlyList();
  };
  $('#clearHourlyBtn').onclick = function(){ $$('#hourlyFields input, #hourlyFields select').forEach(function(i){ i.value=''; }); };

  // ---- Reports ----
  function filteredRows(){
    var from = $('#r_from').value, to = $('#r_to').value, b = $('#r_boiler').value;
    var inRange = function(d){ return (!from || d>=from) && (!to || d<=to); };
    var out = [];
    if(b==='all' || b==='daily') daily.filter(function(d){ return inRange(d.date); }).forEach(function(d){ out.push({date:d.date, time:'', type:'Daily', boiler:'Boiler House (all)', operator:d.filledBy||'', steamFlow:'', totalGas:d.totalGas, steam:d.steam, gasPerTon:d.gasPerTon, remarks:d.remarks||'', raw:d}); });
    if(b!=='daily') hourly.filter(function(h){ return inRange(h.date) && (b==='all' || h.boiler===b); }).forEach(function(h){ out.push({date:h.date, time:h.time, type:'Hourly', boiler:h.boiler, operator:h.operator||'', steamFlow:h.steamFlow, totalGas:h.fuelGasCons, steam:'', gasPerTon:'', remarks:h.remarks||'', raw:h}); });
    out.sort(function(a,c){ return (a.date+a.time).localeCompare(c.date+c.time); });
    return out;
  }
  $('#runReportBtn').onclick = function(){
    var rows = filteredRows();
    if(!rows.length){ $('#reportOut').innerHTML = '<p class="muted">No rows in this range.</p>'; return; }
    $('#reportOut').innerHTML = '<table><tr><th>Date</th><th>Time</th><th>Type</th><th>Boiler</th><th>Steam Flow / Steam</th><th>Gas Cons. / Total Gas</th><th>Operator</th><th>Remarks</th></tr>' + rows.map(function(r){
      return '<tr><td>'+r.date+'</td><td>'+r.time+'</td><td>'+r.type+'</td><td>'+r.boiler+'</td><td>'+(r.steamFlow!==''?r.steamFlow:r.steam)+'</td><td>'+(r.totalGas===null?'':r.totalGas)+'</td><td>'+r.operator+'</td><td>'+r.remarks+'</td></tr>';
    }).join('') + '</table><p class="muted">'+rows.length+' rows shown.</p>';
  };
  $('#exportCsvBtn').onclick = function(){
    var rows = filteredRows();
    if(!rows.length){ alert('No rows to export.'); return; }
    var headers = ['date','time','type','boiler','operator','steamFlow','totalGas','steam','gasPerTon','remarks'];
    var csv = headers.join(',') + '\n' + rows.map(function(r){
      return headers.map(function(h){ var v = (r[h]===null||r[h]===undefined)?'':String(r[h]); return '"' + v.replace(/"/g,'""') + '"'; }).join(',');
    }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = 'apl-connect-report.csv'; a.click();
  };

  // ---- Appwrite settings ----
  function renderAw(){
    var cfg = load('apl_appwrite', {});
    $('#aw_endpoint').value = cfg.endpoint||''; $('#aw_project').value = cfg.projectId||'';
    $('#aw_database').value = cfg.databaseId||''; $('#aw_daily').value = cfg.daily||'';
    $('#aw_hourly').value = cfg.hourly||''; $('#aw_sections').value = cfg.sections||'';
    $('#aw_equipment').value = cfg.equipment||''; $('#aw_users').value = cfg.users||'';
    $('#appwriteStatus').textContent = (cfg.endpoint && cfg.projectId) ? 'Appwrite configured (Project ID set). Login will use Appwrite.' : 'Appwrite NOT configured — app is in DEMO mode and works fully.';
  }
  $('#saveAwBtn').onclick = function(){
    awConfig = { endpoint: $('#aw_endpoint').value.trim(), projectId: $('#aw_project').value.trim(), databaseId: $('#aw_database').value.trim(),
      daily: $('#aw_daily').value.trim(), hourly: $('#aw_hourly').value.trim(), sections: $('#aw_sections').value.trim(), equipment: $('#aw_equipment').value.trim(), users: $('#aw_users').value.trim() };
    save('apl_appwrite', awConfig); renderAw(); alert('Appwrite settings saved. Log out and log in again to use Appwrite auth.');
  };
  $('#clearAwBtn').onclick = function(){ awConfig = {}; save('apl_appwrite', {}); renderAw(); };
  async function saveToAppwrite(kind, data){
    var cfg = load('apl_appwrite', {});
    if(!session || session.mode!=='appwrite' || !cfg.endpoint || !cfg.projectId || !cfg.databaseId) return false;
    if(!window.Appwrite) return false;
    var coll = (kind==='daily') ? cfg.daily : cfg.hourly;
    if(!coll) return false;
    try{
      var client = new window.Appwrite.Client().setEndpoint(cfg.endpoint).setProject(cfg.projectId);
      var db = new window.Appwrite.Databases(client);
      var payload = Object.assign({}, data);
      Object.keys(payload).forEach(function(k){ if(payload[k]===null||payload[k]===undefined) delete payload[k]; });
      // Appwrite document fields must be simple types; stringify the id/date handling is left to the owner’s collection schema.
      await db.createDocument(cfg.databaseId, coll, window.Appwrite.ID.unique(), payload);
      return true;
    }catch(err){ console.warn('Appwrite save failed, local copy kept:', err); return false; }
  }

  // ---- Admin / FAB ----
  function renderAdmin(){
    var us = load('apl_users', []);
    $('#userList').innerHTML = '<table><tr><th>Name</th><th>Email</th><th>Role</th></tr>' + us.map(function(u){ return '<tr><td>'+u.name+'</td><td>'+u.email+'</td><td>'+u.role+'</td></tr>'; }).join('') + '</table>';
    var secs = load('apl_sections', []), eqs = load('apl_equipment', []);
    $('#sectionList').innerHTML = secs.map(function(s){
      var list = eqs.filter(function(e){ return e.sectionId===s.id; }).map(function(e){ return e.name; }).join(', ') || '(no equipment yet)';
      return '<p><b>'+s.name+'</b>: '+list+'</p>';
    }).join('');
  }
  $('#addUserBtn').onclick = function(){
    if(!isAdmin()){ alert('Admin only.'); return; }
    var u = { name: $('#u_name').value.trim(), email: $('#u_email').value.trim().toLowerCase(), password: $('#u_pass').value, role: $('#u_role').value };
    if(!u.name || !u.email || !u.password){ alert('Fill name, email and password.'); return; }
    var us = load('apl_users', []); us.push(u); save('apl_users', us); renderAdmin(); alert('Demo user added (local test only).');
  };
  $('#fabBtn').onclick = function(){
    if(!isAdmin()){ alert('Admin only: only an Admin can add a section or equipment. Operators can only enter readings.'); return; }
    var sel = $('#m_sectionSelect'); sel.innerHTML = '';
    load('apl_sections', []).forEach(function(s){ var o=document.createElement('option'); o.value=s.id; o.textContent=s.name; sel.appendChild(o); });
    $('#modal').classList.remove('hidden');
    $('#m_type').onchange();
  };
  $('#m_type').onchange = function(){
    var isEq = $('#m_type').value==='equipment';
    $('#m_sectionWrap').style.display = isEq ? 'none' : '';
    $('#m_equipmentWrap').style.display = isEq ? '' : 'none';
  };
  $('#modalCloseBtn').onclick = function(){ $('#modal').classList.add('hidden'); };
  $('#modalSaveBtn').onclick = function(){
    if($('#m_type').value==='section'){
      var name = $('#m_section').value.trim(); if(!name){ $('#modalMsg').textContent='Type a section name.'; return; }
      var secs = load('apl_sections', []); secs.push({id:'sec-'+Date.now(), name:name}); save('apl_sections', secs); sections = secs;
    } else {
      var secId = $('#m_sectionSelect').value; var name2 = $('#m_equipment').value.trim(); if(!name2){ $('#modalMsg').textContent='Type an equipment name.'; return; }
      var eqs = load('apl_equipment', []); eqs.push({id:'eq-'+Date.now(), sectionId:secId, name:name2}); save('apl_equipment', eqs); equipment = eqs;
    }
    $('#modal').classList.add('hidden'); renderHourly(); alert('Saved. New sections/equipment need no code change.');
  };

  // ---- Init ----
  renderDailyMeters();
  renderHourly();
  if(session) showView('dashboard'); else showView('login');
  // defaults for today
  var today = new Date().toISOString().slice(0,10);
  if(!$('#d_date').value) $('#d_date').value = today;
  if(!$('#h_date').value) $('#h_date').value = today;
  if(session && !$('#d_filledBy').value) $('#d_filledBy').value = session.name;
})();
}
