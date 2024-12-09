console.log("Arquivo JS carregado corretamente.");

// Importações Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD6r5fM-PsHVVH8R7iwctunWBnB_DFq9eY",
    authDomain: "infotec-imib.firebaseapp.com",
    projectId: "infotec-imib",
    storageBucket: "infotec-imib.firebasestorage.app",
    messagingSenderId: "736520152636",
    appId: "1:736520152636:web:6a71dbacf68124353d0539"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Seleção de elementos DOM
const btnAuth = document.getElementById("btn-auth");
const btnLogin = document.getElementById("btn-login");
const btnProfile = document.getElementById("btn-profile");
const profileMenu = document.getElementById("profile-menu");
const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authAction = document.getElementById("auth-action");
const toggleLink = document.getElementById("toggle-link");
const extraFields = document.getElementById("extra-fields");
const authName = document.getElementById("auth-name");
const authAge = document.getElementById("auth-age");
const authGender = document.getElementById("auth-gender");

// Variáveis globais
let isLoginMode = true;

// Função para alternar entre login e cadastro
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? "Login" : "Cadastro";
    authAction.textContent = isLoginMode ? "Entrar" : "Cadastrar";
    extraFields.classList.toggle("hidden", isLoginMode);
}

// Função para autenticação de usuário
async function handleAuthSubmission(e) {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;

    try {
        if (isLoginMode) {
            // Login
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login realizado com sucesso!");
        } else {
            // Cadastro
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;

            // Salvando dados adicionais no Firestore
            const name = authName.value.trim();
            const age = authAge.value ? parseInt(authAge.value, 10) : null;
            const gender = authGender.value;

            await setDoc(doc(db, "users", userId), {
                name,
                age,
                gender,
                email
            });

            alert("Cadastro realizado com sucesso!");
        }
        window.location.href = "index.html"; // Redireciona para a página inicial
    } catch (error) {
        alert("Erro: " + error.message);
    }
}

// Função para verificar o estado de autenticação
function checkAuthState(user) {
    if (user) {
        // Exibe o menu de perfil e esconde o botão de login
        btnLogin.classList.add("hidden");
        btnProfile.classList.remove("hidden");

        // Exibe as informações do usuário
        userName.textContent = user.displayName || "Usuário";
        userEmail.textContent = user.email;
    } else {
        // Se não estiver logado, exibe o botão de login
        btnLogin.classList.remove("hidden");
        btnProfile.classList.add("hidden");
    }
}

// Função para logout
async function handleLogout() {
    try {
        await signOut(auth);
        alert("Você foi desconectado.");
        window.location.reload(); // Recarrega a página após o logout
    } catch (error) {
        alert("Erro ao sair: " + error.message);
    }
}

// Função para carregar os cursos do Firestore
async function carregarCursos() {
    const cursosContainer = document.querySelector(".main-content .content-frame");
    try {
        const querySnapshot = await getDocs(collection(db, "cursos"));
        querySnapshot.forEach((doc) => {
            const curso = doc.data();

            // Verificar se os dados obrigatórios existem
            if (!curso.nome || !curso.imagem || !curso.link) {
                console.error("Dados incompletos para o curso:", doc.id);
                return;
            }

            // Criar o cartão de curso
            const cursoCard = `
                <div class="course-card">
                    <img src="${curso.imagem}" alt="${curso.nome}">
                    <h4>${curso.nome}</h4>
                    <p>${curso.n_aulas || "N/A"} aulas - Categoria: ${curso.categoria || "N/A"}</p>
                    <a href="${curso.link}" class="btn-comprar">Começar Agora</a>
                </div>`;

            // Adicionar o cartão ao container
            cursosContainer.insertAdjacentHTML("beforeend", cursoCard);
        });
    } catch (error) {
        console.error("Erro ao carregar cursos:", error);
    }
}

// Função para carregar o curso detalhado
async function carregarCursoDetalhado() {
    const cursoId = new URLSearchParams(window.location.search).get("id");
    if (!cursoId) {
        alert("Curso não encontrado!");
        return;
    }

    try {
        const cursoRef = doc(db, "cursos", cursoId);
        const cursoSnap = await getDoc(cursoRef);

        if (cursoSnap.exists()) {
            const curso = cursoSnap.data();
            document.querySelector("h1").textContent = curso.nome;
            const sidebar = document.querySelector("#aulas-list");
            const videoContainer = document.querySelector("#video-player");

            curso.aulas.forEach((aula, index) => {
                const aulaId = index + 1;
                const aulaItem = document.createElement("li");
                const aulaLink = document.createElement("a");
                aulaLink.href = "#";
                aulaLink.textContent = aula.titulo;
                aulaLink.onclick = () => playVideo(aulaId);
                aulaItem.appendChild(aulaLink);

                sidebar.appendChild(aulaItem);
            });

            videoContainer.src = curso.aulas[0].video; // Define o primeiro vídeo como padrão
        } else {
            alert("Curso não encontrado no banco de dados.");
        }
    } catch (error) {
        console.error("Erro ao carregar curso:", error);
    }
}

// Função para trocar o vídeo do curso
function playVideo(aulaId) {
    const iframe = document.getElementById("video-player");
    iframe.src = videos[aulaId - 1]; // Atualiza o vídeo baseado no índice
}

// Função para navegar entre os vídeos
function changeVideo(direction) {
    const newVideo = currentVideo + direction;
    if (videos[newVideo - 1]) {
        playVideo(newVideo);
    }
}

// Eventos
toggleLink.addEventListener("click", toggleAuthMode);
authForm.addEventListener("submit", handleAuthSubmission);
logoutBtn.addEventListener("click", handleLogout);

// Verifica a autenticação ao carregar a página
onAuthStateChanged(auth, checkAuthState);

// Carregar os cursos ao carregar a página principal
carregarCursos();



let lastScrollPosition = 0;
const menu = document.querySelector('header.menu');

window.addEventListener('scroll', () => {
  const currentScrollPosition = window.pageYOffset;

  if (currentScrollPosition > lastScrollPosition) {
    // Usuário está rolando para baixo
    menu.classList.add('hidden');
  } else {
    // Usuário está rolando para cima
    menu.classList.remove('hidden');
  }

  lastScrollPosition = currentScrollPosition;
});
