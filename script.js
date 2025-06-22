const torten = document.querySelectorAll('.torte');
const overlay = document.getElementById('lightbox');
const img = document.getElementById('lightbox-img');
const title = document.getElementById('lightbox-title');
const info = document.getElementById('lightbox-info');
const preis = document.getElementById('lightbox-preis');
const closeBtn = document.getElementById('closeBtn');

let selectedTorte = null;

torten.forEach(torte => {
  torte.addEventListener('click', () => {
    selectedTorte = {
      name: torte.dataset.name,
      preis: parseFloat(torte.dataset.preis),
      img: torte.dataset.img
    };
    img.src = selectedTorte.img;
    title.textContent = selectedTorte.name;
    info.textContent = torte.dataset.info;
    preis.textContent = `Preis: ${torte.dataset.preis} Fr.`;
    overlay.style.display = 'flex';

    // Button nur einmal hinzufügen
    if (!document.getElementById('add-to-cart')) {
      const addButton = document.createElement('button');
      addButton.textContent = 'Zum Warenkorb hinzufügen';
      addButton.id = 'add-to-cart';
      addButton.style.marginTop = '20px';
      addButton.style.padding = '10px 20px';
      addButton.style.backgroundColor = '#d6336c';
      addButton.style.color = 'white';
      addButton.style.border = 'none';
      addButton.style.borderRadius = '10px';
      addButton.style.cursor = 'pointer';
      addButton.onclick = () => {
        addToCart(selectedTorte);
        overlay.style.display = 'none';
      };
      document.querySelector('.lightbox-content').appendChild(addButton);
    }
  });
});

closeBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
});

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) overlay.style.display = 'none';
});

const warenkorbButton = document.getElementById('warenkorb-button');
const warenkorbPopup = document.getElementById('warenkorb-popup');
const warenkorbItems = document.getElementById('warenkorb-items');
const warenkorbCount = document.getElementById('warenkorb-count');
const gesamtpreis = document.getElementById('gesamtpreis');

let warenkorb = JSON.parse(localStorage.getItem('warenkorb')) || [];

function updateWarenkorbAnzeige() {
  warenkorbItems.innerHTML = '';
  let summe = 0;

  warenkorb.forEach((item, index) => {
    const div = document.createElement('div');
    div.classList.add('warenkorb-item');

    const name = document.createElement('span');
    name.textContent = item.name;

    const mengeInput = document.createElement('input');
    mengeInput.type = 'number';
    mengeInput.value = item.menge;
    mengeInput.min = 1;
    mengeInput.onchange = () => {
      item.menge = Math.max(1, parseInt(mengeInput.value));
      saveCart();
      updateWarenkorbAnzeige();
    };

    const remove = document.createElement('button');
    remove.textContent = '🗑️';
    remove.onclick = () => {
      warenkorb.splice(index, 1);
      saveCart();
      updateWarenkorbAnzeige();
    };

    div.appendChild(name);
    div.appendChild(mengeInput);
    div.appendChild(remove);
    warenkorbItems.appendChild(div);

    summe += item.preis * item.menge;
  });

  gesamtpreis.textContent = `Gesamt: ${summe.toFixed(2)} Fr.`;
  warenkorbCount.textContent = warenkorb.reduce((a, b) => a + b.menge, 0);

  // "Bezahlen"-Button aktivieren, wenn Warenkorb nicht leer
  bezahlenBtn.disabled = warenkorb.length === 0;
}

function addToCart(torte) {
  const existing = warenkorb.find(item => item.name === torte.name);
  if (existing) {
    existing.menge += 1;
  } else {
    warenkorb.push({ ...torte, menge: 1 });
  }
  saveCart();
  updateWarenkorbAnzeige();
}

function saveCart() {
  localStorage.setItem('warenkorb', JSON.stringify(warenkorb));
}

function closeWarenkorb() {
  warenkorbPopup.style.display = 'none';
}

warenkorbButton.onclick = () => {
  updateWarenkorbAnzeige();
  warenkorbPopup.style.display = 'flex';
};

document.getElementById('bestellung-weiter').onclick = () => {
  document.getElementById('bestellformular').style.display = 'flex';
};

function closeBestellformular() {
  document.getElementById('bestellformular').style.display = 'none';
}

const bestellForm = document.getElementById('bestell-form');

// Formular Validierung für Pflichtfelder
function checkFormValidity() {
  const vorname = document.getElementById('Vorname').value.trim();
  const nachname = document.getElementById('Nachname').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefon = document.getElementById('telefon').value.trim();
  const wunschdatum = document.getElementById('wunschdatum').value.trim();
  const ort = document.getElementById('ort').value.trim();

  const valid = vorname && nachname && email && telefon && wunschdatum && ort && warenkorb.length > 0;
  bezahlenBtn.disabled = !valid;
}

// Listener auf Pflichtfelder
['Vorname', 'Nachname', 'email', 'telefon', 'wunschdatum', 'ort'].forEach(id => {
  document.getElementById(id).addEventListener('input', checkFormValidity);
});

const bestellungSendenBtn = document.getElementById('bestellung-senden');
const bezahlenBtn = document.getElementById('bezahlen-btn');
const paypalPopup = document.getElementById('paypal-popup');
const paypalCloseBtn = document.getElementById('paypal-close-btn');
const paidConfirmBtn = document.getElementById('paid-confirm-btn');
const openPaypalBtn = document.getElementById('open-paypal-btn');
let paypalLink = null;

bezahlenBtn.addEventListener('click', () => {
  let summe = 0;
  warenkorb.forEach(item => {
    summe += item.preis * item.menge;
  });

  paypalLink = `https://paypal.me/SteGehrig/${summe.toFixed(2)}`;

  // PayPal-Link in neuem Tab öffnen
  const win = window.open(paypalLink, '_blank', 'noopener,noreferrer');

  if (win) {
    // Button "Ich habe bezahlt" verstecken und deaktivieren bis der Tab geschlossen wird
    paidConfirmBtn.disabled = true;
    paidConfirmBtn.style.display = 'none';

    // Prüfen, ob das PayPal-Fenster geschlossen wurde
    const timer = setInterval(() => {
      if (win.closed) {
        clearInterval(timer);
        // PayPal-Tab geschlossen -> Button anzeigen und aktivieren
        paidConfirmBtn.disabled = false;
        paidConfirmBtn.style.display = 'inline-block';

        // Info anzeigen
        showMessage('Danke! Wenn Sie bezahlt haben, klicken Sie bitte auf "Ich habe bezahlt".', 'info');
      }
    }, 500);

  } else {
    alert('Popup wurde blockiert. Bitte erlaube Popups für diese Seite.');
  }
});

// PayPal-Popup schließen (falls du es benutzt)
paypalCloseBtn.addEventListener('click', () => {
  paypalPopup.style.display = 'none';
});

// "Ich habe bezahlt"-Button: Bestellformular absenden, Popups schließen
paidConfirmBtn.addEventListener('click', () => {
  // Warenkorb-Details als Text zusammensetzen
  let warenkorbDetails = "";
  warenkorb.forEach(item => {
    warenkorbDetails += `${item.name} (Menge: ${item.menge}), `;
  });
  warenkorbDetails = warenkorbDetails.slice(0, -2); // letztes Komma entfernen

  // In verstecktes Feld setzen (das Feld muss in deinem Formular vorhanden sein)
  document.getElementById('tortenliste').value = warenkorbDetails;

  // Formular absenden
  bestellForm.submit();

  // Popups schließen
  paypalPopup.style.display = 'none';
  closeBestellformular();
  closeWarenkorb();

  // Warenkorb leeren
  warenkorb = [];
  saveCart();
  updateWarenkorbAnzeige();

  // Info anzeigen
  showMessage("Bestellung erfolgreich abgeschickt. Vielen Dank!", "success");
});

// Formular direkt an Formspree senden (Alternative oder Backup, falls du das brauchst)
bestellForm.addEventListener('submit', function(event) {
  event.preventDefault();
  
  showMessage("Bestellung wird gesendet...", "info");
  
  const formData = new FormData(this);

  // Warenkorb als String hinzufügen
  let warenkorbDetails = "";
  warenkorb.forEach(item => {
    warenkorbDetails += `${item.name} (Menge: ${item.menge}), `;
  });
  formData.append("warenkorb", warenkorbDetails.slice(0, -2));

  fetch("https://formspree.io/f/xbloagqo", {
    method: "POST",
    body: formData,
    headers: { 'Accept': 'application/json' }
  }).then(response => response.json())
    .then(data => {
      if (data.ok || data.success) {
        showMessage("Bestellung wurde erfolgreich gesendet! Vielen Dank.", "success");
        warenkorb = [];
        saveCart();
        updateWarenkorbAnzeige();
        closeBestellformular();
        closeWarenkorb();
      } else {
        showMessage("Bestellung konnte nicht gesendet werden. Bitte später erneut versuchen.", "error");
      }
    }).catch(() => {
      showMessage("Fehler beim Senden. Bitte überprüfe deine Internetverbindung.", "error");
    });
});

// Funktion zur Anzeige von Nachrichten (Erfolg, Fehler, Info)
function showMessage(message, type) {
  const messageContainer = document.createElement('div');
  messageContainer.classList.add('message', type);  // z.B. 'success', 'error', 'info'
  messageContainer.textContent = message;
  document.body.appendChild(messageContainer);

  setTimeout(() => messageContainer.remove(), 5000);
}

// Initiales Update und Formularvalidierung starten
updateWarenkorbAnzeige();
checkFormValidity();
