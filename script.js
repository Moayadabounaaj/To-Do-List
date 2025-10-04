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
        this.taskInput.placeholder = 'Neue Aufgabe hinzufügen...';
        this.prioritySelect.selectedIndex = 1; // Medium priority
    }