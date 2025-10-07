class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentSort = 'created-desc';
        this.searchTerm = '';
        this.isEditing = null;
        
        this.initializeElements();
        this.loadFromLocalStorage();
        this.bindEvents();
        this.updateUI();
    }

    /**
     * Initialisiert alle DOM-Elemente
     */
    initializeElements() {
        // Formulare und Inputs
        this.addTaskForm = document.getElementById('add-task-form');
        this.taskInput = document.getElementById('task-input');
        this.prioritySelect = document.getElementById('priority-select');
        
        //Suchfunktion
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search');
        
        //Filter und Sortierung
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.sortSelect = document.getElementById('sort-select');
        
        //UI-Elemente
        this.tasksList = document.getElementById('tasks-list');
        this.noTasksMessage = document.querySelector('.no-tasks');
        this.themeToggle = document.getElementById('theme-toggle');
        
        //Statistiken
        this.totalTasksEl = document.getElementById('total-tasks');
        this.totalCountEl = document.getElementById('total-count');
        this.pendingCountEl = document.getElementById('pending-count');
        this.completedCountEl = document.getElementById('completed-count');
        this.completionRateEl = document.getElementById('completion-rate');
    }

    
    bindEvents() {
        //Formular-Submission
        this.addTaskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        
        //Suchfunktion
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        
        //Filter-Buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });
        
        //Sortierung
        this.sortSelect.addEventListener('change', (e) => this.handleSort(e));
        
        //Theme-Toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        //Keyboard Shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    /**
     * Verarbeitet das Hinzufügen einer neuen Aufgabe
     */
    handleAddTask(e) {
        e.preventDefault();
        
        const text = this.taskInput.value.trim();
        const priority = this.prioritySelect.value;
        
        if (!text) {
            this.showNotification('Bitte geben Sie eine Aufgabe ein!', 'error');
            return;
        }
        
        if (this.isEditing) {
            this.updateTask(this.isEditing, text, priority);
            this.isEditing = null;
            this.taskInput.placeholder = 'Neue Aufgabe hinzufügen...';
        } else {
            this.addTask(text, priority);
        }
        
        this.taskInput.value = '';
        this.taskInput.focus();
        this.updateUI();
        this.saveToLocalStorage();
    }

    /**
     * Fügt eine neue Aufgabe hinzu
     */
    addTask(text, priority) {
        const task = {
            id: Date.now().toString(),
            text,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        this.tasks.push(task);
        this.showNotification('Aufgabe hinzugefügt!', 'success');
    }

    /**
     * Aktualisiert eine bestehende Aufgabe
     */
    updateTask(id, text, priority) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.text = text;
            task.priority = priority;
            task.updatedAt = new Date().toISOString();
            this.showNotification('Aufgabe aktualisiert!', 'success');
        }
    }

    /**
     * Löscht eine Aufgabe
     */
    deleteTask(id) {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            taskElement.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.updateUI();
                this.saveToLocalStorage();
                this.showNotification('Aufgabe gelöscht!', 'info');
            }, 300);
        }
    }

    /**
     * Schaltet den Erledigt-Status einer Aufgabe um
     */
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.updateUI();
            this.saveToLocalStorage();
            
            const message = task.completed ? 'Aufgabe erledigt!' : 'Aufgabe wieder geöffnet!';
            this.showNotification(message, task.completed ? 'success' : 'info');
        }
    }

    /**
     * Bearbeitet eine Aufgabe
     */
    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.taskInput.value = task.text;
            this.prioritySelect.value = task.priority;
            this.taskInput.focus();
            this.isEditing = id;
            this.taskInput.placeholder = 'Aufgabe bearbeiten...';
        }
    }

    /**
     * Verarbeitet die Suchfunktion
     */
    handleSearch(e) {
        this.searchTerm = e.target.value.toLowerCase();
        this.updateUI();
    }

    /**
     * Löscht die Suche
     */
    clearSearch() {
        this.searchTerm = '';
        this.searchInput.value = '';
        this.updateUI();
    }

    /**
     * Verarbeitet Filter-Änderungen
     */
    handleFilter(e) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.updateUI();
    }

    /**
     * Verarbeitet Sortier-Änderungen
     */
    handleSort(e) {
        this.currentSort = e.target.value;
        this.updateUI();
    }

    /**
     * Schaltet zwischen Light/Dark Theme um
     */
    toggleTheme() {
        const currentTheme = document.documentElement.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        
        const icon = this.themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        this.showNotification(`Theme zu ${newTheme === 'dark' ? 'Dunkel' : 'Hell'} gewechselt!`, 'info');
    }

    /**
     * Verarbeitet Tastatur-Shortcuts
     */
    handleKeyboard(e) {
        // Ctrl/Cmd + K für Suche fokussieren
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.searchInput.focus();
        }
        
        // Escape für Edit-Modus abbrechen
        if (e.key === 'Escape' && this.isEditing) {
            this.cancelEdit();
        }
    }

    /**
     * Bricht den Edit-Modus ab
     */
    cancelEdit() {
        this.isEditing = null;
        this.taskInput.value = '';
        this.taskInput.placeholder = ;
        this.prioritySelect.selectedIndex = 1; 
    }
	
	
	getFilteredAndSortedTasks() {
        let filtered = [...this.tasks];
        
        
        if (this.searchTerm) {
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(this.searchTerm)
            );
        }
        
      
        switch (this.currentFilter) {
            case 'pending':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
        }
        
     
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'created-desc':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'created-asc':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'alphabetical':
                    return a.text.localeCompare(b.text);
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                default:
                    return 0;
            }
        });
        
        return filtered;
    }

  
    updateUI() {
        const filteredTasks = this.getFilteredAndSortedTasks();
        this.renderTasks(filteredTasks);
        this.updateStatistics();
        this.updateTaskCount();
    }

   
    renderTasks(tasks) {
        if (tasks.length === 0) {
            this.tasksList.innerHTML = `
                <div class="no-tasks">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Keine Aufgaben gefunden</p>
                    <p class="no-tasks-subtitle">
                        ${this.searchTerm ? 'Versuchen Sie eine andere Suchanfrage' : 'Fügen Sie Ihre erste Aufgabe hinzu!'}
                    </p>
                </div>
            `;
            return;
        }
        
        this.tasksList.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');
        
    
        this.addTaskEventListeners();
    }

  
    createTaskHTML(task) {
        const createdDate = new Date(task.createdAt).toLocaleDateString('de-DE');
        const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString('de-DE') : '';
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-action="toggle">
                    <i class="fas fa-check"></i>
                </div>
                
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="task-priority priority-${task.priority}">
                            ${this.getPriorityLabel(task.priority)}
                        </span>
                        <span class="task-date">
                            <i class="fas fa-calendar"></i>
                            ${createdDate}
                        </span>
                        ${task.completed ? `
                            <span class="task-date" style="color: var(--status-completed)">
                                <i class="fas fa-check-circle"></i>
                                ${completedDate}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <div class="task-actions">
                    <button class="task-action-btn edit" data-action="edit" title="Bearbeiten">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" data-action="delete" title="Löschen">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Fügt Event-Listener für Task-Actions hinzu
     */
    addTaskEventListeners() {
        const taskItems = this.tasksList.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            const taskId = item.dataset.id;
            
            item.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]');
                if (!action) return;
                
                e.stopPropagation();
                
                switch (action.dataset.action) {
                    case 'toggle':
                        this.toggleTask(taskId);
                        break;
                    case 'edit':
                        this.editTask(taskId);
                        break;
                    case 'delete':
                        if (confirm('Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?')) {
                            this.deleteTask(taskId);
                        }
                        break;
                }
            });
        });
    }

   
    updateStatistics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
       
        this.animateNumber(this.totalCountEl, total);
        this.animateNumber(this.pendingCountEl, pending);
        this.animateNumber(this.completedCountEl, completed);
        this.animateNumber(this.completionRateEl, `${completionRate}%`);
    }

 
    animateNumber(element, newValue) {
        if (!element) return;
        
        const currentValue = element.textContent;
        if (currentValue === newValue) return;
        
        element.style.transform = 'scale(1.1)';
        element.textContent = newValue;
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }

    updateTaskCount() {
        const filteredTasks = this.getFilteredAndSortedTasks();
        const total = this.tasks.length;
        
        if (this.totalTasksEl) {
            this.totalTasksEl.textContent = filteredTasks.length;
        }
        
        if (this.totalCountEl) {
            this.totalCountEl.textContent = total;
        }
    }

    /**
     * Zeigt Benachrichtigungen an
     */
    showNotification(message, type = 'info') {
        // Entferne bestehende Notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

   
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || icons.info;
    }

    
    getPriorityLabel(priority) {
        const labels = {
            low: 'Niedrig',
            medium: 'Mittel',
            high: 'Hoch'
        };
        return labels[priority] || priority;
    }

    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    
    saveToLocalStorage() {
        try {
            localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
            localStorage.setItem('todoTheme', document.documentElement.dataset.theme);
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
        }
    }

    
    loadFromLocalStorage() {
        try {
            const savedTasks = localStorage.getItem('todoTasks');
            const savedTheme = localStorage.getItem('todoTheme');
            
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
            }
            
            if (savedTheme) {
                document.documentElement.dataset.theme = savedTheme;
                const icon = this.themeToggle.querySelector('i');
                icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        } catch (error) {
            console.error('Fehler beim Laden:', error);
            this.tasks = [];
        }
    }

    
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Aufgaben exportiert!', 'success');
    }

    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    this.tasks = importedTasks;
                    this.updateUI();
                    this.saveToLocalStorage();
                    this.showNotification(`${importedTasks.length} Aufgaben importiert!`, 'success');
                } else {
                    throw new Error('Ungültiges Format');
                }
            } catch (error) {
                this.showNotification('Fehler beim Import: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const app = new TodoApp();
    
    
    window.todoApp = app;
    
   
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            
        });
    }
});


const notificationStyles = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--bg-primary);
    border: 2px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 400px;
}

.notification.show {
    transform: translateX(0);
    opacity: 1;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
}

.notification-success {
    border-color: var(--status-completed);
}

.notification-error {
    border-color: var(--priority-high);
}

.notification-info {
    border-color: var(--status-pending);
}

.notification-warning {
    border-color: var(--priority-medium);
}

.notification-success i {
    color: var(--status-completed);
}

.notification-error i {
    color: var(--priority-high);
}

.notification-info i {
    color: var(--status-pending);
}

.notification-warning i {
    color: var(--priority-medium);
}

@keyframes slideOut {
    to {
        opacity: 0;
        transform: translateX(100%);
    }
}
`;

// Styles zur Seite hinzufügen
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
