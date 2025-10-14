import { getTotalLançados } from "./utils/index.mjs";

let save_placa = document.getElementById('salve_placa');
let scan_btn = document.getElementById('scan_button');
let excel_btn = document.getElementById('excel_button');
var scan_div = document.getElementById('scan');
const action_div = document.getElementById('actions');
const button_back = document.querySelectorAll('.back')

var excel_div = document.getElementById('excel');


button_back.forEach(element => {
    element.addEventListener('click', () => {
        action_div.style.display = 'flex'
        excel_div.style.display = 'none'
        scan_div.style.display = 'none'


        document.getElementById('placa_div_scan').style.display = 'block'
        document.getElementById('placa_button_scan').style.display = 'block'
        document.getElementById('input_number_placa').style.display = 'none'
    })
});




scan_btn.addEventListener('click', () => {
    action_div.style.display = 'none'
    scan_div.style.display = 'flex'
})



excel_btn.addEventListener('click', () => {
    action_div.style.display = 'none'
    excel_div.style.display = 'flex'
})



save_placa.addEventListener('click', async () => {
    if (document.getElementById('placa').value.length <= 7 & document.getElementById('placa').value.length != '') {
        await getTotalLançados()
        document.getElementById('placa_div_scan').style.display = 'none'
        document.getElementById('placa_button_scan').style.display = 'none'
        document.getElementById('input_number_placa').style.display = 'block'

    } else {
        alert('placa invalida')
    }

})


window.addEventListener('beforeunload', function (event) {
    // Cancela o evento para mostrar uma mensagem de confirmação
    event.preventDefault();
    event.returnValue = ''; // Mostra um alerta padrão de confirmação do navegador
});