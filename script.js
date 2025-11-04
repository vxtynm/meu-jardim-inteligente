// ===============================
// IDENTIFICADOR DE PLANTAS - 2025
// ===============================

// ⚙️ Configuração opcional da API do Plant.id
const API_KEY = ""; // Se tiver uma API Key, coloque aqui

// 🔍 Captura dos elementos da página
const inputPhoto = document.getElementById("photoInput");
const identifyBtn = document.getElementById("identifyBtn");
const resultDiv = document.getElementById("identifyResult");

// Verifica se todos os elementos existem
if (!inputPhoto || !identifyBtn || !resultDiv) {
  console.error("❌ Elementos HTML ausentes. Verifique os IDs: photoInput, identifyBtn, identifyResult.");
}

// ===============================
// FUNÇÃO PRINCIPAL
// ===============================
async function identifyPlant() {
  const file = inputPhoto.files[0];

  if (!file) {
    resultDiv.innerHTML = `<p style="color:red;">Selecione uma imagem primeiro.</p>`;
    return;
  }

  // Mostra carregando
  resultDiv.innerHTML = `<p>🔎 Identificando planta... Aguarde...</p>`;

  try {
    let plantName = "";

    // ===============================
    // 1️⃣ Tenta simulação local (nome do arquivo)
    // ===============================
    const fileName = file.name.toLowerCase();
    if (fileName.includes("girassol")) plantName = "Girassol (Helianthus annuus)";
    else if (fileName.includes("suculenta")) plantName = "Suculenta (Crassulaceae)";
    else if (fileName.includes("rosa")) plantName = "Rosa (Rosa spp.)";
    else if (fileName.includes("orquidea")) plantName = "Orquídea (Orchidaceae)";
    else if (fileName.includes("samambaia")) plantName = "Samambaia (Pteridophyta)";
    else if (fileName.includes("cacto")) plantName = "Cacto (Cactaceae)";
    else if (fileName.includes("lirio")) plantName = "Lírio (Lilium)";
    else plantName = "";

    // ===============================
    // 2️⃣ Se tiver API configurada, tenta usar Plant.id
    // ===============================
    if (!plantName && API_KEY) {
      const base64 = await toBase64(file);
      const response = await fetch("https://api.plant.id/v2/identify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": API_KEY,
        },
        body: JSON.stringify({
          images: [base64],
          similar_images: true,
        }),
      });

      const data = await response.json();
      if (data && data.suggestions && data.suggestions.length > 0) {
        plantName = data.suggestions[0].plant_name;
      }
    }

    // ===============================
    // 3️⃣ Busca informações na Wikipedia
    // ===============================
    if (!plantName) plantName = "Planta não identificada com precisão";
    const wikiInfo = await searchWikipedia(plantName);

    // ===============================
    // 🪴 Exibe o resultado
    // ===============================
    resultDiv.innerHTML = `
      <h3>🌿 Resultado:</h3>
      <p><strong>${plantName}</strong></p>
      <p>${wikiInfo}</p>
    `;
  } catch (error) {
    console.error("Erro ao identificar a planta:", error);
    resultDiv.innerHTML = `<p style="color:red;">Ocorreu um erro ao identificar a planta. Tente novamente.</p>`;
  }
}

// ===============================
// FUNÇÕES AUXILIARES
// ===============================

// Converte imagem em base64 (necessário para API)
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
  });
}

// Busca na Wikipedia
async function searchWikipedia(query) {
  try {
    const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.extract) {
      return data.extract;
    } else {
      return "Nenhuma informação encontrada na Wikipédia.";
    }
  } catch {
    return "Não foi possível acessar a Wikipédia.";
  }
}

// ===============================
// EVENTO DO BOTÃO
// ===============================
identifyBtn?.addEventListener("click", identifyPlant);
