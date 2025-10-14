<?php
// Configurar o cabeçalho para que o PHP possa lidar com JSON
header('Content-Type: application/json');

// Verificar se o arquivo foi enviado
if (!isset($_FILES['file'])) {
    echo json_encode(['error' => 'Nenhum arquivo enviado.']);
    exit;
}

// Configurar o URL do serviço backend
$backendUrl = 'http://127.0.0.1:5250/upload-excel/';

// Inicializar cURL
$ch = curl_init();

// Configurar as opções do cURL
curl_setopt($ch, CURLOPT_URL, $backendUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// Adicionar o arquivo ao POST
curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'file' => new CURLFile($_FILES['file']['tmp_name'], $_FILES['file']['type'], $_FILES['file']['name'])
]);

// Executar a solicitação
$response = curl_exec($ch);

// Verificar se ocorreu algum erro
if (curl_errno($ch)) {
    echo json_encode(['error' => 'Erro ao comunicar com o backend: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

// Fechar o cURL
curl_close($ch);

// Retornar a resposta do backend
echo $response;
