import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
// L'import di db.mjs inizializza schema e dati (il seed parte solo se il DB è vuoto).
import { getUserByUsername, getUserById } from './db.mjs';

// Autenticazione locale: username + password verificata con scrypt e sale.
passport.use(new LocalStrategy((username, password, done) => {
  const user = getUserByUsername(username);
  if (!user) return done(null, false, { message: 'Credenziali errate' });

  crypto.scrypt(password, user.salt, 32, (err, derivedKey) => {
    if (err) return done(err);
    const storedHash = Buffer.from(user.hash, 'hex');
    // Confronto a tempo costante: evita di trapelare informazioni tramite il timing.
    const ok = storedHash.length === derivedKey.length &&
               crypto.timingSafeEqual(storedHash, derivedKey);
    if (!ok) return done(null, false, { message: 'Credenziali errate' });
    // Espongo solo i campi non sensibili: hash e salt restano nel DB.
    return done(null, { id: user.id, username: user.username });
  });
}));

// In sessione tengo solo l'id; l'utente completo lo recupero quando serve.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, getUserById(id)));

const app = express();
const port = 3001;

// Client e server sono su origini diverse: abilito la mia origine e i cookie di sessione.
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
// La sessione gestisce il cookie e mi mette a disposizione req.session.
app.use(session({
  secret: 'ultima-corsa-secret',   // andrebbe in una variabile d'ambiente
  resave: false,
  saveUninitialized: false,
}));
// Passport si appoggia alla sessione, quindi va dopo.
app.use(passport.initialize());
app.use(passport.session());

// Rotte API

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
