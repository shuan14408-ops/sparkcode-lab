(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const qsa = (selector) => [...document.querySelectorAll(selector)];
  const state = {
    workspace: null,
    generator: null,
    course: null,
    taskIndex: 0,
    mode: 'learn',
    simActive: false,
    physicalConnected: false,
    port: null,
    writer: null,
    reader: null,
    ringColors: Array(12).fill(null),
    buttonPressed: false,
    runner: { cancelled: false },
    lastScore: null,
    toastTimer: null
  };

  const courses = {
    SRB00: {
      name: 'SmartRing 基礎互動', type: 'hardware',
      tasks: [
        task('連線偵察站', '判斷 SmartRing 是否已連線，並把清楚的狀態輸出到執行區。', ['spark_print', 'ring_connected'], ['輸出連線狀態', '使用連線判斷積木'], '先把「SmartRing 已連線？」放進「輸出」積木裡。'),
        task('點亮第一顆星', '讓第 1 顆 LED 亮起你選的顏色。', ['ring_set_led'], ['指定 LED 編號', '選擇一種顏色'], '從 SmartRing 分類拖出「第幾顆 LED 設為」。'),
        task('一圈同色光', '一次點亮 12 顆 LED，創造完整光環。', ['ring_set_all'], ['全部 LED 同時亮起', '顏色可自由選擇'], '使用「全部 LED 設為」積木。'),
        task('按鈕守門員', '只有按下按鈕 1 時才點亮燈環。', ['controls_if', 'ring_button_pressed', 'ring_set_all'], ['偵測按鈕', '使用條件判斷', '按下時亮燈'], '把按鈕狀態放入「如果」的六角形位置。'),
        task('雙色訊號燈', '按下按鈕後先亮珊瑚色，等待後再換成薄荷綠。', ['ring_button_pressed', 'ring_set_all', 'spark_wait'], ['按鈕觸發', '至少兩次顏色指令', '加入等待節奏'], '把兩個「全部 LED」積木串起來，中間放等待。')
      ]
    },
    SRA00: {
      name: 'SmartRing 陣列任務', type: 'hardware',
      tasks: [
        task('顏色背包', '建立一份三色清單，輸出清單內容。', ['lists_create_with', 'spark_print'], ['建立清單', '清單至少三項', '輸出結果'], '到「清單」分類找建立清單。'),
        task('依序點燈', '用清單保存 LED 編號，再用迴圈依序點亮。', ['lists_create_with', 'controls_forEach', 'ring_set_led'], ['建立編號清單', '使用清單迴圈', '點亮指定 LED'], '先做 [1, 4, 7, 10] 的編號清單。'),
        task('光環配色盤', '用顏色清單設計一段可重複的燈光節奏。', ['lists_create_with', 'controls_forEach', 'ring_set_all', 'spark_wait'], ['顏色清單', '逐項執行', '有時間節奏'], '每次換色後加入短暫等待。')
      ]
    },
    SRF00: {
      name: 'SmartRing 函式任務', type: 'hardware',
      tasks: [
        task('我的閃燈函式', '建立一個可以重複呼叫的閃燈函式。', ['procedures_defnoreturn', 'procedures_callnoreturn', 'ring_set_all'], ['定義函式', '呼叫函式', '控制 LED'], '先從「函式」建立一個不回傳值的函式。'),
        task('顏色參數', '讓函式收到一個顏色參數，控制整圈 LED。', ['procedures_defnoreturn', 'ring_set_all'], ['函式含參數', '參數控制顏色'], '點函式積木的齒輪，增加一個參數。'),
        task('節奏製造機', '組合函式與迴圈，做出可重複的燈光動畫。', ['procedures_defnoreturn', 'procedures_callnoreturn', 'controls_repeat_ext', 'spark_wait'], ['定義並呼叫函式', '使用重複迴圈', '控制節奏'], '把呼叫函式放進重複迴圈。')
      ]
    },
    SRC00: {
      name: 'SmartRing 動畫密室', type: 'hardware',
      tasks: [
        task('脈衝密碼', '用亮、滅與等待組合出三短一長的光密碼。', ['ring_set_all', 'ring_clear', 'spark_wait'], ['亮滅交替', '有長短節奏', '完整結束'], '短訊號可用 0.2 秒，長訊號可用 0.8 秒。'),
        task('追光軌道', '讓光點沿著 12 顆 LED 依序前進。', ['controls_for', 'ring_set_led', 'ring_clear'], ['使用計數迴圈', '依序改變編號', '清除前一畫面'], '迴圈從 1 數到 12。'),
        task('反應力挑戰', '隨機亮一顆燈，按下按鈕後輸出反應成功。', ['math_random_int', 'ring_set_led', 'ring_button_pressed', 'spark_print'], ['產生隨機數', '偵測按鈕', '輸出結果'], '隨機範圍設為 1 到 12。'),
        task('自由光秀', '綜合迴圈、條件與函式，設計至少 8 秒的原創動畫。', ['controls_repeat_ext', 'controls_if', 'procedures_defnoreturn', 'spark_wait'], ['使用迴圈', '加入條件', '封裝函式', '有動畫節奏'], '先畫出你的動畫時間軸，再開始堆積木。')
      ]
    },
    JSB00: {
      name: 'JavaScript 基礎練習', type: 'code',
      tasks: [
        task('向世界打招呼', '輸出一段包含自己名字的文字。', ['spark_print', 'text'], ['建立文字', '輸出文字'], '把文字積木接到輸出積木。'),
        task('數字魔法', '計算 24 × 7，並輸出答案。', ['spark_print', 'math_arithmetic'], ['完成乘法', '輸出計算結果'], '數學積木可以直接接在輸出積木後。'),
        task('記憶膠囊', '把喜歡的數字存進變數，再把它輸出。', ['variables_set', 'variables_get', 'spark_print'], ['設定變數', '讀取變數', '輸出結果'], '先建立一個叫「幸運數字」的變數。')
      ]
    },
    JSA00: {
      name: 'JavaScript 條件挑戰', type: 'code',
      tasks: [
        task('分數檢查器', '分數大於等於 80 時輸出「挑戰成功」。', ['controls_if', 'logic_compare', 'spark_print'], ['比較分數', '使用條件', '輸出訊息'], '比較積木的符號選「≥」。'),
        task('奇偶偵探', '判斷一個數是否能被 2 整除。', ['controls_if', 'math_modulo', 'logic_compare'], ['計算餘數', '比較是否為 0', '使用條件'], '偶數除以 2 的餘數會是 0。'),
        task('雙重門禁', '同時符合兩個條件才輸出通過。', ['controls_if', 'logic_operation', 'logic_compare'], ['建立兩個條件', '使用「而且」', '輸出判斷結果'], '到邏輯分類找「而且／或者」。')
      ]
    },
    CPB00: {
      name: '循環計數任務', type: 'code',
      tasks: [
        task('倒數發射', '從 5 倒數到 1，最後輸出「發射！」。', ['controls_for', 'spark_print'], ['使用計數迴圈', '完成倒數', '輸出發射訊息'], '把迴圈設定為從 5 到 1，每次減 1。'),
        task('十次歡呼', '重複輸出「加油！」共 10 次。', ['controls_repeat_ext', 'spark_print'], ['重複 10 次', '每次輸出文字'], '使用「重複執行」積木。'),
        task('乘法星球', '用迴圈輸出 3 的乘法表（1 到 9）。', ['controls_for', 'math_arithmetic', 'spark_print'], ['迴圈 1 到 9', '進行乘法', '逐列輸出'], '把迴圈變數乘以 3，再接到輸出。')
      ]
    }
  };

  function task(title, description, required, criteria, hint) {
    return { title, description, required, criteria, hint };
  }

  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function print(message, className = '') {
    const out = $('output');
    if (out.querySelector('.muted')) out.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = String(message);
    if (className) p.className = className;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
  }

  function saveProfile() {
    const profile = { className: $('studentClass').value, number: $('studentNumber').value, name: $('studentName').value };
    localStorage.setItem('sparkcode-profile', JSON.stringify(profile));
  }

  function restoreProfile() {
    try {
      const profile = JSON.parse(localStorage.getItem('sparkcode-profile') || '{}');
      $('studentClass').value = profile.className || '';
      $('studentNumber').value = profile.number || '';
      $('studentName').value = profile.name || '';
    } catch (_) {}
  }

  function defineSparkBlocks() {
    Blockly.defineBlocksWithJsonArray([
      { type:'spark_print', message0:'輸出 %1', args0:[{type:'input_value',name:'VALUE'}], previousStatement:null, nextStatement:null, style:'spark_blocks', tooltip:'把文字或數字顯示在執行輸出區' },
      { type:'spark_wait', message0:'等待 %1 秒', args0:[{type:'field_number',name:'SECONDS',value:0.5,min:0,max:30,precision:0.1}], previousStatement:null, nextStatement:null, style:'spark_blocks', tooltip:'暫停一小段時間' },
      { type:'ring_set_led', message0:'第 %1 顆 LED 設為 %2', args0:[{type:'field_number',name:'INDEX',value:1,min:1,max:12,precision:1},{type:'field_colour',name:'COLOR',colour:'#ff765f'}], previousStatement:null, nextStatement:null, style:'ring_blocks' },
      { type:'ring_set_all', message0:'全部 LED 設為 %1', args0:[{type:'field_colour',name:'COLOR',colour:'#69d2bd'}], previousStatement:null, nextStatement:null, style:'ring_blocks' },
      { type:'ring_clear', message0:'清除全部 LED', previousStatement:null, nextStatement:null, style:'ring_blocks' },
      { type:'ring_connected', message0:'SmartRing 已連線？', output:'Boolean', style:'ring_blocks' },
      { type:'ring_button_pressed', message0:'按鈕 %1 有按下？', args0:[{type:'field_dropdown',name:'BUTTON',options:[['1','1'],['2','2'],['3','3']]}], output:'Boolean', style:'ring_blocks' },
      { type:'ring_button_value', message0:'目前按鈕狀態', output:'String', style:'ring_blocks' }
    ]);
  }

  function registerGenerators() {
    const js = state.generator;
    const order = js.ORDER_ATOMIC ?? 0;
    js.forBlock.spark_print = (block, generator) => `output(${generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || "''"});\n`;
    js.forBlock.spark_wait = (block) => `await device.wait(${Number(block.getFieldValue('SECONDS')) || 0});\n`;
    js.forBlock.ring_set_led = (block) => `await device.setLed(${Number(block.getFieldValue('INDEX'))}, ${JSON.stringify(block.getFieldValue('COLOR'))});\n`;
    js.forBlock.ring_set_all = (block) => `await device.setAll(${JSON.stringify(block.getFieldValue('COLOR'))});\n`;
    js.forBlock.ring_clear = () => 'await device.clear();\n';
    js.forBlock.ring_connected = () => ['device.isConnected()', order];
    js.forBlock.ring_button_pressed = (block) => [`device.isButtonPressed(${Number(block.getFieldValue('BUTTON'))})`, order];
    js.forBlock.ring_button_value = () => ['device.buttonLabel()', order];
    js.INFINITE_LOOP_TRAP = 'if (runner.cancelled) { throw new Error("__STOP__"); }\n';
  }

  const toolbox = {
    kind:'categoryToolbox',
    contents:[
      {kind:'category',name:'任務工具',colour:'#ff765f',contents:[
        {kind:'block',type:'spark_print',inputs:{VALUE:{shadow:{type:'text',fields:{TEXT:'Hello, Spark!'}}}}},
        {kind:'block',type:'spark_wait'}
      ]},
      {kind:'category',name:'邏輯',categorystyle:'logic_category',contents:[
        {kind:'block',type:'controls_if'},{kind:'block',type:'logic_compare'},{kind:'block',type:'logic_operation'},
        {kind:'block',type:'logic_negate'},{kind:'block',type:'logic_boolean'},{kind:'block',type:'logic_null'},{kind:'block',type:'logic_ternary'}
      ]},
      {kind:'category',name:'迴圈',categorystyle:'loop_category',contents:[
        {kind:'block',type:'controls_repeat_ext',inputs:{TIMES:{shadow:{type:'math_number',fields:{NUM:10}}}}},
        {kind:'block',type:'controls_whileUntil'},{kind:'block',type:'controls_for',inputs:{FROM:{shadow:{type:'math_number',fields:{NUM:1}}},TO:{shadow:{type:'math_number',fields:{NUM:10}}},BY:{shadow:{type:'math_number',fields:{NUM:1}}}}},
        {kind:'block',type:'controls_forEach'},{kind:'block',type:'controls_flow_statements'}
      ]},
      {kind:'category',name:'數學',categorystyle:'math_category',contents:[
        {kind:'block',type:'math_number',fields:{NUM:123}},{kind:'block',type:'math_arithmetic',inputs:{A:{shadow:{type:'math_number',fields:{NUM:1}}},B:{shadow:{type:'math_number',fields:{NUM:1}}}}},
        {kind:'block',type:'math_single'},{kind:'block',type:'math_trig'},{kind:'block',type:'math_constant'},{kind:'block',type:'math_number_property'},
        {kind:'block',type:'math_round'},{kind:'block',type:'math_modulo'},{kind:'block',type:'math_constrain'},{kind:'block',type:'math_random_int'},{kind:'block',type:'math_random_float'}
      ]},
      {kind:'category',name:'文字',categorystyle:'text_category',contents:[
        {kind:'block',type:'text'},{kind:'block',type:'text_join'},{kind:'block',type:'text_append'},{kind:'block',type:'text_length'},
        {kind:'block',type:'text_isEmpty'},{kind:'block',type:'text_indexOf'},{kind:'block',type:'text_charAt'},{kind:'block',type:'text_getSubstring'},{kind:'block',type:'text_changeCase'},{kind:'block',type:'text_trim'}
      ]},
      {kind:'category',name:'清單',categorystyle:'list_category',contents:[
        {kind:'block',type:'lists_create_with'},{kind:'block',type:'lists_repeat'},{kind:'block',type:'lists_length'},{kind:'block',type:'lists_isEmpty'},
        {kind:'block',type:'lists_indexOf'},{kind:'block',type:'lists_getIndex'},{kind:'block',type:'lists_setIndex'},{kind:'block',type:'lists_getSublist'},{kind:'block',type:'lists_split'},{kind:'block',type:'lists_sort'}
      ]},
      {kind:'category',name:'變數',categorystyle:'variable_category',custom:'VARIABLE'},
      {kind:'category',name:'函式',categorystyle:'procedure_category',custom:'PROCEDURE'},
      {kind:'category',name:'SmartRing',colour:'#18a68d',contents:[
        {kind:'block',type:'ring_set_led'},{kind:'block',type:'ring_set_all'},{kind:'block',type:'ring_clear'},
        {kind:'block',type:'ring_connected'},{kind:'block',type:'ring_button_pressed'},{kind:'block',type:'ring_button_value'}
      ]}
    ]
  };

  function initBlockly() {
    if (!window.Blockly || !(window.javascript?.javascriptGenerator || Blockly.JavaScript)) {
      $('loadError').hidden = false;
      return;
    }
    defineSparkBlocks();
    state.generator = window.javascript?.javascriptGenerator || Blockly.JavaScript;
    registerGenerators();
    const theme = Blockly.Theme.defineTheme('sparkTheme', {
      base: Blockly.Themes.Classic,
      blockStyles: {
        spark_blocks:{colourPrimary:'#ff765f',colourSecondary:'#ff9b88',colourTertiary:'#d8503c'},
        ring_blocks:{colourPrimary:'#18a68d',colourSecondary:'#54cdb8',colourTertiary:'#087965'}
      },
      categoryStyles:{},
      componentStyles:{workspaceBackgroundColour:'#fdfcff',toolboxBackgroundColour:'#f0eef7',flyoutBackgroundColour:'#f8f7fc',flyoutForegroundColour:'#352f51',scrollbarColour:'#bbb5ce',insertionMarkerColour:'#ff765f',insertionMarkerOpacity:.35,cursorColour:'#6657d9'}
    });
    state.workspace = Blockly.inject('blocklyDiv', {
      toolbox,
      theme,
      renderer:'zelos',
      trashcan:true,
      grid:{spacing:22,length:2,colour:'#ded9e9',snap:true},
      zoom:{controls:true,wheel:true,startScale:.88,maxScale:1.5,minScale:.45,scaleSpeed:1.15,pinch:true},
      move:{scrollbars:true,drag:true,wheel:true}
    });
    state.workspace.addChangeListener((event) => {
      if (event.isUiEvent) return;
      updateCode();
      localStorage.setItem('sparkcode-autosave', JSON.stringify(makeSaveData()));
    });
    try {
      const saved = JSON.parse(localStorage.getItem('sparkcode-autosave') || 'null');
      if (saved?.workspace) Blockly.serialization.workspaces.load(saved.workspace, state.workspace);
      if (saved?.courseCode && courses[saved.courseCode]) {
        $('courseCode').value = saved.courseCode;
        loadCourse(saved.courseCode, saved.taskIndex || 0, false);
      }
    } catch (_) {}
    updateCode();
    window.addEventListener('resize', () => Blockly.svgResize(state.workspace));
  }

  function generatedCode() {
    if (!state.workspace || !state.generator) return '// Blockly 尚未載入';
    try { return state.generator.workspaceToCode(state.workspace) || '// 工作區目前沒有可執行的積木。'; }
    catch (error) { return `// 程式碼產生失敗：${error.message}`; }
  }

  function updateCode() {
    const code = generatedCode();
    $('codeView').querySelector('code').textContent = code;
    $('blockCount').textContent = `${state.workspace?.getAllBlocks(false).length || 0} 個積木`;
  }

  function currentTask() {
    return state.course?.tasks[state.taskIndex] || null;
  }

  function loadCourse(rawCode, taskIndex = 0, announce = true) {
    const code = String(rawCode || $('courseCode').value).trim().toUpperCase();
    const course = courses[code];
    if (!course) {
      toast('找不到課程代碼，請試試 SRB00 或 CPB00');
      $('courseCode').focus();
      return;
    }
    state.course = course;
    state.taskIndex = Math.min(Number(taskIndex) || 0, course.tasks.length - 1);
    state.lastScore = null;
    $('courseCode').value = code;
    $('taskSelect').disabled = false;
    $('taskSelect').innerHTML = course.tasks.map((item, i) => `<option value="${i}">${String(i + 1).padStart(2,'0')}｜${escapeHTML(item.title)}</option>`).join('');
    $('taskSelect').value = String(state.taskIndex);
    $('sampleBtn').disabled = false;
    $('assessBtn').disabled = false;
    $('submitBtn').disabled = true;
    $('detailBtn').disabled = false;
    renderTask();
    if (announce) {
      print(`已載入課程：${code}｜${course.name}`, 'ok');
      toast(`任務已載入：${course.tasks[state.taskIndex].title}`);
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function renderTask() {
    const item = currentTask();
    if (!item) return;
    const code = $('courseCode').value.toUpperCase();
    $('missionTrail').innerHTML = state.course.tasks.map((_, i) => `<div class="mission-step"><span class="mission-node ${i < state.taskIndex ? 'done' : i === state.taskIndex ? 'current' : ''}">${i < state.taskIndex ? '✓' : i + 1}</span>${i < state.course.tasks.length - 1 ? `<i class="mission-line ${i < state.taskIndex ? 'done' : ''}"></i>` : ''}</div>`).join('');
    $('taskInfo').className = 'task-info';
    $('taskInfo').innerHTML = `<span class="eyebrow">${escapeHTML(state.course.name)}</span><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(item.description)}</p><span class="task-code">${code}-${String(state.taskIndex + 1).padStart(2,'0')}</span><div class="criteria-preview">${item.criteria.slice(0,3).map(x => `<span>✓ ${escapeHTML(x)}</span>`).join('')}</div>`;
    $('dialogTitle').textContent = item.title;
    $('dialogContent').innerHTML = `<section class="dialog-section"><h3>任務說明</h3><p>${escapeHTML(item.description)}</p></section><section class="dialog-section"><h3>過關條件</h3><ol>${item.criteria.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</ol></section><div class="hint-card"><strong>卡關提示：</strong>${escapeHTML(item.hint)}</div>`;
  }

  function makeSaveData() {
    return {
      format:'sparkcode-lab', version:1,
      savedAt:new Date().toISOString(),
      profile:{className:$('studentClass').value,number:$('studentNumber').value,name:$('studentName').value},
      courseCode:$('courseCode').value.trim().toUpperCase(), taskIndex:state.taskIndex, mode:state.mode,
      workspace:state.workspace ? Blockly.serialization.workspaces.save(state.workspace) : null
    };
  }

  function download(name, content, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function sampleXml() {
    const code = $('courseCode').value.toUpperCase();
    const idx = state.taskIndex;
    const textShadow = (value) => `<value name="VALUE"><shadow type="text"><field name="TEXT">${value}</field></shadow></value>`;
    if (code === 'SRB00') {
      if (idx === 0) return `<xml><block type="spark_print" x="70" y="55"><value name="VALUE"><block type="ring_connected"></block></value></block></xml>`;
      if (idx === 1) return `<xml><block type="ring_set_led" x="70" y="55"><field name="INDEX">1</field><field name="COLOR">#ff765f</field></block></xml>`;
      if (idx === 2) return `<xml><block type="ring_set_all" x="70" y="55"><field name="COLOR">#69d2bd</field></block></xml>`;
      if (idx === 3) return `<xml><block type="controls_if" x="70" y="55"><value name="IF0"><block type="ring_button_pressed"><field name="BUTTON">1</field></block></value><statement name="DO0"><block type="ring_set_all"><field name="COLOR">#ff765f</field></block></statement></block></xml>`;
      return `<xml><block type="controls_if" x="70" y="55"><value name="IF0"><block type="ring_button_pressed"></block></value><statement name="DO0"><block type="ring_set_all"><field name="COLOR">#ff765f</field><next><block type="spark_wait"><field name="SECONDS">0.5</field><next><block type="ring_set_all"><field name="COLOR">#69d2bd</field></block></next></block></next></block></statement></block></xml>`;
    }
    if (code === 'CPB00') {
      if (idx === 1) return `<xml><block type="controls_repeat_ext" x="70" y="55"><value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow></value><statement name="DO"><block type="spark_print">${textShadow('加油！')}</block></statement></block></xml>`;
      return `<xml><block type="controls_for" x="70" y="55"><field name="VAR" id="count">i</field><value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="TO"><shadow type="math_number"><field name="NUM">9</field></shadow></value><value name="BY"><shadow type="math_number"><field name="NUM">1</field></shadow></value><statement name="DO"><block type="spark_print"><value name="VALUE"><block type="variables_get"><field name="VAR" id="count">i</field></block></value></block></statement></block></xml>`;
    }
    if (code === 'JSB00' && idx === 0) return `<xml><block type="spark_print" x="70" y="55">${textShadow('你好，我是創星探險家！')}</block></xml>`;
    if (code === 'JSB00' && idx === 1) return `<xml><block type="spark_print" x="70" y="55"><value name="VALUE"><block type="math_arithmetic"><field name="OP">MULTIPLY</field><value name="A"><shadow type="math_number"><field name="NUM">24</field></shadow></value><value name="B"><shadow type="math_number"><field name="NUM">7</field></shadow></value></block></value></block></xml>`;
    return `<xml><block type="spark_print" x="70" y="55">${textShadow('從這裡開始，再完成任務挑戰！')}</block></xml>`;
  }

  function loadSample() {
    if (!state.workspace || !currentTask()) return;
    if (state.workspace.getAllBlocks(false).length && !confirm('載入範例會清除目前工作區，確定要繼續嗎？')) return;
    state.workspace.clear();
    const dom = Blockly.utils.xml.textToDom(sampleXml());
    Blockly.Xml.domToWorkspace(dom, state.workspace);
    state.workspace.cleanUp();
    updateCode();
    toast('範例已放入工作區，可以再改造成自己的版本');
  }

  function assess() {
    const item = currentTask();
    if (!item || !state.workspace) return;
    const blocks = state.workspace.getAllBlocks(false);
    const types = blocks.map(b => b.type);
    const uniqueRequired = [...new Set(item.required)];
    const passed = uniqueRequired.filter(type => types.includes(type));
    let score = blocks.length ? 40 : 0;
    score += Math.round(60 * (passed.length / uniqueRequired.length));
    score = Math.min(100, score);
    const missing = uniqueRequired.filter(type => !types.includes(type));
    state.lastScore = {score, passed:passed.length, total:uniqueRequired.length, at:new Date().toISOString()};
    print(`系統評分：${score} 分｜完成 ${passed.length}/${uniqueRequired.length} 個核心條件`, 'score');
    if (missing.length) print(`再檢查：任務中還少了 ${missing.length} 種關鍵積木。`, 'error');
    else print('核心條件全數完成！你還可以加入自己的創意。', 'ok');
    $('submitBtn').disabled = score < 60;
    toast(score >= 80 ? '太棒了，任務已達標！' : '評分完成，依提示再調整看看');
  }

  function submitScore() {
    if (!state.lastScore) return;
    const record = {...state.lastScore,course:$('courseCode').value.toUpperCase(),task:state.taskIndex + 1,profile:{className:$('studentClass').value,number:$('studentNumber').value,name:$('studentName').value}};
    const records = JSON.parse(localStorage.getItem('sparkcode-scores') || '[]');
    records.push(record);
    localStorage.setItem('sparkcode-scores', JSON.stringify(records.slice(-100)));
    print('成績已儲存在這台裝置的學習紀錄中。', 'ok');
    toast('提交成功！學習紀錄已保存在此裝置');
  }

  function setTab(which) {
    const code = which === 'code';
    $('blocklyDiv').hidden = code;
    $('codeView').hidden = !code;
    $('blocksTab').classList.toggle('active', !code);
    $('codeTab').classList.toggle('active', code);
    $('blocksTab').setAttribute('aria-selected', String(!code));
    $('codeTab').setAttribute('aria-selected', String(code));
    if (!code && state.workspace) setTimeout(() => Blockly.svgResize(state.workspace), 0);
  }

  function buildRing() {
    const center = $('ledRing').querySelector('.ring-center');
    for (let i = 0; i < 12; i++) {
      const led = document.createElement('span');
      led.className = 'led'; led.dataset.index = i; led.style.setProperty('--i', i); led.textContent = i + 1;
      $('ledRing').insertBefore(led, center);
    }
  }

  function renderRing(message) {
    qsa('.led').forEach((led, i) => {
      const color = state.ringColors[i];
      led.classList.toggle('on', Boolean(color));
      if (color) led.style.setProperty('--led-color', color);
    });
    if (message) $('ringMessage').textContent = message;
  }

  function updateDeviceUI() {
    const connected = state.physicalConnected || state.simActive;
    const label = state.physicalConnected ? '實體裝置已連線' : state.simActive ? '模擬器已啟用' : '尚未連線';
    $('connectionStatus').textContent = label;
    $('connectionStatus').className = connected ? 'status-on' : 'status-off';
    $('testLedBtn').disabled = !connected;
    $('clearLedBtn').disabled = !connected;
    $('pressRingBtn').disabled = !state.simActive;
    $('footerDevice').textContent = `SmartRing：${label}`;
    $('connectBtn').innerHTML = state.physicalConnected ? '<span>●</span> 已連接' : '<span>◉</span> 連接裝置';
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#',''),16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }

  async function hardwareWrite(text) {
    $('lastCommand').textContent = text.trim();
    if (state.writer) {
      try { await state.writer.write(new TextEncoder().encode(text)); }
      catch (error) { print(`裝置傳送失敗：${error.message}`, 'error'); }
    }
  }

  const device = {
    isConnected: () => state.physicalConnected || state.simActive,
    isButtonPressed: (button) => Number(button) === 1 && state.buttonPressed,
    buttonLabel: () => state.buttonPressed ? '按鈕 1：按下' : '沒有按鈕被按下',
    async setLed(index, color) {
      if (state.runner.cancelled) throw new Error('__STOP__');
      const i = Math.max(1, Math.min(12, Number(index))) - 1;
      state.ringColors[i] = color;
      renderRing(`LED ${i + 1} 已點亮`);
      const [r,g,b] = hexToRgb(color);
      await hardwareWrite(`LED ${i + 1} ${r} ${g} ${b}\n`);
    },
    async setAll(color) {
      if (state.runner.cancelled) throw new Error('__STOP__');
      state.ringColors.fill(color);
      renderRing('整圈 LED 已點亮');
      const [r,g,b] = hexToRgb(color);
      await hardwareWrite(`ALL ${r} ${g} ${b}\n`);
    },
    async clear() {
      state.ringColors.fill(null);
      renderRing('LED 已清除');
      await hardwareWrite('CLEAR\n');
    },
    async wait(seconds) {
      const total = Math.max(0, Number(seconds) * 1000);
      const start = performance.now();
      while (performance.now() - start < total) {
        if (state.runner.cancelled) throw new Error('__STOP__');
        await new Promise(resolve => setTimeout(resolve, Math.min(50, total)));
      }
    }
  };

  async function connectSerial() {
    if (state.physicalConnected) {
      toast('SmartRing 已經連線');
      return;
    }
    if (!('serial' in navigator)) {
      toast('此瀏覽器不支援 Web Serial，已為你開啟模擬器');
      openSimulator(true);
      return;
    }
    try {
      state.port = await navigator.serial.requestPort();
      await state.port.open({baudRate:115200});
      state.writer = state.port.writable.getWriter();
      state.physicalConnected = true;
      updateDeviceUI();
      print('SmartRing 實體裝置連線成功。', 'ok');
      toast('SmartRing 已連線');
      readSerialLoop();
    } catch (error) {
      if (error.name !== 'NotFoundError') print(`連線失敗：${error.message}`, 'error');
      toast(error.name === 'NotFoundError' ? '已取消選擇裝置' : '連線失敗，請檢查裝置');
    }
  }

  async function readSerialLoop() {
    if (!state.port?.readable) return;
    const decoder = new TextDecoder();
    state.reader = state.port.readable.getReader();
    let buffer = '';
    try {
      while (state.physicalConnected) {
        const {value, done} = await state.reader.read();
        if (done) break;
        buffer += decoder.decode(value, {stream:true});
        const lines = buffer.split(/\r?\n/); buffer = lines.pop() || '';
        lines.forEach(line => {
          $('buttonStatus').textContent = line || '收到資料';
          if (/BTN\s*1\s*[:=]\s*1/i.test(line)) state.buttonPressed = true;
          if (/BTN\s*1\s*[:=]\s*0/i.test(line)) state.buttonPressed = false;
        });
      }
    } catch (error) { print(`讀取裝置中止：${error.message}`, 'error'); }
    finally { try { state.reader?.releaseLock(); } catch (_) {} state.reader = null; }
  }

  async function runCode() {
    const code = generatedCode();
    if (!state.workspace?.getAllBlocks(false).length) { toast('先放入一些積木再執行'); return; }
    state.runner = {cancelled:false};
    $('runBtn').disabled = true; $('stopBtn').disabled = false;
    print('▶ 開始執行程式…', 'ok');
    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('device','output','runner', code);
      await fn(device, (value) => print(value), state.runner);
      if (!state.runner.cancelled) print('✓ 程式執行完畢。', 'ok');
    } catch (error) {
      if (error.message === '__STOP__') print('■ 程式已中止。', 'error');
      else print(`程式錯誤：${error.message}`, 'error');
    } finally {
      $('runBtn').disabled = false; $('stopBtn').disabled = true;
    }
  }

  function stopCode() {
    state.runner.cancelled = true;
    $('stopBtn').disabled = true;
  }

  function openSimulator(forceOpen) {
    const show = forceOpen === true || $('simulator').hidden;
    $('simulator').hidden = !show;
    state.simActive = show;
    $('simBtn').innerHTML = show ? '<span>●</span> 關閉模擬' : '<span>◌</span> 開啟模擬';
    updateDeviceUI();
    renderRing(show ? '等待程式指令' : '模擬器已關閉');
  }

  function setButton(pressed) {
    state.buttonPressed = pressed;
    $('buttonStatus').textContent = pressed ? '按鈕 1：按下' : '按鈕 1：放開';
    $('simButtonReadout').textContent = pressed ? '按鈕 1：按下' : '按鈕：未按下';
    $('ringMessage').textContent = pressed ? '收到按鈕 1' : '等待程式指令';
  }

  function initDragging() {
    const box = $('simulator'); const handle = $('simDrag');
    let dragging = false, dx = 0, dy = 0;
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true; dx = e.clientX - box.offsetLeft; dy = e.clientY - box.offsetTop;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      box.style.left = `${Math.max(6, Math.min(innerWidth - box.offsetWidth - 6, e.clientX - dx))}px`;
      box.style.top = `${Math.max(6, Math.min(innerHeight - box.offsetHeight - 6, e.clientY - dy))}px`;
      box.style.right = 'auto'; box.style.bottom = 'auto';
    });
    handle.addEventListener('pointerup', () => dragging = false);
  }

  function bindUI() {
    ['studentClass','studentNumber','studentName'].forEach(id => $(id).addEventListener('input', saveProfile));
    $('clearProfileBtn').addEventListener('click', () => {
      ['studentClass','studentNumber','studentName'].forEach(id => $(id).value = ''); saveProfile(); toast('學生資料已清除');
    });
    $('courseCode').addEventListener('keydown', e => { if (e.key === 'Enter') loadCourse(); });
    $('loadCourseBtn').addEventListener('click', () => loadCourse());
    $('taskSelect').addEventListener('change', () => { state.taskIndex = Number($('taskSelect').value); state.lastScore = null; $('submitBtn').disabled = true; renderTask(); toast(`切換至任務 ${state.taskIndex + 1}`); });
    qsa('[data-course]').forEach(btn => btn.addEventListener('click', () => { $('courseCode').value = btn.dataset.course; loadCourse(); }));
    qsa('.mode-switch button').forEach(btn => btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode; qsa('.mode-switch button').forEach(x => x.classList.toggle('active', x === btn));
      $('footerMode').textContent = state.mode === 'learn' ? '學習模式' : '挑戰模式';
      $('detailBtn').hidden = state.mode === 'challenge'; toast(state.mode === 'learn' ? '學習模式：可查看提示' : '挑戰模式：提示已隱藏');
    }));
    $('sampleBtn').addEventListener('click', loadSample);
    $('assessBtn').addEventListener('click', assess);
    $('submitBtn').addEventListener('click', submitScore);
    $('blocksTab').addEventListener('click', () => setTab('blocks'));
    $('codeTab').addEventListener('click', () => setTab('code'));
    $('copyCodeBtn').addEventListener('click', async () => { try { await navigator.clipboard.writeText(generatedCode()); toast('JavaScript 已複製'); } catch (_) { toast('無法使用剪貼簿，請從程式碼頁手動複製'); } });
    $('saveBtn').addEventListener('click', () => {
      const code = $('courseCode').value.trim().toUpperCase() || 'free'; const who = $('studentNumber').value || 'student';
      download(`sparkcode_${code}_${who}.spark.json`, JSON.stringify(makeSaveData(), null, 2)); toast('積木檔案已下載');
    });
    $('loadInput').addEventListener('change', async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data.workspace) throw new Error('找不到積木資料');
        state.workspace.clear(); Blockly.serialization.workspaces.load(data.workspace, state.workspace);
        if (data.courseCode && courses[data.courseCode]) loadCourse(data.courseCode, data.taskIndex || 0, false);
        if (data.profile) { $('studentClass').value=data.profile.className||''; $('studentNumber').value=data.profile.number||''; $('studentName').value=data.profile.name||''; saveProfile(); }
        updateCode(); toast('積木檔案載入成功');
      } catch (error) { toast(`載入失敗：${error.message}`); }
      e.target.value = '';
    });
    $('clearBtn').addEventListener('click', () => { if (!state.workspace?.getAllBlocks(false).length || confirm('確定要清除工作區所有積木嗎？')) { state.workspace?.clear(); toast('工作區已清除'); } });
    $('runBtn').addEventListener('click', runCode); $('stopBtn').addEventListener('click', stopCode);
    $('connectBtn').addEventListener('click', connectSerial);
    $('simBtn').addEventListener('click', () => openSimulator()); $('simClose').addEventListener('click', () => openSimulator(false));
    $('testLedBtn').addEventListener('click', () => device.setLed(1, '#ff765f')); $('clearLedBtn').addEventListener('click', () => device.clear());
    $('pressRingBtn').addEventListener('click', () => { setButton(true); setTimeout(() => setButton(false), 500); });
    const press = $('simPress'); ['pointerdown','touchstart'].forEach(ev => press.addEventListener(ev, () => setButton(true), {passive:true}));
    ['pointerup','pointerleave','touchend'].forEach(ev => press.addEventListener(ev, () => setButton(false), {passive:true}));
    $('clearOutputBtn').addEventListener('click', () => $('output').innerHTML = '<p class="muted">輸出已清除。</p>');
    $('detailBtn').addEventListener('click', () => $('taskDialog').showModal()); $('dialogClose').addEventListener('click', () => $('taskDialog').close());
    $('taskDialog').addEventListener('click', e => { if (e.target === $('taskDialog')) $('taskDialog').close(); });
    qsa('[data-collapse]').forEach(btn => btn.addEventListener('click', () => {
      const body = $(btn.dataset.collapse); const open = !body.hidden; body.hidden = open; btn.setAttribute('aria-expanded', String(!open)); btn.querySelector('b').textContent = open ? '展開⌄' : '收合⌃';
    }));
  }

  function init() {
    restoreProfile(); buildRing(); bindUI(); initDragging(); updateDeviceUI(); initBlockly();
  }

  init();
})();
