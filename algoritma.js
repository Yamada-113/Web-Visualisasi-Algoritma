/**
 * NOTE WHAT TO FIX/ADD:
 * Setiap langkah tutorial yg dilakukan harus dijelaskan secara eksplisit (Insertion sort done)
 * Deskripsi setiap sorting hrs dibuat eksplisit lgi
 * Membuat AI yg membantu user untuk menjelaskan setiap langkah/proses pemamhaman algoritma (klo gk tepar awkoakwo)
 * Hosting web (ini jga)
 * Maybe UI bsa di improve lgi
 */

/**
 * ELEMENT DOM NYA
 */
const tabs = document.querySelectorAll(".tabs button");
const algoInfo = document.querySelector(".algo-info");
const algoTitle = algoInfo.querySelector("h2");
const algoDesc = algoInfo.querySelector("p");

const runBtn = document.querySelector(".btn");
const resetBtn = document.querySelector(".btn.ghost");
const playBtn = document.querySelector(".btn.play");
const pauseBtn = document.querySelector(".btn.pause");

const visual = document.querySelector(".visual");
const explanationText = document.querySelector(".explanation p");

const stepperBtns = document.querySelectorAll(".stepper button");
const stepCounter = document.querySelector(".stepper span");

const sizeSelect = document.querySelector("select");
const layoutSelect = document.querySelectorAll("select")[1];
const arrayInput = document.querySelector('input[type="text"]');
const speedRange = document.getElementById("speedRange")
const speedLabel = document.getElementById("speedLabel")
/**
 * STATE
 */
let currentAlgorithm = "insertion";
let currentMode = "bar";
let steps = [];
let currentStep = 0;
let isAnimating = false;
let uid = 0;
let autoPlay = false;
let autotimer = null;
let speed = 300;

/**
 * DESKRIPSI ALGORITMA
 */
const algoMeta = {
  insertion: {
    title: "Insertion Sort",
    desc: "Menyisipkan elemen satu per satu ke posisi yang tepat di bagian kiri array."
  },
  shell: {
    title: "Shell Sort",
    desc: "Optimasi insertion sort dengan perbandingan elemen berjauhan (gap)."
  },
  heap: {
    title: "Heap Sort",
    desc: "Menggunakan struktur heap untuk memindahkan elemen terbesar ke akhir."
  }
};

/**
 * HANDLING ERROR USER GK BISA INPUT ANGKA KLO GK ADA KOMA
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function generateArray(size) {
  return Array.from({ length: size }, () => ({
    id: ++uid,
    value: Math.floor(Math.random() * 20) + 3
  }));
}

function parseArrayInput(text) {
  const values = text
    .split(",")
    .map(v => v.trim())
    .filter(v => v !== "")
    .map(Number);

  if (values.some(isNaN)) {
    alert("Input array harus angka, dipisahkan koma.");
    return null;
  }

  return values.map(v => ({
    id: ++uid,
    value: v
  }));
}

/**
 * RENDER DAN ANIMASI TAMPILAN BAR
 */
async function renderStep() {
  if (isAnimating) return;
  const step = steps[currentStep];
  if (!step) return;

  isAnimating = true;

  // Simpan posisi elemen sebelumnya (untuk FLIP animation)
  const prevPositions = new Map();
  [...visual.children].forEach(el => {
    if (el.dataset.id) {
      prevPositions.set(el.dataset.id, el.getBoundingClientRect());
    }
  });

  // Clear visual
  visual.innerHTML = "";

  // Render semua elemen berdasarkan step.array
  step.array.forEach(item => {
    const el = document.createElement("div");
    el.dataset.id = item.id;

    if (currentMode === "bar") {
      el.className = "bar";
      el.style.height = item.value * 8 + "px";
      el.textContent = item.value;
    } else {
      el.className = "array-box";
      el.textContent = item.value;
    }

    // Apply highlighting classes
    if (item.id === step.keyId) {
      el.classList.add("key");
    }
    if (step.compare?.includes(item.id)) {
      el.classList.add("compare");
    }
    if (step.sorted?.includes(item.id)) {
      el.classList.add("sorted");
    }

    visual.appendChild(el);
  });

  // FLIP Animation - Smooth slide transition
  [...visual.children].forEach(el => {
    const prevRect = prevPositions.get(el.dataset.id);
    if (!prevRect) return;

    const currentRect = el.getBoundingClientRect();
    const deltaX = prevRect.left - currentRect.left;

    if (deltaX !== 0) {
      // First: set initial position (where it was)
      el.style.transform = `translateX(${deltaX}px)`;
      el.style.transition = "none";
      
      // Force reflow
      el.getBoundingClientRect();
      
      // Last: animate to final position
      el.style.transition = "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)";
      el.style.transform = "translateX(0)";
    }
  });

  // Update explanation and counter
  explanationText.innerText = step.explanation;
  stepCounter.innerText = `${currentStep + 1} / ${steps.length}`;

  // Wait for animation to complete
  await sleep(speed);
  isAnimating = false;
}

/* =====================
   EVENT HANDLERS
===================== */

// Tab switching
tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    currentAlgorithm = tab.innerText.toLowerCase();
    algoTitle.innerText = algoMeta[currentAlgorithm].title;
    algoDesc.innerText = algoMeta[currentAlgorithm].desc;
    
    algoInfo.className = `algo-info ${currentAlgorithm}`;
  };
});

// Layout mode switching
layoutSelect.onchange = () => {
  currentMode = layoutSelect.value.toLowerCase();
  if (steps.length) renderStep();
};

// Disable size select when manual input is used
arrayInput.oninput = () => {
  sizeSelect.disabled = arrayInput.value.trim().length > 0;
};

// Run button
runBtn.onclick = () => {
  if (isAnimating) return;

  let arr;
  if (arrayInput.value.trim()) {
    arr = parseArrayInput(arrayInput.value);
    if (!arr) return;
  } else {
    arr = generateArray(parseInt(sizeSelect.value));
  }

  // Generate steps based on selected algorithm
  switch (currentAlgorithm) {
    case "insertion":
      steps = insertionSortSteps(arr);
      break;
    case "shell":
      steps = shellSortSteps(arr);
      break;
    case "heap":
      steps = heapSortSteps(arr);
      break;
    default:
      steps = insertionSortSteps(arr);
  }

  currentStep = 0;
  renderStep();
};

// Reset button
resetBtn.onclick = () => {
  steps = [];
  currentStep = 0;
  visual.innerHTML = "";
  arrayInput.value = "";
  sizeSelect.disabled = false;
  explanationText.innerText = "Array di-reset. Klik Run untuk mulai.";
  stepCounter.innerText = "0 / 0";
};

//auto-play button
playBtn.onclick = async () => {
  if (autoPlay || !steps.length) return;
  autoPlay = true;

  while (autoPlay && currentStep < steps.length - 1) {
    currentStep++;
    await renderStep();
    await sleep(speed);
  }

  autoPlay = false;
};

pauseBtn.onclick = () => {
  autoPlay = false;
};


// Stepper buttons
stepperBtns[0].onclick = () => {
  // First step
  if (currentStep !== 0) {
    currentStep = 0;
    renderStep();
  }
};

stepperBtns[1].onclick = () => {
  // Previous step
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
};

stepperBtns[2].onclick = () => {
  // Next step
  if (currentStep < steps.length - 1) {
    currentStep++;
    renderStep();
  }
};

stepperBtns[3].onclick = () => {
  // Last step
  if (currentStep !== steps.length - 1) {
    currentStep = steps.length - 1;
    renderStep();
  }
};

speedRange.oninput = () => {
  const rawValue = Number(speedRange.value);
  const min = 10;
  const max = 100;

  // Hitung persentase kecepatan (10% = lambat, 90% = cepat)
  const percent = Math.round(
    ((rawValue - min) / (max - min)) * 80 + 10
  );

  // Label kategori
  if (percent <= 35) {
    speedLabel.innerText = `Lambat (${percent}%)`;
  } else if (percent <= 65) {
    speedLabel.innerText = `Normal (${percent}%)`;
  } else {
    speedLabel.innerText = `Cepat (${percent}%)`;
  }

  // Konversi ke delay animasi (ms)
  // Semakin besar rawValue → semakin cepat → delay semakin kecil
  // rawValue = 50  → speed = 900ms (lambat)
  // rawValue = 800 → speed = 100ms (cepat)
  speed = 1000 - (percent * 9)
};


/**
 * ALGORITMA INSERTION SORT
 */
function insertionSortSteps(arr) {
  let a = arr.map(x => ({ ...x }));
  let s = [];

  s.push({
    array: [...a],
    explanation: "Array awal sebelum proses insertion sort dimulai. Pada tahap ini, elemen pertama dianggap sudah terurut."
  });

  for (let i = 1; i < a.length; i++) {
    let key = { ...a[i] };
    let j = i - 1;

    s.push({
      array: [...a],
      keyId: key.id,
      compare: [a[j]?.id],
      explanation: `Data pada indeks ke-${i} sedang diproses dalam pengurutan. Elemen berwarna kuning dengan nilai ${key.value} diambil sebagai key. Key ini akan digeser ke kiri hingga berada pada posisi yang benar.
                    `
    });

    while (j >= 0 && a[j].value > key.value) {
      let compareId = a[j].id;
      let compareValue = a[j].value;
      
      // Lakukan geser
      a[j + 1] = a[j];
      
      // Buat snapshot dengan key ditempatkan temporary di posisi baru
      let visualArray = [...a];
      visualArray[j] = key; // Key di posisi yang akan ditempati selanjutnya
      
      s.push({
        array: visualArray,
        keyId: key.id,
        compare: [compareId],
        explanation: `Key (${key.value}) dibandingkan dengan elemen di sebelah kirinya yang bernilai ${compareValue}. Karena elemen di kiri lebih besar, elemen tersebut digeser satu posisi ke kanan.`
      });
      
      j--;
    }

    a[j + 1] = key;

    s.push({
      array: [...a],
      keyId: key.id,
      sorted: a.slice(0, i + 1).map(x => x.id),
      explanation: `Key dengan nilai ${key.value} ditempatkan pada posisi yang sesuai. Key dengan nilai ${key.value} ditempatkan pada posisi yang sesuai.`
    });
  }

  s.push({
    array: [...a],
    sorted: a.map(x => x.id),
    explanation: "Seluruh elemen telah diproses. Array sekarang berada dalam kondisi terurut sepenuhnya."
  });

  return s;
}

/**
 * ALGORITMA SHELL SHORT
 */
function shellSortSteps(arr) {
  let a = arr.map(x => ({ ...x }));
  let s = [];
  let n = a.length;

  s.push({
    array: [...a],
    explanation: "Array awal - Shell Sort dengan gap sequence"
  });

  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    s.push({
      array: [...a],
      explanation: `Gap sekarang = ${gap}`
    });

    for (let i = gap; i < n; i++) {
      let temp = { ...a[i] };
      let j = i;

      s.push({
        array: [...a],
        keyId: temp.id,
        explanation: `Ambil key = ${temp.value} dengan gap ${gap}`
      });

      while (j >= gap && a[j - gap].value > temp.value) {
        s.push({
          array: [...a],
          keyId: temp.id,
          compare: [a[j - gap].id],
          explanation: `${a[j - gap].value} > ${temp.value}, geser`
        });

        a[j] = a[j - gap];
        j -= gap;
      }

      a[j] = temp;

      s.push({
        array: [...a],
        keyId: temp.id,
        explanation: `Key ${temp.value} ditempatkan`
      });
    }
  }

  s.push({
    array: [...a],
    sorted: a.map(x => x.id),
    explanation: "Shell Sort selesai!"
  });

  return s;
}

/* =====================
   HEAP SORT
===================== */
function heapSortSteps(arr) {
  let a = arr.map(x => ({ ...x }));
  let s = [];
  let n = a.length;

  s.push({
    array: [...a],
    explanation: "Array awal - membangun Max Heap"
  });

  // Build heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(a, n, i, s);
  }

  s.push({
    array: [...a],
    explanation: "Max Heap terbentuk"
  });

  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    s.push({
      array: [...a],
      compare: [a[0].id, a[i].id],
      explanation: `Tukar root ${a[0].value} dengan ${a[i].value}`
    });

    [a[0], a[i]] = [a[i], a[0]];

    s.push({
      array: [...a],
      sorted: a.slice(i).map(x => x.id),
      explanation: `${a[i].value} ditempatkan di posisi akhir`
    });

    heapify(a, i, 0, s);
  }

  s.push({
    array: [...a],
    sorted: a.map(x => x.id),
    explanation: "Heap Sort selesai!"
  });

  return s;
}

function heapify(a, n, i, s) {
  let largest = i;
  let left = 2 * i + 1;
  let right = 2 * i + 2;

  if (left < n && a[left].value > a[largest].value) {
    largest = left;
  }

  if (right < n && a[right].value > a[largest].value) {
    largest = right;
  }

  if (largest !== i) {
    s.push({
      array: [...a],
      compare: [a[i].id, a[largest].id],
      explanation: `Heapify: tukar ${a[i].value} dengan ${a[largest].value}`
    });

    [a[i], a[largest]] = [a[largest], a[i]];

    heapify(a, n, largest, s);
  }
}

/* =====================
   INITIAL SETUP
===================== */
// Set initial explanation
explanationText.innerText = "Pilih ukuran array dan klik Run untuk memulai visualisasi.";
stepCounter.innerText = "0 / 0";

// Clear demo bars from HTML
visual.innerHTML = "";