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
      item.menge = parseInt(mengeInput.value);
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

// Schließen des Bestellformulars
function closeBestellformular() {
  document.getElementById('bestellformular').style.display = 'none';
}

// Formular an Formspree senden
document.getElementById("bestell-form").addEventListener("submit", function(event) {
  event.preventDefault(); // Verhindert, dass das Formular sofort abgeschickt wird
  
  // Zeige Nachricht an, dass die Bestellung gesendet wird
  showMessage("Bestellung wird gesendet. Bitte warten...", "info");

  const formData = new FormData(this);

  let warenkorbDetails = "";
  warenkorb.forEach(item => {
    warenkorbDetails += `${item.name} (Menge: ${item.menge}), `;
  });
  formData.append("warenkorb", warenkorbDetails.trim().slice(0, -1)); // Entferne das letzte Komma

  // Sende das Formular an Formspree
  fetch("https://formspree.io/f/xbloagqo", {
    method: "POST",
    body: formData,
    headers: {
      'Accept': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.ok || data.success) {
      // Bestätigung, dass die Bestellung erfolgreich gesendet wurde
      showMessage("Bestellung wurde erfolgreich gesendet! Vielen Dank für deine Bestellung.", "success");

      // Warenkorb leeren und aktualisieren
      warenkorb = [];
      saveCart();
      updateWarenkorbAnzeige();
      closeBestellformular();
      closeWarenkorb();
    } else {
      // Fehlermeldung, wenn die Bestellung nicht gesendet werden konnte
      showMessage("Bestellung konnte nicht gesendet werden. Bitte versuche es später nochmal.", "error");
    }
  })
  .catch(() => {
    // Fehlerbehandlung für den Fall, dass die Anfrage fehlschlägt
    showMessage("bitte habe gedult.", "");
  });
});

// Funktion zur Anzeige von Nachrichten (Erfolg, Fehler, etc.)
function showMessage(message, type) {
  const messageContainer = document.createElement('div');
  messageContainer.classList.add(type);  // z.B. 'success', 'error', 'info'
  messageContainer.textContent = message;
  document.body.appendChild(messageContainer);

  // Nachricht nach 5 Sekunden entfernen
  setTimeout(() => messageContainer.remove(), 5000);
}

updateWarenkorbAnzeige();
const bezahlenBtn = document.getElementById('bezahlen-btn');
const bestellForm = document.getElementById('bestell-form'); // ID deines Formulars anpassen!

// Prüft, ob Pflichtfelder ausgefüllt sind
function checkFormValidity() {
  const vorname = document.getElementById('Vorname').value.trim();
  const nachname = document.getElementById('Nachname').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefon = document.getElementById('telefon').value.trim();
  const wunschdatum = document.getElementById('wunschdatum').value.trim();
  const ort = document.getElementById('ort').value.trim();

  const valid = vorname && nachname && email && telefon && wunschdatum && ort;
  bezahlenBtn.disabled = !valid;
}

// Listener für Eingabefelder
['Vorname', 'Nachname', 'email', 'telefon', 'wunschdatum', 'ort'].forEach(id => {
  document.getElementById(id).addEventListener('input', checkFormValidity);
});

const bestellungSendenBtn = document.getElementById('bestellung-senden');

bezahlenBtn.addEventListener('click', () => {
  // Berechne Gesamtsumme aus deinem aktuellen Warenkorb
  let summe = 0;
  warenkorb.forEach(item => {
    summe += item.preis * item.menge;
  });

  // PayPal.Me-Link mit deinem Namen und Betrag
  const paypalLink = `https://paypal.me/SteGehrig/${summe.toFixed(2)}`;

  // Öffne PayPal.Me Link in neuem Tab
  window.open(paypalLink, '_blank');

  // Button "Bestellung abschließen" aktivieren
  bestellungSendenBtn.disabled = false;
});

// Klick auf "Bestellung abschließen" Button, um E-Mail zu senden
bestellungSendenBtn.addEventListener('click', () => {
  // Warenkorb-Details als Text
  let warenkorbDetails = "";
  warenkorb.forEach(item => {
    warenkorbDetails += `${item.name} (Menge: ${item.menge}), `;
  });

  // Setze die Warenkorb-Details in das versteckte Feld
  document.getElementById('tortenliste').value = warenkorbDetails.slice(0, -2);

  // Formular absenden (E-Mail wird nun erst jetzt gesendet)
  bestellForm.submit();
});
document.addEventListener('DOMContentLoaded', () => {
  const paypalPopup = document.getElementById('paypal-popup');
  const openPaypalBtn = document.getElementById('open-paypal');
  const paidConfirmBtn = document.getElementById('paid-confirmation');
  const paypalCloseBtn = document.getElementById('paypal-close');
  const bezahlenBtn = document.getElementById('bezahlen-btn');
  const bestellForm = document.getElementById('bestell-form');

  // ... dein restlicher Code hier, z.B. Eventlistener setzen etc.
});

let paypalLink = "";  // Hier wird später der PayPal-Link gespeichert

// Beispiel: Funktion um den PayPal-Link mit dem korrekten Betrag zu generieren
function generierePaypalLink(betrag) {
  // Link mit Betrag einfügen (hier PayPal.me als Beispiel)
  return `https://www.paypal.me/DeinPaypalName/${betrag}`;
}

// Wenn Warenkorb aktualisiert wird, aktiviere oder deaktiviere den "Bezahlen"-Button
// (Das solltest du schon in deinem Code haben, sonst hier ergänzen)

// Event-Listener für den Bezahlen-Button (öffnet das Popup)
bezahlenBtn.addEventListener('click', () => {
  // Beispiel: Berechne Gesamtsumme aus deinem Warenkorb (hier statisch als 100 Fr.)
  const betrag = berechneGesamtbetrag(); // Implementiere diese Funktion, die du evtl. schon hast
  paypalLink = generierePaypalLink(betrag);

  // Popup anzeigen
  paypalPopup.style.display = 'block';

  // Button "Ich habe bezahlt" deaktivieren bis Link geöffnet wurde
  paidConfirmBtn.disabled = true;
});

// PayPal-Link öffnen (externer Link)
openPaypalBtn.addEventListener('click', () => {
  if(paypalLink) {
    window.open(paypalLink, '_blank', 'noopener');
    paidConfirmBtn.disabled = false;
  }
});

// Popup schließen
paypalCloseBtn.addEventListener('click', () => {
  paypalPopup.style.display = 'none';
});

// Bestätigung, dass bezahlt wurde
paidConfirmBtn.addEventListener('click', () => {
  // Formular absenden (Bestellung wird gesendet)
  bestellForm.submit();

  // Popup schließen
  paypalPopup.style.display = 'none';
});

// Beispiel-Funktion (du musst deine tatsächliche Berechnung einbauen)
function berechneGesamtbetrag() {
  // Diese Funktion solltest du schon haben, wenn nicht:
  // Summiere alle Preise aus Warenkorb-Items
  // Hier nur ein Platzhalter:
  return 100; // z.B. 100 Fr.
}
bezahlenBtn.addEventListener('click', () => {
  // Berechne die Summe aus dem Warenkorb
  let summe = 0;
  warenkorb.forEach(item => {
    summe += item.preis * item.menge;
  });

  // Generiere PayPal-Link mit dem Betrag
  paypalLink = `https://paypal.me/SteGehrig/${summe.toFixed(2)}`;

  // Popup anzeigen
  paypalPopup.style.display = 'block';

  // Button "Ich habe bezahlt" erstmal deaktivieren
  paidConfirmBtn.disabled = true;
});

openPaypalBtn.addEventListener('click', () => {
  if (paypalLink) {
    const win = window.open('', '_blank', 'noopener,noreferrer');
    win.location = paypalLink;
    paidConfirmBtn.disabled = false;
  }
});

