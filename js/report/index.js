import { dataDownloadJson } from "../index.mjs";



var faltalancar = []
var excelElemetns = {}

document.getElementById('baixarexcel').addEventListener('click', () => {
    excelElemetns = {}
    var groupedData = dataDownloadJson.dataDownload.reduce((acc, item) => {
        if (!acc[item.numpedido]) {
            acc[item.numpedido] = [];
        }
        acc[item.numpedido].push(item);
        return acc;
    }, {});

    Object.keys(groupedData).forEach(numpedido => {
        groupedData[numpedido].forEach(doc => {
            if (!doc.scande) {
                if (!excelElemetns[doc.order]) {
                    excelElemetns[doc.order] = {
                        total: 0,
                        faltam_lancar: 0,
                        lancados: 0,
                        pedido: doc.numpedido,
                        volume_num: doc.orderActually,
                        placa: doc.placa,
                        unidade: doc.unidade,
                        cidade: doc.cidade,
                        remetente: doc.remetente,
                        destinatario: doc.destinatario,
                        nfe: doc.nfe
                    };
                }
            }
        });
    });

    function gerarExcel(data) {
        const ws = XLSX.utils.json_to_sheet([
            ["NFE", "N°Volume", "Codigo", "Placa", "Unidade", "Cidade", "Remetente"], // Cabeçalho
            ...Object.keys(data).map(numpedido => [
                data[numpedido].nfe,
                `Volume N° ${data[numpedido].volume_num}`,
                numpedido,
                data[numpedido].placa,
                data[numpedido].unidade,
                data[numpedido].cidade,
                data[numpedido].remetente,
            ])
        ]);

        // Define as larguras das colunas (em caracteres)
        ws['!cols'] = [
            { wch: 20 }, // Coluna "N°Pedido" - Ajuste conforme necessário
            { wch: 15 }, // Coluna "N°Volume" - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Codigo"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Placa"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Unidade"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Cidade"  - Ajuste conforme necessário
            { wch: 20 }, // Coluna "Remetente"  - Ajuste conforme necessário
            { wch: 20 }, // Coluna "Destinatario"  - Ajuste conforme necessário
            { wch: 15 }  // Coluna "NFE"  - Ajuste conforme necessário
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const dataHora = formatarDataHora();
        const nomeArquivo = `falta_scan_dataehoratual_${dataHora}.xlsx`;
        link.download = nomeArquivo;
        link.click();
    }

    gerarExcel(excelElemetns);
});



document.getElementById('escaneados').addEventListener('click', () => {
    excelElemetns = {}
    var groupedData = dataDownloadJson.dataDownload.reduce((acc, item) => {
        if (!acc[item.numpedido]) {
            acc[item.numpedido] = [];
        }
        acc[item.numpedido].push(item);
        return acc;
    }, {});

    Object.keys(groupedData).forEach(numpedido => {
        groupedData[numpedido].forEach(doc => {
            if (doc.scande == true) {
                if (!excelElemetns[doc.order]) {
                    excelElemetns[doc.order] = {
                        total: 0,
                        faltam_lancar: 0,
                        lancados: 0,
                        pedido: doc.numpedido,
                        volume_num: doc.orderActually,
                        placa: doc.placa,
                        unidade: doc.unidade,
                        cidade: doc.cidade,
                        remetente: doc.remetente,
                        destinatario: doc.destinatario,
                        nfe: doc.nfe
                    };
                }
            }
        });
    });

    function gerarExcel(data) {
        const ws = XLSX.utils.json_to_sheet([
            ["NFE", "N°Volume", "Codigo", "Placa", "Unidade", "Cidade", "Remetente"], // Cabeçalho
            ...Object.keys(data).map(numpedido => [
                data[numpedido].nfe,
                `Volume N° ${data[numpedido].volume_num}`,
                numpedido,
                data[numpedido].placa,
                data[numpedido].unidade,
                data[numpedido].cidade,
                data[numpedido].remetente,
            ])
        ]);

        // Define as larguras das colunas (em caracteres)
        ws['!cols'] = [
            { wch: 20 }, // Coluna "N°Pedido" - Ajuste conforme necessário
            { wch: 15 }, // Coluna "N°Volume" - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Codigo"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Placa"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Unidade"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Cidade"  - Ajuste conforme necessário
            { wch: 20 }, // Coluna "Remetente"  - Ajuste conforme necessário
            { wch: 20 }, // Coluna "Destinatario"  - Ajuste conforme necessário
            { wch: 15 }  // Coluna "NFE"  - Ajuste conforme necessário
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const dataHora = formatarDataHora();
        const nomeArquivo = `lancados_${dataHora}.xlsx`;
        link.download = nomeArquivo;
        link.click();
    }

    gerarExcel(excelElemetns);
});



document.getElementById('totalparaescan').addEventListener('click', () => {
    excelElemetns = {}
    var groupedData = dataDownloadJson.dataDownload.reduce((acc, item) => {
        if (!acc[item.numpedido]) {
            acc[item.numpedido] = [];
        }
        acc[item.numpedido].push(item);
        return acc;
    }, {});

    Object.keys(groupedData).forEach(numpedido => {
        groupedData[numpedido].forEach(doc => {

            if (!excelElemetns[doc.order]) {
                excelElemetns[doc.order] = {
                    total: 0,
                    faltam_lancar: 0,
                    lancados: 0,
                    pedido: doc.numpedido,
                    volume_num: doc.orderActually,
                    placa: doc.placa,
                    unidade: doc.unidade,
                    cidade: doc.cidade,
                    remetente: doc.remetente,
                    destinatario: doc.destinatario,
                    nfe: doc.nfe
                };

            }


        });
    });

    function gerarExcel(data) {
        const ws = XLSX.utils.json_to_sheet([
            ["NFE", "N°Volume", "Codigo", "Placa", "Unidade", "Cidade", "Remetente"], // Cabeçalho
            ...Object.keys(data).map(numpedido => [
                data[numpedido].nfe,
                `Volume N° ${data[numpedido].volume_num}`,
                numpedido,
                data[numpedido].placa,
                data[numpedido].unidade,
                data[numpedido].cidade,
                data[numpedido].remetente,
            ])
        ]);

        // Define as larguras das colunas (em caracteres)
        ws['!cols'] = [
            { wch: 20 }, // Coluna "N°Pedido" - Ajuste conforme necessário
            { wch: 15 }, // Coluna "N°Volume" - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Codigo"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Placa"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Unidade"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Cidade"  - Ajuste conforme necessário
            { wch: 20 }, // Coluna "Remetente"  - Ajuste conforme necessário
            { wch: 20 }, // Coluna "Destinatario"  - Ajuste conforme necessário
            { wch: 15 }  // Coluna "NFE"  - Ajuste conforme necessário
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const dataHora = formatarDataHora();
        const nomeArquivo = `todos_${dataHora}.xlsx`;
        link.download = nomeArquivo;
        link.click();
    }

    gerarExcel(excelElemetns);
});





document.getElementById('baixarexcelplaca').addEventListener('click', () => {
    var groupedData = dataDownloadJson.dataDownload.reduce((acc, item) => {
        if (!acc[item.numpedido]) {
            acc[item.numpedido] = [];
        }
        acc[item.numpedido].push(item);
        return acc;
    }, {});

    let placa = document.getElementById('placa').value

    Object.keys(groupedData).forEach(numpedido => {
        groupedData[numpedido].forEach(doc => {
            if (doc.scande == true & doc.placa == placa) {
                if (!excelElemetns[doc.order]) {
                    excelElemetns[doc.order] = {
                        total: 0,
                        faltam_lancar: 0,
                        lancados: 0,
                        pedido: doc.numpedido,
                        volume_num: doc.orderActually,
                        placa: doc.placa,
                        unidade: doc.unidade,
                        cidade: doc.cidade,
                        remetente: doc.remetente,
                        destinatario: doc.destinatario,
                        nfe: doc.nfe
                    };
                }
            }
        });
    });

    function gerarExcel(data) {
        const ws = XLSX.utils.json_to_sheet([
            ["N°Pedido", "N°Volume", "Codigo", "Placa", "Unidade", "Cidade", "Remetente", "Destinatario", "NFE"], // Cabeçalho
            ...Object.keys(data).map(numpedido => [
                data[numpedido].pedido,
                `Volume N° ${data[numpedido].volume_num}`,
                numpedido,
                data[numpedido].placa,
                data[numpedido].unidade,
                data[numpedido].cidade,
                data[numpedido].remetente,
                data[numpedido].destinatario,
                data[numpedido].nfe
            ])
        ]);

        // Define as larguras das colunas (em caracteres)
        ws['!cols'] = [
            { wch: 20 }, // Coluna "N°Pedido" - Ajuste conforme necessário
            { wch: 15 }, // Coluna "N°Volume" - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Codigo"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Placa"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Unidade"  - Ajuste conforme necessário
            { wch: 15 }, // Coluna "Cidade"  - Ajuste conforme necessário
            { wch: 20 }, // Coluna "Remetente"  - Ajuste conforme necessário
            { wch: 20 }, // Coluna "Destinatario"  - Ajuste conforme necessário
            { wch: 15 }  // Coluna "NFE"  - Ajuste conforme necessário
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `placa-${placa}.xlsx`;
        link.click();
    }

    gerarExcel(excelElemetns);
});
// Função para formatar a data e a hora
function formatarDataHora() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0'); // Meses começam do zero
    const dia = String(agora.getDate()).padStart(2, '0');
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const segundos = String(agora.getSeconds()).padStart(2, '0');

    return `${ano}-${mes}-${dia} ${horas}-${minutos}-${segundos}`;
}