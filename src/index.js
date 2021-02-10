const express = require('express');
const app = express();
const conn  = require('./database');

// Settings
app.set('port', process.env.PORT || 3000);

// Middlewares --> Antes de procesar algo (antes de la ruta)
app.use(express.json());

// Routes
app.use(require('./routes/usuario')); 

// Starting the server
app.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`);
});


/*
  RUTAS
*/

// GET persona - afiliadoflia - usuarioactivo
app.get('/personaAfiliadoUsuario/:dni',(req, res) => {
  
  let sql = "SELECT idPersona FROM persona WHERE documentoPersona="+req.params.dni;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    rowArray = JSON.stringify(results); 
    objPersona = JSON.parse(rowArray); 
    if (objPersona[0]) {
      
      // Start afiliadoflia
      let sql2 = `SELECT idPersonaA 
        FROM afiliadoflia
        WHERE idPersona = ${objPersona[0].idPersona}
      ` 
      let query2 = conn.query(sql2, (err2, results2) => {
        if(err2) throw err2;
        rowArray2 = JSON.stringify(results2); 
        objAfiliadoflia = JSON.parse(rowArray2);
        if (objAfiliadoflia[0]) {
          
          // Start usuarioactivo
          let sql3 = `SELECT id_usu
            FROM usuarioactivo 
            WHERE idPersona = ${objAfiliadoflia[0].idPersonaA}
          ` 
          let query3 = conn.query(sql3, (err3, results3) => {
            if(err3) throw err3;
            rowArray3 = JSON.stringify(results3); 
            objAfiliadoflia = JSON.parse(rowArray3);
            if (objAfiliadoflia[0]) {
              // respuesta final     
              return res.send(JSON.stringify({"status": 200, "error": null, "response": results}));

            }else{
              return res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
            }
          });
          // End usuarioactivo


        }else{
          return res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
        }
      });
      // End afiliadoflia


    }else{
      res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
    }
  });
});

 




// Registrarse 
app.post('/registrar',(req, res) => {
  
  // Post usuario
  let data = {nom_usu: req.body.nom_usu, con_usu: req.body.con_usu, id_tusu: req.body.id_tusu};
  let sql = "INSERT INTO usuario SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    //res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
    // Obtener id del usuario creado recien
    rowArray3 = JSON.stringify(results); 
    obj = JSON.parse(rowArray3);
    //console.log('new id: ',obj.insertId)
 
 //   if (obj.insertId) {     
      // Put persona  
      let sqlPersona = ` UPDATE persona
      SET persona.nombrePersona = '${req.body.nombre} ${req.body.apellido}',
      persona.cuilPersona = '${req.body.cuil}',
      persona.celPersona = '${req.body.celular}',
      persona.mailPersona = '${req.body.mail}',
      persona.idUsuario = '${obj.insertId}'
      WHERE persona.idPersona = '${req.body.idPersona}'       
      `; 
      let query2 = conn.query(sqlPersona, (err2, results2) => {
        if(err2) throw err2;
        res.send(JSON.stringify({"status": 200, "error": null, "response": results}));

        //res.send(JSON.stringify({"status": 200, "error": null, "response": results2}));
      });
 //   }
 
  

  });
});


