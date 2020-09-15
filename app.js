const express = require ('express');
const config = require ('./config/details');
const lib = require ('./lib/lib');
const bcrypt = require ('bcrypt');
const cors = require ('cors');
const Clarifai = require('clarifai');
const bodyParser = require ('body-parser');
const app = express ();
const db = require ('knex') ({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: 'test123',
    database: 'postgres',
  },
});

const faceApp = new Clarifai.App ({
  apiKey: '17303e09700149a491ea2c2df93cad31',
});

const handleApiCall=(req,res)=>{
  faceApp.models
.predict (Clarifai.FACE_DETECT_MODEL, req.body.input)
.then(data=>{
   res.json(data);
}).catch(err=>res.status(400).son('unable to work with API'));
}

const connectionLogger = port => {
  let res = lib.color (`app is running on port ${port}`, lib.Colors ().Blue);
  console.log (res);
};

app.use (bodyParser.json ());
app.use (
  bodyParser.urlencoded ({
    extended: true,
  })
);
app.use (cors ());
app.get ('/', (req, res) => {
  res.send ('this is working');
});
app.post("/imageUrl",(req,res)=>{
  handleApiCall(req,res);
})
app.get ('/profile/:id', (req, res) => {
  const {id} = req.params;
  db
    .select ('*')
    .from ('users')
    .where ({
      id,
    })
    .then (user => {
      if (user.length) {
        res.status (200).json (user);
      } else {
        res.status (400).json ('Not Found');
      }
    })
    .catch (err => res.status (400).json ('unable to locate such user'));
});
app.post ('/signin', (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    return res.status (400).json ('incorrect form submission');
  }
  return db
    .select ('email', 'hash')
    .from ('login')
    .where ('email', '=', req.body.email)
    .then (data => {
      const isValid = bcrypt.compareSync (password, data[0].hash);
      if (isValid) {
        return db
          .select ('*')
          .from ('users')
          .where ('email', '=', req.body.email)
          .then (user => {
            res.json (user[0]);
          })
          .catch (err => {
            console.log (err);
            res.status (400).json ('unable to get user');
          });
      } else {
        res.status (400).json ('Wrong credentials');
      }
    })
    .catch (err => res.status (400).json ('wrong credentials'));
});
app.post ('/register', (req, res) => {
  const {name, email, password} = req.body;
  if (!email || !name || !password) {
    return res.status (400).json ('incorrect form submission');
  }
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync (saltRounds);
  const hash = bcrypt.hashSync (password, salt);
  db.transaction (trx => {
    trx
      .insert ({
        hash: hash,
        email: email,
      })
      .into ('login')
      .returning ('email')
      .then (loginEmail => {
        return trx ('users')
          .returning ('*')
          .insert ({
            name: name,
            email: loginEmail[0],
            joined: new Date (),
          })
          .then (user => {
            res.status (200).json (user[0]);
          })
          .catch (err => res.status (400).json ('unable to register'));
      })
      .then (trx.commit)
      .catch (trx.rollback);
  });
});

app.put ('/image', (req, res) => {
  const {id} = req.body;
  db ('users')
    .where ('id', '=', id)
    .increment ('entries', 1)
    .returning ('entries')
    .then (entries => {
      res.json (entries[0]);
    })
    .catch (err => res.status (400).json ('unable to get entries '));
});
app.listen (config.host, connectionLogger (config.host));
