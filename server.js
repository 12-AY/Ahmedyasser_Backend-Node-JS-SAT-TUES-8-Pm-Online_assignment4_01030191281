const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'users.json');


function readUsers() {

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
  }

  const data = fs.readFileSync(DATA_FILE, 'utf-8');

  try {
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('users.json was invalid JSON, resetting it to []:', err.message);
    fs.writeFileSync(DATA_FILE, '[]');
    return [];
  }
}


function writeUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

function getNextId(users) {
  if (users.length === 0) return 1;
  return Math.max(...users.map(u => u.id)) + 1;
}


app.post('/user', (req, res) => {
  try {
    const { name, age, email } = req.body || {};

    // basic validation
    if (!name || age === undefined || !email) {
      return res.status(400).json({ message: 'name, age, and email are required.' });
    }

    const users = readUsers();

    const emailExists = users.some(u => u.email === email);
    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const newUser = { id: getNextId(users), name, age, email };
    users.push(newUser);
    writeUsers(users);

    res.status(201).json({ message: 'User added successfully.' });
  } catch (err) {
    console.error('Error in POST /user:', err);
    res.status(500).json({ message: 'Something went wrong.', error: err.message });
  }
});

app.get('/user/getByName', (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: 'name query parameter is required.' });
    }

    const users = readUsers();
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());

    if (!user) {
      return res.status(404).json({ message: 'User name not found.' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error in GET /user/getByName:', err);
    res.status(500).json({ message: 'Something went wrong.', error: err.message });
  }
});

app.get('/user/filter', (req, res) => {
  try {
    const minAge = parseInt(req.query.minAge);

    if (isNaN(minAge)) {
      return res.status(400).json({ message: 'minAge query parameter must be a number.' });
    }

    const users = readUsers();
    const filtered = users.filter(u => u.age >= minAge);

    if (filtered.length === 0) {
      return res.json({ message: 'no user found' });
    }

    res.json(filtered);
  } catch (err) {
    console.error('Error in GET /user/filter:', err);
    res.status(500).json({ message: 'Something went wrong.', error: err.message });
  }
});

app.get('/user', (req, res) => {
  try {
    const users = readUsers();
    res.json(users);
  } catch (err) {
    console.error('Error in GET /user:', err);
    res.status(500).json({ message: 'Something went wrong.', error: err.message });
  }
});

app.get('/user/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error in GET /user/:id:', err);
    res.status(500).json({ message: 'Something went wrong.', error: err.message });
  }
});



app.patch('/user/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = readUsers();

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User ID not found.' });
    }

    const { name, age, email } = req.body || {};

    let updatedField = null;
    if (name !== undefined) { user.name = name; updatedField = 'name'; }
    if (age !== undefined) { user.age = age; updatedField = 'age'; }
    if (email !== undefined) { user.email = email; updatedField = 'email'; }

    writeUsers(users);

    res.json({ message: `User ${updatedField || ''} updated successfully.`.replace('  ', ' ') });
  } catch (err) {
    console.error('Error in PATCH /user/:id:', err);
    res.status(500).json({ message: 'Something went wrong.', error: err.message });
  }
});



app.delete('/user{/:id}', (req, res) => {
  try {
    const userId = parseInt(req.params.id || (req.body && req.body.id));

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'User id is required (in params or body).' });
    }

    const users = readUsers();
    const index = users.findIndex(u => u.id === userId);

    if (index === -1) {
      return res.status(404).json({ message: 'User ID not found.' });
    }

    users.splice(index, 1);
    writeUsers(users);

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Error in DELETE /user:', err);
    res.status(500).json({ message: 'Something went wrong.', error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));