// Navigation commune à toutes les pages
// Pour modifier le menu, éditer uniquement ce fichier
document.addEventListener("DOMContentLoaded", async () => {
  const nav = document.getElementById("topbar");
  if (!nav) return;

  const response = await fetch("/api/auth/check", {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json();
  const isLogged = data.loggedIn;

  //changer la nav selon le login et rôle user
  if (!isLogged) {
    nav.innerHTML = `
      <header class="topbar">
                <div class="container">
                <div class="brand">Secure Shop</div>
                <nav class="menu">
                <a href="/">Accueil</a>
                <a href="/login">Connexion</a>
                <a href="/register">Inscription</a>
                </nav>
                </div>
                </header>
                `;
  } else {
    nav.innerHTML = `
                <header class="topbar">
                <div class="container">
                <div class="brand">Secure Shop</div>
                <nav class="menu">
                <a href="/">Accueil</a>
                <a href="/profile">Profil</a>
                <a href="/admin">Admin</a>
                <a href="/logout" id="logout">Se déconnecter</a>
                </nav>
                </div>
                </header>
                `;

    const logout = document.getElementById("logout");
    logout.addEventListener("click", (event) => {
      event.preventDefault();
      signOut();
    });

    async function signOut() {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      //debug
      console.log("Réponse logout : ", response);

      if (response.status === 200) {
        window.location.href = "/";
      }
    }
  }
});
