// ----- Configuration Firebase -----
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
const db = firebase.firestore();

let currentUser = null; // Mémorise l'utilisateur connecté

// 1. Auth obligatoire pour accéder à la page
firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
        window.location.href = "index.html";
    } else {
        currentUser = user;
        initBudgetApp();
    }
});

function initBudgetApp() {
  document.getElementById('btnAccueil').addEventListener('click', function() {
    window.location.href = 'index.html';
  });

  const transactionForm = document.getElementById('transactionForm');
  const typeSelect = document.getElementById('type');
  const categorieSelect = document.getElementById('categorie');
  const montantInput = document.getElementById('montant');
  const transactionsList = document.getElementById('transactionsList');
  const totalDepensesEl = document.getElementById('totalDepenses');
  const totalRevenusEl = document.getElementById('totalRevenus');
  const soldeEl = document.getElementById('solde');
  const addCategorieBtn = document.getElementById('addCategorieBtn');

  let transactions = [];

  // --- GESTION DES CATÉGORIES PERSONNALISÉES ---
  addCategorieBtn.addEventListener('click', () => {
    const nouvelleCategorie = prompt('Entrez le nom de la nouvelle catégorie :');
    if (nouvelleCategorie && nouvelleCategorie.trim() !== '') {
      const optionExists = Array.from(categorieSelect.options).some(
        opt => opt.value.toLowerCase() === nouvelleCategorie.toLowerCase()
      );
      if (!optionExists) {
        const newOption = document.createElement('option');
        newOption.value = nouvelleCategorie;
        newOption.textContent = nouvelleCategorie;
        categorieSelect.appendChild(newOption);
        categorieSelect.value = nouvelleCategorie;
      } else {
        alert('Cette catégorie existe déjà.');
      }
    }
  });

  // --- AFFICHAGE DES TRANSACTIONS ---
  function renderTransactions() {
    transactionsList.innerHTML = '';
    transactions.forEach((t) => {
      const li = document.createElement('li');
      li.className = t.type;
      const dateStr = t.date
        ? new Date(t.date).toLocaleDateString('fr-FR') + ' '
        : '';
      li.textContent = `${dateStr}${t.type === 'depense' ? 'Dépense' : 'Revenu'} - ${t.categorie} : ${t.montant.toFixed(2)} €`;

      // bouton supprimer
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Supprimer';
      deleteBtn.addEventListener('click', () => {
        if (t.id) {
          db.collection('transactions').doc(t.id).delete().then(loadTransactions);
        }
      });

      li.appendChild(deleteBtn);
      transactionsList.appendChild(li);
    });
    updateDepensesChart();
    updateRevenusChart();
    updateTotals();
  }

  // --- CALCUL DES TOTAUX ---
  function updateTotals() {
    const totalDepenses = transactions
      .filter(t => t.type === 'depense')
      .reduce((acc, t) => acc + t.montant, 0);

    const totalRevenus = transactions
      .filter(t => t.type === 'revenu')
      .reduce((acc, t) => acc + t.montant, 0);

    const solde = totalRevenus - totalDepenses;

    totalDepensesEl.textContent = totalDepenses.toFixed(2);
    totalRevenusEl.textContent = totalRevenus.toFixed(2);
    soldeEl.textContent = solde.toFixed(2);
  }

  // --- CHARGEMENT DES TRANSACTIONS FIRESTORE ---
  function loadTransactions() {
    db.collection('transactions')
      .where('user', '==', currentUser.uid)
      .orderBy('date', 'desc')
      .get()
      .then(snapshot => {
        transactions = [];
        snapshot.forEach(doc => {
          transactions.push({ ...doc.data(), id: doc.id });
        });
        renderTransactions();
      });
  }

  // --- AJOUT DE TRANSACTION ---
  transactionForm.addEventListener('submit', e => {
    e.preventDefault();
    const type = typeSelect.value;
    const categorie = categorieSelect.value;
    const montant = parseFloat(montantInput.value);

    if (!categorie) {
      alert('Veuillez choisir une catégorie.');
      return;
    }
    if (isNaN(montant) || montant <= 0) {
      alert('Veuillez entrer un montant valide.');
      return;
    }

    db.collection("transactions").add({
      type,
      categorie,
      montant,
      date: new Date().toISOString(),
      user: currentUser.uid
    }).then(() => {
      montantInput.value = '';
      montantInput.focus();
      loadTransactions();
    });
  });

  // --- CHART.JS --- (graphiques dynamiques)
  const backgroundColors = [
    '#36a2eb', '#ff6384', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40', '#b3e283', '#e74c3c', '#f1c40f', '#2ecc71'
  ];

  let depensesChart = null;
  function updateDepensesChart() {
    const depensesParCategorie = {};
    transactions
      .filter(t => t.type === 'depense')
      .forEach(t => {
        depensesParCategorie[t.categorie] = (depensesParCategorie[t.categorie] || 0) + t.montant;
      });

    const labels = Object.keys(depensesParCategorie);
    const data = Object.values(depensesParCategorie);
    const ctx = document.getElementById('depensesChart').getContext('2d');

    if (depensesChart) {
      depensesChart.data.labels = labels;
      depensesChart.data.datasets[0].data = data;
      depensesChart.data.datasets[0].backgroundColor = backgroundColors.slice(0, labels.length);
      depensesChart.update();
    } else {
      depensesChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: 'Dépenses par catégorie',
            data: data,
            backgroundColor: backgroundColors.slice(0, labels.length),
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Répartition des dépenses par catégorie' }
          }
        }
      });
    }
  }

  let revenusChart = null;
  function updateRevenusChart() {
    const revenusParCategorie = {};
    transactions
      .filter(t => t.type === 'revenu')
      .forEach(t => {
        revenusParCategorie[t.categorie] = (revenusParCategorie[t.categorie] || 0) + t.montant;
      });

    const labels = Object.keys(revenusParCategorie);
    const data = Object.values(revenusParCategorie);
    const ctx = document.getElementById('revenusChart').getContext('2d');

    if (revenusChart) {
      revenusChart.data.labels = labels;
      revenusChart.data.datasets[0].data = data;
      revenusChart.data.datasets[0].backgroundColor = backgroundColors.slice(0, labels.length);
      revenusChart.update();
    } else {
      revenusChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: 'Revenus par catégorie',
            data: data,
            backgroundColor: backgroundColors.slice(0, labels.length),
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Répartition des revenus par catégorie' }
          }
        }
      });
    }
  }

  // --- INITIALISATION : charge les transactions au début ---
  loadTransactions();
}
