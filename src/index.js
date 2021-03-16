const express = require('express');
const app = express();
const conn  = require('./database'); 
const bcrypt = require('bcryptjs'); 
const nodemailer = require('nodemailer');
const gP = require('./generatePass');
const Canvas = require("canvas");
const PDF417 = require("pdf417-generator"); 
 
// Settings
app.set('port', process.env.PORT || 3001);

// Middlewares --> Antes de procesar algo (antes de la ruta)
app.use(express.json());

// Routes 

// Starting the server
app.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`);
});

app.use(require('./routes/usuario')); 
/*
EMAIL
*/
app.get('/',(req,res)=>res.send('hello world'))
 
app.post('/send-email', (req, res) => {
  
  let emailUser = req.body.email; 

   // Email existente 
 let sql0 = `SELECT persona.mailPersona FROM persona WHERE mailPersona = '${emailUser}'`;
 let query0 = conn.query(sql0, (err0, results0) => {
   if(err0) throw err0; 
   row = JSON.stringify(results0); 
   objEmail = JSON.parse(row); 
   //console.log('objEmail[0]: ', objEmail[0])

   if (objEmail[0]) {
    //Email existe
    let newPassword = gP();
    let newPasswordHash = bcrypt.hashSync(newPassword,10)
    console.log('newPassword - >   ', newPassword) 
    console.log('newPasswordHash - >   ', newPasswordHash) 
    console.log('emailUser - >   ', emailUser) 

    let transporter = nodemailer.createTransport({
      host:'smtp.gmail.com.',
      post:'465', //465 para SSL y 587 para TLS.
      secure: false,
      auth:{
        user:'recuperarsindicatocarne@gmail.com',
        pass:'wjjdozamtdrbuyju'
      }
    })
    let mailOptions = {
      from:'Remitente',
      to: emailUser,
      subject:'Nueva contraseña',
      //text: `Su nueva contraseña es:  ${newPassword} ?`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

        
          <style>
            .landing { 
              background: #043464;
              padding: 25px
            } 
            .title {
              font-size: 1.9rem;
              color: white;
              margin-left: 20px;
              margin-top: 15px
            }
            .subtitle { 
              font-size: 1.2rem;
              color: white;
              margin-left: 20px;
              margin-button: 20px
            } 
          </style>
        </head>
        <body>
        
        <!-- Start Landing Page-->
        <div class="landing pt-2">
          <div class="container-fluid pt-1 pb-5">
            <div class="row justify-content-center p-5">
              <div class="col-12 text-center">
                <p class="title text-light font-weight-bold">Hola, se han modificado tus datos de acceso. </p>
                <p class="subtitle text-light pb-3">Tu nueva contraseña es: ${newPassword} </p> 
              </div>
            </div>
          </div>
        </div>
        <!-- End Landing Page -->
          
        </body>
        </html>  
      `
    }
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        res.status(500).send(error.message);
      }else{
        // update usuario.con_usu where persona.mail = email (idUsuario)
        // recordar hash password
        let sql = `
          UPDATE usuario
          INNER JOIN persona ON usuario.id_usu = persona.idUsuario
          SET usuario.con_usu = '${newPasswordHash}'
          WHERE persona.mailPersona = '${emailUser}'
        `
        let query = conn.query(sql, (err, results) => {
          if(err) throw err;
          rowArray = JSON.stringify(results); 
          obj = JSON.parse(rowArray);
          console.log('obj[0]  ', obj)
          if (obj) {
            res.send(JSON.stringify({"status": 200, "error": null, "response": true})); 
          }else{
            //Email NO existe
            res.send(JSON.stringify({"status": 200, "error": null, "response": false}));
          }
        });


      }
    })
  }else{ 
      res.send(JSON.stringify({"status": 200, "error": null, "response": false}));

   }
  });
  
})
/*
  RUTAS
*/

// Para afiliado titular
// GET usuarioactivo - persona
app.get('/usuarios/:dni',(req, res) => {
  let sql = "SELECT idUsuario FROM persona WHERE documentoPersona="+req.params.dni; 
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    rowArray = JSON.stringify(results); 
    objIdusuario = JSON.parse(rowArray);
    //console.log('---',objIdusuario[0].idUsuario)
    if( objIdusuario[0].idUsuario === null ) {
      
      // NO se ha registrado aun

      let sql2 = `SELECT * FROM usuarioactivo WHERE documentoPersona = ${req.params.dni}`; 
      let query2 = conn.query(sql2, (err2, results2) => {
        if(err2) throw err2;
        res.send(JSON.stringify({"status": 200, "error": null, "response": results2}));
      });

    }else{

      // Ya se ha registrado
      res.send(JSON.stringify({"status": 200, "error": null, "response": 'Ya te has registrado (titular).'})); 
    }
  });
});

// Para familiar del afiliado
// GET persona - afiliadoflia - usuarioactivo
app.get('/personaAfiliadoUsuario/:dni',(req, res) => {
  
  // Chequear si en persona (dni) el campo idUsuario tiene datos
      // Si tiene es porque ya se ha registrado

  let sql4 = `SELECT persona.idUsuario FROM persona WHERE documentoPersona = '${req.params.dni}'`;
  let query4 = conn.query(sql4, (err4, results4) => {
    if(err4) throw err4;
    //res.send(JSON.stringify({"status": 200, "error": null, "response": results3}));
    rowArray4 = JSON.stringify(results4); 
    objIdusuario = JSON.parse(rowArray4);
    //console.log(objIdusuario[0].idUsuario)

    if( objIdusuario[0].idUsuario === null ) {


      // En caso de que no se haya registrado


      let sql = "SELECT idPersona FROM persona WHERE documentoPersona="+req.params.dni;
      let query = conn.query(sql, (err, results) => {
        if(err) throw err;
        rowArray = JSON.stringify(results); 
        objPersona = JSON.parse(rowArray);  

        if (objPersona[0]) {
         
          // Compruebo si un AFILIADO TITULAR se quiere registrar como FAMILIAR... 
          // Start checkAfiliadoTitular
          let sql1 = `SELECT estadoAfiliado
            FROM afiliado 
            WHERE idPersona = ${objPersona[0].idPersona}
          ` 
          let query1 = conn.query(sql1, (err1, results1) => {
            if(err1) throw err1;
            rowArray1 = JSON.stringify(results1); 
            objAfiliado = JSON.parse(rowArray1);
            //console.log('objAfiliado ', objAfiliado[0].estadoAfiliado)
            if (objAfiliado[0]) {
              if (objAfiliado[0].estadoAfiliado === 'P') { 
                return res.send(JSON.stringify({"status": 200, "error": null, "response": results1}));
              }else{


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
  
          
          
          
          
          
          
          
          
          
          
              }

            } 
          });
          // End  





          
    
        }else{
          res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
        }
      });






    }else{

      // En caso de que ya se haya registrado

      res.send(JSON.stringify({"status": 200, "error": null, "response": 'Ya te has registrado.'})); 
    }
  });
  
 
});

 




// Registrarse 
app.post('/registrar',(req, res) => { 
//console.log('req.body.nom_usu: ',req.body.nom_usu)
  // Username existente 
  let sql0 = `SELECT usuario.nom_usu FROM usuario WHERE nom_usu = '${req.body.nom_usu}'`;
  let query0 = conn.query(sql0, (err0, results0) => {
    if(err0) throw err0; 
    row = JSON.stringify(results0); 
    objusername = JSON.parse(row); 
    //console.log('objusername[0]: ', objusername[0])

    if (objusername[0]) {
      // username existente 
      res.send({"status": 200, "error": null, "response": 'El nombre de usuario ya existe.'});

    } else {


      // continue (username no existe)

      const passwordHash = bcrypt.hashSync(req.body.con_usu,10);
      //console.log(passwordHash)
      // Post usuario
      let data = {nom_usu: req.body.nom_usu, con_usu: passwordHash, id_tusu: req.body.id_tusu};
      let sql = "INSERT INTO usuario SET ?";
      let query = conn.query(sql, data,(err, results) => {
        if(err) throw err; 
        // Obtener id del usuario creado recien
        rowArray3 = JSON.stringify(results); 
        obj = JSON.parse(rowArray3); 
        //console.log('insertID: ',obj.insertId)
          // Put persona  
          let sqlPersona = ` UPDATE persona
          SET persona.nombrePersona = '${req.body.apellido} ${req.body.nombre}',
          persona.cuilPersona = '${req.body.cuil}',
          persona.celPersona = '${req.body.celular}',
          persona.mailPersona = '${req.body.mail}',
          persona.fechanacPersona = '${req.body.fnac}',
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




    }
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
        const verified = bcrypt.compareSync(req.params.password,objUsuario[0].con_usu);
        //console.log('verified: ', verified)
        
        if ( !verified ) { 
          res.send(JSON.stringify({"status": 200, "error": null, "response": ['Contraseña incorrecta.']}));
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
            res.send(JSON.stringify({"status": 200, "error": null, "response": ['Usuario no encontrado.']}));
          }

        });
        // End persona



    }else{
      res.send(JSON.stringify({"status": 200, "error": null, "response": ['Usuario no encontrado']}));
    }
 
 


  });
});


// Get imagen dni (pdf417)
app.get('/pdf417/:dni',(req, res) => {
  
  let sql = `SELECT * FROM persona WHERE documentoPersona = '${req.params.dni}'`;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    rowArray = JSON.stringify(results); 
    objPersona = JSON.parse(rowArray);    

    // Format name
    let fullname = objPersona[0].nombrePersona;
    var firstName = fullname.split(' ').slice(0, -1).join(' ');
    var lastName = fullname.split(' ').slice(-1).join(' ');

    //Format date
    let date = objPersona[0].fechanacPersona
    let dateSplit = date.substr(0,10);
    let dateFormat = dateSplit.split('-');
    let dateResult = dateFormat[2]+'/'+dateFormat[1]+'/'+dateFormat[0]; 
    
    let code = [`000@${lastName}@${firstName}@${objPersona[0].sexoPersona}@${objPersona[0].documentoPersona}@0@${dateResult}@00/00/0000`]
    
    let canvas = new Canvas.Canvas()
    PDF417.draw(code, canvas)
    res.send(JSON.stringify({"status": 200, "error": null, "response": [`${canvas.toDataURL()}`]})); 
  });

   
});



// Validar afiliado ACTIVO (titular o gfamiliar)
app.get('/afiliadoactivo/:username',(req, res) => {
  
  let sql = `SELECT id_usu FROM usuario WHERE nom_usu = '${req.params.username}'`;
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    rowArray = JSON.stringify(results); 
    obj = JSON.parse(rowArray);     
    // si encuentra al usuario...
    if (obj[0]) {
      
      let sql2 = `SELECT documentoPersona, idPersona FROM persona WHERE idUsuario = '${obj[0].id_usu}'`;
      let query = conn.query(sql2, (err2, results2) => {
        if(err2) throw err2;
        rowArray2 = JSON.stringify(results2); 
        obj2 = JSON.parse(rowArray2);    
        if (obj2[0]) {
          
          let sql3 = `SELECT nombrePersona FROM usuarioactivo WHERE documentoPersona = '${obj2[0].documentoPersona}'`;
          let query = conn.query(sql3, (err3, results3) => {
            if(err3) throw err3;
            rowArray3 = JSON.stringify(results3); 
            obj3 = JSON.parse(rowArray3);    
            if (obj3[0]) {
              // Activo
              res.send(JSON.stringify({"status": 200, "error": null, "response": true })); 


            } else {
              // esta inactivo(titular), pero voy a chequear por le familiar 

              let sql4 = `SELECT idPersonaA FROM afiliadoflia WHERE idPersona = '${obj2[0].idPersona}'`;
              let query = conn.query(sql4, (err4, results4) => {
                if(err4) throw err4;
                rowArray4 = JSON.stringify(results4); 
                obj4 = JSON.parse(rowArray4);  
 
                if(obj4[0]){

                  let sql5 = `SELECT nombrePersona FROM usuarioactivo WHERE idPersona = '${obj4[0].idPersonaA}'`;
                  let query = conn.query(sql5, (err5, results5) => {
                    if(err5) throw err5;
                    rowArray5 = JSON.stringify(results5); 
                    obj5= JSON.parse(rowArray5);  

                    if (obj5[0]) {
                      // Activo
                      res.send(JSON.stringify({"status": 200, "error": null, "response": true })); 

                    }else{
                      // Has sido dado de baja (familiar) 
                      res.send(JSON.stringify({"status": 200, "error": null, "response": false })); 

                    }
                  });


                }else{
                  // Has sido dado de baja (titular)
                  res.send(JSON.stringify({"status": 200, "error": null, "response": false })); 
                }

              });

            } 
          });

        }else{
          res.send(JSON.stringify({"status": 200, "error": null, "response": 'Ha ocurrido un problema. Vuelva a intentarlo más tarde.' })); 
        }
      
      });



    }else{
      res.send(JSON.stringify({"status": 200, "error": null, "response": 'Ha ocurrido un problema, vuelva a intentarlo más tarde.' })); 
    }
  });

   
});

