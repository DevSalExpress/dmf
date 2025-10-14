<?php

// URL do endpoint da API FastAPI
$api_url = 'http://127.0.0.1:5250/scans/batch';

// Captura os dados enviados pelo JavaScript via POST
$input_data = json_decode(file_get_contents('php://input'), true);

// Verifica se os dados foram enviados corretamente
if (!is_null($input_data) && isset($input_data['orders'])) {
    // Configuração da requisição cURL para enviar os dados para a API FastAPI
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($input_data));

    // Executa a requisição e captura a resposta
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE); // Captura o status HTTP

    // Verifica se houve erro na requisição
    if ($response === false || $http_code !== 200) {
        $error_msg = curl_error($ch);
        curl_close($ch);
        http_response_code(500);
        echo json_encode(['error' => "Erro ao se comunicar com a API: $error_msg", 'http_code' => $http_code]);
        exit;
    }

    // Fecha a conexão cURL
    curl_close($ch);

    // Envia a resposta de volta ao cliente que fez a requisição para o intermediário
    header('Content-Type: application/json');
    echo $response; // Resposta da API FastAPI
} else {
    // Caso os dados não tenham sido enviados corretamente, retorna um erro
    http_response_code(400);
    echo json_encode(['error' => 'Dados inválidos ou não encontrados.']);
}
