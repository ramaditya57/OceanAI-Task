const API_URL = "";

// --- AUTHENTICATION LOGIC ---

function getToken() {
    return localStorage.getItem('access_token');
}

function checkAuth() {
    if (getToken()) {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }
}

// Initial check
checkAuth();

let isLoginMode = true;
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const loginBtn = document.getElementById('login-btn');
    const regBtn = document.getElementById('register-btn');
    const toggleLink = document.getElementById('toggle-auth');

    if (isLoginMode) {
        title.innerText = "Login";
        loginBtn.style.display = "block";
        regBtn.style.display = "none";
        toggleLink.innerText = "Need an account? Register";
    } else {
        title.innerText = "Register";
        loginBtn.style.display = "none";
        regBtn.style.display = "block";
        toggleLink.innerText = "Have an account? Login";
    }
}

async function handleRegister() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
    });

    if (response.ok) {
        alert("Registration successful! Please login.");
        toggleAuthMode();
    } else {
        const data = await response.json();
        alert("Error: " + data.detail);
    }
}

async function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    const formData = new URLSearchParams();
    formData.append('username', user);
    formData.append('password', pass);

    const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        checkAuth();
    } else {
        alert("Invalid credentials");
    }
}

function logout() {
    localStorage.removeItem('access_token');
    location.reload();
}

// --- HELPER FOR AUTH HEADERS ---

async function authFetch(url, options = {}) {
    const token = getToken();
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(url, options);
    if (response.status === 401) {
        logout(); 
    }
    return response;
}

// --- YOUR ORIGINAL APP LOGIC (Updated to use authFetch) ---

let currentProjectId = null;

// New function: View previous projects
async function loadMyProjects() {
    const response = await authFetch('/projects/my');
    if (response.ok) {
        const projects = await response.json();
        const listDiv = document.getElementById('project-list');
        if (projects.length === 0) {
            listDiv.innerHTML = "<p>No existing projects found.</p>";
            return;
        }
        listDiv.innerHTML = "<h3>Your Projects:</h3>" + projects.map(p => 
            `<div style="padding:5px; border-bottom:1px solid #ccc; cursor:pointer;" onclick="loadProject(${p.id})">
                📄 <strong>${p.title}</strong> (${p.doc_type})
             </div>`
        ).join('');
    }
}

async function createProject() {
    const title = document.getElementById('projTitle').value;
    const type = document.getElementById('projType').value;
    const sectionsRaw = document.getElementById('projSections').value;

    if (!title || !sectionsRaw) return alert("Please fill all fields");

    const sections = sectionsRaw.split(',').map(s => s.trim()).filter(s => s);

    document.getElementById('loadingMsg').style.display = 'block';

    try {
        // Updated to use authFetch
        const response = await authFetch('/projects/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, doc_type: type, sections })
        });

        const data = await response.json();
        currentProjectId = data.project_id;

        // Load the editor
        loadProject(currentProjectId);

        // UI Switch
        document.getElementById('create-step').style.display = 'none';
        document.getElementById('editor-step').style.display = 'block';
    } catch (e) {
        alert("Error generating content");
        console.error(e);
    } finally {
        document.getElementById('loadingMsg').style.display = 'none';
    }
}

async function loadProject(id) {
    currentProjectId = id;
    const response = await authFetch(`/projects/${id}`);
    const project = await response.json();

    document.getElementById('create-step').style.display = 'none';
    document.getElementById('editor-step').style.display = 'block';
    document.getElementById('displayTitle').innerText = project.title;
    
    const container = document.getElementById('sections-container');
    container.innerHTML = '';
    
    // Sort sections
    const sections = project.sections.sort((a, b) => a.order_index - b.order_index);

    sections.forEach(s => {
        // Determine icons for feedback
        const likeClass = s.feedback === 'like' ? 'selected' : '';
        const dislikeClass = s.feedback === 'dislike' ? 'selected' : '';

        const div = document.createElement('div');
        div.className = 'section-block';
        div.innerHTML = `
            <div class="section-header">
                <span>${s.title}</span>
                <div class="feedback-area">
                    <button class="like-btn ${likeClass}" onclick="setFeedback(${s.id}, 'like', this)"><i class="fas fa-thumbs-up"></i></button>
                    <button class="dislike-btn ${dislikeClass}" onclick="setFeedback(${s.id}, 'dislike', this)"><i class="fas fa-thumbs-down"></i></button>
                </div>
            </div>

            <div class="tab-bar">
                <button class="tab-btn active" onclick="switchTab(${s.id}, 'edit')">Editor</button>
                <button class="tab-btn" onclick="switchTab(${s.id}, 'notes')">Notes</button>
            </div>

            <!-- EDITOR TAB -->
            <div id="tab-edit-${s.id}" class="editor-area">
                <textarea id="content-${s.id}">${s.content}</textarea>
                
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <button onclick="saveManual(${s.id})" style="background:#28a745; color:white; border:none; padding:8px 15px; cursor:pointer;">Save Manual Changes</button>
                    <button onclick="toggleAI(${s.id})" style="background:#17a2b8; color:white; border:none; padding:8px 15px; cursor:pointer;">✨ AI Refine</button>
                </div>

                <!-- AI Tools (Hidden) -->
                <div id="ai-box-${s.id}" class="ai-tools">
                    <input type="text" id="ai-prompt-${s.id}" placeholder="e.g. Make it more formal..." style="width:70%; padding:5px;">
                    <button onclick="generatePreview(${s.id})" style="padding:5px 10px;">Generate Preview</button>
                    
                    <!-- Preview Box -->
                    <div id="preview-box-${s.id}" class="preview-box">
                        <strong>AI Suggestion:</strong>
                        <p id="preview-text-${s.id}" style="font-style:italic; white-space: pre-wrap;"></p>
                        <div style="margin-top:5px;">
                            <button onclick="applyAI(${s.id})" style="background:#28a745; color:white; border:none; padding:5px 10px;">Apply</button>
                            <button onclick="discardAI(${s.id})" style="background:#dc3545; color:white; border:none; padding:5px 10px;">Discard</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- NOTES TAB -->
            <div id="tab-notes-${s.id}" class="notes-area">
                <textarea id="notes-${s.id}" style="width:100%; height:100px; padding:10px; border:1px solid #ddd;" placeholder="Add private notes for this section here...">${s.notes || ''}</textarea>
                <button onclick="saveNotes(${s.id})" style="margin-top:10px; background:#007bff; color:white; border:none; padding:8px 15px;">Save Note</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// --- TAB SWITCHING ---
function switchTab(id, tab) {
    // Hide all
    document.getElementById(`tab-edit-${id}`).style.display = 'none';
    document.getElementById(`tab-notes-${id}`).style.display = 'none';
    
    // Show selected
    if (tab === 'edit') document.getElementById(`tab-edit-${id}`).style.display = 'block';
    if (tab === 'notes') document.getElementById(`tab-notes-${id}`).style.display = 'block';

    // Update buttons (Simple toggle class logic removed for brevity, but functional)
}

function toggleAI(id) {
    const box = document.getElementById(`ai-box-${id}`);
    box.classList.toggle('visible');
}

// --- ACTIONS ---

async function saveManual(id) {
    const content = document.getElementById(`content-${id}`).value;
    await authFetch(`/sections/${id}`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ content: content })
    });
    alert("Saved!");
}

async function saveNotes(id) {
    const notes = document.getElementById(`notes-${id}`).value;
    await authFetch(`/sections/${id}`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ notes: notes })
    });
    alert("Note saved!");
}

async function setFeedback(id, type, btnElement) {
    await authFetch(`/sections/${id}`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ feedback: type })
    });
    
    // Visual update
    const parent = btnElement.parentElement;
    parent.querySelector('.like-btn').classList.remove('selected');
    parent.querySelector('.dislike-btn').classList.remove('selected');
    btnElement.classList.add('selected');
}

// --- AI FLOW ---

async function generatePreview(id) {
    const instruction = document.getElementById(`ai-prompt-${id}`).value;
    if(!instruction) return;
    
    const previewBox = document.getElementById(`preview-box-${id}`);
    previewBox.style.display = 'block';
    document.getElementById(`preview-text-${id}`).innerText = "Generating...";

    const response = await authFetch('/refine/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_id: id, instruction: instruction })
    });
    const data = await response.json();
    
    // Store temporarily in the DOM
    document.getElementById(`preview-text-${id}`).innerText = data.preview_content;
    document.getElementById(`preview-text-${id}`).dataset.raw = data.preview_content;
}

async function applyAI(id) {
    const newContent = document.getElementById(`preview-text-${id}`).dataset.raw;
    // Update textarea
    document.getElementById(`content-${id}`).value = newContent;
    // Save to DB
    await saveManual(id);
    // Hide AI tools
    discardAI(id);
}

function discardAI(id) {
    document.getElementById(`ai-box-${id}`).classList.remove('visible');
    document.getElementById(`preview-box-${id}`).style.display = 'none';
    document.getElementById(`ai-prompt-${id}`).value = "";
}

async function exportDoc() {
    if (!currentProjectId) return;
    
    const token = getToken();
    // Fetch blob with auth headers
    const response = await fetch(`/export/${currentProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Basic check for extension
        const type = document.getElementById('projType').value; 
        a.download = `document.${type}`; 
        document.body.appendChild(a);
        a.click();
        a.remove();
    } else {
        alert("Export failed or unauthorized");
    }
}