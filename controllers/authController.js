const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.execute(query, [username, email, hashedPassword], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ msg: 'Username or email already exists' });
            }
            return res.status(500).json({ msg: 'Database error', error: err });
        }
        res.status(201).json({ msg: 'User registered successfully' });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.execute(query, [email], (err, results) => {
        if (err) return res.status(500).json({ msg: 'Database error', error: err });
        if (results.length === 0) return res.status(400).json({ msg: 'User does not exist' });

        const user = results[0];
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
};

exports.profile = (req, res) => {
    const query = 'SELECT id, username, email FROM users WHERE id = ?';
    db.execute(query, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ msg: 'Database error', error: err });
        if (results.length === 0) return res.status(404).json({ msg: 'User not found' });
        res.json(results[0]);
    });
};
