
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

const firebaseConfig = {
  apiKey: "AIzaSyDozkS5Oe1uV85tiznKRzAE8b5Frz93ao4",
  authDomain: "horas-complementares-d84f8.firebaseapp.com",
  projectId: "horas-complementares-d84f8",
  storageBucket: "horas-complementares-d84f8.firebasestorage.app",
  messagingSenderId: "172075774197",
  appId: "1:172075774197:web:c1b2f6d72e3faad74995bc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let uuid = localStorage.getItem("uuid");

if (!uuid) {
    uuid = uuidv4();
    localStorage.setItem("uuid", uuid);
}

const regras = {
  Extensao: {
    "Projeto de extensão": { aproveitamento: 0.1, limite: 40 },
    "Atividades culturais": { aproveitamento: 0.8, limite: 5 },
    "Visitas Técnicas": { aproveitamento: 1.0, limite: 40 },
    "Visitas a Feiras e Exposições": { aproveitamento: 0.2, limite: 5 },
    "Cursos de Idiomas": { aproveitamento: 0.6, limite: 20 },
    "Palestras, Seminários e Congressos Extensionistas (ouvinte)": {
      aproveitamento: 0.8,
      limite: 10,
    },
    "Palestras, Seminários e Congressos Extensionistas (apresentador)": {
      aproveitamento: 1.0,
      limite: 15,
    },
    "Projeto Empresa Júnior": { aproveitamento: 0.2, limite: 20 },
  },
  Ensino: {
    "Estágio Extracurricular": { aproveitamento: 0.7, limite: 40 },
    "Monitoria": { aproveitamento: 0.7, limite: 40 },
    "Concursos e campeonatos de atividades acadêmicas": {
      aproveitamento: 0.7,
      limite: 50,
    },
    "Presença comprovada a defesas de TCC do curso de Engenharia de Computação":
      { aproveitamento: 0.5, limite: 3 },
    "Cursos Profissionalizantes Específicos na área": {
      aproveitamento: 0.8,
      limite: 40,
    },
    "Cursos Profissionalizantes em geral": { aproveitamento: 0.2, limite: 10 },
  },
  Pesquisa: {
    "Iniciação Científica": { aproveitamento: 0.8, limite: 40 },
    "Publicação de artigos em periódicos científicos": {
      aproveitamento: 1.0,
      limite: 10,
      excecao: true,
    },
    "Publicação de artigos completos em anais de congressos": {
      aproveitamento: 1.0,
      limite: 7,
      excecao: true,
    },
    "Publicação de capítulo de livro": {
      aproveitamento: 1.0,
      limite: 7,
      excecao: true,
    },
    "Publicação de resumos de artigos em anais": {
      aproveitamento: 1.0,
      limite: 5,
      excecao: true,
    },
    "Registro de patentes como autor/coautor": {
      aproveitamento: 1.0,
      limite: 40,
      excecao: true,
    },
    "Premiação resultante de pesquisa científica": {
      aproveitamento: 1.0,
      limite: 10,
      excecao: true,
    },
    "Colaborador em atividades como Seminários e Congressos": {
      aproveitamento: 1.0,
      limite: 10,
    },
    "Palestras, Seminários e Congressos de Pesquisa (ouvinte)": {
      aproveitamento: 0.8,
      limite: 10,
    },
    "Palestras, Seminários e Congressos de Pesquisa (apresentador)": {
      aproveitamento: 1.0,
      limite: 15,
    },
  },
};

const tipoSelect = document.getElementById("tipo");
const subtipoSelect = document.getElementById("subtipo");

tipoSelect.addEventListener("change", (e) => {
  const tipo = e.target.value;
  subtipoSelect.innerHTML = '<option value="">Selecione o subtipo</option>';

  if (regras[tipo]) {
    Object.keys(regras[tipo]).forEach((subtipo) => {
      const option = document.createElement("option");
      option.value = subtipo;
      option.textContent = subtipo;
      subtipoSelect.appendChild(option);
    });
  }
});

const registros = { Extensao: 0, Ensino: 0, Pesquisa: 0 };
const horasPorSubtipo = { Extensao: {}, Ensino: {}, Pesquisa: {} };

const calcularAproveitamento = (tipo, subtipo, horas) => {
  if (!regras[tipo][subtipo]) return 0;

  const { aproveitamento, limite, excecao } = regras[tipo][subtipo];
  let horasCalculadas = horas * aproveitamento;

  const horasSubtipoAtuais = horasPorSubtipo[tipo][subtipo] || 0;
  let horasDisponiveisSubtipo = Math.max(0, limite - horasSubtipoAtuais);

  if (!excecao) {
    if (horasCalculadas > limite) {
      horasCalculadas = limite;
    }
    if (horasCalculadas > horasDisponiveisSubtipo) {
      horasCalculadas = horasDisponiveisSubtipo;
    }
  }

  const horasCategoriaAtuais = registros[tipo];
  let horasDisponiveisCategoria = Math.max(0, 90 - horasCategoriaAtuais);

  if (horasCalculadas > horasDisponiveisCategoria) {
    horasCalculadas = horasDisponiveisCategoria;
  }

  if (horasCalculadas <= 0) {
    alert(
      `Não é possível adicionar mais horas para "${subtipo}". Todos os limites foram atingidos.`
    );
    return 0;
  }

  if (!excecao) {
    horasPorSubtipo[tipo][subtipo] = horasSubtipoAtuais + horasCalculadas;
  }
  registros[tipo] += horasCalculadas;

  return horasCalculadas;
};

window.adicionarAtividade = async () => {
  const tipo = tipoSelect.value;
  const subtipo = subtipoSelect.value;
  const descricao = document.getElementById("descricao").value;
  const horas = parseFloat(document.getElementById("horas").value);

  if (tipo && subtipo && descricao && horas) {
    const horasAproveitadas = calcularAproveitamento(tipo, subtipo, horas);

    if (horasAproveitadas > 0) {
      const atividadesCadastradas = document.getElementById("atividadesCadastradas");
      const novaAtividade = document.createElement("tr");
      novaAtividade.innerHTML = `
        <td>${tipo}</td>
        <td>${subtipo}</td>
        <td>${descricao}</td>
        <td>${horas}</td>
        <td>${horasAproveitadas}</td>
        <td><button disabled>Excluir</button></td>
      `;
      atividadesCadastradas.appendChild(novaAtividade);

      try {
        const novoDoc = await addDoc(collection(db, "atividades"), {
          uid: uuid,
          tipo: tipo,
          subtipo: subtipo,
          descricao: descricao,
          horas: horas,
          horasAproveitadas: horasAproveitadas
        });


        novaAtividade.innerHTML = `
          <td>${tipo}</td>
          <td>${subtipo}</td>
          <td>${descricao}</td>
          <td>${horas}</td>
          <td>${horasAproveitadas}</td>
          <td><button onclick="excluirAtividade('${novoDoc.id}')">Excluir</button></td>
        `;
        atividadesCadastradas.appendChild(novaAtividade);

      } catch (e) {
        console.error("Erro ao salvar atividade: ", e);
        alert("Erro ao salvar atividade. Verifique o console para mais detalhes.");
      }

      document.getElementById("descricao").value = "";
      document.getElementById("horas").value = "";
      tipoSelect.value = "";
      subtipoSelect.innerHTML = '<option value="">Selecione o subtipo</option>';
    } else {
      alert("Não é possível adicionar esta atividade, pois não há horas aproveitadas.");
    }
  } else {
    alert("Preencha todos os campos.");
  }
};

window.carregarAtividades = async () => {
  const atividadesCadastradas = document.getElementById("atividadesCadastradas");
  atividadesCadastradas.innerHTML = "";

  try {
    const atividadesQuery = query(collection(db, "atividades"), where("uid", "==", uuid));
    const atividadesSnapshot = await getDocs(atividadesQuery);

    atividadesSnapshot.forEach((doc) => {
      const atividade = doc.data();
      const novaAtividade = document.createElement("tr");
      novaAtividade.innerHTML = `
        <td>${atividade.tipo}</td>
        <td>${atividade.subtipo}</td>
        <td>${atividade.descricao}</td>
        <td>${atividade.horas}</td>
        <td>${atividade.horasAproveitadas}</td>
        <td><button onclick="excluirAtividade('${doc.id}')">Excluir</button></td>
      `;
      atividadesCadastradas.appendChild(novaAtividade);
    });
  } catch (e) {
    console.error("Erro ao carregar atividades: ", e);
    alert("Erro ao carregar atividades. Verifique o console para mais detalhes.");
  }
};

window.excluirAtividade = async (id) => {
  try {
    await deleteDoc(doc(db, "atividades", id));
    carregarAtividades(); 
  } catch (e) {
    console.error("Erro ao excluir atividade: ", e);
    alert("Erro ao excluir atividade. Verifique o console para mais detalhes.");
  }
};

window.addEventListener("DOMContentLoaded", () => {
  carregarAtividades(); 
});
