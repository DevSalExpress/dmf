import { getFirestore, enableIndexedDbPersistence, collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { showLoading, hideLoading } from "../load/loadings.mjs";
import { completarComZeros } from "../utils/index.mjs";
import { getData } from "../utils/data.mjs";
import { carregarDados } from "../load/load_datas.mjs";
import { app } from "../index.mjs"; // Importa a instância do Firebase
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

let notasData = []; // Armazena as notas da API

// Aguarda o DOM estar pronto antes de adicionar os eventos
document.addEventListener('DOMContentLoaded', () => {
    // Buscar notas da API
    const buscarBtn = document.getElementById("buscarNotasButton");
    if (buscarBtn) {
        buscarBtn.addEventListener("click", async () => {
            const placa = document.getElementById("placa_excel").value.trim().toUpperCase();
            
            if (!placa) {
                alertify.alert('Atenção', 'Por favor, informe a placa.');
                return;
            }

            await buscarNotasAPI();
        });
    }

    // Selecionar todas as notas
    const selectAllBtn = document.getElementById("selectAllNotas");
    if (selectAllBtn) {
        selectAllBtn.addEventListener("change", (e) => {
            const checkboxes = document.querySelectorAll('.nota-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });
    }

    // Salvar notas selecionadas
    const salvarBtn = document.getElementById("salvarNotasButton");
    if (salvarBtn) {
        salvarBtn.addEventListener("click", () => {
            const checkboxes = document.querySelectorAll('.nota-checkbox:checked');
            
            if (checkboxes.length === 0) {
                alertify.alert('Atenção', 'Selecione pelo menos uma nota.');
                return;
            }

            const notasSelecionadas = Array.from(checkboxes).map(cb => {
                const index = cb.dataset.index;
                return notasData[index];
            });

            processarNotasSelecionadas(notasSelecionadas);
        });
    }
});

async function buscarNotasAPI() {
    showLoading();
    
    try {
        const response = await fetch("https://app.salexpress.org/xml_plataform/api.php?item=anexos_dmf&directory=arquivos_api/anexos_dmf");
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        notasData = await response.json();
        
        if (notasData && notasData.length > 0) {
            exibirNotas(notasData);
        } else {
            alertify.alert('Atenção', 'Nenhuma nota encontrada na API.');
        }
    } catch (error) {
        console.error("Erro ao buscar notas da API:", error);
        alertify.alert('Erro', 'Erro ao buscar notas: ' + error.message);
    } finally {
        hideLoading();
    }
}

function exibirNotas(notas) {
    const notasList = document.getElementById("notasList");
    const notasContainer = document.getElementById("notasContainer");
    const uploadButton = document.getElementById("uploadNotasButton");
    
    notasList.innerHTML = '';
    
    notas.forEach((nota, index) => {
        const notaDiv = document.createElement('div');
        notaDiv.style.cssText = `
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
        `;
        
        notaDiv.innerHTML = `
            <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
                <input type="checkbox" class="nota-checkbox" data-index="${index}" 
                       style="width: 18px; height: 18px; margin-top: 3px; flex-shrink: 0;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 16px; color: #1f2937; margin-bottom: 5px;">
                        NFe: ${nota.nf_num}
                    </div>
                    <div style="font-size: 14px; color: #4b5563; line-height: 1.5;">
                        <div><strong>Volumes:</strong> ${nota.Volumes_Total}</div>
                        <div><strong>Destinatário:</strong> ${nota.destinatario_nome}</div>
                        <div><strong>Cidade:</strong> ${nota.cidade}</div>
                        <div><strong>Endereço:</strong> ${nota.endereco}, ${nota.numero}</div>
                        <div><strong>Remetente:</strong> ${nota.remetente}</div>
                        <div><strong>Data:</strong> ${nota.Data}</div>
                    </div>
                </div>
            </label>
        `;
        
        notasList.appendChild(notaDiv);
    });
    
    notasContainer.style.display = 'block';
    uploadButton.style.display = 'block';
    document.getElementById("selectAllNotas").checked = false;
}

async function processarNotasSelecionadas(notasSelecionadas) {
    const placa = document.getElementById("placa_excel").value.trim().toUpperCase();
    
    if (!placa) {
        alertify.alert('Atenção', 'Por favor, informe a placa.');
        return;
    }

    showLoading();

    const db = getFirestore(app);
    const colecaoRef = collection(db, "scans");
    const batch = writeBatch(db);
    
    try {
        // Busca dados existentes no Firebase para a placa
        const q = query(colecaoRef, where("placa", "==", placa));
        const querySnapshot = await getDocs(q);
        const existingFirebaseItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Busca dados do LocalStorage para a placa
        const existingLocalItems = JSON.parse(localStorage.getItem('placas')) || [];
        const localItemsForPlaca = existingLocalItems.filter(item => {
            const itemData = Object.values(item)[0];
            return itemData.placa === placa;
        });

        const newItems = [];
        let totalVolumes = 0;

        // Processa cada nota selecionada
        for (const nota of notasSelecionadas) {
            const nfeBase = nota.nf_num.padStart(8, '0'); // Garante 8 dígitos
            const volumes = parseInt(nota.Volumes_Total);
            
            // Cria um registro para cada volume
            for (let i = 1; i <= volumes; i++) {
                const volumeStr = i.toString().padStart(3, '0'); // 3 dígitos
                const order = nfeBase + volumeStr; // Ex: 00149560001, 00149560002, etc
                
                totalVolumes++;

                // Verifica se já existe
                const existsInFirebase = existingFirebaseItems.some(item => 
                    item.order === order
                );
                
                const existsInLocal = localItemsForPlaca.some(item => 
                    Object.keys(item)[0] === order
                );

                // Só adiciona se não existir
                if (!existsInFirebase && !existsInLocal) {
                    const docRef = doc(colecaoRef);
                    const dadosAddFirebase = {
                        id_firebase: docRef.id,
                        placa: placa,
                        order: order,
                        orderActually: completarComZeros(i.toString()),
                        totalNum: completarComZeros(volumes.toString()),
                        scande: false,
                        numpedido: nota.dadosAdicionais || '',
                        unidade: volumes,
                        cidade: nota.cidade,
                        remetente: nota.remetente,
                        destinatario: nota.destinatario_nome,
                        nfe: nota.nf_num,
                        chaveNFE: nota.chaveNFE,
                        endereco: `${nota.endereco}, ${nota.numero}`,
                        data_lancada: getData()
                    };

                    newItems.push({ [order]: dadosAddFirebase });
                    batch.set(docRef, dadosAddFirebase);
                }
            }
        }

        // Salva no Firebase
        await batch.commit();
        
        // Atualiza LocalStorage
        const otherPlacaItems = existingLocalItems.filter(item => {
            const itemData = Object.values(item)[0];
            return itemData.placa !== placa;
        });

        localStorage.setItem('placas', JSON.stringify([
            ...otherPlacaItems,
            ...localItemsForPlaca,
            ...newItems
        ]));
        
        carregarDados();
        alertify.alert('Sucesso', `${newItems.length} volumes adicionados com sucesso! Total: ${totalVolumes} volumes de ${notasSelecionadas.length} notas.`);
        
        // Limpa a interface
        document.getElementById("notasContainer").style.display = 'none';
        document.getElementById("uploadNotasButton").style.display = 'none';
        document.getElementById("placa_excel").value = '';
        
    } catch (error) {
        console.error("Erro ao salvar no Firebase:", error);
        alertify.alert('Erro', 'Ocorreu um erro ao processar os dados: ' + error.message);
    } finally {
        hideLoading();
    }
}

export async function updateResultsInBatch() {
    const db = getFirestore(app);
    const batch = writeBatch(db); // Cria uma nova instância de batch
    const arr_local = JSON.parse(localStorage.getItem('placas')); // Recupera os dados do localStorage

    if (!arr_local) {
        console.log("Nenhum dado encontrado no localStorage.");
        return;
    }

    const dataAtual = getData(); // Função que retorna a data atual

    // Filtra os itens onde `data_lancada` é a data atual e `scande` é true
    const itemsToUpdate = arr_local.filter(item => {
        const orderKey = Object.keys(item)[0]; // Obtém a chave do objeto
        const orderData = item[orderKey]; // Obtém os dados associados à chave
        return orderData.scande === true;
    });

    if (itemsToUpdate.length === 0) {
        console.log("Nenhum item para atualizar.");
        return;
    }

    showLoading(); // Exibe o loading durante a atualização

    try {
        // Itera sobre os itens filtrados e atualiza em lote
        for (const item of itemsToUpdate) {
            const orderKey = Object.keys(item)[0];
            const orderData = item[orderKey];
            const idFirebase = orderData.id_firebase; // Obtém o id_firebase

            const docRef = doc(db, "scans", idFirebase); // Cria a referência ao documento no Firestore
            batch.update(docRef, { scande: true }); // Adiciona a atualização ao batch
        }

        await batch.commit(); // Executa todas as operações de atualização em lote
        console.log("Todos os documentos foram atualizados com sucesso!");
        alertify.alert('Atenção', 'Atualizado com sucesso!');
    } catch (error) {
        console.error("Erro ao atualizar documentos em lote: ", error);
    } finally {
        hideLoading(); // Esconde o loading após finalizar
    }

    return true
}