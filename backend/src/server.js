import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/taskflow',
});

// Database Initialization
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create Categories Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(100) NOT NULL,
        text_color VARCHAR(100) NOT NULL,
        border_color VARCHAR(100) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE
      )
    `);

    // Create Todos Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        due_date VARCHAR(50),
        priority VARCHAR(20) NOT NULL,
        category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
        created_at VARCHAR(100) NOT NULL
      )
    `);

    // Insert Default Categories if not exists
    const { rows } = await client.query('SELECT COUNT(*) FROM categories');
    if (parseInt(rows[0].count) === 0) {
      const defaultCategories = [
        ['work', '업무', 'bg-blue-50 dark:bg-blue-950/30', 'text-blue-600 dark:text-blue-400', 'border-blue-200 dark:border-blue-900/50', true],
        ['personal', '개인', 'bg-emerald-50 dark:bg-emerald-950/30', 'text-emerald-600 dark:text-emerald-400', 'border-emerald-200 dark:border-emerald-900/50', true],
        ['shopping', '쇼핑', 'bg-amber-50 dark:bg-amber-950/30', 'text-amber-600 dark:text-amber-400', 'border-amber-200 dark:border-amber-900/50', true],
        ['health', '건강', 'bg-rose-50 dark:bg-rose-950/30', 'text-rose-600 dark:text-rose-400', 'border-rose-200 dark:border-rose-900/50', true],
        ['other', '기타', 'bg-purple-50 dark:bg-purple-950/30', 'text-purple-600 dark:text-purple-400', 'border-purple-200 dark:border-purple-900/50', true]
      ];

      for (const cat of defaultCategories) {
        await client.query(
          'INSERT INTO categories (id, name, color, text_color, border_color, is_default) VALUES ($1, $2, $3, $4, $5, $6)',
          cat
        );
      }

      // Insert Initial Sample Todos
      const sampleTodos = [
        [
          '1',
          'TaskFlow 할 일 관리 앱 둘러보기 🚀',
          '우선순위 설정, 카테고리 분류, 마감일 지정 등 다양한 기능을 체험해보세요.',
          false,
          new Date().toISOString().split('T')[0],
          'high',
          'work',
          new Date().toISOString()
        ],
        [
          '2',
          '매일 물 2L 마시기 💧',
          '건강을 위해 틈틈이 수분을 섭취합니다.',
          true,
          new Date().toISOString().split('T')[0],
          'low',
          'health',
          new Date().toISOString()
        ]
      ];

      for (const todo of sampleTodos) {
        await client.query(
          'INSERT INTO todos (id, title, description, completed, due_date, priority, category_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          todo
        );
      }
    }

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};

// --- API Endpoints ---

// 1. Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories');
    // Map database fields to frontend camelCase fields
    const formattedCategories = rows.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      textColor: cat.text_color,
      borderColor: cat.border_color,
      isDefault: cat.is_default
    }));
    res.json(formattedCategories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { id, name, color, textColor, borderColor } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories (id, name, color, text_color, border_color, is_default) VALUES ($1, $2, $3, $4, $5, false) RETURNING *',
      [id, name, color, textColor, borderColor]
    );
    const cat = rows[0];
    res.status(201).json({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      textColor: cat.text_color,
      borderColor: cat.border_color,
      isDefault: cat.is_default
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update todos in this category to 'other'
    await client.query('UPDATE todos SET category_id = $1 WHERE category_id = $2', ['other', id]);
    
    // Delete the category
    await client.query('DELETE FROM categories WHERE id = $1 AND is_default = false', [id]);
    
    await client.query('COMMIT');
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error deleting category' });
  } finally {
    client.release();
  }
});

// 2. Todos API
app.get('/api/todos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    const formattedTodos = rows.map(todo => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      dueDate: todo.due_date,
      priority: todo.priority,
      category: todo.category_id,
      createdAt: todo.created_at
    }));
    res.json(formattedTodos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching todos' });
  }
});

app.post('/api/todos', async (req, res) => {
  const { id, title, description, completed, dueDate, priority, category, createdAt } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO todos (id, title, description, completed, due_date, priority, category_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, title, description, completed, dueDate, priority, category, createdAt]
    );
    const todo = rows[0];
    res.status(201).json({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      dueDate: todo.due_date,
      priority: todo.priority,
      category: todo.category_id,
      createdAt: todo.created_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating todo' });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, completed, dueDate, priority, category } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE todos SET title = $1, description = $2, completed = $3, due_date = $4, priority = $5, category_id = $6 WHERE id = $7 RETURNING *',
      [title, description, completed, dueDate, priority, category, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    const todo = rows[0];
    res.json({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      dueDate: todo.due_date,
      priority: todo.priority,
      category: todo.category_id,
      createdAt: todo.created_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating todo' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting todo' });
  }
});

// Reset Data API
app.post('/api/reset', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clear tables
    await client.query('DELETE FROM todos');
    await client.query('DELETE FROM categories');
    
    // Re-insert defaults
    const defaultCategories = [
      ['work', '업무', 'bg-blue-50 dark:bg-blue-950/30', 'text-blue-600 dark:text-blue-400', 'border-blue-200 dark:border-blue-900/50', true],
      ['personal', '개인', 'bg-emerald-50 dark:bg-emerald-950/30', 'text-emerald-600 dark:text-emerald-400', 'border-emerald-200 dark:border-emerald-900/50', true],
      ['shopping', '쇼핑', 'bg-amber-50 dark:bg-amber-950/30', 'text-amber-600 dark:text-amber-400', 'border-amber-200 dark:border-amber-900/50', true],
      ['health', '건강', 'bg-rose-50 dark:bg-rose-950/30', 'text-rose-600 dark:text-rose-400', 'border-rose-200 dark:border-rose-900/50', true],
      ['other', '기타', 'bg-purple-50 dark:bg-purple-950/30', 'text-purple-600 dark:text-purple-400', 'border-purple-200 dark:border-purple-900/50', true]
    ];

    for (const cat of defaultCategories) {
      await client.query(
        'INSERT INTO categories (id, name, color, text_color, border_color, is_default) VALUES ($1, $2, $3, $4, $5, $6)',
        cat
      );
    }

    const sampleTodos = [
      [
        '1',
        'TaskFlow 할 일 관리 앱 둘러보기 🚀',
        '우선순위 설정, 카테고리 분류, 마감일 지정 등 다양한 기능을 체험해보세요.',
        false,
        new Date().toISOString().split('T')[0],
        'high',
        'work',
        new Date().toISOString()
      ],
      [
        '2',
        '매일 물 2L 마시기 💧',
        '건강을 위해 틈틈이 수분을 섭취합니다.',
        true,
        new Date().toISOString().split('T')[0],
        'low',
        'health',
        new Date().toISOString()
      ]
    ];

    for (const todo of sampleTodos) {
      await client.query(
        'INSERT INTO todos (id, title, description, completed, due_date, priority, category_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        todo
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Database reset successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error resetting database' });
  } finally {
    client.release();
  }
});

// Start Server after DB initialization
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await initDb();
  } catch (err) {
    console.error('Failed to initialize database on startup:', err);
  }
});
