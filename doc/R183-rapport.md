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

### 4 Ajouter un sel🟧

> Lors de cette étape, nous allons générer un sel (une chaine de caractères aléatoire) pour chaque utilisateur et nous allons l'ajouter au hash du mot de passe. En réalité, le selest généré par argon2 automatiquement. Nous n'avons qu'à retirer la partie où l'on spécifie le sel. Notre code de l'étape précédente devient donc
>
> ```js
> const hashPassword = await argon2.hash(password);
> ```

### 5 Ajouter un poivre

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

### 6 Prévenir les injections SQL

> Il est maintenant temps de revoir nos requêtes SQL et de les sécuriser afin de rendre les injections SQL impossibles. Nous n'avons qu'à substituer les valeurs dans la requête par des point d'interrogation. Nous définissions ensuite le contenu des ? lors de l'appel de la méthode `db.query`.  
> Voici à quoi ça ressemble pour le login :
>
> ```js
> const query = `SELECT password FROM users WHERE email = ? LIMIT 1;`;
> db.query(query, [email], async (err, results) => {
>   //... suite
> });
> ```
