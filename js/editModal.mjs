// js/editModal.mjs
import { getFirestore, collection, getDocs, query, where, writeBatch, doc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { app } from "../index.mjs";
import { showLoading, hideLoading } from "./loadings.mjs";

export function setupEditModal() {
    const editButton = document.getElementById('alterNf');
    const modal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const saveChanges = document.getElementById('saveChanges');
    const notesContainer = document.getElementById('notesContainer');
    const modalPlaca = document.getElementById('modalPlaca');
    
    let currentPlaca = '';
    let notesData = [];
    
    // Abrir modal quando clicar no botão de edição
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
    
    // Fechar modal
    const closeModalFunc = () => {
        modal.classList.add('hidden');
        notesContainer.innerHTML = '';
    };
    
    closeModal.addEventListener('click', closeModalFunc);
    cancelEdit.addEventListener('click', closeModalFunc);
    
    // Carregar notas para a placa
    async function loadNotesForPlaca(placa) {
        showLoading();
        notesContainer.innerHTML = '';
        
        try {
            // Carrega do localStorage
            const localData = JSON.parse(localStorage.getItem('placas')) || [];
            notesData = localData.filter(item => {
                const key = Object.keys(item)[0];
                return item[key].placa === placa;
            });
            
            if (notesData.length === 0) {
                notesContainer.innerHTML = '<p class="text-gray-400">Nenhuma nota fiscal encontrada para esta placa.</p>';
                return;
            }
            
            // Ordena por número da NF
            notesData.sort((a, b) => {
                const aKey = Object.keys(a)[0];
                const bKey = Object.keys(b)[0];
                return a[aKey].nfe.localeCompare(b[bKey].nfe);
            });
            
            // Renderiza cada nota
            notesData.forEach(item => {
                const key = Object.keys(item)[0];
                const note = item[key];
                
                const noteCard = document.createElement('div');
                noteCard.className = 'note-card';
                noteCard.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-medium">NF: ${note.nfe || '--'}</h4>
                            <p class="text-sm text-gray-400">Pedido: ${note.numpedido || '--'}</p>
                        </div>
                        <div class="delete-btn" data-order="${key}">
                            <span class="material-symbols-outlined text-sm">delete</span>
                            <span class="text-sm">Excluir</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="quantity-control">
                            <button class="quantity-btn minus" data-order="${key}">-</button>
                            <input type="number" class="quantity-input" value="1" min="1" data-order="${key}">
                            <button class="quantity-btn plus" data-order="${key}">+</button>
                            <span class="text-sm ml-2">volumes</span>
                        </div>
                        <span class="text-sm ${note.scande ? 'text-green-500' : 'text-yellow-500'}">
                            ${note.scande ? 'Escaneado' : 'Pendente'}
                        </span>
                    </div>
                `;
                
                notesContainer.appendChild(noteCard);
            });
            
            // Adiciona eventos aos botões de quantidade
            document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const order = e.target.getAttribute('data-order');
                    const input = document.querySelector(`.quantity-input[data-order="${order}"]`);
                    if (parseInt(input.value) > 1) {
                        input.value = parseInt(input.value) - 1;
                    }
                });
            });
            
            document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const order = e.target.getAttribute('data-order');
                    const input = document.querySelector(`.quantity-input[data-order="${order}"]`);
                    input.value = parseInt(input.value) + 1;
                });
            });
            
            // Adiciona eventos aos botões de deletar
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const order = e.currentTarget.getAttribute('data-order');
                    const note = notesData.find(item => Object.keys(item)[0] === order);
                    const nfe = note[order].nfe || 'esta nota';
                    
                    alertify.confirm('Confirmar Exclusão', 
                        `Tem certeza que deseja excluir a nota ${nfe}?`,
                        async () => {
                            // Remove do localStorage
                            const localData = JSON.parse(localStorage.getItem('placas')) || [];
                            const updatedData = localData.filter(item => Object.keys(item)[0] !== order);
                            localStorage.setItem('placas', JSON.stringify(updatedData));
                            
                            // Remove do Firestore (se aplicável)
                            try {
                                const db = getFirestore(app);
                                const q = query(collection(db, "scans"), where("order", "==", order));
                                const querySnapshot = await getDocs(q);
                                
                                const batch = writeBatch(db);
                                querySnapshot.forEach((docSnap) => {
                                    batch.delete(doc(db, "scans", docSnap.id));
                                });
                                await batch.commit();
                            } catch (error) {
                                console.error("Erro ao deletar do Firestore:", error);
                            }
                            
                            // Recarrega as notas
                            await loadNotesForPlaca(currentPlaca);
                            alertify.success('Nota excluída com sucesso!');
                        },
                        () => {}
                    );
                });
            });
            
        } catch (error) {
            console.error("Erro ao carregar notas:", error);
            alertify.error('Erro ao carregar notas fiscais');
        } finally {
            hideLoading();
        }
    }
    
    // Salvar alterações
    saveChanges.addEventListener('click', async () => {
        showLoading();
        
        try {
            // Atualiza quantidades no localStorage
            const localData = JSON.parse(localStorage.getItem('placas')) || [];
            const updatedData = [...localData];
            
            // Atualiza cada nota com a nova quantidade
            document.querySelectorAll('.quantity-input').forEach(input => {
                const order = input.getAttribute('data-order');
                const newQuantity = parseInt(input.value);
                
                const index = updatedData.findIndex(item => Object.keys(item)[0] === order);
                if (index !== -1) {
                    const key = Object.keys(updatedData[index])[0];
                    updatedData[index][key].totalNum = newQuantity;
                }
            });
            
            localStorage.setItem('placas', JSON.stringify(updatedData));
            
            // Sincroniza com o Firestore
            const db = getFirestore(app);
            const batch = writeBatch(db);
            
            for (const item of updatedData) {
                const key = Object.keys(item)[0];
                const note = item[key];
                
                const q = query(collection(db, "scans"), where("order", "==", key), where("placa", "==", currentPlaca));
                const querySnapshot = await getDocs(q);
                
                querySnapshot.forEach((docSnap) => {
                    const docRef = doc(db, "scans", docSnap.id);
                    batch.update(docRef, {
                        totalNum: note.totalNum
                    });
                });
            }
            
            await batch.commit();
            alertify.success('Alterações salvas com sucesso!');
            closeModalFunc();
            
            // Atualiza a exibição na tela principal
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            
        } catch (error) {
            console.error("Erro ao salvar alterações:", error);
            alertify.error('Erro ao salvar alterações');
        } finally {
            hideLoading();
        }
    });
}