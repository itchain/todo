import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Plus,
  Search,
  Calendar,
  Tag,
  AlertCircle,
  Sun,
  Moon,
  TrendingUp,
  FolderPlus,
  SlidersHorizontal,
  Clock,
  CheckSquare,
  ListTodo,
  X,
  Sparkles,
  RotateCcw,
  Languages
} from 'lucide-react'

// Interfaces
interface SubTask {
  id: string;
  todoId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
  subTasks: SubTask[];
}

type TodoResponse = Omit<Todo, 'subTasks'> & { subTasks?: SubTask[] };

interface Category {
  id: string;
  name: string;
  color: string; // Tailwind bg color class
  textColor: string; // Tailwind text color class
  borderColor: string; // Tailwind border color class
  isDefault?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function App() {
  const { t, i18n } = useTranslation();

  const normalizeTodo = (todo: TodoResponse): Todo => ({
    ...todo,
    subTasks: todo.subTasks ?? []
  });

  const COLOR_OPTIONS = [
    { name: t('color_blue'), color: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-900/50' },
    { name: t('color_green'), color: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-900/50' },
    { name: t('color_yellow'), color: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400', borderColor: 'border-amber-200 dark:border-amber-900/50' },
    { name: t('color_red'), color: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400', borderColor: 'border-rose-200 dark:border-rose-900/50' },
    { name: t('color_purple'), color: 'bg-purple-50 dark:bg-purple-950/30', textColor: 'text-purple-600 dark:text-purple-400', borderColor: 'border-purple-200 dark:border-purple-900/50' },
    { name: t('color_indigo'), color: 'bg-indigo-50 dark:bg-indigo-950/30', textColor: 'text-indigo-600 dark:text-indigo-400', borderColor: 'border-indigo-200 dark:border-indigo-900/50' },
    { name: t('color_pink'), color: 'bg-pink-50 dark:bg-pink-950/30', textColor: 'text-pink-600 dark:text-pink-400', borderColor: 'border-pink-200 dark:border-pink-900/50' },
  ];

  // --- States ---
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('taskflow_dark_mode');
    if (saved) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('work');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newSubTaskTitles, setNewSubTaskTitles] = useState<Record<string, string>>({});

  // Category Form States
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');

  // Edit Modal State
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [todosRes, categoriesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/todos`),
          fetch(`${API_BASE_URL}/api/categories`)
        ]);

        if (todosRes.ok && categoriesRes.ok) {
          const todosData: TodoResponse[] = await todosRes.json();
          const categoriesData = await categoriesRes.json();
          setTodos(todosData.map(normalizeTodo));
          setCategories(categoriesData);
        } else {
          console.error('Failed to fetch initial data');
        }
      } catch (err) {
        console.error('Network error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply Dark Mode Class
  useEffect(() => {
    localStorage.setItem('taskflow_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- Handlers ---
  // Add Todo
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      completed: false,
      dueDate: newDueDate || undefined,
      priority: newPriority,
      category: newCategory,
      createdAt: new Date().toISOString(),
      subTasks: []
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo)
      });

      if (res.ok) {
        const savedTodo: TodoResponse = await res.json();
        setTodos([normalizeTodo(savedTodo), ...todos]);
        setNewTitle('');
        setNewDescription('');
        setNewDueDate('');
        setNewPriority('medium');
      } else {
        alert(t('add_todo_failed_alert'));
      }
    } catch (err) {
      console.error(err);
      alert(t('server_error_alert'));
    }
  };

  // Toggle Todo Completion
  const handleToggleTodo = async (id: string) => {
    const todoToToggle = todos.find(t => t.id === id);
    if (!todoToToggle) return;

    const updatedTodo = { ...todoToToggle, completed: !todoToToggle.completed };

    try {
      const res = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTodo)
      });

      if (res.ok) {
        const savedTodo: TodoResponse = await res.json();
        setTodos(todos.map(todo => todo.id === id ? normalizeTodo(savedTodo) : todo));
      } else {
        alert(t('toggle_todo_failed_alert'));
      }
    } catch (err) {
      console.error(err);
      alert(t('server_error_alert'));
    }
  };

  // Delete Todo
  const handleDeleteTodo = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setTodos(todos.filter(todo => todo.id !== id));
        setNewSubTaskTitles(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      } else {
        alert(t('delete_todo_failed_alert'));
      }
    } catch (err) {
      console.error(err);
      alert(t('server_error_alert'));
    }
  };

  // Update Todo (from edit modal)
  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editingTodo.title.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/todos/${editingTodo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTodo)
      });

      if (res.ok) {
        const savedTodo: TodoResponse = await res.json();
        setTodos(todos.map(todo => todo.id === editingTodo.id ? normalizeTodo(savedTodo) : todo));
        setEditingTodo(null);
      } else {
        alert(t('update_todo_failed_alert'));
      }
    } catch (err) {
      console.error(err);
      alert(t('server_error_alert'));
    }
  };

  // Add Sub Task
  const handleAddSubTask = async (todoId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = (newSubTaskTitles[todoId] || '').trim();
    if (!title) return;

    const newSubTask = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/todos/${todoId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubTask)
      });

      if (res.ok) {
        const savedSubTask: SubTask = await res.json();
        setTodos(prevTodos => prevTodos.map(todo =>
          todo.id === todoId
            ? { ...todo, subTasks: [...todo.subTasks, savedSubTask] }
            : todo
        ));
        setNewSubTaskTitles(prev => ({ ...prev, [todoId]: '' }));
      } else {
        alert(t('add_subtask_failed_alert'));
      }
    } catch (err) {
      console.error(err);
      alert(t('server_error_alert'));
    }
  };

  // Toggle Sub Task Completion
  const handleToggleSubTask = async (todoId: string, subTaskId: string) => {
    const targetTodo = todos.find(todo => todo.id === todoId);
    const targetSubTask = targetTodo?.subTasks.find(subTask => subTask.id === subTaskId);
    if (!targetSubTask) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/todos/${todoId}/subtasks/${subTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !targetSubTask.completed })
      });

      if (res.ok) {
        const savedSubTask: SubTask = await res.json();
        setTodos(prevTodos => prevTodos.map(todo =>
          todo.id === todoId
            ? {
                ...todo,
                subTasks: todo.subTasks.map(subTask =>
                  subTask.id === subTaskId ? savedSubTask : subTask
                )
              }
            : todo
        ));
      } else {
        alert(t('toggle_subtask_failed_alert'));
      }
    } catch (err) {
      console.error(err);
      alert(t('server_error_alert'));
    }
  };

  // Delete Sub Task
  const handleDeleteSubTask = async (todoId: string, subTaskId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/todos/${todoId}/subtasks/${subTaskId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setTodos(prevTodos => prevTodos.map(todo =>
          todo.id === todoId
            ? { ...todo, subTasks: todo.subTasks.filter(subTask => subTask.id !== subTaskId) }
            : todo
        ));
      } else {
        alert(t('delete_subtask_failed_alert'));
      }
    } catch (err) {
      console.error(err);
      alert(t('server_error_alert'));
    }
  };

  // Add Custom Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    if (categories.some(c => c.name === newCategoryName.trim())) {
      alert(t('category_exists_alert'));
      return;
    }

    const colorScheme = COLOR_OPTIONS[selectedColorIdx];
    const newCat: Category = {
      id: crypto.randomUUID(),
      name: newCategoryName.trim(),
      color: colorScheme.color,
      textColor: colorScheme.textColor,
      borderColor: colorScheme.borderColor
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });

      if (res.ok) {
        const savedCat = await res.json();
        setCategories([...categories, savedCat]);
        setNewCategoryName('');
        setShowAddCategory(false);
      } else {
        alert(t('add_category_failed_alert'));
      }
    } catch (err) {
      console.error(err);
      alert(t('server_error_alert'));
    }
  };

  // Delete Custom Category
  const handleDeleteCategory = async (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (categoryToDelete?.isDefault) {
      alert(t('default_category_delete_alert'));
      return;
    }

    if (confirm(t('delete_category_confirm'))) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          setCategories(categories.filter(c => c.id !== id));
          setTodos(todos.map(todo => 
            todo.category === id ? { ...todo, category: 'other' } : todo
          ));
          if (filterCategory === id) {
            setFilterCategory('all');
          }
        } else {
          alert(t('delete_category_failed_alert'));
        }
      } catch (err) {
        console.error(err);
        alert(t('server_error_alert'));
      }
    }
  };

  // Reset App Data
  const handleResetData = async () => {
    if (confirm(t('reset_data_confirm'))) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reset`, {
          method: 'POST'
        });

        if (res.ok) {
          const [todosRes, categoriesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/todos`),
            fetch(`${API_BASE_URL}/api/categories`)
          ]);

          if (todosRes.ok && categoriesRes.ok) {
            const todosData: TodoResponse[] = await todosRes.json();
            setTodos(todosData.map(normalizeTodo));
            setCategories(await categoriesRes.json());
            setNewSubTaskTitles({});
          }
        } else {
          alert(t('reset_data_failed_alert'));
        }
      } catch (err) {
        console.error(err);
        alert(t('server_error_alert'));
      }
    }
  };

  // --- Helper Functions ---
  const getCategoryDetails = (catId: string) => {
    const found = categories.find(c => c.id === catId);
    if (found) {
      // For default categories, translate the name
      if (found.isDefault) {
        const key = `category_${found.id}`;
        // @ts-ignore
        const translatedName = t(key, found.name);
        return { ...found, name: translatedName };
      }
      return found;
    }
    return {
      id: 'other',
      name: t('category_other'),
      color: 'bg-purple-50 dark:bg-purple-950/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-900/50'
    };
  };

  const isOverdue = (dueDate?: string, completed?: boolean) => {
    if (!dueDate || completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // --- Statistics Calculations ---
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const highPriorityRemaining = todos.filter(t => !t.completed && t.priority === 'high').length;
  const overdueTasksCount = todos.filter(t => isOverdue(t.dueDate, t.completed)).length;

  // --- Filtering & Sorting Logic ---
  const filteredTodos = todos
    .filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'active' ? !todo.completed : todo.completed;

      const matchesPriority = 
        filterPriority === 'all' ? true : todo.priority === filterPriority;

      const matchesCategory = 
        filterCategory === 'all' ? true : todo.category === filterCategory;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 pb-12">
      
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/20 text-white">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent m-0 leading-none">
                {t('title')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              title={t('reset_data')}
              className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ko' : 'en')}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              aria-label="Change Language"
            >
              <Languages className="w-5 h-5" />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              aria-label={t('toggle_dark_mode')}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('loading_tasks')}</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('dashboard_completion_rate')}</span>
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-extrabold tracking-tight">{completionRate}%</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {t('dashboard_completed_ratio', { completed: completedTasks, total: totalTasks })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('dashboard_active_tasks')}</span>
                  <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <ListTodo className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{activeTasks}</span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">{t('dashboard_tasks_left')}</span>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{t('dashboard_active_tasks_subtitle')}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('dashboard_high_priority')}</span>
                  <span className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <span className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">{highPriorityRemaining}</span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">{t('dashboard_high_priority_waiting')}</span>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{t('dashboard_high_priority_subtitle')}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('dashboard_overdue')}</span>
                  <span className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <span className={`text-3xl font-extrabold tracking-tight ${overdueTasksCount > 0 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {overdueTasksCount}
                  </span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">{t('dashboard_overdue_count')}</span>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{t('dashboard_overdue_subtitle')}</p>
                </div>
              </div>

            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-4 space-y-6">
                
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-bold tracking-tight m-0">{t('add_new_todo')}</h2>
                  </div>

                  <form onSubmit={handleAddTodo} className="space-y-4">
                    
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                        {t('form_title_label')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t('form_title_placeholder')}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                        {t('form_description_label')}
                      </label>
                      <textarea
                        placeholder={t('form_description_placeholder')}
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                          {t('form_category_label')}
                        </label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{getCategoryDetails(cat.id).name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                          {t('form_priority_label')}
                        </label>
                        <select
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        >
                          <option value="low">{t('priority_low')}</option>
                          <option value="medium">{t('priority_medium')}</option>
                          <option value="high">{t('priority_high')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                        {t('form_due_date_label')}
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                          className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      {t('add_todo_button')}
                    </button>

                  </form>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-purple-500" />
                      <h2 className="text-lg font-bold tracking-tight m-0">{t('category_management')}</h2>
                    </div>
                    <button
                      onClick={() => setShowAddCategory(!showAddCategory)}
                      className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                    >
                      {showAddCategory ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
                    </button>
                  </div>

                  {showAddCategory && (
                    <form onSubmit={handleAddCategory} className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">{t('add_category_form_name_label')}</label>
                        <input
                          type="text"
                          required
                          placeholder={t('add_category_form_name_placeholder')}
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('add_category_form_color_label')}</label>
                        <div className="flex flex-wrap gap-1.5">
                          {COLOR_OPTIONS.map((opt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedColorIdx(idx)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${opt.color} ${
                                selectedColorIdx === idx ? 'border-indigo-600 scale-110' : 'border-transparent'
                              }`}
                              title={opt.name}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors"
                      >
                        {t('create_category_button')}
                      </button>
                    </form>
                  )}

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {categories.map(cat => {
                      const categoryDetails = getCategoryDetails(cat.id);
                      return (
                        <div
                          key={cat.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border ${categoryDetails.color} ${categoryDetails.borderColor} text-xs font-medium`}
                        >
                          <span className={categoryDetails.textColor}>{categoryDetails.name}</span>
                          {!cat.isDefault && (
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 transition-colors"
                              title={t('delete_button_title')}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-4">
                  
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('form_title_placeholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    />
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      {t('filters_and_sorting')}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">{t('sort_by_label')}</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'createdAt')}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="dueDate">{t('sort_by_due_date')}</option>
                        <option value="priority">{t('sort_by_priority')}</option>
                        <option value="createdAt">{t('sort_by_created_at')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">{t('filter_status_label')}</span>
                      <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        {(['all', 'active', 'completed'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              filterStatus === status
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            {t(`filter_status_${status}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">{t('filter_priority_label')}</span>
                      <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        {(['all', 'high', 'medium', 'low'] as const).map((prio) => (
                          <button
                            key={prio}
                            onClick={() => setFilterPriority(prio)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              filterPriority === prio
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            {t(`filter_priority_${prio}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">{t('filter_category_label')}</span>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-semibold"
                      >
                        <option value="all">{t('filter_category_all')}</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{getCategoryDetails(cat.id).name}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('todo_list_count', { count: filteredTodos.length })}
                    </span>
                  </div>

                  {filteredTodos.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-12 text-center shadow-sm">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                        <ListTodo className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">{t('no_todos_title')}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                        {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                          ? t('no_todos_filtered_subtitle')
                          : t('no_todos_subtitle')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTodos.map(todo => {
                        const cat = getCategoryDetails(todo.category);
                        const overdue = isOverdue(todo.dueDate, todo.completed);
                        const completedSubTasksCount = todo.subTasks.filter(subTask => subTask.completed).length;
                        
                        return (
                          <div
                            key={todo.id}
                            className={`group bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md ${
                              todo.completed 
                                ? 'border-slate-100 dark:border-slate-800/40 opacity-60' 
                                : overdue 
                                  ? 'border-rose-200 dark:border-rose-950/50 hover:border-rose-300' 
                                  : 'border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-900/50'
                            }`}
                          >
                            <div className="p-4 sm:p-5 flex items-start gap-4">
                              
                              <button
                                onClick={() => handleToggleTodo(todo.id)}
                                className="mt-0.5 text-slate-300 hover:text-indigo-500 dark:text-slate-700 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                              >
                                {todo.completed ? (
                                  <CheckCircle2 className="w-5.5 h-5.5 text-indigo-500 dark:text-indigo-400 fill-indigo-50/50 dark:fill-indigo-950/20" />
                                ) : (
                                  <Circle className="w-5.5 h-5.5" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cat.color} ${cat.borderColor} ${cat.textColor}`}>
                                    {cat.name}
                                  </span>

                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    todo.priority === 'high' 
                                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' 
                                      : todo.priority === 'medium'
                                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700'
                                  }`}>
                                    {t(`priority_${todo.priority}`)}
                                  </span>

                                  {todo.dueDate && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      overdue 
                                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 animate-pulse' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                    }`}>
                                      <Calendar className="w-3 h-3" />
                                      {todo.dueDate} {overdue && t('due_date_overdue')}
                                    </span>
                                  )}
                                </div>

                                <h3 className={`text-sm sm:text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1 break-words ${
                                  todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                                }`}>
                                  {todo.title}
                                </h3>

                                {todo.description && (
                                  <p className={`text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-words ${
                                    todo.completed ? 'line-through text-slate-400/80 dark:text-slate-500/80' : ''
                                  }`}>
                                    {todo.description}
                                  </p>
                                )}

                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                      {t('subtasks_title')}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                      {t('subtasks_progress', { completed: completedSubTasksCount, total: todo.subTasks.length })}
                                    </span>
                                  </div>

                                  {todo.subTasks.length === 0 ? (
                                    <p className="text-xs text-slate-400 dark:text-slate-500">{t('no_subtasks')}</p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {todo.subTasks.map(subTask => (
                                        <div key={subTask.id} className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleToggleSubTask(todo.id, subTask.id)}
                                            className="text-slate-300 hover:text-indigo-500 dark:text-slate-700 dark:hover:text-indigo-400 transition-colors"
                                            title={t('toggle_subtask_button_title')}
                                          >
                                            {subTask.completed ? (
                                              <CheckCircle2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                            ) : (
                                              <Circle className="w-4 h-4" />
                                            )}
                                          </button>

                                          <span className={`flex-1 text-xs break-words ${
                                            subTask.completed
                                              ? 'line-through text-slate-400 dark:text-slate-500'
                                              : 'text-slate-600 dark:text-slate-300'
                                          }`}>
                                            {subTask.title}
                                          </span>

                                          <button
                                            onClick={() => handleDeleteSubTask(todo.id, subTask.id)}
                                            className="p-1 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded-md transition-colors"
                                            title={t('delete_subtask_button_title')}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {!todo.completed && (
                                    <form onSubmit={(e) => handleAddSubTask(todo.id, e)} className="mt-2 flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={newSubTaskTitles[todo.id] || ''}
                                        onChange={(e) => setNewSubTaskTitles(prev => ({ ...prev, [todo.id]: e.target.value }))}
                                        placeholder={t('subtask_input_placeholder')}
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                      />
                                      <button
                                        type="submit"
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                      >
                                        {t('add_subtask_button')}
                                      </button>
                                    </form>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => setEditingTodo(todo)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title={t('edit_button_title')}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDeleteTodo(todo.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title={t('delete_button_title')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </>
        )}

      </main>

      {editingTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden animate-scale-up">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
              <h3 className="text-base font-bold tracking-tight">{t('edit_todo_modal_title')}</h3>
              <button
                onClick={() => setEditingTodo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTodo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  {t('form_title_label')}
                </label>
                <input
                  type="text"
                  required
                  value={editingTodo.title}
                  onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  {t('form_description_label')}
                </label>
                <textarea
                  value={editingTodo.description || ''}
                  onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value || undefined })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    {t('form_category_label')}
                  </label>
                  <select
                    value={editingTodo.category}
                    onChange={(e) => setEditingTodo({ ...editingTodo, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{getCategoryDetails(cat.id).name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    {t('form_priority_label')}
                  </label>
                  <select
                    value={editingTodo.priority}
                    onChange={(e) => setEditingTodo({ ...editingTodo, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  >
                    <option value="low">{t('priority_low')}</option>
                    <option value="medium">{t('priority_medium')}</option>
                    <option value="high">{t('priority_high')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  {t('form_due_date_label')}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={editingTodo.dueDate || ''}
                    onChange={(e) => setEditingTodo({ ...editingTodo, dueDate: e.target.value || undefined })}
                    className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 text-sm"
                >
                  {t('update_todo_button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
