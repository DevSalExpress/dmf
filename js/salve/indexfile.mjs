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
            const checkboxes = document.querySelectorAll('.nota-checkbox:not(.hidden)');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });
    }

    // Campo de pesquisa
    const searchInput = document.getElementById("searchNotas");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const gruposData = document.querySelectorAll('.grupo-data');
            
            gruposData.forEach(grupo => {
                const notasIndividuais = grupo.querySelectorAll('.nota-individual');
                let grupoTemNotaVisivel = false;
                
                notasIndividuais.forEach(notaDiv => {
                    const text = notaDiv.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        notaDiv.style.display = 'block';
                        notaDiv.classList.remove('hidden');
                        grupoTemNotaVisivel = true;
                    } else {
                        notaDiv.style.display = 'none';
                        notaDiv.classList.add('hidden');
                    }
                });
                
                // Mostra/oculta o grupo inteiro se não tem notas visíveis
                if (grupoTemNotaVisivel) {
                    grupo.style.display = 'block';
                    // Se está pesquisando, expande automaticamente o grupo
                    if (searchTerm) {
                        const notasContainer = grupo.querySelector('.notas-da-data');
                        const icone = grupo.querySelector('.icone-expandir');
                        const header = grupo.querySelector('.data-header');
                        notasContainer.style.display = 'block';
                        icone.style.transform = 'rotate(180deg)';
                        header.style.background = 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)';
                    }
                } else {
                    grupo.style.display = 'none';
                }
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
            // Ordena as notas por data - do mais novo para o mais velho
            notasData.sort((a, b) => {
                // Converte data de "DD/MM/YYYY" para objeto Date
                const parseData = (dataStr) => {
                    const [dia, mes, ano] = dataStr.split('/');
                    return new Date(ano, mes - 1, dia);
                };
                
                const dataA = parseData(a.Data);
                const dataB = parseData(b.Data);
                
                // Ordem decrescente (mais novo primeiro)
                return dataB - dataA;
            });
            
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
    const searchInput = document.getElementById("searchNotas");
    
    notasList.innerHTML = '';
    
    // Limpa o campo de pesquisa
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Agrupa notas por data
    const notasPorData = {};
    notas.forEach((nota, index) => {
        const data = nota.Data;
        if (!notasPorData[data]) {
            notasPorData[data] = [];
        }
        notasPorData[data].push({ nota, index });
    });
    
    // Ordena as datas (mais recente primeiro)
    const datasOrdenadas = Object.keys(notasPorData).sort((a, b) => {
        const parseData = (dataStr) => {
            const [dia, mes, ano] = dataStr.split('/');
            return new Date(ano, mes - 1, dia);
        };
        return parseData(b) - parseData(a);
    });
    
    // Cria os grupos de data
    datasOrdenadas.forEach(data => {
        const notasDaData = notasPorData[data];
        const quantidadeNotas = notasDaData.length;
        
        // Container do grupo de data
        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'nota-item grupo-data';
        grupoDiv.style.cssText = `
            margin-bottom: 15px;
        `;
        
        // Cabeçalho clicável da data
        const headerDiv = document.createElement('div');
        headerDiv.className = 'data-header';
        headerDiv.style.cssText = `
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            border-radius: 8px;
            padding: 12px 16px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
        headerDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="material-symbols-outlined" style="font-size: 24px;">calendar_today</span>
                <div>
                    <div style="font-weight: bold; font-size: 16px;">${data}</div>
                    <div style="font-size: 12px; opacity: 0.9;">${quantidadeNotas} nota${quantidadeNotas > 1 ? 's' : ''}</div>
                </div>
            </div>
            <span class="material-symbols-outlined icone-expandir" style="font-size: 24px; transition: transform 0.3s;">expand_more</span>
        `;
        
        // Container das notas (inicialmente oculto)
        const notasContainerDiv = document.createElement('div');
        notasContainerDiv.className = 'notas-da-data';
        notasContainerDiv.style.cssText = `
            display: none;
            margin-top: 10px;
            padding-left: 10px;
        `;
        
        // Botão de selecionar todas da data
        const btnSelecionarTodas = document.createElement('button');
        btnSelecionarTodas.className = 'btn-selecionar-data';
        btnSelecionarTodas.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 16px;">done_all</span>
            <span>Selecionar todas desta data</span>
        `;
        btnSelecionarTodas.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 10px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
            width: fit-content;
        `;
        
        // Hover effect
        btnSelecionarTodas.addEventListener('mouseenter', () => {
            btnSelecionarTodas.style.background = 'linear-gradient(135deg, #047857 0%, #059669 100%)';
            btnSelecionarTodas.style.transform = 'translateY(-1px)';
        });
        
        btnSelecionarTodas.addEventListener('mouseleave', () => {
            btnSelecionarTodas.style.background = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
            btnSelecionarTodas.style.transform = 'translateY(0)';
        });
        
        // Adiciona a funcionalidade de selecionar/desselecionar
        btnSelecionarTodas.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que o clique no botão expanda/recolha o grupo
            const checkboxes = notasContainerDiv.querySelectorAll('.nota-checkbox');
            const checkboxesVisiveis = Array.from(checkboxes).filter(cb => 
                cb.closest('.nota-individual').style.display !== 'none'
            );
            
            const todosMarcados = checkboxesVisiveis.every(cb => cb.checked);
            
            checkboxesVisiveis.forEach(checkbox => {
                checkbox.checked = !todosMarcados;
            });
            
            // Atualiza o visual do botão
            atualizarBotaoSelecionar();
        });
        
        // Função para atualizar o visual do botão
        const atualizarBotaoSelecionar = () => {
            const checkboxes = notasContainerDiv.querySelectorAll('.nota-checkbox');
            const checkboxesVisiveis = Array.from(checkboxes).filter(cb => 
                cb.closest('.nota-individual').style.display !== 'none'
            );
            const todosMarcados = checkboxesVisiveis.length > 0 && checkboxesVisiveis.every(cb => cb.checked);
            
            if (todosMarcados) {
                btnSelecionarTodas.innerHTML = `
                    <span class="material-symbols-outlined" style="font-size: 16px;">remove_done</span>
                    <span>Desmarcar todas</span>
                `;
                btnSelecionarTodas.style.background = 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
            } else {
                btnSelecionarTodas.innerHTML = `
                    <span class="material-symbols-outlined" style="font-size: 16px;">done_all</span>
                    <span>Selecionar todas desta data</span>
                `;
                btnSelecionarTodas.style.background = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
            }
        };
        
        // Monitora mudanças nos checkboxes para atualizar o botão
        notasContainerDiv.addEventListener('change', (e) => {
            if (e.target.classList.contains('nota-checkbox')) {
                atualizarBotaoSelecionar();
            }
        });
        
        notasContainerDiv.appendChild(btnSelecionarTodas);
        
        // Adiciona as notas dentro do grupo
        notasDaData.forEach(({ nota, index }) => {
            const notaDiv = document.createElement('div');
            notaDiv.className = 'nota-individual';
            notaDiv.style.cssText = `
                background: #1e293b;
                border: 1px solid #475569;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 10px;
            `;
            
            notaDiv.innerHTML = `
                <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
                    <input type="checkbox" class="nota-checkbox" data-index="${index}" 
                           style="width: 18px; height: 18px; margin-top: 3px; flex-shrink: 0;">
                    <div style="flex: 1; color: #e2e8f0;">
                        <div style="font-weight: bold; font-size: 16px; color: #60a5fa; margin-bottom: 5px;">
                            NFe: ${nota.nf_num}
                        </div>
                        <div style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
                            <div><strong>Volumes:</strong> ${nota.Volumes_Total}</div>
                            <div><strong>Destinatário:</strong> ${nota.destinatario_nome}</div>
                            <div><strong>Cidade:</strong> ${nota.cidade}</div>
                            <div><strong>Endereço:</strong> ${nota.endereco}, ${nota.numero}</div>
                            <div><strong>Remetente:</strong> ${nota.remetente}</div>
                        </div>
                    </div>
                </label>
            `;
            
            notasContainerDiv.appendChild(notaDiv);
        });
        
        // Evento de clique para expandir/recolher
        headerDiv.addEventListener('click', () => {
            const isVisible = notasContainerDiv.style.display !== 'none';
            const icone = headerDiv.querySelector('.icone-expandir');
            
            if (isVisible) {
                notasContainerDiv.style.display = 'none';
                icone.style.transform = 'rotate(0deg)';
                headerDiv.style.background = 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)';
            } else {
                notasContainerDiv.style.display = 'block';
                icone.style.transform = 'rotate(180deg)';
                headerDiv.style.background = 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)';
            }
        });
        
        grupoDiv.appendChild(headerDiv);
        grupoDiv.appendChild(notasContainerDiv);
        notasList.appendChild(grupoDiv);
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