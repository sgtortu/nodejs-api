const express = require('express');
const router = express.Router();

const mysqlConnection  = require('../database.js');
 
// GET todos Usuarios
router.get('/usuarios', (req, res) => {
    mysqlConnection.query('SELECT * FROM usuario', (err, rows, fields) => {
      if(!err) {
        res.json(rows);
      } else {
        console.log(err);
      }
    });  
  });

// GET un Usuario
router.get('/usuarios/:id', (req, res) => {
    const { id } = req.params; 
    mysqlConnection.query('SELECT * FROM usuario WHERE id_usu = ?', [id], (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
      } else {
        console.log(err);
      }
    });
  });
  
// DELETE un Usuario
router.delete('/usuario/:id', (req, res) => {
    const { id } = req.params;
    mysqlConnection.query('DELETE FROM usuario WHERE id_usu = ?', [id], (err, rows, fields) => {
      if(!err) {
        res.json({status: 'Usuario eliminado'});
      } else {
        console.log(err);
      }
    });
  });
  







module.exports = router;