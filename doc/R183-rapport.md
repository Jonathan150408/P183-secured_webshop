# P183 Web Store

## Introduction

## Tâches réalisées

### 1 Implémenter la page de login frontend ✅

> J'ai commencé par ajouter les options de navigation sur toutes les pages, ces dernières étaient en commemtaire alors ce fut rapide. J'ai ensuite crée un formulaire sur la page de login afin de recevoir les infos utilisateur.  
> Sur la page de login, j'ai ensuite ajouté du _javascript_ afin d'enpêcher le formulaire de s'envoyer et à la place construire une requête _POST_. Enfin, nous prenons la requête et nous faisons un _fetch_ sur _/api/auth/login_.

### 2 Implémenter une page d'inscription en frontend ✅

> De même que pour l'étape précédente, nous commmençons par créer le formulaire html sur la page _register.html_. Nous ajoutons ensuite du _JavaScript_ afin de gérer la soumission du formulaire.  
> Enfin nous allons dans _AuthController_ et nous implémentons la création d'un nouvel utiliateur.

### 3 Remplacer les mots de passes en clair dans la base par un hash ✅

> Afin de pouvoir démarrer cette étape, nous avons besoin d'installer [Argon2](https://www.npmjs.com/package/argon2). Ceci servira à hasher et vérifier les passwords en db. Voici la commande relative à l'installation : `npm install argon2`. À présent, nous pouvons commencer à coder, nous allons dans _AuthController_ et, dans la méthode register, nous ajoutons le bout de code qui permet de hash le mot de passe :
>
> ```js
> const hashPassword = await argon2.hash(password, {
>   salt: Buffer.from("saltThatIsLongEnough"), //sel fixe pour le moment
> });
> ```
>
> Attention à bien remplacer _password_ par _haspassword_ dans la requête SQL.  
> Une fois fait, nous recréons tous les comptes utilisateurs afin de stocker les mot de passes hashé.

### 4 Ajouter un sel✅

> Lors de cette étape, nous allons générer un sel (une chaine de caractères aléatoire) pour chaque utilisateur et nous allons l'ajouter au hash du mot de passe. En réalité, le selest généré par argon2 automatiquement. Nous n'avons qu'à retirer la partie où l'on spécifie le sel. Notre code de l'étape précédente devient donc
>
> ```js
> const hashPassword = await argon2.hash(password);
> ```

### 5 Ajouter un poivre✅

> Nous allons maintenant ajouter le poivre à notre application, dans le fichier _.env_ à la racine du projet, ajoutez `PEPPER=9f3c2a8e7b1d4c6f8a91e2b5c7d9f0a1bd55672d7ecdef0ad6c46739ebcaef0`. Sentez-vous libre de changer la valeur du poivre.  
> Ensuite nous ajoutons le poivre au mot de passe ainsi (toujours la même partie du code):
>
> ```js
> //ajouter le poivre au pwd
> const pepper = process.env.PEPPER;
> let passwordWithPepper = password + pepper;
> //hash le pwd
> const hashPassword = await argon2.hash(passwordWithPepper);
> ```
>
> On en profite pour update le login (plus haut dans le même fichier), à présent nous commençons par récupérer le poivre et l'ajoutons au password.  
> On va aussi update un peu la requête SQL afin de ne recevoir que les infos utiles et enfin on vérifie le hash. Voici à quoi devrait ressembler la méthode login.
>
> ```js
> login: (req, res) => {
>    const { email, password } = req.body;
>
>    if (!email || !password) {
>      return res.status(400).json({ error: "Email et mot de passe requis" });
>    }
>
>    //ajouter le poivre au pwd
>    const pepper = process.env.PEPPER;
>   let passwordWithPepper = password + pepper;
>
>    const query = `SELECT password FROM users WHERE email = '${email}'`;
>
>    db.query(query, async (err, results) => {
>      //si erreur
>      if (err) {
>        return res.status(500).json({ error: err.message, query: query });
>      }
>      //si rien n'est retourné (email incorrect ou pwd inexistant)
>      if (results.length === 0) {
>        return res
>          .status(400)
>          .json({ error: "Email ou mot de passe incorrect" });
>      }
>      //sinon on vérifie le hash
>      const accessGranted = await argon2.verify(
>        results[0].password,
>        passwordWithPepper,
>      );
>     if (accessGranted) {
>        //mot infos utilisateur ok -> connexion
>        res.status(200).json({ message: "Connexion réussie" });
>      } else {
>        //mdp faux -> message erreur plus générique
>       res.status(400).json({ message: "Email ou mot de passe incorrect" });
>     }
>  });
> },
> ```

### 6 Prévenir les injections SQL✅

> Il est maintenant temps de revoir nos requêtes SQL et de les sécuriser afin de rendre les injections SQL impossibles. Nous n'avons qu'à substituer les valeurs dans la requête par des point d'interrogation. Nous définissions ensuite le contenu des ? lors de l'appel de la méthode `db.query`.  
> Voici à quoi ça ressemble pour le login :
>
> ```js
> const query = `SELECT password FROM users WHERE email = ? LIMIT 1;`;
> db.query(query, [email], async (err, results) => {
>   //... suite
> });
> ```

### 7 Implémenter l'utilisation d'un token jwt✅

> À présent, nous allons restreindre l'accès à l'application afin de la rendre plus safe. Nous allons utiliser des JSON Web Tokens. Pour ceci, créez une nouvelle variable d'environnement, puis rendez-vous dans le AuthController, dans la partie login. La variable d'environnement s'appelle JWT_SECRET et contient une suite hexadécimale complexe. Pour en créer une facilement, vous pouvez visiter [ce site](https://jwtsecrets.com/).
>
> ```js
> //créer le token
> const secret = process.env.JWT_SECRET;
> const token = jwt.sign(
>   {
>     username: username,
>     email: email,
>   },
>   secret,
> );
>
> //message de connexion réussie
> res.status(200).json({
>   message: "Connexion réussie",
>   token: token, //renvoi du token
> });
> ```
>
> Il nous faut maintenant protéger les routes et pour ceci il nous faut de quoi tester et valider le token. Nous allons utiliser le middleware d'authentification (le fichier /middleware/auth.js). Nous y ajoutons et exportons la méhode `verifyToken`.
>
> ```js
> // =============================================================
> // Middleware d'authentification
> // =============================================================
> const jwt = require("jsonwebtoken");
>
> function verifyToken(req, res, next) {
>   const token = req.headers["authorization"].split(" ")[1]; // Récupère le token après "Bearer "
>
>   //si token manquant
>   if (!token) {
>     return res.status(403).json({ message: "Token manquant" });
>   }
>
>   try {
>     const decoded = jwt.verify(token, process.env.JWT_SECRET);
>     req.user = decoded;
>     next(); //tout est ok, on passe à la suite
>   } catch (err) {
>     //si token invalide
>     return res.status(401).json({ message: "Token invalide" });
>   }
> }
>
> module.exports = { verifyToken };
> ```
>
> Il ne nous reste plus qu'à utiliser la méthode `verifyToken` pour toutes le routes qui en ont besoin. Il suffit d'ajouter le nom de la méthode ainsi.
> `app.get("/profile", (_req, res) => ...` -> `app.get("/profile", verifyToken, (_req, res) => ...`

### 8 Ajouter les rôles administateur et utilisateur dans le jwt et protéger les routes d'administration✅

> Puisque nous avons déjà placé le rôle utilisateur dans le token, il nous suffit de checker le role utilisateur lors de requêtes vers les routes admin (/admin et /api/admin). Nous créons donc une méthode dans auth.js (du middleware) qui permet de check le rôle que nous utilisions ensuite de la même manière que lea méthode de vérification du token.
>
> ```js
> //permet de check le rôle
> function verifyAdmin(req, res, next) {
>   if (req.user.role !== "admin") {
>     return res
>       .status(403)
>       .json({ message: "Accès refusé : rôle administrateur requis" });
>   } else if (req.user.role === "admin") {
>     //else if pour être certain que le rôle est bien admin avant de faire
>     next();
>   }
> }
> ```

### 9 Implémenter le https

> Il est maintenant temps de passer à la connection https. L'utilisation du protocole de connection https requiet un certificat et une clé privée du côté du serveur. Nous allons utiliser OpenSSl afin de créer tout ça. Pour ce faire, créez un dossier _certs_ dans le dossier _app_ et ouvrez un terminal dedans. Vous pouvez ensuite lancer cette commande qui va créer tout ce dont nous avons besoin. `openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"`  
> Étape suivante : gérer le fichier .env : trouvez le fichier .env et ne laissez dedans que `COMPOSE_PROJECT_NAME=webshop_183`. Coupez le reste et collez-le dans un nouveau fichier .env dans le dossier _app_. Si vous avez perdu le contenu de l'ancien .env, vous pouvez renommer le _/app/.env.example_ en .env  
> À présent nous devons modifier les import des autres ressources dans les fichiers db.js et app.js.
>
> ```js
> //on passe de ça
> const express = require("express");
> //à ça ->
> import express from "express";
> ```
>
> Une fois fait, nous passons le serveur en mode https. Il sera nécessaire d'installer le package https `npm i https`. Nous l'utilisons dans le fichier server.js.
>
> ```js
> // Démarrage du serveur
> https.createServer(options, app).listen(8080, () => {
>   console.log("Serveur démarré sur https://localhost:8080");
> });
> ```

### 10 politique de mot de passe

> Nous nous attaquons maintenant à la politique du mot de passe. Le but est d'empêcher les utilisateurs de créer un compte avec un mot de passe trop faible. La politique que j'ai implémenté est : minimum 5 lettres (majuscules ou minuscules) et minimum 2 chiffres. J'ai ainsi utilisé des regexes afin de tester les critères, voici ce qui se passe dans le frontend :
>
> 1. L'utilisateur entre un caractère dans le champ du mot de passe
> 2. Un évent listener se déclenche et appelle la méthode de test du mot de passe
> 3. La méthode de test du mot de passe essaye de match différentes Regexes afin de déterminer la force du mdp.
> 4. La barre de progression change de taille et de couleur, les critères remplis deviennent vert.
> 5. L'utilisateur est satisfait du mot de passe et valide le formulaire.
> 6. La fonction de submission du formualaire vérifie que le mot de passe soit conforme aux critèes.
>
> - Si oui, on continue normalement
> - Si non, une 'alert' est provoquée
>
> Dans le cas où l'utilisateur bypass le fontend avec un mot de passe non-conforme, nous ajoutons une vérification dans le Backend que voici. Dans AuthController.js - partie register du controlleur. Nous ajoutons donc :
>
> ```js
> //test de force du mot de passe
>
> const level1 = /[a-zA-Z]{5,}/; //5 lettres (minuscule ou/et majuscule)
> const level2 = /[0-9]{2,}/; //2 chiffres
> if (!level1.test(password) || !level2.test(password)) {
>   return res.status(400).json({
>     error:
>       "Votre mot de passe doit comporter au moins 5 lettres et 2 chiffres.",
>   });
> }
> ```

## Conclusion
