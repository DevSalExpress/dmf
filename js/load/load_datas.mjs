import { showLoading, hideLoading } from "./loadings.mjs";
import { loadLocalstorage } from "../index.mjs";
import { getFirestore, enableIndexedDbPersistence, collection, addDoc, getDocs, doc, updateDoc, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getData } from "../utils/data.mjs";

import base from "../config/index.mjs";
import { updateResultsInBatch } from "../salve/indexfile.mjs";
import { getTotalLançados } from "../utils/index.mjs";
const app = initializeApp(base);
const db = getFirestore(app);
const colecaoRef = collection(db, "scans");

export async function carregarDados() {
    const db = getFirestore(app);
    const colecaoRef = collection(db, "scans");

    try {
        showLoading(); // Exibe o loading

        // Recupera os dados salvos localmente
        const arr_local = JSON.parse(localStorage.getItem('placas')) || [];

        // Busca todos os documentos do Firebase
        const querySnapshot = await getDocs(colecaoRef);

        // Cria um Set com os pedidos existentes no Firebase
        const firebaseOrders = new Set();
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.order) firebaseOrders.add(data.order);
        });

        // Filtra o localStorage para manter apenas os pedidos existentes no Firebase
        const arr_local_filtrado = arr_local.filter(item => {
            const orderKey = Object.keys(item)[0];
            return firebaseOrders.has(orderKey);
        });

        // Cria um mapa dos dados locais para facilitar a sincronização
        const localStorageMap = arr_local_filtrado.reduce((map, item) => {
            const orderKey = Object.keys(item)[0];
            map[orderKey] = item[orderKey];
            return map;
        }, {});

        // Atualiza ou adiciona os dados conforme o Firebase
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const order = data.order;
            if (!order) return;

            if (localStorageMap[order]) {
                // Atualiza se o Firestore tiver o campo `scande` como `true` e o local ainda for `false`
                if (data.scande === true && localStorageMap[order].scande === false) {
                    localStorageMap[order] = data;
                }
            } else {
                // Adiciona novos pedidos
                localStorageMap[order] = data;
            }
        });

        // Converte novamente para array e salva no localStorage
        const placasFinal = Object.entries(localStorageMap).map(([order, data]) => ({
            [order]: data
        }));
        localStorage.setItem('placas', JSON.stringify(placasFinal));

        // Funções adicionais (presumo que sejam definidas em outro lugar)
        await updateResultsInBatch();
        console.log("Sincronização concluída com sucesso!");
        await getTotalLançados();
    } catch (error) {
        console.error("Erro ao carregar dados do Firestore:", error);
    } finally {
        hideLoading(); // Oculta o loading ao final
    }
}
async function verificarConexao() {

}

document.getElementById('sincronizar').addEventListener('click', async () => {
    try {
        const response = await fetch("https://www.google.com/favicon.ico", {
            method: "HEAD",
            mode: "no-cors",
        });
        let storedPlacas = JSON.parse(localStorage.getItem('placas')) || [];
        localStorage.setItem('sincronizado', 'true');
    
        await carregarDados();
        return true; // Se não deu erro, consideramos online
    } catch (err) {
        alertify.alert('Sem conexão com a internet. Conecte-se e tente novamente.');

        return false;
    }

});

document.getElementById('sync').addEventListener('click', async () => {
    try {
        const response = await fetch("https://www.google.com/favicon.ico", {
            method: "HEAD",
            mode: "no-cors",
        });
        let storedPlacas = JSON.parse(localStorage.getItem('placas')) || [];
        localStorage.setItem('sincronizado', 'true');
    
        await carregarDados();
        return true; // Se não deu erro, consideramos online
    } catch (err) {
        alertify.alert('Sem conexão com a internet. Conecte-se e tente novamente.');

        return false;
    }
});