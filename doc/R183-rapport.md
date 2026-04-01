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
