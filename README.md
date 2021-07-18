# Отпрвка сообщений gmail api

- В рамках задачи создан микросервис на node.js.
- База данных проекта MongoDB
- База данных для очереди Redis
- Для транспортировки используется библиотека nodemailer
- Перед началом работы переименнуюйте файл docker-compose.example.env в docker-compose.env и установите свои переменные

### Подготовка google api

- Перед началом работы также требуется создать CLIENT_ID и CLIENT_SECRET для авторизации в gmail
- Для этого перейдите на сайт https://console.cloud.google.com/ и создайте новый проект;
- После создания нового проекта, выберите его в верхнем тулбаре, далее перейдите в раздел APIs and Services > dashboard в левом меню
- Перейдите во вкладку OAuth consent screen для настроек OAuth
- Далее перейдите во вкладку Credentials и нажмите Create Credentials в верхней части экрана
- Далее выберите OAuth Client Id
- Установите Application type - Web Application
- Установите свое название и укажите Authorized redirect URIs в качестве - https://developers.google.com/oauthplayground
- Остальные настройки оставьте по умолчанию
- Перейдите в на страницу https://developers.google.com/oauthplayground
- В верхнем правом углу выберите шестиренку и поставите галочку около Use your own OAuth credentials, укажите данные из ранее созданных доступов
- Далее в строке input your own scope укажите mail.google.com и нажмите кнопку Authorize APIs
- Далее нажмите на Step 2, после чего нажмите - Exchange authorization code for tokens
- Скопируйте refresh токен в docker-compose.env, также добавьте туда данные из ранее созданного приложения https://console.cloud.google.com/

### Проверка результа

После запуска проекта в Docker вам будет доступно API проекта
`POST http://localhost:3000/api/gmail/send` - Отправит сообщение на указанную почту

###### Тело запроса (RAW)

```
{
    "to": "your@email.com",
    "subject": "Hello gmail",
    "text": "Some text"
}
```

MessageId сообщения будет сохранен в базу данных mongo в коллекцию emails, далее id записи будет передан в очередь Redis
Для просмотра последовательности событий посмотрите в консоль Docker контейнера "app"
