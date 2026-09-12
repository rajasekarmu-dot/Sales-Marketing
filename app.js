/**
 * AI Sales & Operations Workflow System
 * Powered by Google Gemini API
 * De AI Solutions Pte Ltd - Specification Implementation
 */

// Global App State
const state = {
  apiKey: localStorage.getItem('gemini_api_key') || 'AQ.Ab8RN6KK3pnzsEyLJYan84rnBbB6u3DP7MIUQ2Jhpw1tffyiTQ',
  activeTab: 'chat',
  activeDocType: 'quote', // 'quote', 'deposit', 'final'
  activeJob: {
    id: 'DE-2026-0891',
    customerName: 'Alex Tan',
    phone: '+65 9123 4567',
    email: 'alex.tan@example.sg',
    propertyType: 'Landed Semi-Detached',
    location: 'Bukit Timah, Singapore',
    timeline: 'Next 2 Weeks',
    service: 'Garden Landscaping & Turf Installation',
    preferredChannel: 'WhatsApp',
    status: 'QUALIFYING', // QUALIFYING, QUALIFIED, BRIEFED, QUOTE_REVIEW, QUOTE_APPROVED, DEPOSIT_SENT, OPEN, SCHEDULED, COMPLETED, CLOSED
    quotes: [
      {
        version: 1,
        date: '10 Sep 2026',
        items: [
          { desc: 'Site Survey & Landscape Architecture Design', qty: '1 Job', rate: 500, total: 500 },
          { desc: 'Existing Lawn Clearance & Soil Preparation (250 sq m)', qty: '250 sq m', rate: 4, total: 1000 },
          { desc: 'Premium Pearl Grass Turf Supply & Laying', qty: '250 sq m', rate: 8, total: 2000 }
        ],
        subtotal: 3500,
        gst: 315,
        total: 3815,
        depositRate: 30,
        depositDue: 1144.50,
        finalDue: 2670.50,
        status: 'SUPERSEDED',
        feedback: 'User requested addition of automated irrigation drip system'
      },
      {
        version: 2,
        date: '10 Sep 2026',
        items: [
          { desc: 'Site Survey & Landscape Architecture Design', qty: '1 Job', rate: 500, total: 500 },
          { desc: 'Existing Lawn Clearance & Soil Preparation (250 sq m)', qty: '250 sq m', rate: 4, total: 1000 },
          { desc: 'Premium Pearl Grass Turf Supply & Laying', qty: '250 sq m', rate: 8, total: 2000 },
          { desc: 'Smart Automated Drip Irrigation System Installation', qty: '1 System', rate: 800, total: 800 }
        ],
        subtotal: 4300,
        gst: 387,
        total: 4687,
        depositRate: 30,
        depositDue: 1406.10,
        finalDue: 3280.90,
        status: 'APPROVED',
        feedback: 'Approved by Operator'
      }
    ],
    currentQuoteIndex: 1,
    depositConfirmed: false,
    finalConfirmed: false,
    schedule: {
      date: '2026-09-18',
      time: '09:00 AM - 05:00 PM',
      crew: 'Team Alpha (3 Crew Members)',
      notes: 'Bring turf cutter & drip irrigation kit'
    }
  },
  chatMessages: [
    {
      sender: 'bot',
      text: 'Hello! 👋 Welcome to De AI Solutions. How can we help you with your garden, landscaping, or property maintenance needs today?',
      time: '10:14 AM'
    }
  ],
  telegramFeed: [
    {
      id: 1,
      tag: 'SYSTEM BOOT',
      title: 'Workflow Engine Online',
      time: '09:00 AM',
      body: 'Mac mini Hosted Runtime initialized. AI Agent ready to handle lead qualification (REQ-02) and Telegram approvals.'
    }
  ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initLucideIcons();
  updateApiKeyStatusUI();
  setupEventListeners();
  renderChatMessages();
  renderTelegramFeed();
  renderKanbanBoard();
  renderDocument();
  renderCalendarEvents();
});

function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function updateApiKeyStatusUI() {
  const statusText = document.getElementById('apiKeyStatusText');
  const dot = document.getElementById('apiKeyDot');
  const input = document.getElementById('geminiApiKeyInput');
  
  if (state.apiKey && state.apiKey.trim().length > 5) {
    statusText.innerText = 'Gemini API: Key Active';
    dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
    input.value = state.apiKey;
  } else {
    statusText.innerText = 'Gemini API: Key Required';
    dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-ping';
  }
}

// Event Listeners Registration
function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', (e) => {
      const targetTab = tabBtn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // API Key Modal
  document.getElementById('apiKeyBtn').addEventListener('click', () => {
    document.getElementById('apiKeyModal').classList.remove('hidden');
  });

  document.getElementById('closeApiKeyModal').addEventListener('click', () => {
    document.getElementById('apiKeyModal').classList.add('hidden');
  });

  document.getElementById('saveApiKeyBtn').addEventListener('click', async () => {
    const key = document.getElementById('geminiApiKeyInput').value.trim();
    if (key) {
      state.apiKey = key;
      localStorage.setItem('gemini_api_key', key);
      updateApiKeyStatusUI();
      document.getElementById('apiKeyModal').classList.add('hidden');
      addTelegramPost('API KEY UPDATED', 'Gemini API Connection Validated', 'User provided updated API credentials.');
    }
  });

  // Reset Demo Data
  document.getElementById('resetDemoBtn').addEventListener('click', () => {
    if (confirm('Reset workflow simulation to initial state?')) {
      location.reload();
    }
  });

  // Quick Sample Customer Query
  document.getElementById('quickPresetBtn').addEventListener('click', () => {
    const input = document.getElementById('chatInput');
    input.value = "Hi, I have a landed semi-d at Bukit Timah and want to redo my garden turf and landscaping within 2 weeks. Can I get a quote?";
  });

  // Chat Form Submission
  document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    // Append customer message
    addChatMessage('customer', msg);
    input.value = '';

    // Show bot typing indicator
    showBotTyping(true);

    try {
      // Call Gemini API or smart fallback
      const botResponse = await generateGeminiResponse(msg);
      showBotTyping(false);
      addChatMessage('bot', botResponse.text);

      // If Gemini returned structured lead qualification attributes
      if (botResponse.extracted) {
        updateLeadAttributes(botResponse.extracted);
      }
    } catch (err) {
      console.error(err);
      showBotTyping(false);
      addChatMessage('bot', "Thank you for the details! I've noted your location in Bukit Timah for turf installation. Our technical team is compiling an initial brief.");
    }
  });

  // REQ-02 Force Qualify Button
  document.getElementById('forceQualifyBtn').addEventListener('click', () => {
    qualifyAndSendToOperator();
  });

  // REQ-03 Brief Agent
  document.getElementById('briefAgentBtn').addEventListener('click', () => {
    const pref = document.getElementById('prefChannel').value;
    state.activeJob.preferredChannel = pref;
    state.activeJob.status = 'QUOTE_REVIEW';
    
    addTelegramPost('REQ-03 BRIEF RECEIVED', 'Agent Instructed to Prepare Quote', `Preferred Channel: ${pref}. Property: ${state.activeJob.propertyType}. Preparing quote draft v2.`);
    renderKanbanBoard();
    switchTab('operator');
  });

  // REQ-04 Approve Quote
  document.getElementById('opApproveQuoteBtn').addEventListener('click', () => {
    state.activeJob.status = 'QUOTE_APPROVED';
    state.activeJob.quotes[state.activeJob.currentQuoteIndex].status = 'APPROVED';
    
    addTelegramPost('REQ-04 QUOTE APPROVED', 'Quote DE-2026-0891-V2 Approved', 'Operator approved quotation. Triggering REQ-05 Quote & Deposit Invoice Delivery to customer.');
    
    // Auto trigger REQ-05 deposit invoice delivery
    setTimeout(() => {
      addChatMessage('bot', `📄 *Official Quotation & Deposit Invoice*\nHi ${state.activeJob.customerName}, your quote for ${state.activeJob.service} has been approved!\n\nTotal: $${state.activeJob.quotes[state.activeJob.currentQuoteIndex].total.toFixed(2)}\nRequired 30% Deposit: $${state.activeJob.quotes[state.activeJob.currentQuoteIndex].depositDue.toFixed(2)}\n\nPlease pay via PayNow (UEN: 202612345R) and send us a screenshot!`);
      state.activeJob.status = 'DEPOSIT_SENT';
      renderKanbanBoard();
      if (window.confetti) confetti();
    }, 1200);

    renderKanbanBoard();
  });

  // REQ-04 Amend Quote
  document.getElementById('opAmendQuoteBtn').addEventListener('click', () => {
    const feedback = prompt('Enter quote amendment instructions for Gemini Agent:', 'Add 1 year maintenance package ($600)');
    if (feedback) {
      const activeQuote = state.activeJob.quotes[state.activeJob.currentQuoteIndex];
      const newVersionNum = activeQuote.version + 1;
      
      const newItems = [...activeQuote.items, { desc: '1-Year Seasonal Maintenance Package', qty: '1 Year', rate: 600, total: 600 }];
      const subtotal = newItems.reduce((acc, i) => acc + i.total, 0);
      const gst = subtotal * 0.09;
      const total = subtotal + gst;
      const depositDue = total * 0.3;
      const finalDue = total * 0.7;

      const newQuote = {
        version: newVersionNum,
        date: '10 Sep 2026',
        items: newItems,
        subtotal,
        gst,
        total,
        depositRate: 30,
        depositDue,
        finalDue,
        status: 'PENDING_APPROVAL',
        feedback: `Revised per operator instructions: "${feedback}"`
      };

      state.activeJob.quotes.push(newQuote);
      state.activeJob.currentQuoteIndex = state.activeJob.quotes.length - 1;

      addTelegramPost('REQ-04 AMENDMENT DRAFTED', `Quote Draft v${newVersionNum} Ready for Review`, `Audit Trail: ${feedback}. New Total: $${total.toFixed(2)}.`);
      renderKanbanBoard();
      renderDocument();
    }
  });

  // REQ-06 Confirm Deposit Received
  document.getElementById('confirmDepositBtn').addEventListener('click', () => {
    state.activeJob.depositConfirmed = true;
    state.activeJob.status = 'OPEN';

    addTelegramPost('REQ-06 DEPOSIT CONFIRMED', 'Manual Trust Point Validated • Job OPEN', 'Payment screenshot verified by Operator. Job status set to OPEN. Queued for REQ-07 Job Scheduling.');

    // Trigger REQ-07 Job Scheduling
    setTimeout(() => {
      state.activeJob.status = 'SCHEDULED';
      addTelegramPost('REQ-07 JOB SCHEDULED', 'Google Calendar Event Created', `Scheduled on ${state.activeJob.schedule.date} (${state.activeJob.schedule.time}). Assigned to: ${state.activeJob.schedule.crew}. Customer & Crew notified.`);
      renderKanbanBoard();
      renderCalendarEvents();
    }, 1500);

    renderKanbanBoard();
  });

  // REQ-08 Mark Job Completed
  document.getElementById('markCompletedBtn').addEventListener('click', () => {
    state.activeJob.status = 'COMPLETED';
    addTelegramPost('REQ-08 JOB COMPLETED', 'On-Site Crew Completed Job', `Location: ${state.activeJob.location}. Triggering REQ-09 Final Invoice generation.`);

    // REQ-09 Final Invoice
    setTimeout(() => {
      const activeQuote = state.activeJob.quotes[state.activeJob.currentQuoteIndex];
      addChatMessage('bot', `🎉 *Job Completed & Final Invoice*\nHi ${state.activeJob.customerName}, the team has completed work at ${state.activeJob.location}!\n\nFinal Balance Due (after 30% deposit): $${activeQuote.finalDue.toFixed(2)}\nPayNow UEN: 202612345R (Ref: DE-891-FINAL)`);
      if (window.confetti) confetti();
    }, 1000);

    renderKanbanBoard();
  });

  // REQ-10 Close Job
  document.getElementById('closeJobBtn').addEventListener('click', () => {
    state.activeJob.finalConfirmed = true;
    state.activeJob.status = 'CLOSED';
    addTelegramPost('REQ-10 JOB CLOSED', 'Final Payment Confirmed • Record Archived', 'Full job lifecycle complete (Lead → Quote → Deposit → Schedule → Completion → Final Invoice → Payment). Record archived.');
    renderKanbanBoard();
    if (window.confetti) confetti({ particleCount: 150, spread: 80 });
  });

  // Document Selector Tabs
  document.querySelectorAll('.doc-selector-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.doc-selector-btn').forEach(b => {
        b.classList.remove('active', 'bg-slate-800', 'border-slate-700');
        b.classList.add('bg-slate-950', 'border-slate-800');
      });
      btn.classList.add('active', 'bg-slate-800', 'border-slate-700');
      state.activeDocType = btn.getAttribute('data-doc');
      renderDocument();
    });
  });

  // Rebuild PayNow Invoice Controls
  document.getElementById('rebuildInvoiceBtn').addEventListener('click', () => {
    renderDocument();
  });

  // Create New Sample Job
  document.getElementById('createNewJobBtn').addEventListener('click', () => {
    alert('New sample lead initialized for testing pipeline!');
    location.reload();
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    if (content.id === `tab-${tabId}`) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  });

  initLucideIcons();
}

// Gemini API Lead Qualification Engine
async function generateGeminiResponse(userPrompt) {
  const apiKey = state.apiKey;
  
  if (apiKey && apiKey.trim().length > 10) {
    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-pro-latest',
      'gemini-1.5-flash-latest'
    ];

    const systemInstruction = `You are an automated WhatsApp lead qualification AI agent for De AI Solutions Pte Ltd, a professional landscaping & property maintenance firm in Singapore.
Your goal is to converse politely, answer questions, and qualify the lead by gathering:
1. Service type required (e.g. grass turfing, landscape design, tree pruning)
2. Property type (e.g. Landed Semi-D, Bungalow, Condo)
3. Location in Singapore (e.g. Bukit Timah, East Coast)
4. Timeline (e.g. Immediate, 2 weeks)

Be conversational and helpful. At the very end of your response, output a JSON block in format:
\`\`\`json
{
  "serviceType": "Extracted Service",
  "propertyType": "Extracted Property",
  "location": "Extracted Location",
  "timeline": "Extracted Timeline",
  "isQualified": true
}
\`\`\``;

    const body = {
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\nCustomer message: "${userPrompt}"` }] }
      ]
    };

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const fullText = data.candidates[0].content.parts[0].text;
            
            // Extract JSON if present
            let extracted = null;
            const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              try { extracted = JSON.parse(jsonMatch[1]); } catch(e){}
            }

            const cleanText = fullText.replace(/```json[\s\S]*?```/, '').trim();
            return { text: cleanText, extracted };
          }
        }
      } catch (e) {
        console.warn(`Model ${model} failed, trying next candidate...`, e);
      }
    }
  }

  // Fallback response if offline or key has restricted permissions
  let reply = "Thank you for reaching out! We specialize in premium landscaping, lawn turfing, and property greening across Singapore. To help us prepare an accurate quotation, could you share your property type and preferred timeline?";

  let extracted = {
    serviceType: "Garden Landscaping & Turf Installation",
    propertyType: "Landed Semi-Detached",
    location: "Bukit Timah, SG",
    timeline: "Next 2 Weeks",
    isQualified: true
  };

  if (userPrompt.toLowerCase().includes('bukit timah') || userPrompt.toLowerCase().includes('landed')) {
    reply = "Excellent! Landed Semi-D properties in Bukit Timah are right in our service area. We can conduct a full clearance, soil prep, and lay premium Pearl Grass turf. I have logged your request for our operator to review!";
  }

  return { text: reply, extracted };
}

function updateLeadAttributes(attr) {
  if (attr.serviceType) {
    document.getElementById('leadService').innerText = attr.serviceType;
    state.activeJob.service = attr.serviceType;
  }
  if (attr.propertyType) {
    document.getElementById('leadProperty').innerText = attr.propertyType;
    state.activeJob.propertyType = attr.propertyType;
  }
  if (attr.location) {
    document.getElementById('leadLocation').innerText = attr.location;
    state.activeJob.location = attr.location;
  }
  if (attr.timeline) {
    document.getElementById('leadTimeline').innerText = attr.timeline;
    state.activeJob.timeline = attr.timeline;
  }

  if (attr.isQualified) {
    document.getElementById('leadStatusBadge').innerText = 'Qualified Lead';
    document.getElementById('leadStatusBadge').className = 'text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  }
}

function qualifyAndSendToOperator() {
  state.activeJob.status = 'QUALIFIED';
  document.getElementById('leadStatusBadge').innerText = 'Qualified & Forwarded';
  document.getElementById('leadStatusBadge').className = 'text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold';

  addTelegramPost(
    'REQ-02 QUALIFIED LEAD',
    `New Lead: ${state.activeJob.customerName} (${state.activeJob.phone})`,
    `Service: ${state.activeJob.service}\nProperty: ${state.activeJob.propertyType}\nLocation: ${state.activeJob.location}\nTimeline: ${state.activeJob.timeline}\nStatus: Ready for Operator Briefing (REQ-03)`
  );

  renderKanbanBoard();
  switchTab('operator');
}

// Chat UI Renderers
function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';

  state.chatMessages.forEach(msg => {
    const isBot = msg.sender === 'bot';
    const div = document.createElement('div');
    div.className = `flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`;
    
    div.innerHTML = `
      <div class="max-w-[80%] rounded-2xl px-4 py-2.5 shadow-md text-sm ${
        isBot 
          ? 'bg-whatsapp-bubbleIn text-slate-100 rounded-tl-none border border-slate-700/40' 
          : 'bg-whatsapp-bubbleOut text-white rounded-tr-none'
      }">
        <p class="whitespace-pre-line">${escapeHtml(msg.text)}</p>
        <span class="text-[10px] text-slate-400 block text-right mt-1">${msg.time}</span>
      </div>
    `;
    container.appendChild(div);
  });

  container.scrollTop = container.scrollHeight;
}

function addChatMessage(sender, text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  state.chatMessages.push({ sender, text, time });
  renderChatMessages();
}

function showBotTyping(isTyping) {
  const container = document.getElementById('chatMessages');
  let typingElem = document.getElementById('botTypingElem');
  
  if (isTyping) {
    if (!typingElem) {
      typingElem = document.createElement('div');
      typingElem.id = 'botTypingElem';
      typingElem.className = 'flex justify-start mb-3';
      typingElem.innerHTML = `
        <div class="bg-whatsapp-bubbleIn text-slate-400 rounded-2xl px-4 py-2 text-xs rounded-tl-none border border-slate-700/40 flex items-center space-x-2">
          <span>Gemini Agent is typing</span>
          <span class="flex space-x-1">
            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </span>
        </div>
      `;
      container.appendChild(typingElem);
    }
  } else if (typingElem) {
    typingElem.remove();
  }
  container.scrollTop = container.scrollHeight;
}

// Telegram Feed Renderers
function renderTelegramFeed() {
  const feed = document.getElementById('telegramFeed');
  feed.innerHTML = '';

  state.telegramFeed.forEach(post => {
    const div = document.createElement('div');
    div.className = 'bg-telegram-card border border-slate-700/60 rounded-xl p-4 space-y-2 shadow-lg';
    div.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono tracking-wider">${post.tag}</span>
        <span class="text-xs text-slate-400 font-mono">${post.time}</span>
      </div>
      <h4 class="text-sm font-semibold text-white">${escapeHtml(post.title)}</h4>
      <p class="text-xs text-slate-300 whitespace-pre-line font-sans">${escapeHtml(post.body)}</p>
    `;
    feed.appendChild(div);
  });

  feed.scrollTop = feed.scrollHeight;
}

function addTelegramPost(tag, title, body) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  state.telegramFeed.push({ id: Date.now(), tag, title, time, body });
  renderTelegramFeed();

  const opBadge = document.getElementById('opBadge');
  if (opBadge) {
    opBadge.innerText = parseInt(opBadge.innerText || 0) + 1;
  }
}

// Kanban Board Renderer
function renderKanbanBoard() {
  const cols = {
    qualifying: document.getElementById('col-qualifying'),
    quote: document.getElementById('col-quote'),
    deposit: document.getElementById('col-deposit'),
    execution: document.getElementById('col-execution'),
    closed: document.getElementById('col-closed')
  };

  Object.values(cols).forEach(c => { if(c) c.innerHTML = ''; });

  const job = state.activeJob;
  const activeQuote = job.quotes[job.currentQuoteIndex];

  const cardHTML = `
    <div class="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-lg hover:border-slate-700 transition">
      <div class="flex items-center justify-between">
        <span class="text-xs font-mono font-bold text-slate-400">${job.id}</span>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">${job.status}</span>
      </div>

      <div>
        <h4 class="font-bold text-white text-sm">${job.customerName}</h4>
        <p class="text-xs text-slate-400">${job.propertyType} • ${job.location}</p>
      </div>

      <div class="p-2 bg-slate-900 rounded-lg text-xs space-y-1">
        <p class="text-slate-300"><span class="text-slate-500">Service:</span> ${job.service}</p>
        <p class="text-slate-300"><span class="text-slate-500">Quote Value:</span> <strong class="text-emerald-400">$${activeQuote.total.toFixed(2)}</strong> (v${activeQuote.version})</p>
      </div>

      <div class="pt-1 flex items-center justify-between text-[11px] text-slate-400">
        <span>Channel: ${job.preferredChannel}</span>
        <span class="text-sky-400 hover:underline cursor-pointer" onclick="switchTab('operator')">Operator Actions →</span>
      </div>
    </div>
  `;

  // Sort into appropriate column based on status
  if (['QUALIFYING', 'QUALIFIED'].includes(job.status)) {
    cols.qualifying.innerHTML = cardHTML;
  } else if (['BRIEFED', 'QUOTE_REVIEW'].includes(job.status)) {
    cols.quote.innerHTML = cardHTML;
  } else if (['QUOTE_APPROVED', 'DEPOSIT_SENT', 'OPEN'].includes(job.status)) {
    cols.deposit.innerHTML = cardHTML;
  } else if (['SCHEDULED', 'COMPLETED'].includes(job.status)) {
    cols.execution.innerHTML = cardHTML;
  } else if (['CLOSED'].includes(job.status)) {
    cols.closed.innerHTML = cardHTML;
  }

  // Update counts
  document.getElementById('cnt-qualifying').innerText = cols.qualifying.children.length;
  document.getElementById('cnt-quote').innerText = cols.quote.children.length;
  document.getElementById('cnt-deposit').innerText = cols.deposit.children.length;
  document.getElementById('cnt-execution').innerText = cols.execution.children.length;
  document.getElementById('cnt-closed').innerText = cols.closed.children.length;
}

// PayNow & Document Render Studio
function renderDocument() {
  const job = state.activeJob;
  const quote = job.quotes[job.currentQuoteIndex];
  
  const titleElem = document.getElementById('docTypeTitle');
  const numberElem = document.getElementById('docNumber');
  const depositRow = document.getElementById('depositDueRow');
  const paynowBox = document.getElementById('paynowBox');

  const uen = document.getElementById('paynowUen').value || '202612345R';
  const name = document.getElementById('paynowName').value || 'De AI Solutions Pte Ltd';

  document.getElementById('displayUen').innerText = uen;
  document.getElementById('docClientName').innerText = job.customerName;
  document.getElementById('docClientContact').innerText = `${job.phone} • ${job.email}`;
  document.getElementById('docClientAddr').innerText = `${job.propertyType}, ${job.location}`;
  document.getElementById('docJobScope').innerText = job.service;

  // Render Line Items
  const itemsContainer = document.getElementById('docLineItems');
  itemsContainer.innerHTML = '';
  quote.items.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100';
    tr.innerHTML = `
      <td class="py-2.5 font-medium text-slate-800">${item.desc}</td>
      <td class="py-2.5 text-center text-slate-600">${item.qty}</td>
      <td class="py-2.5 text-right text-slate-600 font-mono">$${item.rate.toFixed(2)}</td>
      <td class="py-2.5 text-right font-bold text-slate-900 font-mono">$${item.total.toFixed(2)}</td>
    `;
    itemsContainer.appendChild(tr);
  });

  document.getElementById('docSubtotal').innerText = `$${quote.subtotal.toFixed(2)}`;
  document.getElementById('docGst').innerText = `$${quote.gst.toFixed(2)}`;
  document.getElementById('docGrandTotal').innerText = `$${quote.total.toFixed(2)}`;
  document.getElementById('docDepositDue').innerText = `$${quote.depositDue.toFixed(2)}`;

  let payAmount = quote.depositDue;
  let refCode = `DE-891-DEP`;

  if (state.activeDocType === 'quote') {
    titleElem.innerText = 'OFFICIAL QUOTATION';
    titleElem.className = 'inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded';
    numberElem.innerText = `DE-2026-0891-V${quote.version}`;
    document.getElementById('docVersionTag').innerText = `Audit Status: ${quote.status} (v${quote.version})`;
    depositRow.classList.remove('hidden');
    paynowBox.classList.remove('hidden');
  } else if (state.activeDocType === 'deposit') {
    titleElem.innerText = 'DEPOSIT INVOICE (30%)';
    titleElem.className = 'inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded';
    numberElem.innerText = `INV-2026-0891-DEP`;
    document.getElementById('docVersionTag').innerText = `Payment Due: 30% Deposit ($${quote.depositDue.toFixed(2)})`;
    depositRow.classList.remove('hidden');
    paynowBox.classList.remove('hidden');
  } else if (state.activeDocType === 'final') {
    titleElem.innerText = 'FINAL INVOICE (REMAINING BALANCE)';
    titleElem.className = 'inline-block px-3 py-1 bg-purple-600 text-white text-xs font-bold uppercase tracking-wider rounded';
    numberElem.innerText = `INV-2026-0891-FINAL`;
    document.getElementById('docVersionTag').innerText = `Balance Due: $${quote.finalDue.toFixed(2)} (Deposit $${quote.depositDue.toFixed(2)} Paid)`;
    depositRow.classList.add('hidden');
    paynowBox.classList.remove('hidden');
    payAmount = quote.finalDue;
    refCode = `DE-891-FINAL`;
  }

  document.getElementById('displayRef').innerText = refCode;

  // Generate PayNow SGQR Code
  generatePayNowQR(uen, payAmount, refCode);
}

function generatePayNowQR(uen, amount, ref) {
  const qrContainer = document.getElementById('qrcodeCanvas');
  qrContainer.innerHTML = '';

  // Singapore PayNow SGQR Spec payload construction
  // 00020101021226480009SG.PAYNOW01012020820...
  const payload = `00020101021226480009SG.PAYNOW010120208${uen}030105204000053037025406${amount.toFixed(2)}5802SG5923De AI Solutions Pte Ltd6009Singapore62170513${ref}6304`;

  if (window.QRCode) {
    new QRCode(qrContainer, {
      text: payload,
      width: 110,
      height: 110,
      colorDark : "#0f172a",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.M
    });
  }
}

// Calendar View Renderer
function renderCalendarEvents() {
  const container = document.getElementById('calendarEventsList');
  if (!container) return;

  const job = state.activeJob;
  const isScheduled = ['SCHEDULED', 'COMPLETED', 'CLOSED'].includes(job.status);

  container.innerHTML = `
    <div class="bg-slate-950 border ${isScheduled ? 'border-emerald-500/50' : 'border-slate-800'} rounded-xl p-5 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider ${isScheduled ? 'text-emerald-400' : 'text-slate-500'} flex items-center gap-1.5">
          <i data-lucide="calendar-check" class="w-4 h-4"></i> ${isScheduled ? 'Confirmed Google Calendar Booking' : 'Pending Scheduling'}
        </span>
        <span class="text-xs font-mono bg-slate-900 text-slate-300 px-2 py-0.5 rounded font-bold">${job.schedule.date}</span>
      </div>

      <div>
        <h4 class="font-bold text-white text-base">${job.service}</h4>
        <p class="text-xs text-slate-400 mt-0.5">${job.customerName} • ${job.location}</p>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-900">
        <div>
          <span class="text-slate-500 block">Time Slot</span>
          <span class="font-semibold text-slate-200">${job.schedule.time}</span>
        </div>
        <div>
          <span class="text-slate-500 block">Assigned Crew</span>
          <span class="font-semibold text-emerald-400">${job.schedule.crew}</span>
        </div>
      </div>

      <div class="pt-2 flex items-center justify-between text-xs">
        <span class="text-slate-400">Google Calendar Event Sync Status:</span>
        <span class="font-bold ${isScheduled ? 'text-emerald-400' : 'text-slate-500'}">${isScheduled ? 'Synced (Event ID: #gcal_891)' : 'Awaiting REQ-06 Deposit'}</span>
      </div>
    </div>
  `;

  initLucideIcons();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
