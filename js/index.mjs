import { getFirestore, enableIndexedDbPersistence, collection, addDoc, getDocs, doc, updateDoc, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js";
import { showLoading, hideLoading } from "./load/loadings.mjs";
import { getData } from "./utils/data.mjs";
import base from "./config/index.mjs";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
import { getTotalLançados, getTotalLançadosSuccess } from "./utils/index.mjs";
import { carregarDados } from "./load/load_datas.mjs";

// Definição no módulo principal

export const scanData = {
    totalforScan: 0,
    complete: 0,
    noComplete: 0
};

export const dataDownloadJson = {
    dataDownload: []
}


export const alterValues = () => {
    document.getElementById('totalForScan').innerText = scanData.totalforScan
    document.getElementById('totalScaned').innerText = scanData.complete
    document.getElementById('toalNotScaned').innerText = scanData.noComplete
    hideLoading()
}


// Initialize Firebase
const app = initializeApp(base);
const analytics = getAnalytics(app);
export var snapshotodd;

// Exporta a instância do Firebase para outros módulos
export { app };

export function loadLocalstorage() {
    snapshotodd = JSON.parse(localStorage.getItem('placas'))
}



const loading = document.getElementById('loading');


const action_salve_order = document.getElementById('order')
action_salve_order.addEventListener('input', (e) => {
    if (e.target.value.length >= 11) {
        save_or_upadted_order_ofiline('add')
    }
})


const database = getFirestore(app);


const sincronizardatas = async () => {
    showLoading()

    for (const document of snapshotodd) {
        // Se `document` já é um objeto com os dados, você pode acessar diretamente
        const data = document;  // Sem .data()

        const documentData = data[Object.keys(data)[0]];

        try {
            await save_or_updated_order(documentData);
        } catch (error) {
            console.error('Erro ao salvar ou atualizar pedido:', error);
        }
    }
    hideLoading()
};

const save_or_updated_order = async (json) => {
    const placa = json.placa.toUpperCase().trim();
    const order = json.order.trim();

    const db = getFirestore(app);
    const colecaoRef = collection(db, "scans");

    try {
        // Consulta com limite de 1 documento, se o order e placa forem únicos
        const q = query(colecaoRef, where("order", "==", order), where("placa", "==", placa));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const batch = writeBatch(db);

            snapshot.forEach((document) => {
                const data = document.data();

                const dadosAddFirebase = {
                    placa: data.placa,
                    order: order,
                    orderActually: data.orderActually,
                    totalNum: data.totalNum,
                    scande: true,
                    numpedido: data.numpedido,
                    unidade: data.unidade,
                    cidade: data.cidade,
                    remetente: data.remetente,
                    destinatario: data.destinatario,
                    nfe: data.nfe,
                    data_bipagem: getData(),
                    data_lancada: data.data_lancada
                };

                const documentRef = doc(db, "scans", document.id);
                batch.update(documentRef, dadosAddFirebase);
            });

            // Envie todas as atualizações de uma só vez
            await batch.commit();
            console.log("Documentos atualizados com sucesso!");
        } else {
            console.log("Nenhum documento encontrado.");
        }
    } catch (error) {
        console.error("Erro ao atualizar documentos: ", error);
    }
};




const save_or_upadted_order_ofiline = async (type) => {
    showLoading(); // Mostra o loading
    const placa = document.getElementById('placa').value.toUpperCase().trim();
    const order = document.getElementById('order').value.trim();
    let snapshotodd = JSON.parse(localStorage.getItem('placas'))

    try {
        scanData.totalforScan = 0;
        scanData.complete = 0;
        scanData.noComplete = 0;
        var no_exit = true
        var element_play_err = document.getElementById('error_son')
        var element_play_err_nota = document.getElementById('element_play_err_nota')
        var element_play_success = document.getElementById('success_son')
        var element_order = document.getElementById('ut')
        snapshotodd.forEach((document) => {

            // Se `document` já é um objeto com os dados, você pode acessar diretamente
            var data = document;  // Sem .data()
            let dayActually = getData()

            // Acessa o primeiro item do objeto, assumindo que o formato é como no JSON fornecido
            if (Object.keys(data)[0].trim() == order) {
                var documentData = data[Object.keys(data)[0]];

                // Condições baseadas nos dados
                if (documentData.scande && documentData.placa == placa) {
                    alertify.alert('Atenção', 'Volume já lido')
                    alertify.dismissAll();
                    alertify.error('Já escaneado!')
                    element_play_err_nota.play()
                    no_exit = false
                } else if (documentData.scande == false) {
                    element_play_success.play()
                    documentData.scande = true;
                    documentData.data_bipagem = getData();
                    console.log(documentData)
                    localStorage.setItem('placas', JSON.stringify(snapshotodd))
                    no_exit = false
                    alertify.dismissAll(); // remove alertas anteriores

                    alertify.success('Sucesso!')
                    element_order.innerText = `${order}`;
                }
            }
        });
        if (true) {
            scanData.complete += 1;
        } else {
            scanData.noComplete += 1;
        }
        if (no_exit) {
            alertify.dismissAll();
            alertify.alert('Atenção', 'Volume não encontrado.')
            alertify.error('Volume não encontrado.')
            document.getElementById('element_play_err_nota').play()
        }
        scanData.totalforScan += 1;
        alterValues();
        getTotalLançados();
    } catch (error) {
        console.error("Erro ao obter documentos ou atualizar: ", error);
    } finally {
        hideLoading(); // Garante que o loading seja escondido no final
        getTotalLançados(); // Executa a função ao final independentemente do sucesso ou erro
    }

    document.getElementById('order').value = '';
}




function displayError(message) {
    alertify.alert('Atenção', 'erro ao ler o csv, contato o suporte')
}



getTotalLançados()



carregarDados()

// Função para limpar o banco local (localStorage)
export function clearLocalDatabase() {
    localStorage.removeItem('placas');
    localStorage.removeItem('sincronizado');
    // Adicione aqui outras chaves que desejar limpar
}

// Função para limpar todos os documentos da coleção 'scans' no Firestore
export async function clearFirestoreDatabase() {
    const db = getFirestore(app);
    const colecaoRef = collection(db, "scans");
    try {
        const snapshot = await getDocs(colecaoRef);
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
            batch.delete(doc(db, "scans", docSnap.id));
        });
        await batch.commit();
        console.log("Todos os documentos da coleção 'scans' foram apagados!");
    } catch (error) {
        console.error("Erro ao apagar documentos do Firestore:", error);
        throw error;
    }
}

// No index.mjs - Adicione essas funções

// ========== MODAL DE EDIÇÃO ========== //
// ========== MODAL DE EDIÇÃO ========== //
// ========== MODAL DE EDIÇÃO ========== //
// ========== MODAL DE EDIÇÃO ========== //
function setupEditModal() {
    const editButton = document.getElementById('alterNf');
    const modal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const notesContainer = document.getElementById('notesContainer');
    const modalPlaca = document.getElementById('modalPlaca');

    let currentPlaca = '';
    let notesData = [];

    // Função para mostrar/ocultar loading
    const toggleLoading = (show) => {
        const loading = document.getElementById('loading');
        show ? loading.classList.remove('hidden') : loading.classList.add('hidden');
    };

    // Fechar modal
    const closeModalFunc = () => {
        modal.classList.add('hidden');
        notesContainer.innerHTML = '';
    };

    // Abrir modal
    editButton.addEventListener('click', async () => {
        currentPlaca = document.getElementById('placa').value.toUpperCase();
        if (!currentPlaca) {
            alertify.error('Por favor, insira uma placa primeiro');
            return;
        }

        modalPlaca.textContent = currentPlaca;
        await loadNotesForPlaca(currentPlaca);
        modal.classList.remove('hidden');
    });

    // Eventos para fechar
    closeModal.addEventListener('click', closeModalFunc);
    cancelEdit.addEventListener('click', closeModalFunc);

    // Carregar notas para a placa

    async function loadNotesForPlaca(placa) {
        toggleLoading(true);
        notesContainer.innerHTML = '';

        try {
            const localData = JSON.parse(localStorage.getItem('placas')) || [];
            notesData = localData.filter(item => {
                const key = Object.keys(item)[0];
                return item[key].placa === placa;
            });

            if (notesData.length === 0) {
                notesContainer.innerHTML = '<p class="text-gray-400">Nenhuma nota fiscal encontrada para esta placa.</p>';
                return;
            }

            // Agrupa por nfe (número da nota fiscal)
            const nfGroups = {};
            notesData.forEach(item => {
                const key = Object.keys(item)[0];
                const note = item[key];
                const nfe = note.nfe;

                if (!nfGroups[nfe]) {
                    nfGroups[nfe] = {
                        orderPrefix: note.order.slice(0, -4), // Pega tudo exceto os últimos 4 dígitos
                        volumes: []
                    };
                }
                nfGroups[nfe].volumes.push({
                    order: note.order,
                    data: note
                });
            });

            // Renderiza cada NF
            // Dentro da função loadNotesForPlaca, onde renderiza cada NF:
            Object.keys(nfGroups).sort().forEach(nfe => {
                const group = nfGroups[nfe];
                const volumes = group.volumes.sort((a, b) => a.order.localeCompare(b.order));

                const noteCard = document.createElement('div');
                noteCard.className = 'note-card mb-4 p-4 border border-gray-700 rounded-lg';
                noteCard.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <div>
                <h4 class="font-medium">NF: ${nfe || '--'}</h4>
                <p class="text-sm text-gray-400">Códigos: ${volumes.map(v => v.order).join(', ')}</p>
            </div>
            <div class="flex gap-2">
                <button class="delete-btn" data-nfe="${nfe}" data-prefix="${group.orderPrefix}">
                    <span class="material-symbols-outlined text-sm hover:text-red-500">delete</span>
                </button>
            </div>
        </div>
        <div class="flex items-center mb-3 gap-2">
            <span class="text-sm">Volumes:</span>
            <div class="flex items-center border border-gray-600 rounded">
                <button class="qty-minus px-2 py-1 bg-gray-700 hover:bg-gray-600" 
                        data-nfe="${nfe}">
                    -
                </button>
                <input type="number" id="qty-${nfe}" 
                       value="${volumes.length}" 
                       min="1" data-nfe="${nfe}" data-prefix="${group.orderPrefix}"
                       class="quantity-input w-12 text-center bg-gray-800 border-x border-gray-600">
                <button class="qty-plus px-2 py-1 bg-gray-700 hover:bg-gray-600" 
                        data-nfe="${nfe}">
                    +
                </button>
            </div>
            <button class="save-nf-btn ml-2 px-3 py-1 bg-primary-600 hover:bg-primary-700 rounded flex items-center gap-1" 
                    data-nfe="${nfe}" data-prefix="${group.orderPrefix}">
                <span class="material-symbols-outlined text-sm">save</span>
                Salvar
            </button>
        </div>
        <div class="text-xs text-gray-400">
            Último código: ${volumes[volumes.length - 1]?.order || '--'}
        </div>
    `;

                notesContainer.appendChild(noteCard);
            });

            // Adiciona eventos para os botões de + e -
            document.querySelectorAll('.qty-minus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const nfe = e.currentTarget.getAttribute('data-nfe');
                    const input = document.getElementById(`qty-${nfe}`);
                    if (parseInt(input.value) > 1) {
                        input.value = parseInt(input.value) - 1;
                    }
                });
            });

            document.querySelectorAll('.qty-plus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const nfe = e.currentTarget.getAttribute('data-nfe');
                    const input = document.getElementById(`qty-${nfe}`);
                    input.value = parseInt(input.value) + 1;
                });
            });



            // Eventos dos botões de deletar
            // Função para deletar notas (local e Firebase)
            async function deleteNF(nfe, prefix) {
                toggleLoading(true);
                try {
                    // 1. Remove do localStorage
                    const currentData = JSON.parse(localStorage.getItem('placas')) || [];
                    const updatedData = currentData.filter(item => {
                        const key = Object.keys(item)[0];
                        return !key.startsWith(prefix);
                    });

                    localStorage.setItem('placas', JSON.stringify(updatedData));

                    // 2. Tenta remover do Firebase (se estiver online)
                    try {
                        await deleteNFFromFirebase(prefix);
                    } catch (firebaseError) {
                        console.warn("Falha ao sincronizar com Firebase, salvando para tentar depois:", firebaseError);
                        addToSyncQueue('delete', { prefix });
                    }

                    // 3. Atualiza a exibição
                    await loadNotesForPlaca(currentPlaca);
                    getTotalLançados();
                    alertify.success(`NF ${nfe} e seus volumes foram excluídos!`);
                } catch (error) {
                    console.error("Erro ao excluir:", error);
                    alertify.error("Erro ao excluir NF");
                } finally {
                    toggleLoading(false);
                }
            }

            // Função para deletar do Firebase
            async function deleteNFFromFirebase(prefix) {
                try {
                    const db = getFirestore(app);
                    const colecaoRef = collection(db, "scans");

                    // Busca todos os documentos com esse prefixo
                    const q = query(colecaoRef, where("order", ">=", prefix), where("order", "<", prefix + "9999"));
                    const snapshot = await getDocs(q);

                    if (!snapshot.empty) {
                        const batch = writeBatch(db);
                        snapshot.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        await batch.commit();
                    }
                } catch (error) {
                    console.error("Erro ao deletar do Firebase:", error);
                    throw error; // Re-lança para ser tratado pela função chamadora
                }
            }

            // Fila de sincronização para operações offline
            function addToSyncQueue(action, data) {
                const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
                queue.push({ action, data, timestamp: new Date().getTime() });
                localStorage.setItem('syncQueue', JSON.stringify(queue));
            }

            // Processar fila de sincronização quando online
            async function processSyncQueue() {
                const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
                if (queue.length === 0) return;

                const successful = [];

                for (const [index, item] of queue.entries()) {
                    try {
                        switch (item.action) {
                            case 'delete':
                                await deleteNFFromFirebase(item.data.prefix);
                                successful.push(index);
                                break;
                            // Adicione outros casos conforme necessário
                        }
                    } catch (error) {
                        console.error(`Falha ao processar item ${index} da fila:`, error);
                    }
                }

                // Remove itens processados com sucesso
                if (successful.length > 0) {
                    const newQueue = queue.filter((_, index) => !successful.includes(index));
                    localStorage.setItem('syncQueue', JSON.stringify(newQueue));
                }
            }

            // Modifique o evento de clique do botão delete para usar a nova função
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const nfe = e.currentTarget.getAttribute('data-nfe');
                    const prefix = e.currentTarget.getAttribute('data-prefix');

                    alertify.confirm('Confirmar Exclusão',
                        `Tem certeza que deseja excluir TODOS os volumes da NF ${nfe}?`,
                        () => deleteNF(nfe, prefix),
                        () => alertify.message('Exclusão cancelada')
                    );
                });
            });

            // Verifique a fila de sincronização quando a conexão é restabelecida
            window.addEventListener('online', processSyncQueue);

            // Evento para salvar individualmente
            document.querySelectorAll('.save-nf-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const nfe = e.currentTarget.getAttribute('data-nfe');
                    const prefix = e.currentTarget.getAttribute('data-prefix');
                    const newQty = parseInt(document.getElementById(`qty-${nfe}`).value);

                    await updateNFVolumes(nfe, prefix, newQty);
                });
            });

            // ... (eventos de delete permanecem iguais)

        } catch (error) {
            console.error("Erro ao carregar notas:", error);
            alertify.error('Erro ao carregar notas fiscais');
        } finally {
            toggleLoading(false);
        }
    }

    async function sincronizarNFNoFirebase(prefix) {
        const db = getFirestore(app);
        const colecaoRef = collection(db, "scans");
        const localData = JSON.parse(localStorage.getItem('placas')) || [];

        const documentosParaSincronizar = localData.filter(item => {
            const key = Object.keys(item)[0];
            return key.startsWith(prefix);
        });

        if (documentosParaSincronizar.length === 0) {
            console.warn('Nada para sincronizar com prefixo:', prefix);
            return;
        }

        const batch = writeBatch(db);

        for (const item of documentosParaSincronizar) {
            const key = Object.keys(item)[0];
            const data = item[key];

            try {
                const q = query(colecaoRef, where("order", "==", data.order), where("placa", "==", data.placa));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    snapshot.forEach((docSnap) => {
                        const docRef = doc(db, "scans", docSnap.id);
                        batch.update(docRef, {
                            ...data,
                            data_bipagem: data.scande ? getData() : null
                        });
                    });
                } else {
                    await addDoc(colecaoRef, {
                        ...data,
                        data_bipagem: data.scande ? getData() : null
                    });
                }

            } catch (error) {
                console.error(`Erro ao sincronizar a ordem ${data.order}:`, error);
            }
        }

        try {
            await batch.commit();
            console.log(`Sincronização Firebase concluída para prefixo: ${prefix}`);
        } catch (error) {
            console.error("Erro ao enviar batch:", error);
        }
    }

    // Atualiza os volumes de uma NF específica
    async function updateNFVolumes(nfe, prefix, newQty) {
        toggleLoading(true);

        try {
            const currentData = JSON.parse(localStorage.getItem('placas')) || [];

            // 1. Filtra volumes existentes desta NF
            const existingVolumes = currentData.filter(item => {
                const key = Object.keys(item)[0];
                return key && key.startsWith(prefix);
            }).sort((a, b) => {
                const keyA = Object.keys(a)[0] || '';
                const keyB = Object.keys(b)[0] || '';
                return keyA.localeCompare(keyB);
            });

            if (existingVolumes.length === 0) {
                throw new Error(`NF ${nfe} não encontrada`);
            }

            const currentQty = existingVolumes.length;
            if (newQty === currentQty) {
                alertify.message('Nenhuma alteração necessária');
                return;
            }

            // 2. Prepara os dados atualizados
            const updatedData = currentData.filter(item => {
                const key = Object.keys(item)[0];
                return !key.startsWith(prefix);
            });

            // Mantém os volumes existentes (ou menos se diminuindo)
            const volumesToKeep = existingVolumes.slice(0, newQty);
            updatedData.push(...volumesToKeep);

            // Adiciona novos volumes se necessário
            let changesMade = 0;
            if (newQty > currentQty) {
                const lastVolume = existingVolumes[existingVolumes.length - 1];
                const lastKey = Object.keys(lastVolume)[0];
                const lastNumber = parseInt(lastKey.slice(-4)) || 0;

                for (let i = 0; i < (newQty - currentQty); i++) {
                    const newNumber = (lastNumber + i + 1).toString().padStart(4, '0');
                    const newOrder = `${prefix}${newNumber}`;

                    updatedData.push({
                        [newOrder]: {
                            ...lastVolume[lastKey],
                            order: newOrder,
                            nfe: nfe,
                            totalNum: 1, // Cada volume é um item individual
                            scande: false // Novo volume não escaneado
                        }
                    });
                    changesMade++;
                }
            }

            // 3. Atualiza o localStorage
            localStorage.setItem('placas', JSON.stringify(updatedData));

            if (changesMade > 0) {
                alertify.success(`${changesMade} volume(s) adicionado(s) à NF ${nfe}`);
            } else {
                alertify.success(`${currentQty - newQty} volume(s) removido(s) da NF ${nfe}`);
            }

            // Recarrega os dados
            await loadNotesForPlaca(currentPlaca);
            await sincronizarNFNoFirebase(prefix);

            getTotalLançados();

        } catch (error) {
            console.error("Erro ao atualizar volumes:", error);
            alertify.error("Erro: " + error.message);
        } finally {
            toggleLoading(false);
        }
    }
}

// Inicialize o modal quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setupEditModal();
});