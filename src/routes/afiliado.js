const express = require('express');
const router = express.Router();

const mysqlConnection  = require('../database.js');
 
 
// UPDATE 
router.put('/afiliado/:dni', (req, res) => { 
  const { dni } = req.params;
  mysqlConnection.query(
    `
    UPDATE usuarioactivo
    SET usuarioactivo.nombrePersona = '${req.body.nombre}',
        usuarioactivo.cuilPersona = '${req.body.cuil}',
        usuarioactivo.celPersona = '${req.body.celular}'
        usuarioactivo.id_usu = '${req.body.idusu}'
    WHERE usuarioactivo.documentoPersona = ${dni}        
    `, (err, rows, fields) => {
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
      VALUES ('${req.body.username}','${req.body.password}','${req.body.tusu}')        
      `, (err, rows, fields) => {
      if (!err) {
         res.json(rows[0]); 
      } else {
        console.log(err);
        return (req.body);
      } 
    });
  });
  



module.exports = router;