import { hideLoading, showLoading } from "../loadings.mjs"
import { getTotalLançados, getTotalLançadosSuccess } from "../../utils/index.mjs"
import { updateResultsInBatch } from "../../salve/indexfile.mjs"

document.getElementById('lancar').addEventListener('click', () => {
    const confirm_set = 'sal@123'
    if (confirm_set == 'sal@123') {
        setEmails()
    } else {
        alertify.alert('Atenção', 'email incorreto.')
    }
})





const getData = () => {
    const hoje = new Date();

    const dia = hoje.getDate();
    const mes = hoje.getMonth() + 1; // Os meses são indexados de 0 a 11, então adicionamos 1
    const ano = hoje.getFullYear();

    return `${dia}/${mes}/${ano}`
}

const setEmails = async () => {
    showLoading()
    const seteds = await getTotalLançadosSuccess()

    console.log(seteds)
    let forSets = ''
    var forSets_ass = []
    if (seteds.length < 1) {
        alertify.alert('Atenção', 'Ops, parece que não a nada para lançar.')
        hideLoading()
        return
    }

    seteds.forEach(doc => {
        if (true) {
            forSets += `<h4> ${doc.order} - ${doc.placa} <h4>,`
            forSets_ass.push(`${doc.order} - ${doc.placa}`)
        }
    })

    var body_orders_set = {
        "orders": forSets_ass
    }


    const htmlEmail = `
        <h3> Foi Solictados que os seguintes dados sejam lançados no ssw. <h3>
        <br>
        ${forSets}
    `

    const api_url = "https://set-email-html-5xpu.vercel.app/upload";

    const formData = new FormData();
    formData.append('html_content', htmlEmail);
    formData.append('subject', `Projeto solistica teste (${getData()})`);
    formData.append('to_email', 'marcosmachadodev@gmail.com;');

    try {
        const response = await fetch(api_url, {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const responseText = await response.text();
            hideLoading()
            alertify.alert('Atenção', 'Dados enviados com sucesso.')
            await updateResultsInBatch()
            sendDataToPhpIntermediary(JSON.stringify(body_orders_set));
            // Chame sua função setEmailCliente() aqui, se necessário
        } else {
            console.error('Erro ao enviar o e-mail. Código de status:', response.status);
            const responseText = await response.text();
            console.error('Resposta:', responseText);
            hideLoading()
        }

    } catch (error) {
        console.error('Erro ao enviar o e-mail:', error);
        hideLoading()
    }
}

// Função para enviar os dados ao intermediador PHP
async function sendDataToPhpIntermediary(data) {

    try {
        const response = await fetch('intermediado_run_bot.php', { // Substitua pelo caminho real do seu intermediador PHP
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: data
        });

        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error('Erro na requisição: ' + response.statusText);
        }

        // Converte a resposta para JSON
        const responseData = await response.json();
        console.log('Resposta do intermediador PHP:', responseData);
    } catch (error) {
        console.error('Erro ao enviar os dados:', error);
    }
}
