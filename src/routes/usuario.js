const express = require('express');
const router = express.Router();

const mysqlConnection  = require('../database.js');
 
// GET todos Usuarios
router.get('/usuarios', (req, res) => {
    mysqlConnection.query('SELECT * FROM usuarioactivo', (err, rows, fields) => {
      if(!err) {
        res.json(rows);
      } else {
        console.log(err);
      }
    });  
  });

// GET un Usuario
router.get('/usuarios/:dni', (req, res) => {
    const { dni } = req.params;
    mysqlConnection.query(`SELECT * FROM usuarioactivo WHERE documentoPersona = ${dni}`, (err, rows, fields) => {
      if (!err) {
         res.json(rows[0]); 
      } else {
        console.log(err);
      } 
    });
  });


// GET un ult user
router.get('/lastusuario/:username', (req, res) => {
  const { username } = req.params;
  mysqlConnection.query(`SELECT * FROM usuario WHERE nom_usu = '${username}'`, (err, rows, fields) => {
    if (!err) {
       res.json(rows[0]); 
    } else {
      console.log(err);
    } 
  });
});

// INSERT
router.post('/usuario', (req, res) => { 
    mysqlConnection.query(
      `
      INSERT INTO usuario (nom_usu, con_usu, id_tusu)
      VALUES ('${req.body.nom_usu}','${req.body.con_usu}','${req.body.id_tusu}') 
      `, (err, rows, fields) => {
      if (!err) {
          res.json(rows[0]); 
      } else {
        console.log(err);
        return (req.body);
      } 
    });

  });

 
  
 // UPDATE persona
router.put('/persona/:dni', (req, res) => { 
  const { dni } = req.params;
  console.log('req.body---> ', req.body);
  mysqlConnection.query(
    `
    UPDATE persona
    SET persona.nombrePersona = '${req.body.nombre} ${req.body.apellido}',
      persona.cuilPersona = '${req.body.cuil}',
      persona.celPersona = '${req.body.celular}'
    WHERE persona.documentoPersona = '${dni}'       
    `, (err, rows, fields) => {
    if (!err) {
       res.json(rows[0]); 
    } else {
      console.log(err);
    } 
  });
});

// GET una Persona
router.get('/persona/:dni', (req, res) => {
  const { dni } = req.params;
  mysqlConnection.query(`SELECT * FROM persona WHERE documentoPersona = ${dni}`, (err, rows, fields) => {
    if (!err) {
       res.json(rows[0]); 
    } else {
      console.log(err);
    } 
  });
});

 // UPDATE afiliado - id: persona
 router.put('/afiliado/:idPersona', (req, res) => { 
  const { idPersona } = req.params;
  console.log('req.body---> ', req.body);
  mysqlConnection.query(
    `
    SET foreign_key_checks = 0;
    UPDATE afiliado
    SET afiliado.id_usu = '${req.body.idusu}' 
    WHERE afiliado.idPersona = '${idPersona}'       
    `, (err, rows, fields) => {
    if (!err) {
       res.json(rows[0]); 
    } else {
      console.log(err);
    } 
  });
});


module.exports = router; 