// ---------- ELEMENTE ----------
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
const bestellungWeiterBtn = document.getElementById('bestellung-weiter');
const bestellformularDiv = document.getElementById('bestellformular');

let selectedTorte = null;
let warenkorb = JSON.parse(localStorage.getItem('warenkorb')) || [];

// ---------- LIGHTBOX ----------
torten.forEach(torte => {
  torte.addEventListener('click', () => {
    selectedTorte = {
      name: torte.dataset.name,
      preis: parseFloat(torte.dataset.preis),
      img: torte.dataset.img,
      info: torte.dataset.info
    };
    img.src = selectedTorte.img;
    title.textContent = selectedTorte.name;
    info.textContent = selectedTorte.info;
    preis.textContent = `Preis: ${selectedTorte.preis} Fr.`;
    overlay.style.display = 'flex';

    let addButton = document.getElementById('add-to-cart');
    if(!addButton){
      addButton = document.createElement('button');
      addButton.id = 'add-to-cart';
      addButton.classList.add('add-to-cart-button');
      document.querySelector('.lightbox-content').appendChild(addButton);
    }
    addButton.textContent = 'Zum Warenkorb hinzufügen';
    addButton.onclick = () => {
      addToCart(selectedTorte);
      overlay.style.display = 'none';
    };
  });
});

// Lightbox schließen
closeBtn.addEventListener('click', () => overlay.style.display = 'none');
overlay.addEventListener('click', e => { if(e.target === overlay) overlay.style.display = 'none'; });

// ---------- WARENKORB ----------
warenkorbButton.addEventListener('click', () => openWarenkorb());

function openWarenkorb() {
  updateWarenkorbAnzeige();
  warenkorbPopup.style.display = 'flex';
  warenkorbPopup.style.position = 'fixed';
  warenkorbPopup.style.top = '50%';
  warenkorbPopup.style.left = '50%';
  warenkorbPopup.style.transform = 'translate(-50%, -50%)';
  warenkorbPopup.style.zIndex = '9999';
}

function closeWarenkorb() {
  warenkorbPopup.style.display = 'none';
}

function updateWarenkorbAnzeige() {
  if(!warenkorbItems) return;
  warenkorbItems.innerHTML = '';
  let summe = 0;

  if(warenkorb.length === 0){
    warenkorbItems.textContent = "Dein Warenkorb ist leer.";
  }

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
      warenkorb.splice(index,1);
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
  warenkorbCount.textContent = warenkorb.reduce((a,b) => a+b.menge,0);
  bezahlenBtn.disabled = warenkorb.length === 0 || !checkFormValidity();
}

// ---------- WARENKORB FUNKTIONEN ----------
function addToCart(torte){
  const existing = warenkorb.find(item => item.name === torte.name);
  if(existing) existing.menge += 1;
  else warenkorb.push({...torte, menge:1});
  saveCart();
  updateWarenkorbAnzeige();
}

function saveCart(){
  localStorage.setItem('warenkorb', JSON.stringify(warenkorb));
}

// ---------- BESTELLFORMULAR ----------
bestellungWeiterBtn.addEventListener('click', () => {
  closeWarenkorb();
  bestellformularDiv.style.display = 'flex';
});

function closeBestellformular(){
  bestellformularDiv.style.display = 'none';
}

// ---------- PRÜFUNG PFLICHTFELDER + 4h ----------
function checkFormValidity(){
  const vorname = document.getElementById('Vorname').value.trim();
  const nachname = document.getElementById('Nachname').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefon = document.getElementById('telefon').value.trim();
  const ort = document.getElementById('ort').value.trim();
  const datum = document.getElementById('datum').value;
  const zeitvon = document.getElementById('zeitvon').value;
  const zeitbis = document.getElementById('zeitbis').value;

  let zeitValid = false;
  if(zeitvon && zeitbis){
    const start = new Date(`1970-01-01T${zeitvon}:00`);
    const ende = new Date(`1970-01-01T${zeitbis}:00`);
    if(!isNaN(start.getTime()) && !isNaN(ende.getTime())){
      zeitValid = (ende - start)/1000/60/60 >= 4;
    }
  }

  const pflichtfelder = vorname && nachname && email && telefon && ort && datum && warenkorb.length>0;
  const valid = pflichtfelder && zeitValid;

  bezahlenBtn.disabled = !valid;
  return valid;
}

// Listener für Pflichtfelder
['Vorname','Nachname','email','telefon','datum','zeitvon','zeitbis','ort'].forEach(id => {
  document.getElementById(id).addEventListener('input', checkFormValidity);
});

// ---------- PAYPAL ----------
bezahlenBtn.addEventListener('click', () => {
  document.getElementById('paypal-button-container').innerHTML = "";
  const summe = warenkorb.reduce((a,b)=>a+b.preis*b.menge,0);
  if(summe<=0){ showMessage("Warenkorb leer oder ungültig","error"); return; }

  paypal.Buttons({
    createOrder:(data,actions)=>actions.order.create({
      purchase_units:[{amount:{value:summe.toFixed(2),currency_code:"CHF"}}]
    }),
    onApprove:(data,actions)=>actions.order.capture().then(details=>{ sendBestellung(details); }),
    onCancel:()=>showMessage("Bezahlung abgebrochen","info"),
    onError:(err)=>{ showMessage("PayPal Fehler","error"); console.error(err);}
  }).render('#paypal-button-container');
});

// ---------- BESTELLUNG SENDEN ----------
function sendBestellung(details=null){
  const formData = new FormData(bestellForm);
  formData.append("zeitVon", document.getElementById('zeitvon').value);
  formData.append("zeitBis", document.getElementById('zeitbis').value);

  const formObj = Object.fromEntries(formData.entries());
  const tortenText = warenkorb.map(i=>`${i.name} (x${i.menge})`).join(", ");
  formObj.tortenliste = tortenText;

  if(details){
    formObj.Nachricht = `Zahlung von ${details.payer.name.given_name} ${details.payer.name.surname}, Betrag: ${details.purchase_units[0].amount.value} CHF, Artikel: ${tortenText}`;
  }

  fetch("https://formspree.io/f/xbloagqo",{
    method:"POST",
    headers:{"Accept":"application/json"},
    body:new URLSearchParams(formObj)
  }).then(res=>{
    if(res.ok){
      showMessage("Bestellung erfolgreich gesendet!","success");
      resetWarenkorb();
      closeWarenkorb();
      closeBestellformular();
    }else showMessage("Fehler beim Senden","error");
  }).catch(()=>showMessage("Internet prüfen","error"));
}

// ---------- MELDUNGEN ----------
function showMessage(text,type="info"){
  const msg = document.getElementById("nachricht");
  msg.innerText = text;
  msg.style.display='block';
  msg.style.padding='10px';

  if(type==="success"){ msg.style.background="#d4edda"; msg.style.color="#155724"; msg.style.border="1px solid #c3e6cb";}
  else if(type==="error"){ msg.style.background="#f8d7da"; msg.style.color="#721c24"; msg.style.border="1px solid #f5c6cb";}
  else{ msg.style.background="#d1ecf1"; msg.style.color="#0c5460"; msg.style.border="1px solid #bee5eb";}

  setTimeout(()=>{msg.style.display='none';},6000);
}

// ---------- WARENKORB RESET ----------
function resetWarenkorb(){
  warenkorb = [];
  saveCart();
  updateWarenkorbAnzeige();
  closeWarenkorb();
  bestellForm.reset();
}

// ---------- POPUP SCHLIESSEN BEIM KLICK AUSSERHALB ----------
window.onclick = function(e){
  if(e.target === warenkorbPopup) closeWarenkorb();
  if(e.target === overlay) overlay.style.display='none';
};
