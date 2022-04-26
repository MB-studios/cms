const express = require('express');

const connectDB = require('./config/db');

const app = express();

let authenticator = require('./middleware/auth');

connectDB();

app.use(express.json({ extended: false }));

app.use('/api/users', require('./routes/api/users'));

app.use('/api/auth', require('./routes/api/auth'));

/*
app
	.route('/api/auth')
	.get(
		authenticator({ type: 'USERS', read: false, write: false }),
		auth.getUser
	)
	.post(auth.authenticateUser);
*/

app.use('/api/groups', require('./routes/api/groups'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app;
