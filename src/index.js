const express = require('express');
const app = express();

// Settings
app.set('port', process.env.PORT || 3000);

// Middlewares --> Antes de procesar algo (antes de la ruta)
app.use(express.json());

// Routes
app.use(require('./routes/usuario'));
app.use(require('./routes/afiliado'));

// Starting the server
app.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`);
});