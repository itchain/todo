import { useState, useEffect } from 'react'
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
  RotateCcw
} from 'lucide-react'

// Interfaces
interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  color: string; // Tailwind bg color class
  textColor: string; // Tailwind text color class
  borderColor: string; // Tailwind border color class
  isDefault?: boolean;
}

const COLOR_OPTIONS = [
  { name: '블루', color: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-900/50' },
  { name: '그린', color: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-900/50' },
  { name: '옐로우', color: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400', borderColor: 'border-amber-200 dark:border-amber-900/50' },
  { name: '레드', color: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400', borderColor: 'border-rose-200 dark:border-rose-900/50' },
  { name: '퍼플', color: 'bg-purple-50 dark:bg-purple-950/30', textColor: 'text-purple-600 dark:text-purple-400', borderColor: 'border-purple-200 dark:border-purple-900/50' },
  { name: '인디고', color: 'bg-indigo-50 dark:bg-indigo-950/30', textColor: 'text-indigo-600 dark:text-indigo-400', borderColor: 'border-indigo-200 dark:border-indigo-900/50' },
  { name: '핑크', color: 'bg-pink-50 dark:bg-pink-950/30', textColor: 'text-pink-600 dark:text-pink-400', borderColor: 'border-pink-200 dark:border-pink-900/50' },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function App() {
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
          const todosData = await todosRes.json();
          const categoriesData = await categoriesRes.json();
          setTodos(todosData);
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
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo)
      });

      if (res.ok) {
        const savedTodo = await res.json();
        setTodos([savedTodo, ...todos]);
        setNewTitle('');
        setNewDescription('');
        setNewDueDate('');
        setNewPriority('medium');
      } else {
        alert('할 일을 추가하는 데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('서버 통신 오류가 발생했습니다.');
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
        const savedTodo = await res.json();
        setTodos(todos.map(todo => todo.id === id ? savedTodo : todo));
      } else {
        alert('상태를 변경하는 데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('서버 통신 오류가 발생했습니다.');
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
      } else {
        alert('할 일을 삭제하는 데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('서버 통신 오류가 발생했습니다.');
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
        const savedTodo = await res.json();
        setTodos(todos.map(todo => todo.id === editingTodo.id ? savedTodo : todo));
        setEditingTodo(null);
      } else {
        alert('할 일을 수정하는 데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('서버 통신 오류가 발생했습니다.');
    }
  };

  // Add Custom Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    // Check if category already exists
    if (categories.some(c => c.name === newCategoryName.trim())) {
      alert('이미 존재하는 카테고리 이름입니다.');
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
        alert('카테고리를 추가하는 데 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('서버 통신 오류가 발생했습니다.');
    }
  };

  // Delete Custom Category
  const handleDeleteCategory = async (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (categoryToDelete?.isDefault) {
      alert('기본 카테고리는 삭제할 수 없습니다.');
      return;
    }

    if (confirm('이 카테고리를 삭제하시겠습니까? 해당 카테고리의 할 일은 "기타" 카테고리로 변경됩니다.')) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          setCategories(categories.filter(c => c.id !== id));
          // Update local state for todos that were in this category to 'other'
          setTodos(todos.map(todo => 
            todo.category === id ? { ...todo, category: 'other' } : todo
          ));
          if (filterCategory === id) {
            setFilterCategory('all');
          }
        } else {
          alert('카테고리를 삭제하는 데 실패했습니다.');
        }
      } catch (err) {
        console.error(err);
        alert('서버 통신 오류가 발생했습니다.');
      }
    }
  };

  // Reset App Data
  const handleResetData = async () => {
    if (confirm('모든 데이터를 초기화하고 기본 샘플 데이터로 복원하시겠습니까?')) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reset`, {
          method: 'POST'
        });

        if (res.ok) {
          // Re-fetch data
          const [todosRes, categoriesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/todos`),
            fetch(`${API_BASE_URL}/api/categories`)
          ]);

          if (todosRes.ok && categoriesRes.ok) {
            setTodos(await todosRes.json());
            setCategories(await categoriesRes.json());
          }
        } else {
          alert('데이터 초기화에 실패했습니다.');
        }
      } catch (err) {
        console.error(err);
        alert('서버 통신 오류가 발생했습니다.');
      }
    }
  };

  // --- Helper Functions ---
  const getCategoryDetails = (catId: string) => {
    return categories.find(c => c.id === catId) || {
      id: 'other',
      name: '기타',
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
      // Search filter
      const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter
      const matchesStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'active' ? !todo.completed : todo.completed;

      // Priority filter
      const matchesPriority = 
        filterPriority === 'all' ? true : todo.priority === filterPriority;

      // Category filter
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
      // Default: createdAt (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 pb-12">
      
      {/* --- Header --- */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/20 text-white">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent m-0 leading-none">
                TaskFlow
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                스마트한 할 일 관리 파트너
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Reset Button */}
            <button
              onClick={handleResetData}
              title="데이터 초기화"
              className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
              aria-label="다크 모드 토글"
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
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">데이터베이스에서 할 일을 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* --- Dashboard Statistics --- */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              
              {/* Progress Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">전체 완료율</span>
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-extrabold tracking-tight">{completionRate}%</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      ({completedTasks}/{totalTasks} 완료)
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

              {/* Active Tasks Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">진행 중인 할 일</span>
                  <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <ListTodo className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{activeTasks}</span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">개 남음</span>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">차근차근 하나씩 완료해봐요!</p>
                </div>
              </div>

              {/* High Priority Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">중요 할 일</span>
                  <span className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <span className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">{highPriorityRemaining}</span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">개 대기 중</span>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">높은 우선순위의 업무입니다.</p>
                </div>
              </div>

              {/* Overdue Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">기한 초과</span>
                  <span className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <span className={`text-3xl font-extrabold tracking-tight ${overdueTasksCount > 0 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {overdueTasksCount}
                  </span>
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500 ml-1">개 초과</span>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">일정을 다시 확인해보세요.</p>
                </div>
              </div>

            </section>

            {/* --- Main Content Layout --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* --- Left Column: Add Task & Category Management --- */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Add Task Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-bold tracking-tight m-0">새로운 할 일 추가</h2>
                  </div>

                  <form onSubmit={handleAddTodo} className="space-y-4">
                    
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                        할 일 제목 *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="예: 주간 업무 보고서 작성"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                        상세 설명 (선택)
                      </label>
                      <textarea
                        placeholder="상세한 내용을 적어주세요."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                      />
                    </div>

                    {/* Category & Priority Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Category Select */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                          카테고리
                        </label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Priority Select */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                          우선순위
                        </label>
                        <select
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        >
                          <option value="low">낮음 🟢</option>
                          <option value="medium">중간 🟡</option>
                          <option value="high">높음 🔴</option>
                        </select>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                        마감일 (선택)
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

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      할 일 추가하기
                    </button>

                  </form>
                </div>

                {/* Category Management Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-purple-500" />
                      <h2 className="text-lg font-bold tracking-tight m-0">카테고리 관리</h2>
                    </div>
                    <button
                      onClick={() => setShowAddCategory(!showAddCategory)}
                      className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                    >
                      {showAddCategory ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Add Category Form */}
                  {showAddCategory && (
                    <form onSubmit={handleAddCategory} className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">카테고리 이름</label>
                        <input
                          type="text"
                          required
                          placeholder="예: 공부, 가계부"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">색상 선택</label>
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
                        카테고리 생성
                      </button>
                    </form>
                  )}

                  {/* Category List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {categories.map(cat => {
                      return (
                        <div
                          key={cat.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border ${cat.color} ${cat.borderColor} text-xs font-medium`}
                        >
                          <span className={cat.textColor}>{cat.name}</span>
                          {!cat.isDefault && (
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 transition-colors"
                              title="삭제"
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

              {/* --- Right Column: Task List, Search & Filters --- */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Search, Filter & Sort Controls */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-4">
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="할 일 제목 또는 상세 설명 검색..."
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

                  {/* Filters Header Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      필터 및 정렬
                    </div>
                    
                    {/* Sort By Dropdown */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">정렬 기준:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'createdAt')}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="dueDate">마감일 순</option>
                        <option value="priority">우선순위 순</option>
                        <option value="createdAt">생성일 순</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    
                    {/* Status Filter */}
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">진행 상태</span>
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
                            {status === 'all' ? '전체' : status === 'active' ? '진행중' : '완료'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority Filter */}
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">우선순위</span>
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
                            {prio === 'all' ? '전체' : prio === 'high' ? '높음' : prio === 'medium' ? '중간' : '낮음'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">카테고리</span>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-semibold"
                      >
                        <option value="all">전체 카테고리</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                </div>

                {/* --- Task List --- */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      할 일 목록 ({filteredTodos.length}개)
                    </span>
                  </div>

                  {filteredTodos.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-12 text-center shadow-sm">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-600">
                        <ListTodo className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">할 일이 없습니다</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                        {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                          ? '설정한 필터에 부합하는 할 일이 없습니다. 필터를 변경해보세요!'
                          : '새로운 할 일을 추가하고 일정을 관리해보세요.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTodos.map(todo => {
                        const cat = getCategoryDetails(todo.category);
                        const overdue = isOverdue(todo.dueDate, todo.completed);
                        
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
                              
                              {/* Checkbox */}
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

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  {/* Category Badge */}
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cat.color} ${cat.borderColor} ${cat.textColor}`}>
                                    {cat.name}
                                  </span>

                                  {/* Priority Badge */}
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    todo.priority === 'high' 
                                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' 
                                      : todo.priority === 'medium'
                                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700'
                                  }`}>
                                    {todo.priority === 'high' ? '높음' : todo.priority === 'medium' ? '중간' : '낮음'}
                                  </span>

                                  {/* Due Date Badge */}
                                  {todo.dueDate && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      overdue 
                                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 animate-pulse' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                    }`}>
                                      <Calendar className="w-3 h-3" />
                                      {todo.dueDate} {overdue && '기한 초과!'}
                                    </span>
                                  )}
                                </div>

                                {/* Title */}
                                <h3 className={`text-sm sm:text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1 break-words ${
                                  todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                                }`}>
                                  {todo.title}
                                </h3>

                                {/* Description */}
                                {todo.description && (
                                  <p className={`text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-words ${
                                    todo.completed ? 'line-through text-slate-400/80 dark:text-slate-500/80' : ''
                                  }`}>
                                    {todo.description}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                                {/* Edit Button */}
                                <button
                                  onClick={() => setEditingTodo(todo)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="수정"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteTodo(todo.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="삭제"
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

      {/* --- Edit Todo Modal --- */}
      {editingTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl overflow-hidden animate-scale-up">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
              <h3 className="text-base font-bold tracking-tight">할 일 수정</h3>
              <button
                onClick={() => setEditingTodo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTodo} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  할 일 제목 *
                </label>
                <input
                  type="text"
                  required
                  value={editingTodo.title}
                  onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  상세 설명
                </label>
                <textarea
                  value={editingTodo.description || ''}
                  onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value || undefined })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              {/* Category & Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category Select */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    카테고리
                  </label>
                  <select
                    value={editingTodo.category}
                    onChange={(e) => setEditingTodo({ ...editingTodo, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Select */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    우선순위
                  </label>
                  <select
                    value={editingTodo.priority}
                    onChange={(e) => setEditingTodo({ ...editingTodo, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  >
                    <option value="low">낮음 🟢</option>
                    <option value="medium">중간 🟡</option>
                    <option value="high">높음 🔴</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  마감일
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  저장하기
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}

export default App
