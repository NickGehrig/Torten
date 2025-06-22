const torten = document.querySelectorAll('.torte');
const overlay = document.getElementById('lightbox');
const img = document.getElementById('lightbox-img');
const title = document.getElementById('lightbox-title');
const info = document.getElementById('lightbox-info');
const preis = document.getElementById('lightbox-preis');
const closeBtn = document.getElementById('closeBtn');

const warenkorbButton = document.getElementById('warenkorb-button');
const warenkorbPopup = document.getElementById('warenkorb-popup');
const warenkorbItems = document.getElementById('warenkorb-items');
const warenkorbCount = document.getElementById('warenkorb-count');
const gesamtpreis = document.getElementById('gesamtpreis');
const bezahlenBtn = document.getElementById('bezahlen-btn');

const bestellForm = document.getElementById('bestell-form');

let selectedTorte = null;
let warenkorb = JSON.parse(localStorage.getItem('warenkorb')) || [];

// Lightbox öffnen beim Klick auf eine Torte
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

// Lightbox schließen
closeBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
});
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) overlay.style.display = 'none';
});

// Warenkorb anzeigen
warenkorbButton.onclick = () => {
  updateWarenkorbAnzeige();
  warenkorbPopup.style.display = 'flex';
};

// Warenkorb anzeigen und aktualisieren
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
      item.menge = Math.max(1, parseInt(mengeInput.value) || 1);
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

  bezahlenBtn.disabled = warenkorb.length === 0 || !checkFormValidity();
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

// Bestellformular anzeigen
document.getElementById('bestellung-weiter').onclick = () => {
  document.getElementById('bestellformular').style.display = 'flex';
};

function closeBestellformular() {
  document.getElementById('bestellformular').style.display = 'none';
}

// Formularvalidierung (gibt true/false zurück)
function checkFormValidity() {
  const vorname = document.getElementById('Vorname').value.trim();
  const nachname = document.getElementById('Nachname').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefon = document.getElementById('telefon').value.trim();
  const wunschdatum = document.getElementById('wunschdatum').value.trim();
  const ort = document.getElementById('ort').value.trim();

  const valid = vorname && nachname && email && telefon && wunschdatum && ort && warenkorb.length > 0;
  bezahlenBtn.disabled = !valid;
  return valid;
}

// Listener auf Pflichtfelder zur Validierung
['Vorname', 'Nachname', 'email', 'telefon', 'wunschdatum', 'ort'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    checkFormValidity();
  });
});

// PayPal-Bezahlbutton initialisieren und Aktionen definieren
bezahlenBtn.addEventListener('click', () => {
  document.getElementById('paypal-button-container').innerHTML = "";

  let summe = 0;
  warenkorb.forEach(item => {
    summe += item.preis * item.menge;
  });

  if (summe <= 0) {
    showMessage("Warenkorb ist leer oder ungültig.", "error");
    return;
  }

  paypal.Buttons({
    createOrder: function (data, actions) {
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: summe.toFixed(2),
            currency_code: "CHF"
          }
        }]
      });
    },
    onApprove: function (data, actions) {
      return actions.order.capture().then(function (details) {
        const formData = new FormData(bestellForm);
        const formObject = Object.fromEntries(formData.entries());
        const tortenText = warenkorb.map(item => `${item.name} (x${item.menge})`).join(", ");
        formObject.tortenliste = tortenText;

        fetch("https://formspree.io/f/xbloagqo", {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: new URLSearchParams({
            ...formObject,
            _to: "nickgehrig@gmx.ch",
            _cc: formObject.email,
            _replyto: formObject.email,
            Nachricht: `Zahlung von ${details.payer.name.given_name} ${details.payer.name.surname}, Betrag: ${details.purchase_units[0].amount.value} ${details.purchase_units[0].amount.currency_code}, Artikel: ${tortenText}`
          })
        }).then(response => {
          if (response.ok) {
            showMessage("Herzlichen Dank für Ihren Einkauf!");
            resetWarenkorb();
          } else {
            showMessage("Zahlung ok, aber E-Mail konnte nicht gesendet werden.");
          }
        });
      });
    },
    onCancel: function () {
      showMessage("Bezahlung abgebrochen.", "info");
    },
    onError: function (err) {
      showMessage("Fehler bei der PayPal-Zahlung.", "error");
      console.error("PayPal Fehler:", err);
    }
  }).render('#paypal-button-container');
});

// Bestellformular absenden (Fallback)
bestellForm.addEventListener('submit', function(event) {
  event.preventDefault();
  
  showMessage("Bestellung wird gesendet...", "info");
  
  const formData = new FormData(this);

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
        resetWarenkorb();
        closeBestellformular();
        closeWarenkorb();
      } else {
        showMessage("Bestellung konnte nicht gesendet werden. Bitte später erneut versuchen.", "error");
      }
    }).catch(() => {
      showMessage("Fehler beim Senden. Bitte überprüfe deine Internetverbindung.", "error");
    });
});

// Meldung anzeigen
function showMessage(text, type = "info") {
  const msg = document.getElementById("nachricht");
  msg.innerText = text;
  msg.style.display = "block";

  if (type === "success") {
    msg.style.backgroundColor = "#d4edda";
    msg.style.color = "#155724";
    msg.style.border = "1px solid #c3e6cb";
  } else if (type === "error") {
    msg.style.backgroundColor = "#f8d7da";
    msg.style.color = "#721c24";
    msg.style.border = "1px solid #f5c6cb";
  } else { // info
    msg.style.backgroundColor = "#d1ecf1";
    msg.style.color = "#0c5460";
    msg.style.border = "1px solid #bee5eb";
  }

  msg.style.padding = "10px";

  setTimeout(() => {
    msg.style.display = "none";
  }, 8000);
}

// Warenkorb zurücksetzen
function resetWarenkorb() {
  warenkorb = [];
  localStorage.removeItem('warenkorb');
  updateWarenkorbAnzeige();
  closeWarenkorb();
  closeBestellformular();
}

// Initiales Update und Formularvalidierung
updateWarenkorbAnzeige();
checkFormValidity();
