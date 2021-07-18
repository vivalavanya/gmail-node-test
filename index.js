const express = require('express');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const redis = require('redis');
const { promisifyAll } = require('bluebird');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const port = 3000;

const redisClient = redis.createClient({
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
});

var db;

app.use(express.json());
promisifyAll(redis);

MongoClient.connect(
	process.env.MONGO_URL,
	{ useUnifiedTopology: true },
	async (err, client) => {
		if (err) return err;
		db = client.db('gmailtest');

		app.listen(port, () => {
			console.log(`App listening at http://localhost:${port}`);
		});
	}
);

app.get('/api', (req, res) => {
	res.send('Текст описание');
});

app.post('/api/gmail/send', async (req, res) => {
	const oAuth2Client = new google.auth.OAuth2(
		process.env.CLIENT_ID,
		process.env.CLIENT_SECRET,
		process.env.REDIRECT_URI
	);
	oAuth2Client.setCredentials({
		refresh_token: process.env.REFRESH_TOKEN,
	});

	try {
		const access_token = oAuth2Client.getAccessToken();
		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				type: 'OAuth2',
				user: process.env.GMAIL_USER,
				clientId: process.env.CLIENT_ID,
				clientSecret: process.env.CLIENT_SECRET,
				refreshToken: process.env.REFRESH_TOKEN,
				accessToken: access_token,
			},
		});

		const mailOptions = {
			...req.body,
			from: `"Test mail 👻" <${process.env.GMAIL_USER}>`,
		};
		const message = await transporter.sendMail(mailOptions);

		const messageDB = await db
			.collection('emails')
			.insertOne({ messageId: message.messageId });

		const addTask = await redisClient.rpushAsync(
			'task_queue',
			messageDB.ops[0]._id.toString()
		);
		console.log(`Tasks in the queue - ${addTask}`);

		const task = await redisClient.blpopAsync('task_queue', 0);
		HandleTask(task);

		res.send(
			`The message has been successfully sent, the task has been added to the queue for execution. Check your Docker console`
		);
	} catch (error) {
		return error;
	}
});

/// Функция, которая обрабатывает всю работу для этой задачи.
const HandleTask = async function (task) {
	console.log(`Выполняется задача - ${task}`);
	console.log(
		`Remaining tasks in the queue - ${await redisClient.llenAsync(
			'task_queue'
		)}`
	);
};
