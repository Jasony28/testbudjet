// ----- Config Firebase ----- //
const firebaseConfig = {
  apiKey: "AIzaSyCp01lnhlZgXmQ2Y9ZGVXBF6D1DkE_E4CY",
  authDomain: "serveurdejasony-bf32a.firebaseapp.com",
  projectId: "serveurdejasony-bf32a",
  storageBucket: "serveurdejasony-bf32a.appspot.com",
  messagingSenderId: "849112820067",
  appId: "1:849112820067:web:9d7450e56ddef931cd0b56",
  measurementId: "G-KQCQB0R83E"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

// -- Déclaration de tes apps --
const apps = [
    {
        title: "Classement Discord",
        description: "Classe tes amis selon leurs skills sur les jeux Discord et découvre les meilleurs du serveur.",
        url: "classement.html",
        requiresAuth: false
    },
    {
        title: "🚫 Ne pas cliquer",
        description: "Ne pas cliquer",
        url: "#",
        requiresAuth: false
    },
    {
        title: "Gestion de Budget",
        description: `Crée, organise et suis ton budget en toute confidentialité. Simple, rapide, sécurisé !`,
        url: "budget.html",
        requiresAuth: true
    }
];

function renderAuthSection() {
    const authSection = document.getElementById('auth-section');
    const user = firebase.auth().currentUser;
    if (!user) {
        authSection.innerHTML = `
            <button id="btn-google-login" class="btn-main" style="font-size:1.15em;">Se connecter avec Google</button>
        `;
        document.getElementById('btn-google-login').onclick = function() {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider)
                .then(() => {
                    renderAuthSection();
                    renderApps();
                })
                .catch(error => {
                    alert("Erreur lors de la connexion : " + error.message);
                });
        };
    } else {
        authSection.innerHTML = `
            <span style="color:#4dd0ff;font-size:1.1em;">
                Connecté comme <b>${user.displayName || user.email}</b>
            </span>
            <button id="btn-google-logout" class="btn-main" style="margin-left:16px;">Déconnexion</button>
        `;
        document.getElementById('btn-google-logout').onclick = function() {
            firebase.auth().signOut().then(() => {
                renderAuthSection();
                renderApps();
            });
        };
    }
}

function renderApps() {
    const appsList = document.getElementById('apps-list');
    appsList.innerHTML = '';
    const user = firebase.auth().currentUser;
    apps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'app-card';
        let btnHtml;
        if (app.requiresAuth && !user) {
            btnHtml = `<button class="btn-main" style="opacity:0.5;cursor:not-allowed;" disabled>Connecte-toi pour ouvrir</button>`;
        } else if (app.url !== "#") {
            btnHtml = `<a href="${app.url}" class="btn-main">Ouvrir</a>`;
        } else {
            btnHtml = `<button class="btn-main" id="btn-screamer">🚫 NE PAS CLIQUER</button>`;
        }
        card.innerHTML = `
            <h2>${app.title}</h2>
            <p>${app.description}</p>
            ${btnHtml}
        `;
        appsList.appendChild(card);
    });
}

// Rafraîchit à chaque changement de connexion
firebase.auth().onAuthStateChanged(function(user) {
    renderAuthSection();
    renderApps();
});

document.addEventListener('DOMContentLoaded', function() {
    renderAuthSection();
    renderApps();
});
