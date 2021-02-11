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
      res.send(JSON.stringify({"status": 200, "error": null, "response": 'results'}));
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


// Login
app.get('/login/:username/:password',(req, res) => {
  let sql = `SELECT * FROM usuario WHERE nom_usu = '${req.params.username}'`;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    rowArray = JSON.stringify(results); 
    objUsuario = JSON.parse(rowArray);    
    
    
    if(objUsuario[0]){

        // VALIDAR INGRESO - PASSWORD
        // Encriptar
        if (req.params.password !== objUsuario[0].con_usu) { 
          res.send(JSON.stringify({"status": 200, "error": null, "response": ['Contrasena incorrecta.']}));
          return;
        }

        // Start persona      
        let sql2 = `SELECT idPersona FROM persona WHERE idUsuario = ${objUsuario[0].id_usu}`;
        let query2 = conn.query(sql2, (err2, results2) => {
          if(err2) throw err2;
          rowArray2 = JSON.stringify(results2); 
          objPersona = JSON.parse(rowArray2); 

          if(objPersona[0]){
            // Start afiliado
            let sql3 = `SELECT idPersona FROM usuarioactivo WHERE idPersona = '${objPersona[0].idPersona}'`;
            let query3 = conn.query(sql3, (err3, results3) => {
              if(err3) throw err3; 
              rowArray3 = JSON.stringify(results3); 
              objUsuarioactivo = JSON.parse(rowArray3);


              if (objUsuarioactivo[0]) {
                // Afiliado titular
                let sql32 = `
                  SELECT afiliado.numAfiliado, persona.nombrePersona, afiliado.fingresoAfiliado, persona.documentoPersona, emp.rs_emp
                  FROM afiliado 
                  INNER JOIN emp ON emp.id_emp = afiliado.id_emp
                  INNER JOIN persona ON persona.idPersona = afiliado.idPersona
                  WHERE persona.idPersona = '${objPersona[0].idPersona}'
                `;
                let query = conn.query(sql32, (err32, results32) => {
                  if(err32) throw err32; 
                  res.send(JSON.stringify({"status": 200, "error": null, "response": [{afiliadoTitular:true},results32]}));
                });
              } else {
                // Start afiliadoflia 
                // Familiar del afiliado (HACER QUERY CON LOS DATOS DE LA CREDENCIAL)
                let sql4 = `SELECT afiliado.numAfiliado, persona.nombrePersona, afiliado.fingresoAfiliado, persona.documentoPersona, emp.rs_emp, afiliadoflia.parentescoAfiliadoflia, personaTitular.nombrePersona AS nombrePersonaTitular
                  FROM afiliadoflia
                  INNER JOIN persona ON persona.idPersona = afiliadoflia.idPersona
                  INNER JOIN afiliado ON afiliado.idPersona = afiliadoflia.idPersonaA
                  INNER JOIN emp ON emp.id_emp = afiliado.id_emp
                  INNER JOIN persona AS personaTitular ON personaTitular.idPersona = afiliadoflia.idPersonaA 
                  WHERE persona.idPersona = ${objPersona[0].idPersona}`;
                let query4 = conn.query(sql4, (err4, results4) => {
                  if(err4) throw err4; 
                  rowArray4 = JSON.stringify(results4); 
                  objAfiliadoflia = JSON.parse(rowArray4);
    
                  if (objAfiliadoflia[0]) {
                    res.send(JSON.stringify({"status": 200, "error": null, "response": [{afiliadoTitular:false},results4]})); 
                  } else {
                    // No se encontro el afiliado
                    res.send(JSON.stringify({"status": 200, "error": null, "response": results4+'Algo anduvo mal'}));
                  }
                });
                // End afiliadoflia
              }
            });
            // End afiliado


          }else{
            // No se encontro la persona 
            res.send(JSON.stringify({"status": 200, "error": null, "response": ['Algo anduvo mal']}));
          }

        });
        // End persona



    }else{
      res.send(JSON.stringify({"status": 200, "error": null, "response": results+'Usuario no encontrado.'}));
    }
 
 


  });
});


