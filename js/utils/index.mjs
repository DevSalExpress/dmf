import { hideLoading, showLoading } from "../load/loadings.mjs";
import { alterValues } from "../index.mjs";
import { scanData } from "../index.mjs";
import { getData } from "./data.mjs";
import { dataDownloadJson } from "../index.mjs";

export function completarComZeros(numero) {
    return numero.toString().padStart(4, '0');
}



export async function getTotalLançados() {

    showLoading()
    var plateTptalget = document.getElementById('placa').value
    if (plateTptalget.toUpperCase().trim() == "") {
        hideLoading()
        return
    }
    let snapshotodd = JSON.parse(localStorage.getItem('placas'))
    dataDownloadJson.dataDownload = []
    scanData.totalforScan = 0
    scanData.complete = 0
    scanData.noComplete = 0
    document.getElementById('view_plate').innerText = plateTptalget.toUpperCase().trim()
    alterValues()
    try {

        let dayActually = getData()

        snapshotodd.forEach((document) => {

            // Se `document` já é um objeto com os dados, você pode acessar diretamente
            var data = document;  // Sem .data()

            // Acessa o primeiro item do objeto, assumindo que o formato é como no JSON fornecido
            var documentData = data[Object.keys(data)[0]];
            if (plateTptalget.toUpperCase().trim() == documentData.placa.toUpperCase().trim()) {
                // Condições baseadas nos dados
                if (documentData.scande) {
                    scanData.complete = scanData.complete + 1;
                } else if (documentData.scande == false) {
                    scanData.noComplete = scanData.noComplete + 1;
                }

                if (true) {
                    console.log(documentData.placa)

                    scanData.totalforScan = scanData.totalforScan + 1;
                    dataDownloadJson.dataDownload.push(documentData);
                    alterValues();
                }
            }

        });
        hideLoading()

    } catch (err) {
        console.log(err)
        hideLoading()
    }
}

export async function getTotalLançadosSuccess() {
    let snapshotodd = JSON.parse(localStorage.getItem('placas'))

    const setDatasSSW = [];

    const placa = document.getElementById('placa').value;
    const dayActually = getData();

    for (const document of snapshotodd) {
        // Se `document` já é um objeto com os dados, você pode acessar diretamente
        const data = document;  // Sem .data()

        // Acessa o primeiro item do objeto, assumindo que o formato é como no JSON fornecido
        const documentData = data[Object.keys(data)[0]];

        // Condições baseadas nos dados
        if (documentData.scande) {
            setDatasSSW.push(documentData);
        }
    }

    return setDatasSSW;
}



